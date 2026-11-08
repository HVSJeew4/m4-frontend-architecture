import { Navigate, useLocation } from 'react-router-dom';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { DEMO_ACCOUNTS } from '@/mocks/data/demoAccounts';
import { useAuthStore } from '@/stores/authStore';
import { getSafeRedirect } from '@/utils/safeRedirect';

export default function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Signed in (just now, or already): go to the page that was asked for, if it is a safe in-app path.
  if (user) {
    const from: unknown = (location.state as { from?: unknown } | null)?.from;
    return <Navigate to={getSafeRedirect(from)} replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-lg font-bold text-blue-900">AdminFlow</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in to AdminFlow</h1>
        <p className="mt-1 mb-6 text-sm text-slate-700">Manage users, metrics and notifications.</p>
        <LoginForm />
        <section
          aria-labelledby="demo-accounts"
          className="mt-6 rounded-md bg-slate-50 p-3 text-sm"
        >
          <h2 id="demo-accounts" className="font-semibold text-slate-800">
            Demo accounts
          </h2>
          <p className="mt-1 text-slate-700">Any password with 8 or more characters works.</p>
          <ul className="mt-2 space-y-1 text-slate-800">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <span className="font-mono">{account.email}</span>{' '}
                <span className="text-slate-600">({account.role})</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
