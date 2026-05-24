import { useEffect, useMemo, useState } from "react";
import Button from "../../Shared/ui/Button";
import LinkButton from "../../Shared/ui/LinkButton";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminDialog from "../../features/admin/components/AdminDialog";
import {
  dismissAdminReport,
  fetchAdminReport,
  fetchAdminReports,
  resolveAdminReport,
} from "../../Api/reports.api";
import {
  REPORT_TARGET_LABELS,
  getReportReasonLabel,
  getReportTargetLabel,
} from "../../features/reports/report-options";

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "", label: "All" },
];

const TYPE_FILTERS = [
  { value: "", label: "All types" },
  ...Object.entries(REPORT_TARGET_LABELS).map(([value, label]) => ({ value, label })),
];

function valueOf(item, camelKey, pascalKey = "") {
  return item?.[camelKey] ?? item?.[pascalKey || camelKey[0].toUpperCase() + camelKey.slice(1)];
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

function statusTone(status) {
  switch (status) {
    case "resolved":
      return "success";
    case "dismissed":
      return "neutral";
    default:
      return "warn";
  }
}

function statusLabel(status) {
  if (!status) return "Pending";
  return String(status).replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function targetLabel(report) {
  const type = valueOf(report, "targetType");
  return getReportTargetLabel(type);
}

function targetTitle(report) {
  return valueOf(report, "targetTitle") || targetLabel(report);
}

function shortText(value, fallback = "No preview saved.") {
  const text = String(value || "").trim();
  return text || fallback;
}

export default function AdminReports() {
  const [status, setStatus] = useState("pending");
  const [type, setType] = useState("");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [action, setAction] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      setReports(await fetchAdminReports({ status, type }));
    } catch (error) {
      console.error(error);
      setReports([]);
      setErr(error?.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, type]);

  const metrics = useMemo(() => {
    const pending = reports.filter((report) => valueOf(report, "status") === "pending").length;
    const resolved = reports.filter((report) => valueOf(report, "status") === "resolved").length;
    const dismissed = reports.filter((report) => valueOf(report, "status") === "dismissed").length;

    return [
      { label: "In this view", value: reports.length, meta: "Reports matching the current filters.", tone: "brand" },
      { label: "Pending", value: pending, meta: "Needs admin review.", tone: pending > 0 ? "warn" : "ok" },
      { label: "Resolved", value: resolved, meta: "Action taken or handled.", tone: "ok" },
      { label: "Dismissed", value: dismissed, meta: "Reviewed and closed without action.", tone: "default" },
    ];
  }, [reports]);

  const openDetail = async (report) => {
    const id = valueOf(report, "id");
    if (!id) return;

    try {
      setDetailLoading(true);
      setSelected(report);
      setAdminNote(valueOf(report, "adminNote") || "");
      const full = await fetchAdminReport(id);
      setSelected(full);
      setAdminNote(valueOf(full, "adminNote") || "");
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Could not load report details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    if (action) return;
    setSelected(null);
    setAdminNote("");
  };

  const decide = async (decision) => {
    const id = valueOf(selected, "id");
    if (!id) return;

    try {
      setAction(decision);
      const updated =
        decision === "resolve"
          ? await resolveAdminReport(id, adminNote)
          : await dismissAdminReport(id, adminNote);
      setSelected(updated);
      setAdminNote(valueOf(updated, "adminNote") || "");
      await load();
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Could not update report.");
    } finally {
      setAction("");
    }
  };

  if (loading) return <LoadingState text="Loading reports..." />;
  if (err) return <ErrorState title="Reports unavailable" subtitle={err} onRetry={load} />;

  return (
    <>
      <AdminSection
        title="Reports"
        subtitle="Review user reports for books, reviews, comments, replies, and public profiles."
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
              <span className="admin-form-field__label">Type</span>
              <select className="admin-select" value={type} onChange={(event) => setType(event.target.value)}>
                {TYPE_FILTERS.map((filter) => (
                  <option key={filter.value || "all"} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>
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
      </AdminSection>

      <AdminSection flat>
        <AdminTable
          className="admin-reports-table-shell"
          tableClassName="admin-reports-table"
          columns={[
            {
              key: "target",
              label: "Target",
              width: "28%",
              render: (report) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{targetTitle(report)}</p>
                  <p className="admin-row-note">{targetLabel(report)}</p>
                </div>
              ),
            },
            {
              key: "reason",
              label: "Reason",
              width: "16%",
              render: (report) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{getReportReasonLabel(valueOf(report, "reason"))}</p>
                  <p className="admin-row-note">{shortText(valueOf(report, "details"), "No note.")}</p>
                </div>
              ),
            },
            {
              key: "people",
              label: "People",
              width: "20%",
              headerClassName: "admin-table__mobile-hidden",
              cellClassName: "admin-table__mobile-hidden",
              render: (report) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">From {valueOf(report, "reporterName") || "Unknown reporter"}</p>
                  <p className="admin-row-note">Owner {valueOf(report, "targetOwnerName") || "Unknown owner"}</p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              width: "14%",
              render: (report) => {
                const currentStatus = valueOf(report, "status") || "pending";
                return (
                  <div className="admin-simple-stack admin-simple-stack--sm">
                    <span className={`admin-pill admin-pill--${statusTone(currentStatus)}`}>
                      {statusLabel(currentStatus)}
                    </span>
                    <p className="admin-row-note">{formatDate(valueOf(report, "createdAt"))}</p>
                  </div>
                );
              },
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              width: "14%",
              render: (report) => (
                <div className="admin-book-actions admin-book-actions--inline">
                  <Button
                    variant="outline"
                    size="sm"
                    className="admin-book-action-icon admin-action-tooltip"
                    aria-label="View report"
                    title="View report"
                    data-tooltip="View report"
                    onClick={() => openDetail(report)}
                  >
                    <i className="bi bi-eye" />
                  </Button>
                  {valueOf(report, "adminTargetUrl") ? (
                    <LinkButton
                      to={valueOf(report, "adminTargetUrl")}
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
          rows={reports}
          rowKey={(report) => valueOf(report, "id")}
          emptyTitle="No reports found"
          emptySubtitle="Reports matching this filter will appear here."
        />
      </AdminSection>

      <AdminDialog
        open={!!selected}
        onClose={closeDetail}
        title={selected ? targetTitle(selected) : "Report details"}
        subtitle={selected ? `${targetLabel(selected)} · ${statusLabel(valueOf(selected, "status"))}` : ""}
        size="lg"
        className="admin-report-dialog"
      >
        {selected ? (
          <div className="admin-report-detail">
            {detailLoading ? <p className="admin-row-note">Loading full report...</p> : null}

            <div className="admin-report-detail__grid">
              <section className="admin-report-card">
                <span className="admin-form-field__label">Reason</span>
                <p className="admin-row-title">{getReportReasonLabel(valueOf(selected, "reason"))}</p>
                <p className="admin-row-note">{shortText(valueOf(selected, "details"), "Reporter did not add details.")}</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Reporter</span>
                <p className="admin-row-title">{valueOf(selected, "reporterName") || "Unknown reporter"}</p>
                <p className="admin-row-note">{valueOf(selected, "reporterEmail") || valueOf(selected, "reporterId") || "No email"}</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Target owner</span>
                <p className="admin-row-title">{valueOf(selected, "targetOwnerName") || "Unknown owner"}</p>
                <p className="admin-row-note">{valueOf(selected, "targetOwnerEmail") || valueOf(selected, "targetOwnerId") || "No owner saved"}</p>
              </section>

              <section className="admin-report-card">
                <span className="admin-form-field__label">Created</span>
                <p className="admin-row-title">{formatDate(valueOf(selected, "createdAt"))}</p>
                <p className="admin-row-note">
                  {valueOf(selected, "resolvedAt")
                    ? `Closed by ${valueOf(selected, "resolvedByName") || "admin"} on ${formatDate(valueOf(selected, "resolvedAt"))}`
                    : "Still open."}
                </p>
              </section>
            </div>

            <section className="admin-report-context">
              <span className="admin-form-field__label">Target context</span>
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

            <label className="admin-form-field">
              <span className="admin-form-field__label">Admin note</span>
              <textarea
                className="admin-textarea"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Add an internal moderation note..."
              />
            </label>

            <div className="admin-dialog__footer admin-report-detail__actions">
              <Button variant="outline" onClick={closeDetail} disabled={!!action}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => decide("dismiss")}
                disabled={!!action || valueOf(selected, "status") === "dismissed"}
              >
                {action === "dismiss" ? "Dismissing..." : "Dismiss"}
              </Button>
              <Button
                variant="primary"
                onClick={() => decide("resolve")}
                disabled={!!action || valueOf(selected, "status") === "resolved"}
              >
                {action === "resolve" ? "Resolving..." : "Resolve"}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminDialog>
    </>
  );
}
