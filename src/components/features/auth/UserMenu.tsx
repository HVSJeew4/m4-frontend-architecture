import { useAuthStore } from '@/stores/authStore';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  if (!user) return null;

  return (
    <div className="flex items-center gap-3">
      <p className="hidden text-right text-sm leading-tight sm:block">
        <span className="block font-medium">{user.name}</span>
        <span className="block text-blue-100 capitalize">{user.role}</span>
      </p>
      <button
        type="button"
        onClick={logout}
        className="min-h-11 rounded-md border border-blue-300 px-2 text-sm sm:px-3 font-medium hover:bg-blue-800 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
      >
        Sign out
      </button>
    </div>
  );
}
