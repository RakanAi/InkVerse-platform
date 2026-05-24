import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminDialog from "../../features/admin/components/AdminDialog";

function moderationPill(label, tone) {
  return <span className={`admin-pill admin-pill--${tone}`}>{label}</span>;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [detailUser, setDetailUser] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/admin/users");
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setErr("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) =>
      [user.userName, user.email, ...(user.roles || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [q, users]);

  const updateModeration = async (user, patch) => {
    try {
      setBusyUserId(user.id);
      const payload = {
        isCommentBanned: patch.isCommentBanned ?? user.isCommentBanned,
        isBlocked: patch.isBlocked ?? user.isBlocked,
      };
      const res = await api.put(`/admin/users/${user.id}`, payload);
      const updated = res.data;
      setUsers((prev) => prev.map((item) => (item.id === user.id ? updated : item)));
      setDetailUser((current) => (current?.id === user.id ? updated : current));
    } catch (error) {
      console.error(error);
      window.alert(error?.response?.data || "Failed to update user moderation.");
    } finally {
      setBusyUserId("");
    }
  };

  if (loading) return <LoadingState text="Loading users..." />;
  if (err) return <ErrorState title="Cannot load users" subtitle={err} onRetry={load} />;

  return (
    <AdminSection flat>
      <div className="admin-toolbar">
        <div className="admin-toolbar__group admin-toolbar__group--grow">
          <TextField
            className="admin-search-field"
            value={q}
            onChange={setQ}
            placeholder="Search username, email, or role..."
          />
        </div>
      </div>

      <AdminTable
        className="admin-users-table-shell"
        tableClassName="admin-users-table"
        columns={[
          {
            key: "user",
            label: "User",
            width: "22%",
            render: (user) => (
              <div className="admin-simple-stack admin-simple-stack--sm">
                <p className="admin-row-title">{user.userName || "Unknown user"}</p>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email",
            width: "24%",
            headerClassName: "admin-table__mobile-hidden",
            cellClassName: "admin-table__mobile-hidden",
            render: (user) => (
              <div className="admin-simple-stack admin-simple-stack--sm">
                <p className="admin-row-note">{user.email || "No email"}</p>
              </div>
            ),
          },
          {
            key: "roles",
            label: "Roles",
            width: "18%",
            headerClassName: "admin-table__mobile-hidden",
            cellClassName: "admin-table__mobile-hidden",
            render: (user) => (
              <div className="admin-token-list">
                {(user.roles?.length ? user.roles : ["User"]).map((role) => (
                  <span key={role} className="admin-token">
                    {role}
                  </span>
                ))}
              </div>
            ),
          },
          {
            key: "comment",
            label: "Comment access",
            width: "14%",
            headerClassName: "admin-table__mobile-hidden",
            cellClassName: "admin-table__mobile-hidden",
            render: (user) =>
              user.isCommentBanned
                ? moderationPill("Comment banned", "danger")
                : moderationPill("Comments allowed", "success"),
          },
          {
            key: "account",
            label: "Account",
            width: "12%",
            headerClassName: "admin-table__mobile-hidden",
            cellClassName: "admin-table__mobile-hidden",
            render: (user) =>
              user.isBlocked
                ? moderationPill("Blocked", "warn")
                : moderationPill("Active", "success"),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            width: "18%",
            render: (user) => {
              const busy = busyUserId === user.id;
              const commentTooltip = busy
                ? "Updating comment access"
                : user.isCommentBanned
                  ? "Unban comments"
                  : "Ban comments";
              const accountTooltip = busy
                ? "Updating account status"
                : user.isBlocked
                  ? "Unblock user"
                  : "Block user";

              return (
                <div className="admin-action-row admin-users-actions">
                  <Button
                    variant="outline"
                    size="sm"
                    className="admin-book-action-icon admin-users-action-icon admin-users-actions__details admin-action-tooltip"
                    onClick={() => setDetailUser(user)}
                    aria-label="Details"
                    title="Details"
                    data-tooltip="Details"
                  >
                    <i className="bi bi-eye" />
                  </Button>
                  <Button
                    variant={user.isCommentBanned ? "outline" : "danger"}
                    size="sm"
                    className="admin-book-action-icon admin-users-action-icon admin-users-actions__desktop admin-action-tooltip"
                    disabled={busy}
                    aria-label={commentTooltip}
                    title={commentTooltip}
                    data-tooltip={commentTooltip}
                    onClick={() =>
                      updateModeration(user, {
                        isCommentBanned: !user.isCommentBanned,
                      })
                    }
                  >
                    <i
                      className={`bi ${
                        busy
                          ? "bi-arrow-repeat"
                          : user.isCommentBanned
                            ? "bi-chat-left-text"
                            : "bi-chat-left-dots"
                      }`}
                    />
                  </Button>
                  <Button
                    variant={user.isBlocked ? "outline" : "danger"}
                    size="sm"
                    className="admin-book-action-icon admin-users-action-icon admin-users-actions__desktop admin-action-tooltip"
                    disabled={busy}
                    aria-label={accountTooltip}
                    title={accountTooltip}
                    data-tooltip={accountTooltip}
                    onClick={() =>
                      updateModeration(user, {
                        isBlocked: !user.isBlocked,
                      })
                    }
                  >
                    <i
                      className={`bi ${
                        busy
                          ? "bi-arrow-repeat"
                          : user.isBlocked
                            ? "bi-person-check"
                            : "bi-person-slash"
                      }`}
                    />
                  </Button>
                </div>
              );
            },
          },
        ]}
        rows={filtered}
        rowKey="id"
        emptyTitle="No users found"
        emptySubtitle="Try another search query."
      />

      <AdminDialog
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title={detailUser?.userName || "User details"}
        subtitle="Review the hidden account details and moderation controls."
        size="md"
      >
        {detailUser ? (
          <div className="admin-users-detail">
            <div className="admin-users-detail__grid">
              <div className="admin-users-detail__item">
                <span className="admin-form-field__label">Username</span>
                <p className="admin-row-title">{detailUser.userName || "Unknown user"}</p>
              </div>

              <div className="admin-users-detail__item">
                <span className="admin-form-field__label">Email</span>
                <p className="admin-row-title">{detailUser.email || "No email"}</p>
              </div>

              <div className="admin-users-detail__item">
                <span className="admin-form-field__label">Roles</span>
                <div className="admin-token-list">
                  {(detailUser.roles?.length ? detailUser.roles : ["User"]).map((role) => (
                    <span key={role} className="admin-token">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="admin-users-detail__item">
                <span className="admin-form-field__label">Comment access</span>
                {detailUser.isCommentBanned
                  ? moderationPill("Comment banned", "danger")
                  : moderationPill("Comments allowed", "success")}
              </div>

              <div className="admin-users-detail__item">
                <span className="admin-form-field__label">Account</span>
                {detailUser.isBlocked
                  ? moderationPill("Blocked", "warn")
                  : moderationPill("Active", "success")}
              </div>
            </div>

            <div className="admin-inline-actions admin-users-detail__actions">
              <Button
                variant="outline"
                size="sm"
                disabled={busyUserId === detailUser.id}
                onClick={() =>
                  updateModeration(detailUser, {
                    isCommentBanned: !detailUser.isCommentBanned,
                  })
                }
              >
                {busyUserId === detailUser.id
                  ? "Updating..."
                  : detailUser.isCommentBanned
                    ? "Unban comments"
                    : "Ban comments"}
              </Button>
              <Button
                variant={detailUser.isBlocked ? "outline" : "danger"}
                size="sm"
                disabled={busyUserId === detailUser.id}
                onClick={() =>
                  updateModeration(detailUser, {
                    isBlocked: !detailUser.isBlocked,
                  })
                }
              >
                {busyUserId === detailUser.id
                  ? "Updating..."
                  : detailUser.isBlocked
                    ? "Unblock user"
                    : "Block user"}
              </Button>
            </div>
          </div>
        ) : null}
      </AdminDialog>
    </AdminSection>
  );
}
