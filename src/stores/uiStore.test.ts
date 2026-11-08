import { beforeEach, describe, expect, it } from 'vitest';
import { setSystemPrefersDark } from '@/test/matchMedia';
import { applyTheme, resolveTheme, useUiStore } from './uiStore';

describe('uiStore – theme', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'system' });
    setSystemPrefersDark(false);
    document.documentElement.classList.remove('dark');
  });

  it('follows the system setting until the user chooses', () => {
    expect(useUiStore.getState().theme).toBe('system');
    expect(resolveTheme('system')).toBe('light');
    setSystemPrefersDark(true);
    expect(resolveTheme('system')).toBe('dark');
  });

  it('puts the "dark" class on <html> for the dark theme only', () => {
    applyTheme('dark');
    expect(document.documentElement).toHaveClass('dark');
    applyTheme('light');
    expect(document.documentElement).not.toHaveClass('dark');
  });

  it('toggles to the opposite of what is shown now, and remembers it', () => {
    setSystemPrefersDark(true); // system is dark, so the toggle switches to light
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('light');
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('dark');
    expect(JSON.parse(localStorage.getItem('adminflow:ui') ?? '{}')).toMatchObject({
      state: { theme: 'dark' },
    });
  });
});
