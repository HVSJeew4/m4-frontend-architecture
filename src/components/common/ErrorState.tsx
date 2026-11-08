import { errorMessage } from '@/api/client';
import { Alert } from './Alert';
import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  error: unknown;
  onRetry?: () => void;
}

/** A failed request: what failed, the server's message and a retry button. */
export function ErrorState({ title, error, onRetry }: ErrorStateProps) {
  return (
    <Alert variant="error" title={title}>
      <p>{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
