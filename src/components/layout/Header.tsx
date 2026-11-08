import { Link } from 'react-router-dom';
import { UserMenu } from '@/components/features/auth/UserMenu';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';

interface HeaderProps {
  navId: string;
  navOpen: boolean;
  onToggleNav: () => void;
  className?: string;
}

export function Header({ navId, navOpen, onToggleNav, className = '' }: HeaderProps) {
  return (
    <header className={`flex items-center gap-3 bg-blue-900 px-4 py-3 text-white ${className}`}>
      {/* Menu button only on small screens; from md up the navigation is always visible. */}
      <button
        type="button"
        className="rounded-md p-2 hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:hidden"
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
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
