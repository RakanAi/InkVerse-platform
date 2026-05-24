import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AuthContext from "../../Context/AuthProvider";
import { createContentReport } from "../../Api/reports.api";
import { REPORT_REASONS, getReportTargetLabel } from "./report-options";
import "./reports.css";

export default function ReportDialog({
  open,
  targetType,
  targetId,
  targetLabel,
  onClose,
}) {
  const { auth, openLogin } = useContext(AuthContext);
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason(REPORT_REASONS[0].value);
    setDetails("");
    setError("");
    setSuccess("");
  }, [open, targetId, targetType]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const isLoggedIn = !!auth?.accessToken;
  const targetName = targetLabel || getReportTargetLabel(targetType);

  const submit = async () => {
    if (!isLoggedIn) {
      openLogin?.();
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createContentReport({
        targetType,
        targetId: String(targetId ?? ""),
        reason,
        details,
      });
      setSuccess("Thanks. Your report was sent to the moderation queue.");
    } catch (submitError) {
      console.error("Report submit failed:", submitError);
      if (submitError?.response?.status === 401) {
        setError("Please sign in before reporting.");
      } else {
        setError(submitError?.response?.data?.message || "Could not submit this report.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="iv-report-dialog-backdrop" role="presentation" onClick={onClose}>
      <section
        className="iv-report-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Report ${targetName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="iv-report-dialog__close"
          aria-label="Close report dialog"
          onClick={onClose}
        >
          ×
        </button>

        <header className="iv-report-dialog__head">
          <span>Report</span>
          <h2>{targetName}</h2>
          <p>Tell the moderation team what needs a closer look.</p>
        </header>

        {!isLoggedIn ? (
          <div className="iv-report-dialog__signin">
            <p>You need to sign in before sending a report.</p>
            <button type="button" onClick={openLogin}>
              Sign in
            </button>
          </div>
        ) : success ? (
          <div className="iv-report-dialog__success">
            <p>{success}</p>
            <button type="button" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <>
            <label className="iv-report-field">
              <span>Reason</span>
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                {REPORT_REASONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="iv-report-field">
              <span>Details</span>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Optional context for the moderation team"
                rows={5}
                maxLength={2000}
              />
            </label>

            {error ? <div className="iv-report-dialog__error">{error}</div> : null}

            <div className="iv-report-dialog__actions">
              <button type="button" className="iv-report-dialog__ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="iv-report-dialog__submit" onClick={submit} disabled={submitting}>
                {submitting ? "Sending..." : "Submit report"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>,
    document.body,
  );
}
