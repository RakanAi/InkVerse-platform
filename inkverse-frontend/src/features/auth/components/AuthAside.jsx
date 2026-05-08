export default function AuthAside({
  eyebrow,
  title,
  text,
  items = [],
  children,
}) {
  return (
    <div className="iv-auth-aside">
      <div className="iv-auth-aside__intro">
        {eyebrow ? <p className="iv-auth-eyebrow">{eyebrow}</p> : null}
        {title ? <h2 className="iv-auth-aside__title">{title}</h2> : null}
        {text ? <p className="iv-auth-aside__text">{text}</p> : null}
      </div>

      {items.length > 0 ? (
        <div className="iv-auth-featureGrid">
          {items.map((item) => (
            <article key={item.title} className="iv-auth-featureCard">
              <h3 className="iv-auth-featureCard__title">{item.title}</h3>
              <p className="iv-auth-featureCard__text">{item.text}</p>
            </article>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}
