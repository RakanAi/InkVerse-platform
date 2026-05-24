import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import PageHeader from "../../Shared/ui/PageHeader";
import DropdownSelectSearchable from "../../Shared/ui/DropdownSelectSearchable";
import MultiSelectDropdownSearchable from "../../Shared/ui/MultiSelectDropdownSearchable";
import { buildBookCoverUploadFile } from "../../domain/books/build-book-cover-upload-file";
import {
  formatCompactNumber,
  formatStatusLabel,
  getBookCover,
  getBookDescription,
  getBookTitle,
} from "../../features/author/author.utils";
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
const COVER_CANVAS_H = 800;
const COVER_PREVIEW_W = 180;
const COVER_PREVIEW_H = COVER_PREVIEW_W * (4 / 3);
const COVER_EDITOR_W = 280;
const COVER_EDITOR_H = COVER_EDITOR_W * (4 / 3);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

function getBookNumeric(book, keys) {
  for (const key of keys) {
    const raw = book?.[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }

  return 0;
}

function getBookStatus(book) {
  return book?.status ?? book?.Status ?? "Ongoing";
}

function getBookVerseType(book) {
  return book?.verseType ?? book?.VerseType ?? "Original";
}

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

function clampCoverDraft(draft, imageW, imageH) {
  const zoom = clamp(Number(draft?.zoom) || 1, 1, 3);
  const bounds = getCoverOffsetBounds(imageW, imageH, zoom);

  return {
    zoom,
    offsetX: clamp(Number(draft?.offsetX) || 0, bounds.minX, bounds.maxX),
    offsetY: clamp(Number(draft?.offsetY) || 0, bounds.minY, bounds.maxY),
  };
}

export default function AuthorWorkspace() {
  const { t } = useTranslation();
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
  const [editorFrameSize, setEditorFrameSize] = useState({ width: COVER_EDITOR_W, height: COVER_EDITOR_H });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);
  const [hiddenBookIds, setHiddenBookIds] = useState([]);
  const [rowActionBusyId, setRowActionBusyId] = useState(null);

  const navigate = useNavigate();

  const editorDraftRef = useRef(editorDraft);
  const dragRef = useRef(null);
  const touchRef = useRef(null);
  const coverPreviewUrlRef = useRef("");
  const coverEditorFrameRef = useRef(null);

  useEffect(() => {
    editorDraftRef.current = editorDraft;
  }, [editorDraft]);

  const getEditorFrameSize = useCallback(() => {
    const rect = coverEditorFrameRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return editorFrameSize;
    return { width: rect.width, height: rect.height };
  }, [editorFrameSize]);

  const cleanupCoverPreview = useCallback((url) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    coverPreviewUrlRef.current = form.coverPreviewUrl;
  }, [form.coverPreviewUrl]);

  useEffect(() => () => cleanupCoverPreview(coverPreviewUrlRef.current), [cleanupCoverPreview]);

  useEffect(() => {
    if (!coverEditorOpen) return undefined;

    const updateFrameSize = () => {
      const rect = coverEditorFrameRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      setEditorFrameSize({ width: rect.width, height: rect.height });
    };

    updateFrameSize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateFrameSize) : null;
    if (observer && coverEditorFrameRef.current) observer.observe(coverEditorFrameRef.current);
    window.addEventListener("resize", updateFrameSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateFrameSize);
    };
  }, [coverEditorOpen]);

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
      setError(e?.response?.data?.message || t("author.studio.workspace.errors.load"));
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
    return visibleBooks.filter((b) =>
      `${getBookTitle(b)} ${getBookDescription(b)}`.toLowerCase().includes(term),
    );
  }, [books, query, hiddenBookIds]);

  const overview = useMemo(
    () => ({
      totalBooks: books.length,
      totalChapters: books.reduce(
        (sum, book) => sum + getBookNumeric(book, ["chapterCount", "ChapterCount", "chaptersCount", "ChaptersCount"]),
        0,
      ),
      totalWords: books.reduce(
        (sum, book) => sum + getBookNumeric(book, ["wordCount", "WordCount"]),
        0,
      ),
      totalViews: books.reduce(
        (sum, book) => sum + getBookNumeric(book, ["totalViews", "TotalViews", "viewCount", "ViewCount"]),
        0,
      ),
    }),
    [books],
  );

  const coverPreviewStyle = useMemo(() => {
    if (!form.coverPreviewUrl || !form.coverImageW || !form.coverImageH) return null;
    const previewOffsetX = form.coverOffsetX * (COVER_PREVIEW_W / COVER_CANVAS_W);
    const previewOffsetY = form.coverOffsetY * (COVER_PREVIEW_H / COVER_CANVAS_H);
    return getCoverStyle(form.coverImageW, form.coverImageH, form.coverZoom, previewOffsetX, previewOffsetY, COVER_PREVIEW_W, COVER_PREVIEW_H);
  }, [form]);

  const coverEditorStyle = useMemo(() => {
    if (!form.coverPreviewUrl || !form.coverImageW || !form.coverImageH) return null;
    const editorOffsetX = editorDraft.offsetX * (editorFrameSize.width / COVER_CANVAS_W);
    const editorOffsetY = editorDraft.offsetY * (editorFrameSize.height / COVER_CANVAS_H);
    return getCoverStyle(form.coverImageW, form.coverImageH, editorDraft.zoom, editorOffsetX, editorOffsetY, editorFrameSize.width, editorFrameSize.height);
  }, [form, editorDraft, editorFrameSize]);

  const bookTypeOptions = [
    { value: "Original", label: `${t("author.studio.common.bookType")}: ${t("author.studio.common.original")}` },
    { value: "Fanfic", label: `${t("author.studio.common.bookType")}: ${t("author.studio.common.fanfic")}` },
    { value: "AU", label: `${t("author.studio.common.bookType")}: ${t("author.studio.common.au")}` },
  ];

  const leadGenderOptions = [
    { value: "", label: t("author.studio.common.leadingGender") },
    { value: "Male", label: t("author.studio.common.male") },
    { value: "Female", label: t("author.studio.common.female") },
    { value: "Mixed", label: t("author.studio.common.mixed") },
    { value: "Unknown", label: t("author.studio.common.unknown") },
  ];

  const genreOptions = [
    { value: "", label: t("author.studio.common.genre") },
    ...genres.map((g) => ({ value: String(g.id ?? g.ID), label: g.name ?? g.Name })),
  ];

  const languageOptions = [
    { value: "English", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.english")}` },
    { value: "Arabic", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.arabic")}` },
    { value: "Spanish", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.spanish")}` },
    { value: "French", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.french")}` },
    { value: "Turkish", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.turkish")}` },
    { value: "Other", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.other")}` },
  ];

  const tagOptions = tags.map((t) => ({ value: t.id ?? t.ID, label: t.name ?? t.Name }));
  const trendOptions = [
    { value: "", label: t("author.studio.common.noTrend") },
    ...trends.map((t) => ({ value: String(t.id ?? t.ID), label: t.name ?? t.Name })),
  ];

  const openCoverEditor = () => {
    if (!form.coverPreviewUrl) return;
    setEditorDraft(clampCoverDraft({
      zoom: form.coverZoom,
      offsetX: form.coverOffsetX,
      offsetY: form.coverOffsetY,
    }, form.coverImageW, form.coverImageH));
    setCoverEditorOpen(true);
  };

  const closeCoverEditor = () => {
    dragRef.current = null;
    touchRef.current = null;
    setCoverEditorOpen(false);
  };

  const saveCoverEditor = () => {
    const nextDraft = clampCoverDraft(editorDraft, form.coverImageW, form.coverImageH);
    setForm((prev) => ({ ...prev, coverZoom: nextDraft.zoom, coverOffsetX: nextDraft.offsetX, coverOffsetY: nextDraft.offsetY }));
    closeCoverEditor();
  };

  const updateEditorZoom = (zoom) => {
    setEditorDraft((prev) => clampCoverDraft({ ...prev, zoom }, form.coverImageW, form.coverImageH));
  };

  const handleCoverWheel = (e) => {
    e.preventDefault();
    updateEditorZoom(editorDraftRef.current.zoom + (e.deltaY < 0 ? 0.06 : -0.06));
  };

  const handleEditorMouseDown = (e) => {
    e.preventDefault();
    dragRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
    };
  };

  useEffect(() => {
    if (!coverEditorOpen) return;

    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      const frameSize = getEditorFrameSize();
      const dxCanvas = dx * (COVER_CANVAS_W / frameSize.width);
      const dyCanvas = dy * (COVER_CANVAS_H / frameSize.height);
      setEditorDraft((prev) => clampCoverDraft({
        ...prev,
        offsetX: prev.offsetX + dxCanvas,
        offsetY: prev.offsetY + dyCanvas,
      }, form.coverImageW, form.coverImageH));
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
  }, [coverEditorOpen, form.coverImageW, form.coverImageH, getEditorFrameSize]);

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

      const frameSize = getEditorFrameSize();
      setEditorDraft((prev) => clampCoverDraft({
        ...prev,
        offsetX: prev.offsetX + dx * (COVER_CANVAS_W / frameSize.width),
        offsetY: prev.offsetY + dy * (COVER_CANVAS_H / frameSize.height),
      }, form.coverImageW, form.coverImageH));
      return;
    }

    if (touchRef.current.mode === "pinch" && e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = distance(t1, t2);
      const currentMid = midpoint(t1, t2);

      const ratio = currentDistance / Math.max(touchRef.current.startDistance, 1);
      const nextZoom = clamp(touchRef.current.startZoom * ratio, 1, 3);
      const frameSize = getEditorFrameSize();
      const dx = (currentMid.x - touchRef.current.startMidX) * (COVER_CANVAS_W / frameSize.width);
      const dy = (currentMid.y - touchRef.current.startMidY) * (COVER_CANVAS_H / frameSize.height);

      setEditorDraft((prev) => clampCoverDraft({
        ...prev,
        zoom: nextZoom,
        offsetX: touchRef.current.startOffsetX + dx,
        offsetY: touchRef.current.startOffsetY + dy,
      }, form.coverImageW, form.coverImageH));
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
      setFormError(t("author.studio.workspace.errors.image"));
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
      setFormError(t("author.studio.workspace.errors.title"));
      return;
    }

    if (!form.genreId) {
      setFormError(t("author.studio.workspace.errors.genre"));
      return;
    }

    if (!form.language.trim()) {
      setFormError(t("author.studio.workspace.errors.language"));
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      let coverImageUrl = null;
      if (form.coverFile) {
        const adjustedFile = await buildBookCoverUploadFile(form.coverFile, {
          title: form.title,
          width: COVER_CANVAS_W,
          height: COVER_CANVAS_H,
          zoom: form.coverZoom,
          offsetX: form.coverOffsetX,
          offsetY: form.coverOffsetY,
        });
        coverImageUrl = await uploadBookCover(adjustedFile, { title: form.title });
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
      if (createdBookId > 0) {
        navigate(`/author/workspace/${createdBookId}?tab=bible&setup=1`);
        return;
      }
      await load();
    } catch (e2) {
      setFormError(e2?.response?.data?.message || t("author.studio.workspace.errors.create"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplore = (bookId) => {
    if (!bookId) return;
    navigate(`/author/workspace/${bookId}`);
  };

  const handleHideBook = (bookId) => {
    setHiddenBookIds((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
    setRowMenuOpenId(null);
  };

  const handleDeleteBook = async (bookId) => {
    if (rowActionBusyId) return;
    if (!window.confirm(t("author.studio.workspace.deleteConfirm"))) return;

    setRowActionBusyId(bookId);
    try {
      await deleteBook(bookId);
      setBooks((prev) => prev.filter((b) => (b.id ?? b.ID) !== bookId));
      setRowMenuOpenId(null);
    } catch (e) {
      window.alert(e?.response?.data?.message || t("author.studio.workspace.errors.delete"));
    } finally {
      setRowActionBusyId(null);
    }
  };

  const handleRowSettings = (bookId) => {
    navigate(`/author/workspace/${bookId}`);
    setRowMenuOpenId(null);
  };

  if (loading) return <LoadingState text={t("author.studio.workspace.loading")} />;
  if (error) return <ErrorState title={t("author.studio.workspace.unavailable")} subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-page authorx-page--workspace ink-workspace">
      <section className="ink-workspace-top">
        <div>
          <span className="author-studio-eyebrow">{t("author.studio.workspace.eyebrow")}</span>
          <h1>{t("author.studio.workspace.title")}</h1>
          <p>{t("author.studio.workspace.subtitle")}</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setOpenCreate(true)}>
          {t("author.studio.workspace.createNewBook")}
        </Button>
      </section>

      <section className="ink-workspace-tools">
        <TextField
          value={query}
          onChange={setQuery}
          placeholder={t("author.studio.workspace.searchPlaceholder")}
          className="ink-workspace-search"
        />
        <div className="ink-workspace-count">
          {t("author.studio.workspace.count", {
            filtered: filteredBooks.length,
            total: books.length,
            label: books.length === 1
              ? t("author.studio.workspace.storySingular")
              : t("author.studio.workspace.storyPlural"),
          })}
        </div>
      </section>

      <section className="ink-workspace-stats" aria-label={t("author.studio.workspace.statsLabel")}>
        <div>
          <span>{t("author.studio.common.stories")}</span>
          <strong>{formatCompactNumber(overview.totalBooks)}</strong>
        </div>
        <div>
          <span>{t("author.studio.common.chapters")}</span>
          <strong>{formatCompactNumber(overview.totalChapters)}</strong>
        </div>
        <div>
          <span>{t("author.studio.common.words")}</span>
          <strong>{formatCompactNumber(overview.totalWords)}</strong>
        </div>
        <div>
          <span>{t("author.studio.common.views")}</span>
          <strong>{formatCompactNumber(overview.totalViews)}</strong>
        </div>
      </section>

      <Surface className="ink-workspace-shelf">
        <div className="ink-workspace-shelf__head">
          <div>
            <span>{t("author.studio.workspace.storyShelf")}</span>
            <h2>{t("author.studio.workspace.booksInProgress")}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpenCreate(true)}>
            {t("author.studio.workspace.newBook")}
          </Button>
        </div>

        {filteredBooks.length === 0 ? (
          <EmptyState
            title={t("author.studio.workspace.noBooksTitle")}
            subtitle={books.length ? t("author.studio.workspace.noBooksSearch") : t("author.studio.workspace.noBooksEmpty")}
            action={
              <Button variant="primary" size="sm" onClick={() => setOpenCreate(true)}>
                {t("author.studio.workspace.createBook")}
              </Button>
            }
          />
        ) : (
          <div className="ink-workspace-book-list">
            {filteredBooks.map((book) => {
              const bookId = book.id ?? book.ID;
              const menuOpen = rowMenuOpenId === bookId;
              const busy = rowActionBusyId === bookId;
              const title = getBookTitle(book);
              const description = getBookDescription(book);
              const cover = getBookCover(book);
              const verseType = getBookVerseType(book);
              const status = formatStatusLabel(getBookStatus(book));
              const chapters = getBookNumeric(book, ["chapterCount", "ChapterCount", "chaptersCount", "ChaptersCount"]);
              const words = getBookNumeric(book, ["wordCount", "WordCount"]);
              const views = getBookNumeric(book, ["totalViews", "TotalViews", "viewCount", "ViewCount"]);
              const collections = getBookNumeric(book, ["collectionCount", "CollectionCount", "collections", "Collections"]);

              return (
                <article key={bookId || title} className="ink-workspace-book">
                  <button
                    type="button"
                    className="ink-workspace-book__main"
                    onClick={() => handleExplore(bookId)}
                  >
                    <span className="ink-workspace-book__cover">
                      {cover ? (
                        <img src={cover} alt={title || t("author.studio.common.bookCover")} />
                      ) : (
                        <span>{title.slice(0, 1)}</span>
                      )}
                    </span>
                    <span className="ink-workspace-book__copy">
                      <strong>{title}</strong>
                      <small>{description || t("author.studio.workspace.noSynopsisRow")}</small>
                      <span className="ink-workspace-book__pills">
                        <b>{verseType}</b>
                        <b>{status}</b>
                      </span>
                    </span>
                  </button>

                  <div className="ink-workspace-book__stats" aria-label={t("author.studio.workspace.metricsLabel", { title })}>
                    <span><b>{formatCompactNumber(chapters)}</b> {t("author.studio.common.chapters").toLowerCase()}</span>
                    <span><b>{formatCompactNumber(words)}</b> {t("author.studio.common.words").toLowerCase()}</span>
                    <span><b>{formatCompactNumber(views)}</b> {t("author.studio.common.views").toLowerCase()}</span>
                    <span><b>{formatCompactNumber(collections)}</b> {t("author.studio.common.collections").toLowerCase()}</span>
                  </div>

                  <div className="ink-workspace-book__actions">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleExplore(bookId)}
                    >
                      {t("author.studio.workspace.openDesk")}
                    </Button>

                    <div className="authorx-op-menu-wrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="authorx-op-menu-btn ink-workspace-menu-btn"
                        onClick={() => setRowMenuOpenId((prev) => (prev === bookId ? null : bookId))}
                        disabled={busy}
                        aria-label={t("author.studio.workspace.moreActions", { title })}
                      >
                        ...
                      </button>

                      {menuOpen && (
                        <div className="authorx-op-menu">
                          <button type="button" onClick={() => handleDeleteBook(bookId)} disabled={busy}>
                            {t("author.studio.workspace.deleteBook")}
                          </button>
                          <button type="button" onClick={() => handleHideBook(bookId)} disabled={busy}>
                            {t("author.studio.workspace.hideBook")}
                          </button>
                          <button type="button" onClick={() => handleRowSettings(bookId)} disabled={busy}>
                            {t("author.studio.common.settings")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Surface>

      {openCreate && (
        <div className="authorx-modal-backdrop" onClick={closeCreateModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title={t("author.studio.workspace.createTitle")}
              subtitle={t("author.studio.workspace.createSubtitle")}
              variant="light"
            />

            <form onSubmit={handleCreate} className="authorx-form">
              <TextField
                value={form.title}
                onChange={(v) => setForm((p) => ({ ...p, title: v }))}
                placeholder={t("author.studio.common.bookName")}
              />

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={form.verseType}
                  onChange={(v) => setForm((p) => ({ ...p, verseType: v }))}
                  options={bookTypeOptions}
                  placeholder={t("author.studio.common.bookType")}
                />
                <DropdownSelectSearchable
                  value={form.leadGender}
                  onChange={(v) => setForm((p) => ({ ...p, leadGender: v }))}
                  options={leadGenderOptions}
                  placeholder={t("author.studio.common.leadingGender")}
                />
              </div>

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={form.genreId}
                  onChange={(v) => setForm((p) => ({ ...p, genreId: v }))}
                  options={genreOptions}
                  placeholder={t("author.studio.common.genre")}
                />
                <DropdownSelectSearchable
                  value={form.language}
                  onChange={(v) => setForm((p) => ({ ...p, language: v }))}
                  options={languageOptions}
                  placeholder={t("author.studio.common.language")}
                />
              </div>

              <div className="authorx-cover-slot-field">
                <span className="authorx-upload-label">{t("author.studio.common.cover")}</span>
                <label className={`authorx-cover-slot ${form.coverPreviewUrl ? "has-image" : ""}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleCoverFileChange(e.target.files?.[0] || null)}
                  />
                  <span className="authorx-cover-slot-frame">
                    {form.coverPreviewUrl && coverPreviewStyle ? (
                      <img src={form.coverPreviewUrl} alt={t("author.studio.workspace.coverPreview")} className="authorx-cover-preview-image" style={coverPreviewStyle} />
                    ) : (
                      <span className="authorx-cover-slot-empty">{t("author.studio.common.cover")}</span>
                    )}
                  </span>
                  <span className="authorx-cover-slot-overlay">{t("author.studio.common.uploadImage")}</span>
                </label>
                {form.coverPreviewUrl ? (
                  <button type="button" className="authorx-cover-slot-adjust" onClick={openCoverEditor}>
                    {t("author.studio.common.adjustCover")}
                  </button>
                ) : null}
              </div>

              <MultiSelectDropdownSearchable
                label={t("author.studio.common.tagsDefault")}
                values={form.tagIds}
                onChange={(vals) => setForm((p) => ({ ...p, tagIds: vals }))}
                options={tagOptions}
              />

              <DropdownSelectSearchable
                value={form.trendId}
                onChange={(v) => setForm((p) => ({ ...p, trendId: v }))}
                options={trendOptions}
                placeholder={t("author.studio.common.trendOptional")}
              />

              <textarea
                className="authorx-textarea"
                value={form.synopsis}
                onChange={(e) => setForm((p) => ({ ...p, synopsis: e.target.value }))}
                placeholder={t("author.studio.common.synopsis")}
                rows={5}
              />

              {formError && <div className="authorx-form-error">{formError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeCreateModal} disabled={submitting}>
                  {t("author.studio.common.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={submitting}>
                  {submitting ? t("author.studio.common.creating") : t("author.studio.workspace.createBookSubmit")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {coverEditorOpen && (
        <div className="authorx-modal-backdrop" onClick={closeCoverEditor}>
          <div className="authorx-cover-editor-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader title={t("author.studio.common.adjustCover")} variant="light" />

            <div className="authorx-cover-editor-stage">
              <div
                ref={coverEditorFrameRef}
                className="authorx-cover-editor-frame"
                onWheel={handleCoverWheel}
                onMouseDown={handleEditorMouseDown}
                onTouchStart={handleEditorTouchStart}
                onTouchMove={handleEditorTouchMove}
                onTouchEnd={handleEditorTouchEnd}
              >
                {coverEditorStyle && (
                  <img src={form.coverPreviewUrl} alt={t("author.studio.workspace.coverEditor")} className="authorx-cover-preview-image" style={coverEditorStyle} />
                )}
              </div>
            </div>

            <label className="authorx-cover-editor-range">
              <span>{t("author.studio.common.zoom")}</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={editorDraft.zoom}
                onChange={(e) => updateEditorZoom(e.target.value)}
              />
            </label>

            <div className="authorx-modal-actions">
              <Button type="button" variant="outline" size="md" onClick={closeCoverEditor}>
                {t("author.studio.common.cancel")}
              </Button>
              <Button type="button" variant="primary" size="md" onClick={saveCoverEditor}>
                {t("author.studio.common.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
