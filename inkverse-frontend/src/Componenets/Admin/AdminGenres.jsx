import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api"; // adjust if needed

export default function AdminGenres() {
  const API_BASE = "/admin/genres"; // ✅ change if your controller route differs

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  // create
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // edit
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
    } catch (e) {
      console.error("Load genres failed:", e);
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
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter((g) => {
      const name = String(g.name ?? g.Name ?? "").toLowerCase();
      const slug = String(g.slug ?? g.Slug ?? "").toLowerCase();
      return name.includes(s) || slug.includes(s);
    });
  }, [items, q]);

  const startEdit = (g) => {
    const id = g.id ?? g.Id ?? g.ID;
    const name = g.name ?? g.Name ?? "";
    const slug = g.slug ?? g.Slug ?? "";
    const active = g.isActive ?? g.IsActive ?? true;

    setEditingId(id);
    setEditName(name);
    setEditSlug(slug || "");
    setEditActive(active);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditActive(true);
  };

  const create = async () => {
    const name = newName.trim();
    const slug = newSlug.trim() || null;

    if (!name) return setErr("Genre name is required.");

    try {
      setCreating(true);
      setErr("");

      await api.post(API_BASE, {
        name,
        slug,
        isActive: newActive,
      });

      setNewName("");
      setNewSlug("");
      setNewActive(true);
      await load();
    } catch (e) {
      console.error("Create genre failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to create genre.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    const slug = editSlug.trim() || null;
    if (!editingId) return;
    if (!name) return setErr("Genre name is required.");

    try {
      setSaving(true);
      setErr("");

      await api.put(`${API_BASE}/${editingId}`, {
        name,
        slug,
        isActive: editActive,
      });

      cancelEdit();
      await load();
    } catch (e) {
      console.error("Update genre failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to update genre.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!id) return;
    const ok = window.confirm("Delete this genre? It will be removed from any books using it.");
    if (!ok) return;

    try {
      setDeletingId(id);
      setErr("");

      await api.delete(`${API_BASE}/${id}`);
      await load();
    } catch (e) {
      console.error("Delete genre failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to delete genre.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Genres</h3>
          <div className="text-muted small">Create, edit, activate/deactivate, delete genres.</div>
        </div>

        <button className="btn btn-outline-dark" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err ? <div className="alert alert-danger">{String(err)}</div> : null}

      {/* Create */}
      <div className="border rounded p-3 mb-3">
        <div className="fw-semibold mb-2">Add new genre</div>

        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-4">
            <input
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Fantasy)"
            />
          </div>

          <div className="col-12 col-md-4">
            <input
              className="form-control"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="Slug (optional, e.g. fantasy)"
            />
          </div>

          <div className="col-6 col-md-2">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="genreActive"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="genreActive">
                Active
              </label>
            </div>
          </div>

          <div className="col-6 col-md-2 text-end">
            <button className="btn btn-dark w-100" onClick={create} disabled={creating}>
              {creating ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="d-flex gap-2 mb-2">
        <input
          className="form-control"
          placeholder="Search genres (name or slug)..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="text-muted small d-flex align-items-center">
          {filtered.length} / {items.length}
        </div>
      </div>

      {/* List */}
      <div className="border rounded overflow-hidden">
        {loading ? (
          <div className="p-3 text-muted">Loading...</div>
        ) : !items.length ? (
          <div className="p-3 text-muted">No genres yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th style={{ width: 120 }}>Active</th>
                  <th style={{ width: 260 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => {
                  const id = g.id ?? g.Id ?? g.ID;
                  const name = g.name ?? g.Name ?? "";
                  const slug = g.slug ?? g.Slug ?? "";
                  const active = g.isActive ?? g.IsActive ?? true;

                  const isEditing = editingId === id;

                  return (
                    <tr key={id}>
                      <td className="text-muted">{id}</td>

                      <td>
                        {isEditing ? (
                          <input
                            className="form-control"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        ) : (
                          <div className="fw-semibold">{name}</div>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            className="form-control"
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                          />
                        ) : (
                          <span className="text-muted">{slug || "—"}</span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                          />
                        ) : (
                          <span className={"badge " + (active ? "text-bg-success" : "text-bg-secondary")}>
                            {active ? "Yes" : "No"}
                          </span>
                        )}
                      </td>

                      <td className="text-end">
                        {isEditing ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-dark btn-sm" onClick={saveEdit} disabled={saving}>
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" onClick={cancelEdit} disabled={saving}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-outline-dark btn-sm" onClick={() => startEdit(g)}>
                              Edit
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => remove(id)}
                              disabled={deletingId === id}
                            >
                              {deletingId === id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
