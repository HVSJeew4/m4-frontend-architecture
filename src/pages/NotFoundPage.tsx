import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section aria-labelledby="page-title">
      <h1 id="page-title" className="text-2xl font-bold">
        Page not found
      </h1>
      <p className="mt-2 text-slate-700">
        The page you asked for does not exist.{' '}
        <Link to="/dashboard" className="font-medium text-blue-800 underline">
          Go to the dashboard
        </Link>
      </p>
    </section>
  );
}
