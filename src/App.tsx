import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';
import NotificationsPage from '@/pages/NotificationsPage';
import UsersPage from '@/pages/UsersPage';

// Providers (React Query, Router) live in main.tsx, so tests can render <App /> with their own.
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
