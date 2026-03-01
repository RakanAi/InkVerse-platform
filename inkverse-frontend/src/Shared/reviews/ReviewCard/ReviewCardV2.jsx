import { Link } from "react-router-dom";
import "./ReviewCardV2.css";

import Button from "@/Shared/ui/Button";
import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import { absUrl } from "@/Utils/absUrl";

const FALLBACK_USER_IMG = "https://ui-avatars.com/api/?name=User";

export default function ReviewCardV2({
  review,
  height = 350,
}) {
  // Normalize common shapes (your API sometimes mixes casing)
  const bookId = review?.bookId ?? review?.BookId ?? null;
  const bookTitle =
    review?.bookTitle ??
    review?.BookTitle ??
    review?.book?.title ??
    review?.Book?.Title ??
    "Unknown Book";

  const reviewText =
    review?.content ??
    review?.Content ??
    review?.reviewText ??
    review?.ReviewText ??
    review?.text ??
    "";

  const userName =
    review?.userName ??
    review?.UserName ??
    review?.user ??
    review?.User ??
    "Unknown";

  const rawAvatar =
    review?.userAvatarUrl ??
    review?.UserAvatarUrl ??
    review?.avatarUrl ??
    review?.AvatarUrl ??
    review?.image ??
    review?.Image ??
    "";

const userAvatarUrl = rawAvatar ? absUrl(rawAvatar) : FALLBACK_USER_IMG;
  // Try to resolve a cover from either:
  // 1) review.book object (best)
  // 2) direct cover fields
  const bookLike =
    review?.book ??
    review?.Book ??
    {
      coverImageUrl: review?.coverImageUrl ?? review?.CoverImageUrl,
      CoverImageUrl: review?.CoverImageUrl,
      cover: review?.cover,
    };

  const coverSrc = getBookCoverSrc(bookLike);

  return (
    <div className="iv-rv2-card mb-3" style={{ height }}>
      {/* Top cover strip */}
      <Link to={bookId ? `/book/${bookId}` : "#"} className="iv-rv2-coverLink">
        <div className="iv-rv2-cover">
          {/* BookCover keeps your cover logic consistent */}
          <BookCover variant="tile" src={coverSrc} alt={bookTitle} />
          {/* overlay gradient for readability */}
          <div className="iv-rv2-coverFade" />
        </div>
      </Link>

      <div className="iv-rv2-body">
        <div className="iv-rv2-title" title={bookTitle}>
          {bookTitle}
        </div>

        <div className="iv-rv2-text">
          {reviewText?.trim() ? reviewText : "—"}
        </div>

        <div className="iv-rv2-footer">
          {/* user chip (replaces Git icon + Code) */}
          <div className="iv-rv2-user">
            <img
              className="iv-rv2-userImg"
              src={userAvatarUrl}
              alt={userName}
              onError={(e) => {
                e.currentTarget.src = FALLBACK_USER_IMG;
              }}
            />
            <span className="iv-rv2-userName" title={userName}>
              {userName}
            </span>
          </div>

          {/* action (replaces Preview) */}
          {bookId ? (
            <Link to={`/book/${bookId}`} className="iv-rv2-action">
              <Button size="sm">Read</Button>
            </Link>
          ) : (
            <Button size="sm" disabled>
              Read
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}