import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "./ReviewCard.css";

const FALLBACK_USER_IMG = "https://ui-avatars.com/api/?name=User";

export default function ReviewCard({
  userName = "Unknown",
  userAvatarUrl = "",
  rating = null,
  bookId = null,
  bookTitle = "Unknown Book",
  content = "",
  height = 300, // keep Swiper height stable
}) {
  const safeRating =
    typeof rating === "number" && Number.isFinite(rating) ? rating : null;

  const avatarSrc = userAvatarUrl || FALLBACK_USER_IMG;

  return (
    <div className="iv-review-card" style={{ height }}>
      <div className="iv-review-head">
        <img
          src={avatarSrc}
          alt={userName}
          className="iv-review-avatar"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_USER_IMG;
          }}
        />

        <div className="iv-review-user">
          <div className="iv-review-name" title={userName}>
            {userName}
          </div>

          <div className="iv-review-rating">
            <FaStar className="iv-review-star" />
            <span>{safeRating !== null ? safeRating.toFixed(1) : "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="iv-review-body">
        {bookId ? (
          <Link
            to={`/book/${bookId}`}
            className="iv-review-book"
            title={bookTitle}
          >
            Book: {bookTitle}
          </Link>
        ) : (
          <div className="iv-review-book" title={bookTitle}>
            Book: {bookTitle}
          </div>
        )}

        <p className="iv-review-text">{content?.trim() ? content : "—"}</p>
      </div>
    </div>
  );
}