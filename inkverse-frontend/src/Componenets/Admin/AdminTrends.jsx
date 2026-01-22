import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api"; // adjust path if needed
import { absUrl } from "../../Utils/absUrl";

export default function AdminTrends() {
  const API_BASE = "/admin/trends";



  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");

  // sorting
  const [sortBy, setSortBy] = useState("sortOrder"); // id|name|active|sortOrder
  const [sortDir, setSortDir] = useState("asc");

  // create
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageUrl, setNewImageUrl] = useState(""); // will be set after upload
  const [newImagePreview, setNewImagePreview] = useState(""); // local preview
  const [uploadingCreateImg, setUploadingCreateImg] = useState(false);

  const [newActive, setNewActive] = useState(true);
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [creating, setCreating] = useState(false);

  // edit
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState(""); // set after upload
  const [editImagePreview, setEditImagePreview] = useState(""); // local preview
  const [uploadingEditImg, setUploadingEditImg] = useState(false);

  const [editActive, setEditActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  // delete
  const [deletingId, setDeletingId] = useState(null);

  // linked books map: trendId -> [{id, title}]
  const [booksMap, setBooksMap] = useState({});
  const [booksLoadingMap, setBooksLoadingMap] = useState({});
  const [linkBookIdMap, setLinkBookIdMap] = useState({}); // trendId -> input value
  const [linkingMap, setLinkingMap] = useState({}); // trendId -> true/false
  const [unlinkingMap, setUnlinkingMap] = useState({}); // `${trendId}:${bookId}` -> true/false

  const getId = (t) => t.id ?? t.Id ?? t.ID;
  const getName = (t) => t.name ?? t.Name ?? "";
  const getSlug = (t) => t.slug ?? t.Slug ?? "";
  const getDesc = (t) => t.description ?? t.Description ?? "";
  const getImageUrl = (t) => t.imageUrl ?? t.ImageUrl ?? "";
  const getActive = (t) => (t.isActive ?? t.IsActive ?? true) === true;
  const getSortOrder = (t) => Number(t.sortOrder ?? t.SortOrder ?? 0);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`${API_BASE}?includeInactive=true`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load trends failed:", e);
      setItems([]);
      setErr("Failed to load trends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // --- upload helper ---
  const uploadTrendImage = async (file) => {
    const form = new FormData();
    form.append("file", file);

    // backend route: /api/uploads/trends
    const res = await api.post("/uploads/trends", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data?.url || "";
  };

  const onSort = (key) => {
    setSortBy((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
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
      arr = items.filter((t) => {
        const name = getName(t).toLowerCase();
        const slug = getSlug(t).toLowerCase();
        const desc = getDesc(t).toLowerCase();
        return name.includes(s) || slug.includes(s) || desc.includes(s);
      });
    }

    const dir = sortDir === "asc" ? 1 : -1;

    return [...arr].sort((a, b) => {
      if (sortBy === "id") return (Number(getId(a)) - Number(getId(b))) * dir;
      if (sortBy === "active") {
        const av = getActive(a) ? 1 : 0;
        const bv = getActive(b) ? 1 : 0;
        return (av - bv) * dir;
      }
      if (sortBy === "sortOrder")
        return (getSortOrder(a) - getSortOrder(b)) * dir;

      return getName(a).localeCompare(getName(b)) * dir;
    });
  }, [items, q, sortBy, sortDir]);

  const startEdit = (t) => {
    setErr("");
    setEditingId(getId(t));
    setEditName(getName(t));
    setEditSlug(getSlug(t) || "");
    setEditDesc(getDesc(t) || "");
    setEditImageUrl(getImageUrl(t) || "");
    setEditImagePreview(""); // reset local preview
    setEditActive(getActive(t));
    setEditSortOrder(getSortOrder(t));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditSlug("");
    setEditDesc("");
    setEditImageUrl("");
    setEditImagePreview("");
    setEditActive(true);
    setEditSortOrder(0);
  };

  const create = async () => {
    const name = newName.trim();
    if (!name) return setErr("Trend name is required.");

    try {
      setCreating(true);
      setErr("");

      await api.post(API_BASE, {
        name,
        slug: newSlug.trim() || null,
        description: newDesc.trim() || null,
        imageUrl: newImageUrl,
        isActive: newActive,
        sortOrder: Number(newSortOrder || 0),
      });

      setNewName("");
      setNewSlug("");
      setNewDesc("");
      setNewImageUrl("");
      setNewImagePreview("");
      setNewActive(true);
      setNewSortOrder(0);

      await load();
    } catch (e) {
      console.error("Create trend failed:", e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data ||
          "Failed to create trend.",
      );
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId) return;
    if (!name) return setErr("Trend name is required.");

    try {
      setSaving(true);
      setErr("");

      await api.put(`${API_BASE}/${editingId}`, {
        name,
        slug: editSlug.trim() || null,
        description: editDesc.trim() || null,
        imageUrl: editImageUrl.trim() || null, // comes from upload
        isActive: editActive,
        sortOrder: Number(editSortOrder || 0),
      });

      cancelEdit();
      await load();
    } catch (e) {
      console.error("Update trend failed:", e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data ||
          "Failed to update trend.",
      );
    } finally {
      setSaving(false);
    }
  };

 

  const remove = async (id) => {
    const ok = window.confirm(
      "Delete this trend? (Links to books will be removed too)",
    );
    if (!ok) return;

    try {
      setDeletingId(id);
      setErr("");

      await api.delete(`${API_BASE}/${id}`);

      setBooksMap((m) => {
        const copy = { ...m };
        delete copy[id];
        return copy;
      });

      await load();
    } catch (e) {
      console.error("Delete trend failed:", e);
      setErr(
        e?.response?.data?.message ||
          e?.response?.data ||
          "Failed to delete trend.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const loadLinkedBooks = async (trendId) => {
    try {
      setBooksLoadingMap((m) => ({ ...m, [trendId]: true }));

      const res = await api.get(`${API_BASE}/${trendId}/books`, {
        params: { take: 50 },
      });

      const list = Array.isArray(res.data) ? res.data : [];
      const books = list.map((b) => ({
        id: b.id ?? b.ID,
        title: b.title ?? b.Title ?? `Book ${b.id ?? b.ID}`,
        coverImageUrl: b.coverImageUrl ?? b.CoverImageUrl ?? "",
      }));

      setBooksMap((m) => ({ ...m, [trendId]: books }));
    } catch (e) {
      console.error("Load linked books failed:", e);
      setBooksMap((m) => ({ ...m, [trendId]: [] }));
    } finally {
      setBooksLoadingMap((m) => ({ ...m, [trendId]: false }));
    }
  };

  const linkBook = async (trendId) => {
    const raw = linkBookIdMap[trendId];
    const bookId = Number(raw);

    if (!bookId || bookId <= 0) {
      setErr("BookId must be a positive number.");
      return;
    }

    try {
      setLinkingMap((m) => ({ ...m, [trendId]: true }));
      setErr("");

      await api.post(`${API_BASE}/${trendId}/books`, { bookId });

      setLinkBookIdMap((m) => ({ ...m, [trendId]: "" }));
      await loadLinkedBooks(trendId);
    } catch (e) {
      console.error("Link book failed:", e);
      setErr(
        e?.response?.data ||
          e?.response?.data?.message ||
          "Failed to link book.",
      );
    } finally {
      setLinkingMap((m) => ({ ...m, [trendId]: false }));
    }
  };

  const unlinkBook = async (trendId, bookId) => {
    const key = `${trendId}:${bookId}`;

    try {
      setUnlinkingMap((m) => ({ ...m, [key]: true }));
      setErr("");

      await api.delete(`${API_BASE}/${trendId}/books/${bookId}`);
      await loadLinkedBooks(trendId);
    } catch (e) {
      console.error("Unlink book failed:", e);
      setErr(
        e?.response?.data ||
          e?.response?.data?.message ||
          "Failed to unlink book.",
      );
    } finally {
      setUnlinkingMap((m) => ({ ...m, [key]: false }));
    }
  };

  // CLEANUP object URLs
  useEffect(() => {
    return () => {
      if (newImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(newImagePreview);
      if (editImagePreview?.startsWith("blob:"))
        URL.revokeObjectURL(editImagePreview);
    };
  }, [newImagePreview, editImagePreview]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="mb-1">Trends</h3>
          <div className="text-muted small">
            Create trends, control order, and link/unlink books.
          </div>
        </div>

        <button
          className="btn btn-outline-dark"
          onClick={load}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {err ? <div className="alert alert-danger">{String(err)}</div> : null}

      {/* Create */}
      <div className="border rounded p-3 mb-3">
        <div className="fw-semibold mb-2">Add new trend</div>

        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              className="form-control"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name (e.g. Trending Now)"
            />
          </div>

          <div className="col-12 col-md-4">
            <input
              className="form-control"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="Slug (optional)"
            />
          </div>

          <div className="col-6 col-md-2">
            <input
              type="number"
              className="form-control"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(e.target.value)}
              placeholder="SortOrder"
            />
          </div>

          <div className="col-6 col-md-2">
            <div className="form-check mt-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="trendActive"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="trendActive">
                Active
              </label>
            </div>
          </div>

          {/* IMAGE UPLOAD (Create) */}
          <div className="col-12 col-md-6">
            <label className="form-label small text-muted mb-1">
              Trend image
            </label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // local preview first
                const localUrl = URL.createObjectURL(file);
                setNewImagePreview(localUrl);

                try {
                  setUploadingCreateImg(true);
                  setErr("");
                  const url = await uploadTrendImage(file);
                  setNewImageUrl(url);
                } catch (ex) {
                  console.error(ex);
                  setErr("Image upload failed.");
                  setNewImageUrl("");
                } finally {
                  setUploadingCreateImg(false);
                }
              }}
            />

            {/* preview */}
            {absUrl(newImageUrl) && (
              <div className="mt-2 d-flex align-items-center gap-2">
                <img
                  src={newImagePreview || absUrl(newImageUrl)}
                  alt=""
                  className="rounded border"
                  style={{ width: 160, height: 80, objectFit: "cover" }}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div
                  className="small text-muted text-truncate"
                  style={{ maxWidth: 360 }}
                >
                  {absUrl(newImageUrl)
                    ? `Saved: ${absUrl(newImageUrl)}`
                    : "Uploading..."}
                </div>
              </div>
            )}
          </div>

          {/* Description (Create) */}
          <div className="col-12">
            <textarea
              className="form-control"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
            />
          </div>

          <div className="col-12 text-end">
            <button
              className="btn btn-dark"
              onClick={create}
              disabled={creating || uploadingCreateImg}
            >
              {creating ? "Adding..." : "Add Trend"}
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="d-flex gap-2 mb-2">
        <input
          className="form-control"
          placeholder="Search trends (name / slug / description)..."
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
          <div className="p-3 text-muted">No trends yet.</div>
        ) : (
          <div className="table-responsive">
            <table className="table mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th
                    style={{ width: 90, cursor: "pointer" }}
                    onClick={() => onSort("id")}
                  >
                    ID <span className="text-muted">{sortIndicator("id")}</span>
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => onSort("name")}
                  >
                    Name{" "}
                    <span className="text-muted">{sortIndicator("name")}</span>
                  </th>
                  <th
                    style={{ width: 120, cursor: "pointer" }}
                    onClick={() => onSort("active")}
                  >
                    Active{" "}
                    <span className="text-muted">
                      {sortIndicator("active")}
                    </span>
                  </th>
                  <th
                    style={{ width: 140, cursor: "pointer" }}
                    onClick={() => onSort("sortOrder")}
                  >
                    SortOrder{" "}
                    <span className="text-muted">
                      {sortIndicator("sortOrder")}
                    </span>
                  </th>
                  <th>Description</th>
                  <th style={{ width: 160 }} className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSorted.map((t) => {
                  const id = getId(t);
                  const name = getName(t);
                  const active = getActive(t);
                  const sortOrder = getSortOrder(t);
                  const desc = getDesc(t);
                  const imageUrl = getImageUrl(t);

                  const isEditing = editingId === id;

                  const linked = booksMap[id];
                  const booksLoading = booksLoadingMap[id] === true;

                  return (
                    <tr key={id}>
                      <td className="text-muted">{id}</td>

                      <td>
                        {isEditing ? (
                          <div className="d-flex flex-column gap-2">
                            <input
                              className="form-control"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                            />
                            <input
                              className="form-control"
                              value={editSlug}
                              onChange={(e) => setEditSlug(e.target.value)}
                              placeholder="Slug"
                            />

                            {/* IMAGE UPLOAD (Edit) */}
                            <div>
                              <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                disabled={uploadingEditImg}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;

                                  const localUrl = URL.createObjectURL(file);
                                  setEditImagePreview(localUrl);

                                  try {
                                    setUploadingEditImg(true);
                                    setErr("");
                                    const url = await uploadTrendImage(file);
                                    setEditImageUrl(url);
                                  } catch (ex) {
                                    console.error(ex);
                                    setErr("Image upload failed (edit).");
                                  } finally {
                                    setUploadingEditImg(false);
                                  }
                                }}
                              />

                              {(editImagePreview || editImageUrl) && (
                                <div className="mt-2 d-flex align-items-center gap-2">
                                  <img
                                    src={editImagePreview || editImageUrl}
                                    alt=""
                                    className="rounded border"
                                    style={{
                                      width: 160,
                                      height: 80,
                                      objectFit: "cover",
                                    }}
                                    onError={(e) =>
                                      (e.currentTarget.style.display = "none")
                                    }
                                  />
                                  <div
                                    className="small text-muted text-truncate"
                                    style={{ maxWidth: 260 }}
                                  >
                                    {editImageUrl
                                      ? `Saved: ${editImageUrl}`
                                      : "Uploading..."}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="fw-semibold">{name}</div>
                            <div className="text-muted small">
                              {getSlug(t) || "—"}
                            </div>
                            {imageUrl ? (
                              <img
                                src={absUrl(imageUrl)}
                                alt=""
                                className="mt-2 rounded border"
                                style={{
                                  width: 160,
                                  height: 80,
                                  objectFit: "cover",
                                }}
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : (
                              <div className="small text-muted mt-1">
                                No image
                              </div>
                            )}
                          </div>
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
                          <span
                            className={
                              "badge " +
                              (active ? "text-bg-success" : "text-bg-secondary")
                            }
                          >
                            {active ? "Yes" : "No"}
                          </span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control"
                            value={editSortOrder}
                            onChange={(e) => setEditSortOrder(e.target.value)}
                          />
                        ) : (
                          <span className="text-muted">{sortOrder}</span>
                        )}
                      </td>

                      <td>
                        {isEditing ? (
                          <textarea
                            className="form-control"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={2}
                          />
                        ) : (
                          <div
                            style={{
                              maxWidth: 520,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              wordBreak: "break-word",
                            }}
                            title={desc || ""}
                          >
                            {desc || "—"}
                          </div>
                        )}

                        {/* Linked books panel */}
                        <div className="mt-2 border rounded p-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="fw-semibold small">
                              Linked Books
                            </div>
                            <button
                              className="btn btn-sm btn-outline-dark"
                              type="button"
                              onClick={() => loadLinkedBooks(id)}
                              disabled={booksLoading}
                            >
                              {booksLoading
                                ? "Loading..."
                                : linked
                                  ? "Reload"
                                  : "Load"}
                            </button>
                          </div>

                          {linked ? (
                            linked.length ? (
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {linked.map((book) => {
                                  const key = `${id}:${book.id}`;
                                  const busy = unlinkingMap[key] === true;

                                  return (
                                    <div
                                      key={book.id}
                                      className="d-flex align-items-center gap-2 border rounded px-2 py-1"
                                      style={{ maxWidth: 320 }}
                                    >
                                      {book.coverImageUrl ? (
                                        <img
                                          src={book.coverImageUrl}
                                          alt=""
                                          style={{
                                            width: 34,
                                            height: 46,
                                            objectFit: "cover",
                                            borderRadius: 6,
                                          }}
                                          onError={(e) =>
                                            (e.currentTarget.style.display =
                                              "none")
                                          }
                                        />
                                      ) : null}

                                      <div
                                        className="small text-truncate"
                                        title={book.title}
                                        style={{ flex: 1 }}
                                      >
                                        {book.title}
                                      </div>

                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        style={{
                                          padding: "0 6px",
                                          lineHeight: 1.2,
                                        }}
                                        onClick={() => unlinkBook(id, book.id)}
                                        disabled={busy}
                                        title="Unlink"
                                      >
                                        {busy ? "..." : "×"}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-muted small mt-2">
                                No linked books.
                              </div>
                            )
                          ) : (
                            <div className="text-muted small mt-2">
                              Click Load to show linked books.
                            </div>
                          )}

                          <div className="d-flex gap-2 mt-2">
                            <input
                              className="form-control form-control-sm"
                              placeholder="BookId"
                              value={linkBookIdMap[id] ?? ""}
                              onChange={(e) =>
                                setLinkBookIdMap((m) => ({
                                  ...m,
                                  [id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              className="btn btn-sm btn-dark"
                              type="button"
                              onClick={() => linkBook(id)}
                              disabled={linkingMap[id] === true}
                            >
                              {linkingMap[id] === true ? "Linking..." : "Link"}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="text-end">
                        {isEditing ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-dark btn-sm"
                              onClick={saveEdit}
                              disabled={saving || uploadingEditImg}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={cancelEdit}
                              disabled={saving}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => startEdit(t)}
                            >
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
              Tip: click headers (ID / Name / Active / SortOrder) to sort.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
