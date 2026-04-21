import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import PageHeader from "../../Shared/ui/PageHeader";
import DropdownSelectSearchable from "../../Shared/ui/DropdownSelectSearchable";
import MultiSelectDropdownSearchable from "../../Shared/ui/MultiSelectDropdownSearchable";
import {
  createBook,
  deleteBook,
  fetchGenres,
  fetchMyBooks,
  fetchTags,
  fetchTrends,
  linkBookToTrend,
  uploadBookCover,
} from "./authorApi";

const COVER_CANVAS_W = 600;
const COVER_CANVAS_H = 900;
const COVER_PREVIEW_W = 220;
const COVER_PREVIEW_H = 330;
const COVER_EDITOR_W = 280;
const COVER_EDITOR_H = 420;

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const initialForm = {
  title: "",
  verseType: "Original",
  leadGender: "",
  genreId: "",
  language: "English",
  synopsis: "",
  tagIds: [],
  trendId: "",
  coverFile: null,
  coverPreviewUrl: "",
  coverImageW: 0,
  coverImageH: 0,
  coverZoom: 1,
  coverOffsetX: 0,
  coverOffsetY: 0,
};

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function getCoverStyle(imageW, imageH, zoom, offsetX, offsetY, frameW, frameH) {
  if (!imageW || !imageH) return null;
  const baseScale = Math.max(frameW / imageW, frameH / imageH);
  const drawW = imageW * baseScale * zoom;
  const drawH = imageH * baseScale * zoom;

  return {
    width: `${drawW}px`,
    height: `${drawH}px`,
    left: `${(frameW - drawW) / 2 + offsetX}px`,
    top: `${(frameH - drawH) / 2 + offsetY}px`,
  };
}

function distance(t1, t2) {
  const dx = t1.clientX - t2.clientX;
  const dy = t1.clientY - t2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function midpoint(t1, t2) {
  return {
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  };
}

function getCoverOffsetBounds(imageW, imageH, zoom) {
  if (!imageW || !imageH) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const baseScale = Math.max(COVER_CANVAS_W / imageW, COVER_CANVAS_H / imageH);
  const drawW = imageW * baseScale * zoom;
  const drawH = imageH * baseScale * zoom;
  const maxOffsetX = Math.max(0, (drawW - COVER_CANVAS_W) / 2);
  const maxOffsetY = Math.max(0, (drawH - COVER_CANVAS_H) / 2);

  return {
    minX: -maxOffsetX,
    maxX: maxOffsetX,
    minY: -maxOffsetY,
    maxY: maxOffsetY,
  };
}

async function buildAdjustedCoverFile(file, title, zoom, offsetX, offsetY) {
  const srcUrl = URL.createObjectURL(file);
  try {
    const img = await loadImageFromUrl(srcUrl);
    const canvas = document.createElement("canvas");
    canvas.width = COVER_CANVAS_W;
    canvas.height = COVER_CANVAS_H;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to prepare cover image.");

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, COVER_CANVAS_W, COVER_CANVAS_H);

    const baseScale = Math.max(COVER_CANVAS_W / img.width, COVER_CANVAS_H / img.height);
    const drawW = img.width * baseScale * zoom;
    const drawH = img.height * baseScale * zoom;
    const drawX = (COVER_CANVAS_W - drawW) / 2 + offsetX;
    const drawY = (COVER_CANVAS_H - drawH) / 2 + offsetY;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    });

    if (!blob) throw new Error("Could not build cover preview.");

    const safeName = (title || "book")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "book";

    return new File([blob], `${safeName}-cover.webp`, { type: blob.type });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

export default function AuthorWorkspace() {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [trends, setTrends] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [coverEditorOpen, setCoverEditorOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editorDraft, setEditorDraft] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);
  const [hiddenBookIds, setHiddenBookIds] = useState([]);
  const [rowActionBusyId, setRowActionBusyId] = useState(null);

  const navigate = useNavigate();

  const editorDraftRef = useRef(editorDraft);
  const dragRef = useRef(null);
  const touchRef = useRef(null);

  useEffect(() => {
    editorDraftRef.current = editorDraft;
  }, [editorDraft]);

  const cleanupCoverPreview = useCallback((url) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    return () => {
      cleanupCoverPreview(form.coverPreviewUrl);
    };
  }, [cleanupCoverPreview, form.coverPreviewUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [booksRes, genresRes, tagsRes, trendsRes] = await Promise.allSettled([
        fetchMyBooks(),
        fetchGenres(),
        fetchTags(),
        fetchTrends(),
      ]);

      if (booksRes.status !== "fulfilled") throw booksRes.reason;

      setBooks(Array.isArray(booksRes.value) ? booksRes.value : []);
      setGenres(genresRes.status === "fulfilled" && Array.isArray(genresRes.value) ? genresRes.value : []);
      setTags(tagsRes.status === "fulfilled" && Array.isArray(tagsRes.value) ? tagsRes.value : []);
      setTrends(trendsRes.status === "fulfilled" && Array.isArray(trendsRes.value) ? trendsRes.value : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load workspace data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredBooks = useMemo(() => {
    const visibleBooks = books.filter((b) => !hiddenBookIds.includes(b.id ?? b.ID));
    const term = query.trim().toLowerCase();
    if (!term) return visibleBooks;
    return visibleBooks.filter((b) => `${b.title || ""} ${b.description || ""}`.toLowerCase().includes(term));
  }, [books, query, hiddenBookIds]);

  const coverPreviewStyle = useMemo(() => {
    if (!form.coverPreviewUrl || !form.coverImageW || !form.coverImageH) return null;
    const previewOffsetX = form.coverOffsetX * (COVER_PREVIEW_W / COVER_CANVAS_W);
    const previewOffsetY = form.coverOffsetY * (COVER_PREVIEW_H / COVER_CANVAS_H);
    return getCoverStyle(form.coverImageW, form.coverImageH, form.coverZoom, previewOffsetX, previewOffsetY, COVER_PREVIEW_W, COVER_PREVIEW_H);
  }, [form]);

  const coverEditorStyle = useMemo(() => {
    if (!form.coverPreviewUrl || !form.coverImageW || !form.coverImageH) return null;
    const editorOffsetX = editorDraft.offsetX * (COVER_EDITOR_W / COVER_CANVAS_W);
    const editorOffsetY = editorDraft.offsetY * (COVER_EDITOR_H / COVER_CANVAS_H);
    return getCoverStyle(form.coverImageW, form.coverImageH, editorDraft.zoom, editorOffsetX, editorOffsetY, COVER_EDITOR_W, COVER_EDITOR_H);
  }, [form, editorDraft]);

  const bookTypeOptions = [
    { value: "Original", label: "Book Type: Original" },
    { value: "Fanfic", label: "Book Type: Fanfic" },
    { value: "AU", label: "Book Type: AU" },
  ];

  const leadGenderOptions = [
    { value: "", label: "Leading Gender" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Mixed", label: "Mixed" },
    { value: "Unknown", label: "Unknown" },
  ];

  const genreOptions = [
    { value: "", label: "Genre" },
    ...genres.map((g) => ({ value: String(g.id ?? g.ID), label: g.name ?? g.Name })),
  ];

  const languageOptions = [
    { value: "English", label: "Language: English" },
    { value: "Arabic", label: "Language: Arabic" },
    { value: "Spanish", label: "Language: Spanish" },
    { value: "French", label: "Language: French" },
    { value: "Turkish", label: "Language: Turkish" },
    { value: "Other", label: "Language: Other" },
  ];

  const tagOptions = tags.map((t) => ({ value: t.id ?? t.ID, label: t.name ?? t.Name }));
  const trendOptions = [
    { value: "", label: "No Trend" },
    ...trends.map((t) => ({ value: String(t.id ?? t.ID), label: t.name ?? t.Name })),
  ];

  const openCoverEditor = () => {
    if (!form.coverPreviewUrl) return;
    const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, form.coverZoom);
    setEditorDraft({
      zoom: form.coverZoom,
      offsetX: clamp(form.coverOffsetX, b.minX, b.maxX),
      offsetY: clamp(form.coverOffsetY, b.minY, b.maxY),
    });
    setCoverEditorOpen(true);
  };

  const closeCoverEditor = () => {
    dragRef.current = null;
    touchRef.current = null;
    setCoverEditorOpen(false);
  };

  const saveCoverEditor = () => {
    setForm((prev) => ({ ...prev, coverZoom: editorDraft.zoom, coverOffsetX: editorDraft.offsetX, coverOffsetY: editorDraft.offsetY }));
    closeCoverEditor();
  };

  const handleCoverWheel = (e) => {
    e.preventDefault();
    const nextZoom = clamp(editorDraftRef.current.zoom + (e.deltaY < 0 ? 0.06 : -0.06), 1, 3);
    const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, nextZoom);
    setEditorDraft((prev) => ({ ...prev, zoom: nextZoom, offsetX: clamp(prev.offsetX, b.minX, b.maxX), offsetY: clamp(prev.offsetY, b.minY, b.maxY) }));
  };

  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: editorDraftRef.current.offsetX,
      baseOffsetY: editorDraftRef.current.offsetY,
    };
  };

  useEffect(() => {
    if (!coverEditorOpen) return;

    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const dxCanvas = dx * (COVER_CANVAS_W / COVER_EDITOR_W);
      const dyCanvas = dy * (COVER_CANVAS_H / COVER_EDITOR_H);
      const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, editorDraftRef.current.zoom);

      setEditorDraft((prev) => ({
        ...prev,
        offsetX: clamp(dragRef.current.baseOffsetX + dxCanvas, b.minX, b.maxX),
        offsetY: clamp(dragRef.current.baseOffsetY + dyCanvas, b.minY, b.maxY),
      }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [coverEditorOpen, form.coverImageW, form.coverImageH]);

  const handleEditorTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current = { mode: "pan", lastX: t.clientX, lastY: t.clientY };
      return;
    }

    if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const mid = midpoint(t1, t2);
      touchRef.current = {
        mode: "pinch",
        startDistance: distance(t1, t2),
        startZoom: editorDraftRef.current.zoom,
        startOffsetX: editorDraftRef.current.offsetX,
        startOffsetY: editorDraftRef.current.offsetY,
        startMidX: mid.x,
        startMidY: mid.y,
      };
    }
  };

  const handleEditorTouchMove = (e) => {
    if (!touchRef.current) return;
    e.preventDefault();

    if (touchRef.current.mode === "pan" && e.touches.length === 1) {
      const t = e.touches[0];
      const dx = t.clientX - touchRef.current.lastX;
      const dy = t.clientY - touchRef.current.lastY;

      touchRef.current.lastX = t.clientX;
      touchRef.current.lastY = t.clientY;

      setEditorDraft((prev) => ({
        ...prev,
        offsetX: prev.offsetX + dx * (COVER_CANVAS_W / COVER_EDITOR_W),
        offsetY: prev.offsetY + dy * (COVER_CANVAS_H / COVER_EDITOR_H),
      }));
      return;
    }

    if (touchRef.current.mode === "pinch" && e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = distance(t1, t2);
      const currentMid = midpoint(t1, t2);

      const ratio = currentDistance / Math.max(touchRef.current.startDistance, 1);
      const nextZoom = clamp(touchRef.current.startZoom * ratio, 1, 3);
      const dx = (currentMid.x - touchRef.current.startMidX) * (COVER_CANVAS_W / COVER_EDITOR_W);
      const dy = (currentMid.y - touchRef.current.startMidY) * (COVER_CANVAS_H / COVER_EDITOR_H);

      const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, nextZoom);
      setEditorDraft((prev) => ({
        ...prev,
        zoom: nextZoom,
        offsetX: clamp(touchRef.current.startOffsetX + dx, b.minX, b.maxX),
        offsetY: clamp(touchRef.current.startOffsetY + dy, b.minY, b.maxY),
      }));
    }
  };

  const handleEditorTouchEnd = (e) => {
    if (e.touches.length === 0) {
      touchRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current = { mode: "pan", lastX: t.clientX, lastY: t.clientY };
    }
  };

  const handleCoverFileChange = async (file) => {
    if (form.coverPreviewUrl) cleanupCoverPreview(form.coverPreviewUrl);

    if (!file) {
      setForm((prev) => ({
        ...prev,
        coverFile: null,
        coverPreviewUrl: "",
        coverImageW: 0,
        coverImageH: 0,
        coverZoom: 1,
        coverOffsetX: 0,
        coverOffsetY: 0,
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    try {
      const img = await loadImageFromUrl(previewUrl);
      setForm((prev) => ({
        ...prev,
        coverFile: file,
        coverPreviewUrl: previewUrl,
        coverImageW: img.width,
        coverImageH: img.height,
        coverZoom: 1,
        coverOffsetX: 0,
        coverOffsetY: 0,
      }));
      setEditorDraft({ zoom: 1, offsetX: 0, offsetY: 0 });
      setCoverEditorOpen(true);
    } catch {
      cleanupCoverPreview(previewUrl);
      setFormError("Could not load this image file.");
    }
  };

  const closeCreateModal = () => {
    if (submitting) return;
    cleanupCoverPreview(form.coverPreviewUrl);
    setOpenCreate(false);
    setCoverEditorOpen(false);
    setForm(initialForm);
    setFormError("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.title.trim()) {
      setFormError("Book name is required.");
      return;
    }

    if (!form.genreId) {
      setFormError("Please select a genre.");
      return;
    }

    if (!form.language.trim()) {
      setFormError("Please choose book language.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      let coverImageUrl = null;
      if (form.coverFile) {
        const adjustedFile = await buildAdjustedCoverFile(
          form.coverFile,
          form.title,
          form.coverZoom,
          form.coverOffsetX,
          form.coverOffsetY,
        );
        coverImageUrl = await uploadBookCover(adjustedFile);
      }

      const selectedTagIds = (Array.isArray(form.tagIds) ? form.tagIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));

      const created = await createBook({
        title: form.title.trim(),
        description: form.synopsis.trim(),
        coverImageUrl,
        status: "Ongoing",
        verseType: form.verseType,
        originType: "PlatformOriginal",
        genreIds: [Number(form.genreId)],
        tagIds: selectedTagIds,
      });

      const createdBookId = Number(created?.id ?? created?.ID ?? 0);
      const selectedTrendId = Number(form.trendId);
      if (Number.isFinite(selectedTrendId) && selectedTrendId > 0 && createdBookId > 0) {
        try {
          await linkBookToTrend(selectedTrendId, createdBookId);
        } catch {
          // Keep book creation successful even if trend linking is unavailable for this role.
        }
      }

      cleanupCoverPreview(form.coverPreviewUrl);
      setOpenCreate(false);
      setCoverEditorOpen(false);
      setForm(initialForm);
      await load();
    } catch (e2) {
      setFormError(e2?.response?.data?.message || "Failed to create book.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplore = (bookId) => {
    navigate(`/author/workspace/${bookId}`);
  };

  const handleHideBook = (bookId) => {
    setHiddenBookIds((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
    setRowMenuOpenId(null);
  };

  const handleDeleteBook = async (bookId) => {
    if (rowActionBusyId) return;
    if (!window.confirm("Delete this book? This action cannot be undone.")) return;

    setRowActionBusyId(bookId);
    try {
      await deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => (b.id ?? b.ID) !== bookId));
      setRowMenuOpenId(null);
    } catch (e) {
      window.alert(e?.response?.data?.message || "Failed to delete book.");
    } finally {
      setRowActionBusyId(null);
    }
  };

  const handleRowSettings = (bookId) => {
    navigate(`/author/workspace/${bookId}`);
    setRowMenuOpenId(null);
  };

  if (loading) return <LoadingState text="Loading your workspace..." />;
  if (error) return <ErrorState title="Workspace Unavailable" subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-page">
      <section className="authorx-workspace-head">
        <h1>Workspace</h1>
        <Button variant="primary" size="md" onClick={() => setOpenCreate(true)}>
          Create New Book
        </Button>
      </section>

      <Surface className="authorx-toolbar">
        <TextField
          value={query}
          onChange={setQuery}
          placeholder="Search your books by title or description"
          className="authorx-search"
        />
        <div className="authorx-toolbar-meta">{filteredBooks.length} books</div>
      </Surface>

      <Surface className="authorx-books-panel">
        {filteredBooks.length === 0 ? (
          <EmptyState
            title="No books found"
            subtitle={books.length ? "Try another search." : "Create your first book to get started."}
            action={
              <Button variant="primary" size="sm" onClick={() => setOpenCreate(true)}>
                Create Book
              </Button>
            }
          />
        ) : (
          <div className="authorx-books-table-wrap">
            <div className="authorx-books-table authorx-books-head-row">
              <div className="authorx-col-story">Story</div>
              <div className="authorx-col-state">State</div>
              <div className="authorx-col-chapters">Chapters</div>
              <div className="authorx-col-words">Words</div>
              <div className="authorx-col-views">Views</div>
              <div className="authorx-col-collections">Collections</div>
              <div className="authorx-col-operation">Operation</div>
            </div>

            {filteredBooks.map((book) => {
              const bookId = book.id ?? book.ID;
              const menuOpen = rowMenuOpenId === bookId;
              const busy = rowActionBusyId === bookId;

              return (
                <div key={bookId} className="authorx-books-table authorx-books-data-row">
                  <div className="authorx-col-story authorx-story-cell">
                    <div className="authorx-story-cover">
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} alt={book.title || "Book cover"} />
                      ) : (
                        <span>No Cover</span>
                      )}
                    </div>
                    <div className="authorx-story-meta">
                      <h3>{book.title || "Untitled"}</h3>
                    </div>
                  </div>
                  <div className="authorx-col-state">{book.status || "Ongoing"}</div>
                  <div className="authorx-col-chapters">{book.chapterCount || 0}</div>
                  <div className="authorx-col-words">{(book.wordCount || 0).toLocaleString()}</div>
                  <div className="authorx-col-views">{(book.totalViews || 0).toLocaleString()}</div>
                  <div className="authorx-col-collections">{(book.collectionCount || 0).toLocaleString()}</div>
                  <div className="authorx-col-operation authorx-op-cell">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="authorx-op-explore"
                      onClick={() => handleExplore(bookId)}
                    >
                      Explore
                    </Button>

                    <div className="authorx-op-menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="authorx-op-menu-btn"
                        onClick={() => setRowMenuOpenId((prev) => (prev === bookId ? null : bookId))}
                        disabled={busy}
                      >
                        ...
                      </button>

                      {menuOpen && (
                        <div className="authorx-op-menu">
                          <button type="button" onClick={() => handleDeleteBook(bookId)} disabled={busy}>
                            Delete Book
                          </button>
                          <button type="button" onClick={() => handleHideBook(bookId)} disabled={busy}>
                            Hide Book
                          </button>
                          <button type="button" onClick={() => handleRowSettings(bookId)} disabled={busy}>
                            Settings
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Surface>

      {openCreate && (
        <div className="authorx-modal-backdrop" onClick={closeCreateModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader title="Create New Book" subtitle="Fill book info, cover, tags, and synopsis." variant="light" />

            <form onSubmit={handleCreate} className="authorx-form">
              <TextField
                value={form.title}
                onChange={(v) => setForm((p) => ({ ...p, title: v }))}
                placeholder="Book name"
              />

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={form.verseType}
                  onChange={(v) => setForm((p) => ({ ...p, verseType: v }))}
                  options={bookTypeOptions}
                  placeholder="Book Type"
                />
                <DropdownSelectSearchable
                  value={form.leadGender}
                  onChange={(v) => setForm((p) => ({ ...p, leadGender: v }))}
                  options={leadGenderOptions}
                  placeholder="Leading Gender"
                />
              </div>

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={form.genreId}
                  onChange={(v) => setForm((p) => ({ ...p, genreId: v }))}
                  options={genreOptions}
                  placeholder="Genre"
                />
                <DropdownSelectSearchable
                  value={form.language}
                  onChange={(v) => setForm((p) => ({ ...p, language: v }))}
                  options={languageOptions}
                  placeholder="Language"
                />
              </div>

              <div className="authorx-upload-row">
                <label className="authorx-upload-label">Cover</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="authorx-file-input"
                  onChange={(e) => handleCoverFileChange(e.target.files?.[0] || null)}
                />
              </div>

              <div className="authorx-cover-summary">
                {form.coverPreviewUrl && coverPreviewStyle ? (
                  <button type="button" className="authorx-cover-thumb-btn" onClick={openCoverEditor}>
                    <div className="authorx-cover-preview-frame">
                      <img src={form.coverPreviewUrl} alt="Cover preview" className="authorx-cover-preview-image" style={coverPreviewStyle} />
                    </div>
                    <span>Click to edit cover</span>
                  </button>
                ) : (
                  <div className="authorx-cover-placeholder">Choose a cover file first</div>
                )}
              </div>

              <MultiSelectDropdownSearchable
                label="Tags (default website tags)"
                values={form.tagIds}
                onChange={(vals) => setForm((p) => ({ ...p, tagIds: vals }))}
                options={tagOptions}
              />

              <DropdownSelectSearchable
                value={form.trendId}
                onChange={(v) => setForm((p) => ({ ...p, trendId: v }))}
                options={trendOptions}
                placeholder="Link to Trend (optional)"
              />

              <textarea
                className="authorx-textarea"
                value={form.synopsis}
                onChange={(e) => setForm((p) => ({ ...p, synopsis: e.target.value }))}
                placeholder="Synopsis"
                rows={5}
              />

              {formError && <div className="authorx-form-error">{formError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeCreateModal} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Book"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {coverEditorOpen && (
        <div className="authorx-modal-backdrop" onClick={closeCoverEditor}>
          <div className="authorx-cover-editor-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader title="Edit Cover" subtitle="Use mouse wheel or pinch to zoom. Drag to move." variant="light" />

            <div
              className="authorx-cover-editor-frame"
              onWheel={handleCoverWheel}
              onMouseDown={handleEditorMouseDown}
              onTouchStart={handleEditorTouchStart}
              onTouchMove={handleEditorTouchMove}
              onTouchEnd={handleEditorTouchEnd}
            >
              {coverEditorStyle && (
                <img src={form.coverPreviewUrl} alt="Cover editor" className="authorx-cover-preview-image" style={coverEditorStyle} />
              )}
            </div>

            <div className="authorx-cover-editor-quick">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditorDraft((prev) => {
                    const nextZoom = clamp(prev.zoom - 0.08, 1, 3);
                    const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, nextZoom);
                    return {
                      ...prev,
                      zoom: nextZoom,
                      offsetX: clamp(prev.offsetX, b.minX, b.maxX),
                      offsetY: clamp(prev.offsetY, b.minY, b.maxY),
                    };
                  });
                }}
              >
                Zoom -
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditorDraft((prev) => {
                    const nextZoom = clamp(prev.zoom + 0.08, 1, 3);
                    const b = getCoverOffsetBounds(form.coverImageW, form.coverImageH, nextZoom);
                    return {
                      ...prev,
                      zoom: nextZoom,
                      offsetX: clamp(prev.offsetX, b.minX, b.maxX),
                      offsetY: clamp(prev.offsetY, b.minY, b.maxY),
                    };
                  });
                }}
              >
                Zoom +
              </Button>
              <span className="authorx-cover-zoom-label">{editorDraft.zoom.toFixed(2)}x</span>
            </div>

            <div className="authorx-modal-actions">
              <Button type="button" variant="outline" size="md" onClick={closeCoverEditor}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="md" onClick={saveCoverEditor}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
