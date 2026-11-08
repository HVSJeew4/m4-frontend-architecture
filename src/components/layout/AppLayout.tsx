import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { SkipLink } from './SkipLink';

export const MAIN_CONTENT_ID = 'main-content';
const NAV_ID = 'primary-nav';

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[14rem_1fr] md:grid-rows-[auto_1fr]">
      <SkipLink targetId={MAIN_CONTENT_ID} />
      <Header
        className="md:col-span-2"
        navId={NAV_ID}
        navOpen={navOpen}
        onToggleNav={() => setNavOpen((open) => !open)}
      />
      <Sidebar id={NAV_ID} open={navOpen} onNavigate={() => setNavOpen(false)} />
      {/* tabIndex -1: the skip link can move focus here, but Tab does not stop on it. */}
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="p-4 focus:outline-none sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
