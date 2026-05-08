export default function AuthPanel({
  aside,
  formEyebrow,
  formTitle,
  formText,
  children,
  footer,
}) {
  return (
    <div className="iv-auth-panel">
      <aside className="iv-auth-panel__aside">{aside}</aside>

      <section className="iv-auth-panel__main">
        <div className="iv-auth-main__header">
          {formEyebrow ? <p className="iv-auth-eyebrow">{formEyebrow}</p> : null}
          <h1 className="iv-auth-main__title">{formTitle}</h1>
          {formText ? <p className="iv-auth-main__text">{formText}</p> : null}
        </div>

        <div className="iv-auth-panel__body">{children}</div>

        {footer ? <div className="iv-auth-panel__footer">{footer}</div> : null}
      </section>
    </div>
  );
}
