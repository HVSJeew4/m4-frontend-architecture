import { MoonIcon, SunIcon } from '@/components/common/icons';
import { useResolvedTheme } from '@/hooks/useTheme';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';

/**
 * A toggle button (aria-pressed), read as "Dark mode, toggle button, pressed / not pressed".
 * The label stays the same and the pressed state carries the meaning – the WAI-ARIA pattern for
 * toggle buttons (a label that flips between "Dark" and "Light" would be ambiguous).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useResolvedTheme() === 'dark';
  const toggleTheme = useUiStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label="Dark mode"
      onClick={toggleTheme}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      {dark ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
    </button>
  );
}
