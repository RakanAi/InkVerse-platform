import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../Api/api";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "./page-styles/Trends.css";
import Pager from "../Componenets/BrowseComp/Parts/Pagination";

import DropdownSelect from "@/Shared/ui/DropdownSelect";
import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";

import { DEFAULT_TRENDS_QUERY } from "@/features/trends/trends.defaults";
import {
  getTrendSortOptions,
  TREND_PAGE_SIZE,
  TREND_FEATURED_COUNT,
} from "@/features/trends/trends.presets";
import TrendHeroCard from "@/features/trends/components/TrendHeroCard";
import TrendRevealCard from "@/features/trends/components/TrendRevealCard";
import {
  normalizeTrendPreview,
  selectActiveTrends,
} from "@/features/trends/trend.models";
import { applyTrendSort } from "@/features/trends/utils/applyTrendSort";

export default function TrendsPage() {
  const { t } = useTranslation();
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
      setError(t("trends.page.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

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

  const featured = useMemo(
    () => sortedTrends.slice(0, TREND_FEATURED_COUNT),
    [sortedTrends],
  );

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedTrends.length / TREND_PAGE_SIZE));
  }, [sortedTrends.length]);

  const pageTrends = useMemo(() => {
    const start = (query.pageNumber - 1) * TREND_PAGE_SIZE;
    return sortedTrends.slice(start, start + TREND_PAGE_SIZE);
  }, [sortedTrends, query.pageNumber]);

  const trendSortOptions = useMemo(() => getTrendSortOptions(t), [t]);

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
            <span className="iv-trends-kicker">{t("trends.page.headKicker")}</span>
            <h1 className="iv-trends-title">{t("trends.page.headTitle")}</h1>
            <p className="iv-trends-text">{t("trends.page.headText")}</p>
          </div>

          <div className="iv-trends-head__meta">
            <div className="iv-trends-stat">
              <span className="iv-trends-stat__label">{t("trends.page.activeConcepts")}</span>
              <strong className="iv-trends-stat__value">{visibleTrends.length}</strong>
            </div>

            <div className="iv-trends-sort">
              <span className="iv-trends-sort__label">{t("trends.page.sortBy")}</span>
              <DropdownSelect
                value={query.sortBy}
                onChange={(value) =>
                  setQuery((prev) => ({ ...prev, sortBy: value, pageNumber: 1 }))
                }
                options={trendSortOptions}
                placeholder={t("trends.page.sortPlaceholder")}
              />
            </div>
          </div>
        </section>

        {loading ? (
          <LoadingState text={t("trends.page.loading")} />
        ) : error ? (
          <ErrorState subtitle={error} onRetry={loadTrends} />
        ) : sortedTrends.length === 0 ? (
          <EmptyState
            title={t("trends.page.emptyTitle")}
            subtitle={t("trends.page.emptySubtitle")}
          />
        ) : (
          <>
            {featured.length > 0 ? (
              <section className="iv-trends-hero">
                <Swiper
                  className="iv-trends-hero__swiper"
                  modules={[Autoplay, Navigation, Pagination]}
                  slidesPerView={1}
                  spaceBetween={18}
                  loop={featured.length > 1}
                  navigation={featured.length > 1}
                  pagination={featured.length > 1 ? { clickable: true } : false}
                  autoplay={
                    featured.length > 1
                      ? {
                          delay: 4800,
                          disableOnInteraction: false,
                          pauseOnMouseEnter: true,
                        }
                      : false
                  }
                >
                  {featured.map((trend) => (
                    <SwiperSlide key={trend.id}>
                      <TrendHeroCard trend={trend} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            ) : null}

            {sortedTrends.length > 0 ? (
              <section className="iv-trends-library">
                <div className="iv-trends-library__head">
                  <div className="iv-trends-library__copy">
                    <span className="iv-trends-kicker">{t("trends.page.allConcepts")}</span>
                    <h2 className="iv-trends-library__title">{t("trends.page.libraryTitle")}</h2>
                    <p className="iv-trends-library__text">
                      {t("trends.page.libraryText", {
                        pageCount: pageTrends.length,
                        total: sortedTrends.length,
                        suffix: sortedTrends.length === 1 ? "" : "s",
                      })}
                    </p>
                  </div>
                </div>

                <div className="iv-trends-grid">
                  {pageTrends.map((trend) => (
                    <TrendRevealCard key={trend.id} trend={trend} />
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
