import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import "./page-styles/TrendDetails.css";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LinkButton from "@/Shared/ui/LinkButton";

import BrowseBookCard from "@/Shared/Books/brows-book-card/BrowseBookCard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

import {
  TREND_DETAILS,
  getTrendSort,
} from "@/features/trends/details/trend-details.presets";
import { parseTrendId } from "@/features/trends/details/utils/parseTrendId";
import { getSortConfig } from "@/features/trends/details/utils/getSortConfig";
import {
  getTrendImageSrc,
  normalizeTrendPreview,
} from "@/features/trends/trend.models";

export default function TrendDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const trendId = useMemo(() => parseTrendId(id), [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trend, setTrend] = useState(null);

  // Sorting (server-side via /books/browse)
  const [sortKey, setSortKey] = useState("newest");

  // for DropdownSelect (shared)
  const trendSort = useMemo(() => getTrendSort(t), [t]);
  const sortOptions = trendSort.map((o) => ({
    value: o.key,
    label: o.label,
  }));

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);

  const [data, setData] = useState({
    items: [],
    pageNumber: 1,
    pageSize: TREND_DETAILS.pageSize,
    totalCount: 0,
    totalPages: 0,
  });

  // Library
  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  const [libraryItems, setLibraryItems] = useState([]);
  const inLib = useCallback(
    (bookId) => libraryItems.some((x) => (x.bookId ?? x.book?.id) === bookId),
    [libraryItems],
  );

  const loadLibrary = useCallback(async () => {
    if (!myUserId) {
      setLibraryItems([]);
      return;
    }
    try {
      const res = await api.get("/me/library");
      setLibraryItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLibraryItems([]);
    }
  }, [myUserId]);

  const loadTrend = useCallback(async () => {
    try {
      setTrend(null);
      const res = await api.get("/trends");
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
          ? res.data.items
          : [];
      const found =
        list
          .map(normalizeTrendPreview)
          .find((entry) => Number(entry.id) === trendId) || null;
      setTrend(found);
    } catch (e) {
      console.error("Failed to load trend", e);
      setTrend(null);
    }
  }, [trendId]);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const sort = getSortConfig(sortKey);

      const res = await api.get("/books/browse", {
        params: {
          trendId,
          pageNumber,
          pageSize: TREND_DETAILS.pageSize,
          sortBy: sort.sortBy,
          isAscending: sort.isAscending,
        },
      });

      const r = res.data || {};
      const pageSizeRes = r.pageSize ?? TREND_DETAILS.pageSize;
      const totalCount = r.totalCount ?? 0;

      setData({
        ...r,
        items: r.items || [],
        pageSize: pageSizeRes,
        totalCount,
        totalPages: r.totalPages ?? Math.ceil(totalCount / pageSizeRes),
      });
    } catch (e) {
      console.error(e);
      setData({
        items: [],
        pageNumber: 1,
        pageSize: TREND_DETAILS.pageSize,
        totalCount: 0,
        totalPages: 0,
      });
      setError(t("trends.details.loadBooksError"));
    } finally {
      setLoading(false);
    }
  }, [trendId, pageNumber, sortKey, t]);

  useEffect(() => {
    if (!trendId) {
      setError(t("trends.details.invalidId"));
      setLoading(false);
      return;
    }
    loadTrend();
  }, [trendId, loadTrend, t]);

  const toggleLibrary = useCallback(
    async (bookId) => {
      if (!myUserId) return;
      try {
        if (inLib(bookId)) await api.delete(`/books/${bookId}/library`);
        else await api.post(`/books/${bookId}/library`);
        await loadLibrary();
      } catch (e) {
        console.error("toggleLibrary failed", e);
      }
    },
    [myUserId, inLib, loadLibrary],
  );

  // Validate trendId once
 

  // Load books when filters change (ONLY ONCE)
  useEffect(() => {
    if (!trendId) return;
    loadBooks();
  }, [trendId, pageNumber, sortKey, loadBooks]);

  // Load library when user changes
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const items = data.items || [];
  const trendName = trend?.name || t("trends.details.trendFallback");
  const trendDesc =
    trend?.description?.trim() || t("trends.details.descriptionFallback");
  const trendImage = getTrendImageSrc(trend);
  const trendBadge = trend?.slug
    ? `#${trend.slug.replace(/[-_]+/g, " ")}`
    : t("trends.details.badgeFallback");
  const currentSortLabel =
    sortOptions.find((option) => option.value === sortKey)?.label ||
    t("trends.details.currentSortFallback");

  return (
    <div className="iv-trend-detail-page">
      <div className="iv-trend-detail-shell">
        <section
          className="iv-trend-detail-hero"
          style={
            trendImage
              ? {
                  backgroundImage: `linear-gradient(180deg, rgba(8, 12, 28, 0.18), rgba(7, 10, 22, 0.82)), url(${trendImage})`,
                }
              : undefined
          }
        >
          {!trendImage ? (
            <div className="iv-trend-detail-hero__fallback" aria-hidden="true">
              <span>{trendName.slice(0, 1).toUpperCase()}</span>
            </div>
          ) : null}

          <div className="iv-trend-detail-hero__shade" />

          <div className="iv-trend-detail-hero__panel">
            <div className="iv-trend-detail-hero__badges">
              <span className="iv-trend-detail-badge">{t("trends.details.heroBadge")}</span>
              <span className="iv-trend-detail-badge iv-trend-detail-badge--ghost">
                {trendBadge}
              </span>
            </div>

            <div className="iv-trend-detail-hero__copy">
              <h1 className="iv-trend-detail-title">{trendName}</h1>
              <p className="iv-trend-detail-text">{trendDesc}</p>
            </div>

            <div className="iv-trend-detail-hero__meta">
              <div className="iv-trend-detail-stat">
                <span className="iv-trend-detail-stat__label">{t("trends.details.linkedBooks")}</span>
                <strong className="iv-trend-detail-stat__value">
                  {data.totalCount || items.length}
                </strong>
              </div>

              <div className="iv-trend-detail-stat">
                <span className="iv-trend-detail-stat__label">{t("trends.details.currentSort")}</span>
                <strong className="iv-trend-detail-stat__value">
                  {currentSortLabel}
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="iv-trend-detail-toolbar">
          <div className="iv-trend-detail-toolbar__copy">
            <span className="iv-trend-detail-kicker">{t("trends.details.toolbarKicker")}</span>
            <h2 className="iv-trend-detail-toolbar__title">{t("trends.details.toolbarTitle")}</h2>
            <p className="iv-trend-detail-toolbar__text">{t("trends.details.toolbarText")}</p>
          </div>

          <div className="iv-trend-detail-toolbar__actions">
            <DropdownSelect
              className="iv-trend-detail-toolbar__select"
              value={sortKey}
              options={sortOptions}
              onChange={(value) => {
                setSortKey(value);
                setPageNumber(1);
              }}
              placeholder={t("trends.details.sortPlaceholder")}
            />
            <LinkButton to="/trend" variant="outline" size="sm">
              {t("trends.details.backToTrends")}
            </LinkButton>
          </div>
        </section>

        {loading ? (
          <LoadingState text={t("trends.details.loadingBooks")} />
        ) : error ? (
          <ErrorState title={t("trends.details.errorTitle")} subtitle={error} />
        ) : items.length === 0 ? (
          <section className="iv-trend-detail-empty">
            <EmptyState
              title={t("trends.details.emptyTitle")}
              subtitle={t("trends.details.emptySubtitle")}
              action={
                <LinkButton to="/trend" variant="outline" size="sm">
                  {t("trends.details.backToAllTrends")}
                </LinkButton>
              }
            />
          </section>
        ) : (
          <>
            <section className="iv-trend-detail-results">
              <div className="iv-trend-detail-results__head">
                <span className="iv-trend-detail-kicker">{t("trends.details.linkedShelf")}</span>
                <p className="iv-trend-detail-results__text">
                  {t("trends.details.resultsText", {
                    shown: items.length,
                    total: data.totalCount,
                  })}
                </p>
              </div>

              <div className="iv-trend-detail-grid">
                {items.map((book) => (
                  <div className="iv-trend-detail-grid__item" key={book.id ?? book.Id}>
                    <BrowseBookCard
                      book={book}
                      isBookmarked={inLib(book.id ?? book.Id)}
                      onToggleBookmark={() => toggleLibrary(book.id ?? book.Id)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <div className="iv-trend-detail-pager">
              <Pager
                pageNumber={data.pageNumber}
                totalPages={data.totalPages}
                onPage={setPageNumber}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
