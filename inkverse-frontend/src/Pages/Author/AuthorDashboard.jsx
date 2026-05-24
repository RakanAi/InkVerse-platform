import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiBookOpen,
  FiEye,
  FiFileText,
  FiLayers,
  FiStar,
} from "react-icons/fi";
import LinkButton from "../../Shared/ui/LinkButton";
import Surface from "../../Shared/ui/Surface";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import {
  formatCompactNumber,
  formatRating,
  formatStatusLabel,
  formatStudioDate,
  getBookCover,
  getBookDescription,
  getBookId,
  getBookTitle,
} from "../../features/author/author.utils";
import { fetchMyBooks } from "./authorApi";

function readNumber(book, keys) {
  for (const key of keys) {
    const raw = book?.[key];
    if (raw === undefined || raw === null || raw === "") continue;
    const value = Number(raw);
    if (Number.isFinite(value)) return value;
  }

  return null;
}

function readText(book, keys, fallback = "") {
  for (const key of keys) {
    const raw = book?.[key];
    if (raw !== undefined && raw !== null && String(raw).trim()) {
      return String(raw);
    }
  }

  return fallback;
}

function readDate(book, keys) {
  const value = readText(book, keys);
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function formatNumber(value, t) {
  return value === null ? t("author.studio.common.notAvailable") : formatCompactNumber(value);
}

function formatMaybeRating(value, t) {
  return value === null ? t("author.studio.common.notAvailable") : formatRating(value);
}

function formatMaybeDate(value, t) {
  return value ? formatStudioDate(value) : t("author.studio.common.noDate");
}

function sumBooks(books, keys) {
  let hasValue = false;
  const total = books.reduce((sum, book) => {
    const value = readNumber(book, keys);
    if (value === null) return sum;
    hasValue = true;
    return sum + value;
  }, 0);

  return hasValue ? total : null;
}

function averageBooks(books, keys) {
  const values = books
    .map((book) => readNumber(book, keys))
    .filter((value) => value !== null);

  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getBookMetrics(book) {
  return {
    chapters: readNumber(book, ["chapterCount", "ChapterCount", "chaptersCount", "ChaptersCount"]),
    collections: readNumber(book, ["collectionCount", "CollectionCount", "collections", "Collections"]),
    rating: readNumber(book, ["averageRating", "AverageRating", "rating", "Rating"]),
    views: readNumber(book, ["totalViews", "TotalViews", "viewCount", "ViewCount"]),
    words: readNumber(book, ["wordCount", "WordCount"]),
  };
}

function makeBookOptionId(book, index) {
  const bookId = getBookId(book);
  return bookId ? `book-${bookId}` : `book-index-${index}`;
}

function StatTile({ icon, label, value, note }) {
  return (
    <Surface className="ink-author-stat">
      <span className="ink-author-stat__icon">
        {icon}
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note ? <small>{note}</small> : null}
      </div>
    </Surface>
  );
}

function SelectedBookCard({
  book,
  bookOptions,
  metrics,
  selectedBookId,
  onBookChange,
}) {
  const { t } = useTranslation();
  const title = getBookTitle(book);
  const cover = getBookCover(book);
  const description = getBookDescription(book);
  const bookId = getBookId(book);
  const status = formatStatusLabel(readText(book, ["status", "Status"], t("author.studio.common.ongoing")));
  const verseType = readText(book, ["verseType", "VerseType"], t("author.studio.common.original"));
  const updatedAt = readDate(book, ["updatedAt", "UpdatedAt", "createdAt", "CreatedAt"]);
  const storyRoute = bookId ? `/author/workspace/${bookId}` : "/author/workspace";
  const newChapterRoute = bookId ? `${storyRoute}/chapters/new` : "/author/workspace";

  return (
    <Surface className="ink-author-book-card">
      <div className="ink-author-book-card__cover">
        {cover ? <img src={cover} alt={title} /> : <span>{title.slice(0, 1)}</span>}
      </div>

      <div className="ink-author-book-card__body">
        <div className="ink-author-book-card__eyebrow">{t("author.studio.dashboard.currentStory")}</div>
        <h1>{title}</h1>
        <p>{description || t("author.studio.common.noSynopsisDetail")}</p>
        <div className="ink-author-book-card__chips">
          <span>{verseType}</span>
          <span>{status}</span>
          <span>{t("author.studio.dashboard.updated", { date: formatMaybeDate(updatedAt, t) })}</span>
        </div>
        <div className="ink-author-book-card__actions">
          <LinkButton to={storyRoute} variant="primary" size="sm">
            {t("author.studio.dashboard.openStory")}
          </LinkButton>
          <LinkButton to={newChapterRoute} variant="outline" size="sm">
            {t("author.studio.dashboard.newChapter")}
          </LinkButton>
        </div>
      </div>

      <div className="ink-author-book-card__side">
        <label htmlFor="author-dashboard-book">
          <span>{t("author.studio.dashboard.viewBook")}</span>
          <select
            id="author-dashboard-book"
            value={selectedBookId}
            onChange={onBookChange}
          >
            {bookOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {getBookTitle(option.book)}
              </option>
            ))}
          </select>
        </label>

        <div className="ink-author-book-card__metrics">
          <div>
            <span>{t("author.studio.common.chapters")}</span>
            <strong>{formatNumber(metrics.chapters, t)}</strong>
          </div>
          <div>
            <span>{t("author.studio.common.words")}</span>
            <strong>{formatNumber(metrics.words, t)}</strong>
          </div>
          <div>
            <span>{t("author.studio.common.views")}</span>
            <strong>{formatNumber(metrics.views, t)}</strong>
          </div>
          <div>
            <span>{t("author.studio.common.rating")}</span>
            <strong>{formatMaybeRating(metrics.rating, t)}</strong>
          </div>
        </div>
      </div>
    </Surface>
  );
}

function StoryShelf({ books }) {
  const { t } = useTranslation();

  return (
    <Surface className="ink-author-panel ink-author-panel--stories">
      <div className="ink-author-panel__head">
        <div>
          <span>{t("author.studio.dashboard.storyShelf")}</span>
          <h2>{t("author.studio.dashboard.yourBooks")}</h2>
        </div>
        <Link to="/author/workspace">{t("author.studio.dashboard.workspace")}</Link>
      </div>

      <div className="ink-author-story-list">
        {books.slice(0, 6).map((book) => {
          const title = getBookTitle(book);
          const cover = getBookCover(book);
          const bookId = getBookId(book);
          const metrics = getBookMetrics(book);
          const status = formatStatusLabel(readText(book, ["status", "Status"], t("author.studio.common.ongoing")));

          return (
            <Link
              key={bookId || title}
              to={bookId ? `/author/workspace/${bookId}` : "/author/workspace"}
              className="ink-author-story-row"
            >
              <div className="ink-author-story-row__cover">
                {cover ? <img src={cover} alt={title} /> : <span>{title.slice(0, 1)}</span>}
              </div>
              <div className="ink-author-story-row__main">
                <strong>{title}</strong>
                <span>{status}</span>
              </div>
              <div className="ink-author-story-row__meta">
                <span>{t("author.studio.dashboard.units.chapters", { value: formatNumber(metrics.chapters, t) })}</span>
                <span>{t("author.studio.dashboard.units.words", { value: formatNumber(metrics.words, t) })}</span>
                <span>{t("author.studio.dashboard.units.views", { value: formatNumber(metrics.views, t) })}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </Surface>
  );
}

function FocusPanel({ book, metrics }) {
  const { t } = useTranslation();
  const title = getBookTitle(book);
  const cover = getBookCover(book);
  const description = getBookDescription(book);
  const updatedAt = readDate(book, ["updatedAt", "UpdatedAt", "createdAt", "CreatedAt"]);
  const bookId = getBookId(book);
  const storyRoute = bookId ? `/author/workspace/${bookId}` : "/author/workspace";

  const checks = [
    {
      label: t("author.studio.common.cover"),
      value: cover ? t("author.studio.dashboard.ready") : t("author.studio.dashboard.missing"),
      detail: cover ? t("author.studio.dashboard.coverReady") : t("author.studio.dashboard.coverMissing"),
    },
    {
      label: t("author.studio.common.synopsis"),
      value: description ? t("author.studio.dashboard.ready") : t("author.studio.dashboard.missing"),
      detail: description ? t("author.studio.dashboard.synopsisReady") : t("author.studio.dashboard.synopsisMissing"),
    },
    {
      label: t("author.studio.common.chapters"),
      value: metrics.chapters === null ? t("author.studio.common.notAvailable") : formatCompactNumber(metrics.chapters),
      detail:
        metrics.chapters && metrics.chapters > 0
          ? t("author.studio.dashboard.chaptersReady")
          : t("author.studio.dashboard.chaptersMissing"),
    },
    {
      label: t("author.studio.dashboard.lastUpdate"),
      value: formatMaybeDate(updatedAt, t),
      detail: updatedAt
        ? t("author.studio.dashboard.hasSavedDate", { title })
        : t("author.studio.dashboard.noUpdateDate"),
    },
  ];

  return (
    <Surface className="ink-author-panel">
      <div className="ink-author-panel__head">
        <div>
          <span>{t("author.studio.dashboard.focus")}</span>
          <h2>{t("author.studio.dashboard.storyReadiness")}</h2>
        </div>
        <Link to={storyRoute}>{t("author.studio.dashboard.edit")}</Link>
      </div>

      <div className="ink-author-checklist">
        {checks.map((check) => (
          <div key={check.label} className="ink-author-check">
            <div>
              <strong>{check.label}</strong>
              <span>{check.detail}</span>
            </div>
            <b>{check.value}</b>
          </div>
        ))}
      </div>
    </Surface>
  );
}

function EmptyDashboard() {
  const { t } = useTranslation();

  return (
    <Surface className="ink-author-empty">
      <EmptyState
        title={t("author.studio.dashboard.noStoriesTitle")}
        subtitle={t("author.studio.dashboard.noStoriesSubtitle")}
      />
      <LinkButton to="/author/workspace" variant="primary" size="md">
        {t("author.studio.dashboard.openWorkspace")}
      </LinkButton>
    </Surface>
  );
}

export default function AuthorDashboard() {
  const { t } = useTranslation();
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          t("author.studio.dashboard.errors.load"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedBooks = useMemo(
    () =>
      [...books].sort((a, b) => {
        const bDate = readDate(b, ["updatedAt", "UpdatedAt", "createdAt", "CreatedAt"]);
        const aDate = readDate(a, ["updatedAt", "UpdatedAt", "createdAt", "CreatedAt"]);
        return (bDate?.getTime() ?? 0) - (aDate?.getTime() ?? 0);
      }),
    [books],
  );

  const bookOptions = useMemo(
    () => sortedBooks.map((book, index) => ({ id: makeBookOptionId(book, index), book })),
    [sortedBooks],
  );

  const defaultBookId = bookOptions[0]?.id ?? "";

  useEffect(() => {
    if (!bookOptions.length) {
      setSelectedBookId("");
      return;
    }

    setSelectedBookId((current) =>
      bookOptions.some((option) => option.id === current) ? current : defaultBookId,
    );
  }, [bookOptions, defaultBookId]);

  const selectedBook = useMemo(
    () => bookOptions.find((option) => option.id === selectedBookId)?.book ?? bookOptions[0]?.book ?? null,
    [bookOptions, selectedBookId],
  );

  const selectedMetrics = useMemo(
    () => (selectedBook ? getBookMetrics(selectedBook) : getBookMetrics(null)),
    [selectedBook],
  );

  const catalogStats = useMemo(
    () => ({
      stories: books.length,
      words: sumBooks(books, ["wordCount", "WordCount"]),
      views: sumBooks(books, ["totalViews", "TotalViews", "viewCount", "ViewCount"]),
      rating: averageBooks(books, ["averageRating", "AverageRating", "rating", "Rating"]),
    }),
    [books],
  );

  if (loading) return <LoadingState text={t("author.studio.dashboard.loading")} />;
  if (error) {
    return (
      <ErrorState title={t("author.studio.dashboard.unavailable")} subtitle={error} onRetry={load} />
    );
  }

  return (
    <div className="authorx-page ink-author-dashboard">
      {!selectedBook ? (
        <EmptyDashboard />
      ) : (
        <>
          <section className="ink-author-stats">
            <StatTile
              icon={<FiBookOpen size={17} />}
              label={t("author.studio.common.stories")}
              value={formatCompactNumber(catalogStats.stories)}
              note={t("author.studio.dashboard.stats.storiesNote")}
            />
            <StatTile
              icon={<FiFileText size={17} />}
              label={t("author.studio.common.words")}
              value={formatNumber(catalogStats.words, t)}
              note={t("author.studio.dashboard.stats.wordsNote")}
            />
            <StatTile
              icon={<FiEye size={17} />}
              label={t("author.studio.common.views")}
              value={formatNumber(catalogStats.views, t)}
              note={t("author.studio.dashboard.stats.viewsNote")}
            />
            <StatTile
              icon={<FiStar size={17} />}
              label={t("author.studio.common.rating")}
              value={formatMaybeRating(catalogStats.rating, t)}
              note={t("author.studio.dashboard.stats.ratingNote")}
            />
          </section>

          <SelectedBookCard
            book={selectedBook}
            bookOptions={bookOptions}
            metrics={selectedMetrics}
            selectedBookId={selectedBookId}
            onBookChange={(event) => setSelectedBookId(event.target.value)}
          />

          <section className="ink-author-grid">
            <StoryShelf books={sortedBooks} />
            <FocusPanel book={selectedBook} metrics={selectedMetrics} />
          </section>

          <Surface className="ink-author-panel ink-author-panel--note">
            <span className="ink-author-panel__icon">
              <FiLayers size={18} />
            </span>
            <div>
              <strong>{t("author.studio.dashboard.performanceTitle")}</strong>
              <p>{t("author.studio.dashboard.performanceText")}</p>
            </div>
            <LinkButton to="/author/income" variant="ghost" size="sm">
              {t("author.studio.dashboard.performance")}
            </LinkButton>
          </Surface>
        </>
      )}
    </div>
  );
}
