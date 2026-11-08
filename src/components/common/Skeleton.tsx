import { cn } from '@/utils/cn';

/** Grey placeholder while data loads. Hidden from screen readers; pair it with a LoadingState. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded bg-slate-200 motion-safe:animate-pulse', className)}
    />
  );
}

/** Announces "Loading …" to screen readers (visually hidden) while skeletons are on screen. */
export function LoadingState({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}
