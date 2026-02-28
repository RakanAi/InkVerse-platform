import React from "react";

export default function Button({
  children,
  variant = "primary", // primary | outline | danger | ghost
  size = "sm", // sm | md
  className = "",
  ...props
}) {
  return (
    <button
      className={`iv-btn iv-btn-${variant} iv-btn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}