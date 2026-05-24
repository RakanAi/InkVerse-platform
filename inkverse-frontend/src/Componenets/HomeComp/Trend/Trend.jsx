import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useTranslation } from "react-i18next";

import "./Trend.css";
import "@/features/trends/components/TrendCards.css";

import LinkButton from "@/Shared/ui/LinkButton";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import ErrorState from "@/Shared/ui/ErrorState";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";
import TrendSpotlightCard from "@/features/trends/components/TrendSpotlightCard";
import {
  TRENDS_QUERY,
  getTrendsLabels,
} from "@/features/home/trends/trends.presets";
import {
  getCollectionItems,
  normalizeHomeTrendPreview,
} from "@/features/home/shared/home.models";

function selectTrendingItems(data) {
  return getCollectionItems(data)
    .slice(0, TRENDS_QUERY.take)
    .map(normalizeHomeTrendPreview);
}

export default function TrendCora() {
  const { t } = useTranslation();
  const labels = getTrendsLabels(t);
  const { items: trends, loading, error } = useHomeCollection({
    endpoint: "/trends",
    errorMessage: labels.error,
    selectItems: selectTrendingItems,
  });

  return (
    <HomeSection
      className="iv-trends"
      title={labels.title}
      subtitle={labels.subtitle}
      actions={
        <LinkButton to="/trend" variant="outline" size="sm">
          {labels.cta}
        </LinkButton>
      }
    >
      {loading ? (
        <LoadingState text={labels.loading} />
      ) : error ? (
        <ErrorState title={error} />
      ) : trends.length === 0 ? (
        <EmptyState title={labels.empty} />
      ) : (
        <Swiper
          className="iv-trends__swiper"
          modules={[Autoplay, Navigation, Pagination]}
          slidesPerView={1}
          spaceBetween={18}
          loop={trends.length > 1}
          navigation={trends.length > 1}
          pagination={trends.length > 1 ? { clickable: true } : false}
          autoplay={
            trends.length > 1
              ? {
                  delay: 5200,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
        >
          {trends.map((trend) => (
            <SwiperSlide key={trend.id}>
              <TrendSpotlightCard
                trend={trend}
                badge={labels.badge}
                ctaLabel={labels.action}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </HomeSection>
  );
}
