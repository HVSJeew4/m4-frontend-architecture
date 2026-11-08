import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { FieldLabel, FieldMessages } from './FieldMessages';
import { controlClasses, useFieldIds } from './fieldUtils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Required: every input needs a visible (or screen-reader) label. */
  label: string;
  error?: string;
  hint?: string;
  /** Visually hide the label (it is still read by screen readers). */
  hideLabel?: boolean;
}

// forwardRef so React Hook Form's register() can attach to the real <input>.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, hideLabel, id, className, required, type = 'text', ...rest },
  ref,
) {
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, hint, error);
  return (
    <div className={className}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} hidden={hideLabel} />
      <input
        ref={ref}
        id={fieldId}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClasses(Boolean(error)))}
        {...rest}
      />
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
