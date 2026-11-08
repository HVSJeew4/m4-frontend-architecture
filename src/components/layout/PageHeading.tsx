import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';

interface PageHeadingProps {
  /** Used for document.title: "<title> · AdminFlow". */
  title: string;
  children?: ReactNode;
  className?: string;
}

// The history entry the app was loaded on (React Router keeps a `key` in history.state). A reload
// keeps the entry's key, so comparing with "default" alone would wrongly treat a reload as a
// navigation and skip keyboard users past the header.
const INITIAL_KEY = (window.history.state as { key?: string } | null)?.key ?? 'default';

/**
 * The page's <h1>. In a single-page app the browser does not announce page changes, so this:
 * - sets document.title (read by screen readers, shown in tabs and history);
 * - after an in-app navigation, moves focus here, so screen-reader and keyboard users start at
 *   the new page instead of on the link they clicked.
 * It does not take focus on the page the app was loaded or reloaded on, and only reacts to a new
 * path – sorting or searching (query string changes) must not steal focus.
 */
export const PageHeading = forwardRef<HTMLHeadingElement, PageHeadingProps>(function PageHeading(
  { title, children, className },
  ref,
) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useImperativeHandle(ref, () => headingRef.current!);
  const { key, pathname } = useLocation();

  // Layout effects: run in the same commit that shows the new heading (before paint), so the
  // title and focus never lag behind the content.
  useLayoutEffect(() => {
    document.title = `${title} · AdminFlow`;
  }, [title]);

  useLayoutEffect(() => {
    if (key !== 'default' && key !== INITIAL_KEY) headingRef.current?.focus();
    // Only on a new path: `key` also changes for query-string updates, which must not move focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <h1
      ref={headingRef}
      tabIndex={-1}
      className={cn('text-2xl font-bold text-slate-900 focus:outline-none', className)}
    >
      {children ?? title}
    </h1>
  );
});
