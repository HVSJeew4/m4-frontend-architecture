// Knobs for the mock API, so loading and error states can be seen on demand:
//   ?mock-latency=1500        slower responses (ms)
//   ?mock-fail=users,metrics  those endpoint groups answer 500 ("all" = every group)
//   ?mock-reset               back to the seed data
//   ?mock-users=10000         new seed data with that many users (max 20,000), for the virtual list
export const MAX_MOCK_USERS = 20_000;
export const MOCK_GROUPS = ['auth', 'users', 'metrics', 'activity', 'notifications'] as const;
export type MockGroup = (typeof MOCK_GROUPS)[number];

export const mockConfig = {
  latencyMs: 400,
  fail: new Set<MockGroup | 'all'>(),
};

export function configureFromSearch(search: string): { reset: boolean; userCount?: number } {
  const params = new URLSearchParams(search);
  const latency = Number(params.get('mock-latency'));
  if (params.has('mock-latency') && Number.isFinite(latency) && latency >= 0) {
    mockConfig.latencyMs = latency;
  }
  for (const group of (params.get('mock-fail') ?? '').split(',')) {
    if (group === 'all' || (MOCK_GROUPS as readonly string[]).includes(group)) {
      mockConfig.fail.add(group as MockGroup | 'all');
    }
  }
  const users = Number(params.get('mock-users'));
  const userCount =
    params.has('mock-users') && Number.isInteger(users) && users > 0
      ? Math.min(users, MAX_MOCK_USERS)
      : undefined;
  return { reset: params.has('mock-reset'), userCount };
}

export function shouldFail(group: MockGroup): boolean {
  return mockConfig.fail.has(group) || mockConfig.fail.has('all');
}
