/** First focusable element on every page: lets keyboard users jump past the header and navigation. */
export function SkipLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-blue-900 focus:ring-2 focus:ring-blue-700"
    >
      Skip to main content
    </a>
  );
}
