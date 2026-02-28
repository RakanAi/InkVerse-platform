import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/api";
import "./page-styles/Trends.css";

import CardTop from "../Componenets/TrendComp/CardTop";
import CardTopcard from "../Componenets/TrendComp/CardTopcard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

// Shared UI
import PageHeader from "@/Shared/ui/PageHeader";
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
import { shuffle } from "@/features/trends/utils/shuffle";
import { applyTrendSort } from "@/features/trends/utils/applyTrendSort";

export default function TrendsPage() {
  const nav = useNavigate();

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
      setTrends(list);
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

  const openTrend = (t) => nav(`/trend/${t.id}`);

  // Featured trends for carousel (random)
  const featured = useMemo(() => {
    const active = trends.filter((t) => t.isActive !== false);
    return shuffle(active).slice(
      0,
      Math.min(TREND_FEATURED_COUNT, active.length),
    );
  }, [trends]);

  const sortedTrends = useMemo(() => {
    return applyTrendSort(trends, query.sortBy);
  }, [trends, query.sortBy]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedTrends.length / TREND_PAGE_SIZE));
  }, [sortedTrends.length]);

  const pageTrends = useMemo(() => {
    const start = (query.pageNumber - 1) * TREND_PAGE_SIZE;
    return sortedTrends.slice(start, start + TREND_PAGE_SIZE);
  }, [sortedTrends, query.pageNumber]);

  useEffect(() => {
    if (query.pageNumber > totalPages) {
      setQuery((p) => ({ ...p, pageNumber: totalPages }));
    }
    if (query.pageNumber < 1) {
      setQuery((p) => ({ ...p, pageNumber: 1 }));
    }
  }, [totalPages, query.pageNumber]);

  return (
    <div className="container py-3" style={{ textAlign: "center" }}>
      {/* Keep old centered structure, but use new header component */}
      <div style={{ textAlign: "center" }}>
        <PageHeader title="Trending Concepts" subtitle="Curated collections" />
      </div>

      {/* HERO */}
      {!loading && featured.length > 0 ? (
        <div
          id="trendHeroCarousel"
          className="carousel slide mb-4"
          data-bs-ride="carousel"
          data-bs-interval="4500"
          data-bs-touch="true"
        >
          <div className="carousel-inner">
            {featured.map((t, idx) => (
              <div
                key={t.id}
                className={`carousel-item ${idx === 0 ? "active" : ""}`}
              >
                <CardTop
                  trend={t}
                  variant="hero"
                  onClick={() => openTrend(t)}
                />
              </div>
            ))}
          </div>

          {featured.length > 1 ? (
            <>
              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#trendHeroCarousel"
                data-bs-slide="prev"
                aria-label="Previous"
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                />
              </button>

              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#trendHeroCarousel"
                data-bs-slide="next"
                aria-label="Next"
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                />
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {/* LIST HEADER + SORT */}
      <div className="iv-panel" style={{ textAlign: "left" }}>
        <div className="d-flex align-items-center justify-content-between">
          <div className="align-items-center gap-2">
            <span className="borderStart"></span>
            <h5 className="m-0">List</h5>
          </div>

          <div className="trend-sort">
            <span className="trend-sort-label">Sort</span>
            <DropdownSelect
              className="trend-sort-dd"
              value={query.sortBy}
              onChange={(v) =>
                setQuery((p) => ({ ...p, sortBy: v, pageNumber: 1 }))
              }
              options={TREND_SORT_OPTIONS}
              placeholder="Sort"
            />
          </div>
        </div>
      </div>

      <hr /><br />

      <div className="mt-3">
        {loading ? (
          <LoadingState text="Loading trends..." />
        ) : error ? (
          <ErrorState subtitle={error} onRetry={loadTrends} />
        ) : sortedTrends.length === 0 ? (
          <EmptyState title="No trends" subtitle="No trends yet." />
        ) : (
          <>
            <div className="row g-3 justify-content-between">
              {pageTrends.map((t) => (
                <div className="col-auto mx-auto" key={t.id}>
                  <CardTopcard
                    trend={t}
                    variant="list"
                    onClick={() => openTrend(t)}
                  />
                </div>
              ))}
            </div>

            <Pager
              pageNumber={query.pageNumber}
              totalPages={totalPages}
              onPage={(p) => setQuery((prev) => ({ ...prev, pageNumber: p }))}
            />
          </>
        )}
      </div>
    </div>
  );
}
