export const RECENT_REVIEWS_QUERY = {
  take: 10,
};

export const RECENT_REVIEWS_SWIPER = {
  spaceBetween: 20,
  speed: 1000,
  autoplay: {
    delay: 3200,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    0: { slidesPerView: 1 },
    992: { slidesPerView: 2 },
  },
};

export function getRecentReviewsLabels(t) {
  return {
    title: t("home.recentReviews.title"),
    subtitle: t("home.recentReviews.subtitle"),
    loading: t("home.recentReviews.loading"),
    empty: t("home.recentReviews.empty"),
    error: t("home.recentReviews.error"),
  };
}
