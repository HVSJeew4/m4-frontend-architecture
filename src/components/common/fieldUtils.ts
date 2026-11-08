import { useId } from 'react';

/**
 * ids shared by Input, Select and Checkbox: the hint and error are linked to the control with
 * aria-describedby, so a screen reader reads them when the field gets focus.
 */
export function useFieldIds(id: string | undefined, hint?: string, error?: string) {
  const generated = useId();
  const fieldId = id ?? generated;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;
  return { fieldId, hintId, errorId, describedBy };
}

export const controlClasses = (hasError: boolean) =>
  [
    'block w-full rounded-md border bg-surface px-3 py-2 text-slate-900 min-h-11',
    'focus:ring-2 focus:ring-focus focus:outline-none disabled:bg-slate-100',
    hasError ? 'border-danger' : 'border-slate-400',
  ].join(' ');
