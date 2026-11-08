interface FieldMessagesProps {
  hint?: string;
  error?: string;
  hintId: string;
  errorId: string;
}

/** Hint and error text under a form control (ids come from useFieldIds). */
export function FieldMessages({ hint, error, hintId, errorId }: FieldMessagesProps) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
}

interface FieldLabelProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  hidden?: boolean;
}

export function FieldLabel({ htmlFor, label, required, hidden }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={hidden ? 'sr-only' : 'mb-1 block text-sm font-medium text-slate-800'}
    >
      {label}
      {/* The asterisk is visual only; the control's `required` attribute is what is announced. */}
      {required && (
        <span aria-hidden="true" className="text-danger">
          {' '}
          *
        </span>
      )}
    </label>
  );
}
