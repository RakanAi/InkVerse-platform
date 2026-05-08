export default function AdminFormField({
  label,
  hint,
  children,
  className = "",
}) {
  return (
    <label className={`admin-form-field ${className}`.trim()}>
      {label ? <span className="admin-form-field__label">{label}</span> : null}
      {children}
      {hint ? <span className="admin-form-field__hint">{hint}</span> : null}
    </label>
  );
}
