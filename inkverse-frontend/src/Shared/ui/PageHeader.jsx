import React from "react";

export default function PageHeader({
  title,
  subtitle,
  actions,
  variant = "default", // default | light
}) {
  return (
    <div className={`iv-page-header iv-page-header--${variant}`}>
      <div>
        <h2 className="iv-title">{title}</h2>
        {subtitle ? <p className="iv-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="iv-actions">{actions}</div> : null}
    </div>
  );
}