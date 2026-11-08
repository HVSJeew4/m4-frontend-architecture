import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/features/auth/ProtectedRoute';
import { Toaster } from '@/components/features/notifications/Toaster';
import { AppLayout } from '@/components/layout/AppLayout';
import { useClearCacheOnSignOut } from '@/hooks/useClearCacheOnSignOut';
import { useApplyTheme } from '@/hooks/useTheme';
import LoginPage from '@/pages/LoginPage';

// Code splitting: each page is its own chunk, downloaded when first visited (Suspense in
// AppLayout shows a placeholder meanwhile). The login page stays in the main bundle: it is the
// first page for every signed-out visitor, and lazy-loading it would add a round trip to the
// most important first paint.
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

// Providers (React Query, Router) live in main.tsx, so tests can render <App /> with their own.
export default function App() {
  useClearCacheOnSignOut();
  useApplyTheme();

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
