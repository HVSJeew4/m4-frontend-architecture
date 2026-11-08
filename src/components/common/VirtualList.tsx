import { useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualListProps<T> {
  /** Names the list (and its scroll region) for screen readers. */
  label: string;
  items: T[];
  /** Height of the scroll area in px. */
  height: number;
  /** Height of one row in px (all rows are the same height). */
  itemHeight: number;
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
}

/**
 * The brief's VirtualList: only the rows in view (plus a few above and below) are in the DOM,
 * so 10,000 rows cost about the same as 15. Each row still carries aria-setsize / aria-posinset,
 * so a screen reader announces "item 1 of 10,000", not "1 of 15".
 */
export function VirtualList<T>({
  label,
  items,
  height,
  itemHeight,
  getKey,
  renderItem,
}: VirtualListProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // This lint only says the React Compiler would skip this component; the project does not use
  // the React Compiler, so it does not apply.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => itemHeight,
    getItemKey: (index) => getKey(items[index]!),
    overscan: 5,
    // Size before the first measurement (and in tests, where there is no layout).
    initialRect: { width: 0, height },
  });

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label={label}
      // Scrollable regions must be reachable by keyboard (arrow keys / Page Down then scroll it).
      tabIndex={0}
      style={{ height }}
      className="overflow-y-auto rounded-lg border border-slate-200 bg-surface focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
    >
      <ul aria-label={label} className="relative" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((row) => (
          <li
            key={row.key}
            aria-setsize={items.length}
            aria-posinset={row.index + 1}
            className="absolute inset-x-0 top-0 border-b border-slate-200"
            style={{ height: itemHeight, transform: `translateY(${row.start}px)` }}
          >
            {renderItem(items[row.index]!, row.index)}
          </li>
        ))}
      </ul>
    </div>
  );
}
