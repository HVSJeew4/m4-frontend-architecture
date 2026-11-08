import { describe, expect, it } from 'vitest';
import { configureFromSearch, mockConfig, shouldFail } from './config';

describe('mock config from the URL', () => {
  it('reads latency, failing groups and reset', () => {
    const { reset } = configureFromSearch('?mock-latency=1500&mock-fail=users,bogus&mock-reset');
    expect(mockConfig.latencyMs).toBe(1500);
    expect(shouldFail('users')).toBe(true);
    expect(shouldFail('metrics')).toBe(false);
    expect(mockConfig.fail.has('bogus' as never)).toBe(false);
    expect(reset).toBe(true);
  });

  it('"all" fails every group; an invalid latency is ignored', () => {
    configureFromSearch('?mock-fail=all&mock-latency=-5');
    expect(shouldFail('notifications')).toBe(true);
    expect(mockConfig.latencyMs).toBe(0); // the test setup's value, unchanged
  });
});
