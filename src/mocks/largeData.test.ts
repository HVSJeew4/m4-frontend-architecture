import { describe, expect, it } from 'vitest';
import type { AuthResponse, Paginated } from '@/types/api';
import type { User } from '@/types/user';
import { configureFromSearch, mockConfig } from './config';
import { createSeed } from './data/seed';
import { resetDb } from './db';

async function login() {
  const res = await fetch(new URL('/api/auth/login', window.location.origin), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@adminflow.test', password: 'long-enough' }),
  });
  return ((await res.json()) as AuthResponse).token;
}

describe('mock API – large data sets for the virtual list', () => {
  it('?mock-users=N sets how many users the seed creates (default 250, max 20,000)', () => {
    expect(configureFromSearch('?mock-users=10000').userCount).toBe(10_000);
    expect(configureFromSearch('?mock-users=999999').userCount).toBe(20_000);
    expect(configureFromSearch('?mock-users=abc').userCount).toBeUndefined();
    expect(createSeed(Date.now(), 1_000).users).toHaveLength(1_000);
    expect(createSeed().users).toHaveLength(250);
  });

  it('GET /api/users?all=1 returns every matching user, sorted and filtered, in one response', async () => {
    resetDb(5_000);
    mockConfig.latencyMs = 0;
    const token = await login();
    const res = await fetch(
      new URL('/api/users?all=1&sortBy=name&sortOrder=asc&status=active', window.location.origin),
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const body = (await res.json()) as Paginated<User>;
    expect(body.items.length).toBe(body.total);
    expect(body.total).toBeGreaterThan(3_000);
    expect(body.items.every((u) => u.isActive)).toBe(true);
    const names = body.items.slice(0, 50).map((u) => u.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});
