import { Link } from "react-router-dom";
import "./ReviewCardV2.css";

import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import { absUrl } from "@/Utils/absUrl";
import LinkButton from "@/Shared/ui/LinkButton";

const FALLBACK_USER_IMG = "https://ui-avatars.com/api/?name=User";

export default function ReviewCardV2({
  review,
  height = 350,
}) {
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
  const ratingValue = review?.rating ?? review?.Rating ?? null;
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
      <Link to={bookId ? `/book/${bookId}` : "#"} className="iv-rv2-coverLink">
        <div className="iv-rv2-cover">
          <BookCover variant="tile" src={coverSrc} alt={bookTitle} />
          <div className="iv-rv2-coverFade" />
          {typeof ratingValue === "number" ? (
            <span className="iv-rv2-rating">★ {ratingValue.toFixed(1)}</span>
          ) : null}
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

          {bookId ? (
            <LinkButton to={`/book/${bookId}`} variant="ghost" size="sm" className="iv-rv2-action">
              Open
            </LinkButton>
          ) : (
            <span className="iv-rv2-action iv-rv2-action--disabled">Open</span>
          )}
        </div>
      </div>
    </div>
  );
}
