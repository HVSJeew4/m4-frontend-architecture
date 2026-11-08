import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthResponse, Paginated } from '@/types/api';
import type { MetricsSummary, TrendPoint } from '@/types/dashboard';
import type { NotificationList } from '@/types/notification';
import type { User } from '@/types/user';
import { mockConfig } from './config';
import { DEMO_ACCOUNTS } from './data/seed';
import { getDb } from './db';

const PASSWORD = 'any-password'; // the mock accepts any 8+ character password

async function api(path: string, init: RequestInit & { token?: string; json?: unknown } = {}) {
  const { token, json, ...rest } = init;
  const headers = new Headers(rest.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  return fetch(new URL(path, window.location.origin), {
    ...rest,
    headers,
    body: json === undefined ? rest.body : JSON.stringify(json),
  });
}

async function login(email: string = DEMO_ACCOUNTS[0].email): Promise<string> {
  const res = await api('/api/auth/login', { method: 'POST', json: { email, password: PASSWORD } });
  return ((await res.json()) as AuthResponse).token;
}

describe('mock API – auth', () => {
  it('logs in a demo admin and returns the user and a token', async () => {
    const res = await api('/api/auth/login', {
      method: 'POST',
      json: { email: 'ADMIN@adminflow.test ', password: PASSWORD },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResponse;
    expect(body.user.email).toBe('admin@adminflow.test');
    expect(body.token).toMatch(/^t[0-9a-f]{24}$/);
  });

  it.each([
    ['unknown email', 'nobody@adminflow.test', PASSWORD, 401],
    ['password shorter than 8', 'admin@adminflow.test', 'short', 401],
    ['account with the plain "user" role', 'user@adminflow.test', PASSWORD, 403],
  ])('rejects %s', async (_case, email, password, status) => {
    const res = await api('/api/auth/login', { method: 'POST', json: { email, password } });
    expect(res.status).toBe(status);
    expect(await res.json()).toHaveProperty('message');
  });

  it('rejects a deactivated account with 403', async () => {
    getDb().users[1]!.isActive = false;
    const res = await api('/api/auth/login', {
      method: 'POST',
      json: { email: 'editor@adminflow.test', password: PASSWORD },
    });
    expect(res.status).toBe(403);
  });

  it('answers 401 without a token, and after logout', async () => {
    expect((await api('/api/auth/me')).status).toBe(401);
    const token = await login();
    expect((await api('/api/auth/me', { token })).status).toBe(200);
    expect((await api('/api/auth/logout', { method: 'POST', token })).status).toBe(204);
    expect((await api('/api/auth/me', { token })).status).toBe(401);
  });
});

describe('mock API – users', () => {
  let token: string;
  beforeEach(async () => {
    token = await login();
  });

  const list = async (query: string) =>
    (await (await api(`/api/users?${query}`, { token })).json()) as Paginated<User>;

  it('paginates 250 seeded users without overlap', async () => {
    const page1 = await list('page=1&pageSize=10&sortBy=name&sortOrder=asc');
    const page2 = await list('page=2&pageSize=10&sortBy=name&sortOrder=asc');
    expect(page1).toMatchObject({ page: 1, pageSize: 10, total: 250, totalPages: 25 });
    expect(page1.items).toHaveLength(10);
    const ids = new Set([...page1.items, ...page2.items].map((u) => u.id));
    expect(ids.size).toBe(20);
  });

  it('caps the page size at 100', async () => {
    expect((await list('pageSize=5000')).items).toHaveLength(100);
  });

  it('sorts by the requested field and direction', async () => {
    const asc = (await list('pageSize=100&sortBy=email&sortOrder=asc')).items.map((u) => u.email);
    expect(asc).toEqual([...asc].sort((a, b) => a.localeCompare(b)));
    const desc = (await list('pageSize=100&sortBy=email&sortOrder=desc')).items.map((u) => u.email);
    expect(desc[0]! >= desc[1]!).toBe(true);
  });

  it('filters by role and status, and searches name or email case-insensitively', async () => {
    const editors = await list('role=editor&status=active&pageSize=100');
    expect(editors.total).toBeGreaterThan(0);
    expect(editors.items.every((u) => u.role === 'editor' && u.isActive)).toBe(true);

    const search = await list('search=EDEN%20ED');
    expect(search.items.map((u) => u.email)).toContain('editor@adminflow.test');
  });

  it('creates a user, and rejects invalid input (400) and duplicate emails (409)', async () => {
    const created = await api('/api/users', {
      method: 'POST',
      token,
      json: { name: 'New Person', email: 'new@example.com', role: 'editor', isActive: true },
    });
    expect(created.status).toBe(201);
    expect(((await created.json()) as User).id).toMatch(/^u/);

    const invalid = await api('/api/users', {
      method: 'POST',
      token,
      json: { name: 'N', email: 'not-an-email', role: 'owner' },
    });
    expect(invalid.status).toBe(400);
    expect((await invalid.json()).fieldErrors).toEqual({
      name: expect.any(String),
      email: 'Invalid email address',
      role: 'Invalid role',
      isActive: expect.any(String),
    });

    const duplicate = await api('/api/users', {
      method: 'POST',
      token,
      json: { name: 'Copy', email: 'new@example.com', role: 'user', isActive: true },
    });
    expect(duplicate.status).toBe(409);
  });

  it('updates only the fields sent, and keeps the user’s own email valid', async () => {
    const res = await api('/api/users/u2', {
      method: 'PATCH',
      token,
      json: { role: 'admin', email: 'editor@adminflow.test' },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: 'u2', role: 'admin', name: 'Eden Editor' });
  });

  it('soft-deletes a user (hidden, still stored) and restores it', async () => {
    const del = await api('/api/users/u2', { method: 'DELETE', token });
    expect(del.status).toBe(200);
    expect((await list('pageSize=100&search=eden')).total).toBe(0);
    expect((await api('/api/users/u2', { token })).status).toBe(404);
    expect(getDb().users.find((u) => u.id === 'u2')?.deletedAt).not.toBeNull();

    const restore = await api('/api/users/u2/restore', { method: 'POST', token });
    expect(restore.status).toBe(200);
    expect((await list('search=eden')).total).toBe(1);
  });

  it('does not let an admin delete their own account', async () => {
    expect((await api('/api/users/u1', { method: 'DELETE', token })).status).toBe(400);
  });

  it('records activity and a notification when a user is created', async () => {
    await api('/api/users', {
      method: 'POST',
      token,
      json: { name: 'Logged Person', email: 'logged@example.com', role: 'user', isActive: false },
    });
    expect(getDb().activity[0]?.message).toBe('created user Logged Person');
    expect(getDb().notifications[0]).toMatchObject({ title: 'User created', read: false });
  });
});

describe('mock API – dashboard and notifications', () => {
  let token: string;
  beforeEach(async () => {
    token = await login();
  });

  it('returns metric totals for this and the previous 30 days', async () => {
    const summary = (await (await api('/api/metrics/summary', { token })).json()) as MetricsSummary;
    expect(summary.users.value).toBe(250);
    expect(summary.orders.value).toBeGreaterThan(0);
    expect(summary.revenueCents.previous).toBeGreaterThan(0);
  });

  it('returns the requested trend range, and 400 for other ranges', async () => {
    const week = (await (await api('/api/metrics/trend?days=7', { token })).json()) as TrendPoint[];
    expect(week).toHaveLength(7);
    expect(week[6]!.date).toBe(new Date().toISOString().slice(0, 10));
    expect((await api('/api/metrics/trend?days=12', { token })).status).toBe(400);
  });

  it('marks one notification, then all, as read', async () => {
    const before = (await (await api('/api/notifications', { token })).json()) as NotificationList;
    expect(before.unreadCount).toBe(3);

    await api(`/api/notifications/${before.items[0]!.id}`, {
      method: 'PATCH',
      token,
      json: { read: true },
    });
    const one = (await (await api('/api/notifications', { token })).json()) as NotificationList;
    expect(one.unreadCount).toBe(2);

    const all = await api('/api/notifications/read-all', { method: 'POST', token });
    expect(((await all.json()) as NotificationList).unreadCount).toBe(0);
  });
});

describe('mock API – forced failures', () => {
  it('answers 500 for a failing group and leaves other groups working', async () => {
    const token = await login();
    mockConfig.fail.add('metrics');
    expect((await api('/api/metrics/summary', { token })).status).toBe(500);
    expect((await api('/api/users', { token })).status).toBe(200);
  });
});
