import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api"; // adjust if needed

export default function AdminTags() {
  const API_BASE = "/admin/tags"; // change if needed

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  // ✅ sorting
  const [sortBy, setSortBy] = useState("name"); // "id" | "name" | "active"
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  // create
  const [newName, setNewName] = useState("");
  const [newActive, setNewActive] = useState(true);
  const [creating, setCreating] = useState(false);

  // edit
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // delete
  const [deletingId, setDeletingId] = useState(null);

  const getId = (t) => t.id ?? t.Id ?? t.ID;
  const getName = (t) => t.name ?? t.Name ?? "";
  const getActive = (t) => (t.isActive ?? t.IsActive ?? true) === true;

  const load = async () => {
    try {
      setErr("");
      setLoading(true);

      const res = await api.get(`${API_BASE}?includeInactive=true`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load tags failed:", e);
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
    setSortBy((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      // same key => toggle dir
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return prev;
    });
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return "↕";
    return sortDir === "asc" ? "↑" : "↓";
  };

  const filteredAndSorted = useMemo(() => {
    const s = q.trim().toLowerCase();

    let arr = items;
    if (s) {
      arr = items.filter((t) => getName(t).toLowerCase().includes(s));
    }

    const dir = sortDir === "asc" ? 1 : -1;

    const sorted = [...arr].sort((a, b) => {
      if (sortBy === "id") {
        return (Number(getId(a)) - Number(getId(b))) * dir;
      }

      if (sortBy === "active") {
        // active first on asc
        const av = getActive(a) ? 1 : 0;
        const bv = getActive(b) ? 1 : 0;
        return (av - bv) * dir;
      }

      // default: name
      return getName(a).localeCompare(getName(b)) * dir;
    });

    return sorted;
  }, [items, q, sortBy, sortDir]);

  const startEdit = (t) => {
    setErr("");
    setEditingId(getId(t));
    setEditName(getName(t));
    setEditActive(getActive(t));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditActive(true);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return setErr("Tag name is required.");

    try {
      setCreating(true);
      setErr("");

      await api.post(API_BASE, {
        name,
        isActive: newActive,
      });

      setNewName("");
      setNewActive(true);
      await load();
    } catch (e) {
      console.error("Create tag failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to create tag.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId) return;
    if (!name) return setErr("Tag name is required.");

    try {
      setSaving(true);
      setErr("");

      await api.put(`${API_BASE}/${editingId}`, {
        name,
        isActive: editActive,
      });

      cancelEdit();
      await load();
    } catch (e) {
      console.error("Update tag failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to update tag.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const ok = window.confirm("Delete this tag? This cannot be undone.");
    if (!ok) return;

    try {
      setDeletingId(id);
      setErr("");

      await api.delete(`${API_BASE}/${id}`);
      await load();
    } catch (e) {
      console.error("Delete tag failed:", e);
      setErr(e?.response?.data?.message || e?.response?.data || "Failed to delete tag.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Tags</h3>
          <div className="text-muted small">Create, edit, activate/deactivate, and delete tags.</div>
        </div>

        <button className="btn btn-outline-dark" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err ? <div className="alert alert-danger">{String(err)}</div> : null}

      {/* Create */}
      <div className="border rounded p-3 mb-3">
        <div className="fw-semibold mb-2">Add new tag</div>

        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <input
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tag name (e.g. Isekai)"
            />
          </div>

          <div className="col-6 col-md-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="tagActive"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="tagActive">
                Active
              </label>
            </div>
          </div>

          <div className="col-6 col-md-3 text-end">
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
          placeholder="Search tags..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="text-muted small d-flex align-items-center">
          {filteredAndSorted.length} / {items.length}
        </div>
      </div>

      {/* List */}
      <div className="border rounded overflow-hidden">
        {loading ? (
          <div className="p-3 text-muted">Loading...</div>
        ) : !items.length ? (
          <div className="p-3 text-muted">No tags yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th
                    style={{ width: 90, cursor: "pointer" }}
                    onClick={() => onSort("id")}
                    title="Sort by ID"
                  >
                    ID <span className="text-muted">{sortIndicator("id")}</span>
                  </th>

                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => onSort("name")}
                    title="Sort by Name"
                  >
                    Name <span className="text-muted">{sortIndicator("name")}</span>
                  </th>

                  <th
                    style={{ width: 120, cursor: "pointer" }}
                    onClick={() => onSort("active")}
                    title="Sort by Active"
                  >
                    Active <span className="text-muted">{sortIndicator("active")}</span>
                  </th>

                  <th style={{ width: 260 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSorted.map((t) => {
                  const id = getId(t);
                  const name = getName(t);
                  const active = getActive(t);
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
                            <button className="btn btn-outline-dark btn-sm" onClick={() => startEdit(t)}>
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

            <div className="p-2 text-muted small border-top">
              Tip: click column headers (ID / Name / Active) to sort.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
