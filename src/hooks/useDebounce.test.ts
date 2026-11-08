import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the first value immediately', () => {
    const { result } = renderHook(() => useDebounce('ada', 300));
    expect(result.current).toBe('ada');
  });

  it('only updates after the value has stopped changing for the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ad' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    // Typing again restarts the wait.
    rerender({ value: 'ada' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('ada');
  });

  it('waits 300 ms by default, as in the brief', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'x' },
    });
    rerender({ value: 'xy' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('x');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('xy');
  });

  it('leaves no timer running after unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'b' });
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
