import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import RatingEle from "./BookRating2";
import BookRatingSticker from "./BookRatingSticker";
import "./Data.css";
import api from "../../../Api/api";
import { fetchFollowStatus, followAuthor, unfollowAuthor } from "../../../Api/notifications.api";
import AuthContext from "../../../Context/AuthProvider";
import LibraryButton from "../../Library/AddToLibraryBtn";
// import { absUrl } from "../../../Utils/absUrl";
import BookMetaBox from "./BookMetaBox";
import { getBookCoverSrc } from "@/domain/books/book-cover";
import BookCover from "@/Shared/books/BookCover/BookCover";
import ReportMenuButton from "@/features/reports/ReportMenuButton";

const COVER_PREVIEW_TRANSITION_MS = 260;

export default function BookData({ book, averageRating, reviewCount = 0 }) {
  const navigate = useNavigate();
  const { auth, openLogin } = useContext(AuthContext);

  // ✅ Hooks must be before any return
  const [lastReadChapterId, setLastReadChapterId] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [hasChapters, setHasChapters] = useState(true);
  const [coverPreviewState, setCoverPreviewState] = useState("closed");
  const [followState, setFollowState] = useState({
    isFollowed: false,
    followerCount: 0,
  });
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      if (!book?.id) {
        setLoadingProgress(false);
        setLastReadChapterId(null);
        return;
      }
      try {
        setLoadingProgress(true);
        const res = await api.get(`/books/${book.id}/reading-progress`);
        const lastId =
          res.data?.lastReadChapterId ?? res.data?.LastReadChapterId ?? null;

        setLastReadChapterId(lastId);
      } catch (e) {
        console.error("Load reading progress failed", e);
        // if not logged in => 401, treat as no progress

        setLastReadChapterId(null);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, [book?.id]);

  useEffect(() => {
    if (coverPreviewState === "closed") return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCoverPreview();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [coverPreviewState]);

  useEffect(() => {
    if (coverPreviewState === "entering") {
      const frame = window.requestAnimationFrame(() => {
        setCoverPreviewState("open");
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (coverPreviewState === "closing") {
      const timer = window.setTimeout(() => {
        setCoverPreviewState("closed");
      }, COVER_PREVIEW_TRANSITION_MS);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [coverPreviewState]);

  const isLoggedIn = !!auth?.accessToken;
  const viewerId = auth?.user?.id ?? auth?.user?.Id ?? "";
  const authorName = book?.authorName || book?.AuthorName || "";
  const authorId = book?.authorId ?? book?.AuthorId ?? "";
  const canFollowAuthor = !!authorName && (!viewerId || authorId !== viewerId);

  useEffect(() => {
    let active = true;

    const loadFollowStatus = async () => {
      if (!isLoggedIn || !authorName || !canFollowAuthor) {
        setFollowState((current) => ({
          isFollowed: false,
          followerCount: current.followerCount,
        }));
        return;
      }

      try {
        const status = await fetchFollowStatus(authorName);
        if (!active) return;
        setFollowState({
          isFollowed: !!(status?.isFollowed ?? status?.IsFollowed),
          followerCount: Number(status?.followerCount ?? status?.FollowerCount ?? 0),
        });
      } catch (error) {
        console.error("load author follow status failed:", error);
      }
    };

    loadFollowStatus();
    return () => {
      active = false;
    };
  }, [authorName, canFollowAuthor, isLoggedIn]);

  // ✅ now safe
  if (!book) return null;

  // const imageUrl =
  //   book.coverImageUrl ??
  //   book.CoverImageUrl ??
  //   book.imageUrl ??
  //   book.ImageUrl ??
  //   "";

  // const cover = imageUrl ? absUrl(imageUrl) : "/img/placeholder-cover.png";
  const coverSrc = getBookCoverSrc(book);
  const isCoverPreviewMounted = coverPreviewState !== "closed";
  const isCoverPreviewOpen = coverPreviewState === "open";

  const openCoverPreview = () => {
    setCoverPreviewState("entering");
  };

  const closeCoverPreview = () => {
    setCoverPreviewState((currentState) => {
      if (currentState === "closed" || currentState === "closing") {
        return currentState;
      }

      return "closing";
    });
  };

  const startReading = async () => {
    try {
      const res = await api.get(`/chapters/books/${book.id}/first-chapter`);
      const firstChapterId = res.data?.id ?? res.data?.Id ?? res.data?.ID;

      if (!firstChapterId) {
        setHasChapters(false);
        return;
      }

      setHasChapters(true);
      navigate(`/book/${book.id}/chapter/${firstChapterId}`);
    } catch (e) {
      // if backend returns 404 when no chapters
      if (e?.response?.status === 404) {
        setHasChapters(false);
        return;
      }

      console.error("Start reading failed:", e);
      alert("Something went wrong while starting reading.");
    }
  };

  const handleReadClick = async () => {
    if (lastReadChapterId) {
      try {
        // quick check if chapter exists
        await api.get(`/chapters/${lastReadChapterId}`);
        navigate(`/book/${book.id}/chapter/${lastReadChapterId}`);
        return;
      } catch (e) {
        if (e?.response?.status !== 404) console.error(e);
        // fallback
        setLastReadChapterId(null);
      }
    }

    startReading();
  };

  const toggleFollowAuthor = async () => {
    if (!authorName) return;
    if (!isLoggedIn) {
      openLogin?.();
      return;
    }

    try {
      setFollowBusy(true);
      const next = followState.isFollowed
        ? await unfollowAuthor(authorName)
        : await followAuthor(authorName);
      setFollowState({
        isFollowed: !!(next?.isFollowed ?? next?.IsFollowed),
        followerCount: Number(next?.followerCount ?? next?.FollowerCount ?? 0),
      });
    } catch (error) {
      console.error("toggle author follow failed:", error);
      window.alert(error?.response?.data?.message || "Could not update follow status.");
    } finally {
      setFollowBusy(false);
    }
  };

  return (
    <>
      <section className="DataBox border iv-book-hero">
        <div className="iv-book-hero__layout">
          <div className="iv-book-hero__cover">
            <button
              type="button"
              className="iv-coverr iv-coverr--button"
              onClick={openCoverPreview}
              aria-label={`Open full cover for ${book.title}`}
            >
              <BookCover
                variant="hero"
                src={coverSrc}
                alt={book.title}
              />
              <span className="iv-coverr__veil" aria-hidden="true" />
              <span className="iv-coverr__hint" aria-hidden="true">
                <i className="bi bi-arrows-fullscreen" />
                <span>View cover</span>
              </span>
            </button>
          </div>

          <div className="iv-book-hero__content">
            <div className="iv-book-hero__copy">
            <div className="iv-book-hero__eyebrow">Story spotlight</div>

            <h1 className="iv-book-hero__title" title={book.title}>
              {book.title}
            </h1>

            <div className="iv-book-hero__byline">
              <span>
                by <strong>{book.authorName || "Unknown"}</strong>
                {followState.followerCount > 0 ? (
                  <em>{followState.followerCount.toLocaleString()} followers</em>
                ) : null}
              </span>
              {canFollowAuthor ? (
                <button
                  type="button"
                  className={`iv-book-hero__follow ${followState.isFollowed ? "is-following" : ""}`}
                  onClick={toggleFollowAuthor}
                  disabled={followBusy}
                >
                  {followState.isFollowed ? "Following" : "Follow author"}
                </button>
              ) : null}
            </div>

            <div className="iv-book-hero__rating-row">
              <RatingEle rating={averageRating ?? 0} variant="hero" />
              <span className="iv-book-hero__rating-copy">
                {Number(averageRating ?? 0).toFixed(1)} average reader rating
              </span>
            </div>

            {book.description ? (
              <p className="iv-book-hero__lead">{book.description}</p>
            ) : null}

              <BookMetaBox book={book} />
            </div>

            <BookRatingSticker
              averageRating={averageRating ?? 0}
              reviewCount={reviewCount}
            />

            <div className="iv-book-hero__actions">
              <button
                onClick={handleReadClick}
                className="btn iv-book-hero__cta iv-book-hero__cta--primary"
                disabled={loadingProgress || !hasChapters}
              >
                {loadingProgress
                  ? "Loading..."
                  : !hasChapters
                    ? "No chapters yet"
                    : lastReadChapterId
                      ? "Continue Reading"
                      : "Start Reading"}
              </button>

              <LibraryButton bookId={book.id} />

              <ReportMenuButton
                targetType="book"
                targetId={book.id ?? book.ID}
                targetLabel={book.title || "Book"}
                buttonClassName="iv-book-hero__report"
              />
            </div>
          </div>
        </div>
      </section>

      {isCoverPreviewMounted && typeof document !== "undefined"
        ? createPortal(
          <div
            className={`iv-cover-lightbox ${isCoverPreviewOpen ? "is-open" : ""} ${coverPreviewState === "closing" ? "is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${book.title} cover preview`}
            onClick={closeCoverPreview}
          >
            <button
              type="button"
              className="iv-cover-lightbox__close"
              onClick={closeCoverPreview}
              aria-label="Close cover preview"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div
              className="iv-cover-lightbox__dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="iv-cover-lightbox__frame">
                <BookCover
                  variant="fill"
                  src={coverSrc}
                  alt={book.title}
                  className="iv-cover-lightbox__media"
                  rounded={false}
                />
              </div>
              <div className="iv-cover-lightbox__caption">{book.title}</div>
            </div>
          </div>,
          document.body
        )
        : null}
    </>
  );
}
