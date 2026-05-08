import Surface from "../../../Shared/ui/Surface";

export default function AdminSection({
  title,
  subtitle,
  actions,
  children,
  className = "",
  bodyClassName = "",
  flat = false,
}) {
  const hasHeader = title || subtitle || actions;
  const Wrapper = flat ? "section" : Surface;
  const classes = `admin-panel ${flat ? "admin-panel--flat" : ""} ${className}`.trim();

  return (
    <Wrapper className={classes}>
      {hasHeader ? (
        <div className="admin-panel__head">
          <div className="admin-panel__head-copy">
            {title ? <h2 className="admin-panel__title">{title}</h2> : null}
            {subtitle ? <p className="admin-panel__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="admin-panel__actions">{actions}</div> : null}
        </div>
      ) : null}

      <div className={`admin-panel__body ${bodyClassName}`.trim()}>{children}</div>
    </Wrapper>
  );
}
