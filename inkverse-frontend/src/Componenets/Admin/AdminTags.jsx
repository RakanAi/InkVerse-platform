import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminFormField from "../../features/admin/components/AdminFormField";

export default function AdminTags() {
  const API_BASE = "/admin/tags";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [newName, setNewName] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const getId = (tag) => tag.id ?? tag.Id ?? tag.ID;
  const getName = (tag) => tag.name ?? tag.Name ?? "";
  const getActive = (tag) => (tag.isActive ?? tag.IsActive ?? true) === true;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`${API_BASE}?includeInactive=true`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Load tags failed:", error);
      setItems([]);
      setErr("Failed to load tags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSort = (key) => {
    setSortBy((current) => {
      if (current !== key) {
        setSortDir("asc");
        return key;
      }

      setSortDir((value) => (value === "asc" ? "desc" : "asc"));
      return current;
    });
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const filteredAndSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const filtered = needle
      ? items.filter((tag) => getName(tag).toLowerCase().includes(needle))
      : items;

    const dir = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((left, right) => {
      if (sortBy === "id") {
        return (Number(getId(left)) - Number(getId(right))) * dir;
      }

      if (sortBy === "active") {
        return ((getActive(left) ? 1 : 0) - (getActive(right) ? 1 : 0)) * dir;
      }

      return getName(left).localeCompare(getName(right)) * dir;
    });
  }, [items, q, sortBy, sortDir]);

  const startEdit = (tag) => {
    setErr("");
    setEditingId(getId(tag));
    setEditName(getName(tag));
    setEditActive(getActive(tag));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditActive(true);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) {
      setErr("Tag name is required.");
      return;
    }

    try {
      setCreating(true);
      setErr("");
      await api.post(API_BASE, { name, isActive: newActive });
      setNewName("");
      setNewActive(true);
      await load();
    } catch (error) {
      console.error("Create tag failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to create tag.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId) return;
    if (!name) {
      setErr("Tag name is required.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      await api.put(`${API_BASE}/${editingId}`, { name, isActive: editActive });
      cancelEdit();
      await load();
    } catch (error) {
      console.error("Update tag failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to update tag.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this tag? This cannot be undone.")) return;

    try {
      setDeletingId(id);
      setErr("");
      await api.delete(`${API_BASE}/${id}`);
      await load();
    } catch (error) {
      console.error("Delete tag failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to delete tag.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState text="Loading tags..." />;
  if (err && !items.length) return <ErrorState title="Cannot load tags" subtitle={err} onRetry={load} />;

  return (
    <AdminSection flat>
      {err ? <div className="admin-alert">{String(err)}</div> : null}

      <div className="admin-form-grid">
        <AdminFormField label="Tag name" className="admin-col-8">
          <input
            className="admin-input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            placeholder="Tag name"
          />
        </AdminFormField>

        <div className="admin-col-2 admin-form-actions" style={{ justifyContent: "flex-start", alignItems: "flex-end" }}>
          <label className="admin-inline-check">
            <input
              type="checkbox"
              checked={newActive}
              onChange={(event) => setNewActive(event.target.checked)}
            />
            <span>Active</span>
          </label>
        </div>

        <div className="admin-col-2 admin-form-actions" style={{ alignItems: "flex-end" }}>
          <Button onClick={create} disabled={creating}>
            {creating ? "Adding..." : "Add tag"}
          </Button>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-toolbar__group admin-toolbar__group--grow">
          <TextField
            className="admin-search-field"
            value={q}
            onChange={setQ}
            placeholder="Search tags..."
          />
        </div>
        <span className="admin-page-note">
          {filteredAndSorted.length} of {items.length}
        </span>
      </div>

      <AdminTable
        compact
        columns={[
          {
            key: "id",
            label: "Id",
            width: 90,
            onHeaderClick: () => onSort("id"),
            sortIndicator: sortIndicator("id"),
            render: (tag) => <span className="admin-row-note">{getId(tag)}</span>,
          },
          {
            key: "name",
            label: "Name",
            onHeaderClick: () => onSort("name"),
            sortIndicator: sortIndicator("name"),
            render: (tag) =>
              editingId === getId(tag) ? (
                <input
                  className="admin-input"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              ) : (
                <p className="admin-row-title">{getName(tag)}</p>
              ),
          },
          {
            key: "active",
            label: "Active",
            width: 130,
            onHeaderClick: () => onSort("active"),
            sortIndicator: sortIndicator("active"),
            render: (tag) =>
              editingId === getId(tag) ? (
                <label className="admin-inline-check">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(event) => setEditActive(event.target.checked)}
                  />
                  <span>{editActive ? "Yes" : "No"}</span>
                </label>
              ) : (
                <span className={`admin-pill ${getActive(tag) ? "admin-pill--success" : "admin-pill--neutral"}`}>
                  {getActive(tag) ? "Active" : "Inactive"}
                </span>
              ),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            width: 240,
            render: (tag) =>
              editingId === getId(tag) ? (
                <div className="admin-action-row">
                  <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveEdit} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              ) : (
                <div className="admin-action-row">
                  <Button variant="outline" size="sm" onClick={() => startEdit(tag)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(getId(tag))}
                    disabled={deletingId === getId(tag)}
                  >
                    {deletingId === getId(tag) ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ),
          },
        ]}
        rows={filteredAndSorted}
        rowKey={(tag) => getId(tag)}
        emptyTitle="No tags yet"
        emptySubtitle="Create the first tag to organize discovery."
      />
    </AdminSection>
  );
}
