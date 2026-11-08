/** First focusable element on every page: lets keyboard users jump past the header and navigation. */
export function SkipLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:font-semibold focus:text-accent focus:ring-2 focus:ring-focus"
    >
      Skip to main content
    </a>
  );
}
