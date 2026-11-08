import { forwardRef, type InputHTMLAttributes } from 'react';
import { FieldMessages } from './FieldMessages';
import { useFieldIds } from './fieldUtils';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hint?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, id, className, ...rest },
  ref,
) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  return (
    <div className={className}>
      <div className="flex min-h-11 items-center gap-3">
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-5 w-5 rounded border-slate-400 accent-blue-700 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          {...rest}
        />
        <label htmlFor={fieldId} className="text-slate-800">
          {label}
        </label>
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
