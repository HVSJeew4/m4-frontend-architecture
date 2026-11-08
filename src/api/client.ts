import type { ApiErrorBody } from '@/types/api';

/** A non-2xx API response. `fieldErrors` holds per-field messages for 400/409. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, body: Partial<ApiErrorBody> | null) {
    super(body?.message ?? `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = body?.fieldErrors ?? {};
  }

  /** True when the server named specific fields – forms show those on the fields, not in an alert. */
  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

// Set by the auth store (see stores/authStore.ts). Passed in rather than imported, because the
// store itself uses this client to sign in – importing it here would be a circular dependency.
const auth = {
  getToken: (): string | null => null,
  onUnauthorized: (): void => {},
};

export function configureApiAuth(options: typeof auth): void {
  Object.assign(auth, options);
}

// Requests wait for this before going out. In the browser it is the mock API (MSW) starting,
// so the first render does not have to wait for it – only the data does.
let ready: Promise<unknown> = Promise.resolve();

export function setApiReady(promise: Promise<unknown>): void {
  ready = promise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Use this token instead of the current one (logout: the store has cleared it by then). */
  token?: string;
}

export async function apiFetch<T>(
  path: string,
  { method = 'GET', body, signal, token: explicitToken }: RequestOptions = {},
): Promise<T> {
  await ready;
  const token = explicitToken ?? auth.getToken();
  const headers = new Headers({ Accept: 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');

  // An absolute URL, because fetch in Node (tests) cannot resolve relative paths.
  const response = await fetch(new URL(path, window.location.origin), {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Only a request that carried a token can mean "session expired"; a failed login is just 401.
    if (response.status === 401 && token) auth.onUnauthorized();
    throw new ApiError(response.status, data as Partial<ApiErrorBody> | null);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
