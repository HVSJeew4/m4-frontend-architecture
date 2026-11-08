import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/common/Card';
import { BellIcon, PlusIcon, SearchIcon } from '@/components/common/icons';

// Links, not buttons: each one goes to another page (and works with "open in new tab").
const ACTIONS = [
  { to: '/users?new=1', label: 'Add a user', Icon: PlusIcon },
  { to: '/users', label: 'Find a user', Icon: SearchIcon },
  { to: '/notifications', label: 'View notifications', Icon: BellIcon },
];

export function QuickActions() {
  return (
    <Card aria-labelledby="quick-actions-title">
      <CardHeader titleId="quick-actions-title" title="Quick actions" />
      <CardBody>
        <ul className="grid gap-2">
          {ACTIONS.map(({ to, label, Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-950 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
              >
                <Icon className="h-5 w-5 text-accent" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
