import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";

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
    } catch (e) {
      console.error(e);
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
    return users.filter((u) =>
      [u.userName, u.email, ...(u.roles || [])]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(needle)),
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
      setUsers((prev) => prev.map((x) => (x.id === user.id ? updated : x)));
    } catch (e) {
      console.error(e);
      alert(e?.response?.data || "Failed to update user moderation.");
    } finally {
      setBusyUserId("");
    }
  };

  if (loading) return <LoadingState text="Loading users..." />;
  if (err) return <ErrorState title="Cannot load users" subtitle={err} onRetry={load} />;

  return (
    <div>
      <Surface className="admin-users-toolbar mb-3">
        <div className="admin-users-toolbar-grid">
          <TextField
            value={q}
            onChange={setQ}
            placeholder="Search by username, email, or role..."
          />
          <Button variant="outline" onClick={load}>
            Reload
          </Button>
        </div>
      </Surface>

      <Surface className="admin-users-table-wrap">
        {!filtered.length ? (
          <EmptyState title="No users found" subtitle="Try a different search query." />
        ) : (
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0 admin-table-modern">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th className="text-center">Comment Ban</th>
                  <th className="text-center">Account Block</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const busy = busyUserId === u.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="fw-semibold">{u.userName || "-"}</div>
                        <div className="small text-muted">ID: {u.id}</div>
                      </td>
                      <td>{u.email || "-"}</td>
                      <td>{(u.roles || []).join(", ") || "User"}</td>
                      <td className="text-center">
                        {u.isCommentBanned ? "Banned" : "Allowed"}
                      </td>
                      <td className="text-center">{u.isBlocked ? "Blocked" : "Active"}</td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              updateModeration(u, { isCommentBanned: !u.isCommentBanned })
                            }
                          >
                            {u.isCommentBanned ? "Unban Comment" : "Ban Comment"}
                          </Button>
                          <Button
                            variant={u.isBlocked ? "outline" : "danger"}
                            size="sm"
                            disabled={busy}
                            onClick={() => updateModeration(u, { isBlocked: !u.isBlocked })}
                          >
                            {u.isBlocked ? "Unblock User" : "Block User"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}
