import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingState, Skeleton } from '@/components/common/Skeleton';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';

export const MAIN_CONTENT_ID = 'main-content';
const NAV_ID = 'primary-nav';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    // minmax(0, 1fr) instead of 1fr: a plain 1fr column cannot shrink below its content, so a
    // wide table or the chart would push the page wider than a phone screen (no reflow).
    <div className="min-h-screen md:grid md:grid-cols-[14rem_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <Header
        className="md:col-span-2"
        navId={NAV_ID}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <Sidebar id={NAV_ID} open={navOpen} onNavigate={() => setNavOpen(false)} />
      {/* tabIndex -1: the skip link can move focus here, but Tab does not stop on it. */}
      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="min-w-0 p-4 focus:outline-none sm:p-6 lg:p-8"
      >
        {/* Pages are lazy chunks: header and navigation stay while a page downloads. */}
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingState label="Loading page" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
