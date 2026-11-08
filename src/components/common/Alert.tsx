import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { CheckCircleIcon, ErrorIcon, InfoIcon, WarningIcon, XIcon } from './icons';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const STYLES: Record<AlertVariant, { box: string; Icon: typeof InfoIcon; label: string }> = {
  info: { box: 'border-blue-300 bg-blue-50 text-blue-900', Icon: InfoIcon, label: 'Information' },
  success: {
    box: 'border-green-300 bg-green-50 text-green-900',
    Icon: CheckCircleIcon,
    label: 'Success',
  },
  warning: {
    box: 'border-amber-300 bg-amber-50 text-amber-900',
    Icon: WarningIcon,
    label: 'Warning',
  },
  error: { box: 'border-red-300 bg-red-50 text-red-900', Icon: ErrorIcon, label: 'Error' },
};

/**
 * Errors and warnings use role="alert" (announced immediately); info and success use
 * role="status" (announced politely). The variant is also given in text, not only by colour.
 */
export function Alert({ variant = 'info', title, children, onDismiss, className }: AlertProps) {
  const { box, Icon, label } = STYLES[variant];
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border p-4', box, className)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          <span className="sr-only">{label}: </span>
          {title}
        </p>
        {children && <div className={cn('text-sm', title && 'mt-1')}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 h-8 w-8 shrink-0 rounded-md p-1.5 hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
        >
          <XIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
