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
import AdminDialog from "../../features/admin/components/AdminDialog";

const LINKED_BOOKS_PAGE_SIZE = 10;
const TREND_FORM_DEFAULTS = {
  id: null,
  name: "",
  slug: "",
  imageUrl: "",
  imagePreview: "",
  isActive: true,
  sortOrder: 0,
};

function sortIndicatorFor(sortBy, sortDir, key) {
  if (sortBy !== key) return "↕";
  return sortDir === "asc" ? "↑" : "↓";
}

function revokeBlobUrl(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function normalizeBook(book) {
  return {
    id: book.id ?? book.ID,
    title: book.title ?? book.Title ?? `Book ${book.id ?? book.ID}`,
    coverImageUrl: book.coverImageUrl ?? book.CoverImageUrl ?? "",
    authorName: book.authorName ?? book.AuthorName ?? "",
    status: book.status ?? book.Status ?? "",
  };
}

function TrendArtwork({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);
  const resolved = src && !failed ? src : "";

  return (
    <div className={`admin-trend-artwork ${className}`.trim()}>
      {resolved ? (
        <img src={resolved} alt={alt} onError={() => setFailed(true)} />
      ) : (
        <div className="admin-trend-artwork__placeholder">No image</div>
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

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState("create");
  const [trendForm, setTrendForm] = useState(TREND_FORM_DEFAULTS);
  const [composerSaving, setComposerSaving] = useState(false);
  const [composerUploading, setComposerUploading] = useState(false);

  const [imageDialogTrend, setImageDialogTrend] = useState(null);

  const [linkedDialogTrend, setLinkedDialogTrend] = useState(null);
  const [linkedBooks, setLinkedBooks] = useState([]);
  const [linkedBooksCache, setLinkedBooksCache] = useState({});
  const [linkedBooksLoading, setLinkedBooksLoading] = useState(false);
  const [linkedBooksFilter, setLinkedBooksFilter] = useState("");
  const [linkedBooksPage, setLinkedBooksPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogResults, setCatalogResults] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogErr, setCatalogErr] = useState("");
  const [linkingBookId, setLinkingBookId] = useState(null);
  const [unlinkingBookId, setUnlinkingBookId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const getId = (trend) => trend.id ?? trend.Id ?? trend.ID;
  const getName = (trend) => trend.name ?? trend.Name ?? "";
  const getSlug = (trend) => trend.slug ?? trend.Slug ?? "";
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
      revokeBlobUrl(trendForm.imagePreview);
    };
  }, [trendForm.imagePreview]);

  useEffect(() => {
    if (!linkedDialogTrend) return undefined;

    const term = catalogSearch.trim();
    if (term.length < 2) {
      setCatalogResults([]);
      setCatalogErr("");
      setCatalogLoading(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setCatalogLoading(true);
        setCatalogErr("");
        const res = await api.get("/books", {
          params: {
            SearchTerm: term,
            SortBy: "Title",
            IsAscending: true,
            PageNumber: 1,
            PageSize: 8,
          },
        });

        setCatalogResults(
          (Array.isArray(res.data) ? res.data : []).map(normalizeBook),
        );
      } catch (error) {
        console.error("Search books failed:", error);
        setCatalogResults([]);
        setCatalogErr("Failed to search books.");
      } finally {
        setCatalogLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timeoutId);
  }, [catalogSearch, linkedDialogTrend]);

  useEffect(() => {
    setLinkedBooksPage(1);
  }, [linkedBooksFilter, linkedDialogTrend]);

  const filteredAndSorted = useMemo(() => {
    const needle = q.trim().toLowerCase();

    const filtered = needle
      ? items.filter((trend) => {
          const name = getName(trend).toLowerCase();
          const slug = getSlug(trend).toLowerCase();
          return name.includes(needle) || slug.includes(needle);
        })
      : items;

    const direction = sortDir === "asc" ? 1 : -1;

    return [...filtered].sort((left, right) => {
      if (sortBy === "active") {
        return ((getActive(left) ? 1 : 0) - (getActive(right) ? 1 : 0)) * direction;
      }

      if (sortBy === "sortOrder") {
        return (getSortOrder(left) - getSortOrder(right)) * direction;
      }

      return getName(left).localeCompare(getName(right)) * direction;
    });
  }, [items, q, sortBy, sortDir]);

  const linkedBooksFiltered = useMemo(() => {
    const needle = linkedBooksFilter.trim().toLowerCase();
    if (!needle) return linkedBooks;

    return linkedBooks.filter((book) => {
      const title = String(book.title ?? "").toLowerCase();
      const author = String(book.authorName ?? "").toLowerCase();
      return title.includes(needle) || author.includes(needle);
    });
  }, [linkedBooks, linkedBooksFilter]);

  const linkedBooksPageCount = Math.max(
    1,
    Math.ceil(linkedBooksFiltered.length / LINKED_BOOKS_PAGE_SIZE),
  );
  const linkedBooksPageStart = (linkedBooksPage - 1) * LINKED_BOOKS_PAGE_SIZE;
  const linkedBooksPageItems = linkedBooksFiltered.slice(
    linkedBooksPageStart,
    linkedBooksPageStart + LINKED_BOOKS_PAGE_SIZE,
  );

  useEffect(() => {
    if (linkedBooksPage > linkedBooksPageCount) {
      setLinkedBooksPage(linkedBooksPageCount);
    }
  }, [linkedBooksPage, linkedBooksPageCount]);

  const setTrendFormWithCleanup = (nextValue) => {
    setTrendForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return nextValue;
    });
  };

  const resetTrendForm = () => {
    setTrendFormWithCleanup(TREND_FORM_DEFAULTS);
  };

  const openCreateDialog = () => {
    resetTrendForm();
    setComposerMode("create");
    setComposerOpen(true);
  };

  const openEditDialog = (trend) => {
    setComposerMode("edit");
    setTrendFormWithCleanup({
      id: getId(trend),
      name: getName(trend),
      slug: getSlug(trend) || "",
      imageUrl: getImageUrl(trend) || "",
      imagePreview: "",
      isActive: getActive(trend),
      sortOrder: getSortOrder(trend),
    });
    setComposerOpen(true);
  };

  const closeComposerDialog = () => {
    setComposerOpen(false);
    setComposerMode("create");
    resetTrendForm();
  };

  const uploadTrendImage = async (file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("EntityName", trendForm.name || "trend");
    form.append("Purpose", "image");

    const res = await api.post("/uploads/trends", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data?.url || "";
  };

  const handleComposerImageChange = async (event) => {
    const file = event.target.files?.[0];
    const input = event.target;
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setTrendForm((prev) => {
      revokeBlobUrl(prev.imagePreview);
      return {
        ...prev,
        imagePreview: previewUrl,
      };
    });

    try {
      setComposerUploading(true);
      setErr("");
      const uploadedUrl = await uploadTrendImage(file);
      setTrendForm((prev) => ({
        ...prev,
        imageUrl: uploadedUrl,
      }));
    } catch (error) {
      console.error("Trend image upload failed:", error);
      setErr("Image upload failed.");
      setTrendForm((prev) => ({
        ...prev,
        imageUrl: "",
      }));
    } finally {
      setComposerUploading(false);
      input.value = "";
    }
  };

  const saveTrend = async () => {
    const name = trendForm.name.trim();
    if (!name) {
      setErr("Trend name is required.");
      return;
    }

    const payload = {
      name,
      slug: trendForm.slug.trim() || null,
      description: "",
      imageUrl: trendForm.imageUrl.trim() || "",
      isActive: trendForm.isActive,
      sortOrder: Number(trendForm.sortOrder || 0),
    };

    try {
      setComposerSaving(true);
      setErr("");

      if (composerMode === "create") {
        await api.post(API_BASE, payload);
      } else {
        await api.put(`${API_BASE}/${trendForm.id}`, payload);
      }

      closeComposerDialog();
      await load();
    } catch (error) {
      console.error("Save trend failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to save trend.",
      );
    } finally {
      setComposerSaving(false);
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
      setLinkedBooksCache((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      await load();
    } catch (error) {
      console.error("Delete trend failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to delete trend.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const loadLinkedBooks = async (trendId) => {
    try {
      setLinkedBooksLoading(true);
      const res = await api.get(`${API_BASE}/${trendId}/books`, {
        params: { take: 50 },
      });
      const books = (Array.isArray(res.data) ? res.data : []).map(normalizeBook);
      setLinkedBooks(books);
      setLinkedBooksCache((prev) => ({
        ...prev,
        [trendId]: books,
      }));
    } catch (error) {
      console.error("Load linked books failed:", error);
      setLinkedBooks([]);
      setErr("Failed to load linked books.");
    } finally {
      setLinkedBooksLoading(false);
    }
  };

  const openLinkedBooksDialog = (trend) => {
    const trendId = getId(trend);
    setLinkedDialogTrend(trend);
    setLinkedBooks(linkedBooksCache[trendId] ?? []);
    setLinkedBooksFilter("");
    setLinkedBooksPage(1);
    setCatalogSearch("");
    setCatalogResults([]);
    setCatalogErr("");
    loadLinkedBooks(trendId);
  };

  const closeLinkedBooksDialog = () => {
    setLinkedDialogTrend(null);
    setLinkedBooks([]);
    setLinkedBooksFilter("");
    setLinkedBooksPage(1);
    setCatalogSearch("");
    setCatalogResults([]);
    setCatalogErr("");
    setLinkingBookId(null);
    setUnlinkingBookId(null);
  };

  const linkBook = async (book) => {
    if (!linkedDialogTrend) return;

    try {
      setLinkingBookId(book.id);
      setErr("");
      await api.post(`${API_BASE}/${getId(linkedDialogTrend)}/books`, {
        bookId: book.id,
      });
      await loadLinkedBooks(getId(linkedDialogTrend));
    } catch (error) {
      console.error("Link book failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to link book.",
      );
    } finally {
      setLinkingBookId(null);
    }
  };

  const unlinkBook = async (bookId) => {
    if (!linkedDialogTrend) return;

    try {
      setUnlinkingBookId(bookId);
      setErr("");
      await api.delete(`${API_BASE}/${getId(linkedDialogTrend)}/books/${bookId}`);
      await loadLinkedBooks(getId(linkedDialogTrend));
    } catch (error) {
      console.error("Unlink book failed:", error);
      setErr(
        error?.response?.data?.message ||
          error?.response?.data ||
          "Failed to unlink book.",
      );
    } finally {
      setUnlinkingBookId(null);
    }
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

  if (loading) return <LoadingState text="Loading trends..." />;
  if (err && !items.length) {
    return (
      <ErrorState title="Cannot load trends" subtitle={err} onRetry={load} />
    );
  }

  return (
    <>
      <AdminSection flat>
        {err ? <div className="admin-alert">{String(err)}</div> : null}

        <div className="admin-trend-toolbar">
          <div className="admin-trend-toolbar__primary">
            <TextField
              className="admin-search-field admin-trend-toolbar__search"
              value={q}
              onChange={setQ}
              placeholder="Search trend name or slug..."
            />
            <Button className="admin-trend-toolbar__create" onClick={openCreateDialog}>
              Add trend
            </Button>
          </div>

          <div className="admin-trend-toolbar__secondary">
            <span className="admin-trend-toolbar__count">
              {filteredAndSorted.length} of {items.length}
            </span>
          </div>
        </div>

        <AdminTable
          className="admin-trends-table-shell"
          tableClassName="admin-trends-table"
          columns={[
            {
              key: "name",
              label: "Name",
              width: "28%",
              onHeaderClick: () => onSort("name"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "name"),
              render: (trend) => (
                <div className="admin-trend-name-cell">
                  <p className="admin-row-title">{getName(trend)}</p>
                  <p className="admin-row-note">{getSlug(trend) || "No slug"}</p>
                </div>
              ),
            },
            {
              key: "image",
              label: "Image",
              width: "18%",
              render: (trend) => (
                <button
                  type="button"
                  className="admin-trend-image-trigger"
                  onClick={() => setImageDialogTrend(trend)}
                >
                  <TrendArtwork
                    src={absUrl(getImageUrl(trend))}
                    alt={getName(trend)}
                    className="admin-trend-image-trigger__art"
                  />
                  <span className="admin-trend-image-trigger__label">
                    {getImageUrl(trend) ? "Open preview" : "No image"}
                  </span>
                </button>
              ),
            },
            {
              key: "active",
              label: "Visibility",
              width: "15%",
              onHeaderClick: () => onSort("active"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "active"),
              render: (trend) => (
                <span
                  className={`admin-pill ${
                    getActive(trend) ? "admin-pill--success" : "admin-pill--neutral"
                  }`}
                >
                  {getActive(trend) ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "sortOrder",
              label: "Order",
              width: "12%",
              onHeaderClick: () => onSort("sortOrder"),
              sortIndicator: sortIndicatorFor(sortBy, sortDir, "sortOrder"),
              render: (trend) => (
                <span className="admin-row-note">{getSortOrder(trend)}</span>
              ),
            },
            {
              key: "linkedBooks",
              label: "Linked books",
              width: "17%",
              render: (trend) => {
                const trendId = getId(trend);
                const cachedBooks = linkedBooksCache[trendId];
                const linkedLabel = Array.isArray(cachedBooks)
                  ? `${cachedBooks.length} linked`
                  : "Manage books";

                return (
                  <button
                    type="button"
                    className="admin-trend-linked-trigger"
                    onClick={() => openLinkedBooksDialog(trend)}
                  >
                    <span className="admin-trend-linked-trigger__title">
                      {linkedLabel}
                    </span>
                    <span className="admin-trend-linked-trigger__meta">
                      Search, link, and unlink
                    </span>
                  </button>
                );
              },
            },
            {
              key: "actions",
              label: "Actions",
              width: "10%",
              align: "right",
              render: (trend) => {
                const trendId = getId(trend);

                return (
                  <div className="admin-trend-actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(trend)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => remove(trendId)}
                      disabled={deletingId === trendId}
                    >
                      {deletingId === trendId ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                );
              },
            },
          ]}
          rows={filteredAndSorted}
          rowKey={(trend) => getId(trend)}
          rowClassName="admin-trend-row"
          emptyTitle="No trends yet"
          emptySubtitle="Create a trend to curate books on the public page."
        />
      </AdminSection>

      <AdminDialog
        open={composerOpen}
        onClose={closeComposerDialog}
        title={composerMode === "create" ? "Add trend" : "Edit trend"}
        subtitle="Set up the trend card, image, and visibility in one comfortable workspace."
        size="lg"
      >
        <div className="admin-trend-dialog">
          <div className="admin-trend-dialog__form">
            <div className="admin-trend-dialog__fields">
              <AdminFormField label="Name">
                <input
                  className="admin-input"
                  value={trendForm.name}
                  onChange={(event) =>
                    setTrendForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Trending now"
                />
              </AdminFormField>

              <AdminFormField label="Slug">
                <input
                  className="admin-input"
                  value={trendForm.slug}
                  onChange={(event) =>
                    setTrendForm((prev) => ({
                      ...prev,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="trending-now"
                />
              </AdminFormField>

              <AdminFormField label="Sort order">
                <input
                  type="number"
                  className="admin-input"
                  value={trendForm.sortOrder}
                  onChange={(event) =>
                    setTrendForm((prev) => ({
                      ...prev,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </AdminFormField>

              <label className="admin-inline-check admin-trend-dialog__toggle">
                <input
                  type="checkbox"
                  checked={trendForm.isActive}
                  onChange={(event) =>
                    setTrendForm((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                />
                <span>{trendForm.isActive ? "Active trend" : "Inactive trend"}</span>
              </label>
            </div>

            <div className="admin-trend-upload">
              <div className="admin-trend-upload__copy">
                <span className="admin-trend-upload__eyebrow">Trend image</span>
                <p className="admin-row-note">
                  Upload the art that will represent this trend across the site.
                </p>
              </div>

              <label className="admin-trend-upload__button">
                <input
                  type="file"
                  className="admin-trend-upload__input"
                  accept="image/*"
                  onChange={handleComposerImageChange}
                />
                <span>
                  {composerUploading
                    ? "Uploading..."
                    : trendForm.imageUrl || trendForm.imagePreview
                      ? "Replace image"
                      : "Upload image"}
                </span>
              </label>
            </div>
          </div>

          <aside className="admin-trend-dialog__preview">
            <TrendArtwork
              src={trendForm.imagePreview || absUrl(trendForm.imageUrl)}
              alt={trendForm.name || "Trend preview"}
              className="admin-trend-dialog__preview-art"
            />
            <div className="admin-trend-dialog__preview-copy">
              <span className="admin-trend-upload__eyebrow">Preview</span>
              <h3>{trendForm.name || "Untitled trend"}</h3>
              <p>{trendForm.slug || "slug-preview"}</p>
              <div className="admin-trend-dialog__preview-meta">
                <span className="admin-pill admin-pill--neutral">
                  Order {Number(trendForm.sortOrder || 0)}
                </span>
                <span
                  className={`admin-pill ${
                    trendForm.isActive ? "admin-pill--success" : "admin-pill--neutral"
                  }`}
                >
                  {trendForm.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </aside>
        </div>

        <div className="admin-dialog__footer">
          <Button variant="outline" onClick={closeComposerDialog}>
            Cancel
          </Button>
          <Button
            onClick={saveTrend}
            disabled={composerSaving || composerUploading}
          >
            {composerSaving
              ? "Saving..."
              : composerMode === "create"
                ? "Create trend"
                : "Save changes"}
          </Button>
        </div>
      </AdminDialog>

      <AdminDialog
        open={Boolean(imageDialogTrend)}
        onClose={() => setImageDialogTrend(null)}
        title={imageDialogTrend ? getName(imageDialogTrend) : "Trend image"}
        subtitle={
          imageDialogTrend
            ? getSlug(imageDialogTrend) || "Trend image preview"
            : ""
        }
        size="md"
      >
        {imageDialogTrend ? (
          <div className="admin-trend-image-dialog">
            <TrendArtwork
              src={absUrl(getImageUrl(imageDialogTrend))}
              alt={getName(imageDialogTrend)}
              className="admin-trend-image-dialog__art"
            />
            <div className="admin-trend-image-dialog__meta">
              <span
                className={`admin-pill ${
                  getActive(imageDialogTrend)
                    ? "admin-pill--success"
                    : "admin-pill--neutral"
                }`}
              >
                {getActive(imageDialogTrend) ? "Active" : "Inactive"}
              </span>
              <span className="admin-pill admin-pill--neutral">
                Order {getSortOrder(imageDialogTrend)}
              </span>
            </div>
          </div>
        ) : null}
      </AdminDialog>

      <AdminDialog
        open={Boolean(linkedDialogTrend)}
        onClose={closeLinkedBooksDialog}
        title={
          linkedDialogTrend
            ? `Linked books · ${getName(linkedDialogTrend)}`
            : "Linked books"
        }
        subtitle="Review connected titles, search the catalog, and link new books without leaving the table."
        size="xl"
      >
        <div className="admin-trend-books-dialog">
          <section className="admin-trend-books-dialog__search">
            <div className="admin-trend-books-dialog__section-head">
              <span className="admin-trend-upload__eyebrow">Find a book to link</span>
              <p className="admin-row-note">
                Search the catalog and attach a title to this trend in one click.
              </p>
            </div>

            <TextField
              className="admin-search-field"
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder="Search books by title..."
            />

            <div className="admin-trend-books-dialog__catalog">
              {catalogLoading ? (
                <p className="admin-row-note">Searching books...</p>
              ) : catalogErr ? (
                <p className="admin-row-note">{catalogErr}</p>
              ) : catalogSearch.trim().length < 2 ? (
                <p className="admin-row-note">Type at least 2 characters to search.</p>
              ) : catalogResults.length ? (
                <div className="admin-trend-books-dialog__catalog-list">
                  {catalogResults.map((book) => {
                    const alreadyLinked = linkedBooks.some(
                      (linkedBook) => linkedBook.id === book.id,
                    );

                    return (
                      <div
                        key={book.id}
                        className="admin-trend-books-dialog__catalog-item"
                      >
                        <TrendArtwork
                          src={absUrl(book.coverImageUrl)}
                          alt={book.title}
                          className="admin-trend-books-dialog__catalog-art"
                        />
                        <div className="admin-trend-books-dialog__catalog-copy">
                          <p className="admin-row-title">{book.title}</p>
                          <p className="admin-row-note">
                            {book.authorName || "Unknown author"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          disabled={alreadyLinked || linkingBookId === book.id}
                          onClick={() => linkBook(book)}
                        >
                          {alreadyLinked
                            ? "Linked"
                            : linkingBookId === book.id
                              ? "Linking..."
                              : "Link"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="admin-row-note">No books matched that search.</p>
              )}
            </div>
          </section>

          <section className="admin-trend-books-dialog__linked">
            <div className="admin-trend-books-dialog__section-head">
              <span className="admin-trend-upload__eyebrow">Linked books</span>
              <p className="admin-row-note">
                Scroll the connected shelf, filter it, and unlink books when needed.
              </p>
            </div>

            <TextField
              className="admin-search-field"
              value={linkedBooksFilter}
              onChange={setLinkedBooksFilter}
              placeholder="Filter linked books..."
            />

            <div className="admin-trend-books-dialog__linked-list">
              {linkedBooksLoading ? (
                <p className="admin-row-note">Loading linked books...</p>
              ) : !linkedBooks.length ? (
                <p className="admin-row-note">No linked books yet.</p>
              ) : linkedBooksFiltered.length ? (
                linkedBooksPageItems.map((book) => (
                  <div
                    key={book.id}
                    className="admin-trend-books-dialog__linked-item"
                  >
                    <TrendArtwork
                      src={absUrl(book.coverImageUrl)}
                      alt={book.title}
                      className="admin-trend-books-dialog__linked-art"
                    />
                    <div className="admin-trend-books-dialog__linked-copy">
                      <p className="admin-row-title">{book.title}</p>
                      <p className="admin-row-note">
                        {book.authorName || "Unknown author"}
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={unlinkingBookId === book.id}
                      onClick={() => unlinkBook(book.id)}
                    >
                      {unlinkingBookId === book.id ? "Removing..." : "Unlink"}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="admin-row-note">No linked books match that filter.</p>
              )}
            </div>

            <div className="admin-trend-books-dialog__pagination">
              <span className="admin-page-note">
                Page {linkedBooksPage} of {linkedBooksPageCount}
              </span>
              <div className="admin-inline-actions">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={linkedBooksPage <= 1}
                  onClick={() => setLinkedBooksPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={linkedBooksPage >= linkedBooksPageCount}
                  onClick={() => setLinkedBooksPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </div>
      </AdminDialog>
    </>
  );
}
