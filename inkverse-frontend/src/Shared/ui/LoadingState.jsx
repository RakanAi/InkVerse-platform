import React from "react";

export default function LoadingState({ text = "Loading..." }) {
  return (
    <div className="iv-state iv-loading">
      <div className="iv-spinner" />
      <div className="iv-state-text">{text}</div>
    </div>
  );
}