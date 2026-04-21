import React from "react";

export default function SelectField({
  label,
  value,
  onChange,
  options = [],
  className = "",
}) {
  return (
    <div className={`iv-field ${className}`}>
      {label && <label className="iv-label">{label}</label>}

      <div className="iv-select-wrapper">
        <select
          className="iv-select"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="iv-select-arrow">▾</span>
      </div>
    </div>
  );
}