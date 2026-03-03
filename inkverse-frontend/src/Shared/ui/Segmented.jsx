import React from "react";

export default function Segmented({
  value,
  onChange,
  options = [],
  className = "",
  wrap = true, // default: wrapping ON
}) {
  return (
    <div
      className={`iv-seg ${wrap ? "iv-seg--wrap" : ""} ${className}`}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            className={`iv-seg-btn ${active ? "is-active" : ""}`}
            onClick={() => onChange?.(o.value)}
            role="tab"
            aria-selected={active}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}