import React, { useEffect, useState } from "react";
import { FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import api from "../../../Api/api";
import "./RecentReviews.css";
import { absUrl } from "../../../Utils/absUrl";

const FALLBACK_USER_IMG = "https://ui-avatars.com/api/?name=User"; // better than bg image

const pick = (obj, keys, fallback = "") => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return fallback;
};

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/reviews/recent?take=10");
        const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
        if (alive) setReviews(list);
      } catch (err) {
        console.error("Failed to load recent reviews:", err);
        if (alive) setReviews([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section
      id="recent-reviews-wrap"
      className="row"
      style={{ maxWidth: "1300px", margin: "auto" }}
    >
      <div className="d-flex text-start mt-3">
        <h2 className="borderStart mt-2"></h2>
        <h3 className="mt-2">RECENT REVIEWS</h3>
      </div>

      {loading ? (
        <div className="text-muted">Loading recent reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-muted">No reviews yet.</div>
      ) : (
        <Swiper
          navigation
          modules={[Navigation]}
          spaceBetween={20}
          breakpoints={{
            340: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
          }}
          className="recent-reviews-swiper px-0 px-lg-5"
        >
          {reviews.map((r, idx) => {
            const id = pick(r, ["id", "Id"], idx);

            const userName = pick(r, ["userName", "UserName", "user", "User"], "Unknown");

            const rawUserImg = pick(
              r,
              ["userAvatarUrl", "UserAvatarUrl", "avatarUrl", "AvatarUrl", "image", "Image"],
              ""
            );
            const userImg = rawUserImg ? absUrl(rawUserImg) : FALLBACK_USER_IMG;

            const ratingRaw = pick(r, ["rating", "Rating"], null);
            const rating = ratingRaw === null ? null : Number(ratingRaw);

            const bookTitle = pick(r, ["bookTitle", "BookTitle", "book", "Book"], "Unknown Book");
            const bookId = pick(r, ["bookId", "BookId"], null);

            const reviewText = pick(r, ["content", "Content", "reviewText", "ReviewText", "text"], "");

            return (
              <SwiperSlide key={id}>
                <div className="review-card shadow" style={{ height: "300px" }}>
                  <div className="user-wrap">
                    <img
                      src={userImg}
                      alt={userName}
                      className="user-img"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_USER_IMG;
                      }}
                    />

                    <div className="user-details">
                      <div className="name fw-bold fs-4">{userName}</div>
                      <div className="rating fs-4">
                        <FaStar color="#ffc107" />{" "}
                        {Number.isFinite(rating) ? rating.toFixed(1) : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="review-content col-11 m-auto">
                    {bookId ? (
                      <a
                        href={`/book/${bookId}`}
                        className="review-book text-truncate text-decoration-none text-start"
                        title={bookTitle}
                      >
                        Book Title : {bookTitle}
                      </a>
                    ) : (
                      <h6 className="review-book text-truncate" title={bookTitle}>
                        {bookTitle}
                      </h6>
                    )}

                    <p className="review-text text-start border p-2 rounded mt-2">
                      {reviewText || "—"}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      )}
    </section>
  );
}
