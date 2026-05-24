import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const EXIT_DURATION_MS = 180;

export default function ReaderDrawer({
  open,
  title,
  onClose,
  children,
  size = "md",
  theme = "mist",
}) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), EXIT_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`reader-drawer reader-drawer--${theme} ${visible ? "is-open" : ""}`}
      onMouseDown={() => onClose?.()}
      role="presentation"
    >
      <div className="reader-drawer__backdrop" />

      <aside
        className={`reader-drawer__panel reader-drawer__panel--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="reader-drawer__header">
          <h2 className="reader-drawer__title">{title}</h2>

          <button
            className="reader-drawer__close"
            type="button"
            onClick={() => onClose?.()}
            aria-label={`Close ${title}`}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="reader-drawer__body">{children}</div>
      </aside>
    </div>,
    document.body
  );
}
