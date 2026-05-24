import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import EmptyState from "../../Shared/ui/EmptyState";
import AuthorSectionHeading from "../../features/author/components/AuthorSectionHeading";
import {
  acceptBookBibleSuggestion,
  createBookBibleItem,
  deleteBookBibleItem,
  fetchBookBible,
  quoteBookBibleAi,
  rejectBookBibleSuggestion,
  runBookBibleAi,
  updateBookBibleItem,
  updateBookBibleProfile,
} from "../../Api/bookBible.api";
import {
  createNotebookEntry,
  fetchBookNotebook,
} from "../../Api/monetization.api";

const EMPTY_PROFILE = {
  premise: "",
  themes: "",
  tone: "",
  readerPromise: "",
  authorNotes: "",
};

const EMPTY_WORLD = {
  entryType: "location",
  name: "",
  summary: "",
  details: "",
  tags: "",
};

const EMPTY_CHARACTER = {
  name: "",
  aliases: "",
  role: "",
  status: "active",
  appearance: "",
  motivation: "",
  fear: "",
  goal: "",
  secrets: "",
  arcNotes: "",
};

const EMPTY_RELATIONSHIP = {
  sourceCharacterId: "",
  targetCharacterId: "",
  relationType: "",
  tension: "",
  status: "active",
  notes: "",
};

const EMPTY_PLOT = {
  title: "",
  setup: "",
  promise: "",
  conflict: "",
  status: "open",
  payoff: "",
};

const EMPTY_TIMELINE = {
  chapterId: "",
  title: "",
  orderIndex: "",
  dateLabel: "",
  description: "",
};

function getId(item) {
  return item?.id ?? item?.ID;
}

function getTitle(item) {
  return item?.title ?? item?.Title ?? "Untitled";
}

function getChapterNumber(item) {
  return item?.chapterNumber ?? item?.ChapterNumber ?? "?";
}

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value,
    ]),
  );
}

function parseSuggestionPayload(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

export default function AuthorBookBible({
  bookId,
  section,
  chapters = [],
  setupMode = false,
  onOpenChapters,
}) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE);
  const [worldForm, setWorldForm] = useState(EMPTY_WORLD);
  const [characterForm, setCharacterForm] = useState(EMPTY_CHARACTER);
  const [relationshipForm, setRelationshipForm] = useState(EMPTY_RELATIONSHIP);
  const [plotForm, setPlotForm] = useState(EMPTY_PLOT);
  const [timelineForm, setTimelineForm] = useState(EMPTY_TIMELINE);
  const [notebook, setNotebook] = useState([]);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [selectedChapterIds, setSelectedChapterIds] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    setError("");
    try {
      const [bibleData, notebookData] = await Promise.all([
        fetchBookBible(bookId),
        fetchBookNotebook(bookId).catch(() => []),
      ]);

      setSnapshot(bibleData);
      setNotebook(normalizeList(notebookData));
      setProfileForm({
        premise: bibleData?.profile?.premise ?? "",
        themes: bibleData?.profile?.themes ?? "",
        tone: bibleData?.profile?.tone ?? "",
        readerPromise: bibleData?.profile?.readerPromise ?? "",
        authorNotes: bibleData?.profile?.authorNotes ?? "",
      });
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.loadError"));
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    load();
  }, [load]);

  const completion = snapshot?.completion ?? {};
  const worldEntries = normalizeList(snapshot?.worldEntries);
  const characters = normalizeList(snapshot?.characters);
  const relationships = normalizeList(snapshot?.relationships);
  const plotThreads = normalizeList(snapshot?.plotThreads);
  const timelineEvents = normalizeList(snapshot?.timelineEvents);
  const suggestions = normalizeList(snapshot?.suggestions);
  const pendingSuggestions = suggestions.filter((item) => item.status === "pending");
  const suggestionHistory = suggestions.filter((item) => item.status !== "pending");

  const selectedWordHint = useMemo(() => {
    const selected = chapters.filter((chapter) => selectedChapterIds.includes(Number(getId(chapter))));
    const words = selected.reduce((sum, chapter) => sum + Number(chapter.wordCount ?? chapter.WordCount ?? 0), 0);
    return { count: selected.length, words };
  }, [chapters, selectedChapterIds]);

  const refreshAfterChange = async () => {
    setQuote(null);
    await load();
  };

  const saveProfile = async (event) => {
    event?.preventDefault?.();
    setBusy("profile");
    setError("");
    try {
      await updateBookBibleProfile(bookId, cleanPayload(profileForm));
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveProfileError"));
    } finally {
      setBusy("");
    }
  };

  const saveWorld = async (event) => {
    event.preventDefault();
    setBusy("world");
    setError("");
    try {
      const payload = cleanPayload(worldForm);
      if (worldForm.id) await updateBookBibleItem(bookId, "world-entries", worldForm.id, payload);
      else await createBookBibleItem(bookId, "world-entries", payload);
      setWorldForm(EMPTY_WORLD);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveWorldError"));
    } finally {
      setBusy("");
    }
  };

  const saveCharacter = async (event) => {
    event.preventDefault();
    setBusy("character");
    setError("");
    try {
      const payload = cleanPayload(characterForm);
      if (characterForm.id) await updateBookBibleItem(bookId, "characters", characterForm.id, payload);
      else await createBookBibleItem(bookId, "characters", payload);
      setCharacterForm(EMPTY_CHARACTER);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveCharacterError"));
    } finally {
      setBusy("");
    }
  };

  const saveRelationship = async (event) => {
    event.preventDefault();
    setBusy("relationship");
    setError("");
    try {
      const payload = {
        ...cleanPayload(relationshipForm),
        sourceCharacterId: Number(relationshipForm.sourceCharacterId),
        targetCharacterId: Number(relationshipForm.targetCharacterId),
      };
      if (relationshipForm.id) await updateBookBibleItem(bookId, "relationships", relationshipForm.id, payload);
      else await createBookBibleItem(bookId, "relationships", payload);
      setRelationshipForm(EMPTY_RELATIONSHIP);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveRelationshipError"));
    } finally {
      setBusy("");
    }
  };

  const savePlot = async (event) => {
    event.preventDefault();
    setBusy("plot");
    setError("");
    try {
      const payload = cleanPayload(plotForm);
      if (plotForm.id) await updateBookBibleItem(bookId, "plot-threads", plotForm.id, payload);
      else await createBookBibleItem(bookId, "plot-threads", payload);
      setPlotForm(EMPTY_PLOT);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.savePlotError"));
    } finally {
      setBusy("");
    }
  };

  const saveTimeline = async (event) => {
    event.preventDefault();
    setBusy("timeline");
    setError("");
    try {
      const payload = {
        ...cleanPayload(timelineForm),
        chapterId: timelineForm.chapterId ? Number(timelineForm.chapterId) : null,
        orderIndex: timelineForm.orderIndex ? Number(timelineForm.orderIndex) : 0,
      };
      if (timelineForm.id) await updateBookBibleItem(bookId, "timeline-events", timelineForm.id, payload);
      else await createBookBibleItem(bookId, "timeline-events", payload);
      setTimelineForm(EMPTY_TIMELINE);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveTimelineError"));
    } finally {
      setBusy("");
    }
  };

  const deleteItem = async (apiSection, itemId) => {
    if (!itemId) return;
    setBusy(`delete-${apiSection}-${itemId}`);
    setError("");
    try {
      await deleteBookBibleItem(bookId, apiSection, itemId);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.deleteError"));
    } finally {
      setBusy("");
    }
  };

  const saveNote = async (event) => {
    event.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;
    setBusy("note");
    setError("");
    try {
      const note = await createNotebookEntry(bookId, {
        entryType: "note",
        title: noteForm.title.trim(),
        content: noteForm.content.trim(),
      });
      if (note) setNotebook((current) => [note, ...current]);
      setNoteForm({ title: "", content: "" });
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.saveNoteError"));
    } finally {
      setBusy("");
    }
  };

  const toggleAiChapter = (chapterId) => {
    const id = Number(chapterId);
    setSelectedChapterIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
    setQuote(null);
  };

  const getAiQuote = async () => {
    setBusy("quote");
    setError("");
    try {
      const data = await quoteBookBibleAi(bookId, {
        selectedChapterIds,
        prompt: aiPrompt,
      });
      setQuote(data);
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.quoteError"));
    } finally {
      setBusy("");
    }
  };

  const runAi = async () => {
    setBusy("run-ai");
    setError("");
    try {
      const result = await runBookBibleAi(bookId, {
        selectedChapterIds,
        prompt: aiPrompt,
      });
      setQuote(result?.quote ?? null);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.suggestionError"));
    } finally {
      setBusy("");
    }
  };

  const decideSuggestion = async (suggestionId, decision) => {
    setBusy(`${decision}-${suggestionId}`);
    setError("");
    try {
      if (decision === "accept") await acceptBookBibleSuggestion(bookId, suggestionId);
      else await rejectBookBibleSuggestion(bookId, suggestionId);
      await refreshAfterChange();
    } catch (err) {
      setError(err?.response?.data?.message || t("author.studio.bookBible.decisionError"));
    } finally {
      setBusy("");
    }
  };

  if (loading) return <LoadingState text={t("author.studio.bookBible.loading")} />;

  return (
    <div className="book-bible">
      {error ? <div className="authorx-form-error mb-3">{error}</div> : null}

      {section === "bible" && (
        <>
          <Surface className="book-bible-panel">
            <AuthorSectionHeading
              eyebrow={setupMode ? t("author.studio.bookBible.setup") : t("author.studio.book.tabs.bible")}
              title={t("author.studio.bookBible.title")}
              description={t("author.studio.bookBible.description")}
            />

            <div className="book-bible-progress">
              <div>
                <strong>{completion.percent ?? 0}%</strong>
                <span>{t("author.studio.bookBible.setupComplete")}</span>
              </div>
              <ChecklistItem done={completion.hasPremise} label={t("author.studio.bookBible.corePremise")} />
              <ChecklistItem done={completion.hasWorld} label={t("author.studio.bookBible.mainWorldRules")} />
              <ChecklistItem done={completion.hasCharacters} label={t("author.studio.bookBible.firstCharacters")} />
              <ChecklistItem done={completion.hasPlotThreads} label={t("author.studio.bookBible.firstPlotThreads")} />
              <ChecklistItem done={completion.hasTimeline} label={t("author.studio.bookBible.earlyTimeline")} />
            </div>

            {completion.needsScan ? (
              <div className="book-bible-scan-note">
                {t("author.studio.bookBible.scanNote")}
              </div>
            ) : null}
          </Surface>

          <ProfileForm
            profileForm={profileForm}
            setProfileForm={setProfileForm}
            saveProfile={saveProfile}
            busy={busy}
          />

          <AiPanel
            chapters={chapters}
            selectedChapterIds={selectedChapterIds}
            selectedWordHint={selectedWordHint}
            toggleAiChapter={toggleAiChapter}
            aiPrompt={aiPrompt}
            setAiPrompt={setAiPrompt}
            quote={quote}
            getAiQuote={getAiQuote}
            runAi={runAi}
            busy={busy}
            pendingSuggestions={pendingSuggestions}
            decideSuggestion={decideSuggestion}
          />
        </>
      )}

      {section === "world" && (
        <WorldSection
          worldEntries={worldEntries}
          worldForm={worldForm}
          setWorldForm={setWorldForm}
          saveWorld={saveWorld}
          deleteItem={deleteItem}
          busy={busy}
        />
      )}

      {section === "characters" && (
        <CharactersSection
          characters={characters}
          relationships={relationships}
          characterForm={characterForm}
          relationshipForm={relationshipForm}
          setCharacterForm={setCharacterForm}
          setRelationshipForm={setRelationshipForm}
          saveCharacter={saveCharacter}
          saveRelationship={saveRelationship}
          deleteItem={deleteItem}
          busy={busy}
        />
      )}

      {section === "plot" && (
        <PlotSection
          chapters={chapters}
          plotThreads={plotThreads}
          timelineEvents={timelineEvents}
          plotForm={plotForm}
          timelineForm={timelineForm}
          setPlotForm={setPlotForm}
          setTimelineForm={setTimelineForm}
          savePlot={savePlot}
          saveTimeline={saveTimeline}
          deleteItem={deleteItem}
          busy={busy}
        />
      )}

      {section === "notebook" && (
        <NotebookSection
          noteForm={noteForm}
          setNoteForm={setNoteForm}
          saveNote={saveNote}
          notebook={notebook}
          suggestionHistory={suggestionHistory}
          pendingSuggestions={pendingSuggestions}
          onOpenChapters={onOpenChapters}
          busy={busy}
        />
      )}
    </div>
  );
}

function ChecklistItem({ done, label }) {
  const { t } = useTranslation();

  return (
    <span className={`book-bible-check ${done ? "is-done" : ""}`}>
      <b>{done ? t("author.studio.bookBible.done") : t("author.studio.bookBible.open")}</b>
      {label}
    </span>
  );
}

function ProfileForm({ profileForm, setProfileForm, saveProfile, busy }) {
  const { t } = useTranslation();

  return (
    <Surface className="book-bible-panel">
      <AuthorSectionHeading
        eyebrow={t("author.studio.bookBible.core")}
        title={t("author.studio.bookBible.premiseTitle")}
        description={t("author.studio.bookBible.premiseDescription")}
      />
      <form className="book-bible-form" onSubmit={saveProfile}>
        <textarea
          className="authorx-textarea"
          rows={4}
          value={profileForm.premise}
          onChange={(event) => setProfileForm((current) => ({ ...current, premise: event.target.value }))}
          placeholder={t("author.studio.bookBible.corePremise")}
        />
        <div className="book-bible-form-grid">
          <TextField value={profileForm.themes} onChange={(value) => setProfileForm((current) => ({ ...current, themes: value }))} placeholder={t("author.studio.bookBible.themes")} />
          <TextField value={profileForm.tone} onChange={(value) => setProfileForm((current) => ({ ...current, tone: value }))} placeholder={t("author.studio.bookBible.tone")} />
        </div>
        <TextField value={profileForm.readerPromise} onChange={(value) => setProfileForm((current) => ({ ...current, readerPromise: value }))} placeholder={t("author.studio.bookBible.readerPromise")} />
        <textarea
          className="authorx-textarea"
          rows={4}
          value={profileForm.authorNotes}
          onChange={(event) => setProfileForm((current) => ({ ...current, authorNotes: event.target.value }))}
          placeholder={t("author.studio.bookBible.authorNotes")}
        />
        <div className="authorx-inline-actions">
          <Button type="submit" variant="primary" disabled={busy === "profile"}>
            {busy === "profile" ? t("author.studio.common.saving") : t("author.studio.bookBible.saveProfile")}
          </Button>
        </div>
      </form>
    </Surface>
  );
}

function AiPanel({
  chapters,
  selectedChapterIds,
  selectedWordHint,
  toggleAiChapter,
  aiPrompt,
  setAiPrompt,
  quote,
  getAiQuote,
  runAi,
  busy,
  pendingSuggestions,
  decideSuggestion,
}) {
  const { t } = useTranslation();

  return (
    <Surface className="book-bible-panel">
      <AuthorSectionHeading
        eyebrow={t("author.studio.bookBible.ai")}
        title={t("author.studio.bookBible.sync")}
        description={t("author.studio.bookBible.syncDescription")}
      />

      <div className="book-bible-ai-layout">
        <div>
          <div className="book-bible-mini-title">{t("author.studio.bookBible.chapterContext")}</div>
          <div className="book-bible-chapter-picks">
            {chapters.length ? chapters.map((chapter) => {
              const id = Number(getId(chapter));
              return (
                <label key={id} className="authorx-check-row">
                  <input
                    type="checkbox"
                    checked={selectedChapterIds.includes(id)}
                    onChange={() => toggleAiChapter(id)}
                  />
                  <span>#{getChapterNumber(chapter)} {getTitle(chapter)}</span>
                </label>
              );
            }) : <p className="monetization-muted">{t("author.studio.storyStudio.noChapters")}</p>}
          </div>
        </div>

        <div>
          <textarea
            className="authorx-textarea"
            rows={7}
            value={aiPrompt}
            onChange={(event) => setAiPrompt(event.target.value)}
            placeholder={t("author.studio.bookBible.focusPlaceholder")}
          />
          <div className="book-bible-ai-summary">
            {t("author.studio.bookBible.selectedSummary", {
              count: selectedWordHint.count,
              words: selectedWordHint.words.toLocaleString(),
            })}
          </div>
          <div className="authorx-inline-actions mt-2">
            <Button type="button" variant="outline" onClick={getAiQuote} disabled={Boolean(busy)}>
              {busy === "quote" ? t("author.studio.bookBible.quoting") : t("author.studio.bookBible.getQuote")}
            </Button>
            <Button type="button" variant="primary" onClick={runAi} disabled={Boolean(busy)}>
              {busy === "run-ai" ? t("author.studio.bookBible.running") : t("author.studio.bookBible.runSync")}
            </Button>
          </div>
          {quote ? (
            <div className="authorx-contract-note mt-2">
              {t("author.studio.bookBible.quoteSummary", {
                credits: quote.priceCredits,
                words: Number(quote.wordCount || 0).toLocaleString(),
              })}
            </div>
          ) : null}
        </div>
      </div>

      <SuggestionList
        title={t("author.studio.bookBible.pendingSuggestions")}
        suggestions={pendingSuggestions}
        empty={t("author.studio.bookBible.noPendingSuggestions")}
        decideSuggestion={decideSuggestion}
        busy={busy}
      />
    </Surface>
  );
}

function SuggestionList({ title, suggestions, empty, decideSuggestion, busy, readonly = false }) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-suggestions">
      <div className="book-bible-mini-title">{title}</div>
      {suggestions.length ? suggestions.map((suggestion) => {
        const payload = parseSuggestionPayload(suggestion.payloadJson);
        return (
          <article key={suggestion.id} className="book-bible-suggestion">
            <div>
              <strong>{suggestion.title}</strong>
              <span>{suggestion.suggestionType} · {suggestion.status}</span>
              <p>{suggestion.summary}</p>
              {Object.keys(payload).length ? <code>{JSON.stringify(payload)}</code> : null}
            </div>
            {!readonly && suggestion.status === "pending" ? (
              <div className="book-bible-row-actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy === `accept-${suggestion.id}`}
                  onClick={() => decideSuggestion(suggestion.id, "accept")}
                >
                  {t("author.studio.bookBible.accept")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy === `reject-${suggestion.id}`}
                  onClick={() => decideSuggestion(suggestion.id, "reject")}
                >
                  {t("author.studio.bookBible.reject")}
                </Button>
              </div>
            ) : null}
          </article>
        );
      }) : <p className="monetization-muted">{empty}</p>}
    </div>
  );
}

function WorldSection({ worldEntries, worldForm, setWorldForm, saveWorld, deleteItem, busy }) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-grid">
      <Surface className="book-bible-panel">
        <AuthorSectionHeading eyebrow={t("author.studio.book.tabs.world")} title={t("author.studio.bookBible.worldEntries")} description={t("author.studio.bookBible.worldDescription")} />
        <form className="book-bible-form" onSubmit={saveWorld}>
          <div className="book-bible-form-grid">
            <select className="authorx-native-select" value={worldForm.entryType} onChange={(event) => setWorldForm((current) => ({ ...current, entryType: event.target.value }))}>
              <option value="location">{t("author.studio.bookBible.location")}</option>
              <option value="faction">{t("author.studio.bookBible.faction")}</option>
              <option value="rule">{t("author.studio.bookBible.ruleSystem")}</option>
              <option value="culture">{t("author.studio.bookBible.culture")}</option>
              <option value="history">{t("author.studio.bookBible.history")}</option>
              <option value="object">{t("author.studio.bookBible.object")}</option>
            </select>
            <TextField value={worldForm.name} onChange={(value) => setWorldForm((current) => ({ ...current, name: value }))} placeholder={t("author.studio.bookBible.name")} />
          </div>
          <TextField value={worldForm.summary} onChange={(value) => setWorldForm((current) => ({ ...current, summary: value }))} placeholder={t("author.studio.bookBible.shortSummary")} />
          <textarea className="authorx-textarea" rows={5} value={worldForm.details} onChange={(event) => setWorldForm((current) => ({ ...current, details: event.target.value }))} placeholder={t("author.studio.bookBible.details")} />
          <TextField value={worldForm.tags} onChange={(value) => setWorldForm((current) => ({ ...current, tags: value }))} placeholder={t("author.studio.bookBible.tags")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "world"}>{worldForm.id ? t("author.studio.bookBible.updateEntry") : t("author.studio.bookBible.addEntry")}</Button>
            {worldForm.id ? <Button type="button" variant="outline" onClick={() => setWorldForm(EMPTY_WORLD)}>{t("author.studio.book.cancelEdit")}</Button> : null}
          </div>
        </form>
      </Surface>

      <Surface className="book-bible-panel">
        {worldEntries.length ? (
          <ItemList
            items={worldEntries}
            titleKey="name"
            meta={(item) => item.entryType}
            body={(item) => item.summary || item.details}
            onEdit={(item) => setWorldForm({ ...EMPTY_WORLD, ...item })}
            onDelete={(item) => deleteItem("world-entries", item.id)}
            busy={busy}
          />
        ) : <EmptyState title={t("author.studio.bookBible.noWorldTitle")} subtitle={t("author.studio.bookBible.noWorldSubtitle")} />}
      </Surface>
    </div>
  );
}

function CharactersSection({
  characters,
  relationships,
  characterForm,
  relationshipForm,
  setCharacterForm,
  setRelationshipForm,
  saveCharacter,
  saveRelationship,
  deleteItem,
  busy,
}) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-grid">
      <Surface className="book-bible-panel">
        <AuthorSectionHeading eyebrow={t("author.studio.book.tabs.characters")} title={t("author.studio.bookBible.characterProfiles")} description={t("author.studio.bookBible.characterDescription")} />
        <form className="book-bible-form" onSubmit={saveCharacter}>
          <div className="book-bible-form-grid">
            <TextField value={characterForm.name} onChange={(value) => setCharacterForm((current) => ({ ...current, name: value }))} placeholder={t("author.studio.bookBible.name")} />
            <TextField value={characterForm.role} onChange={(value) => setCharacterForm((current) => ({ ...current, role: value }))} placeholder={t("author.studio.bookBible.role")} />
          </div>
          <div className="book-bible-form-grid">
            <TextField value={characterForm.aliases} onChange={(value) => setCharacterForm((current) => ({ ...current, aliases: value }))} placeholder={t("author.studio.bookBible.aliases")} />
            <TextField value={characterForm.status} onChange={(value) => setCharacterForm((current) => ({ ...current, status: value }))} placeholder={t("author.studio.bookBible.status")} />
          </div>
          <div className="book-bible-form-grid">
            <TextField value={characterForm.motivation} onChange={(value) => setCharacterForm((current) => ({ ...current, motivation: value }))} placeholder={t("author.studio.bookBible.motivation")} />
            <TextField value={characterForm.goal} onChange={(value) => setCharacterForm((current) => ({ ...current, goal: value }))} placeholder={t("author.studio.bookBible.goal")} />
          </div>
          <div className="book-bible-form-grid">
            <TextField value={characterForm.fear} onChange={(value) => setCharacterForm((current) => ({ ...current, fear: value }))} placeholder={t("author.studio.bookBible.fear")} />
            <TextField value={characterForm.secrets} onChange={(value) => setCharacterForm((current) => ({ ...current, secrets: value }))} placeholder={t("author.studio.bookBible.secrets")} />
          </div>
          <textarea className="authorx-textarea" rows={4} value={characterForm.appearance} onChange={(event) => setCharacterForm((current) => ({ ...current, appearance: event.target.value }))} placeholder={t("author.studio.bookBible.appearance")} />
          <textarea className="authorx-textarea" rows={4} value={characterForm.arcNotes} onChange={(event) => setCharacterForm((current) => ({ ...current, arcNotes: event.target.value }))} placeholder={t("author.studio.bookBible.arcNotes")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "character"}>{characterForm.id ? t("author.studio.bookBible.updateCharacter") : t("author.studio.bookBible.addCharacter")}</Button>
            {characterForm.id ? <Button type="button" variant="outline" onClick={() => setCharacterForm(EMPTY_CHARACTER)}>{t("author.studio.book.cancelEdit")}</Button> : null}
          </div>
        </form>
      </Surface>

      <Surface className="book-bible-panel">
        {characters.length ? (
          <ItemList
            items={characters}
            titleKey="name"
            meta={(item) => `${item.role || t("author.studio.bookBible.role")} · ${item.status || "active"}`}
            body={(item) => item.goal || item.motivation || item.arcNotes}
            onEdit={(item) => setCharacterForm({ ...EMPTY_CHARACTER, ...item })}
            onDelete={(item) => deleteItem("characters", item.id)}
            busy={busy}
          />
        ) : <EmptyState title={t("author.studio.bookBible.noCharactersTitle")} subtitle={t("author.studio.bookBible.noCharactersSubtitle")} />}
      </Surface>

      <Surface className="book-bible-panel book-bible-wide">
        <AuthorSectionHeading eyebrow={t("author.studio.bookBible.relationships")} title={t("author.studio.bookBible.relationshipMap")} description={t("author.studio.bookBible.relationshipDescription")} />
        <form className="book-bible-form" onSubmit={saveRelationship}>
          <div className="book-bible-form-grid">
            <CharacterSelect value={relationshipForm.sourceCharacterId} characters={characters} onChange={(value) => setRelationshipForm((current) => ({ ...current, sourceCharacterId: value }))} label={t("author.studio.bookBible.sourceCharacter")} />
            <CharacterSelect value={relationshipForm.targetCharacterId} characters={characters} onChange={(value) => setRelationshipForm((current) => ({ ...current, targetCharacterId: value }))} label={t("author.studio.bookBible.targetCharacter")} />
          </div>
          <div className="book-bible-form-grid">
            <TextField value={relationshipForm.relationType} onChange={(value) => setRelationshipForm((current) => ({ ...current, relationType: value }))} placeholder={t("author.studio.bookBible.relationshipType")} />
            <TextField value={relationshipForm.tension} onChange={(value) => setRelationshipForm((current) => ({ ...current, tension: value }))} placeholder={t("author.studio.bookBible.tension")} />
          </div>
          <TextField value={relationshipForm.status} onChange={(value) => setRelationshipForm((current) => ({ ...current, status: value }))} placeholder={t("author.studio.bookBible.status")} />
          <textarea className="authorx-textarea" rows={3} value={relationshipForm.notes} onChange={(event) => setRelationshipForm((current) => ({ ...current, notes: event.target.value }))} placeholder={t("author.studio.bookBible.notes")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "relationship" || characters.length < 2}>{relationshipForm.id ? t("author.studio.bookBible.updateRelationship") : t("author.studio.bookBible.addRelationship")}</Button>
            {relationshipForm.id ? <Button type="button" variant="outline" onClick={() => setRelationshipForm(EMPTY_RELATIONSHIP)}>{t("author.studio.book.cancelEdit")}</Button> : null}
          </div>
        </form>
        {relationships.length ? (
          <ItemList
            items={relationships}
            title={(item) => `${item.sourceCharacterName || item.sourceCharacterId} -> ${item.targetCharacterName || item.targetCharacterId}`}
            meta={(item) => `${item.relationType || t("author.studio.bookBible.relationship")} · ${item.status || "active"}`}
            body={(item) => item.tension || item.notes}
            onEdit={(item) => setRelationshipForm({ ...EMPTY_RELATIONSHIP, ...item })}
            onDelete={(item) => deleteItem("relationships", item.id)}
            busy={busy}
          />
        ) : <p className="monetization-muted mt-3">{t("author.studio.bookBible.noRelationships")}</p>}
      </Surface>
    </div>
  );
}

function PlotSection({
  chapters,
  plotThreads,
  timelineEvents,
  plotForm,
  timelineForm,
  setPlotForm,
  setTimelineForm,
  savePlot,
  saveTimeline,
  deleteItem,
  busy,
}) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-grid">
      <Surface className="book-bible-panel">
        <AuthorSectionHeading eyebrow={t("author.studio.book.tabs.plot")} title={t("author.studio.bookBible.plotThreads")} description={t("author.studio.bookBible.plotDescription")} />
        <form className="book-bible-form" onSubmit={savePlot}>
          <TextField value={plotForm.title} onChange={(value) => setPlotForm((current) => ({ ...current, title: value }))} placeholder={t("author.studio.bookBible.threadTitle")} />
          <div className="book-bible-form-grid">
            <TextField value={plotForm.status} onChange={(value) => setPlotForm((current) => ({ ...current, status: value }))} placeholder={t("author.studio.bookBible.status")} />
            <TextField value={plotForm.promise} onChange={(value) => setPlotForm((current) => ({ ...current, promise: value }))} placeholder={t("author.studio.bookBible.promise")} />
          </div>
          <textarea className="authorx-textarea" rows={3} value={plotForm.setup} onChange={(event) => setPlotForm((current) => ({ ...current, setup: event.target.value }))} placeholder={t("author.studio.bookBible.setupField")} />
          <textarea className="authorx-textarea" rows={3} value={plotForm.conflict} onChange={(event) => setPlotForm((current) => ({ ...current, conflict: event.target.value }))} placeholder={t("author.studio.bookBible.conflict")} />
          <textarea className="authorx-textarea" rows={3} value={plotForm.payoff} onChange={(event) => setPlotForm((current) => ({ ...current, payoff: event.target.value }))} placeholder={t("author.studio.bookBible.payoff")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "plot"}>{plotForm.id ? t("author.studio.bookBible.updateThread") : t("author.studio.bookBible.addThread")}</Button>
            {plotForm.id ? <Button type="button" variant="outline" onClick={() => setPlotForm(EMPTY_PLOT)}>{t("author.studio.book.cancelEdit")}</Button> : null}
          </div>
        </form>
      </Surface>

      <Surface className="book-bible-panel">
        {plotThreads.length ? (
          <ItemList
            items={plotThreads}
            titleKey="title"
            meta={(item) => item.status}
            body={(item) => item.promise || item.conflict || item.payoff}
            onEdit={(item) => setPlotForm({ ...EMPTY_PLOT, ...item })}
            onDelete={(item) => deleteItem("plot-threads", item.id)}
            busy={busy}
          />
        ) : <EmptyState title={t("author.studio.bookBible.noPlotTitle")} subtitle={t("author.studio.bookBible.noPlotSubtitle")} />}
      </Surface>

      <Surface className="book-bible-panel book-bible-wide">
        <AuthorSectionHeading eyebrow={t("author.studio.bookBible.timeline")} title={t("author.studio.bookBible.canonTimeline")} description={t("author.studio.bookBible.timelineDescription")} />
        <form className="book-bible-form" onSubmit={saveTimeline}>
          <div className="book-bible-form-grid">
            <TextField value={timelineForm.title} onChange={(value) => setTimelineForm((current) => ({ ...current, title: value }))} placeholder={t("author.studio.bookBible.eventTitle")} />
            <select className="authorx-native-select" value={timelineForm.chapterId} onChange={(event) => setTimelineForm((current) => ({ ...current, chapterId: event.target.value }))}>
              <option value="">{t("author.studio.bookBible.noChapterLink")}</option>
              {chapters.map((chapter) => <option key={getId(chapter)} value={getId(chapter)}>#{getChapterNumber(chapter)} {getTitle(chapter)}</option>)}
            </select>
          </div>
          <div className="book-bible-form-grid">
            <TextField value={timelineForm.dateLabel} onChange={(value) => setTimelineForm((current) => ({ ...current, dateLabel: value }))} placeholder={t("author.studio.bookBible.dateLabel")} />
            <TextField value={String(timelineForm.orderIndex ?? "")} onChange={(value) => setTimelineForm((current) => ({ ...current, orderIndex: value }))} placeholder={t("author.studio.bookBible.order")} />
          </div>
          <textarea className="authorx-textarea" rows={3} value={timelineForm.description} onChange={(event) => setTimelineForm((current) => ({ ...current, description: event.target.value }))} placeholder={t("author.studio.bookBible.eventDescription")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "timeline"}>{timelineForm.id ? t("author.studio.bookBible.updateEvent") : t("author.studio.bookBible.addEvent")}</Button>
            {timelineForm.id ? <Button type="button" variant="outline" onClick={() => setTimelineForm(EMPTY_TIMELINE)}>{t("author.studio.book.cancelEdit")}</Button> : null}
          </div>
        </form>
        {timelineEvents.length ? (
          <ItemList
            items={timelineEvents}
            titleKey="title"
            meta={(item) => item.dateLabel || (item.chapterTitle ? t("author.studio.bookBible.chapterMeta", { title: item.chapterTitle }) : t("author.studio.bookBible.timeline"))}
            body={(item) => item.description}
            onEdit={(item) => setTimelineForm({ ...EMPTY_TIMELINE, ...item, chapterId: item.chapterId || "", orderIndex: item.orderIndex ?? "" })}
            onDelete={(item) => deleteItem("timeline-events", item.id)}
            busy={busy}
          />
        ) : <p className="monetization-muted mt-3">{t("author.studio.bookBible.noTimeline")}</p>}
      </Surface>
    </div>
  );
}

function NotebookSection({
  noteForm,
  setNoteForm,
  saveNote,
  notebook,
  suggestionHistory,
  pendingSuggestions,
  onOpenChapters,
  busy,
}) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-grid">
      <Surface className="book-bible-panel">
        <AuthorSectionHeading eyebrow={t("author.studio.book.tabs.notebook")} title={t("author.studio.bookBible.privateNotes")} description={t("author.studio.bookBible.privateNotesDescription")} />
        <form className="book-bible-form" onSubmit={saveNote}>
          <TextField value={noteForm.title} onChange={(value) => setNoteForm((current) => ({ ...current, title: value }))} placeholder={t("author.studio.bookBible.noteTitle")} />
          <textarea className="authorx-textarea" rows={5} value={noteForm.content} onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))} placeholder={t("author.studio.bookBible.noteContent")} />
          <div className="authorx-inline-actions">
            <Button type="submit" variant="primary" disabled={busy === "note"}>{t("author.studio.bookBible.saveNote")}</Button>
            <Button type="button" variant="outline" onClick={onOpenChapters}>{t("author.studio.bookBible.backToChapters")}</Button>
          </div>
        </form>
      </Surface>
      <Surface className="book-bible-panel">
        {notebook.length ? (
          <div className="book-bible-list">
            {notebook.map((note) => (
              <article key={note.id} className="book-bible-item">
                <strong>{note.title}</strong>
                <span>{note.entryType} · {new Date(note.createdAt).toLocaleString()}</span>
                <p>{note.content}</p>
              </article>
            ))}
          </div>
        ) : <EmptyState title={t("author.studio.bookBible.noNotebookTitle")} subtitle={t("author.studio.bookBible.noNotebookSubtitle")} />}
      </Surface>
      <Surface className="book-bible-panel book-bible-wide">
        <SuggestionList title={t("author.studio.bookBible.pendingSuggestions")} suggestions={pendingSuggestions} empty={t("author.studio.bookBible.noPending")} readonly />
        <SuggestionList title={t("author.studio.bookBible.suggestionHistory")} suggestions={suggestionHistory} empty={t("author.studio.bookBible.noSuggestionHistory")} readonly />
      </Surface>
    </div>
  );
}

function CharacterSelect({ value, characters, onChange, label }) {
  return (
    <select className="authorx-native-select" value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{label}</option>
      {characters.map((character) => <option key={character.id} value={character.id}>{character.name}</option>)}
    </select>
  );
}

function ItemList({ items, titleKey, title, meta, body, onEdit, onDelete, busy }) {
  const { t } = useTranslation();

  return (
    <div className="book-bible-list">
      {items.map((item) => {
        const itemTitle = typeof title === "function" ? title(item) : item[titleKey] || t("author.studio.common.untitled");
        return (
          <article key={item.id} className="book-bible-item">
            <div>
              <strong>{itemTitle}</strong>
              {meta ? <span>{meta(item)}</span> : null}
              {body ? <p>{body(item) || t("author.studio.bookBible.noDetails")}</p> : null}
            </div>
            <div className="book-bible-row-actions">
              <Button type="button" variant="outline" size="sm" onClick={() => onEdit(item)}>{t("author.studio.common.edit")}</Button>
              <Button type="button" variant="outline" size="sm" disabled={busy === `delete-${item.id}`} onClick={() => onDelete(item)}>{t("author.studio.common.delete")}</Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
