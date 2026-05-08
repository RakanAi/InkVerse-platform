import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../Api/api";
import "./page-styles/Trends.css";
import "@/features/trends/components/TrendCards.css";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";

import { DEFAULT_TRENDS_QUERY } from "@/features/trends/trends.defaults";
import {
  TREND_SORT_OPTIONS,
  TREND_PAGE_SIZE,
  TREND_FEATURED_COUNT,
} from "@/features/trends/trends.presets";
import TrendSpotlightCard from "@/features/trends/components/TrendSpotlightCard";
import TrendCollectionCard from "@/features/trends/components/TrendCollectionCard";
import {
  normalizeTrendPreview,
  selectActiveTrends,
  splitTrendCollection,
} from "@/features/trends/trend.models";
import { applyTrendSort } from "@/features/trends/utils/applyTrendSort";

export default function TrendsPage() {
  const [query, setQuery] = useState(DEFAULT_TRENDS_QUERY);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrends = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/trends");
      const list = Array.isArray(res.data) ? res.data : [];
      setTrends(list.map(normalizeTrendPreview));
    } catch (e) {
      console.error("Failed to load trends", e);
      setTrends([]);
      setError("Failed to load trends.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const visibleTrends = useMemo(
    () => selectActiveTrends(trends),
    [trends],
  );

  const sortedTrends = useMemo(
    () => applyTrendSort(visibleTrends, query.sortBy),
    [visibleTrends, query.sortBy],
  );

  const { featured, remainder } = useMemo(
    () => splitTrendCollection(sortedTrends, TREND_FEATURED_COUNT),
    [sortedTrends],
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(remainder.length / TREND_PAGE_SIZE));
  }, [remainder.length]);

  const pageTrends = useMemo(() => {
    const start = (query.pageNumber - 1) * TREND_PAGE_SIZE;
    return remainder.slice(start, start + TREND_PAGE_SIZE);
  }, [remainder, query.pageNumber]);

  useEffect(() => {
    if (query.pageNumber > totalPages) {
      setQuery((p) => ({ ...p, pageNumber: totalPages }));
    }
    if (query.pageNumber < 1) {
      setQuery((p) => ({ ...p, pageNumber: 1 }));
    }
  }, [totalPages, query.pageNumber]);

  return (
    <div className="iv-trends-page">
      <div className="iv-trends-shell">
        <section className="iv-trends-head">
          <div className="iv-trends-head__copy">
            <span className="iv-trends-kicker">Trend shelf</span>
            <h1 className="iv-trends-title">Explore the concepts readers are chasing.</h1>
            <p className="iv-trends-text">
              Move through themed lanes, spotlighted moods, and curated story worlds
              shaping what readers open next.
            </p>
          </div>

          <div className="iv-trends-head__meta">
            <div className="iv-trends-stat">
              <span className="iv-trends-stat__label">Active concepts</span>
              <strong className="iv-trends-stat__value">{visibleTrends.length}</strong>
            </div>

            <div className="iv-trends-sort">
              <span className="iv-trends-sort__label">Sort by</span>
              <DropdownSelect
                value={query.sortBy}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, sortBy: value, pageNumber: 1 }))
                }
                options={TREND_SORT_OPTIONS}
                placeholder="Sort trends"
              />
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingState text="Loading trends..." />
        ) : error ? (
          <ErrorState subtitle={error} onRetry={loadTrends} />
        ) : sortedTrends.length === 0 ? (
          <EmptyState
            title="No trends yet"
            subtitle="Curated concepts will appear here once the shelf is ready."
          />
        ) : (
          <>
            {featured.length > 0 ? (
              <section
                className={`iv-trends-spotlight${featured.length === 1 ? " is-single" : ""}`}
              >
                <TrendSpotlightCard
                  trend={featured[0]}
                  badge="Lead concept"
                />

                {featured.length > 1 ? (
                  <div className="iv-trends-spotlight__stack">
                    {featured.slice(1).map((trend) => (
                      <TrendSpotlightCard
                        key={trend.id}
                        trend={trend}
                        compact
                        badge="On the rise"
                      />
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {remainder.length > 0 ? (
              <section className="iv-trends-library">
                <div className="iv-trends-library__head">
                  <div className="iv-trends-library__copy">
                    <span className="iv-trends-kicker">All concepts</span>
                    <h2 className="iv-trends-library__title">Keep exploring the shelf.</h2>
                    <p className="iv-trends-library__text">
                      Showing {pageTrends.length} of {remainder.length} curated trend
                      {remainder.length === 1 ? "" : "s"} beyond the current spotlight.
                    </p>
                  </div>
                </div>

                <div className="iv-trends-grid">
                  {pageTrends.map((trend) => (
                    <TrendCollectionCard key={trend.id} trend={trend} />
                  ))}
                </div>

                <div className="iv-trends-pager">
                  <Pager
                    pageNumber={query.pageNumber}
                    totalPages={totalPages}
                    onPage={(page) =>
                      setQuery((prev) => ({ ...prev, pageNumber: page }))
                    }
                  />
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
