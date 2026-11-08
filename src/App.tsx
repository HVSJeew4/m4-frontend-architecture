import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute';
import { Toaster } from '@/components/features/notifications/Toaster';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClearCacheOnSignOut } from '@/hooks/useClearCacheOnSignOut';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import NotificationsPage from '@/pages/NotificationsPage';
import UsersPage from '@/pages/UsersPage';

// Providers (React Query, Router) live in main.tsx, so tests can render <App /> with their own.
export default function App() {
  useClearCacheOnSignOut();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Everything else needs a signed-in user. */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      {/* Outside the routes, so toasts survive navigation (e.g. "Signed out" on the login page). */}
      <Toaster />
    </>
  );
}
