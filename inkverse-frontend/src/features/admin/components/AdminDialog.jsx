import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function AdminDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  size = "lg",
  className = "",
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="admin-dialog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className={`admin-dialog admin-dialog--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="admin-dialog__close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          ×
        </button>

        {(title || subtitle) && (
          <header className="admin-dialog__header">
            {title ? <h2 className="admin-dialog__title">{title}</h2> : null}
            {subtitle ? (
              <p className="admin-dialog__subtitle">{subtitle}</p>
            ) : null}
          </header>
        )}

        <div className="admin-dialog__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}
