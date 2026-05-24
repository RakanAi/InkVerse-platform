import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiBold,
  FiClipboard,
  FiCpu,
  FiEdit3,
  FiEye,
  FiFileText,
  FiGift,
  FiHeart,
  FiItalic,
  FiMessageCircle,
  FiMessageSquare,
  FiRotateCcw,
  FiRotateCw,
  FiSave,
  FiSearch,
  FiSend,
  FiTag,
  FiThumbsUp,
  FiUpload,
  FiX,
} from "react-icons/fi";
import Button from "../../Shared/ui/Button";
import Surface from "../../Shared/ui/Surface";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import DropdownSelect from "../../Shared/ui/DropdownSelect";
import { getBookTitle } from "../../features/author/author.utils";
import { fetchAuthorBookContract } from "../../Api/book-contracts.api";
import { createAiServiceOrder, fetchAuthorAgreement } from "../../Api/monetization.api";
import { createChapter, fetchBookArcs, fetchBookById } from "./authorApi";
import "../../features/monetization/monetization.css";

const CHAPTER_AI_TOOLS = [
  { key: "plot-planner", labelKey: "plotPlanner.label", textKey: "plotPlanner.text" },
  { key: "next-plot", labelKey: "nextPlot.label", textKey: "nextPlot.text" },
  { key: "character-analysis", labelKey: "characterAnalysis.label", textKey: "characterAnalysis.text" },
  { key: "continuity-check", labelKey: "continuityCheck.label", textKey: "continuityCheck.text" },
  { key: "worldbuilding-notes", labelKey: "worldbuildingNotes.label", textKey: "worldbuildingNotes.text" },
];

function htmlToPlainText(html) {
  const container = document.createElement("div");
  container.innerHTML = html || "";
  return container.innerText || "";
}

function countWords(text) {
  const clean = String(text || "").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainTextToHtml(text) {
  return String(text || "")
    .trim()
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function getEditorSelectedText(editor) {
  if (!editor || typeof window === "undefined") return "";
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return "";
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const owner = container.nodeType === 1 ? container : container.parentElement;
  if (!owner || !editor.contains(owner)) return "";
  return selection.toString().trim();
}

function getDraftsKey(bookId) {
  return `inkverse:author:chapter-drafts:${bookId}`;
}

function getLegacyDraftKey(bookId) {
  return `inkverse:author:chapter-draft:${bookId}`;
}

function readDrafts(bookId) {
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
      isPaid: Boolean(legacy?.isPaid),
      teaser: String(legacy?.teaser ?? ""),
      savedAt: legacy?.savedAt ?? new Date().toISOString(),
    }];

    localStorage.setItem(getDraftsKey(bookId), JSON.stringify(migrated));
    localStorage.removeItem(getLegacyDraftKey(bookId));
    return migrated;
  } catch {
    return [];
  }
}

function saveDrafts(bookId, drafts) {
  if (!bookId || typeof window === "undefined") return;
  localStorage.setItem(getDraftsKey(bookId), JSON.stringify(drafts));
}

function createBlankDraft(bookId) {
  const drafts = readDrafts(bookId);
  const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  drafts.push({
    id,
    title: "",
    contentHtml: "",
    arcId: "",
    authorThought: "",
    isPaid: false,
    teaser: "",
    savedAt: new Date().toISOString(),
  });
  saveDrafts(bookId, drafts);
  return id;
}

function upsertDraft(bookId, draft) {
  const drafts = readDrafts(bookId);
  const idx = drafts.findIndex((d) => String(d?.id) === String(draft?.id));
  if (idx >= 0) drafts[idx] = draft;
  else drafts.push(draft);
  saveDrafts(bookId, drafts);
}

function removeDraft(bookId, draftId) {
  const drafts = readDrafts(bookId).filter((d) => String(d?.id) !== String(draftId));
  saveDrafts(bookId, drafts);
}

export default function AuthorChapterCreate() {
  const { t } = useTranslation();
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdFromQuery = searchParams.get("draftId");

  const [book, setBook] = useState(null);
  const [contract, setContract] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [arcs, setArcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [arcId, setArcId] = useState("");
  const [authorThought, setAuthorThought] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [teaser, setTeaser] = useState("");

  const [statusMsg, setStatusMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [isThoughtDialogOpen, setIsThoughtDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [thoughtDraft, setThoughtDraft] = useState("");
  const [isWishMenuOpen, setIsWishMenuOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [recommendQuery, setRecommendQuery] = useState("");
  const [currentDraftId, setCurrentDraftId] = useState("");
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiToolKey, setAiToolKey] = useState(CHAPTER_AI_TOOLS[0].key);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContextText, setAiContextText] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  const editorRef = useRef(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!bookId) return;

      setLoading(true);
      setError("");
      try {
        const [bookRes, arcsRes, contractRes, agreementRes] = await Promise.allSettled([
          fetchBookById(bookId),
          fetchBookArcs(bookId),
          fetchAuthorBookContract(bookId),
          fetchAuthorAgreement(),
        ]);

        if (!alive) return;
        if (bookRes.status !== "fulfilled") {
          throw bookRes.reason;
        }

        setBook(bookRes.value ?? null);
        const nextContract = contractRes.status === "fulfilled" ? contractRes.value : null;
        const nextAgreement = agreementRes.status === "fulfilled" ? agreementRes.value : null;
        const nextCanCreatePaidChapter = Boolean(nextContract?.isContracted && nextAgreement?.hasAccepted);

        setContract(nextContract);
        setAgreement(nextAgreement);
        setArcs(
          arcsRes.status === "fulfilled" && Array.isArray(arcsRes.value)
            ? arcsRes.value
            : [],
        );

        let activeDraftId = draftIdFromQuery;
        let drafts = readDrafts(bookId);

        if (!activeDraftId) {
          activeDraftId = createBlankDraft(bookId);
          drafts = readDrafts(bookId);
          setSearchParams({ draftId: activeDraftId }, { replace: true });
        }

        let draft = drafts.find((d) => String(d?.id) === String(activeDraftId));
        if (!draft) {
          activeDraftId = createBlankDraft(bookId);
          drafts = readDrafts(bookId);
          draft = drafts.find((d) => String(d?.id) === String(activeDraftId));
          setSearchParams({ draftId: activeDraftId }, { replace: true });
        }

        setCurrentDraftId(String(activeDraftId ?? ""));
        setTitle(draft?.title ?? "");
        setContentHtml(draft?.contentHtml ?? "");
        setArcId(draft?.arcId ?? "");
        setAuthorThought(draft?.authorThought ?? "");
        setIsPaid(Boolean(draft?.isPaid) && nextCanCreatePaidChapter);
        setTeaser(nextCanCreatePaidChapter ? draft?.teaser ?? "" : "");
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || t("author.studio.chapterEditor.unavailable"));
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [bookId, draftIdFromQuery, setSearchParams, t]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== contentHtml) {
      editorRef.current.innerHTML = contentHtml;
    }
  }, [contentHtml]);

  const contentPlainText = useMemo(() => htmlToPlainText(contentHtml), [contentHtml]);
  const chapterWordCount = useMemo(() => countWords(contentPlainText), [contentPlainText]);
  const aiTools = useMemo(
    () => CHAPTER_AI_TOOLS.map((tool) => ({
      ...tool,
      label: t(`author.studio.storyStudio.toolsData.${tool.labelKey}`),
      text: t(`author.studio.storyStudio.toolsData.${tool.textKey}`),
    })),
    [t],
  );
  const selectedAiTool = aiTools.find((tool) => tool.key === aiToolKey) ?? aiTools[0];
  const aiContextWordCount = useMemo(
    () => countWords(aiContextText || contentPlainText),
    [aiContextText, contentPlainText],
  );
  const arcOptions = useMemo(
    () => [
      { value: "", label: t("author.studio.chapterEditor.noArc") },
      ...arcs.map((arc) => ({
        value: String(arc?.id ?? arc?.ID ?? ""),
        label: String(arc?.name ?? arc?.Name ?? t("author.studio.common.untitledArc")),
      })),
    ],
    [arcs, t],
  );
  const canCreatePaidChapter = Boolean(contract?.isContracted && agreement?.hasAccepted);
  const paidChapterBlockReason = !contract?.isContracted
    ? t("author.studio.chapterEditor.needsContract")
    : !agreement?.hasAccepted
      ? t("author.studio.chapterEditor.needsAgreement")
      : "";

  const wishTemplates = useMemo(
    () => [
      {
        id: "gift",
        title: t("author.studio.chapterEditor.wish.giftTitle"),
        message: t("author.studio.chapterEditor.wish.giftText"),
        icon: FiGift,
        color: "#10b981",
      },
      {
        id: "vote",
        title: t("author.studio.chapterEditor.wish.voteTitle"),
        message: t("author.studio.chapterEditor.wish.voteText"),
        icon: FiThumbsUp,
        color: "#4f46e5",
      },
      {
        id: "tag",
        title: t("author.studio.chapterEditor.wish.tagTitle"),
        message: t("author.studio.chapterEditor.wish.tagText"),
        icon: FiTag,
        color: "#e11d48",
      },
      {
        id: "like",
        title: t("author.studio.chapterEditor.wish.likeTitle"),
        message: t("author.studio.chapterEditor.wish.likeText"),
        icon: FiHeart,
        color: "#f97316",
      },
      {
        id: "comment",
        title: t("author.studio.chapterEditor.wish.commentTitle"),
        message: t("author.studio.chapterEditor.wish.commentText"),
        icon: FiMessageCircle,
        color: "#3b82f6",
      },
    ],
    [t],
  );

  const recommendationWorks = useMemo(
    () => [
      {
        id: String(book?.id ?? bookId ?? "current-book"),
        title: String(book?.title || t("author.studio.chapterEditor.currentBook")),
        author: String(book?.authorName || book?.author || t("author.studio.chapterEditor.me")),
        cover: book?.coverImageUrl || book?.coverUrl || "",
      },
    ],
    [book, bookId, t],
  );

  const filteredRecommendationWorks = useMemo(() => {
    const q = recommendQuery.trim().toLowerCase();
    if (!q) return recommendationWorks;
    return recommendationWorks.filter((w) => w.title.toLowerCase().includes(q));
  }, [recommendQuery, recommendationWorks]);

  const applyCommand = (command) => {
    editorRef.current?.focus();
    document.execCommand(command);
    const nextHtml = editorRef.current?.innerHTML || "";
    setContentHtml(nextHtml);
  };

  const getCurrentEditorText = () => String(editorRef.current?.innerText ?? contentPlainText)
    .replace(/\r\n?/g, "\n")
    .trim();

  const openAiDrawer = () => {
    setAiError("");
    setAiContextText(getEditorSelectedText(editorRef.current));
    setIsAiDrawerOpen(true);
  };

  const refreshAiContext = () => {
    const selectedText = getEditorSelectedText(editorRef.current);
    setAiContextText(selectedText);
    setAiError("");
    setStatusMsg(
      selectedText
        ? t("author.studio.chapterEditor.aiContextSelection", { defaultValue: "AI context updated from selected text." })
        : t("author.studio.chapterEditor.aiContextDraft", { defaultValue: "AI context will use the full chapter draft." }),
    );
  };

  const runAiAssistant = async (event) => {
    event?.preventDefault();
    if (!bookId || !selectedAiTool) return;

    const prompt = aiPrompt.trim();
    const contextText = (aiContextText || getCurrentEditorText()).trim();

    if (!prompt && !contextText) {
      setAiError(t("author.studio.chapterEditor.aiNeedsPrompt", { defaultValue: "Write a question or add chapter text first." }));
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      toolLabel: selectedAiTool.label,
      text: prompt || selectedAiTool.text,
    };

    setAiMessages((messages) => [...messages, userMessage]);
    setAiBusy(true);
    setAiError("");
    setStatusMsg("");

    try {
      const order = await createAiServiceOrder({
        serviceKey: selectedAiTool.key,
        bookId: Number(bookId),
        selectedChapterIds: [],
        prompt: prompt || selectedAiTool.text,
        draftTitle: title.trim() || t("author.studio.chapterEditor.untitledChapter"),
        draftContent: contextText,
      });

      const output = order?.notebookEntry?.content || order?.outputPreview || "";
      setAiMessages((messages) => [
        ...messages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          toolLabel: selectedAiTool.label,
          text: output || t("author.studio.chapterEditor.aiEmptyResult", { defaultValue: "The assistant finished, but no text came back." }),
          credits: order?.priceCredits,
          savedToNotebook: Boolean(order?.notebookEntry),
        },
      ]);
      setAiPrompt("");
    } catch (err) {
      setAiError(err?.response?.data?.message || t("author.studio.chapterEditor.aiRunFailed", { defaultValue: "Could not run this AI tool." }));
    } finally {
      setAiBusy(false);
    }
  };

  const insertAiMessage = (text) => {
    const html = plainTextToHtml(text);
    if (!html) return;

    const currentHtml = editorRef.current?.innerHTML || contentHtml || "";
    const nextHtml = `${currentHtml}<div class="authorx-ai-inserted-block">${html}</div>`;
    setContentHtml(nextHtml);
    setStatusMsg(t("author.studio.chapterEditor.aiInserted", { defaultValue: "AI result inserted into the draft." }));
  };

  const copyAiMessage = async (text) => {
    if (!text || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setStatusMsg(t("author.studio.chapterEditor.aiCopied", { defaultValue: "AI result copied." }));
  };

  const openThoughtDialog = () => {
    setThoughtDraft(authorThought);
    setRecommendQuery("");
    setIsWishMenuOpen(false);
    setIsRecommendationOpen(false);
    setIsThoughtDialogOpen(true);
  };

  const closeThoughtDialog = () => {
    setIsThoughtDialogOpen(false);
    setIsWishMenuOpen(false);
    setIsRecommendationOpen(false);
  };

  const submitThoughtDialog = () => {
    setAuthorThought(thoughtDraft);
    setIsThoughtDialogOpen(false);
    setIsWishMenuOpen(false);
    setIsRecommendationOpen(false);
  };

  const applyWishTemplate = (template) => {
    const next = thoughtDraft.trim()
      ? `${thoughtDraft.trim()}\n\n${template.message}`
      : template.message;
    setThoughtDraft(next);
    setIsWishMenuOpen(false);
  };

  const applyRecommendation = (work) => {
    const recommendation = t("author.studio.chapterEditor.recommendationText", { title: work.title });
    const next = thoughtDraft.trim()
      ? `${thoughtDraft.trim()}\n\n${recommendation}`
      : recommendation;
    setThoughtDraft(next);
    setIsRecommendationOpen(false);
  };

  const saveDraft = async () => {
    if (!bookId) return;

    setSavingDraft(true);
    setActionError("");
    setStatusMsg("");
    try {
      const draftId = currentDraftId || createBlankDraft(bookId);
      upsertDraft(bookId, {
        id: draftId,
        title,
        contentHtml,
        arcId,
        authorThought,
        isPaid: canCreatePaidChapter && isPaid,
        teaser: canCreatePaidChapter && isPaid ? teaser : "",
        savedAt: new Date().toISOString(),
      });

      if (!currentDraftId) {
        setCurrentDraftId(draftId);
        setSearchParams({ draftId }, { replace: true });
      }

      setStatusMsg(t("author.studio.chapterEditor.draftSaved"));
    } catch {
      setActionError(t("author.studio.chapterEditor.draftSaveFailed"));
    } finally {
      setSavingDraft(false);
    }
  };

  const publishChapter = async () => {
    if (!bookId) return;

    setActionError("");
    setStatusMsg("");

    const cleanTitle = title.trim();
    const editorText = String(editorRef.current?.innerText ?? contentPlainText).replace(
      /\r\n?/g,
      "\n",
    );
    const cleanContent = editorText.trim();
    const cleanThought = authorThought.trim();

    if (!cleanTitle) {
      setActionError(t("author.studio.chapterEditor.titleRequired"));
      return;
    }

    if (!cleanContent) {
      setActionError(t("author.studio.chapterEditor.contentRequired"));
      return;
    }

    const finalContent = cleanThought
      ? `${editorText}${editorText.endsWith("\n") ? "" : "\n"}\n${t("author.studio.chapterEditor.authorThought")}\n${cleanThought}`
      : editorText;

    setPublishing(true);
    try {
      await createChapter({
        title: cleanTitle,
        content: finalContent,
        bookId: Number(bookId),
        arcId: arcId ? Number(arcId) : null,
        isPaid: canCreatePaidChapter && isPaid,
        teaser: canCreatePaidChapter && isPaid ? teaser.trim() || null : null,
      });

      if (currentDraftId) {
        removeDraft(bookId, currentDraftId);
      }
      createBlankDraft(bookId);
      navigate(`/author/workspace/${bookId}`);
    } catch (e) {
      setActionError(e?.response?.data?.message || t("author.studio.chapterEditor.publishFailed"));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingState text={t("author.studio.chapterEditor.loading")} />;
  if (error) return <ErrorState title={t("author.studio.chapterEditor.unavailable")} subtitle={error} />;

  const previewContent = String(editorRef.current?.innerText ?? contentPlainText).replace(
    /\r\n?/g,
    "\n",
  );
  const previewThought = authorThought.trim();

  return (<div className="authorx-chapter-create-page">
      <section className="authorx-detail-head authorx-detail-head--studio">
        <div className="authorx-detail-head-left">
          <button
            type="button"
            className="authorx-back-btn authorx-chapter-back-btn border-0 bg-none"
            onClick={() => navigate(`/author/workspace/${bookId}`)}
            aria-label={t("author.studio.chapterEditor.backToBook")}
            title={t("author.studio.common.back")}
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="authorx-detail-head-copy">
            <span className="author-studio-eyebrow">{t("author.studio.chapterEditor.eyebrow")}</span>
            <div className="authorx-chapter-headline">
              {book?.title
                ? t("author.studio.chapterEditor.newChapterTitle", { book: getBookTitle(book) })
                : t("author.studio.chapterEditor.createChapter")}
            </div>
            <p>{t("author.studio.chapterEditor.subtitle")}</p>
          </div>
        </div>

        <div className="authorx-chapter-top-actions">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="authorx-chapter-top-btn"
            onClick={saveDraft}
            disabled={savingDraft || publishing}
          >
            <FiSave size={16} /> {savingDraft ? t("author.studio.common.saving") : t("author.studio.chapterEditor.saveDraft")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="d-flex align-items-center gap-2"
            onClick={publishChapter}
            disabled={publishing}
          >
            <FiUpload size={16} /> {publishing ? t("author.studio.chapterEditor.publishing") : t("author.studio.chapterEditor.publish")}
          </Button>
        </div>
      </section>

      <div className={`authorx-chapter-workspace ${isAiDrawerOpen ? "has-ai" : ""}`}>
        <Surface className="authorx-chapter-editor-shell">
          <div className="authorx-chapter-meta-row">
            <div className="authorx-chapter-arc-block">
              <label htmlFor="chapter-arc" className="authorx-chapter-label">
                {t("author.studio.chapterEditor.volumeArc")}
              </label>
              <DropdownSelect
                className="authorx-arc-dropdown"
                value={arcId}
                onChange={(nextValue) => setArcId(String(nextValue ?? ""))}
                options={arcOptions}
                placeholder={t("author.studio.chapterEditor.noArc")}
              />
            </div>

            <label className={`authorx-chapter-arc-block ${!canCreatePaidChapter ? "authorx-chapter-arc-block--muted" : ""}`}>
              <span className="authorx-chapter-label">{t("author.studio.chapterEditor.monetization")}</span>
              {canCreatePaidChapter ? (
                <span className="authorx-check-row">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(event) => setIsPaid(event.target.checked)}
                  />
                  <span>{t("author.studio.chapterEditor.paidChapter")}</span>
                </span>
              ) : (
                <span className="authorx-contract-lock-note">{paidChapterBlockReason}</span>
              )}
            </label>

            {/* <div className="authorx-chapter-format-block">
            </div> */}

            <div className="authorx-chapter-right-meta">
              <div className="authorx-word-count text-end">{t("author.studio.chapterEditor.wordCount", { count: chapterWordCount.toLocaleString() })}</div>
              <button
                type="button"
                className="authorx-eye-btn"
                onClick={() => setIsPreviewOpen(true)}
                title={t("author.studio.chapterEditor.previewChapter")}
                aria-label={t("author.studio.chapterEditor.previewChapter")}
              >
                <FiEye size={18} />
              </button>
            </div>
          </div>

          <div className="authorx-editor-wrap">
            <div className="authorx-editor-tools" aria-label={t("author.studio.chapterEditor.editorToolbar")}>
              <button
                type="button"
                className="authorx-editor-tool-btn"
                onClick={() => applyCommand("bold")}
                title={t("author.studio.chapterEditor.bold")}
              >
                <FiBold size={16} />
              </button>
              <button
                type="button"
                className="authorx-editor-tool-btn"
                onClick={() => applyCommand("italic")}
                title={t("author.studio.chapterEditor.italic")}
              >
                <FiItalic size={16} />
              </button>
              <button
                type="button"
                className="authorx-editor-tool-btn"
                onClick={openThoughtDialog}
                title={t("author.studio.chapterEditor.authorThought")}
              >
                <FiMessageSquare size={16} />
              </button>
              <button
                type="button"
                className={`authorx-editor-tool-btn ${isAiDrawerOpen ? "is-active" : ""}`}
                onClick={openAiDrawer}
                title={t("author.studio.chapterEditor.aiAssistant", { defaultValue: "AI assistant" })}
                aria-label={t("author.studio.chapterEditor.aiAssistant", { defaultValue: "AI assistant" })}
              >
                <FiCpu size={16} />
              </button>
              <button
                type="button"
                className="authorx-editor-tool-btn"
                onClick={() => applyCommand("undo")}
                title={t("author.studio.chapterEditor.undo")}
              >
                <FiRotateCcw size={16} />
              </button>
              <button
                type="button"
                className="authorx-editor-tool-btn"
                onClick={() => applyCommand("redo")}
                title={t("author.studio.chapterEditor.redo")}
              >
                <FiRotateCw size={16} />
              </button>
            </div>

            <div className="authorx-editor-page-stack">
              {canCreatePaidChapter && isPaid ? (
                <div className="authorx-chapter-teaser-wrap">
                  <textarea
                    className="authorx-textarea"
                    rows={3}
                    value={teaser}
                    onChange={(event) => setTeaser(event.target.value)}
                    placeholder={t("author.studio.chapterEditor.teaserPlaceholder")}
                  />
                </div>
              ) : null}

              <div className="authorx-chapter-title-wrap">
                <input
                  type="text"
                  className="authorx-chapter-title-input"
                  placeholder={t("author.studio.chapterEditor.titlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div
                ref={editorRef}
                className="authorx-editor-canvas"
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setContentHtml(e.currentTarget.innerHTML)}
                data-placeholder={t("author.studio.chapterEditor.contentPlaceholder")}
              />

              <div className="authorx-thought-row">
                <button
                  type="button"
                  className="authorx-add-thought-btn"
                  onClick={openThoughtDialog}
                >
                  {t("author.studio.chapterEditor.addThought")}
                </button>
              </div>

              {(statusMsg || actionError) && (
                <div className={`authorx-editor-status ${actionError ? "error" : ""}`}>
                  {actionError || statusMsg}
                </div>
              )}
            </div>
          </div>
        </Surface>

        {isAiDrawerOpen && (
          <aside className="authorx-ai-drawer" aria-label={t("author.studio.chapterEditor.aiAssistant", { defaultValue: "AI assistant" })}>
            <header className="authorx-ai-drawer__head">
              <div>
                <span>{t("author.studio.chapterEditor.aiAssistant", { defaultValue: "AI assistant" })}</span>
                <h2>{selectedAiTool?.label}</h2>
                <p>{selectedAiTool?.text}</p>
              </div>
              <button
                type="button"
                className="authorx-ai-close"
                onClick={() => setIsAiDrawerOpen(false)}
                aria-label={t("author.studio.chapterEditor.aiClose", { defaultValue: "Close AI assistant" })}
              >
                <FiX size={18} />
              </button>
            </header>

            <label className="authorx-ai-field">
              <span>{t("author.studio.chapterEditor.aiTool", { defaultValue: "Tool" })}</span>
              <select value={aiToolKey} onChange={(event) => setAiToolKey(event.target.value)}>
                {aiTools.map((tool) => (
                  <option key={tool.key} value={tool.key}>{tool.label}</option>
                ))}
              </select>
            </label>

            <div className="authorx-ai-context-card">
              <div>
                <span>
                  {aiContextText
                    ? t("author.studio.chapterEditor.aiSelectedContext", { defaultValue: "Selected text" })
                    : t("author.studio.chapterEditor.aiDraftContext", { defaultValue: "Full draft" })}
                </span>
                <strong>{t("author.studio.chapterEditor.aiContextWords", { defaultValue: "{{count}} words in context", count: aiContextWordCount.toLocaleString() })}</strong>
              </div>
              <button type="button" onClick={refreshAiContext}>
                {t("author.studio.chapterEditor.aiUseSelection", { defaultValue: "Use selection" })}
              </button>
            </div>

            <div className="authorx-ai-thread" aria-live="polite">
              {aiMessages.length === 0 ? (
                <div className="authorx-ai-empty">
                  <FiCpu size={20} />
                  <strong>{t("author.studio.chapterEditor.aiEmptyTitle", { defaultValue: "Ask from inside the chapter." })}</strong>
                  <p>{t("author.studio.chapterEditor.aiEmptyText", { defaultValue: "Pick a tool, ask what you need, then insert useful output into the draft." })}</p>
                </div>
              ) : (
                aiMessages.map((message) => (
                  <article key={message.id} className={`authorx-ai-message authorx-ai-message--${message.role}`}>
                    <div className="authorx-ai-message__meta">
                      <span>{message.role === "assistant" ? message.toolLabel : t("author.studio.chapterEditor.aiYou", { defaultValue: "You" })}</span>
                      {message.credits != null && <small>{message.credits} {t("author.studio.common.credits", { defaultValue: "credits" })}</small>}
                    </div>
                    <p>{message.text}</p>
                    {message.role === "assistant" && (
                      <div className="authorx-ai-message__actions">
                        <button type="button" onClick={() => insertAiMessage(message.text)}>
                          <FiEdit3 size={14} /> {t("author.studio.chapterEditor.aiInsert", { defaultValue: "Insert" })}
                        </button>
                        <button type="button" onClick={() => copyAiMessage(message.text)}>
                          <FiClipboard size={14} /> {t("author.studio.chapterEditor.aiCopy", { defaultValue: "Copy" })}
                        </button>
                        {message.savedToNotebook && (
                          <span>{t("author.studio.chapterEditor.aiSaved", { defaultValue: "Saved to notebook" })}</span>
                        )}
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>

            <form className="authorx-ai-composer" onSubmit={runAiAssistant}>
              {aiError && <div className="authorx-ai-error">{aiError}</div>}
              <textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                rows={4}
                placeholder={t("author.studio.chapterEditor.aiPromptPlaceholder", { defaultValue: "Ask for a plot turn, continuity check, character pressure, or worldbuilding note..." })}
              />
              <Button type="submit" variant="primary" size="md" disabled={aiBusy}>
                <FiSend size={15} /> {aiBusy ? t("author.studio.storyStudio.running") : t("author.studio.chapterEditor.aiAsk", { defaultValue: "Ask AI" })}
              </Button>
            </form>
          </aside>
        )}
      </div>

      {isThoughtDialogOpen && (
        <div className="authorx-modal-backdrop" onClick={closeThoughtDialog}>
          <div className="authorx-modal authorx-thought-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="authorx-thought-head">
              <h2>{t("author.studio.chapterEditor.thoughtTitle")}</h2>
              <button
                type="button"
                className="authorx-thought-close"
                onClick={closeThoughtDialog}
                aria-label={t("author.studio.chapterEditor.closeThought")}
              >
                <FiX size={18} />
              </button>
            </div>

            <textarea
              className="authorx-thought-textarea"
              rows={10}
              value={thoughtDraft}
              onChange={(e) => setThoughtDraft(e.target.value)}
              placeholder={t("author.studio.chapterEditor.thoughtPlaceholder")}
            />

            {isWishMenuOpen && (
              <div className="authorx-thought-overlay-panel">
                {wishTemplates.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="authorx-wish-card"
                      onClick={() => applyWishTemplate(item)}
                    >
                      <div className="authorx-wish-title">
                        <Icon size={14} style={{ color: item.color }} />
                        <strong>{item.title}</strong>
                      </div>
                      <p>{item.message}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {isRecommendationOpen && (
              <div className="authorx-thought-overlay-panel authorx-recommend-panel">
                <div className="authorx-recommend-head">
                  <span>{t("author.studio.chapterEditor.addBookRecommendation")}</span>
                  <button type="button" onClick={() => setIsRecommendationOpen(false)}>
                    <FiX size={16} />
                  </button>
                </div>

                <label className="authorx-recommend-search">
                  <FiSearch size={15} />
                  <input
                    type="text"
                    value={recommendQuery}
                    onChange={(e) => setRecommendQuery(e.target.value)}
                    placeholder={t("author.studio.chapterEditor.searchBooks")}
                  />
                </label>

                <h4>{t("author.studio.chapterEditor.chooseFromWorks")}</h4>
                <div className="authorx-recommend-list">
                  {filteredRecommendationWorks.map((work) => (
                    <button
                      key={work.id}
                      type="button"
                      className="authorx-recommend-item"
                      onClick={() => applyRecommendation(work)}
                    >
                      <div className="authorx-recommend-cover">
                        {work.cover ? <img src={work.cover} alt={work.title} /> : <span>{work.title.slice(0, 1)}</span>}
                      </div>
                      <div>
                        <strong>{work.title}</strong>
                        <span>{work.author}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="authorx-recommend-actions">
                  <button type="button" className="authorx-thought-cancel" onClick={() => setIsRecommendationOpen(false)}>
                    {t("author.studio.common.cancel")}
                  </button>
                  <button type="button" className="authorx-thought-submit" onClick={() => setIsRecommendationOpen(false)}>
                    {t("author.studio.common.confirm")}
                  </button>
                </div>
              </div>
            )}

            <div className="authorx-thought-footer">
              <div className="authorx-thought-tools">
                <button
                  type="button"
                  className="authorx-thought-tool-btn"
                  aria-label={t("author.studio.chapterEditor.wishTemplates")}
                  onClick={() => {
                    setIsRecommendationOpen(false);
                    setIsWishMenuOpen((v) => !v);
                  }}
                >
                  <FiEdit3 size={15} />
                </button>
                <button
                  type="button"
                  className="authorx-thought-tool-btn"
                  aria-label={t("author.studio.chapterEditor.recommendation")}
                  onClick={() => {
                    setIsWishMenuOpen(false);
                    setIsRecommendationOpen(true);
                  }}
                >
                  <FiFileText size={15} />
                </button>
              </div>

              <div className="authorx-thought-actions col-auto">
                <button type="button" className="authorx-thought-cancel" onClick={closeThoughtDialog}>
                  {t("author.studio.common.cancel")}
                </button>
                <button type="button" className="authorx-thought-submit" onClick={submitThoughtDialog}>
                  {t("author.studio.chapterEditor.submit")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isPreviewOpen && (
        <div className="authorx-modal-backdrop" onClick={() => setIsPreviewOpen(false)}>
          <div className="authorx-paper-preview" onClick={(e) => e.stopPropagation()}>
            <div className="authorx-paper-header">
              <h2>{title.trim() || t("author.studio.chapterEditor.untitledChapter")}</h2>
              <div>{t("author.studio.chapterEditor.wordCount", { count: chapterWordCount.toLocaleString() })}</div>
            </div>

            <div className="authorx-paper-content">
              {!previewContent.trim() ? (
                <p>{t("author.studio.chapterEditor.previewEmpty")}</p>
              ) : (
                <pre className="authorx-paper-pre">{previewContent}</pre>
              )}

              {previewThought && (
                <div className="authorx-paper-thought">
                  <h3>{t("author.studio.chapterEditor.authorThought")}</h3>
                  <pre className="authorx-paper-pre">{previewThought}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






















