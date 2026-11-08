import { MetricCards } from '@/components/features/dashboard/MetricCards';
import { QuickActions } from '@/components/features/dashboard/QuickActions';
import { RecentActivity } from '@/components/features/dashboard/RecentActivity';
import { TrendCard } from '@/components/features/dashboard/TrendCard';
import { useAuthStore } from '@/stores/authStore';
import { PageHeading } from '@/components/layout/PageHeading';

export default function DashboardPage() {
  const name = useAuthStore((state) => state.user?.name.split(' ')[0]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <PageHeading title="Dashboard" />
        <p className="mt-1 text-slate-700">
          Welcome back{name ? `, ${name}` : ''}. Here is the last 30 days.
        </p>
      </div>
      <section aria-label="Key metrics">
        <MetricCards />
      </section>
      {/* Mobile-first: one column, then chart beside the side panels on large screens. */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* min-w-0: grid items otherwise grow to fit wide content (the chart) instead of shrinking. */}
        <div className="min-w-0 lg:col-span-2">
          <TrendCard />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <QuickActions />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
