import React from "react";
import emptyStateSearchBooks from "../../assets/empty-state-search-books.png";

export default function EmptyState({
  title = "Nothing here yet",
  subtitle = "Try changing filters or come back later.",
  action,
}) {
  return (
    <div className="iv-state iv-empty">
      <img
        className="iv-empty-illustration"
        src={emptyStateSearchBooks}
        alt=""
        aria-hidden="true"
      />
      <div className="iv-state-title">{title}</div>
      {subtitle ? <div className="iv-state-text">{subtitle}</div> : null}
      {action ? <div className="iv-state-action">{action}</div> : null}
    </div>
  );
}
