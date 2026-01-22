import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Api/api";

import CardTop from "../Componenets/TrendComp/CardTop";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";
import CardTopcard from "../Componenets/TrendComp/CardTopcard";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TrendsPage() {
  const nav = useNavigate();

  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sorting for the list
  const [sortBy, setSortBy] = useState("sortOrder");

  // Pagination for the list
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 12; // list cards per page (tweak)

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/trends");
        const list = Array.isArray(res.data) ? res.data : [];
        if (alive) setTrends(list);
      } catch (e) {
        console.error("Failed to load trends", e);
        if (alive) setTrends([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, []);

  // Featured trends for carousel (random)
  const featured = useMemo(() => {
    const active = trends.filter((t) => t.isActive !== false);
    return shuffle(active).slice(0, Math.min(5, active.length));
  }, [trends]);

  const sortedTrends = useMemo(() => {
    const list = [...trends];

    if (sortBy === "newest") {
      return list.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );
    }

    if (sortBy === "az") {
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    // default: sortOrder asc, then name
    return list.sort((a, b) => {
      const ao = a.sortOrder ?? 0;
      const bo = b.sortOrder ?? 0;
      if (ao !== bo) return ao - bo;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [trends, sortBy]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedTrends.length / pageSize));
  }, [sortedTrends.length]);

  const pageTrends = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return sortedTrends.slice(start, start + pageSize);
  }, [sortedTrends, pageNumber]);

  useEffect(() => {
    if (pageNumber > totalPages) setPageNumber(totalPages);
    if (pageNumber < 1) setPageNumber(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const openTrend = (t) => nav(`/trend/${t.id}`);

  return (
    <div className="container py-3">
      <div className="d-flex flex-wrap gap-2 align-items-end justify-content-between mb-3">
        <div>
          <h3 className="m-0">Trending Concepts</h3>
          <div className="text-muted small">Curated collections</div>
        </div>

        {/* <div className="d-flex gap-2 align-items-center">
          <span className="text-muted small">Sort</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 200 }}
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPageNumber(1);
            }}
          >
            <option value="sortOrder">Default (Sort Order)</option>
            <option value="newest">Newest</option>
            <option value="az">A → Z</option>
          </select>
        </div> */}
      </div>

      {/* BOOTSTRAP 5 CAROUSEL HERO */}
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
                {/* Put your CardTop inside the slide */}
                <CardTop
                  trend={t}
                  variant="hero"
                  onClick={() => openTrend(t)}
                />
              </div>
            ))}
          </div>

          {/* controls only if >1 */}
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
      ) : loading ? (
        <div className="text-muted mb-4">Loading…</div>
      ) : null}

      {/* LIST */}
      {!loading && sortedTrends.length === 0 ? (
        <div className="text-muted">No trends yet.</div>
      ) : !loading ? (
        <>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex">
              <span className="borderStart"></span>
              <h5 className=" mt-2">List</h5>
            </div>
            <div className="d-flex gap-2 align-items-center justify-content-end">
              <span className="text-muted small">Sort</span>
              <select
                className="form-select form-select-sm"
                style={{ width: 200 }}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPageNumber(1);
                }}
              >
                <option value="sortOrder">Default (Sort Order)</option>
                <option value="newest">Newest</option>
                <option value="az">A → Z</option>
              </select>
            </div>{" "}
          </div>
          <hr />
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
            pageNumber={pageNumber}
            totalPages={totalPages}
            onPage={setPageNumber}
          />
        </>
      ) : null}
    </div>
  );
}
