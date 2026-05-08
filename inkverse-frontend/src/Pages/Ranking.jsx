import { useContext, useEffect, useMemo, useState } from "react";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import "./page-styles/Ranking.css";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";
import Segmented from "@/Shared/ui/Segmented";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import RankingEntryCard from "@/features/ranking/components/RankingEntryCard";
import {
  VERSE_TYPES,
  normalizeVerseType,
  ORIGIN_TYPES,
} from "../Constants/bookEnums";
import { DEFAULT_RANKING_STATE } from "@/features/ranking/ranking.defaults.jsx";
import { buildRankingParams } from "@/features/ranking/utils/buildRankingParams.jsx";
import {
  RANKING_TABS,
  RANKING_TIME_RANGES,
  RANKING_STATUS_OPTIONS,
} from "@/features/ranking/ranking.presets.jsx";

function formatNumber(value) {
  const n = Number(value || 0);

  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (n >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return String(n);
}

function formatDate(value) {
  if (!value) return "Fresh arrival";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fresh arrival";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildMetric(book, preset, timeLabel) {
  const rating = Number(
    book.averageRating ?? book.rating ?? book.AverageRating ?? book.Rating ?? 0,
  ).toFixed(2);
  const reviewsCount = formatNumber(book.reviewsCount ?? book.ReviewsCount ?? 0);
  const totalViews = formatNumber(book.totalViews ?? book.TotalViews ?? 0);
  const createdAt = book.createdAt ?? book.CreatedAt;

  switch (preset.key) {
    case "mostViewed":
      return {
        label: `View momentum · ${timeLabel}`,
        value: `${totalViews} views`,
      };
    case "mostReviewed":
      return {
        label: `Conversation · ${timeLabel}`,
        value: `${reviewsCount} reviews`,
      };
    case "new":
      return {
        label: "Recently added",
        value: formatDate(createdAt),
      };
    case "topRated":
    default:
      return {
        label: `Reader score · ${timeLabel}`,
        value: `${rating} average`,
      };
  }
}

export default function Ranking() {
  /** @type {import("@/features/ranking/ranking.types").RankingQuery} */
  const [query, setQuery] = useState(DEFAULT_RANKING_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;
  const [libraryItems, setLibraryItems] = useState([]);
  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 0,
  });

  const inLib = (bookId) =>
    libraryItems.some((item) => (item.bookId ?? item.book?.id) === bookId);

  useEffect(() => {
    loadLibrary();
  }, [myUserId]);

  const loadLibrary = async () => {
    if (!myUserId) {
      setLibraryItems([]);
      return;
    }

    try {
      const response = await api.get("/me/library");
      setLibraryItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLibraryItems([]);
    }
  };

  const { params, preset } = useMemo(() => buildRankingParams(query), [query]);

  const loadRanked = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/books/browse", { params });
      const result = response.data || {};
      const pageSize = result.pageSize ?? 20;
      const totalCount = result.totalCount ?? 0;

      setData({
        ...result,
        items: result.items || [],
        pageSize,
        totalCount,
        totalPages: result.totalPages ?? Math.ceil(totalCount / pageSize),
      });
    } catch (requestError) {
      console.error(requestError);
      setError("Failed to load ranking.");
      setData((prev) => ({ ...prev, items: [], totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const toggleLibrary = async (bookObj) => {
    if (!myUserId) return;

    const bookId = bookObj?.id ?? bookObj?.Id;
    if (!bookId) return;

    try {
      if (inLib(bookId)) await api.delete(`/books/${bookId}/library`);
      else await api.post(`/books/${bookId}/library`);
      await loadLibrary();
    } catch (requestError) {
      console.error("toggleLibrary failed", requestError);
    }
  };

  const tabOptions = useMemo(
    () => RANKING_TABS.map((tab) => ({ value: tab.key, label: tab.label })),
    [],
  );

  const timeOptions = useMemo(
    () => RANKING_TIME_RANGES.map((timeRange) => ({
      value: timeRange.key,
      label: timeRange.label,
    })),
    [],
  );

  const timeLabel =
    RANKING_TIME_RANGES.find((timeRange) => timeRange.key === query.timeRange)?.label ??
    "All Time";

  const items = data.items || [];
  const totalCount = Number(data.totalCount || 0);
  const currentPage = Number(data.pageNumber || query.pageNumber || 1);
  const totalPages = Number(data.totalPages || 0);
  const pageSize = Number(data.pageSize || 20);
  const resultStart = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const resultEnd = totalCount === 0 ? 0 : resultStart + items.length - 1;
  const rankOffset = (currentPage - 1) * pageSize;
  const showSpotlight = currentPage === 1 && items.length > 0;
  const spotlightItems = showSpotlight ? items.slice(0, 3) : [];
  const boardItems = showSpotlight ? items.slice(3) : items;

  const boardSubtitle =
    totalCount > 0
      ? `Showing ranks ${resultStart}-${resultEnd} out of ${totalCount} stories in the current board.`
      : "Switch lanes, narrow the shelf, or open a different time window to populate the board.";

  return (
    <section className="iv-ranking-page">
      <div className="iv-ranking-shell">
        <section className="iv-ranking-deck">
          <div className="iv-ranking-deck__band">
            <span className="iv-ranking-controlLabel">Leaderboard lane</span>
            <Segmented
              value={query.tab}
              onChange={(value) => setQuery((prev) => ({ ...prev, tab: value, pageNumber: 1 }))}
              options={tabOptions}
            />
          </div>

          <div className="iv-ranking-deck__band">
            <span className="iv-ranking-controlLabel">Time window</span>
            <Segmented
              value={query.timeRange}
              onChange={(value) =>
                setQuery((prev) => ({ ...prev, timeRange: value, pageNumber: 1 }))
              }
              options={timeOptions}
            />
          </div>

          <div className="iv-ranking-deck__filters">
            <div className="iv-ranking-field">
              <span className="iv-ranking-controlLabel">Verse type</span>
              <DropdownSelect
                value={query.verseType}
                onChange={(value) =>
                  setQuery((prev) => ({
                    ...prev,
                    verseType: normalizeVerseType(value),
                    pageNumber: 1,
                  }))
                }
                options={VERSE_TYPES}
                placeholder="All Verse Types"
              />
            </div>

            <div className="iv-ranking-field">
              <span className="iv-ranking-controlLabel">Origin</span>
              <DropdownSelect
                value={query.originType}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, originType: value, pageNumber: 1 }))
                }
                options={ORIGIN_TYPES}
                placeholder="All Origins"
              />
            </div>

            <div className="iv-ranking-field">
              <span className="iv-ranking-controlLabel">Status</span>
              <DropdownSelect
                value={query.status}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, status: value, pageNumber: 1 }))
                }
                options={RANKING_STATUS_OPTIONS}
                placeholder="All Status"
              />
            </div>
          </div>
        </section>

        <section className="iv-ranking-results">
          <div className="iv-ranking-results__head">
            <div>
              <span className="iv-ranking-sectionKicker">Current board</span>
              <h2 className="iv-ranking-sectionTitle">
                {preset.label} · {timeLabel}
              </h2>
              <p className="iv-ranking-sectionText">{boardSubtitle}</p>
            </div>

            <div className="iv-ranking-results__meta">
              <span className="iv-ranking-chip">{items.length} on this page</span>
              <span className="iv-ranking-chip">{currentPage}/{Math.max(totalPages, 1)} pages</span>
            </div>
          </div>

          {loading ? (
            <LoadingState text="Loading ranking..." />
          ) : error ? (
            <ErrorState subtitle={error} onRetry={loadRanked} />
          ) : items.length === 0 ? (
            <EmptyState title="No ranked stories yet" subtitle="Try changing filters." />
          ) : (
            <>
              {spotlightItems.length > 0 ? (
                <div className="iv-ranking-spotlight">
                  {spotlightItems.map((book, index) => (
                    <RankingEntryCard
                      key={book.id ?? book.Id}
                      book={book}
                      rank={rankOffset + index + 1}
                      metric={buildMetric(book, preset, timeLabel)}
                      featured
                      isBookmarked={inLib(book.id ?? book.Id)}
                      onToggleBookmark={toggleLibrary}
                    />
                  ))}
                </div>
              ) : null}

              {boardItems.length > 0 ? (
                <div className="iv-ranking-list">
                  {boardItems.map((book, index) => (
                    <RankingEntryCard
                      key={book.id ?? book.Id}
                      book={book}
                      rank={rankOffset + spotlightItems.length + index + 1}
                      metric={buildMetric(book, preset, timeLabel)}
                      isBookmarked={inLib(book.id ?? book.Id)}
                      onToggleBookmark={toggleLibrary}
                    />
                  ))}
                </div>
              ) : null}

              <div className="iv-ranking-results__pager">
                <Pager
                  pageNumber={data.pageNumber}
                  totalPages={data.totalPages}
                  onPage={(page) => {
                    setQuery((prev) => ({ ...prev, pageNumber: page }));
                    setData((prev) => ({ ...prev, pageNumber: page }));
                  }}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
