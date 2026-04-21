import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBold,
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
import { createChapter, fetchBookArcs, fetchBookById } from "./authorApi";

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
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const draftIdFromQuery = searchParams.get("draftId");

  const [book, setBook] = useState(null);
  const [arcs, setArcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [arcId, setArcId] = useState("");
  const [authorThought, setAuthorThought] = useState("");

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

  const editorRef = useRef(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!bookId) return;

      setLoading(true);
      setError("");
      try {
        const [bookRes, arcsRes] = await Promise.allSettled([
          fetchBookById(bookId),
          fetchBookArcs(bookId),
        ]);

        if (!alive) return;
        if (bookRes.status !== "fulfilled") {
          throw bookRes.reason;
        }

        setBook(bookRes.value ?? null);
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
      } catch (e) {
        if (!alive) return;
        setError(e?.response?.data?.message || "Could not load chapter editor.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [bookId, draftIdFromQuery, setSearchParams]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== contentHtml) {
      editorRef.current.innerHTML = contentHtml;
    }
  }, [contentHtml]);

  const contentPlainText = useMemo(() => htmlToPlainText(contentHtml), [contentHtml]);
  const chapterWordCount = useMemo(() => countWords(contentPlainText), [contentPlainText]);
  const arcOptions = useMemo(
    () => [
      { value: "", label: "No Arc" },
      ...arcs.map((arc) => ({
        value: String(arc?.id ?? arc?.ID ?? ""),
        label: String(arc?.name ?? arc?.Name ?? "Untitled Arc"),
      })),
    ],
    [arcs],
  );

  const wishTemplates = useMemo(
    () => [
      {
        id: "gift",
        title: "Wish to gift",
        message: "Your gift is the motivation for my creation. Give me more motivation!",
        icon: FiGift,
        color: "#10b981",
      },
      {
        id: "vote",
        title: "Wish to vote",
        message: "Creation is hard, cheer me up!",
        icon: FiThumbsUp,
        color: "#4f46e5",
      },
      {
        id: "tag",
        title: "Wish to tag",
        message: "I tagged this book, come and support me with a thumbs up!",
        icon: FiTag,
        color: "#e11d48",
      },
      {
        id: "like",
        title: "Wish to like",
        message: "Like it ? Add to library!",
        icon: FiHeart,
        color: "#f97316",
      },
      {
        id: "comment",
        title: "Wish to comment",
        message: "Have some idea about my story? Comment it and let me know.",
        icon: FiMessageCircle,
        color: "#3b82f6",
      },
    ],
    [],
  );

  const recommendationWorks = useMemo(
    () => [
      {
        id: String(book?.id ?? bookId ?? "current-book"),
        title: String(book?.title || "Current Book"),
        author: String(book?.authorName || book?.author || "Me"),
        cover: book?.coverImageUrl || book?.coverUrl || "",
      },
    ],
    [book, bookId],
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
    const recommendation = `Book recommendation: ${work.title}`;
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
        savedAt: new Date().toISOString(),
      });

      if (!currentDraftId) {
        setCurrentDraftId(draftId);
        setSearchParams({ draftId }, { replace: true });
      }

      setStatusMsg("Draft saved.");
    } catch {
      setActionError("Failed to save draft on this browser.");
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
      setActionError("Chapter title is required.");
      return;
    }

    if (!cleanContent) {
      setActionError("Chapter content is required.");
      return;
    }

    const finalContent = cleanThought
      ? `${editorText}${editorText.endsWith("\n") ? "" : "\n"}\nAuthor Thought\n${cleanThought}`
      : editorText;

    setPublishing(true);
    try {
      await createChapter({
        title: cleanTitle,
        content: finalContent,
        bookId: Number(bookId),
        arcId: arcId ? Number(arcId) : null,
      });

      if (currentDraftId) {
        removeDraft(bookId, currentDraftId);
      }
      createBlankDraft(bookId);
      navigate(`/author/workspace/${bookId}`);
    } catch (e) {
      setActionError(e?.response?.data?.message || "Failed to publish chapter.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingState text="Loading chapter editor..." />;
  if (error) return <ErrorState title="Editor Unavailable" subtitle={error} />;

  const previewContent = String(editorRef.current?.innerText ?? contentPlainText).replace(
    /\r\n?/g,
    "\n",
  );
  const previewThought = authorThought.trim();

  return (<div className="authorx-chapter-create-page ">
      <section className="authorx-detail-head">
        <div className="authorx-detail-head-left">
          <button
            type="button"
            className="authorx-back-btn authorx-chapter-back-btn border-0 bg-none"
            onClick={() => navigate(`/author/workspace/${bookId}`)}
            aria-label="Back to book"
            title="Back"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="authorx-chapter-headline">{book?.title ? `${book.title} / New Chapter` : "Create Chapter"}</div>
        </div>

        <div className="authorx-chapter-top-actions w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            style={{height:"auto"}}
            // className="d-flex align-items-center gap-2"
            onClick={saveDraft}
            disabled={savingDraft || publishing}
          >
            <FiSave size={16} /> 
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="d-flex align-items-center gap-2"
            onClick={publishChapter}
            disabled={publishing}
          >
            <FiUpload size={16} /> {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </section>

      <Surface className="authorx-chapter-editor-shell" style={{padding:"0px"}}>
        <div className="authorx-chapter-meta-row d-flex">
          <div className="authorx-chapter-arc-block">
            <label htmlFor="chapter-arc" className="authorx-chapter-label">
              Volume / Arc
            </label>
            <DropdownSelect
              className="authorx-arc-dropdown"
              value={arcId}
              onChange={(nextValue) => setArcId(String(nextValue ?? ""))}
              options={arcOptions}
              placeholder="No Arc"
            />
          </div>

          {/* <div className="authorx-chapter-format-block">
          </div> */}

          <div className="authorx-chapter-right-meta pe-0">
            <div className="authorx-word-count text-end">{chapterWordCount.toLocaleString()} words</div>
            <button
              type="button"
              className="authorx-eye-btn border-start rounded-0 text-center w-auto"
              style={{height:"auto"}}

              onClick={() => setIsPreviewOpen(true)}
              title="Preview chapter"
              aria-label="Preview chapter"
            >
              <FiEye size={18} />
            </button>
          </div>
        </div>

        <div className="authorx-chapter-title-wrap">
          <input
            type="text"
            className="authorx-chapter-title-input"
            placeholder="Title Here"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="authorx-editor-wrap">
          <div className="authorx-editor-tools" aria-label="Editor toolbar">
            <button
              type="button"
              className="authorx-editor-tool-btn"
              onClick={() => applyCommand("bold")}
              title="Bold"
            >
              <FiBold size={16} />
            </button>
            <button
              type="button"
              className="authorx-editor-tool-btn"
              onClick={() => applyCommand("italic")}
              title="Italic"
            >
              <FiItalic size={16} />
            </button>
            <button
              type="button"
              className="authorx-editor-tool-btn"
              onClick={openThoughtDialog}
              title="Author thought"
            >
              <FiMessageSquare size={16} />
            </button>
            <button
              type="button"
              className="authorx-editor-tool-btn"
              onClick={() => applyCommand("undo")}
              title="Undo"
            >
              <FiRotateCcw size={16} />
            </button>
            <button
              type="button"
              className="authorx-editor-tool-btn"
              onClick={() => applyCommand("redo")}
              title="Redo"
            >
              <FiRotateCw size={16} />
            </button>
          </div>

          <div
            ref={editorRef}
            className="authorx-editor-canvas"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setContentHtml(e.currentTarget.innerHTML)}
            data-placeholder="Start writing your chapter content..."
          />
        </div>

        <div className="authorx-thought-row">
          <button
            type="button"
            className="authorx-add-thought-btn"
            onClick={openThoughtDialog}
          >
            + Add Author's Thought
          </button>
        </div>

        {(statusMsg || actionError) && (
          <div className={`authorx-editor-status ${actionError ? "error" : ""}`}>
            {actionError || statusMsg}
          </div>
        )}
      </Surface>

            {isThoughtDialogOpen && (
        <div className="authorx-modal-backdrop" onClick={closeThoughtDialog}>
          <div className="authorx-modal authorx-thought-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="authorx-thought-head">
              <h2>Add Author's Thought</h2>
              <button
                type="button"
                className="authorx-thought-close"
                onClick={closeThoughtDialog}
                aria-label="Close thought dialog"
              >
                <FiX size={18} />
              </button>
            </div>

            <textarea
              className="authorx-thought-textarea"
              rows={10}
              value={thoughtDraft}
              onChange={(e) => setThoughtDraft(e.target.value)}
              placeholder="Leave author's thought here..."
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
                  <span>Add Book Recommendation</span>
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
                    placeholder="Search for all books"
                  />
                </label>

                <h4>Or choose from my works</h4>
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
                    Cancel
                  </button>
                  <button type="button" className="authorx-thought-submit" onClick={() => setIsRecommendationOpen(false)}>
                    Confirm
                  </button>
                </div>
              </div>
            )}

            <div className="authorx-thought-footer">
              <div className="authorx-thought-tools">
                <button
                  type="button"
                  className="authorx-thought-tool-btn"
                  aria-label="Wish templates"
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
                  aria-label="Add recommendation"
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
                  Cancel
                </button>
                <button type="button" className="authorx-thought-submit" onClick={submitThoughtDialog}>
                  Submit
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
              <h2>{title.trim() || "Untitled Chapter"}</h2>
              <div>{chapterWordCount.toLocaleString()} words</div>
            </div>

            <div className="authorx-paper-content">
              {!previewContent.trim() ? (
                <p>Chapter content preview will appear here.</p>
              ) : (
                <pre className="authorx-paper-pre">{previewContent}</pre>
              )}

              {previewThought && (
                <div className="authorx-paper-thought">
                  <h3>Author Thought</h3>
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





































