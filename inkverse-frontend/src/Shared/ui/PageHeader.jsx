import React from "react";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="iv-page-header">
      <div>
        <h2 className="iv-title">{title}</h2>
        {subtitle ? <p className="iv-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="iv-actions">{actions}</div> : null}
    </div>
  );
}