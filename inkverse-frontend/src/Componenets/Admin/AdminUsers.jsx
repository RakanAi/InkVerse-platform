import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";

function moderationPill(label, tone) {
  return <span className={`admin-pill admin-pill--${tone}`}>{label}</span>;
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [busyUserId, setBusyUserId] = useState("");

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
        columns={[
          {
            key: "user",
            label: "User",
            render: (user) => (
              <div className="admin-simple-stack admin-simple-stack--sm">
                <p className="admin-row-title">{user.userName || "Unknown user"}</p>
                <p className="admin-row-note">{user.email || "No email"}</p>
                <p className="admin-row-note">ID: {user.id}</p>
              </div>
            ),
          },
          {
            key: "roles",
            label: "Roles",
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
            render: (user) =>
              user.isCommentBanned
                ? moderationPill("Comment banned", "danger")
                : moderationPill("Comments allowed", "success"),
          },
          {
            key: "account",
            label: "Account",
            render: (user) =>
              user.isBlocked
                ? moderationPill("Blocked", "warn")
                : moderationPill("Active", "success"),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            render: (user) => {
              const busy = busyUserId === user.id;

              return (
                <div className="admin-action-row">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      updateModeration(user, {
                        isCommentBanned: !user.isCommentBanned,
                      })
                    }
                  >
                    {busy
                      ? "Updating..."
                      : user.isCommentBanned
                        ? "Unban comments"
                        : "Ban comments"}
                  </Button>
                  <Button
                    variant={user.isBlocked ? "outline" : "danger"}
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      updateModeration(user, {
                        isBlocked: !user.isBlocked,
                      })
                    }
                  >
                    {busy
                      ? "Updating..."
                      : user.isBlocked
                        ? "Unblock user"
                        : "Block user"}
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
    </AdminSection>
  );
}
