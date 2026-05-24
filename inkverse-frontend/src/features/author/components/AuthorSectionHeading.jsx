export default function AuthorSectionHeading({ eyebrow, title, description, actions = null }) {
  return (
    <div className="author-studio-section-heading">
      <div className="author-studio-section-heading__copy">
        {eyebrow ? <span className="author-studio-section-heading__eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="author-studio-section-heading__actions">{actions}</div> : null}
    </div>
  );
}
