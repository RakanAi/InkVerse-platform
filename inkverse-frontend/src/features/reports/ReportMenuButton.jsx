import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReportDialog from "./ReportDialog";
import "./reports.css";

export default function ReportMenuButton({
  targetType,
  targetId,
  targetLabel,
  className = "",
  buttonClassName = "",
  menuClassName = "",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const closeMenu = () => setMenuOpen(false);

  useLayoutEffect(() => {
    if (!menuOpen || typeof window === "undefined") return undefined;

    let frame = 0;
    const placeMenu = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth || 156;
      const menuHeight = menuRef.current?.offsetHeight || 52;
      const gap = 8;
      const edge = 12;
      const isRtl = document.documentElement.dir === "rtl";

      let left = isRtl ? rect.left : rect.right - menuWidth;
      left = Math.max(edge, Math.min(left, window.innerWidth - menuWidth - edge));

      let top = rect.bottom + gap;
      if (top + menuHeight + edge > window.innerHeight && rect.top - menuHeight - gap > edge) {
        top = rect.top - menuHeight - gap;
      }

      setMenuPosition({ top, left });
    };

    frame = window.requestAnimationFrame(placeMenu);
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen || typeof document === "undefined") return undefined;

    const onPointerDown = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      closeMenu();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (!targetType || targetId === undefined || targetId === null || targetId === "") {
    return null;
  }

  return (
    <span
      className={`iv-report-menu-wrap ${className}`.trim()}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`iv-report-menu-button ${buttonClassName}`.trim()}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="More actions"
        title="More actions"
        onClick={() => setMenuOpen((current) => !current)}
      >
        <i className="bi bi-three-dots" aria-hidden="true" />
      </button>

      {menuOpen && typeof document !== "undefined" ? createPortal(
        <span
          ref={menuRef}
          className={`iv-report-menu iv-report-menu--floating ${menuClassName}`.trim()}
          role="menu"
          style={{
            top: `${menuPosition?.top ?? -9999}px`,
            left: `${menuPosition?.left ?? -9999}px`,
            visibility: menuPosition ? "visible" : "hidden",
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              setDialogOpen(true);
            }}
          >
            <i className="bi bi-flag" aria-hidden="true" />
            <span>Report</span>
          </button>
        </span>,
        document.body,
      ) : null}

      <ReportDialog
        open={dialogOpen}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
        onClose={() => setDialogOpen(false)}
      />
    </span>
  );
}
