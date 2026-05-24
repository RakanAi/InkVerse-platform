import { Link } from "react-router-dom";
import "./ReviewCardV2.css";

import BookCover from "@/Shared/books/BookCover/BookCover";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import { canOpenPublicProfile, getPublicProfilePath } from "@/domain/users/public-profile";
import LinkButton from "@/Shared/ui/LinkButton";
import UserAvatar from "../../user/UserAvatar";

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

  const ratingValue = review?.rating ?? review?.Rating ?? null;
  const bookLike =
    review?.book ??
    review?.Book ??
    {
      bookCoverImageUrl: review?.bookCoverImageUrl ?? review?.BookCoverImageUrl,
      coverImageUrl: review?.coverImageUrl ?? review?.CoverImageUrl,
      CoverImageUrl: review?.CoverImageUrl,
      BookCoverImageUrl: review?.BookCoverImageUrl,
      cover: review?.cover,
    };

  const coverSrc = getBookCoverSrc(bookLike);
  const canViewProfile = canOpenPublicProfile(userName);
  const profilePath = canViewProfile ? getPublicProfilePath(userName) : null;

  return (
    <div className="iv-rv2-card" style={{ height }}>
      <Link to={bookId ? `/book/${bookId}` : "#"} className="iv-rv2-coverLink">
        <div className="iv-rv2-cover">
          <BookCover variant="tile" src={coverSrc} alt={bookTitle} />
          <div className="iv-rv2-coverFade" />
          <div className="iv-rv2-coverMeta">
            <span className="iv-rv2-coverKicker">Book</span>
            <span className="iv-rv2-coverTitle" title={bookTitle}>
              {bookTitle}
            </span>
          </div>
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
          {profilePath ? (
            <Link to={profilePath} className="iv-rv2-user iv-rv2-userLink" title={`View ${userName}`}>
              <UserAvatar
                className="iv-rv2-userImg"
                src={rawAvatar}
                name={userName}
              />
              <span className="iv-rv2-userName" title={userName}>
                {userName}
              </span>
            </Link>
          ) : (
            <div className="iv-rv2-user">
              <UserAvatar
                className="iv-rv2-userImg"
                src={rawAvatar}
                name={userName}
              />
              <span className="iv-rv2-userName" title={userName}>
                {userName}
              </span>
            </div>
          )}

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
