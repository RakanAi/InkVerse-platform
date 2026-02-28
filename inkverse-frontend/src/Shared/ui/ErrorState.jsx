import React from "react";

export default function ErrorState({
  title = "Something went wrong",
  subtitle = "Please try again.",
  onRetry,
}) {
  return (
    <div className="iv-state iv-error">
      <div className="iv-state-title">{title}</div>
      {subtitle ? <div className="iv-state-text">{subtitle}</div> : null}
      {onRetry ? (
        <button className="iv-btn iv-btn-outline" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}