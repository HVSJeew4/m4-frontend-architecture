// The mock REST API. The app calls it with real fetch requests; MSW answers them in the browser
// (service worker), in tests (Node) and in Storybook – so app code is the same as with a real API.
import { delay, http, HttpResponse, type HttpResponseResolver } from 'msw';
import type { ApiErrorBody, AuthResponse, Paginated } from '@/types/api';
import type { Activity, ActivityType, MetricsSummary, TrendRange } from '@/types/dashboard';
import { TREND_RANGES } from '@/types/dashboard';
import type { AppNotification, NotificationLevel, NotificationList } from '@/types/notification';
import type { User, UserInput, UserSortField } from '@/types/user';
import { ROLES } from '@/types/user';
import { mockConfig, shouldFail, type MockGroup } from './config';
import { getDb, randomId, saveDb } from './db';

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PAGE_SIZE = 100;
const SORT_FIELDS: readonly UserSortField[] = ['name', 'email', 'role', 'isActive', 'createdAt'];

const error = (status: number, message: string, fieldErrors?: Record<string, string>) =>
  HttpResponse.json<ApiErrorBody>({ message, ...(fieldErrors && { fieldErrors }) }, { status });

/** Wraps a resolver with the configured latency and forced failures for its group. */
function route(group: MockGroup, resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    await delay(mockConfig.latencyMs);
    if (shouldFail(group)) return error(500, 'Simulated server error');
    return resolver(info);
  };
}

/** The signed-in user for a request, or null when the bearer token is missing or unknown. */
function currentUser(request: Request): User | null {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
  const userId = token ? getDb().sessions[token] : undefined;
  return getDb().users.find((u) => u.id === userId && !u.deletedAt) ?? null;
}

/** Same as `route`, and answers 401 unless the request carries a valid session token. */
function authed(
  group: MockGroup,
  resolver: (
    info: Parameters<HttpResponseResolver>[0],
    me: User,
  ) => ReturnType<HttpResponseResolver>,
): HttpResponseResolver {
  return route(group, (info) => {
    const me = currentUser(info.request);
    return me ? resolver(info, me) : error(401, 'Your session has expired. Please sign in again.');
  });
}

function logActivity(type: ActivityType, actor: User, message: string): void {
  const entry: Activity = {
    id: randomId('a'),
    type,
    actor: actor.name,
    message,
    createdAt: new Date().toISOString(),
  };
  getDb().activity.unshift(entry);
}

function notify(level: NotificationLevel, title: string, message: string): void {
  const entry: AppNotification = {
    id: randomId('n'),
    level,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  getDb().notifications.unshift(entry);
}

/** Server-side checks for create (all fields) and update (only the fields sent). */
function validateUserInput(
  body: unknown,
  { partial, ignoreId }: { partial: boolean; ignoreId?: string },
): { data: Partial<UserInput> } | { fieldErrors: Record<string, string> } {
  const input = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  const data: Partial<UserInput> = {};
  const has = (key: string) => key in input || !partial;

  if (has('name')) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2) {
      fieldErrors.name = 'Name must be at least 2 characters';
    } else data.name = input.name.trim();
  }
  if (has('email')) {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = 'Invalid email address';
    else if (getDb().users.some((u) => u.email === email && !u.deletedAt && u.id !== ignoreId)) {
      fieldErrors.email = 'A user with this email already exists';
    } else data.email = email;
  }
  if (has('role')) {
    if (!(ROLES as readonly unknown[]).includes(input.role)) fieldErrors.role = 'Invalid role';
    else data.role = input.role as UserInput['role'];
  }
  if (has('isActive')) {
    if (typeof input.isActive !== 'boolean')
      fieldErrors.isActive = 'isActive must be true or false';
    else data.isActive = input.isActive;
  }
  return Object.keys(fieldErrors).length ? { fieldErrors } : { data };
}

const readJson = (request: Request): Promise<unknown> => request.json().catch(() => null);

const sumLast = (
  days: number,
  skip: number,
  pick: (p: { orders: number; revenueCents: number }) => number,
) =>
  getDb()
    .trend.slice(-(days + skip), skip ? -skip : undefined)
    .reduce((total, point) => total + pick(point), 0);

export const handlers = [
  // ---- auth ----------------------------------------------------------------------------------
  http.post(
    '/api/auth/login',
    route('auth', async ({ request }) => {
      const body = (await readJson(request)) as { email?: unknown; password?: unknown } | null;
      const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = typeof body?.password === 'string' ? body.password : '';
      const user = getDb().users.find((u) => u.email === email && !u.deletedAt);
      // Demo login: any registered email with a password of 8+ characters. No passwords are stored.
      if (!user || password.length < MIN_PASSWORD_LENGTH) {
        return error(401, 'Invalid email or password');
      }
      if (!user.isActive) return error(403, 'This account is deactivated');
      if (user.role === 'user') return error(403, 'This account does not have admin access');

      const token = randomId('t');
      getDb().sessions[token] = user.id;
      logActivity('auth.login', user, 'signed in');
      saveDb();
      return HttpResponse.json<AuthResponse>({ user, token });
    }),
  ),

  http.post(
    '/api/auth/logout',
    route('auth', ({ request }) => {
      const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
      if (token) delete getDb().sessions[token];
      saveDb();
      return new HttpResponse(null, { status: 204 });
    }),
  ),

  http.get(
    '/api/auth/me',
    authed('auth', (_info, me) => HttpResponse.json<User>(me)),
  ),

  // ---- users ---------------------------------------------------------------------------------
  http.get(
    '/api/users',
    authed('users', ({ request }) => {
      const params = new URL(request.url).searchParams;
      const page = Math.max(1, Number(params.get('page')) || 1);
      const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get('pageSize')) || 10));
      const sortBy = (SORT_FIELDS as readonly string[]).includes(params.get('sortBy') ?? '')
        ? (params.get('sortBy') as UserSortField)
        : 'createdAt';
      const direction = params.get('sortOrder') === 'asc' ? 1 : -1;
      const search = params.get('search')?.trim().toLowerCase();
      const role = params.get('role');
      const status = params.get('status');

      const matches = getDb()
        .users.filter((u) => !u.deletedAt)
        .filter((u) => !search || u.name.toLowerCase().includes(search) || u.email.includes(search))
        .filter((u) => !role || u.role === role)
        .filter((u) => !status || u.isActive === (status === 'active'))
        .sort((a, b) => {
          const x = a[sortBy];
          const y = b[sortBy];
          const order =
            typeof x === 'string' ? x.localeCompare(y as string) : Number(x) - Number(y);
          // Tie-break on id so pages never overlap or skip rows.
          return order * direction || a.id.localeCompare(b.id);
        });

      const start = (page - 1) * pageSize;
      return HttpResponse.json<Paginated<User>>({
        items: matches.slice(start, start + pageSize),
        page,
        pageSize,
        total: matches.length,
        totalPages: Math.max(1, Math.ceil(matches.length / pageSize)),
      });
    }),
  ),

  http.get(
    '/api/users/:id',
    authed('users', ({ params }) => {
      const user = getDb().users.find((u) => u.id === params.id && !u.deletedAt);
      return user ? HttpResponse.json<User>(user) : error(404, 'User not found');
    }),
  ),

  http.post(
    '/api/users',
    authed('users', async ({ request }, me) => {
      const result = validateUserInput(await readJson(request), { partial: false });
      if ('fieldErrors' in result) return validationError(result.fieldErrors);
      const now = new Date().toISOString();
      const user: User = {
        ...(result.data as UserInput),
        id: randomId('u'),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      getDb().users.push(user);
      logActivity('user.created', me, `created user ${user.name}`);
      notify('success', 'User created', `${me.name} created ${user.name}.`);
      saveDb();
      return HttpResponse.json<User>(user, { status: 201 });
    }),
  ),

  http.patch(
    '/api/users/:id',
    authed('users', async ({ request, params }, me) => {
      const user = getDb().users.find((u) => u.id === params.id && !u.deletedAt);
      if (!user) return error(404, 'User not found');
      const result = validateUserInput(await readJson(request), {
        partial: true,
        ignoreId: user.id,
      });
      if ('fieldErrors' in result) return validationError(result.fieldErrors);
      Object.assign(user, result.data, { updatedAt: new Date().toISOString() });
      logActivity('user.updated', me, `updated ${user.name}`);
      saveDb();
      return HttpResponse.json<User>(user);
    }),
  ),

  // Soft delete: the row stays (so it can be restored) but is hidden from every list.
  http.delete(
    '/api/users/:id',
    authed('users', ({ params }, me) => {
      const user = getDb().users.find((u) => u.id === params.id && !u.deletedAt);
      if (!user) return error(404, 'User not found');
      if (user.id === me.id) return error(400, 'You cannot delete your own account');
      user.deletedAt = new Date().toISOString();
      logActivity('user.deleted', me, `deleted user ${user.name}`);
      saveDb();
      return HttpResponse.json<User>(user);
    }),
  ),

  http.post(
    '/api/users/:id/restore',
    authed('users', ({ params }, me) => {
      const user = getDb().users.find((u) => u.id === params.id && u.deletedAt);
      if (!user) return error(404, 'User not found');
      if (getDb().users.some((u) => u.email === user.email && !u.deletedAt)) {
        return error(409, 'Another user now has this email address');
      }
      user.deletedAt = null;
      logActivity('user.restored', me, `restored user ${user.name}`);
      saveDb();
      return HttpResponse.json<User>(user);
    }),
  ),

  // ---- dashboard -----------------------------------------------------------------------------
  http.get(
    '/api/metrics/summary',
    authed('metrics', () => {
      const users = getDb().users.filter((u) => !u.deletedAt);
      const monthAgo = Date.now() - 30 * DAY_MS;
      return HttpResponse.json<MetricsSummary>({
        users: {
          value: users.length,
          previous: users.filter((u) => Date.parse(u.createdAt) < monthAgo).length,
        },
        revenueCents: {
          value: sumLast(30, 0, (p) => p.revenueCents),
          previous: sumLast(30, 30, (p) => p.revenueCents),
        },
        orders: {
          value: sumLast(30, 0, (p) => p.orders),
          previous: sumLast(30, 30, (p) => p.orders),
        },
      });
    }),
  ),

  http.get(
    '/api/metrics/trend',
    authed('metrics', ({ request }) => {
      const days = Number(new URL(request.url).searchParams.get('days') ?? 30);
      if (!(TREND_RANGES as readonly number[]).includes(days)) {
        return error(400, `days must be one of ${TREND_RANGES.join(', ')}`);
      }
      return HttpResponse.json(getDb().trend.slice(-(days as TrendRange)));
    }),
  ),

  http.get(
    '/api/activity',
    authed('activity', ({ request }) => {
      const limit = Math.min(
        50,
        Math.max(1, Number(new URL(request.url).searchParams.get('limit')) || 10),
      );
      return HttpResponse.json<Activity[]>(getDb().activity.slice(0, limit));
    }),
  ),

  // ---- notifications -------------------------------------------------------------------------
  http.get(
    '/api/notifications',
    authed('notifications', () => HttpResponse.json<NotificationList>(notificationList())),
  ),

  http.post(
    '/api/notifications/read-all',
    authed('notifications', () => {
      for (const n of getDb().notifications) n.read = true;
      saveDb();
      return HttpResponse.json<NotificationList>(notificationList());
    }),
  ),

  http.patch(
    '/api/notifications/:id',
    authed('notifications', async ({ request, params }) => {
      const notification = getDb().notifications.find((n) => n.id === params.id);
      if (!notification) return error(404, 'Notification not found');
      const body = (await readJson(request)) as { read?: unknown } | null;
      if (typeof body?.read !== 'boolean')
        return validationError({ read: 'read must be true or false' });
      notification.read = body.read;
      saveDb();
      return HttpResponse.json<AppNotification>(notification);
    }),
  ),
];

function notificationList(): NotificationList {
  const items = getDb().notifications;
  return { items, unreadCount: items.filter((n) => !n.read).length };
}

/** 409 when the only problem is a duplicate email, otherwise 400. */
function validationError(fieldErrors: Record<string, string>) {
  const conflictOnly =
    Object.keys(fieldErrors).length === 1 && fieldErrors.email?.includes('already exists');
  return error(
    conflictOnly ? 409 : 400,
    conflictOnly ? 'Email already in use' : 'Validation failed',
    fieldErrors,
  );
}
