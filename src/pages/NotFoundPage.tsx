import { Link } from 'react-router-dom';
import { PageHeading } from '@/components/layout/PageHeading';

export default function NotFoundPage() {
  return (
    <section>
      <PageHeading title="Page not found" />
      <p className="mt-2 text-slate-700">
        The page you asked for does not exist.{' '}
        <Link to="/dashboard" className="font-medium text-accent underline">
          Go to the dashboard
        </Link>
      </p>
    </section>
  );
}
