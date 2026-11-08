import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { FieldLabel, FieldMessages } from './FieldMessages';
import { controlClasses, useFieldIds } from './fieldUtils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  /** Adds an empty first option, e.g. "All roles". Single select only. */
  placeholder?: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
}

/**
 * Native <select> for both single and multi-select: keyboard, screen-reader and mobile pickers
 * work out of the box, which a custom listbox would have to rebuild by hand.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    options,
    placeholder,
    error,
    hint,
    hideLabel,
    id,
    className,
    required,
    multiple,
    ...rest
  },
  ref,
) {
  const hintText =
    hint ?? (multiple ? 'Hold Ctrl (Cmd on Mac) to select more than one.' : undefined);
  const { fieldId, hintId, errorId, describedBy } = useFieldIds(id, hintText, error);
  return (
    <div className={className}>
      <FieldLabel htmlFor={fieldId} label={label} required={required} hidden={hideLabel} />
      <select
        ref={ref}
        id={fieldId}
        required={required}
        multiple={multiple}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(controlClasses(Boolean(error)), multiple && 'min-h-28')}
        {...rest}
      >
        {placeholder && !multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldMessages hint={hintText} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
});
