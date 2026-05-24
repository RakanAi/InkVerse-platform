import { useEffect, useMemo, useState } from "react";
import Button from "../../Shared/ui/Button";
import LinkButton from "../../Shared/ui/LinkButton";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminDialog from "../../features/admin/components/AdminDialog";
import {
  decideAdminModerationCase,
  fetchAdminModerationCase,
  fetchAdminModerationCases,
  runAdminClawbotModeration,
} from "../../Api/moderation.api";
import { getReportTargetLabel } from "../../features/reports/report-options";

const STATUS_FILTERS = [
  { value: "open", label: "Open" },
  { value: "under_review", label: "Under review" },
  { value: "action_taken", label: "Action taken" },
  { value: "dismissed", label: "Dismissed" },
  { value: "closed", label: "Closed" },
  { value: "", label: "All" },
];

const SOURCE_FILTERS = [
  { value: "", label: "All sources" },
  { value: "clawbot", label: "Clawbot" },
  { value: "user_report", label: "User reports" },
  { value: "admin", label: "Admin" },
];

const TYPE_FILTERS = [
  { value: "", label: "All targets" },
  { value: "book", label: "Book" },
  { value: "review", label: "Review" },
  { value: "review_reply", label: "Review reply" },
  { value: "chapter_comment", label: "Chapter comment" },
  { value: "user", label: "User" },
];

const ACTION_OPTIONS = [
  { value: "mark_under_review", label: "Keep under review" },
  { value: "hide_content", label: "Hide content" },
  { value: "restore_content", label: "Restore content" },
  { value: "comment_ban_user", label: "Comment-ban user" },
  { value: "block_user", label: "Block user" },
  { value: "hide_book", label: "Hide book" },
  { value: "dismiss", label: "Dismiss" },
  { value: "close", label: "Close" },
];

function valueOf(item, camelKey, pascalKey = "") {
  return item?.[camelKey] ?? item?.[pascalKey || camelKey[0].toUpperCase() + camelKey.slice(1)];
}

function nice(value, fallback = "Unknown") {
  if (!value) return fallback;
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function severityTone(severity) {
  switch (severity) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warn";
    default:
      return "neutral";
  }
}

function statusTone(status) {
  switch (status) {
    case "action_taken":
    case "closed":
      return "success";
    case "dismissed":
      return "neutral";
    case "under_review":
      return "brand";
    default:
      return "warn";
  }
}

function targetLabel(item) {
  return getReportTargetLabel(valueOf(item, "targetType"));
}

function targetTitle(item) {
  return valueOf(item, "title") || targetLabel(item);
}

function shortText(value, fallback = "No preview saved.") {
  const text = String(value || "").trim();
  return text || fallback;
}

export default function AdminModeration() {
  const [status, setStatus] = useState("open");
  const [source, setSource] = useState("");
  const [type, setType] = useState("");
  const [requiresAdmin, setRequiresAdmin] = useState("true");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [decision, setDecision] = useState("mark_under_review");
  const [adminNote, setAdminNote] = useState("");
  const [reporterReply, setReporterReply] = useState("");
  const [ownerReply, setOwnerReply] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [runSummary, setRunSummary] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const params = { status, source, type };
      if (requiresAdmin !== "") params.requiresAdmin = requiresAdmin === "true";
      setCases(await fetchAdminModerationCases(params));
    } catch (error) {
      console.error(error);
      setCases([]);
      setErr(error?.response?.data?.message || "Failed to load moderation cases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, source, type, requiresAdmin]);

  const metrics = useMemo(() => {
    const needsAdmin = cases.filter((item) => valueOf(item, "requiresAdmin")).length;
    const autoHandled = cases.filter((item) => valueOf(item, "isAutoHandled")).length;
    const highRisk = cases.filter((item) => ["high", "critical"].includes(valueOf(item, "severity"))).length;

    return [
      { label: "In this view", value: cases.length, meta: "Cases matching the current filters.", tone: "brand" },
      { label: "Needs you", value: needsAdmin, meta: "Clawbot could not safely finish these.", tone: needsAdmin ? "warn" : "ok" },
      { label: "Auto handled", value: autoHandled, meta: "Already handled by Clawbot.", tone: "ok" },
      { label: "High risk", value: highRisk, meta: "Legal, safety, or account-impacting cases.", tone: highRisk ? "danger" : "default" },
    ];
  }, [cases]);

  const openDetail = async (item) => {
    const id = valueOf(item, "id");
    if (!id) return;

    try {
      setDetailLoading(true);
      setSelected(item);
      setDecision(valueOf(item, "suggestedAction") || "mark_under_review");
      setAdminNote(valueOf(item, "adminNote") || "");
      setReporterReply("");
      setOwnerReply("");
      const full = await fetchAdminModerationCase(id);
      setSelected(full);
      setDecision(valueOf(full, "suggestedAction") || "mark_under_review");
      setAdminNote(valueOf(full, "adminNote") || "");
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Could not load moderation case.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (actionLoading) return;
    setSelected(null);
    setAdminNote("");
    setReporterReply("");
    setOwnerReply("");
  };

  const runClawbot = async () => {
    try {
      setActionLoading("run");
      const summary = await runAdminClawbotModeration(80);
      setRunSummary(summary);
      if (Number(valueOf(summary, "requiresAdmin") ?? 0) > 0) {
        setStatus("open");
        setRequiresAdmin("true");
      } else if (Number(valueOf(summary, "autoHandled") ?? 0) > 0) {
        setStatus("action_taken");
        setRequiresAdmin("false");
      } else {
        await load();
      }
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Clawbot scan failed.");
    } finally {
      setActionLoading("");
    }
  };

  const submitDecision = async () => {
    const id = valueOf(selected, "id");
    if (!id) return;

    try {
      setActionLoading("decision");
      const updated = await decideAdminModerationCase(id, {
        action: decision,
        adminNote,
        messageToReporter: reporterReply,
        messageToTargetOwner: ownerReply,
      });
      setSelected(updated);
      setAdminNote(valueOf(updated, "adminNote") || "");
      setReporterReply("");
      setOwnerReply("");
      await load();
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Could not apply moderation action.");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <LoadingState text="Loading moderation..." />;
  if (err) return <ErrorState title="Moderation unavailable" subtitle={err} onRetry={load} />;

  return (
    <>
      <AdminSection
        title="Clawbot moderation"
        subtitle="Let Clawbot clear obvious spam and keep the judgment calls in front of you."
        actions={
          <div className="admin-moderation-actions">
            <Button variant="primary" onClick={runClawbot} disabled={actionLoading === "run"}>
              {actionLoading === "run" ? "Scanning..." : "Run Clawbot scan"}
            </Button>
          </div>
        }
      >
        <div className="admin-contract-metric-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className={`admin-metric admin-metric--${metric.tone || "default"}`.trim()}>
              <p className="admin-metric__label">{metric.label}</p>
              <p className="admin-metric__value">{Number(metric.value ?? 0).toLocaleString()}</p>
              <p className="admin-metric__meta">{metric.meta}</p>
            </div>
          ))}
        </div>

        {runSummary ? (
          <div className="admin-moderation-run-note">
            <strong>Last scan:</strong> {Number(valueOf(runSummary, "scanned") ?? 0).toLocaleString()} scanned,
            {" "}{Number(valueOf(runSummary, "createdCases") ?? 0).toLocaleString()} cases created,
            {" "}{Number(valueOf(runSummary, "autoHandled") ?? 0).toLocaleString()} auto-handled,
            {" "}{Number(valueOf(runSummary, "requiresAdmin") ?? 0).toLocaleString()} left for review.
          </div>
        ) : null}
      </AdminSection>

      <AdminSection
        title="Moderation queue"
        actions={
          <div className="admin-reports-filter-row">
            <label className="admin-form-field admin-reports-filter">
              <span className="admin-form-field__label">Status</span>
              <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value || "all"} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field admin-reports-filter">
              <span className="admin-form-field__label">Source</span>
              <select className="admin-select" value={source} onChange={(event) => setSource(event.target.value)}>
                {SOURCE_FILTERS.map((filter) => (
                  <option key={filter.value || "all"} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field admin-reports-filter">
              <span className="admin-form-field__label">Target</span>
              <select className="admin-select" value={type} onChange={(event) => setType(event.target.value)}>
                {TYPE_FILTERS.map((filter) => (
                  <option key={filter.value || "all"} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="admin-form-field admin-reports-filter">
              <span className="admin-form-field__label">Queue</span>
              <select className="admin-select" value={requiresAdmin} onChange={(event) => setRequiresAdmin(event.target.value)}>
                <option value="true">Needs admin</option>
                <option value="false">Handled</option>
                <option value="">All</option>
              </select>
            </label>
          </div>
        }
      >
        <AdminTable
          className="admin-reports-table-shell"
          tableClassName="admin-reports-table"
          columns={[
            {
              key: "target",
              label: "Target",
              width: "30%",
              render: (item) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{targetTitle(item)}</p>
                  <p className="admin-row-note">{targetLabel(item)} · {nice(valueOf(item, "category"), "Other")}</p>
                </div>
              ),
            },
            {
              key: "clawbot",
              label: "Clawbot",
              width: "28%",
              render: (item) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{shortText(valueOf(item, "clawbotSummary"), "No analysis saved.")}</p>
                  <p className="admin-row-note">
                    {Number(valueOf(item, "confidenceScore") ?? 0)}% confidence · Suggests {nice(valueOf(item, "suggestedAction"), "No action")}
                  </p>
                </div>
              ),
            },
            {
              key: "state",
              label: "State",
              width: "18%",
              render: (item) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <span className={`admin-pill admin-pill--${statusTone(valueOf(item, "status"))}`}>
                    {nice(valueOf(item, "status"), "Open")}
                  </span>
                  <span className={`admin-pill admin-pill--${severityTone(valueOf(item, "severity"))}`}>
                    {nice(valueOf(item, "severity"), "Low")}
                  </span>
                </div>
              ),
            },
            {
              key: "source",
              label: "Source",
              width: "12%",
              headerClassName: "admin-table__mobile-hidden",
              cellClassName: "admin-table__mobile-hidden",
              render: (item) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{nice(valueOf(item, "source"), "Clawbot")}</p>
                  <p className="admin-row-note">{formatDate(valueOf(item, "createdAt"))}</p>
                </div>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              width: "12%",
              render: (item) => (
                <div className="admin-book-actions admin-book-actions--inline">
                  <Button
                    variant="outline"
                    size="sm"
                    className="admin-book-action-icon admin-action-tooltip"
                    aria-label="View case"
                    title="View case"
                    data-tooltip="View case"
                    onClick={() => openDetail(item)}
                  >
                    <i className="bi bi-eye" />
                  </Button>
                  {valueOf(item, "adminTargetUrl") ? (
                    <LinkButton
                      to={valueOf(item, "adminTargetUrl")}
                      variant="outline"
                      size="sm"
                      className="admin-book-action-icon admin-action-tooltip"
                      aria-label="Open target"
                      title="Open target"
                      data-tooltip="Open target"
                    >
                      <i className="bi bi-box-arrow-up-right" />
                    </LinkButton>
                  ) : null}
                </div>
              ),
            },
          ]}
          rows={cases}
          rowKey={(item) => valueOf(item, "id")}
          emptyTitle="No moderation cases"
          emptySubtitle="When Clawbot or reports find something, it will appear here."
        />
      </AdminSection>

      <AdminDialog
        open={!!selected}
        onClose={closeDetail}
        title={selected ? targetTitle(selected) : "Moderation case"}
        subtitle={selected ? `${targetLabel(selected)} · ${nice(valueOf(selected, "status"), "Open")}` : ""}
        size="lg"
        className="admin-report-dialog admin-moderation-dialog"
      >
        {selected ? (
          <div className="admin-report-detail">
            {detailLoading ? <p className="admin-row-note">Loading full case...</p> : null}

            <div className="admin-report-detail__grid">
              <section className="admin-report-card">
                <span className="admin-form-field__label">Clawbot category</span>
                <p className="admin-row-title">{nice(valueOf(selected, "category"), "Other")}</p>
                <p className="admin-row-note">{Number(valueOf(selected, "confidenceScore") ?? 0)}% confidence</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Severity</span>
                <p className="admin-row-title">{nice(valueOf(selected, "severity"), "Low")}</p>
                <p className="admin-row-note">{valueOf(selected, "requiresAdmin") ? "Needs your decision." : "No longer in the admin queue."}</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Owner</span>
                <p className="admin-row-title">{valueOf(selected, "targetOwnerName") || "Unknown owner"}</p>
                <p className="admin-row-note">{valueOf(selected, "targetOwnerId") || "No owner saved"}</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Created</span>
                <p className="admin-row-title">{formatDate(valueOf(selected, "createdAt"))}</p>
                <p className="admin-row-note">
                  {valueOf(selected, "isAutoHandled")
                    ? `Auto-handled: ${nice(valueOf(selected, "autoAction"), "Action")}`
                    : `Suggested: ${nice(valueOf(selected, "suggestedAction"), "No action")}`}
                </p>
              </section>
            </div>

            <section className="admin-report-context">
              <span className="admin-form-field__label">Target snapshot</span>
              <h3>{targetTitle(selected)}</h3>
              {valueOf(selected, "targetContext") ? (
                <p className="admin-row-note">{valueOf(selected, "targetContext")}</p>
              ) : null}
              <p>{shortText(valueOf(selected, "targetPreview"), "No target preview was captured.")}</p>
              <div className="admin-inline-actions">
                {valueOf(selected, "targetUrl") ? (
                  <LinkButton to={valueOf(selected, "targetUrl")} variant="outline" size="sm">
                    Public target
                  </LinkButton>
                ) : null}
                {valueOf(selected, "adminTargetUrl") ? (
                  <LinkButton to={valueOf(selected, "adminTargetUrl")} variant="outline" size="sm">
                    Admin target
                  </LinkButton>
                ) : null}
              </div>
            </section>

            <section className="admin-report-context">
              <span className="admin-form-field__label">Case thread</span>
              <div className="admin-moderation-thread">
                {(valueOf(selected, "messages") || []).length ? (
                  valueOf(selected, "messages").map((message) => (
                    <div key={valueOf(message, "id")} className="admin-moderation-message">
                      <div>
                        <strong>{nice(valueOf(message, "audience"), "Internal")}</strong>
                        <span>{formatDate(valueOf(message, "createdAt"))}</span>
                      </div>
                      <p>{valueOf(message, "body")}</p>
                    </div>
                  ))
                ) : (
                  <p className="admin-row-note">No messages yet.</p>
                )}
              </div>
            </section>

            <div className="admin-report-detail__grid">
              <label className="admin-form-field">
                <span className="admin-form-field__label">Action</span>
                <select className="admin-select" value={decision} onChange={(event) => setDecision(event.target.value)}>
                  {ACTION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-form-field">
                <span className="admin-form-field__label">Internal note</span>
                <textarea
                  className="admin-textarea"
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Add what Clawbot/admin did and why..."
                />
              </label>

              <label className="admin-form-field">
                <span className="admin-form-field__label">Reply to reporter</span>
                <textarea
                  className="admin-textarea"
                  value={reporterReply}
                  onChange={(event) => setReporterReply(event.target.value)}
                  placeholder="Saved for future user-facing report replies..."
                />
              </label>

              <label className="admin-form-field">
                <span className="admin-form-field__label">Reply to content owner</span>
                <textarea
                  className="admin-textarea"
                  value={ownerReply}
                  onChange={(event) => setOwnerReply(event.target.value)}
                  placeholder="Saved for future warnings/support chat..."
                />
              </label>
            </div>

            <div className="admin-dialog__footer admin-report-detail__actions">
              <Button variant="outline" onClick={closeDetail} disabled={!!actionLoading}>
                Close
              </Button>
              <Button variant="primary" onClick={submitDecision} disabled={!!actionLoading}>
                {actionLoading === "decision" ? "Applying..." : "Apply action"}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminDialog>
    </>
  );
}
