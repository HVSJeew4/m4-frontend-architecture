import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

interface SidebarProps {
  id: string;
  /** Only matters on small screens, where the navigation is collapsible. */
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ id, open, onNavigate }: SidebarProps) {
  return (
    <nav
      id={id}
      aria-label="Primary"
      className={`${open ? 'block' : 'hidden'} border-b border-slate-200 bg-white md:block md:border-r md:border-b-0`}
    >
      <ul className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            {/* NavLink sets aria-current="page" on the active link for screen readers. */}
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:outline-none ${
                  isActive
                    ? 'bg-blue-50 font-semibold text-blue-900'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
