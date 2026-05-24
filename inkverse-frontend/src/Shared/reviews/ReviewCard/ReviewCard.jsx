import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import "./ReviewCard.css";
import UserAvatar from "../../user/UserAvatar";
import { canOpenPublicProfile, getPublicProfilePath } from "@/domain/users/public-profile";

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
  const canViewProfile = canOpenPublicProfile(userName);
  const profilePath = canViewProfile ? getPublicProfilePath(userName) : null;

  return (
    <div className="iv-review-card" style={{ height }}>
      {profilePath ? (
        <Link to={profilePath} className="iv-review-head iv-review-headLink" title={`View ${userName}`}>
          <UserAvatar
            src={userAvatarUrl}
            name={userName}
            className="iv-review-avatar"
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
        </Link>
      ) : (
        <div className="iv-review-head">
          <UserAvatar
            src={userAvatarUrl}
            name={userName}
            className="iv-review-avatar"
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
      )}

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
