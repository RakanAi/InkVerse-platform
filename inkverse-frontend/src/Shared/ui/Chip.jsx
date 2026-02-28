import React from "react";

export default function Chip({ children, tone = "neutral", onClick, title }) {
  return (
    <button
      type="button"
      className={`iv-chip iv-chip-${tone}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}