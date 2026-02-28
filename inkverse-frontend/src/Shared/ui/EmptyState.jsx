import React from "react";

export default function EmptyState({
  title = "Nothing here yet",
  subtitle = "Try changing filters or come back later.",
  action,
}) {
  return (
    <div className="iv-state iv-empty">
      <div className="iv-empty-icon">✦</div>
      <div className="iv-state-title">{title}</div>
      {subtitle ? <div className="iv-state-text">{subtitle}</div> : null}
      {action ? <div className="iv-state-action">{action}</div> : null}
    </div>
  );
}