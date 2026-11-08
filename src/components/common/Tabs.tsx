import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TabItem<V extends string> {
  value: V;
  label: string;
}

export interface TabsProps<V extends string> {
  /** Names the tab list for screen readers. */
  label: string;
  tabs: TabItem<V>[];
  /** Controlled: the parent owns the selected tab. */
  value: V;
  onChange: (value: V) => void;
  /** Content of the selected tab's panel. */
  children: ReactNode;
  className?: string;
}

/**
 * Controlled tabs following the WAI-ARIA tabs pattern: one Tab stop for the whole tab list
 * (roving tabindex), arrow keys / Home / End move between tabs, selection follows focus.
 */
export function Tabs<V extends string>({
  label,
  tabs,
  value,
  onChange,
  children,
  className,
}: TabsProps<V>) {
  const baseId = useId();
  const tabRefs = useRef(new Map<V, HTMLButtonElement>());
  const tabId = (v: V) => `${baseId}-tab-${v}`;
  const panelId = `${baseId}-panel`;

  function select(index: number) {
    const tab = tabs[(index + tabs.length) % tabs.length]!;
    onChange(tab.value);
    tabRefs.current.get(tab.value)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        // In dark mode the bar is darker and the selected pill lighter than the card, so the
        // selected tab is shown by shape too, not only by its text colour (WCAG 1.4.1).
        className="inline-flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-50"
      >
        {tabs.map((tab, index) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.value, el);
                else tabRefs.current.delete(tab.value);
              }}
              type="button"
              role="tab"
              id={tabId(tab.value)}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'min-h-9 rounded-md px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none',
                selected
                  ? 'bg-surface text-accent shadow-sm dark:bg-slate-300'
                  : 'text-slate-700 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId(value)}
        tabIndex={0}
        className="mt-4 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
      >
        {children}
      </div>
    </div>
  );
}
