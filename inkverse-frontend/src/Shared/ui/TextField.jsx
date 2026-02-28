import React from "react";

export default function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
  ...props
}) {
  return (
    <input
      className={`iv-input ${className}`}
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      type={type}
      {...props}
    />
  );
}