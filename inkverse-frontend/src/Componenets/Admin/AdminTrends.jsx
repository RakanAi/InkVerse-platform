import { useEffect, useMemo, useState } from "react";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";
import AdminFormField from "../../features/admin/components/AdminFormField";

function sortIndicatorFor(sortBy, sortDir, key) {
  if (sortBy !== key) return "↕";
  return sortDir === "asc" ? "↑" : "↓";
}

function CoverPreview({ src, alt = "" }) {
  const [failed, setFailed] = useState(false);
  const resolved = src && !failed ? src : "";

  return (
    <div className="admin-cover-thumb--wide">
      {resolved ? (
        <img src={resolved} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <div className="admin-cover-thumb__placeholder">No image</div>
      )}
    </div>
  );
}

export default function AdminTrends() {
  const API_BASE = "/admin/trends";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("sortOrder");
  const [sortDir, setSortDir] = useState("asc");

  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImagePreview, setNewImagePreview] = useState("");
  const [uploadingCreateImg, setUploadingCreateImg] = useState(false);
  const [newActive, setNewActive] = useState(true);
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [uploadingEditImg, setUploadingEditImg] = useState(false);
  const [editActive, setEditActive] = useState(true);
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [booksMap, setBooksMap] = useState({});
  const [booksLoadingMap, setBooksLoadingMap] = useState({});
  const [linkBookIdMap, setLinkBookIdMap] = useState({});
  const [linkingMap, setLinkingMap] = useState({});
  const [unlinkingMap, setUnlinkingMap] = useState({});

  const getId = (trend) => trend.id ?? trend.Id ?? trend.ID;
  const getName = (trend) => trend.name ?? trend.Name ?? "";
  const getSlug = (trend) => trend.slug ?? trend.Slug ?? "";
  const getDesc = (trend) => trend.description ?? trend.Description ?? "";
  const getImageUrl = (trend) => trend.imageUrl ?? trend.ImageUrl ?? "";
  const getActive = (trend) => (trend.isActive ?? trend.IsActive ?? true) === true;
  const getSortOrder = (trend) => Number(trend.sortOrder ?? trend.SortOrder ?? 0);

  const load = async () => {
    try {
      setErr("");
      setLoading(true);
      const res = await api.get(`${API_BASE}?includeInactive=true`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Load trends failed:", error);
      setItems([]);
      setErr("Failed to load trends.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    return () => {
      if (newImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(newImagePreview);
      }
      if (editImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(editImagePreview);
      }
    };
  }, [newImagePreview, editImagePreview]);

  const uploadTrendImage = async (file) => {
    const form = new FormData();
    form.append("file", file);

    const res = await api.post("/uploads/trends", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data?.url || "";
  };

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

  const filteredAndSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const filtered = needle
      ? items.filter((trend) => {
          const name = getName(trend).toLowerCase();
          const slug = getSlug(trend).toLowerCase();
          const desc = getDesc(trend).toLowerCase();
          return name.includes(needle) || slug.includes(needle) || desc.includes(needle);
        })
      : items;

    const direction = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((left, right) => {
      if (sortBy === "id") {
        return (Number(getId(left)) - Number(getId(right))) * direction;
      }
      if (sortBy === "active") {
        return ((getActive(left) ? 1 : 0) - (getActive(right) ? 1 : 0)) * direction;
      }
      if (sortBy === "sortOrder") {
        return (getSortOrder(left) - getSortOrder(right)) * direction;
      }

      return getName(left).localeCompare(getName(right)) * direction;
    });
  }, [items, q, sortBy, sortDir]);

  const startEdit = (trend) => {
    setErr("");
    setEditingId(getId(trend));
    setEditName(getName(trend));
    setEditSlug(getSlug(trend) || "");
    setEditDesc(getDesc(trend) || "");
    setEditImageUrl(getImageUrl(trend) || "");
    setEditImagePreview("");
    setEditActive(getActive(trend));
    setEditSortOrder(getSortOrder(trend));
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
    if (!name) {
      setErr("Trend name is required.");
      return;
    }

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
    } catch (error) {
      console.error("Create trend failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to create trend.");
    } finally {
      setCreating(false);
    }
  };

  const saveEdit = async () => {
    const name = editName.trim();
    if (!editingId) return;
    if (!name) {
      setErr("Trend name is required.");
      return;
    }

    try {
      setSaving(true);
      setErr("");
      await api.put(`${API_BASE}/${editingId}`, {
        name,
        slug: editSlug.trim() || null,
        description: editDesc.trim() || null,
        imageUrl: editImageUrl.trim() || null,
        isActive: editActive,
        sortOrder: Number(editSortOrder || 0),
      });
      cancelEdit();
      await load();
    } catch (error) {
      console.error("Update trend failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to update trend.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this trend? Linked books will be removed too.")) {
      return;
    }

    try {
      setDeletingId(id);
      setErr("");
      await api.delete(`${API_BASE}/${id}`);
      setBooksMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      await load();
    } catch (error) {
      console.error("Delete trend failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to delete trend.");
    } finally {
      setDeletingId(null);
    }
  };

  const loadLinkedBooks = async (trendId) => {
    try {
      setBooksLoadingMap((prev) => ({ ...prev, [trendId]: true }));
      const res = await api.get(`${API_BASE}/${trendId}/books`, { params: { take: 50 } });
      const books = (Array.isArray(res.data) ? res.data : []).map((book) => ({
        id: book.id ?? book.ID,
        title: book.title ?? book.Title ?? `Book ${book.id ?? book.ID}`,
        coverImageUrl: book.coverImageUrl ?? book.CoverImageUrl ?? "",
      }));
      setBooksMap((prev) => ({ ...prev, [trendId]: books }));
    } catch (error) {
      console.error("Load linked books failed:", error);
      setBooksMap((prev) => ({ ...prev, [trendId]: [] }));
    } finally {
      setBooksLoadingMap((prev) => ({ ...prev, [trendId]: false }));
    }
  };

  const linkBook = async (trendId) => {
    const bookId = Number(linkBookIdMap[trendId]);
    if (!bookId || bookId <= 0) {
      setErr("BookId must be a positive number.");
      return;
    }

    try {
      setLinkingMap((prev) => ({ ...prev, [trendId]: true }));
      setErr("");
      await api.post(`${API_BASE}/${trendId}/books`, { bookId });
      setLinkBookIdMap((prev) => ({ ...prev, [trendId]: "" }));
      await loadLinkedBooks(trendId);
    } catch (error) {
      console.error("Link book failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to link book.");
    } finally {
      setLinkingMap((prev) => ({ ...prev, [trendId]: false }));
    }
  };

  const unlinkBook = async (trendId, bookId) => {
    const key = `${trendId}:${bookId}`;

    try {
      setUnlinkingMap((prev) => ({ ...prev, [key]: true }));
      setErr("");
      await api.delete(`${API_BASE}/${trendId}/books/${bookId}`);
      await loadLinkedBooks(trendId);
    } catch (error) {
      console.error("Unlink book failed:", error);
      setErr(error?.response?.data?.message || error?.response?.data || "Failed to unlink book.");
    } finally {
      setUnlinkingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) return <LoadingState text="Loading trends..." />;
  if (err && !items.length) return <ErrorState title="Cannot load trends" subtitle={err} onRetry={load} />;

  return (
    <>
      <AdminSection title="Create trend" flat>
        {err ? <div className="admin-alert">{String(err)}</div> : null}

        <div className="admin-form-grid">
          <AdminFormField label="Name" className="admin-col-4">
            <input
              className="admin-input"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Trending now"
            />
          </AdminFormField>

          <AdminFormField label="Slug" className="admin-col-4">
            <input
              className="admin-input"
              value={newSlug}
              onChange={(event) => setNewSlug(event.target.value)}
              placeholder="trending-now"
            />
          </AdminFormField>

          <AdminFormField label="Sort order" className="admin-col-2">
            <input
              type="number"
              className="admin-input"
              value={newSortOrder}
              onChange={(event) => setNewSortOrder(event.target.value)}
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

          <AdminFormField label="Trend image" className="admin-col-6">
            <input
              type="file"
              className="admin-input"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                setNewImagePreview(URL.createObjectURL(file));

                try {
                  setUploadingCreateImg(true);
                  setErr("");
                  const url = await uploadTrendImage(file);
                  setNewImageUrl(url);
                } catch (error) {
                  console.error(error);
                  setErr("Image upload failed.");
                  setNewImageUrl("");
                } finally {
                  setUploadingCreateImg(false);
                }
              }}
            />
          </AdminFormField>

          <div className="admin-col-6 admin-preview-stack">
            <CoverPreview src={newImagePreview || absUrl(newImageUrl)} alt={newName || "Trend preview"} />
            <span className="admin-row-note">
              {newImageUrl ? `Saved: ${absUrl(newImageUrl)}` : "Upload an image for the trend card."}
            </span>
          </div>

          <AdminFormField label="Description" className="admin-col-12">
            <textarea
              className="admin-textarea"
              rows={3}
              value={newDesc}
              onChange={(event) => setNewDesc(event.target.value)}
              placeholder="Short summary for the trend."
            />
          </AdminFormField>

          <div className="admin-col-12 admin-form-actions">
            <Button onClick={create} disabled={creating || uploadingCreateImg}>
              {creating ? "Adding..." : "Add trend"}
            </Button>
          </div>
        </div>
      </AdminSection>

      <AdminSection title="Trend list" flat>
        <div className="admin-toolbar">
          <div className="admin-toolbar__group admin-toolbar__group--grow">
            <TextField
              className="admin-search-field"
              value={q}
              onChange={setQ}
              placeholder="Search by name, slug, or description..."
            />
          </div>
          <span className="admin-page-note">
            {filteredAndSorted.length} of {items.length}
          </span>
        </div>

        <AdminTable
          columns={[
            {
              key: "trend",
              label: "Trend",
              onHeaderClick: () => onSort("name"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "name"),
              render: (trend) => {
                const id = getId(trend);
                const isEditing = editingId === id;

                return isEditing ? (
                  <div className="admin-simple-stack">
                    <input
                      className="admin-input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      placeholder="Trend name"
                    />
                    <input
                      className="admin-input"
                      value={editSlug}
                      onChange={(event) => setEditSlug(event.target.value)}
                      placeholder="Slug"
                    />
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      value={editDesc}
                      onChange={(event) => setEditDesc(event.target.value)}
                      placeholder="Description"
                    />
                    <input
                      type="file"
                      className="admin-input"
                      accept="image/*"
                      disabled={uploadingEditImg}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        setEditImagePreview(URL.createObjectURL(file));

                        try {
                          setUploadingEditImg(true);
                          setErr("");
                          const url = await uploadTrendImage(file);
                          setEditImageUrl(url);
                        } catch (error) {
                          console.error(error);
                          setErr("Image upload failed.");
                        } finally {
                          setUploadingEditImg(false);
                        }
                      }}
                    />
                    <CoverPreview
                      src={editImagePreview || absUrl(editImageUrl)}
                      alt={editName || "Trend preview"}
                    />
                  </div>
                ) : (
                  <div className="admin-simple-stack">
                    <CoverPreview src={absUrl(getImageUrl(trend))} alt={getName(trend)} />
                    <p className="admin-row-title">{getName(trend)}</p>
                    <p className="admin-row-note">{getSlug(trend) || "No slug"}</p>
                    <p className="admin-row-subtitle admin-clamp-3">
                      {getDesc(trend) || "No description yet."}
                    </p>
                  </div>
                );
              },
            },
            {
              key: "active",
              label: "Visibility",
              width: 150,
              onHeaderClick: () => onSort("active"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "active"),
              render: (trend) => {
                const id = getId(trend);

                return editingId === id ? (
                  <label className="admin-inline-check">
                    <input
                      type="checkbox"
                      checked={editActive}
                      onChange={(event) => setEditActive(event.target.checked)}
                    />
                    <span>{editActive ? "Active" : "Inactive"}</span>
                  </label>
                ) : (
                  <span
                    className={`admin-pill ${
                      getActive(trend) ? "admin-pill--success" : "admin-pill--neutral"
                    }`}
                  >
                    {getActive(trend) ? "Active" : "Inactive"}
                  </span>
                );
              },
            },
            {
              key: "sortOrder",
              label: "Order",
              width: 140,
              onHeaderClick: () => onSort("sortOrder"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "sortOrder"),
              render: (trend) => {
                const id = getId(trend);

                return editingId === id ? (
                  <input
                    type="number"
                    className="admin-input"
                    value={editSortOrder}
                    onChange={(event) => setEditSortOrder(event.target.value)}
                  />
                ) : (
                  <span className="admin-row-note">{getSortOrder(trend)}</span>
                );
              },
            },
            {
              key: "linkedBooks",
              label: "Linked books",
              render: (trend) => {
                const id = getId(trend);
                const linked = booksMap[id];
                const booksLoading = booksLoadingMap[id] === true;

                return (
                  <div className="admin-simple-stack">
                    <div className="admin-inline-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadLinkedBooks(id)}
                        disabled={booksLoading}
                      >
                        {booksLoading ? "Loading..." : linked ? "Reload books" : "Load books"}
                      </Button>
                    </div>

                    {linked ? (
                      linked.length ? (
                        <div className="admin-linked-list">
                          {linked.map((book) => {
                            const key = `${id}:${book.id}`;
                            const busy = unlinkingMap[key] === true;

                            return (
                              <div key={book.id} className="admin-linked-item">
                                {book.coverImageUrl ? (
                                  <img
                                    className="admin-linked-cover"
                                    src={absUrl(book.coverImageUrl)}
                                    alt=""
                                    onError={(event) => {
                                      event.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span className="admin-linked-title admin-clamp-2">{book.title}</span>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => unlinkBook(id, book.id)}
                                  disabled={busy}
                                >
                                  {busy ? "..." : "Unlink"}
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="admin-row-note">No linked books yet.</span>
                      )
                    ) : (
                      <span className="admin-row-note">Load the list to see connected books.</span>
                    )}

                    <div className="admin-linked-actions">
                      <input
                        className="admin-input"
                        placeholder="BookId"
                        value={linkBookIdMap[id] ?? ""}
                        onChange={(event) =>
                          setLinkBookIdMap((prev) => ({
                            ...prev,
                            [id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => linkBook(id)}
                        disabled={linkingMap[id] === true}
                      >
                        {linkingMap[id] === true ? "Linking..." : "Link book"}
                      </Button>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "actions",
              label: "Actions",
              align: "right",
              width: 230,
              render: (trend) => {
                const id = getId(trend);
                const isEditing = editingId === id;

                return isEditing ? (
                  <div className="admin-action-row">
                    <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={saving || uploadingEditImg}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <div className="admin-action-row">
                    <Button variant="outline" size="sm" onClick={() => startEdit(trend)}>
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
          rows={filteredAndSorted}
          rowKey={(trend) => getId(trend)}
          emptyTitle="No trends yet"
          emptySubtitle="Create a trend to curate books on the public page."
        />
      </AdminSection>
    </>
  );
}
