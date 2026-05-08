import { useId } from "react";

export default function AuthField({
  id,
  label,
  helper,
  action,
  className = "",
  ...inputProps
}) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  const helperId = helper ? `${fieldId}-helper` : undefined;

  return (
    <label className={`iv-auth-field ${className}`.trim()} htmlFor={fieldId}>
      <span className="iv-auth-field__label">{label}</span>
      <span className="iv-auth-inputWrap">
        <input
          id={fieldId}
          className={`iv-auth-input${action ? " has-action" : ""}`}
          aria-describedby={helperId}
          {...inputProps}
        />
        {action ? <span className="iv-auth-inputAction">{action}</span> : null}
      </span>
      {helper ? (
        <span className="iv-auth-field__helper" id={helperId}>
          {helper}
        </span>
      ) : null}
    </label>
  );
}
