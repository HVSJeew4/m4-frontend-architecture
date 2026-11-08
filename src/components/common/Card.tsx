import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** A surface for grouped content. Use CardHeader / CardBody / CardFooter inside it. */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)}
      {...rest}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  /** Pass the same id as the Card's aria-labelledby to name the section. */
  titleId?: string;
  description?: ReactNode;
  /** Buttons or links on the right of the title. */
  actions?: ReactNode;
  /** Heading level, so the page outline stays correct (default h2). */
  as?: 'h2' | 'h3';
}

export function CardHeader({
  title,
  titleId,
  description,
  actions,
  as: Heading = 'h2',
}: CardHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
      <div>
        <Heading id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </Heading>
        {description && <p className="mt-0.5 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-4 py-4 sm:px-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
