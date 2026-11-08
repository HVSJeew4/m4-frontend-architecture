import { Link } from 'react-router-dom';
import { UserMenu } from '@/components/features/auth/UserMenu';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  navId: string;
  navOpen: boolean;
  onToggleNav: () => void;
  className?: string;
}

export function Header({ navId, navOpen, onToggleNav, className = '' }: HeaderProps) {
  return (
    // Tighter padding and gaps below sm: at 320 px every control still fits without horizontal
    // scrolling (WCAG 1.4.10 reflow), and each keeps a 44 px touch target.
    <header
      className={`flex items-center gap-2 bg-blue-900 px-3 py-3 text-white sm:gap-3 sm:px-4 ${className}`}
    >
      {/* Menu button only on small screens; from md up the navigation is always visible. */}
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:hidden"
        aria-expanded={navOpen}
        aria-controls={navId}
        aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
        onClick={onToggleNav}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {navOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      <Link
        to="/dashboard"
        className="rounded-md text-lg font-bold tracking-tight focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        AdminFlow
      </Link>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeToggle className="hover:bg-blue-800 focus-visible:ring-white" />
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
