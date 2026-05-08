export default function AdminMetricCard({
  label,
  value,
  meta,
  tone = "default",
}) {
  return (
    <div className={`admin-metric admin-metric--${tone}`}>
      <p className="admin-metric__label">{label}</p>
      <p className="admin-metric__value">{value}</p>
      {meta ? <p className="admin-metric__meta">{meta}</p> : null}
    </div>
  );
}
