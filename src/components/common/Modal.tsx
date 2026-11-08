import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import { XIcon } from './icons';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Linked with aria-describedby, e.g. "Are you sure?" in a confirm dialog. */
  description?: ReactNode;
  children?: ReactNode;
  /** Action buttons, shown at the bottom. */
  footer?: ReactNode;
  /** What gets focus when the dialog opens (default: the first focusable element). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where focus goes on close, if set by then (default: the element that opened the dialog). */
  finalFocusRef?: RefObject<HTMLElement | null>;
  size?: 'sm' | 'md';
}

/**
 * Accessible modal dialog:
 * - role="dialog" + aria-modal, named by its title (aria-labelledby) and description;
 * - focus moves in on open, Tab / Shift+Tab are trapped inside, Escape closes;
 * - the rest of the page is made `inert` (not focusable, hidden from screen readers);
 * - focus goes back to the element that opened it when it closes.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocusRef,
  finalFocusRef,
  size = 'md',
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const portal = dialog.closest('[data-modal-root]');
    const background = Array.from(document.body.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el !== portal && !el.hasAttribute('inert'),
    );
    for (const el of background) el.setAttribute('inert', '');
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden'; // no background scrolling behind the dialog

    const first = initialFocusRef?.current ?? dialog.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog).focus();

    return () => {
      for (const el of background) el.removeAttribute('inert');
      document.body.style.overflow = overflow;
      // Read at close time on purpose: the caller may set it while the dialog is open.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      (finalFocusRef?.current ?? opener)?.focus();
    };
  }, [open, initialFocusRef, finalFocusRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    const active = document.activeElement;
    // Wrap around at either end instead of leaving the dialog.
    if (event.shiftKey && (active === first || active === dialogRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      data-modal-root
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
    >
      {/* Backdrop: clicking it closes the dialog; hidden from assistive tech (Escape does the same). */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* The dialog itself handles Escape and Tab (WAI-ARIA dialog pattern), so the key handler
          belongs on this element even though a dialog is not an "interactive" role. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col rounded-t-xl bg-surface shadow-xl focus:outline-none sm:rounded-xl',
          size === 'sm' ? 'sm:max-w-md' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-sm text-slate-700">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-m-2 rounded-md p-2 text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          >
            <XIcon />
          </button>
        </div>
        {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
