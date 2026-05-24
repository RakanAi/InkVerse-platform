import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import { createAiServiceOrder, unlockChapter } from "../../Api/monetization.api";
import BookCover from "../../Shared/Books/BookCover/BookCover";
import { getBookCoverSrc } from "../../domain/books/book-cover";
import "./PageParts.css";
import ChapterComments from "./ChapterComments";
import ReaderDrawer from "./ReaderDrawer";
import { DEFAULTS, loadReaderPrefs, saveReaderPrefs } from "./ReaderSettings";

function formatDate(value, fallback = "Unknown upload date") {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() <= 1) {
    return fallback;
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isMeaningfulDate(value) {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 1;
}

function estimateReadingMinutes(wordCount) {
  const words = Number(wordCount ?? 0);
  if (!words) return 1;
  return Math.max(1, Math.round(words / 225));
}

function formatOriginLabel(value) {
  if (!value) return "Original";
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();
}

function splitChapterIntoParagraphs(content) {
  const normalized = String(content ?? "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      id: `p-${index + 1}`,
      text: paragraph,
    }));
}

function flattenComments(comments) {
  return comments.flatMap((comment) => [
    comment,
    ...flattenComments(Array.isArray(comment?.replies) ? comment.replies : []),
  ]);
}

export default function ContentSection() {
  const { t, i18n } = useTranslation();
  const { id, chapterId } = useParams();
  const navigate = useNavigate();

  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState(() => loadReaderPrefs());
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [commentsSnapshot, setCommentsSnapshot] = useState([]);
  const [activeParagraph, setActiveParagraph] = useState(null);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [readerAiError, setReaderAiError] = useState("");
  const [aiBusy, setAiBusy] = useState("");
  const [aiArtifact, setAiArtifact] = useState(null);
  const [readSessionId, setReadSessionId] = useState("");
  const [progressToast, setProgressToast] = useState(null);

  const lastSavedKeyRef = useRef(null);
  const activeReadSecondsRef = useRef(0);
  const maxScrollPercentRef = useRef(0);
  const completingReadRef = useRef(false);
  const completedReadRef = useRef(false);
  const fontOptions = useMemo(
    () => [
      { value: "system", label: t("reader.settings.fonts.system") },
      { value: "serif", label: t("reader.settings.fonts.serif") },
      { value: "sans", label: t("reader.settings.fonts.sans") },
      { value: "mono", label: t("reader.settings.fonts.mono") },
    ],
    [t],
  );
  const backgroundOptions = useMemo(
    () => [
      { value: "mist", label: t("reader.settings.backgrounds.mist") },
      { value: "paper", label: t("reader.settings.backgrounds.paper") },
    ],
    [t],
  );
  const browserTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  useEffect(() => saveReaderPrefs(prefs), [prefs]);

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data);
      } catch (err) {
        console.error("Failed to fetch book for chapter reader:", err);
        setBook(null);
      }
    };

    fetchBook();
  }, [id]);

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/chapters/${chapterId}`);
        setChapter(response.data);
      } catch (err) {
        console.error("Failed to fetch chapter:", err);
        setError("Failed to load chapter.");
        setChapter(null);
      } finally {
        setLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId]);

  useEffect(() => {
    const fetchChapterList = async () => {
      if (!id) return;

      try {
        const response = await api.get(`/chapters/book/${id}`);
        setChapters(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Failed to fetch chapter list:", err);
        setChapters([]);
      }
    };

    fetchChapterList();
  }, [id]);

  const refreshCommentsSnapshot = useCallback(async () => {
    if (!chapterId) return;

    try {
      const response = await api.get(`/chapters/${chapterId}/comments`, {
        params: { includeAll: true },
      });
      setCommentsSnapshot(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch paragraph comment summary:", err);
      setCommentsSnapshot([]);
    }
  }, [chapterId]);

  useEffect(() => {
    refreshCommentsSnapshot();
  }, [refreshCommentsSnapshot]);

  useEffect(() => {
    const saveProgress = async () => {
      if (!id || !chapterId || !chapter || chapter?.isLocked || chapter?.IsLocked) return;

      const saveKey = `${id}:${chapterId}`;
      if (lastSavedKeyRef.current === saveKey) return;
      lastSavedKeyRef.current = saveKey;

      try {
        setSaving(true);
        await api.post(`/books/${id}/reading-progress/${chapterId}`);

        try {
          await api.post(`/books/${id}/library/touch-last-read/${chapterId}`);
        } catch (innerError) {
          console.log("touch-last-read failed (ignored):", innerError);
        }
      } catch (err) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.error("Save progress failed:", err);
        }
      } finally {
        setSaving(false);
      }
    };

    saveProgress();
  }, [id, chapterId, chapter]);

  const sortedChapters = useMemo(
    () =>
      [...chapters].sort(
        (first, second) =>
          (first.chapterNumber ?? 0) - (second.chapterNumber ?? 0),
      ),
    [chapters],
  );

  const activeChapterListItem = useMemo(
    () =>
      sortedChapters.find((item) => String(item.id) === String(chapterId)) ??
      null,
    [chapterId, sortedChapters],
  );

  const { prevId, nextId, currentIndex } = useMemo(() => {
    if (!sortedChapters.length || !chapterId) {
      return { prevId: null, nextId: null, currentIndex: -1 };
    }

    const index = sortedChapters.findIndex(
      (item) => String(item.id) === String(chapterId),
    );

    if (index === -1) {
      return { prevId: null, nextId: null, currentIndex: -1 };
    }

    return {
      prevId: sortedChapters[index - 1]?.id ?? null,
      nextId: sortedChapters[index + 1]?.id ?? null,
      currentIndex: index,
    };
  }, [chapterId, sortedChapters]);

  const goTo = useCallback(
    (targetChapterId) => {
      if (!targetChapterId || !id) return;
      navigate(`/book/${id}/chapter/${targetChapterId}`);
      setActiveDrawer(null);
    },
    [id, navigate],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft" && prevId) goTo(prevId);
      if (event.key === "ArrowRight" && nextId) goTo(nextId);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goTo, nextId, prevId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setActiveParagraph(null);
  }, [chapterId]);

  useEffect(() => {
    const handleUnload = () => {
      if (id && chapterId) {
        navigator.sendBeacon?.(
          `${api.defaults.baseURL}/books/${id}/reading-progress/${chapterId}`,
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [id, chapterId]);

  const chapterDate = formatDate(
    isMeaningfulDate(chapter?.createdAt)
      ? chapter?.createdAt
      : activeChapterListItem?.createdAt,
  );
  const storyStartDate = formatDate(
    isMeaningfulDate(book?.createdAt)
      ? book?.createdAt
      : activeChapterListItem?.createdAt,
    "TBA",
  );
  const chapterPosition =
    currentIndex >= 0 ? `${currentIndex + 1} of ${sortedChapters.length}` : null;
  const readingMinutes = estimateReadingMinutes(chapter?.wordCount);
  const isOpeningChapter = Number(chapter?.chapterNumber ?? 0) <= 1;
  const activeTheme = backgroundOptions.some(
    (option) => option.value === prefs.backgroundTheme,
  )
    ? prefs.backgroundTheme
    : DEFAULTS.backgroundTheme;
  const readerParagraphs = useMemo(
    () => splitChapterIntoParagraphs(chapter?.content),
    [chapter?.content],
  );
  const isChapterLocked = Boolean(chapter?.isLocked ?? chapter?.IsLocked);
  const paragraphCommentCounts = useMemo(() => {
    const counts = new Map();

    flattenComments(commentsSnapshot).forEach((comment) => {
      const paragraphKey = comment?.paragraphId ?? comment?.ParagraphId;
      if (!paragraphKey) return;
      counts.set(paragraphKey, (counts.get(paragraphKey) ?? 0) + 1);
    });

    return counts;
  }, [commentsSnapshot]);

  useEffect(() => {
    activeReadSecondsRef.current = 0;
    maxScrollPercentRef.current = 0;
    completingReadRef.current = false;
    completedReadRef.current = false;
    setProgressToast(null);
    setReadSessionId("");

    if (!chapterId || !chapter || isChapterLocked) return undefined;

    let cancelled = false;

    const startReadSession = async () => {
      try {
        const response = await api.post(`/chapters/${chapterId}/read-session`, {
          timezone: browserTimezone,
        });
        if (!cancelled) {
          setReadSessionId(response.data?.sessionId || "");
        }
      } catch (err) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.log("read-session start skipped:", err?.response?.data || err.message);
        }
      }
    };

    startReadSession();

    return () => {
      cancelled = true;
    };
  }, [browserTimezone, chapter?.id, chapter?.Id, chapterId, isChapterLocked]);

  useEffect(() => {
    if (!readSessionId || !chapterId || isChapterLocked) return undefined;

    let cancelled = false;

    const getScrollPercent = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop || 0;
      const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
      return Math.max(0, Math.min(100, Math.round((scrollTop / maxScroll) * 100)));
    };

    const completeRead = async () => {
      if (
        cancelled ||
        completingReadRef.current ||
        completedReadRef.current ||
        maxScrollPercentRef.current < 60 ||
        activeReadSecondsRef.current < 30
      ) {
        return;
      }

      completingReadRef.current = true;

      try {
        const response = await api.post(`/chapters/${chapterId}/complete-read`, {
          sessionId: readSessionId,
          scrollPercent: maxScrollPercentRef.current,
          activeSeconds: activeReadSecondsRef.current,
          timezone: browserTimezone,
        });

        completedReadRef.current = true;
        const result = response.data || {};
        const unlocked = Array.isArray(result.unlockedAchievements)
          ? result.unlockedAchievements
          : [];
        const level = result.progress?.level ?? result.progress?.Level;

        if (!cancelled && (result.levelChanged || unlocked.length)) {
          setProgressToast({
            level,
            levelChanged: !!result.levelChanged,
            achievements: unlocked,
          });
        }
      } catch (err) {
        if (err?.response?.status !== 401 && err?.response?.status !== 403) {
          console.log("complete-read skipped:", err?.response?.data || err.message);
        }
      } finally {
        completingReadRef.current = false;
      }
    };

    const updateScroll = () => {
      maxScrollPercentRef.current = Math.max(maxScrollPercentRef.current, getScrollPercent());
      completeRead();
    };

    const tick = () => {
      if (!document.hidden && document.hasFocus()) {
        activeReadSecondsRef.current += 1;
        completeRead();
      }
    };

    updateScroll();
    const interval = window.setInterval(tick, 1000);
    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    document.addEventListener("visibilitychange", updateScroll);
    window.addEventListener("focus", updateScroll);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      document.removeEventListener("visibilitychange", updateScroll);
      window.removeEventListener("focus", updateScroll);
    };
  }, [browserTimezone, chapterId, isChapterLocked, readSessionId]);

  const openCommentsDrawer = useCallback((paragraph = null) => {
    setActiveParagraph(paragraph);
    setActiveDrawer("comments");
  }, []);

  const refetchChapter = useCallback(async () => {
    if (!chapterId) return;
    const response = await api.get(`/chapters/${chapterId}`);
    setChapter(response.data);
  }, [chapterId]);

  const handleUnlockChapter = async () => {
    setUnlocking(true);
    setUnlockError("");
    try {
      await unlockChapter(chapterId);
      await refetchChapter();
    } catch (err) {
      setUnlockError(err?.response?.data?.message || "Could not unlock chapter.");
    } finally {
      setUnlocking(false);
    }
  };

  const orderReaderAi = async (serviceKey) => {
    setAiBusy(serviceKey);
    setReaderAiError("");
    setAiArtifact(null);
    try {
      const order = await createAiServiceOrder({
        serviceKey,
        bookId: Number(id),
        chapterId: Number(chapterId),
        language: serviceKey === "translation" ? (i18n?.language || "en") : "audio",
      });
      setAiArtifact(order?.artifact ?? null);
      setActiveDrawer("reader-ai");
    } catch (err) {
      setReaderAiError(err?.response?.data?.message || "Could not run reader AI service.");
      setActiveDrawer("reader-ai");
    } finally {
      setAiBusy("");
    }
  };

  if (loading) {
    return (
      <div className="reader-page">
        <div className="reader-shell">
          <div className="reader-state">Loading chapter...</div>
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="reader-page">
        <div className="reader-shell">
          <div className="reader-state reader-state--error">
            {error || "Chapter not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`reader-page reader-page--${activeTheme}`}
    >
      <aside className="reader-side-tools" aria-label="Reader tools">
        <button
          className="reader-side-tools__btn"
          type="button"
          onClick={() => setActiveDrawer("chapters")}
          title={t("reader.chapters")}
        >
          <i className="bi bi-list-ul" />
          <span>{t("reader.chapters")}</span>
        </button>

        <button
          className="reader-side-tools__btn"
          type="button"
          onClick={() => openCommentsDrawer(null)}
          title={t("reader.comments.title")}
        >
          <i className="bi bi-chat-left-text" />
          <span>{t("reader.comments.title")}</span>
        </button>

        <button
          className="reader-side-tools__btn"
          type="button"
          onClick={() => setActiveDrawer("settings")}
          title={t("reader.settings.title")}
        >
          <i className="bi bi-sliders" />
          <span>{t("reader.settings.button")}</span>
        </button>

        {!isChapterLocked ? (
          <div className="reader-side-tools__ai" aria-label="Reader AI tools">
            <button
              className="reader-side-tools__btn reader-side-tools__btn--ai"
              type="button"
              onClick={() => orderReaderAi("translation")}
              disabled={Boolean(aiBusy)}
              title="AI translation"
            >
              <i className="bi bi-translate" />
              <span>{aiBusy === "translation" ? "Translating..." : "AI translation"}</span>
            </button>

            <button
              className="reader-side-tools__btn reader-side-tools__btn--ai"
              type="button"
              onClick={() => orderReaderAi("tts")}
              disabled={Boolean(aiBusy)}
              title="AI TTS"
            >
              <i className="bi bi-soundwave" />
              <span>{aiBusy === "tts" ? "Generating..." : "AI TTS"}</span>
            </button>
          </div>
        ) : null}
      </aside>

      {progressToast ? (
        <div className="reader-progress-toast" role="status">
          <button
            type="button"
            className="reader-progress-toast__close"
            onClick={() => setProgressToast(null)}
            aria-label="Dismiss progression update"
          >
            <i className="bi bi-x" />
          </button>
          <span className="reader-progress-toast__icon">
            <i className="bi bi-stars" />
          </span>
          <div>
            <strong>
              {progressToast.levelChanged
                ? `Level ${progressToast.level} reached`
                : "Achievement unlocked"}
            </strong>
            <p>
              {progressToast.achievements?.length
                ? progressToast.achievements.map((item) => item.title || item.Title).filter(Boolean).join(", ")
                : "Your reader progress was updated."}
            </p>
          </div>
        </div>
      ) : null}

      <div className="reader-shell">
        <div className="reader-topline">
          <Link className="reader-backlink" to={`/book/${id}`}>
            <i className="bi bi-arrow-left" />
            <span>{book?.title || t("reader.backToBook")}</span>
          </Link>

          <div className="reader-pills">
            <span className="reader-pill">
              {t("reader.chapterNumber", { number: chapter.chapterNumber ?? "?" })}
            </span>
            {chapter.arcName ? (
              <span className="reader-pill reader-pill--muted">{chapter.arcName}</span>
            ) : null}
            {chapterPosition ? (
              <span className="reader-pill reader-pill--muted">{chapterPosition}</span>
            ) : null}
          </div>
        </div>

        {isOpeningChapter ? (
          <section className="reader-story-intro">
            <div className="reader-story-intro__frame">
              <div className="reader-story-intro__cover">
                <BookCover
                  variant="fill"
                  src={getBookCoverSrc(book)}
                  alt={book?.title || t("bookPage.cover.alt")}
                  title={book?.title || t("reader.untitledStory")}
                />
              </div>

              <span className="reader-kicker">{t("reader.storySpotlight")}</span>
              <h1 className="reader-story-intro__title">
                {book?.title || t("reader.untitledStory")}
              </h1>
              <p className="reader-story-intro__author">
                {book?.authorName
                  ? t("reader.byAuthor", { author: book.authorName })
                  : t("reader.byInkVerse")}
              </p>
              <p className="reader-story-intro__summary">
                {book?.description ||
                  t("reader.openingSummary")}
              </p>

              <div className="reader-story-intro__facts">
                <div className="reader-story-intro__fact">
                  <span>{t("reader.facts.type")}</span>
                  <strong>{book?.verseType || t("reader.original")}</strong>
                </div>
                <div className="reader-story-intro__fact">
                  <span>{t("reader.facts.started")}</span>
                  <strong>{storyStartDate}</strong>
                </div>
                <div className="reader-story-intro__fact">
                  <span>{t("reader.facts.status")}</span>
                  <strong>{book?.status || t("reader.ongoing")}</strong>
                </div>
                <div className="reader-story-intro__fact">
                  <span>{t("reader.facts.chapters")}</span>
                  <strong>{sortedChapters.length || book?.chaptersCount || 0}</strong>
                </div>
              </div>

              <p className="reader-story-intro__footnote">
                {t("reader.openingFootnote")}
              </p>
            </div>
          </section>
        ) : null}

        <article
          className={`reader-article ${isOpeningChapter ? "reader-article--after-intro" : ""}`}
        >
          <header className="reader-chapter-head">
            <span className="reader-kicker">
              {book?.title
                ? t("reader.readingTitle", { title: book.title })
                : t("reader.chapterReader")}
            </span>

            <h2 className="reader-title">{chapter.title || t("reader.untitledChapter")}</h2>

            <p className="reader-subtitle">
              {book?.authorName
                ? `${t("reader.byAuthor", { author: book.authorName })}. ${
                    isOpeningChapter
                      ? t("reader.openingSubtitle")
                      : t("reader.normalSubtitle")
                  }`
                : isOpeningChapter
                  ? t("reader.openingSubtitle")
                  : t("reader.normalSubtitle")}
            </p>

            <div className="reader-meta">
              {chapter.arcName ? (
                <>
                  <span>{chapter.arcName}</span>
                  <span className="reader-divider">•</span>
                </>
              ) : null}
              <span>{chapterDate}</span>
              <span className="reader-divider">•</span>
              <span>{t("reader.wordCount", { count: Number(chapter.wordCount ?? 0).toLocaleString() })}</span>
              <span className="reader-divider">•</span>
              <span>{t("reader.readTime", { count: readingMinutes })}</span>
              {book?.originType ? (
                <>
                  <span className="reader-divider">•</span>
                  <span>{formatOriginLabel(book.originType)}</span>
                </>
              ) : null}
              {saving ? (
                <>
                  <span className="reader-divider">•</span>
                  <span>{t("reader.savingProgress")}</span>
                </>
              ) : null}
            </div>
          </header>

          {unlockError ? (
            <div className="reader-monetization-alert">{unlockError}</div>
          ) : null}

          {isChapterLocked ? (
            <section className="reader-locked-panel">
              <span className="reader-kicker">Paid chapter</span>
              <h3>Unlock this chapter for {chapter.priceCoins ?? chapter.PriceCoins ?? 5} coins.</h3>
              <p>{chapter.teaser || chapter.Teaser || "The author made this chapter paid. Unlock it to keep reading."}</p>
              <button
                type="button"
                className="reader-navbtn"
                onClick={handleUnlockChapter}
                disabled={unlocking}
              >
                <span>{unlocking ? "Unlocking..." : "Unlock chapter"}</span>
                <i className="bi bi-unlock" />
              </button>
            </section>
          ) : (
            <>
              <div
                className={`reader-content font-${prefs.font}`}
                style={{ fontSize: prefs.fontSize, lineHeight: prefs.lineHeight }}
              >
                {readerParagraphs.length ? (
              <div className="reader-paragraphs">
                {readerParagraphs.map((paragraph) => {
                  const commentCount =
                    paragraphCommentCounts.get(paragraph.id) ?? 0;
                  const isActiveParagraph =
                    activeParagraph?.id === paragraph.id &&
                    activeDrawer === "comments";
                  const paragraphCommentLabel =
                    commentCount > 0
                      ? t("reader.openCommentsForParagraph", {
                          count: commentCount,
                        })
                      : t("reader.commentOnParagraph");

                  return (
                    <div
                      key={paragraph.id}
                      className={`reader-paragraph-block ${
                        isActiveParagraph ? "is-active" : ""
                      }`}
                    >
                      <p className="reader-paragraph-text">
                        <span>{paragraph.text}</span>{" "}
                        <button
                          className={`reader-paragraph-comment-btn ${
                            commentCount > 0 ? "has-comments" : ""
                          }`}
                          type="button"
                          onClick={() => openCommentsDrawer(paragraph)}
                          aria-label={paragraphCommentLabel}
                          title={paragraphCommentLabel}
                        >
                          <i className="bi bi-chat-square-text" aria-hidden="true" />
                          {commentCount > 0 ? (
                            <span className="reader-paragraph-comment-btn__count">
                              {commentCount}
                            </span>
                          ) : (
                            <span className="reader-paragraph-comment-btn__label">
                              {t("reader.comment")}
                            </span>
                          )}
                        </button>
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <pre className="reader-content-pre">{String(chapter.content ?? "")}</pre>
            )}
              </div>
            </>
          )}
        </article>

        <section className="reader-footer-tools">
          <div className="reader-chapter-select">
            <label className="reader-label" htmlFor="reader-chapter-jump">
              {t("reader.jumpToChapter")}
            </label>
            <select
              id="reader-chapter-jump"
              className="reader-select"
              value={String(chapterId ?? "")}
              onChange={(event) => goTo(event.target.value)}
            >
              {sortedChapters.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${item.chapterNumber ?? "?"}. ${item.title ?? "Untitled"}`}
                </option>
              ))}
            </select>
          </div>

          <div className="reader-navrow">
            <button
              className="reader-navbtn"
              disabled={!prevId}
              onClick={() => goTo(prevId)}
              type="button"
            >
              <i className="bi bi-arrow-left" />
              <span>{t("reader.previous")}</span>
            </button>

            <button
              className="reader-navbtn reader-navbtn--ghost"
              onClick={() => navigate(`/book/${id}`)}
              type="button"
            >
              <i className="bi bi-house-door" />
              <span>{t("reader.bookPage")}</span>
            </button>

            <button
              className="reader-navbtn"
              disabled={!nextId}
              onClick={() => goTo(nextId)}
              type="button"
            >
              <span>{t("reader.next")}</span>
              <i className="bi bi-arrow-right" />
            </button>
          </div>
        </section>
      </div>

      <div className="reader-mobile-bar">
        <button
          className="reader-mobile-bar__btn"
          type="button"
          onClick={() => setActiveDrawer("chapters")}
        >
          <i className="bi bi-list-ul" />
          <span>{t("reader.chapters")}</span>
        </button>

        <button
          className="reader-mobile-bar__btn"
          type="button"
          onClick={() => openCommentsDrawer(null)}
        >
          <i className="bi bi-chat-left-text" />
          <span>{t("reader.comments.title")}</span>
        </button>

        <button
          className="reader-mobile-bar__btn"
          type="button"
          onClick={() => setActiveDrawer("settings")}
        >
          <i className="bi bi-sliders" />
          <span>{t("reader.settings.button")}</span>
        </button>

        {!isChapterLocked ? (
          <>
            <button
              className="reader-mobile-bar__btn"
              type="button"
              onClick={() => orderReaderAi("translation")}
              disabled={Boolean(aiBusy)}
            >
              <i className="bi bi-translate" />
              <span>{aiBusy === "translation" ? "Translating..." : "Translate"}</span>
            </button>

            <button
              className="reader-mobile-bar__btn"
              type="button"
              onClick={() => orderReaderAi("tts")}
              disabled={Boolean(aiBusy)}
            >
              <i className="bi bi-soundwave" />
              <span>{aiBusy === "tts" ? "Generating..." : "TTS"}</span>
            </button>
          </>
        ) : null}
      </div>

      <ReaderDrawer
        open={activeDrawer === "chapters"}
        title={t("reader.chapters")}
        theme={activeTheme}
        onClose={() => setActiveDrawer(null)}
      >
        <div className="reader-drawer-copy">
          <p>{t("reader.drawerCopy")}</p>
        </div>

        <div className="reader-chapter-list">
          {sortedChapters.length ? (
            sortedChapters.map((item) => {
              const isActive = String(item.id) === String(chapterId);
              return (
                <button
                  key={item.id}
                  className={`reader-chapter-card ${isActive ? "is-active" : ""}`}
                  type="button"
                  onClick={() => goTo(item.id)}
                >
                  <div className="reader-chapter-card__meta">
                    <span>{t("reader.chapterNumber", { number: item.chapterNumber ?? "?" })}</span>
                    {item.arcName ? <span>{item.arcName}</span> : null}
                  </div>
                  <strong>{item.title || t("reader.untitledChapter")}</strong>
                </button>
              );
            })
          ) : (
            <div className="reader-empty">{t("reader.noChapters")}</div>
          )}
        </div>
      </ReaderDrawer>

      <ReaderDrawer
        open={activeDrawer === "comments"}
        title={activeParagraph ? t("reader.paragraphComments") : t("reader.comments.title")}
        size="lg"
        theme={activeTheme}
        onClose={() => setActiveDrawer(null)}
      >
        <ChapterComments
          chapterId={chapterId}
          surface="drawer"
          theme={activeTheme}
          paragraphId={activeParagraph?.id ?? null}
          paragraphText={activeParagraph?.text ?? ""}
          onClearParagraphContext={() => setActiveParagraph(null)}
          onCommentsChanged={refreshCommentsSnapshot}
        />
      </ReaderDrawer>

      <ReaderDrawer
        open={activeDrawer === "settings"}
        title={t("reader.settings.title")}
        theme={activeTheme}
        onClose={() => setActiveDrawer(null)}
      >
        <ReaderSettingsPanel
          value={prefs}
          onChange={setPrefs}
          fontOptions={fontOptions}
          backgroundOptions={backgroundOptions}
        />
      </ReaderDrawer>

      <ReaderDrawer
        open={activeDrawer === "reader-ai"}
        title="Reader AI"
        theme={activeTheme}
        onClose={() => setActiveDrawer(null)}
      >
        <div className="reader-ai-result">
          <p className="reader-drawer-copy">
            Reader AI results appear here after a translation or TTS request finishes.
          </p>

          {readerAiError ? (
            <div className="reader-monetization-alert">{readerAiError}</div>
          ) : null}

          {aiBusy ? (
            <div className="reader-state">
              {aiBusy === "translation" ? "Translating chapter..." : "Generating narration..."}
            </div>
          ) : null}

          {aiArtifact ? (
            <section className="reader-ai-artifact">
              <strong>{aiArtifact.serviceKey === "tts" ? "TTS artifact" : "Translation"}</strong>
              <pre>{aiArtifact.content}</pre>
            </section>
          ) : null}
        </div>
      </ReaderDrawer>
    </div>
  );
}

function ReaderSettingsPanel({
  value,
  onChange,
  fontOptions,
  backgroundOptions,
}) {
  const { t } = useTranslation();
  const set = (patch) => onChange?.({ ...value, ...patch });

  return (
    <div className="reader-settings">
      <div className="reader-setting">
        <div className="reader-setting__top">
          <span>{t("reader.settings.textSize")}</span>
          <strong>{value.fontSize}px</strong>
        </div>
        <input
          className="reader-range"
          type="range"
          min="14"
          max="28"
          value={value.fontSize}
          onChange={(event) => set({ fontSize: Number(event.target.value) })}
        />
      </div>

      <div className="reader-setting">
        <div className="reader-setting__top">
          <span>{t("reader.settings.lineSpacing")}</span>
          <strong>{value.lineHeight.toFixed(2)}</strong>
        </div>
        <input
          className="reader-range"
          type="range"
          min="1.4"
          max="2.4"
          step="0.05"
          value={value.lineHeight}
          onChange={(event) => set({ lineHeight: Number(event.target.value) })}
        />
      </div>

      <div className="reader-setting">
        <label className="reader-label" htmlFor="reader-font-select">
          {t("reader.settings.font")}
        </label>
        <select
          id="reader-font-select"
          className="reader-select"
          value={value.font}
          onChange={(event) => set({ font: event.target.value })}
        >
          {fontOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="reader-setting">
        <label className="reader-label" htmlFor="reader-background-select">
          {t("reader.settings.background")}
        </label>
        <select
          id="reader-background-select"
          className="reader-select"
          value={value.backgroundTheme}
          onChange={(event) => set({ backgroundTheme: event.target.value })}
        >
          {backgroundOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        className="reader-reset-btn"
        type="button"
        onClick={() => onChange?.(DEFAULTS)}
      >
        {t("reader.settings.reset")}
      </button>
    </div>
  );
}
