export default function AuthorMetricCard({ eyebrow, value, label, note }) {
  return (
    <article className="author-studio-metric-card">
      {eyebrow ? <span className="author-studio-metric-card__eyebrow">{eyebrow}</span> : null}
      <strong className="author-studio-metric-card__value">{value}</strong>
      <span className="author-studio-metric-card__label">{label}</span>
      {note ? <p className="author-studio-metric-card__note">{note}</p> : null}
    </article>
  );
}
