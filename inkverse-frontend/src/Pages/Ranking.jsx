import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  getRankingTabs,
  getRankingTimeRanges,
  getRankingStatusOptions,
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
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildMetric(t, book, preset, timeLabel) {
  const rating = Number(
    book.averageRating ?? book.rating ?? book.AverageRating ?? book.Rating ?? 0,
  ).toFixed(2);
  const reviewsCount = formatNumber(book.reviewsCount ?? book.ReviewsCount ?? 0);
  const totalViews = formatNumber(book.totalViews ?? book.TotalViews ?? 0);
  const createdAt = book.createdAt ?? book.CreatedAt;

  switch (preset.key) {
    case "mostViewed":
      return {
        label: t("ranking.page.viewMomentum", { timeLabel }),
        value: t("ranking.page.views", { count: totalViews }),
      };
    case "mostReviewed":
      return {
        label: t("ranking.page.conversation", { timeLabel }),
        value: t("ranking.page.reviews", { count: reviewsCount }),
      };
    case "new":
      return {
        label: t("ranking.page.recentlyAdded"),
        value: formatDate(createdAt) || t("ranking.page.freshArrival"),
      };
    case "topRated":
    default:
      return {
        label: t("ranking.page.readerScore", { timeLabel }),
        value: t("ranking.page.average", { rating }),
      };
  }
}

export default function Ranking() {
  const { t } = useTranslation();
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
      setError(t("ranking.page.loadError"));
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

  const rankingTabs = useMemo(() => getRankingTabs(t), [t]);
  const rankingTimeRanges = useMemo(() => getRankingTimeRanges(t), [t]);
  const rankingStatusOptions = useMemo(() => getRankingStatusOptions(t), [t]);
  const tabOptions = useMemo(
    () => rankingTabs.map((tab) => ({ value: tab.key, label: tab.label })),
    [rankingTabs],
  );

  const timeOptions = useMemo(
    () => rankingTimeRanges.map((timeRange) => ({
      value: timeRange.key,
      label: timeRange.label,
    })),
    [rankingTimeRanges],
  );

  const timeLabel =
    rankingTimeRanges.find((timeRange) => timeRange.key === query.timeRange)?.label ??
    t("ranking.timeRanges.All");

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
      ? t("ranking.page.boardSubtitle", {
          start: resultStart,
          end: resultEnd,
          total: totalCount,
        })
      : t("ranking.page.emptyBoardSubtitle");

  return (
    <section className="iv-ranking-page">
      <div className="iv-ranking-shell">
        <section className="iv-ranking-deck">
          <div className="iv-ranking-deck__band">
            <span className="iv-ranking-controlLabel">{t("ranking.page.laneLabel")}</span>
            <Segmented
              value={query.tab}
              onChange={(value) => setQuery((prev) => ({ ...prev, tab: value, pageNumber: 1 }))}
              options={tabOptions}
            />
          </div>

          <div className="iv-ranking-deck__band">
            <span className="iv-ranking-controlLabel">{t("ranking.page.timeLabel")}</span>
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
              <span className="iv-ranking-controlLabel">{t("ranking.page.verseType")}</span>
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
                placeholder={t("ranking.page.verseType")}
              />
            </div>

            <div className="iv-ranking-field">
              <span className="iv-ranking-controlLabel">{t("ranking.page.origin")}</span>
              <DropdownSelect
                value={query.originType}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, originType: value, pageNumber: 1 }))
                }
                options={ORIGIN_TYPES}
                placeholder={t("ranking.page.origin")}
              />
            </div>

            <div className="iv-ranking-field">
              <span className="iv-ranking-controlLabel">{t("ranking.page.status")}</span>
              <DropdownSelect
                value={query.status}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, status: value, pageNumber: 1 }))
                }
                options={rankingStatusOptions}
                placeholder={t("ranking.page.statusPlaceholder")}
              />
            </div>
          </div>
        </section>

        <section className="iv-ranking-results">
          <div className="iv-ranking-results__head">
            <div>
              <span className="iv-ranking-sectionKicker">{t("ranking.page.currentBoard")}</span>
              <h2 className="iv-ranking-sectionTitle">
                {preset.label} · {timeLabel}
              </h2>
              <p className="iv-ranking-sectionText">{boardSubtitle}</p>
            </div>

            <div className="iv-ranking-results__meta">
              <span className="iv-ranking-chip">
                {t("ranking.page.onThisPage", { count: items.length })}
              </span>
              <span className="iv-ranking-chip">
                {t("ranking.page.pages", {
                  current: currentPage,
                  total: Math.max(totalPages, 1),
                })}
              </span>
            </div>
          </div>

          {loading ? (
            <LoadingState text={t("ranking.page.loading")} />
          ) : error ? (
            <ErrorState subtitle={error} onRetry={loadRanked} />
          ) : items.length === 0 ? (
            <EmptyState
              title={t("ranking.page.emptyTitle")}
              subtitle={t("ranking.page.emptySubtitle")}
            />
          ) : (
            <>
              {spotlightItems.length > 0 ? (
                <div className="iv-ranking-spotlight">
                  {spotlightItems.map((book, index) => (
                    <RankingEntryCard
                      key={book.id ?? book.Id}
                      book={book}
                      rank={rankOffset + index + 1}
                      metric={buildMetric(t, book, preset, timeLabel)}
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
                      metric={buildMetric(t, book, preset, timeLabel)}
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
