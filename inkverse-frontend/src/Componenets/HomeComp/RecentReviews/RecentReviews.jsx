import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";
import { useTranslation } from "react-i18next";

import "./RecentReviews.css";

import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import ErrorState from "@/Shared/ui/ErrorState";
import ReviewCardV2 from "@/Shared/reviews/ReviewCard/ReviewCardV2";
import HomeSection from "@/features/home/shared/HomeSection";
import useHomeCollection from "@/features/home/shared/useHomeCollection";

import {
  RECENT_REVIEWS_QUERY,
  RECENT_REVIEWS_SWIPER,
  getRecentReviewsLabels,
} from "@/features/reviews/reviews.presets";
import { pickFirst } from "@/features/reviews/utils/pickFirst";
import { buildRecentReviewsEndpoint } from "@/features/reviews/utils/buildRecentReviewsEndpoint";
import { getCollectionItems } from "@/features/home/shared/home.models";

export default function RecentReviews() {
  const { t } = useTranslation();
  const labels = getRecentReviewsLabels(t);
  const endpoint = buildRecentReviewsEndpoint(RECENT_REVIEWS_QUERY);
  const { items: reviews, loading, error } = useHomeCollection({
    endpoint,
    errorMessage: labels.error,
    selectItems: getCollectionItems,
  });

  return (
    <HomeSection
      id="recent-reviews-wrap"
      className="iv-home-reviews"
      title={labels.title}
      subtitle={labels.subtitle}
    >
      {loading ? (
        <LoadingState text={labels.loading} />
      ) : error ? (
        <ErrorState title={error} />
      ) : reviews.length === 0 ? (
        <EmptyState title={labels.empty} />
      ) : (
        <Swiper
          autoplay={RECENT_REVIEWS_SWIPER.autoplay}
          navigation
          modules={[Autoplay, Navigation]}
          speed={RECENT_REVIEWS_SWIPER.speed}
          spaceBetween={RECENT_REVIEWS_SWIPER.spaceBetween}
          breakpoints={RECENT_REVIEWS_SWIPER.breakpoints}
          className="recent-reviews-swiper"
        >
          {reviews.map((review, index) => {
            const id = pickFirst(review, ["id", "Id"], index);

            return (
              <SwiperSlide key={id}>
                <ReviewCardV2 review={review} height={350} />
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </HomeSection>
  );
}
