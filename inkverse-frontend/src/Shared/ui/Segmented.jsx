import React from "react";

export default function Segmented({
  value,
  onChange,
  options = [], // [{ value, label }]
  className = "",
}) {
  return (
    <div className={`iv-seg ${className}`} role="tablist">
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