import { useEffect, useMemo, useState } from "react";
import { FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";

import api from "../../../Api/api";
import "./RecentReviews.css";
// import { absUrl } from "../../../Utils/absUrl";

import PageHeader from "@/Shared/ui/PageHeader";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";
import ErrorState from "@/Shared/ui/ErrorState";
import ReviewCard from "@/Shared/reviews/ReviewCard/ReviewCard";
import ReviewCardV2 from "@/Shared/reviews/ReviewCard/ReviewCardV2";

import {
  REVIEWS_MAX_WIDTH,
  RECENT_REVIEWS_QUERY,
  RECENT_REVIEWS_SWIPER,
  RECENT_REVIEWS_LABELS,
} from "@/features/reviews/reviews.presets";
import { pickFirst } from "@/features/reviews/utils/pickFirst";
import { buildRecentReviewsEndpoint } from "@/features/reviews/utils/buildRecentReviewsEndpoint";

const FALLBACK_USER_IMG = "https://ui-avatars.com/api/?name=User";

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(
    () => buildRecentReviewsEndpoint(RECENT_REVIEWS_QUERY),
    [],
  );

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(endpoint);
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.items ?? []);
        if (alive) setReviews(list);
      } catch (err) {
        console.error("Failed to load recent reviews:", err);
        if (alive) {
          setReviews([]);
          setError("Failed to load recent reviews.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [endpoint]);

  return (
    <section
      id="recent-reviews-wrap"
      className="iv-surface mb-2 mt-4"
      style={{ maxWidth: `${REVIEWS_MAX_WIDTH}px`, margin: "auto" }}
    >
      <div className="d-flex text-start align-items-center">
        <span className="borderStart mt-2" />
        <div className="ms-2 mt-2" style={{ flex: 1 }}>
          <PageHeader
            title={RECENT_REVIEWS_LABELS.title}
            subtitle={RECENT_REVIEWS_LABELS.subtitle}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState title={RECENT_REVIEWS_LABELS.loading} />
      ) : error ? (
        <ErrorState title={error} />
      ) : reviews.length === 0 ? (
        <EmptyState title={RECENT_REVIEWS_LABELS.empty} />
      ) : (
        <Swiper
          navigation
          modules={[Navigation]}
          spaceBetween={RECENT_REVIEWS_SWIPER.spaceBetween}
          breakpoints={RECENT_REVIEWS_SWIPER.breakpoints}
          className="recent-reviews-swiper px-0 px-lg-5"
        >
          {reviews.map((r, idx) => {
            const id = pickFirst(r, ["id", "Id"], idx);

            return (
              <SwiperSlide key={id}>
                <ReviewCardV2 review={r} height={350} />
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </section>
  );
}
