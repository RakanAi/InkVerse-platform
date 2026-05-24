import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import AuthorSectionHeading from "../../features/author/components/AuthorSectionHeading";
import { buildBookCoverUploadFile } from "../../domain/books/build-book-cover-upload-file";
import {
  formatCompactNumber,
  formatStatusLabel,
  getBookCover,
  getBookDescription,
  getBookTitle,
} from "../../features/author/author.utils";
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
import {
  attestAuthorBookRights,
  fetchAuthorBookContract,
} from "../../Api/book-contracts.api";
import { updateChapterMonetization } from "../../Api/monetization.api";
import AuthorBookBible from "./AuthorBookBible";

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
  coverImageW: 0,
  coverImageH: 0,
  coverZoom: 1,
  coverOffsetX: 0,
  coverOffsetY: 0,
};

const COVER_CANVAS_W = 600;
const COVER_CANVAS_H = 800;
const COVER_PREVIEW_W = 180;
const COVER_PREVIEW_H = COVER_PREVIEW_W * (4 / 3);
const COVER_EDITOR_W = 280;
const COVER_EDITOR_H = COVER_EDITOR_W * (4 / 3);

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

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

function formatContractStatus(value, t) {
  if (!value) return t("author.studio.book.notEligible");
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
export default function AuthorBookDetails() {
  const { t } = useTranslation();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [book, setBook] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractError, setContractError] = useState("");
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [attestingRights, setAttestingRights] = useState(false);
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
  const [editCoverEditorOpen, setEditCoverEditorOpen] = useState(false);
  const [editCoverDraft, setEditCoverDraft] = useState({ zoom: 1, offsetX: 0, offsetY: 0 });
  const [editCoverFrameSize, setEditCoverFrameSize] = useState({ width: COVER_EDITOR_W, height: COVER_EDITOR_H });
  const [hoveredChapterId, setHoveredChapterId] = useState(null);
  const [hoveredArcLabel, setHoveredArcLabel] = useState("");
  const [deletingChapterId, setDeletingChapterId] = useState(null);
  const [monetizingChapterId, setMonetizingChapterId] = useState(null);
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
  const deskTab = searchParams.get("tab") || "details";
  const setupMode = searchParams.get("setup") === "1";
  const editCoverDraftRef = useRef(editCoverDraft);
  const editCoverDragRef = useRef(null);
  const editCoverTouchRef = useRef(null);
  const editCoverPreviewUrlRef = useRef("");
  const editCoverFrameRef = useRef(null);

  useEffect(() => {
    editCoverDraftRef.current = editCoverDraft;
  }, [editCoverDraft]);

  const getEditCoverFrameSize = useCallback(() => {
    const rect = editCoverFrameRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return editCoverFrameSize;
    return { width: rect.width, height: rect.height };
  }, [editCoverFrameSize]);

  const cleanupEditCoverPreview = useCallback((url) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    editCoverPreviewUrlRef.current = editForm.coverPreviewUrl;
  }, [editForm.coverPreviewUrl]);

  useEffect(() => () => cleanupEditCoverPreview(editCoverPreviewUrlRef.current), [cleanupEditCoverPreview]);

  useEffect(() => {
    if (!editCoverEditorOpen) return undefined;

    const updateFrameSize = () => {
      const rect = editCoverFrameRef.current?.getBoundingClientRect();
      if (!rect?.width || !rect?.height) return;
      setEditCoverFrameSize({ width: rect.width, height: rect.height });
    };

    updateFrameSize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateFrameSize) : null;
    if (observer && editCoverFrameRef.current) observer.observe(editCoverFrameRef.current);
    window.addEventListener("resize", updateFrameSize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateFrameSize);
    };
  }, [editCoverEditorOpen]);

  const load = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError("");
    setContractError("");

    try {
      const [bookRes, chaptersRes, arcsRes, genresRes, tagsRes, trendsRes, contractRes] = await Promise.allSettled([
        fetchBookById(bookId),
        fetchBookChapters(bookId),
        fetchBookArcs(bookId),
        fetchGenres(),
        fetchTags(),
        fetchTrends(),
        fetchAuthorBookContract(bookId),
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
      if (contractRes.status === "fulfilled") {
        setContract(contractRes.value);
      } else {
        setContract(null);
        setContractError(contractRes.reason?.response?.data?.message || t("author.studio.book.errors.contract"));
      }

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
        coverImageW: 0,
        coverImageH: 0,
        coverZoom: 1,
        coverOffsetX: 0,
        coverOffsetY: 0,
      });
    } catch (e) {
      setError(e?.response?.data?.message || t("author.studio.book.errors.load"));
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
        title: String(d?.title ?? "").trim() || t("author.studio.common.untitledDraft"),
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
    { key: "draft", label: t("author.studio.common.draft"), count: grouped.draft.length },
    { key: "published", label: t("author.studio.common.published"), count: grouped.published.length },
    { key: "trash", label: t("author.studio.common.trash"), count: grouped.trash.length },
  ];
  const deskTabs = [
    { key: "details", label: t("author.studio.book.tabs.details") },
    { key: "chapters", label: t("author.studio.book.tabs.chapters") },
    { key: "bible", label: t("author.studio.book.tabs.bible") },
    { key: "world", label: t("author.studio.book.tabs.world") },
    { key: "characters", label: t("author.studio.book.tabs.characters") },
    { key: "plot", label: t("author.studio.book.tabs.plot") },
    { key: "notebook", label: t("author.studio.book.tabs.notebook") },
  ];

  const changeDeskTab = (nextTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", nextTab);
    params.delete("setup");
    setSearchParams(params);
  };

  const visibleChapters = grouped[activeTab] || [];
  const normalizedArcs = useMemo(() => {
    return arcs
      .map((arc, index) => ({
        ...arc,
        id: String(arc?.id ?? arc?.ID ?? ""),
        name: String(arc?.name ?? arc?.Name ?? "").trim() || t("author.studio.book.volumeNumber", { id: arc?.id ?? arc?.ID ?? index + 1 }),
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
    if (!arcId) return t("author.studio.book.noVolume");

    const namedArc = String(chapter?.arcName ?? chapter?.ArcName ?? "").trim();
    if (namedArc) return namedArc;

    return arcNameById.get(arcId) || t("author.studio.book.volumeNumber", { id: arcId });
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
    { value: "", label: t("author.studio.common.genre") },
    ...genres.map((g) => ({
      value: String(g.id ?? g.ID),
      label: g.name ?? g.Name,
    })),
  ];
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
  const languageOptions = [
    { value: "English", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.english")}` },
    { value: "Arabic", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.arabic")}` },
    { value: "Spanish", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.spanish")}` },
    { value: "French", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.french")}` },
    { value: "Turkish", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.turkish")}` },
    { value: "Other", label: `${t("author.studio.common.languagePrefix")}: ${t("author.studio.common.other")}` },
  ];
  const trendOptions = [
    { value: "", label: t("author.studio.common.noTrend") },
    ...trends.map((trend) => ({
      value: String(trend?.id ?? trend?.ID ?? ""),
      label: trend?.name ?? trend?.Name ?? t("author.studio.common.untitled"),
    })),
  ];


  const authorName =
    book?.authorName ??
    book?.AuthorName ??
    book?.userName ??
    book?.UserName ??
    t("author.studio.common.unknownAuthor");

  const verseType = book?.verseType ?? book?.VerseType ?? "-";
  const bookState = book?.status ?? book?.Status ?? "-";
  const contractStatus = contract?.status ?? book?.contractStatus ?? (book?.isContracted ? "approved" : "not_eligible");
  const isContracted = Boolean(contract?.isContracted ?? book?.isContracted ?? book?.contracted ?? false);
  const paidChaptersAllowedAfter =
    contract?.paidChaptersAllowedAfter ??
    contract?.PaidChaptersAllowedAfter ??
    null;
  const contentLockedAfter =
    contract?.contentLockedAfter ??
    contract?.ContentLockedAfter ??
    null;
  const paidCutoffTime = paidChaptersAllowedAfter ? new Date(paidChaptersAllowedAfter).getTime() : null;
  const publishedContentLocked = Boolean(contentLockedAfter);
  const contractMissingRequirements = Array.isArray(contract?.contractMissingRequirements)
    ? contract.contractMissingRequirements
    : [];
  const canAttestRights = Boolean(
    contract?.requiresRightsAttestation &&
      contract?.meetsContractMetrics &&
      !contract?.rightsAttested &&
      contractStatus !== "approved",
  );
  const contractRequirements = {
    words: {
      current: contract?.wordCount ?? book?.wordCount ?? book?.WordCount ?? 0,
      required: contract?.requiredWordCount ?? 20000,
    },
    chapters: {
      current: contract?.chapterCount ?? chapters.length,
      required: contract?.requiredChapterCount ?? 10,
    },
    views: {
      current: contract?.totalViews ?? book?.totalViews ?? book?.TotalViews ?? 0,
      required: contract?.requiredTotalViews ?? 1000,
    },
  };
  const coverImage = getBookCover(book);
  const bookTitle = getBookTitle(book);
  const bookDescription = getBookDescription(book);

  const isChapterBeforePaidCutoff = useCallback((chapter) => {
    if (!paidCutoffTime) return true;
    const createdAt = chapter?.createdAt ?? chapter?.CreatedAt;
    const createdTime = createdAt ? new Date(createdAt).getTime() : Number.NaN;
    return !Number.isFinite(createdTime) || createdTime < paidCutoffTime;
  }, [paidCutoffTime]);

  const isChapterLockedForAuthor = useCallback((chapter) => {
    if (!publishedContentLocked || chapter?.isLocalDraft || chapter?.isLocalTrash) return false;
    return chapterBucket(chapter) === "published";
  }, [publishedContentLocked]);

  const editCoverPreviewStyle = useMemo(() => {
    if (!editForm.coverPreviewUrl || !editForm.coverImageW || !editForm.coverImageH) return null;
    const previewOffsetX = editForm.coverOffsetX * (COVER_PREVIEW_W / COVER_CANVAS_W);
    const previewOffsetY = editForm.coverOffsetY * (COVER_PREVIEW_H / COVER_CANVAS_H);
    return getCoverStyle(
      editForm.coverImageW,
      editForm.coverImageH,
      editForm.coverZoom,
      previewOffsetX,
      previewOffsetY,
      COVER_PREVIEW_W,
      COVER_PREVIEW_H,
    );
  }, [editForm]);

  const editCoverEditorStyle = useMemo(() => {
    if (!editForm.coverPreviewUrl || !editForm.coverImageW || !editForm.coverImageH) return null;
    const editorOffsetX = editCoverDraft.offsetX * (editCoverFrameSize.width / COVER_CANVAS_W);
    const editorOffsetY = editCoverDraft.offsetY * (editCoverFrameSize.height / COVER_CANVAS_H);
    return getCoverStyle(
      editForm.coverImageW,
      editForm.coverImageH,
      editCoverDraft.zoom,
      editorOffsetX,
      editorOffsetY,
      editCoverFrameSize.width,
      editCoverFrameSize.height,
    );
  }, [editForm, editCoverDraft, editCoverFrameSize]);

  const openEdit = () => {
    setEditError("");
    setEditOpen(true);
  };

  const closeEdit = () => {
    if (savingEdit) return;
    cleanupEditCoverPreview(editForm.coverPreviewUrl);
    const currentCover = book?.coverImageUrl ?? book?.CoverImageUrl ?? "";
    setEditForm((prev) => ({
      ...prev,
      coverFile: null,
      coverPreviewUrl: currentCover,
      coverImageUrl: currentCover,
      coverImageW: 0,
      coverImageH: 0,
      coverZoom: 1,
      coverOffsetX: 0,
      coverOffsetY: 0,
    }));
    setEditCoverEditorOpen(false);
    setEditOpen(false);
    setEditError("");
  };

  const openEditCoverEditor = () => {
    if (!editForm.coverPreviewUrl || !editForm.coverImageW || !editForm.coverImageH) return;
    setEditCoverDraft(clampCoverDraft({
      zoom: editForm.coverZoom,
      offsetX: editForm.coverOffsetX,
      offsetY: editForm.coverOffsetY,
    }, editForm.coverImageW, editForm.coverImageH));
    setEditCoverEditorOpen(true);
  };

  const closeEditCoverEditor = () => {
    editCoverDragRef.current = null;
    editCoverTouchRef.current = null;
    setEditCoverEditorOpen(false);
  };

  const saveEditCoverEditor = () => {
    const nextDraft = clampCoverDraft(editCoverDraft, editForm.coverImageW, editForm.coverImageH);
    setEditForm((prev) => ({
      ...prev,
      coverZoom: nextDraft.zoom,
      coverOffsetX: nextDraft.offsetX,
      coverOffsetY: nextDraft.offsetY,
    }));
    closeEditCoverEditor();
  };

  const updateEditCoverZoom = (zoom) => {
    setEditCoverDraft((prev) => clampCoverDraft({ ...prev, zoom }, editForm.coverImageW, editForm.coverImageH));
  };

  const handleEditCoverWheel = (event) => {
    event.preventDefault();
    updateEditCoverZoom(editCoverDraftRef.current.zoom + (event.deltaY < 0 ? 0.06 : -0.06));
  };

  const handleEditCoverMouseDown = (event) => {
    event.preventDefault();
    editCoverDragRef.current = {
      lastX: event.clientX,
      lastY: event.clientY,
    };
  };

  useEffect(() => {
    if (!editCoverEditorOpen) return undefined;

    const onMouseMove = (event) => {
      if (!editCoverDragRef.current) return;
      const dx = event.clientX - editCoverDragRef.current.lastX;
      const dy = event.clientY - editCoverDragRef.current.lastY;
      editCoverDragRef.current.lastX = event.clientX;
      editCoverDragRef.current.lastY = event.clientY;
      const frameSize = getEditCoverFrameSize();
      const dxCanvas = dx * (COVER_CANVAS_W / frameSize.width);
      const dyCanvas = dy * (COVER_CANVAS_H / frameSize.height);
      setEditCoverDraft((prev) => clampCoverDraft({
        ...prev,
        offsetX: prev.offsetX + dxCanvas,
        offsetY: prev.offsetY + dyCanvas,
      }, editForm.coverImageW, editForm.coverImageH));
    };

    const onMouseUp = () => {
      editCoverDragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [editCoverEditorOpen, editForm.coverImageW, editForm.coverImageH, getEditCoverFrameSize]);

  const handleEditCoverTouchStart = (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      editCoverTouchRef.current = { mode: "pan", lastX: touch.clientX, lastY: touch.clientY };
      return;
    }

    if (event.touches.length >= 2) {
      const first = event.touches[0];
      const second = event.touches[1];
      const mid = midpoint(first, second);
      editCoverTouchRef.current = {
        mode: "pinch",
        startDistance: distance(first, second),
        startZoom: editCoverDraftRef.current.zoom,
        startOffsetX: editCoverDraftRef.current.offsetX,
        startOffsetY: editCoverDraftRef.current.offsetY,
        startMidX: mid.x,
        startMidY: mid.y,
      };
    }
  };

  const handleEditCoverTouchMove = (event) => {
    if (!editCoverTouchRef.current) return;
    event.preventDefault();

    if (editCoverTouchRef.current.mode === "pan" && event.touches.length === 1) {
      const touch = event.touches[0];
      const dx = touch.clientX - editCoverTouchRef.current.lastX;
      const dy = touch.clientY - editCoverTouchRef.current.lastY;
      editCoverTouchRef.current.lastX = touch.clientX;
      editCoverTouchRef.current.lastY = touch.clientY;

      const frameSize = getEditCoverFrameSize();
      setEditCoverDraft((prev) => clampCoverDraft({
        ...prev,
        offsetX: prev.offsetX + dx * (COVER_CANVAS_W / frameSize.width),
        offsetY: prev.offsetY + dy * (COVER_CANVAS_H / frameSize.height),
      }, editForm.coverImageW, editForm.coverImageH));
      return;
    }

    if (editCoverTouchRef.current.mode === "pinch" && event.touches.length >= 2) {
      const first = event.touches[0];
      const second = event.touches[1];
      const currentDistance = distance(first, second);
      const currentMid = midpoint(first, second);
      const ratio = currentDistance / Math.max(editCoverTouchRef.current.startDistance, 1);
      const nextZoom = clamp(editCoverTouchRef.current.startZoom * ratio, 1, 3);
      const frameSize = getEditCoverFrameSize();
      const dx = (currentMid.x - editCoverTouchRef.current.startMidX) * (COVER_CANVAS_W / frameSize.width);
      const dy = (currentMid.y - editCoverTouchRef.current.startMidY) * (COVER_CANVAS_H / frameSize.height);
      setEditCoverDraft((prev) => clampCoverDraft({
        ...prev,
        zoom: nextZoom,
        offsetX: editCoverTouchRef.current.startOffsetX + dx,
        offsetY: editCoverTouchRef.current.startOffsetY + dy,
      }, editForm.coverImageW, editForm.coverImageH));
    }
  };

  const handleEditCoverTouchEnd = (event) => {
    if (event.touches.length === 0) {
      editCoverTouchRef.current = null;
      return;
    }

    if (event.touches.length === 1) {
      const touch = event.touches[0];
      editCoverTouchRef.current = { mode: "pan", lastX: touch.clientX, lastY: touch.clientY };
    }
  };

  const handleEditCoverFileChange = async (file) => {
    if (!file) return;
    cleanupEditCoverPreview(editForm.coverPreviewUrl);

    const previewUrl = URL.createObjectURL(file);
    try {
      const img = await loadImageFromUrl(previewUrl);
      setEditForm((prev) => ({
        ...prev,
        coverFile: file,
        coverPreviewUrl: previewUrl,
        coverImageUrl: previewUrl,
        coverImageW: img.width,
        coverImageH: img.height,
        coverZoom: 1,
        coverOffsetX: 0,
        coverOffsetY: 0,
      }));
      setEditCoverDraft({ zoom: 1, offsetX: 0, offsetY: 0 });
      setEditCoverEditorOpen(true);
    } catch {
      cleanupEditCoverPreview(previewUrl);
      setEditError(t("author.studio.book.errors.image"));
    }
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

    if (isChapterLockedForAuthor(chapter)) {
      setChapterActionError(t("author.studio.book.errors.locked"));
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
      setChapterActionError(err?.response?.data?.message || t("author.studio.book.errors.deleteChapter"));
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

  const toggleChapterPaid = async (chapter, event) => {
    event.stopPropagation();
    const chapterId = chapter?.id ?? chapter?.ID;
    if (!chapterId) return;

    const nextIsPaid = !(chapter?.isPaid ?? chapter?.IsPaid);
    if (nextIsPaid && !isContracted) {
      setChapterActionError(t("author.studio.book.errors.contractNeeded"));
      return;
    }
    if (nextIsPaid && isChapterBeforePaidCutoff(chapter)) {
      setChapterActionError(t("author.studio.book.errors.postContractOnly"));
      return;
    }

    setMonetizingChapterId(String(chapterId));
    setChapterActionError("");
    try {
      const updated = await updateChapterMonetization(chapterId, {
        isPaid: nextIsPaid,
        teaser: chapter?.teaser ?? chapter?.Teaser ?? "",
      });
      setChapters((current) =>
        current.map((item) => {
          const itemId = item?.id ?? item?.ID;
          if (String(itemId) !== String(chapterId)) return item;
          return {
            ...item,
            isPaid: updated?.isPaid ?? nextIsPaid,
            IsPaid: updated?.isPaid ?? nextIsPaid,
            priceCoins: updated?.priceCoins ?? 5,
            PriceCoins: updated?.priceCoins ?? 5,
            teaser: updated?.teaser ?? item?.teaser,
            Teaser: updated?.teaser ?? item?.Teaser,
          };
        }),
      );
    } catch (err) {
      setChapterActionError(err?.response?.data?.message || t("author.studio.book.errors.monetization"));
    } finally {
      setMonetizingChapterId(null);
    }
  };

  const handleAttestRights = async () => {
    if (!bookId) return;

    setAttestingRights(true);
    setContractError("");
    try {
      setContract(await attestAuthorBookRights(bookId));
    } catch (err) {
      setContractError(err?.response?.data?.message || t("author.studio.book.errors.attestRights"));
    } finally {
      setAttestingRights(false);
    }
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
      setArcError(t("author.studio.book.errors.volumeName"));
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
      setArcError(err?.response?.data?.message || t("author.studio.book.errors.createVolume"));
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
      setRenameArcError(t("author.studio.book.errors.volumeName"));
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
    const chaptersInArc = chapters.filter((chapter) => String(chapter?.arcId ?? chapter?.ArcId ?? "") === targetArcId);
    if (chaptersInArc.some((chapter) => isChapterLockedForAuthor(chapter))) {
      setChapterActionError(t("author.studio.book.errors.locked"));
      setDeletingArcId("");
      return;
    }

    const draftEntries = readLocalDrafts(bookId);
    const draftsInArc = draftEntries.filter((draft) => String(draft?.arcId ?? "") === targetArcId);

    if (draftsInArc.length) {
      const remainingDrafts = draftEntries.filter((draft) => String(draft?.arcId ?? "") !== targetArcId);
      persistDrafts(bookId, remainingDrafts);
      draftsInArc.forEach((draft) => {
        addToTrash(bookId, {
          id: `trash-arc-draft-${draft.id}`,
          title: String(draft?.title ?? t("author.studio.common.untitledDraft")),
          chapterNumber: null,
          createdAt: draft?.savedAt ?? null,
          contentHtml: String(draft?.contentHtml ?? ""),
          arcId: targetArcId,
          authorThought: String(draft?.authorThought ?? ""),
          source: "draft",
        });
      });
    }

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
      setChapterActionError(t("author.studio.book.errors.deleteArcPartial", { count: failedCount }));
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
        const adjustedFile = await buildBookCoverUploadFile(editForm.coverFile, {
          title: editForm.title?.trim() || book.title,
          width: COVER_CANVAS_W,
          height: COVER_CANVAS_H,
          zoom: Number(editForm.coverZoom || 1),
          offsetX: Number(editForm.coverOffsetX || 0),
          offsetY: Number(editForm.coverOffsetY || 0),
        });
        coverImageUrl = await uploadBookCover(adjustedFile, {
          bookId,
          title: editForm.title?.trim() || book.title,
        });
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
      const previousCoverPreviewUrl = editForm.coverPreviewUrl;
      await load();
      cleanupEditCoverPreview(previousCoverPreviewUrl);
      setEditOpen(false);
      setEditCoverEditorOpen(false);
    } catch (err) {
      setEditError(err?.response?.data?.message || t("author.studio.book.errors.update"));
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <LoadingState text={t("author.studio.book.loading")} />;
  if (error) return <ErrorState title={t("author.studio.book.unavailable")} subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-detail-page">
      <section className="authorx-detail-head authorx-detail-head--studio">
        <div className="authorx-detail-head-left">
          <button
            type="button"
            className="authorx-back-btn border-0 bg-none"
            onClick={() => navigate("/author/workspace")}
            aria-label={t("author.studio.book.backToWorkspace")}
            title={t("author.studio.common.back")}
          >
            <FiArrowLeft size={25} />
          </button>
          <div className="authorx-detail-head-copy">
            <span className="author-studio-eyebrow">{t("author.studio.book.storyDesk")}</span>
            <h1>{bookTitle || t("author.studio.book.bookDetails")}</h1>
            <p>{t("author.studio.book.subtitle")}</p>
          </div>
        </div>

        <div className="authorx-detail-head-right justify-content-end">
          <Button
            type="button"
            variant="outline"
            size="md"
            style={{height:"auto"}}
            onClick={openEdit}
            aria-label={t("author.studio.book.editBook")}
            title={t("author.studio.common.edit")}
          >
            <FiEdit2 size={16} />
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={createDraftAndOpen}
          >
            {t("author.studio.book.createChapter")}
          </Button>
        </div>
      </section>

      <Surface className="authorx-desk-tabs">
        <Segmented
          value={deskTab}
          onChange={changeDeskTab}
          options={deskTabs.map((tab) => ({
            value: tab.key,
            label: tab.label,
          }))}
        />
      </Surface>

      {deskTab === "details" ? (
      <Surface className="authorx-book-detail-card">
        <div className="authorx-book-detail-main">
          <div className="authorx-book-detail-cover">
            {coverImage ? <img src={coverImage} alt={bookTitle || t("author.studio.common.bookCover")} /> : <span>{bookTitle.slice(0, 1)}</span>}
          </div>

          <div className="authorx-book-detail-meta">
            <h2>{bookTitle}</h2>
            <p>
              {t("author.studio.book.byAuthor")} <strong>{authorName}</strong>
            </p>
            <p>{bookDescription || t("author.studio.common.noSynopsis")}</p>
          </div>
        </div>

        <div className="authorx-book-detail-stats">
          <div>
            <span>{t("author.studio.book.type")}</span>
            <strong>{verseType}</strong>
          </div>
          <div>
            <span>{t("author.studio.book.state")}</span>
            <strong>{formatStatusLabel(bookState)}</strong>
          </div>
          <button
            type="button"
            className="authorx-book-detail-stat-button"
            onClick={() => setContractDialogOpen(true)}
            aria-label={`${t("author.studio.book.contractReadiness")}: ${isContracted ? t("author.studio.book.approved") : formatContractStatus(contractStatus, t)}`}
          >
            <span>{t("author.studio.book.contract")}</span>
            <strong>{isContracted ? t("author.studio.book.approved") : formatContractStatus(contractStatus, t)}</strong>
          </button>
          <div>
            <span>{t("author.studio.common.chapters")}</span>
            <strong>{formatCompactNumber(chapters.length)}</strong>
          </div>
        </div>
      </Surface>
      ) : null}

      {contractDialogOpen && (
        <div className="authorx-modal-backdrop" onClick={() => setContractDialogOpen(false)}>
          <div
            className="authorx-modal authorx-contract-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("author.studio.book.contractReadiness")}
            onClick={(e) => e.stopPropagation()}
          >
            <PageHeader
              title={t("author.studio.book.contractReadiness")}
              subtitle={t("author.studio.book.contractSubtitle")}
              variant="light"
            />

            <div className="authorx-contract-dialog-status">
              <span>{t("author.studio.book.currentStatus")}</span>
              <strong>{isContracted ? t("author.studio.book.approved") : formatContractStatus(contractStatus, t)}</strong>
            </div>

            <div className="authorx-contract-meter-grid">
              <div>
                <span>{t("author.studio.common.words")}</span>
                <strong>{formatCompactNumber(contractRequirements.words.current)}</strong>
                <small>{t("author.studio.book.required", { value: formatCompactNumber(contractRequirements.words.required) })}</small>
              </div>
              <div>
                <span>{t("author.studio.common.chapters")}</span>
                <strong>{formatCompactNumber(contractRequirements.chapters.current)}</strong>
                <small>{t("author.studio.book.required", { value: formatCompactNumber(contractRequirements.chapters.required) })}</small>
              </div>
              <div>
                <span>{t("author.studio.common.views")}</span>
                <strong>{formatCompactNumber(contractRequirements.views.current)}</strong>
                <small>{t("author.studio.book.required", { value: formatCompactNumber(contractRequirements.views.required) })}</small>
              </div>
            </div>

            {contractError ? <div className="authorx-form-error">{contractError}</div> : null}

            {contractMissingRequirements.length ? (
              <div className="authorx-contract-missing-list authorx-contract-missing-list--plain">
                {contractMissingRequirements.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : (
              <p className="authorx-contract-note">
                {isContracted ? t("author.studio.book.contractApprovedNote") : t("author.studio.book.contractReviewNote")}
              </p>
            )}

            <div className="authorx-modal-actions">
              {canAttestRights ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAttestRights}
                  disabled={attestingRights}
                >
                  {attestingRights ? t("author.studio.common.saving") : t("author.studio.book.attestRights")}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setContractDialogOpen(false)}
              >
                {t("author.studio.common.close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deskTab === "chapters" ? (
      <Surface className="authorx-chapter-panel">
        <AuthorSectionHeading
          eyebrow={t("author.studio.book.chapterBoard")}
          title={t("author.studio.book.chapterBoardTitle")}
          description={t("author.studio.book.chapterBoardDescription")}
        />
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
            title={t("author.studio.book.noTabChapters", { tab: activeTab })}
            subtitle={t("author.studio.book.chaptersAppear")}
          />
        ) : (
          <div className="authorx-chapter-list">
            <div className="authorx-chapter-head">
              <span>{t("author.studio.book.chapterTitle")}</span>
              <div className="d-flex align-items-center gap-2 justify-content-end">
                {activeTab === "published" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    onClick={openArcModal}
                  >
                    {t("author.studio.book.newVolume")}
                  </button>
                )}
                <span>{t("author.studio.book.createdTime")}</span>
              </div>
            </div>
            {chapterSections.map((section, sectionIndex) => {
              const sectionKey = `${section.label}-${sectionIndex}`;
              const isManagedArc = activeTab === "published" && Boolean(section.arcId);
              const showArcActions = isManagedArc && hoveredArcLabel === sectionKey;
              const sectionHasLockedChapters = section.items.some((chapter) => isChapterLockedForAuthor(chapter));

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
                            {t("author.studio.common.edit")}
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdjustArcModal();
                            }}
                          >
                            {t("author.studio.book.adjustSequence")}
                          </button>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-decoration-none text-danger"
                            disabled={deletingArcId === String(section.arcId) || sectionHasLockedChapters}
                            title={sectionHasLockedChapters ? t("author.studio.book.errors.locked") : undefined}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteArcAndMoveChaptersToTrash(section.arcId);
                            }}
                          >
                            {deletingArcId === String(section.arcId) ? t("author.studio.common.deleting") : t("author.studio.common.delete")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {section.items.map((ch) => {
                    const rowId = String(ch.id ?? ch.ID ?? ch.draftId ?? "");
                    const chapterPaid = Boolean(ch.isPaid || ch.IsPaid);
                    const beforePaidCutoff = isChapterBeforePaidCutoff(ch);
                    const canMakePaid = isContracted && !beforePaidCutoff;
                    const chapterLocked = isChapterLockedForAuthor(ch);
                    const canDelete = activeTab !== "trash" && !chapterLocked;
                    const showDelete = canDelete && hoveredChapterId === rowId;
                    const showRecover = activeTab === "trash" && hoveredChapterId === rowId;
                    const showLockPill = chapterLocked && activeTab === "published" && hoveredChapterId === rowId;

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
                          <strong>{ch.title || t("author.studio.common.untitled")}</strong>
                          <div>
                            {ch.isLocalDraft ? t("author.studio.book.localDraft") : t("author.studio.book.chapterNumber", { number: ch.chapterNumber ?? "?" })}
                            {!ch.isLocalDraft && chapterPaid ? ` · ${t("author.studio.book.paidCoins")}` : ""}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2 justify-content-end">
                          {!ch.isLocalDraft && activeTab === "published" && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              disabled={monetizingChapterId === rowId || (!chapterPaid && !canMakePaid)}
                              onClick={(e) => toggleChapterPaid(ch, e)}
                              title={!chapterPaid && !canMakePaid
                                ? isContracted
                                  ? t("author.studio.book.errors.postContractOnly")
                                  : t("author.studio.book.errors.paidNeedsContract")
                                : undefined}
                            >
                              {monetizingChapterId === rowId
                                ? t("author.studio.common.saving")
                                : chapterPaid
                                  ? t("author.studio.book.makeFree")
                                  : canMakePaid
                                    ? t("author.studio.book.makePaid")
                                    : isContracted
                                      ? t("author.studio.book.preContract")
                                      : t("author.studio.book.contractRequired")}
                            </button>
                          )}
                          {showDelete && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={deletingChapterId === rowId}
                              onClick={(e) => handleDeleteChapter(ch, e)}
                            >
                              {deletingChapterId === rowId ? t("author.studio.common.deleting") : t("author.studio.common.delete")}
                            </button>
                          )}
                          {showLockPill && (
                            <span
                              className="authorx-chapter-lock-pill"
                              title={t("author.studio.book.errors.locked")}
                            >
                              {t("author.studio.book.locked")}
                            </span>
                          )}
                          {showRecover && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={(e) => handleRecoverChapter(ch, e)}
                            >
                              {t("author.studio.book.recover")}
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
      ) : null}

      {deskTab !== "details" && deskTab !== "chapters" ? (
        <AuthorBookBible
          bookId={bookId}
          section={deskTab}
          chapters={chapters}
          setupMode={setupMode}
          onOpenChapters={() => changeDeskTab("chapters")}
        />
      ) : null}

            {arcModalOpen && (
        <div className="authorx-modal-backdrop" onClick={closeArcModal}>
          <div className="authorx-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader
              title={t("author.studio.book.newVolumeTitle")}
              subtitle={t("author.studio.book.newVolumeSubtitle")}
              variant="light"
            />

            <form onSubmit={saveArc} className="authorx-form">
              <TextField
                value={arcName}
                onChange={(v) => setArcName(v)}
                placeholder={t("author.studio.book.volumeName")}
              />

              {arcError && <div className="authorx-form-error">{arcError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeArcModal} disabled={arcSaving}>
                  {t("author.studio.common.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={arcSaving}>
                  {arcSaving ? t("author.studio.common.creating") : t("author.studio.workspace.createBook")}
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
              title={t("author.studio.book.editVolumeTitle")}
              subtitle={t("author.studio.book.editVolumeSubtitle")}
              variant="light"
            />

            <form onSubmit={saveArcRename} className="authorx-form">
              <TextField
                value={renameArcName}
                onChange={(v) => setRenameArcName(v)}
                placeholder={t("author.studio.book.volumeName")}
              />

              {renameArcError && <div className="authorx-form-error">{renameArcError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeRenameArcModal}>
                  {t("author.studio.common.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="md">
                  {t("author.studio.common.save")}
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
              title={t("author.studio.book.adjustVolumeTitle")}
              subtitle={t("author.studio.book.adjustVolumeSubtitle")}
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
                  {t("author.studio.common.cancel")}
                </Button>
                <Button type="button" variant="primary" size="md" onClick={saveArcSequence}>
                  {t("author.studio.book.saveOrder")}
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
              title={t("author.studio.book.editBook")}
              subtitle={t("author.studio.book.updateDetails")}
              variant="light"
            />

            <form onSubmit={saveEdit} className="authorx-form authorx-edit-form">
              <TextField
                value={editForm.title}
                onChange={(v) => setEditForm((prev) => ({ ...prev, title: v }))}
                placeholder={t("author.studio.common.bookName")}
              />

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={editForm.verseType}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, verseType: v }))}
                  options={bookTypeOptions}
                  placeholder={t("author.studio.common.bookType")}
                />
                <DropdownSelectSearchable
                  value={editForm.leadGender}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, leadGender: v }))}
                  options={leadGenderOptions}
                  placeholder={t("author.studio.common.leadingGender")}
                />
              </div>

              <div className="authorx-form-grid">
                <DropdownSelectSearchable
                  value={editForm.genreId}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, genreId: v }))}
                  options={genreOptions}
                  placeholder={t("author.studio.common.genre")}
                />
                <DropdownSelectSearchable
                  value={editForm.language}
                  onChange={(v) => setEditForm((prev) => ({ ...prev, language: v }))}
                  options={languageOptions}
                  placeholder={t("author.studio.common.language")}
                />
              </div>

              <div className="authorx-cover-slot-field">
                <span className="authorx-upload-label">{t("author.studio.common.cover")}</span>
                <label className={`authorx-cover-slot ${editForm.coverImageUrl ? "has-image" : ""}`}>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleEditCoverFileChange(e.target.files?.[0] || null)}
                  />
                  <span className="authorx-cover-slot-frame">
                    {editForm.coverImageUrl ? (
                      editCoverPreviewStyle ? (
                        <img
                          src={editForm.coverImageUrl}
                          alt={t("author.studio.workspace.coverPreview")}
                          className="authorx-cover-preview-image"
                          style={editCoverPreviewStyle}
                        />
                      ) : (
                        <img
                          src={editForm.coverImageUrl}
                          alt={t("author.studio.workspace.coverPreview")}
                          className="authorx-cover-preview-image authorx-cover-preview-image--fit"
                        />
                      )
                    ) : (
                      <span className="authorx-cover-slot-empty">{t("author.studio.common.cover")}</span>
                    )}
                  </span>
                  <span className="authorx-cover-slot-overlay">{t("author.studio.common.uploadImage")}</span>
                </label>
                {editForm.coverFile ? (
                  <button type="button" className="authorx-cover-slot-adjust" onClick={openEditCoverEditor}>
                    {t("author.studio.common.adjustCover")}
                  </button>
                ) : null}
              </div>

              <DropdownSelectSearchable
                value={editForm.trendId}
                onChange={(v) => setEditForm((prev) => ({ ...prev, trendId: v }))}
                options={trendOptions}
                placeholder={t("author.studio.common.trendOptional")}
              />

              <MultiSelectDropdownSearchable
                label={t("author.studio.common.tagsDefault")}
                values={editForm.tagIds}
                onChange={(vals) => setEditForm((prev) => ({ ...prev, tagIds: vals }))}
                options={tagOptions}
              />

              <textarea
                className="authorx-textarea authorx-textarea--compact"
                value={editForm.synopsis}
                onChange={(e) => setEditForm((prev) => ({ ...prev, synopsis: e.target.value }))}
                placeholder={t("author.studio.common.synopsis")}
                rows={4}
              />

              {editError && <div className="authorx-form-error">{editError}</div>}

              <div className="authorx-modal-actions">
                <Button type="button" variant="outline" size="md" onClick={closeEdit} disabled={savingEdit}>
                  {t("author.studio.common.cancel")}
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={savingEdit}>
                  {savingEdit ? t("author.studio.common.saving") : t("author.studio.common.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editCoverEditorOpen && (
        <div className="authorx-modal-backdrop authorx-modal-backdrop--cover-editor" onClick={closeEditCoverEditor}>
          <div className="authorx-cover-editor-modal" onClick={(e) => e.stopPropagation()}>
            <PageHeader title={t("author.studio.common.adjustCover")} variant="light" />

            <div className="authorx-cover-editor-stage">
              <div
                ref={editCoverFrameRef}
                className="authorx-cover-editor-frame"
                onWheel={handleEditCoverWheel}
                onMouseDown={handleEditCoverMouseDown}
                onTouchStart={handleEditCoverTouchStart}
                onTouchMove={handleEditCoverTouchMove}
                onTouchEnd={handleEditCoverTouchEnd}
              >
                {editCoverEditorStyle && (
                  <img src={editForm.coverImageUrl} alt={t("author.studio.workspace.coverEditor")} className="authorx-cover-preview-image" style={editCoverEditorStyle} />
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
                value={editCoverDraft.zoom}
                onChange={(e) => updateEditCoverZoom(e.target.value)}
              />
            </label>

            <div className="authorx-modal-actions">
              <Button type="button" variant="outline" size="md" onClick={closeEditCoverEditor}>
                {t("author.studio.common.cancel")}
              </Button>
              <Button type="button" variant="primary" size="md" onClick={saveEditCoverEditor}>
                {t("author.studio.common.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
