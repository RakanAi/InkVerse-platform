import { useEffect, useMemo, useState, useContext } from "react";
import api from "../Api/api";
import AuthContext from "../Context/AuthProvider";
import "./page-styles/Ranking.css";
import BrowseBookCard from "@/Shared/Books/brows-book-card/BrowseBookCard";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";
import PageHeader from "@/Shared/ui/PageHeader";
import Segmented from "@/Shared/ui/Segmented";
import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import {
  VERSE_TYPES,
  normalizeVerseType,
  ORIGIN_TYPES,
} from "../Constants/bookEnums";
import { DEFAULT_RANKING_STATE } from "@/features/ranking/ranking.defaults";
import { buildRankingParams } from "@/features/ranking/utils/buildRankingParams";
import {
  RANKING_TABS,
  RANKING_TIME_RANGES,
  RANKING_STATUS_OPTIONS,
} from "@/features/ranking/ranking.presets";

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
    libraryItems.some((x) => (x.bookId ?? x.book?.id) === bookId);

  useEffect(() => {
    loadLibrary();
  }, [myUserId]);
  
  const loadLibrary = async () => {
    if (!myUserId) {
      setLibraryItems([]);
      return;
    }
    try {
      const r = await api.get("/me/library");
      setLibraryItems(Array.isArray(r.data) ? r.data : []);
    } catch {
      setLibraryItems([]);
    }
  };

  const { params, preset } = useMemo(() => buildRankingParams(query), [query]);

  const loadRanked = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/books/browse", { params });
      const r = res.data || {};
      const pageSize = r.pageSize ?? 20;
      const totalCount = r.totalCount ?? 0;

      setData({
        ...r,
        items: r.items || [],
        pageSize,
        totalCount,
        totalPages: r.totalPages ?? Math.ceil(totalCount / pageSize),
      });
    } catch (e) {
      console.error(e);
      setError("Failed to load ranking.");
      setData((prev) => ({ ...prev, items: [], totalCount: 0, totalPages: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // ✅ reload whenever params changes (includes timeRange/origin/page)
  useEffect(() => {
    loadRanked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const toggleLibrary = async (bookId) => {
    if (!myUserId) return;
    try {
      if (inLib(bookId)) await api.delete(`/books/${bookId}/library`);
      else await api.post(`/books/${bookId}/library`);
      await loadLibrary();
    } catch (e) {
      console.error("toggleLibrary failed", e);
    }
  };

  // Segmented options
  const tabOptions = useMemo(
    () => RANKING_TABS.map((t) => ({ value: t.key, label: t.label })),
    [],
  );
  const timeOptions = useMemo(
    () => RANKING_TIME_RANGES.map((t) => ({ value: t.key, label: t.label })),
    [],
  );

  return (
    <div className="iv-page">
    <div className="container-fluid iv-surface py-3" style={{ maxWidth: 1300 }}>
      <div className="iv-ranking-header">
        <PageHeader
          title="Ranking"
          subtitle="Discover the best books on InkVerse."
        />
      </div>

      {/* Filters Panel */}
      {/* Filters Panel (old structure, new components) */}
      <div className="iv-panel iv-ranking-filters">
        {/* Row 1: dropdowns (centered) */}
        <div className="iv-ranking-row iv-ranking-row--dropdowns">
          <DropdownSelect
            className="iv-ranking-dd"
            value={query.verseType}
            onChange={(v) =>
              setQuery((p) => ({
                ...p,
                verseType: normalizeVerseType(v),
                pageNumber: 1,
              }))
            }
            options={VERSE_TYPES}
            placeholder="All Verse Types"
          />

          <DropdownSelect
            className="iv-ranking-dd"
            value={query.originType}
            onChange={(v) =>
              setQuery((p) => ({ ...p, originType: v, pageNumber: 1 }))
            }
            options={ORIGIN_TYPES}
            placeholder="All Origins"
          />

          <DropdownSelect
            className="iv-ranking-dd"
            value={query.status}
            onChange={(v) =>
              setQuery((p) => ({ ...p, status: v, pageNumber: 1 }))
            }
            options={RANKING_STATUS_OPTIONS}
            placeholder="All Status"
          />
        </div>

        {/* Row 2: tabs (centered) */}
        <div className="iv-ranking-row iv-ranking-row--seg">
          <Segmented
            value={query.tab}
            onChange={(v) => setQuery((p) => ({ ...p, tab: v, pageNumber: 1 }))}
            options={tabOptions}
          />
        </div>

        {/* Row 3: time range (centered) */}
        <div className="iv-ranking-row iv-ranking-row--seg">
          <Segmented
            value={query.timeRange}
            onChange={(v) =>
              setQuery((p) => ({ ...p, timeRange: v, pageNumber: 1 }))
            }
            options={timeOptions}
          />
        </div>
      </div>

      {preset.key === "topRated" ? (
        <div className="text-muted small mt-2">
          Showing books with at least {preset.minReviewCount}+ reviews.
        </div>
      ) : null}

      <div className="mt-3">
        {loading ? (
          <LoadingState text="Loading ranking..." />
        ) : error ? (
          <ErrorState subtitle={error} onRetry={loadRanked} />
        ) : (data.items || []).length === 0 ? (
          <EmptyState title="No results" subtitle="Try changing filters." />
        ) : (
          <>
            <div className="">
              {(data.items || []).map((b) => (
                <div key={b.id} className="col-12 my-3">
                  <BrowseBookCard
                    book={b}
                    isBookmarked={inLib(b.id)}
                    onToggleBookmark={(bookObj) => toggleLibrary(bookObj.id)}
                  />
                </div>
              ))}
            </div>

            <Pager
              pageNumber={data.pageNumber}
              totalPages={data.totalPages}
              onPage={(p) => {
                setQuery((prev) => ({ ...prev, pageNumber: p }));
                setData((d) => ({ ...d, pageNumber: p }));
              }}
            />
          </>
        )}
      </div>
    </div>
    </div>
  );
}
