import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiEdit2 } from "react-icons/fi";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import PageHeader from "../../Shared/ui/PageHeader";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import DropdownSelectSearchable from "../../Shared/ui/DropdownSelectSearchable";
import MultiSelectDropdownSearchable from "../../Shared/ui/MultiSelectDropdownSearchable";
import Segmented from "../../Shared/ui/Segmented";
import {
  fetchBookById,
  fetchBookArcs,
  fetchBookChapters,
  fetchGenres,
  fetchTags,
  fetchTrends,
  updateBook,
  deleteChapter,
  createBookArc,
  linkBookToTrend,
  uploadBookCover,
} from "./authorApi";

const DEFAULT_EDIT = {
  title: "",
  verseType: "Original",
  leadGender: "",
  language: "English",
  coverImageUrl: "",
  synopsis: "",
  genreId: "",
  tagIds: [],
  trendId: "",
  coverFile: null,
  coverPreviewUrl: "",
  coverZoom: 1,
};

const COVER_CANVAS_W = 600;
const COVER_CANVAS_H = 900;

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function buildAdjustedCoverFile(file, title, zoom) {
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
    const drawX = (COVER_CANVAS_W - drawW) / 2;
    const drawY = (COVER_CANVAS_H - drawH) / 2;

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

function chapterBucket(chapter) {
  const status = String(chapter?.status ?? chapter?.chapterStatus ?? "").toLowerCase();
  const isDeleted = chapter?.isDeleted || chapter?.deletedAt || status.includes("trash") || status.includes("delete");
  if (isDeleted) return "trash";

  const isPublished = chapter?.isPublished || status.includes("publish");
  if (isPublished) return "published";

  // Backend chapters do not expose draft/published state yet.
  // Treat persisted chapters as published unless explicitly marked otherwise.
  return "published";
}

function getTagId(item) {
  return item?.id ?? item?.ID ?? item?.tagId ?? item?.TagId;
}

function getTagName(item) {
  return item?.name ?? item?.Name ?? item?.tagName ?? item?.TagName;
}

function getDraftsKey(bookId) {
  return `inkverse:author:chapter-drafts:${bookId}`;
}

function getLegacyDraftKey(bookId) {
  return `inkverse:author:chapter-draft:${bookId}`;
}

function getTrashKey(bookId) {
  return `inkverse:author:chapter-trash:${bookId}`;
}

function persistDrafts(bookId, drafts) {
  if (!bookId || typeof window === "undefined") return;
  localStorage.setItem(getDraftsKey(bookId), JSON.stringify(drafts));
}

function readLocalDrafts(bookId) {
  if (!bookId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getDraftsKey(bookId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    const legacyRaw = localStorage.getItem(getLegacyDraftKey(bookId));
    if (!legacyRaw) return [];

    const legacy = JSON.parse(legacyRaw);
    if (!legacy || typeof legacy !== "object") return [];

    const migrated = [{
      id: `legacy-${Date.now()}`,
      title: String(legacy?.title ?? ""),
      contentHtml: String(legacy?.contentHtml ?? ""),
      arcId: String(legacy?.arcId ?? ""),
      authorThought: String(legacy?.authorThought ?? ""),
      savedAt: legacy?.savedAt ?? new Date().toISOString(),
    }];

    persistDrafts(bookId, migrated);
    localStorage.removeItem(getLegacyDraftKey(bookId));
    return migrated;
  } catch {
    return [];
  }
}

function createLocalDraft(bookId) {
  const drafts = readLocalDrafts(bookId);
  const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  drafts.push({
    id,
    title: "",
    contentHtml: "",
    arcId: "",
    authorThought: "",
    savedAt: new Date().toISOString(),
  });
  persistDrafts(bookId, drafts);
  return id;
}

function removeLocalDraft(bookId, draftId) {
  const drafts = readLocalDrafts(bookId);
  const next = drafts.filter((d) => String(d?.id) !== String(draftId));
  persistDrafts(bookId, next);
}

function readLocalTrash(bookId) {
  if (!bookId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getTrashKey(bookId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistTrash(bookId, items) {
  if (!bookId || typeof window === "undefined") return;
  localStorage.setItem(getTrashKey(bookId), JSON.stringify(items));
}

function addToTrash(bookId, item) {
  const current = readLocalTrash(bookId);
  const entry = {
    id: item?.id ?? `trash-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: item?.title ?? "Untitled",
    chapterNumber: item?.chapterNumber ?? null,
    createdAt: item?.createdAt ?? null,
    deletedAt: new Date().toISOString(),
    contentHtml: item?.contentHtml ?? "",
    arcId: item?.arcId ?? "",
    authorThought: item?.authorThought ?? "",
    source: item?.source ?? "unknown",
    isLocalTrash: true,
  };
  persistTrash(bookId, [entry, ...current]);
}

function reorderById(items, fromId, toId) {
  const fromIndex = items.findIndex((item) => String(item?.id) === String(fromId));
  const toIndex = items.findIndex((item) => String(item?.id) === String(toId));
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}
export default function AuthorBookDetails() {
  const { bookId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [arcs, setArcs] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [genres, setGenres] = useState([]);
  const [tags, setTags] = useState([]);
  const [trends, setTrends] = useState([]);
  const [activeTab, setActiveTab] = useState("draft");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState(DEFAULT_EDIT);
  const [hoveredChapterId, setHoveredChapterId] = useState(null);
  const [hoveredArcLabel, setHoveredArcLabel] = useState("");
  const [deletingChapterId, setDeletingChapterId] = useState(null);
  const [localVersion, setLocalVersion] = useState(0);
  const [chapterActionError, setChapterActionError] = useState("");
  const [arcModalOpen, setArcModalOpen] = useState(false);
  const [arcName, setArcName] = useState("");
  const [arcSaving, setArcSaving] = useState(false);
  const [arcError, setArcError] = useState("");
  const [renameArcOpen, setRenameArcOpen] = useState(false);
  const [renameArcId, setRenameArcId] = useState("");
  const [renameArcName, setRenameArcName] = useState("");
  const [renameArcError, setRenameArcError] = useState("");
  const [adjustArcOpen, setAdjustArcOpen] = useState(false);
  const [adjustArcItems, setAdjustArcItems] = useState([]);
  const [draggingArcId, setDraggingArcId] = useState("");
  const [adjustArcError, setAdjustArcError] = useState("");
  const [deletingArcId, setDeletingArcId] = useState("");

  const load = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError("");

    try {
      const [bookRes, chaptersRes, arcsRes, genresRes, tagsRes, trendsRes] = await Promise.allSettled([
        fetchBookById(bookId),
        fetchBookChapters(bookId),
        fetchBookArcs(bookId),
        fetchGenres(),
        fetchTags(),
        fetchTrends(),
      ]);

      if (bookRes.status !== "fulfilled") throw bookRes.reason;

      const nextBook = bookRes.value;
      setBook(nextBook);

      setChapters(
        chaptersRes.status === "fulfilled" && Array.isArray(chaptersRes.value)
          ? chaptersRes.value
          : [],
      );
      setArcs(
        arcsRes.status === "fulfilled" && Array.isArray(arcsRes.value)
          ? arcsRes.value
          : [],
      );
      setGenres(
        genresRes.status === "fulfilled" && Array.isArray(genresRes.value)
          ? genresRes.value
          : [],
      );
      setTrends(
        trendsRes.status === "fulfilled" && Array.isArray(trendsRes.value)
          ? trendsRes.value
          : [],
      );
      setTags(
        tagsRes.status === "fulfilled" && Array.isArray(tagsRes.value)
          ? tagsRes.value
          : [],
      );

      const initialTagIds = Array.isArray(nextBook?.tags)
        ? nextBook.tags.map((t) => Number(getTagId(t))).filter((id) => Number.isFinite(id))
        : [];

      setEditForm({
        title: nextBook?.title ?? "",
        verseType: nextBook?.verseType ?? nextBook?.VerseType ?? "Original",
        leadGender: nextBook?.leadGender ?? nextBook?.LeadGender ?? "",
        language: nextBook?.language ?? nextBook?.Language ?? "English",
        coverImageUrl: nextBook?.coverImageUrl ?? nextBook?.CoverImageUrl ?? "",
        synopsis: nextBook?.description ?? nextBook?.synopsis ?? "",
        genreId: String(nextBook?.genreId ?? nextBook?.genreID ?? nextBook?.genreIds?.[0] ?? nextBook?.GenreIds?.[0] ?? ""),
        tagIds: initialTagIds,
        trendId: "",
        coverFile: null,
        coverPreviewUrl: nextBook?.coverImageUrl ?? nextBook?.CoverImageUrl ?? "",
        coverZoom: 1,
      });
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load book details.");
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const groups = { draft: [], published: [], trash: [] };
    chapters.forEach((c) => {
      const bucket = chapterBucket(c);
      groups[bucket].push(c);
    });

    const localDrafts = readLocalDrafts(bookId);
    groups.draft.push(
      ...localDrafts.map((d) => ({
        id: `local-${d.id}`,
        draftId: d.id,
        title: String(d?.title ?? "").trim() || "Untitled Draft",
        chapterNumber: null,
        createdAt: d?.savedAt ?? null,
        arcId: d?.arcId ?? "",
        contentHtml: d?.contentHtml ?? "",
        authorThought: d?.authorThought ?? "",
        isLocalDraft: true,
      })),
    );

    const localTrash = readLocalTrash(bookId);
    groups.trash.push(...localTrash);

    groups.draft.sort((a, b) => {
      if (a.isLocalDraft && b.isLocalDraft) {
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      }
      return (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0);
    });
    groups.published.sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));
    groups.trash.sort((a, b) => {
      const aTime = new Date(a.deletedAt ?? a.createdAt ?? 0).getTime();
      const bTime = new Date(b.deletedAt ?? b.createdAt ?? 0).getTime();
      return bTime - aTime;
    });
    return groups;
  }, [chapters, bookId, localVersion]);

  const tabList = [
    { key: "draft", label: "Draft", count: grouped.draft.length },
    { key: "published", label: "Published", count: grouped.published.length },
    { key: "trash", label: "Trash", count: grouped.trash.length },
  ];

  const visibleChapters = grouped[activeTab] || [];
  const normalizedArcs = useMemo(() => {
    return arcs
      .map((arc, index) => ({
        ...arc,
        id: String(arc?.id ?? arc?.ID ?? ""),
        name: String(arc?.name ?? arc?.Name ?? "").trim() || `Volume #${arc?.id ?? arc?.ID ?? index + 1}`,
        order: Number(arc?.order ?? arc?.Order ?? index),
      }))
      .filter((arc) => arc.id)
      .sort((a, b) => a.order - b.order);
  }, [arcs]);

  const arcNameById = useMemo(() => {
    const map = new Map();
    normalizedArcs.forEach((arc) => {
      map.set(arc.id, arc.name);
    });
    return map;
  }, [normalizedArcs]);

  const getArcId = useCallback((chapter) => {
    const arcId = chapter?.arcId ?? chapter?.ArcId;
    if (arcId === null || arcId === undefined || String(arcId).trim() === "") return "";
    return String(arcId);
  }, []);

  const getArcLabel = useCallback((chapter) => {
    const arcId = getArcId(chapter);
    if (!arcId) return "No Volume";

    const namedArc = String(chapter?.arcName ?? chapter?.ArcName ?? "").trim();
    if (namedArc) return namedArc;

    return arcNameById.get(arcId) || `Volume #${arcId}`;
  }, [arcNameById, getArcId]);

  const chapterSections = useMemo(() => {
    const byArc = new Map();

    visibleChapters.forEach((chapter) => {
      const arcId = getArcId(chapter);
      const mapKey = arcId ? `arc:${arcId}` : `none:${getArcLabel(chapter)}`;

      if (!byArc.has(mapKey)) {
        byArc.set(mapKey, {
          key: mapKey,
          arcId,
          label: getArcLabel(chapter),
          items: [],
        });
      }

      byArc.get(mapKey).items.push(chapter);
    });

    const sections = Array.from(byArc.values());
    if (activeTab !== "published") return sections;

    const orderMap = new Map(normalizedArcs.map((arc, idx) => [arc.id, idx]));
    return sections.sort((a, b) => {
      const aHasArc = Boolean(a.arcId);
      const bHasArc = Boolean(b.arcId);
      if (!aHasArc && !bHasArc) return 0;
      if (!aHasArc) return 1;
      if (!bHasArc) return -1;
      return (orderMap.get(a.arcId) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(b.arcId) ?? Number.MAX_SAFE_INTEGER);
    });
  }, [visibleChapters, getArcId, getArcLabel, activeTab, normalizedArcs]);

  const tagOptions = tags.map((t) => ({
    value: Number(getTagId(t)),
    label: getTagName(t),
  }));

  const genreOptions = [
    { value: "", label: "Genre" },
    ...genres.map((g) => ({
      value: String(g.id ?? g.ID),
      label: g.name ?? g.Name,
    })),
  ];
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
  const languageOptions = [
    { value: "English", label: "Language: English" },
    { value: "Arabic", label: "Language: Arabic" },
    { value: "Spanish", label: "Language: Spanish" },
    { value: "French", label: "Language: French" },
    { value: "Turkish", label: "Language: Turkish" },
    { value: "Other", label: "Language: Other" },
  ];
  const trendOptions = [
    { value: "", label: "No Trend" },
    ...trends.map((t) => ({
      value: String(t?.id ?? t?.ID ?? ""),
      label: t?.name ?? t?.Name ?? "Unnamed trend",
    })),
  ];


  const authorName =
    book?.authorName ??
    book?.AuthorName ??
    book?.userName ??
    book?.UserName ??
    "Unknown author";

  const verseType = book?.verseType ?? book?.VerseType ?? "-";
  const bookState = book?.status ?? book?.Status ?? "-";
  const isContracted = Boolean(book?.isContracted ?? book?.contracted ?? false);

  const openEdit = () => {
    setEditError("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditOpen(false);
    setEditError("");
  };

  const openDraft = (draftId) => {
    if (!draftId) return;
    navigate(`/author/workspace/${bookId}/chapters/new?draftId=${encodeURIComponent(draftId)}`);
  };

  const createDraftAndOpen = () => {
    if (!bookId) return;
    const draftId = createLocalDraft(bookId);
    openDraft(draftId);
  };
  const handleDeleteChapter = async (chapter, event) => {
    event?.stopPropagation?.();
    if (!bookId || !chapter) return;

    setChapterActionError("");

    if (chapter.isLocalDraft) {
      removeLocalDraft(bookId, chapter.draftId);
      addToTrash(bookId, {
        id: `trash-draft-${chapter.draftId}`,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        createdAt: chapter.createdAt,
        contentHtml: chapter.contentHtml ?? "",
        arcId: chapter.arcId ?? "",
        authorThought: chapter.authorThought ?? "",
        source: "draft",
      });
      setLocalVersion((v) => v + 1);
      return;
    }

    const chapterId = chapter.id ?? chapter.ID;
    if (!chapterId) return;

    setDeletingChapterId(String(chapterId));
    try {
      await deleteChapter(chapterId);
      setChapters((prev) => prev.filter((c) => String(c.id ?? c.ID) !== String(chapterId)));
      addToTrash(bookId, {
        id: `trash-chapter-${chapterId}`,
        title: chapter.title,
        chapterNumber: chapter.chapterNumber,
        createdAt: chapter.createdAt,
        contentHtml: String(chapter.content ?? ""),
        arcId: String(chapter.arcId ?? ""),
        authorThought: "",
        source: "published",
      });
      setLocalVersion((v) => v + 1);
    } catch (err) {
      setChapterActionError(err?.response?.data?.message || "Failed to delete chapter.");
    } finally {
      setDeletingChapterId(null);
    }
  };

  const handleRecoverChapter = (chapter, event) => {
    event?.stopPropagation?.();
    if (!bookId || !chapter) return;

    setChapterActionError("");

    const drafts = readLocalDrafts(bookId);
    drafts.push({
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: String(chapter.title ?? ""),
      contentHtml: String(chapter.contentHtml ?? ""),
      arcId: String(chapter.arcId ?? ""),
      authorThought: String(chapter.authorThought ?? ""),
      savedAt: new Date().toISOString(),
    });
    persistDrafts(bookId, drafts);

    const nextTrash = readLocalTrash(bookId).filter((item) => String(item?.id) !== String(chapter?.id ?? chapter?.ID));
    persistTrash(bookId, nextTrash);

    setLocalVersion((v) => v + 1);
    setActiveTab("draft");
  };

  
  const openArcModal = () => {
    setArcError("");
    setArcName("");
    setArcModalOpen(true);
  };

  const closeArcModal = () => {
    if (arcSaving) return;
    setArcModalOpen(false);
    setArcError("");
  };

  const saveArc = async (e) => {
    e.preventDefault();
    if (!bookId) return;

    const cleanName = arcName.trim();
    if (!cleanName) {
      setArcError("Volume name is required.");
      return;
    }

    setArcSaving(true);
    setArcError("");
    try {
      await createBookArc(bookId, cleanName);
      await load();
      setArcModalOpen(false);
      setArcName("");
    } catch (err) {
      setArcError(err?.response?.data?.message || "Failed to create volume.");
    } finally {
      setArcSaving(false);
    }
  };

  const openRenameArcModal = (arcId) => {
    const target = normalizedArcs.find((arc) => String(arc.id) === String(arcId));
    if (!target) return;

    setRenameArcError("");
    setRenameArcId(String(target.id));
    setRenameArcName(String(target.name ?? ""));
    setRenameArcOpen(true);
  };

  const closeRenameArcModal = () => {
    setRenameArcOpen(false);
    setRenameArcError("");
    setRenameArcId("");
    setRenameArcName("");
  };

  const saveArcRename = (e) => {
    e.preventDefault();
    const clean = renameArcName.trim();
    if (!clean) {
      setRenameArcError("Volume name is required.");
      return;
    }

    setArcs((prev) => prev.map((arc) => {
      const currentId = String(arc?.id ?? arc?.ID ?? "");
      if (currentId !== renameArcId) return arc;
      return { ...arc, name: clean, Name: clean };
    }));
    closeRenameArcModal();
  };

  const openAdjustArcModal = () => {
    setAdjustArcItems(normalizedArcs.map((arc) => ({ id: String(arc.id), name: String(arc.name) })));
    setDraggingArcId("");
    setAdjustArcError("");
    setAdjustArcOpen(true);
  };

  const closeAdjustArcModal = () => {
    setAdjustArcOpen(false);
    setDraggingArcId("");
    setAdjustArcError("");
  };

  const handleArcDragStart = (arcId) => {
    setDraggingArcId(String(arcId));
  };

  const handleArcDrop = (targetArcId) => {
    if (!draggingArcId) return;
    setAdjustArcItems((prev) => reorderById(prev, draggingArcId, targetArcId));
    setDraggingArcId("");
  };

  const saveArcSequence = () => {
    const orderMap = new Map(adjustArcItems.map((item, idx) => [String(item.id), idx]));
    setArcs((prev) => {
      const next = prev.map((arc) => {
        const arcId = String(arc?.id ?? arc?.ID ?? "");
        const nextOrder = orderMap.get(arcId);
        if (nextOrder === undefined) return arc;
        return { ...arc, order: nextOrder, Order: nextOrder };
      });

      return [...next].sort((a, b) => {
        const aOrder = Number(a?.order ?? a?.Order ?? Number.MAX_SAFE_INTEGER);
        const bOrder = Number(b?.order ?? b?.Order ?? Number.MAX_SAFE_INTEGER);
        return aOrder - bOrder;
      });
    });

    closeAdjustArcModal();
  };

  const deleteArcAndMoveChaptersToTrash = async (arcId) => {
    if (!bookId || !arcId) return;

    setChapterActionError("");
    setDeletingArcId(String(arcId));

    const targetArcId = String(arcId);
    const draftEntries = readLocalDrafts(bookId);
    const draftsInArc = draftEntries.filter((draft) => String(draft?.arcId ?? "") === targetArcId);

    if (draftsInArc.length) {
      const remainingDrafts = draftEntries.filter((draft) => String(draft?.arcId ?? "") !== targetArcId);
      persistDrafts(bookId, remainingDrafts);
      draftsInArc.forEach((draft) => {
        addToTrash(bookId, {
          id: `trash-arc-draft-${draft.id}`,
          title: String(draft?.title ?? "Untitled Draft"),
          chapterNumber: null,
          createdAt: draft?.savedAt ?? null,
          contentHtml: String(draft?.contentHtml ?? ""),
          arcId: targetArcId,
          authorThought: String(draft?.authorThought ?? ""),
          source: "draft",
        });
      });
    }

    const chaptersInArc = chapters.filter((chapter) => String(chapter?.arcId ?? chapter?.ArcId ?? "") === targetArcId);
    const deleteResults = await Promise.allSettled(
      chaptersInArc.map(async (chapter) => {
        const chapterId = chapter?.id ?? chapter?.ID;
        if (!chapterId) return { ok: false, chapter };
        await deleteChapter(chapterId);
        return { ok: true, chapter, chapterId };
      }),
    );

    const deletedIds = [];
    let failedCount = 0;

    deleteResults.forEach((result) => {
      if (result.status !== "fulfilled" || !result.value?.ok) {
        failedCount += 1;
        return;
      }

      const chapter = result.value.chapter;
      const chapterId = result.value.chapterId;
      deletedIds.push(String(chapterId));
      addToTrash(bookId, {
        id: `trash-arc-chapter-${chapterId}`,
        title: chapter?.title,
        chapterNumber: chapter?.chapterNumber,
        createdAt: chapter?.createdAt,
        contentHtml: String(chapter?.content ?? ""),
        arcId: targetArcId,
        authorThought: "",
        source: "published",
      });
    });

    if (deletedIds.length) {
      setChapters((prev) => prev.filter((chapter) => !deletedIds.includes(String(chapter?.id ?? chapter?.ID ?? ""))));
    }

    setArcs((prev) => prev.filter((arc) => String(arc?.id ?? arc?.ID ?? "") !== targetArcId));
    setLocalVersion((v) => v + 1);

    if (failedCount > 0) {
      setChapterActionError(`Deleted arc, but ${failedCount} chapter(s) could not be moved to trash.`);
    }

    setDeletingArcId("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!bookId || !book) return;

    setSavingEdit(true);
    setEditError("");
    try {
      let coverImageUrl = editForm.coverImageUrl?.trim() || book.coverImageUrl;
      if (editForm.coverFile) {
        const adjustedFile = await buildAdjustedCoverFile(
          editForm.coverFile,
          editForm.title?.trim() || book.title,
          Number(editForm.coverZoom || 1),
        );
        coverImageUrl = await uploadBookCover(adjustedFile);
      }

      const payload = {
        title: editForm.title?.trim() || book.title,
        description: editForm.synopsis,
        coverImageUrl,
        status: book.status || "Ongoing",
        verseType: editForm.verseType || "Original",
        leadGender: editForm.leadGender || "",
        language: editForm.language || "English",
        originType: book.originType || "PlatformOriginal",
        genreIds: editForm.genreId ? [Number(editForm.genreId)] : [],
        tagIds: editForm.tagIds,
        sourceUrl: book?.sourceUrl ?? book?.SourceUrl ?? null,
      };

      await updateBook(bookId, payload);
      const selectedTrendId = Number(editForm.trendId);
      if (Number.isFinite(selectedTrendId) && selectedTrendId > 0) {
        try {
          await linkBookToTrend(selectedTrendId, Number(bookId));
        } catch {
          // Keep book update successful even when trend-link endpoint is restricted.
        }
      }
      await load();
      setEditOpen(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || "Failed to update book details.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingState text="Loading book workspace..." />;
  if (error) return <ErrorState title="Book Unavailable" subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-detail-page">
      <section className="authorx-detail-head">
        <div className="authorx-detail-head-left">
          <button
            type="button"
            className="authorx-back-btn border-0 bg-none"
            onClick={() => navigate("/author/workspace")}
            aria-label="Back to workspace"
            title="Back"
          >
            <FiArrowLeft size={25} />
          </button>
          <h1>{book?.title || "Book Details"}</h1>
        </div>

        <div className="authorx-detail-head-right justify-content-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            style={{height:"auto"}}
            onClick={openEdit}
            aria-label="Edit book"
            title="Edit"
          >
            <FiEdit2 size={16} />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={createDraftAndOpen}
          >
            Create Chapter
          </Button>
        </div>
      </section>

      <Surface className="authorx-book-detail-card">
        <div className="authorx-book-detail-main">
          <div className="authorx-book-detail-cover">
            {book?.coverImageUrl ? <img src={book.coverImageUrl} alt={book?.title || "Book cover"} /> : <span>No Cover</span>}
          </div>

          <div className="authorx-book-detail-meta">
            <h2>{book?.title || "Untitled"}</h2>
            <p>
              By <strong>{authorName}</strong>
            </p>
            <p>{book?.description || book?.synopsis || "No synopsis yet."}</p>
          </div>
        </div>

        <div className="authorx-book-detail-stats">
          <div>
            <span>Type</span>
            <strong>{verseType}</strong>
          </div>
          <div>
            <span>State</span>
            <strong>{bookState}</strong>
          </div>
          <div>
            <span>Contract</span>
            <strong>{isContracted ? "Contracted" : "Uncontracted"}</strong>
          </div>
          <div>
            <span>Chapters</span>
            <strong>{chapters.length}</strong>
          </div>
        </div>
      </Surface>

      <Surface className="authorx-chapter-panel">
        <div className="authorx-tab-row">
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={tabList.map((tab) => ({
              value: tab.key,
              label: `${tab.label} (${tab.count})`,
            }))}
          />
        </div>

        {chapterActionError && <div className="authorx-form-error mb-2">{chapterActionError}</div>}

        {visibleChapters.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} chapters`}
            subtitle="Chapters will appear here once available."
          />
        ) : (
          <div className="authorx-chapter-list">
            <div className="authorx-chapter-head">
              <span>Chapter Title</span>
              <div className="d-flex align-items-center gap-2 justify-content-end">
                {activeTab === "published" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    onClick={openArcModal}
                  >
                    + New Volume
                  </button>
                )}
                <span>Created Time</span>
              </div>
            </div>
            {chapterSections.map((section, sectionIndex) => {
              const sectionKey = `${section.label}-${sectionIndex}`;
              const isManagedArc = activeTab === "published" && Boolean(section.arcId);
              const showArcActions = isManagedArc && hoveredArcLabel === sectionKey;

              return (
                <div key={sectionKey}>
                  <div
                    className="authorx-chapter-row"
                    style={{ background: "#f6f7fb", fontWeight: 700 }}
                    onMouseEnter={() => setHoveredArcLabel(sectionKey)}
                    onMouseLeave={() => setHoveredArcLabel("")}
                  >
                    <div>{section.label}</div>
                    <div className="d-flex align-items-center gap-3 justify-content-end">
                      {showArcActions && (
                        <>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              openRenameArcModal(section.arcId);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdjustArcModal();
                            }}
                          >
                            Adjust Sequence
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                            disabled={deletingArcId === String(section.arcId)}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArcAndMoveChaptersToTrash(section.arcId);
                            }}
                          >
                            {deletingArcId === String(section.arcId) ? "Deleting..." : "Delete"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {section.items.map((ch) => {
                    const rowId = String(ch.id ?? ch.ID ?? ch.draftId ?? "");
                    const canDelete = activeTab !== "trash";
                    const showDelete = canDelete && hoveredChapterId === rowId;
                    const showRecover = activeTab === "trash" && hoveredChapterId === rowId;

                    return (
                      <div
                        key={ch.id ?? ch.ID}
                        className="authorx-chapter-row"
                        onMouseEnter={() => setHoveredChapterId(rowId)}
                        onMouseLeave={() => setHoveredChapterId(null)}
                        onClick={() => ch.isLocalDraft && openDraft(ch.draftId)}
                        role={ch.isLocalDraft ? "button" : undefined}
                        tabIndex={ch.isLocalDraft ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (ch.isLocalDraft && (e.key === "Enter" || e.key === " ")) {
                            e.preventDefault();
                            openDraft(ch.draftId);
                          }
                        }}
                        style={ch.isLocalDraft ? { cursor: "pointer" } : undefined}
                      >
                        <div>
                          <strong>{ch.title || "Untitled"}</strong>
                          <div>{ch.isLocalDraft ? "Local Draft" : `#${ch.chapterNumber ?? "?"}`}</div>
                        </div>
                        <div className="d-flex align-items-center gap-2 justify-content-end">
                          {showDelete && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deletingChapterId === rowId}
                              onClick={(e) => handleDeleteChapter(ch, e)}
                            >
                              {deletingChapterId === rowId ? "Deleting..." : "Delete"}
                            </button>
                          )}
                          {showRecover && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={(e) => handleRecoverChapter(ch, e)}
                            >
                              Recover
                            </button>
                          )}
                          <span>
                            {ch.createdAt
                              ? new Date(ch.createdAt).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "-"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </Surface>

            {arcModalOpen && (
        <div className="authorx-modal-backdrop" onClick={closeArcModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title="New Volume"
              subtitle="Create a new volume (arc) for this book."
              variant="light"
            />

            <form onSubmit={saveArc} className="authorx-form">
              <TextField
                value={arcName}
                onChange={(v) => setArcName(v)}
                placeholder="Volume name"
              />

              {arcError && <div className="authorx-form-error">{arcError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeArcModal} disabled={arcSaving}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={arcSaving}>
                  {arcSaving ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renameArcOpen && (
        <div className="authorx-modal-backdrop" onClick={closeRenameArcModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title="Edit Volume"
              subtitle="Update the volume name."
              variant="light"
            />

            <form onSubmit={saveArcRename} className="authorx-form">
              <TextField
                value={renameArcName}
                onChange={(v) => setRenameArcName(v)}
                placeholder="Volume name"
              />

              {renameArcError && <div className="authorx-form-error">{renameArcError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeRenameArcModal}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustArcOpen && (
        <div className="authorx-modal-backdrop" onClick={closeAdjustArcModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title="Adjust Volume Sequence"
              subtitle="Drag and drop to reorder volumes."
              variant="light"
            />

            <div className="authorx-form">
              <div className="authorx-arc-sequence-list">
                {adjustArcItems.map((arc) => (
                  <div
                    key={arc.id}
                    className="authorx-arc-sequence-item"
                    draggable
                    onDragStart={() => handleArcDragStart(arc.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleArcDrop(arc.id)}
                  >
                    <span className="authorx-arc-sequence-grip">::</span>
                    <span>{arc.name}</span>
                  </div>
                ))}
              </div>

              {adjustArcError && <div className="authorx-form-error">{adjustArcError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeAdjustArcModal}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" size="md" onClick={saveArcSequence}>
                  Save Order
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {editOpen && (
        <div className="authorx-modal-backdrop" onClick={closeEdit}>
          <div className="authorx-modal authorx-modal-lg" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title="Edit Book"
              subtitle="Update all book details."
              variant="light"
            />

            <form onSubmit={saveEdit} className="authorx-form authorx-edit-form">
              <TextField
                value={editForm.title}
                onChange={(v) => setEditForm((prev) => ({ ...prev, title: v }))}
                placeholder="Book name"
              />

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={editForm.verseType}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, verseType: v }))}
                  options={bookTypeOptions}
                  placeholder="Book Type"
                />
                <DropdownSelectSearchable
                  value={editForm.leadGender}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, leadGender: v }))}
                  options={leadGenderOptions}
                  placeholder="Leading Gender"
                />
              </div>

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={editForm.genreId}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, genreId: v }))}
                  options={genreOptions}
                  placeholder="Genre"
                />
                <DropdownSelectSearchable
                  value={editForm.language}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, language: v }))}
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
                  onChange={async (e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    const previewUrl = URL.createObjectURL(file);
                    setEditForm((prev) => ({
                      ...prev,
                      coverFile: file,
                      coverPreviewUrl: previewUrl,
                      coverImageUrl: previewUrl,
                    }));
                  }}
                />
              </div>

              <div className="authorx-cover-summary">
                {editForm.coverImageUrl ? (
                  <div className="authorx-cover-thumb-btn" style={{ cursor: "default" }}>
                    <div className="authorx-cover-preview-frame">
                      <img
                        src={editForm.coverImageUrl}
                        alt="Cover preview"
                        className="authorx-cover-preview-image"
                        style={{ transform: `scale(${editForm.coverZoom || 1})`, transformOrigin: "center center" }}
                      />
                    </div>
                    <span>Cover preview</span>
                  </div>
                ) : (
                  <div className="authorx-cover-placeholder">No cover selected</div>
                )}
              </div>

              <div className="authorx-cover-editor-quick">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm((prev) => ({ ...prev, coverZoom: Math.max(1, Number(prev.coverZoom || 1) - 0.08) }))}
                >
                  Zoom -
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditForm((prev) => ({ ...prev, coverZoom: Math.min(3, Number(prev.coverZoom || 1) + 0.08) }))}
                >
                  Zoom +
                </Button>
                <span className="authorx-cover-zoom-label">{Number(editForm.coverZoom || 1).toFixed(2)}x</span>
              </div>

              <DropdownSelectSearchable
                value={editForm.trendId}
                onChange={(v) => setEditForm((prev) => ({ ...prev, trendId: v }))}
                options={trendOptions}
                placeholder="Link to Trend (optional)"
              />

              <MultiSelectDropdownSearchable
                label="Tags (default website tags)"
                values={editForm.tagIds}
                onChange={(vals) => setEditForm((prev) => ({ ...prev, tagIds: vals }))}
                options={tagOptions}
              />

              <TextField
                value={editForm.synopsis}
                onChange={(v) => setEditForm((prev) => ({ ...prev, synopsis: v }))}
                placeholder="Synopsis"
              />

              {editError && <div className="authorx-form-error">{editError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeEdit} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={savingEdit}>
                  {savingEdit ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}










































