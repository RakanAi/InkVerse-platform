import React, { useEffect, useRef, useState } from "react";

export default function MultiSelectDropdown({
  label,
  values = [],
  onChange,
  options = [], // [{ value, label }]
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (val) => {
    const set = new Set(values);
    if (set.has(val)) set.delete(val);
    else set.add(val);
    onChange(Array.from(set));
  };

  return (
    <div ref={rootRef} className={`iv-dd ${open ? "is-open" : ""} ${className}`}>
      <button
        type="button"
        className="iv-dd-btn"
        onClick={() => setOpen((x) => !x)}
      >
        <span className="iv-dd-text">
          {label}
          {values.length > 0 ? ` (${values.length})` : ""}
        </span>
        <span className="iv-dd-arrow">▾</span>
      </button>

      <div className={`iv-dd-menu ${open ? "is-open" : ""}`}>
        {options.map((o) => {
          const active = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              className={`iv-dd-item ${active ? "is-active" : ""}`}
              onClick={() => toggle(o.value)}
            >
              <span>{o.label}</span>
              {active && <span>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}