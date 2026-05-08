import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Autoplay, Navigation } from "swiper/modules";

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
  RECENT_REVIEWS_LABELS,
} from "@/features/reviews/reviews.presets";
import { pickFirst } from "@/features/reviews/utils/pickFirst";
import { buildRecentReviewsEndpoint } from "@/features/reviews/utils/buildRecentReviewsEndpoint";
import { getCollectionItems } from "@/features/home/shared/home.models";

export default function RecentReviews() {
  const endpoint = buildRecentReviewsEndpoint(RECENT_REVIEWS_QUERY);
  const { items: reviews, loading, error } = useHomeCollection({
    endpoint,
    errorMessage: "Failed to load recent reviews.",
    selectItems: getCollectionItems,
  });

  return (
    <HomeSection
      id="recent-reviews-wrap"
      className="iv-home-reviews"
      title={RECENT_REVIEWS_LABELS.title}
      subtitle={RECENT_REVIEWS_LABELS.subtitle}
    >
      {loading ? (
        <LoadingState text={RECENT_REVIEWS_LABELS.loading} />
      ) : error ? (
        <ErrorState title={error} />
      ) : reviews.length === 0 ? (
        <EmptyState title={RECENT_REVIEWS_LABELS.empty} />
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
