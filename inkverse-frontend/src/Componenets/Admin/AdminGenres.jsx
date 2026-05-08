import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminFormField from "../../features/admin/components/AdminFormField";

export default function AdminGenres() {
  const API_BASE = "/admin/genres";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`${API_BASE}?includeInactive=true`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Load genres failed:", error);
      setItems([]);
      setErr("Failed to load genres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;

    return items.filter((genre) => {
      const name = String(genre.name ?? genre.Name ?? "").toLowerCase();
      const slug = String(genre.slug ?? genre.Slug ?? "").toLowerCase();
      return name.includes(needle) || slug.includes(needle);
    });
  }, [items, q]);

  const startEdit = (genre) => {
    setEditingId(genre.id ?? genre.Id ?? genre.ID);
    setEditName(genre.name ?? genre.Name ?? "");
    setEditSlug(genre.slug ?? genre.Slug ?? "");
    setEditActive(genre.isActive ?? genre.IsActive ?? true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditActive(true);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) {
      setErr("Genre name is required.");
      return;
    }

    try {
      setCreating(true);
      setErr("");
      await api.post(API_BASE, {
        name,
        slug: newSlug.trim() || null,
        isActive: newActive,
      });
      setNewName("");
      setNewSlug("");
      setNewActive(true);
      await load();
    } catch (error) {
      console.error("Create genre failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to create genre.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId) return;
    if (!name) {
      setErr("Genre name is required.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      await api.put(`${API_BASE}/${editingId}`, {
        name,
        slug: editSlug.trim() || null,
        isActive: editActive,
      });
      cancelEdit();
      await load();
    } catch (error) {
      console.error("Update genre failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to update genre.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this genre? It will be removed from any books using it.")) {
      return;
    }

    try {
      setDeletingId(id);
      setErr("");
      await api.delete(`${API_BASE}/${id}`);
      await load();
    } catch (error) {
      console.error("Delete genre failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to delete genre.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState text="Loading genres..." />;
  if (err && !items.length) return <ErrorState title="Cannot load genres" subtitle={err} onRetry={load} />;

  return (
    <AdminSection flat>
      {err ? <div className="admin-alert">{String(err)}</div> : null}

      <div className="admin-taxonomy-toolbar">
        <div className="admin-taxonomy-toolbar__composer">
          <div className="admin-taxonomy-toolbar__fields">
            <AdminFormField label="Genre name" className="admin-taxonomy-toolbar__field">
              <input
                className="admin-input"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Fantasy"
              />
            </AdminFormField>

            <AdminFormField label="Slug" className="admin-taxonomy-toolbar__field">
              <input
                className="admin-input"
                value={newSlug}
                onChange={(event) => setNewSlug(event.target.value)}
                placeholder="fantasy"
              />
            </AdminFormField>
          </div>

          <div className="admin-taxonomy-toolbar__actions">
            <label className="admin-inline-check admin-taxonomy-toolbar__toggle">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(event) => setNewActive(event.target.checked)}
              />
              <span>Active</span>
            </label>

            <Button
              onClick={create}
              disabled={creating}
              className="admin-taxonomy-toolbar__submit"
            >
              {creating ? "Adding..." : "Add genre"}
            </Button>
          </div>
        </div>

        <div className="admin-taxonomy-toolbar__search-row">
          <div className="admin-taxonomy-toolbar__search-wrap">
          <TextField
            className="admin-search-field"
            value={q}
            onChange={setQ}
            placeholder="Search name or slug..."
          />
          </div>
          <span className="admin-taxonomy-toolbar__count">
            {filtered.length} of {items.length}
          </span>
        </div>
      </div>

      <AdminTable
        compact
        columns={[
          {
            key: "id",
            label: "Id",
            width: 90,
            render: (genre) => (
              <span className="admin-row-note">{genre.id ?? genre.Id ?? genre.ID}</span>
            ),
          },
          {
            key: "name",
            label: "Genre",
            render: (genre) =>
              editingId === (genre.id ?? genre.Id ?? genre.ID) ? (
                <input
                  className="admin-input"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
              ) : (
                <p className="admin-row-title">{genre.name ?? genre.Name ?? ""}</p>
              ),
          },
          {
            key: "slug",
            label: "Slug",
            render: (genre) =>
              editingId === (genre.id ?? genre.Id ?? genre.ID) ? (
                <input
                  className="admin-input"
                  value={editSlug}
                  onChange={(event) => setEditSlug(event.target.value)}
                />
              ) : (
                <span className="admin-row-note">{genre.slug ?? genre.Slug ?? "—"}</span>
              ),
          },
          {
            key: "active",
            label: "Active",
            width: 130,
            render: (genre) =>
              editingId === (genre.id ?? genre.Id ?? genre.ID) ? (
                <label className="admin-inline-check">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(event) => setEditActive(event.target.checked)}
                  />
                  <span>{editActive ? "Yes" : "No"}</span>
                </label>
              ) : (
                <span
                  className={`admin-pill ${
                    (genre.isActive ?? genre.IsActive ?? true)
                      ? "admin-pill--success"
                      : "admin-pill--neutral"
                  }`}
                >
                  {(genre.isActive ?? genre.IsActive ?? true) ? "Active" : "Inactive"}
                </span>
              ),
          },
          {
            key: "actions",
            label: "Actions",
            align: "right",
            width: 250,
            render: (genre) => {
              const id = genre.id ?? genre.Id ?? genre.ID;

              return editingId === id ? (
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
                  <Button variant="outline" size="sm" onClick={() => startEdit(genre)}>
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => remove(id)}
                    disabled={deletingId === id}
                  >
                    {deletingId === id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              );
            },
          },
        ]}
        rows={filtered}
        rowKey={(genre) => genre.id ?? genre.Id ?? genre.ID}
        emptyTitle="No genres yet"
        emptySubtitle="Create the first genre to shape your browse lanes."
      />
    </AdminSection>
  );
}
