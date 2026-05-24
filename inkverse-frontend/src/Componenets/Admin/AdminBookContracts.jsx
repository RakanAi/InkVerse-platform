import { useEffect, useMemo, useState } from "react";
import Button from "../../Shared/ui/Button";
import LinkButton from "../../Shared/ui/LinkButton";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminMetricCard from "../../features/admin/components/AdminMetricCard";
import AdminTable from "../../features/admin/components/AdminTable";
import {
  approveBookContract,
  fetchAdminBookContracts,
  rejectBookContract,
  revokeBookContract,
} from "../../Api/book-contracts.api";

const STATUS_FILTERS = [
  { key: "", label: "Candidates" },
  { key: "eligible", label: "Needs rights" },
  { key: "pending_review", label: "Pending review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "revoked", label: "Revoked" },
];

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function formatStatus(value) {
  if (!value) return "Not eligible";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusTone(status) {
  switch (status) {
    case "approved":
      return "success";
    case "rejected":
    case "revoked":
      return "danger";
    case "eligible":
      return "warn";
    default:
      return "neutral";
  }
}

function getMissingLabel(contract) {
  const missing = contract?.contractMissingRequirements ?? contract?.ContractMissingRequirements ?? [];
  if (!Array.isArray(missing) || missing.length === 0) return "All standards met.";
  return missing.join(" ");
}

export default function AdminBookContracts() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      setItems(await fetchAdminBookContracts(status));
    } catch (error) {
      console.error(error);
      setItems([]);
      setErr(error?.response?.data?.message || "Failed to load contract queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const metrics = useMemo(() => {
    const candidates = items.filter((item) => ["eligible", "pending_review"].includes(item.status)).length;
    const approved = items.filter((item) => item.status === "approved").length;
    const rightsNeeded = items.filter((item) => item.requiresRightsAttestation && !item.rightsAttested).length;

    return [
      { label: "In this view", value: items.length, meta: "Books matching the current queue filter.", tone: "brand" },
      { label: "Candidates", value: candidates, meta: "Eligible or pending review.", tone: candidates > 0 ? "warn" : "ok" },
      { label: "Rights needed", value: rightsNeeded, meta: "AU books waiting on author attestation.", tone: rightsNeeded > 0 ? "warn" : "ok" },
      { label: "Approved", value: approved, meta: "Books with active contracts.", tone: "ok" },
    ];
  }, [items]);

  const runAction = async (contract, action) => {
    const bookId = contract?.bookId ?? contract?.BookId;
    if (!bookId) return;

    let note = "";
    if (action === "approve") {
      note = window.prompt("Approval note (optional):", "") ?? "";
    }

    if (action === "reject") {
      note = window.prompt("Rejection reason:", "") ?? "";
      if (!note.trim()) return;
    }

    if (action === "revoke") {
      note = window.prompt("Revocation note (optional):", "") ?? "";
      if (!window.confirm("Revoke this book contract? Paid chapters will stop charging.")) return;
    }

    setActionId(`${action}:${bookId}`);
    try {
      if (action === "approve") await approveBookContract(bookId, note);
      if (action === "reject") await rejectBookContract(bookId, note);
      if (action === "revoke") await revokeBookContract(bookId, note);
      await load();
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data?.message || "Contract action failed.");
    } finally {
      setActionId("");
    }
  };

  if (loading) return <LoadingState text="Loading contract queue..." />;
  if (err) return <ErrorState title="Contract queue unavailable" subtitle={err} onRetry={load} />;

  return (
    <>
      <AdminSection
        title="Contract queue"
        subtitle="Review books that meet the platform contract standards, approve originals, and wait for AU rights attestation when needed."
        actions={
          <div className="admin-contract-filter-row">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key || "candidates"}
                type="button"
                variant={status === filter.key ? "primary" : "outline"}
                size="sm"
                onClick={() => setStatus(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        }
      >
        <div className="admin-contract-metric-grid">
          {metrics.map((metric) => (
            <AdminMetricCard
              key={metric.label}
              label={metric.label}
              value={formatNumber(metric.value)}
              meta={metric.meta}
              tone={metric.tone}
            />
          ))}
        </div>
      </AdminSection>

      <AdminSection flat>
        <AdminTable
          className="admin-contract-table-shell"
          tableClassName="admin-contract-table"
          columns={[
            {
              key: "book",
              label: "Book",
              width: "28%",
              render: (contract) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{contract.bookTitle ?? contract.BookTitle ?? "Untitled"}</p>
                  <p className="admin-row-note">{contract.authorName ?? contract.AuthorName ?? "Unknown author"}</p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              width: "15%",
              render: (contract) => (
                <div className="admin-contract-status-stack">
                  <span className={`admin-pill admin-pill--${statusTone(contract.status)}`}>
                    {formatStatus(contract.status)}
                  </span>
                  <span className="admin-row-note">
                    {contract.isContracted ? "Charging enabled" : "Charging locked"}
                  </span>
                </div>
              ),
            },
            {
              key: "requirements",
              label: "Requirements",
              width: "24%",
              render: (contract) => (
                <div className="admin-contract-requirements">
                  <span>{formatNumber(contract.wordCount)} / {formatNumber(contract.requiredWordCount)} words</span>
                  <span>{formatNumber(contract.chapterCount)} / {formatNumber(contract.requiredChapterCount)} chapters</span>
                  <span>{formatNumber(contract.totalViews)} / {formatNumber(contract.requiredTotalViews)} views</span>
                  <small>{getMissingLabel(contract)}</small>
                </div>
              ),
            },
            {
              key: "type",
              label: "Type",
              width: "16%",
              render: (contract) => (
                <div className="admin-contract-type-stack">
                  <span>{contract.verseType ?? "Unknown"}</span>
                  <small>{contract.originType ?? "Unknown origin"}</small>
                  {contract.requiresRightsAttestation ? (
                    <small>{contract.rightsAttested ? "AU rights attested" : "Awaiting AU rights"}</small>
                  ) : (
                    <small>Rights attestation not needed</small>
                  )}
                </div>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              width: "17%",
              render: (contract) => {
                const bookId = contract.bookId ?? contract.BookId;
                const currentStatus = contract.status;
                const canApprove = Boolean(contract.canApprove);
                const canReject = ["eligible", "pending_review"].includes(currentStatus);
                const canRevoke = currentStatus === "approved";

                return (
                  <div className="admin-book-actions admin-book-actions--inline">
                    <LinkButton
                      to={`/admin/books/${bookId}`}
                      variant="outline"
                      size="sm"
                      className="admin-book-action-icon"
                      aria-label="Open book"
                      title="Open book"
                    >
                      <i className="bi bi-box-arrow-up-right" />
                    </LinkButton>
                    {canApprove ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="admin-book-action-icon"
                        disabled={actionId === `approve:${bookId}`}
                        onClick={() => runAction(contract, "approve")}
                        aria-label="Approve contract"
                        title="Approve"
                      >
                        <i className="bi bi-check2" />
                      </Button>
                    ) : null}
                    {canReject ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="admin-book-action-icon"
                        disabled={actionId === `reject:${bookId}`}
                        onClick={() => runAction(contract, "reject")}
                        aria-label="Reject contract"
                        title="Reject"
                      >
                        <i className="bi bi-x-lg" />
                      </Button>
                    ) : null}
                    {canRevoke ? (
                      <Button
                        variant="danger"
                        size="sm"
                        className="admin-book-action-icon"
                        disabled={actionId === `revoke:${bookId}`}
                        onClick={() => runAction(contract, "revoke")}
                        aria-label="Revoke contract"
                        title="Revoke"
                      >
                        <i className="bi bi-slash-circle" />
                      </Button>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
          rows={items}
          rowKey={(contract) => contract.id ?? contract.bookId}
          emptyTitle="No books in this contract queue"
          emptySubtitle="Books appear here after meeting the contract standards."
        />
      </AdminSection>
    </>
  );
}
