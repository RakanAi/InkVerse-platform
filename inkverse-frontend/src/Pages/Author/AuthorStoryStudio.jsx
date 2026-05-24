import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiChevronDown,
  FiCheckCircle,
  FiCpu,
  FiFileText,
  FiLayers,
  FiPlay,
  FiZap,
} from "react-icons/fi";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import { fetchBookChapters, fetchMyBooks } from "./authorApi";
import {
  createAiServiceOrder,
  createProofreadingDraft,
  fetchBookNotebook,
  quoteAiService,
} from "../../Api/monetization.api";
import "../../features/monetization/monetization.css";

const TOOL_DEFS = [
  { key: "plot-planner", labelKey: "plotPlanner.label", textKey: "plotPlanner.text" },
  { key: "next-plot", labelKey: "nextPlot.label", textKey: "nextPlot.text" },
  { key: "character-analysis", labelKey: "characterAnalysis.label", textKey: "characterAnalysis.text" },
  { key: "continuity-check", labelKey: "continuityCheck.label", textKey: "continuityCheck.text" },
  { key: "worldbuilding-notes", labelKey: "worldbuildingNotes.label", textKey: "worldbuildingNotes.text" },
];

function getId(item) {
  return item?.id ?? item?.ID;
}

function getTitle(item) {
  return item?.title ?? item?.Title ?? "Untitled";
}

function getChapterNumber(chapter) {
  return chapter?.chapterNumber ?? chapter?.ChapterNumber ?? "?";
}

function getEntryTitle(entry) {
  return entry?.title ?? entry?.Title ?? "Notebook entry";
}

function getEntryType(entry) {
  return entry?.entryType ?? entry?.EntryType ?? "Story note";
}

function getEntryContent(entry) {
  return entry?.content ?? entry?.Content ?? "";
}

function getEntryCreatedAt(entry) {
  const value = entry?.createdAt ?? entry?.CreatedAt;
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

export default function AuthorStoryStudio() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState("");
  const [chapters, setChapters] = useState([]);
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [notebook, setNotebook] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [activeTool, setActiveTool] = useState(TOOL_DEFS[0].key);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [draftResult, setDraftResult] = useState(null);
  const [toolMenuOpen, setToolMenuOpen] = useState(false);

  const selectedBook = useMemo(
    () => books.find((book) => String(getId(book)) === String(bookId)) ?? null,
    [books, bookId],
  );
  const selectedChapters = useMemo(
    () => chapters.filter((chapter) => selectedChapterIds.includes(getId(chapter))),
    [chapters, selectedChapterIds],
  );
  const tools = useMemo(
    () => TOOL_DEFS.map((tool) => ({
      ...tool,
      label: t(`author.studio.storyStudio.toolsData.${tool.labelKey}`),
      text: t(`author.studio.storyStudio.toolsData.${tool.textKey}`),
    })),
    [t],
  );

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyBooks();
      const list = Array.isArray(data) ? data : [];
      setBooks(list);
      const firstId = getId(list[0]);
      if (firstId) setBookId(String(firstId));
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.storyStudio.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    if (!bookId) return;
    let alive = true;
    const loadBookStudio = async () => {
      setError("");
      try {
        const [chapterData, notebookData] = await Promise.all([
          fetchBookChapters(bookId),
          fetchBookNotebook(bookId),
        ]);
        if (!alive) return;
        setChapters(Array.isArray(chapterData) ? chapterData : []);
        setNotebook(Array.isArray(notebookData) ? notebookData : []);
        setSelectedChapterIds([]);
        setQuote(null);
      } catch (err) {
        if (alive) setError(err?.response?.data?.message || t("author.studio.storyStudio.notebookError"));
      }
    };
    loadBookStudio();
    return () => {
      alive = false;
    };
  }, [bookId]);

  const selectedTool = tools.find((tool) => tool.key === activeTool) ?? tools[0];
  const promptText = prompt.trim();
  const selectedChapterCount = selectedChapters.length;
  const hasSelectedAllChapters = chapters.length > 0 && selectedChapterCount === chapters.length;
  const selectedScopeLabel = selectedChapterCount
    ? t("author.studio.storyStudio.selectedChaptersSummary", {
        defaultValue: "{{selected}} of {{total}} chapters selected",
        selected: selectedChapterCount,
        total: chapters.length,
      })
    : t("author.studio.storyStudio.wholeBookSummary", {
        defaultValue: "No chapters selected. The tool will use book-level context.",
      });

  const selectAllChapters = () => {
    setSelectedChapterIds(chapters.map((chapter) => getId(chapter)).filter(Boolean));
    setQuote(null);
  };

  const clearChapters = () => {
    setSelectedChapterIds([]);
    setQuote(null);
  };

  const selectTool = (toolKey) => {
    setActiveTool(toolKey);
    setQuote(null);
    setToolMenuOpen(false);
  };

  const getQuote = async () => {
    if (!bookId) return;
    setBusy("quote");
    setError("");
    try {
      const data = await quoteAiService({
        serviceKey: activeTool,
        bookId: Number(bookId),
        selectedChapterIds: selectedChapterIds.map(Number),
        prompt,
      });
      setQuote(data);
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.storyStudio.quoteError"));
    } finally {
      setBusy("");
    }
  };

  const runTool = async () => {
    if (!bookId) return;
    setBusy("run");
    setError("");
    try {
      const order = await createAiServiceOrder({
        serviceKey: activeTool,
        bookId: Number(bookId),
        selectedChapterIds: selectedChapterIds.map(Number),
        prompt,
      });
      if (order?.notebookEntry) {
        setNotebook((current) => [order.notebookEntry, ...current]);
      } else {
        const latest = await fetchBookNotebook(bookId);
        setNotebook(Array.isArray(latest) ? latest : []);
      }
      setQuote(null);
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.storyStudio.runError"));
    } finally {
      setBusy("");
    }
  };

  const runProofreading = async () => {
    const chapterId = selectedChapterIds[0];
    if (!chapterId) {
      setError(t("author.studio.storyStudio.chooseChapter"));
      return;
    }
    setBusy("proofreading");
    setError("");
    setDraftResult(null);
    try {
      const draft = await createProofreadingDraft(Number(chapterId));
      setDraftResult(draft);
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.storyStudio.proofreadError"));
    } finally {
      setBusy("");
    }
  };

  const toggleChapter = (chapterId) => {
    setSelectedChapterIds((current) =>
      current.includes(chapterId)
        ? current.filter((id) => id !== chapterId)
        : [...current, chapterId],
    );
    setQuote(null);
  };

  if (loading) return <LoadingState text={t("author.studio.storyStudio.loading")} />;
  if (error && !books.length) return <ErrorState title={t("author.studio.storyStudio.unavailable")} subtitle={error} onRetry={loadBooks} />;

  return (
    <div className="authorx-page story-studio-page">
      <section className="story-studio-overview">
        <div className="story-studio-overview__copy">
          <span className="author-studio-eyebrow">{t("author.studio.storyStudio.eyebrow")}</span>
          <h1>{t("author.studio.storyStudio.clearTitle", { defaultValue: "Story Studio" })}</h1>
          <p>
            {t("author.studio.storyStudio.clearSubtitle", {
              defaultValue:
                "Pick the exact book context, choose one planning tool, then save the result as a private notebook note.",
            })}
          </p>
        </div>

        <div className="story-studio-steps" aria-label={t("author.studio.storyStudio.workflow", { defaultValue: "Story Studio workflow" })}>
          <div className="story-studio-step is-active">
            <span>1</span>
            <strong>{t("author.studio.storyStudio.stepContext", { defaultValue: "Context" })}</strong>
            <small>{selectedBook ? getTitle(selectedBook) : t("author.studio.storyStudio.chooseBookShort", { defaultValue: "Choose a book" })}</small>
          </div>
          <div
            className={`story-studio-step story-studio-tool-step ${toolMenuOpen ? "is-open" : ""}`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setToolMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              className="story-studio-tool-trigger"
              aria-haspopup="listbox"
              aria-expanded={toolMenuOpen}
              onClick={() => setToolMenuOpen((open) => !open)}
            >
              <span className="story-studio-step__number">2</span>
              <span className="story-studio-tool-trigger__copy">
                <strong>{t("author.studio.storyStudio.stepTool", { defaultValue: "Tool" })}</strong>
                <small>{selectedTool?.label}</small>
              </span>
              <FiChevronDown className="story-studio-tool-trigger__chevron" size={18} />
            </button>

            <div className="story-studio-tool-menu" role="listbox" aria-label={t("author.studio.storyStudio.tools")}>
              <div className="story-studio-tool-menu__head">
                <strong>{t("author.studio.storyStudio.chooseTool", { defaultValue: "Choose a tool" })}</strong>
                <span>{t("author.studio.storyStudio.toolHelp", { defaultValue: "One focused output at a time." })}</span>
              </div>
              {tools.map((tool) => (
                <button
                  type="button"
                  key={tool.key}
                  role="option"
                  aria-selected={tool.key === activeTool}
                  className={`story-studio-tool-option ${tool.key === activeTool ? "is-selected" : ""}`}
                  onClick={() => selectTool(tool.key)}
                >
                  <span className="story-studio-tool-option__icon">
                    <FiCpu size={15} />
                  </span>
                  <span className="story-studio-tool-option__copy">
                    <strong>{tool.label}</strong>
                    <small>{tool.text}</small>
                  </span>
                  {tool.key === activeTool ? <FiCheckCircle className="story-studio-tool-option__check" size={17} /> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="story-studio-step">
            <span>3</span>
            <strong>{t("author.studio.storyStudio.stepNotebook", { defaultValue: "Notes" })}</strong>
            <small>
              {t("author.studio.storyStudio.noteCount", {
                defaultValue: "{{count}} saved notes",
                count: notebook.length,
              })}
            </small>
          </div>
        </div>
      </section>

      {error ? <div className="authorx-form-error mb-3">{error}</div> : null}

      <div className="story-studio-layout">
        <Surface className="authorx-panel story-studio-panel story-studio-context">
          <div className="story-studio-panel-head">
            <span className="story-studio-number">1</span>
            <div>
              <span className="author-studio-section-heading__eyebrow">{t("author.studio.storyStudio.setup")}</span>
              <h2>{t("author.studio.storyStudio.chooseContext")}</h2>
              <p>{t("author.studio.storyStudio.contextDescription")}</p>
            </div>
          </div>

          <label className="authorx-field-label" htmlFor="story-studio-book">{t("author.studio.storyStudio.book")}</label>
          <select id="story-studio-book" className="authorx-native-select" value={bookId} onChange={(event) => setBookId(event.target.value)}>
            {books.map((book) => (
              <option key={getId(book)} value={getId(book)}>
                {getTitle(book)}
              </option>
            ))}
          </select>

          {selectedBook ? (
            <div className="story-studio-book-card">
              <span className="story-studio-book-card__icon">
                <FiBookOpen size={18} />
              </span>
              <div>
                <strong>{getTitle(selectedBook)}</strong>
                <span>{selectedScopeLabel}</span>
              </div>
            </div>
          ) : null}

          <div className="story-studio-field-row mt-3">
            <div>
              <label className="authorx-field-label">{t("author.studio.storyStudio.chapters", { defaultValue: "Chapters" })}</label>
              <p>{t("author.studio.storyStudio.chapterHelp", { defaultValue: "Select chapters only when the tool needs specific text." })}</p>
            </div>
            <div className="story-studio-small-actions">
              <button type="button" onClick={selectAllChapters} disabled={!chapters.length || hasSelectedAllChapters}>
                {t("author.studio.storyStudio.selectAll", { defaultValue: "Select all" })}
              </button>
              <button type="button" onClick={clearChapters} disabled={!selectedChapterCount}>
                {t("author.studio.storyStudio.clearSelection", { defaultValue: "Clear" })}
              </button>
            </div>
          </div>

          <div className="authorx-mini-list story-studio-chapter-list">
            {chapters.length ? chapters.map((chapter) => {
              const id = getId(chapter);
              return (
                <label key={id} className="authorx-check-row">
                  <input
                    type="checkbox"
                    checked={selectedChapterIds.includes(id)}
                    onChange={() => toggleChapter(id)}
                  />
                  <span>
                    <strong>#{getChapterNumber(chapter)}</strong>
                    {getTitle(chapter)}
                  </span>
                </label>
              );
            }) : <p className="monetization-muted">{t("author.studio.storyStudio.noChapters")}</p>}
          </div>

          <label className="authorx-field-label mt-3">{t("author.studio.storyStudio.promptLabel")}</label>
          <textarea
            className="authorx-textarea story-studio-prompt"
            rows={5}
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setQuote(null);
            }}
            placeholder={t("author.studio.storyStudio.promptPlaceholder")}
          />
        </Surface>

        <div className="story-studio-action-column">
          <Surface className="authorx-panel story-studio-panel story-studio-run">
            <div className="story-studio-run__status">
              <span className={selectedBook ? "is-ready" : ""}>
                {selectedBook
                  ? t("author.studio.storyStudio.ready", { defaultValue: "Ready" })
                  : t("author.studio.storyStudio.needsBook", { defaultValue: "Choose a book" })}
              </span>
            </div>
            <h2>{selectedTool?.label}</h2>
            <p>{selectedTool?.text}</p>

            <dl className="story-studio-run-summary">
              <div>
                <dt><FiBookOpen size={15} /> {t("author.studio.storyStudio.book")}</dt>
                <dd>{selectedBook ? getTitle(selectedBook) : t("author.studio.storyStudio.chooseBookShort", { defaultValue: "Choose a book" })}</dd>
              </div>
              <div>
                <dt><FiLayers size={15} /> {t("author.studio.storyStudio.scope", { defaultValue: "Scope" })}</dt>
                <dd>{selectedScopeLabel}</dd>
              </div>
              <div>
                <dt><FiFileText size={15} /> {t("author.studio.storyStudio.focus", { defaultValue: "Focus" })}</dt>
                <dd>{promptText || t("author.studio.storyStudio.noFocus", { defaultValue: "No extra focus note." })}</dd>
              </div>
            </dl>

            <div className="story-studio-actions">
              <Button type="button" variant="outline" onClick={getQuote} disabled={Boolean(busy) || !selectedBook}>
                <FiZap size={16} />
                {busy === "quote" ? t("author.studio.storyStudio.quoting") : t("author.studio.storyStudio.getQuote")}
              </Button>
              <Button type="button" variant="primary" onClick={runTool} disabled={Boolean(busy) || !selectedBook}>
                <FiPlay size={16} />
                {busy === "run" ? t("author.studio.storyStudio.running") : t("author.studio.storyStudio.runTool")}
              </Button>
              <Button type="button" variant="outline" onClick={runProofreading} disabled={Boolean(busy) || !selectedChapterIds.length}>
                <FiCheckCircle size={16} />
                {busy === "proofreading"
                  ? t("author.studio.storyStudio.proofreading")
                  : t("author.studio.storyStudio.proofreadSelected")}
              </Button>
            </div>

            {quote ? (
              <div className="story-studio-result is-quote">
                <strong>{t("author.studio.storyStudio.quoteReady", { defaultValue: "Quote ready" })}</strong>
                <span>
                  {t("author.studio.storyStudio.quoteSummary", {
                    credits: quote.priceCredits,
                    words: Number(quote.wordCount || 0).toLocaleString(),
                  })}
                </span>
              </div>
            ) : null}

            {draftResult ? (
              <div className="story-studio-result">
                <strong>{t("author.studio.storyStudio.proofreadingReady", { defaultValue: "Proofreading draft created" })}</strong>
                <span>
                  {t("author.studio.storyStudio.proofreadingCreated", {
                    id: draftResult.id,
                    chapterId: draftResult.chapterId,
                  })}
                </span>
              </div>
            ) : null}
          </Surface>
        </div>
      </div>

      <Surface className="authorx-panel story-studio-panel story-studio-notebook">
        <div className="story-studio-panel-head story-studio-panel-head--notebook">
          <span className="story-studio-number">3</span>
          <div>
            <span className="author-studio-section-heading__eyebrow">{t("author.studio.storyStudio.bookNotebook")}</span>
            <h2>{selectedBook ? getTitle(selectedBook) : t("author.studio.storyStudio.notebook")}</h2>
            <p>{t("author.studio.storyStudio.notebookDescription")}</p>
          </div>
          <span className="story-studio-note-count">
            {t("author.studio.storyStudio.noteCount", {
              defaultValue: "{{count}} saved notes",
              count: notebook.length,
            })}
          </span>
        </div>

        {notebook.length ? (
          <div className="story-studio-note-list">
            {notebook.map((entry) => (
              <article key={entry.id ?? entry.ID ?? getEntryTitle(entry)} className="story-studio-note">
                <div>
                  <span>{getEntryType(entry)}{getEntryCreatedAt(entry) ? ` · ${getEntryCreatedAt(entry)}` : ""}</span>
                  <h3>{getEntryTitle(entry)}</h3>
                  <p>{getEntryContent(entry)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="story-studio-empty">
            <FiFileText size={24} />
            <h3>{t("author.studio.storyStudio.noNotebookTitle")}</h3>
            <p>{t("author.studio.storyStudio.noNotebookSubtitle")}</p>
          </div>
        )}
      </Surface>
    </div>
  );
}
