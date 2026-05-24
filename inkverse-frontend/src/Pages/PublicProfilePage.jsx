import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import api from "../Api/api";
import { followAuthor, unfollowAuthor } from "../Api/notifications.api";
import AuthContext from "../Context/AuthProvider";
import "./ProfilePage.css";
import Chip from "../Shared/ui/Chip";
import Segmented from "../Shared/ui/Segmented";
import LoadingState from "../Shared/ui/LoadingState";
import ErrorState from "../Shared/ui/ErrorState";
import EmptyState from "../Shared/ui/EmptyState";
import BookCover from "../Shared/Books/BookCover/BookCover";
import UserAvatar from "../Shared/user/UserAvatar";
import { getBookCoverSrc } from "../domain/books/book-cover";
import ReportMenuButton from "../features/reports/ReportMenuButton";

function formatDateTime(value) {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleString();
}

export default function PublicProfilePage() {
  const { t } = useTranslation();
  const { userName } = useParams();
  const { auth, openLogin } = useContext(AuthContext);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [bioExpanded, setBioExpanded] = useState(false);
  const [bioCanExpand, setBioCanExpand] = useState(false);
  const [bioExpandedHeight, setBioExpandedHeight] = useState("0px");
  const [followState, setFollowState] = useState({
    isFollowed: false,
    followerCount: 0,
  });
  const [followBusy, setFollowBusy] = useState(false);
  const bioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/users/${encodeURIComponent(userName || "")}`);
        if (!cancelled) {
          setProfile(response.data);
          setFollowState({
            isFollowed: !!(response.data?.isFollowedByViewer ?? response.data?.IsFollowedByViewer),
            followerCount: Number(response.data?.followerCount ?? response.data?.FollowerCount ?? 0),
          });
        }
      } catch (loadError) {
        console.error("load public profile failed:", loadError);
        if (!cancelled) {
          setProfile(null);
          setError(t("profile.errors.profileFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [t, userName]);

  useEffect(() => {
    setBioExpanded(false);
  }, [profile?.bio, loading]);

  useEffect(() => {
    const node = bioRef.current;
    if (!node || loading) return undefined;

    const checkOverflow = () => {
      const computed = window.getComputedStyle(node);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 27;
      const collapsedHeight = lineHeight * 3 + 2;
      setBioExpandedHeight(`${Math.ceil(node.scrollHeight)}px`);
      setBioCanExpand(node.scrollHeight > collapsedHeight + 2);
    };

    const frame = window.requestAnimationFrame(checkOverflow);
    window.addEventListener("resize", checkOverflow);

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(checkOverflow);
      observer.observe(node);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", checkOverflow);
      observer?.disconnect();
    };
  }, [loading, profile?.bio]);

  const displayName = profile?.userName || decodeURIComponent(userName || "") || t("profile.userFallback");
  const displayHandle = displayName ? `@${displayName}` : "";
  const canViewProfile = !!profile?.canViewProfile;
  const visibility = profile?.visibility || {};

  const createdDate = useMemo(() => {
    const raw = profile?.createdAt ?? profile?.CreatedAt ?? null;
    if (!raw) return null;

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [profile]);

  const joinedText = useMemo(
    () => (createdDate ? createdDate.toLocaleDateString() : t("profile.unknownJoined")),
    [createdDate, t],
  );

  const tabOptions = useMemo(() => {
    const nextTabs = [{ value: "overview", label: t("profile.tabs.overview") }];

    if (canViewProfile && visibility.reviews) {
      nextTabs.push({ value: "reviews", label: t("profile.tabs.reviews") });
    }

    if (canViewProfile && visibility.comments) {
      nextTabs.push({ value: "comments", label: t("profile.public.commentsTab") });
    }

    if (canViewProfile && visibility.authorBooks) {
      nextTabs.push({ value: "books", label: t("profile.public.booksTab") });
    }

    if (canViewProfile && visibility.library) {
      nextTabs.push({ value: "library", label: t("profile.public.libraryTab") });
    }

    return nextTabs;
  }, [canViewProfile, t, visibility.authorBooks, visibility.comments, visibility.library, visibility.reviews]);

  useEffect(() => {
    if (!tabOptions.some((option) => option.value === activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, tabOptions]);

  const heroBio = loading
    ? t("profile.hero.loadingBio")
    : profile?.bio || t("profile.public.emptyBio");

  const statItems = useMemo(() => {
    if (!canViewProfile) return [];

    const items = [];
    if (visibility.reviews) {
      items.push({
        label: t("profile.tabs.reviews"),
        value: profile?.reviewsCount ?? 0,
        hint: t("profile.public.reviewCount", { count: profile?.reviewsCount ?? 0 }),
      });
    }
    if (visibility.comments) {
      items.push({
        label: t("profile.public.commentsTab"),
        value: profile?.commentsCount ?? 0,
        hint: t("profile.public.commentCount", { count: profile?.commentsCount ?? 0 }),
      });
    }
    if (visibility.authorBooks) {
      items.push({
        label: t("profile.public.booksTab"),
        value: profile?.booksCount ?? 0,
        hint: t("profile.public.bookCount", { count: profile?.booksCount ?? 0 }),
      });
    }
    if (visibility.library) {
      items.push({
        label: t("profile.public.libraryTab"),
        value: profile?.libraryCount ?? 0,
        hint: t("profile.public.libraryCount", { count: profile?.libraryCount ?? 0 }),
      });
    }
    return items;
  }, [canViewProfile, profile?.booksCount, profile?.commentsCount, profile?.libraryCount, profile?.reviewsCount, t, visibility.authorBooks, visibility.comments, visibility.library, visibility.reviews]);

  const overviewEssentials = useMemo(
    () => [
      { label: t("profile.essentials.username"), value: displayName },
      { label: t("profile.essentials.visibility"), value: profile?.isProfilePublic ? t("profile.hero.public") : t("profile.hero.private") },
      { label: t("profile.essentials.preferredLanguage"), value: t("common.notAvailable") },
      { label: t("profile.snapshot.memberFor.label"), value: t("profile.public.memberSince", { date: joinedText }) },
    ],
    [displayName, joinedText, profile?.isProfilePublic, t],
  );

  const reviews = Array.isArray(profile?.reviews) ? profile.reviews : [];
  const comments = Array.isArray(profile?.comments) ? profile.comments : [];
  const authorBooks = Array.isArray(profile?.authorBooks) ? profile.authorBooks : [];
  const libraryBooks = Array.isArray(profile?.library) ? profile.library : [];
  const readerLevel = profile?.readerLevel ?? profile?.ReaderLevel ?? 1;
  const isLoggedIn = !!auth?.accessToken;
  const canFollowAuthor = !!profile?.isAuthor && !profile?.isOwner;
  const featuredAchievements = Array.isArray(profile?.featuredAchievements ?? profile?.FeaturedAchievements)
    ? (profile?.featuredAchievements ?? profile?.FeaturedAchievements)
    : [];

  const toggleFollow = async () => {
    if (!profile?.userName && !userName) return;
    if (!isLoggedIn) {
      openLogin?.();
      return;
    }

    try {
      setFollowBusy(true);
      const next = followState.isFollowed
        ? await unfollowAuthor(profile?.userName || userName)
        : await followAuthor(profile?.userName || userName);
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
    <div className="profile-page-wrap my-4">
      <section className="profile-shell">
        <div className="profile-hero-shell">
          <div className="profile-hero-orb profile-hero-orb--one" />
          <div className="profile-hero-orb profile-hero-orb--two" />

          <div className="profile-hero-grid">
            <div className="profile-hero-avatar-shell">
              <UserAvatar
                className="profile-hero-avatar"
                src={profile?.avatarUrl ?? profile?.AvatarUrl ?? ""}
                name={displayName}
              />
            </div>

            <div className="profile-hero-copy">
              <p className="profile-kicker">{t("profile.public.title")}</p>
              <h1 className="profile-display-name">{displayName}</h1>
              <p className="profile-handle">{displayHandle}</p>
              <div
                className={`profile-bio-shell${bioCanExpand ? " is-collapsible" : ""}${bioExpanded ? " is-expanded" : ""}`}
                style={{ "--profile-bio-expanded-height": bioExpandedHeight }}
              >
                <p ref={bioRef} className="profile-bio">
                  {heroBio}
                </p>
              </div>
              {bioCanExpand ? (
                <button
                  type="button"
                  className="profile-bio-toggle"
                  onClick={() => setBioExpanded((current) => !current)}
                  aria-expanded={bioExpanded}
                >
                  {bioExpanded ? t("profile.hero.showLess") : t("profile.hero.showMore")}
                </button>
              ) : null}

              <div className="profile-meta-row">
                <Chip tone="neutral">{t("profile.hero.joined", { date: joinedText })}</Chip>
                <Chip tone="neutral">Level {readerLevel}</Chip>
                {profile?.isAuthor ? <Chip tone="neutral">{t("profile.public.authorBadge")}</Chip> : null}
                {profile?.isAuthor ? (
                  <Chip tone="neutral">
                    {followState.followerCount.toLocaleString()} followers
                  </Chip>
                ) : null}
                {canViewProfile && visibility.reviews ? (
                  <Chip tone="neutral">{t("profile.public.reviewCount", { count: profile?.reviewsCount ?? 0 })}</Chip>
                ) : null}
                {canViewProfile && visibility.comments ? (
                  <Chip tone="neutral">{t("profile.public.commentCount", { count: profile?.commentsCount ?? 0 })}</Chip>
                ) : null}
                {!profile?.isOwner ? (
                  <ReportMenuButton
                    targetType="user"
                    targetId={profile?.userName || userName}
                    targetLabel={displayName}
                    buttonClassName="profile-report-button"
                  />
                ) : null}
                {canFollowAuthor ? (
                  <button
                    type="button"
                    className={`profile-follow-button ${followState.isFollowed ? "is-following" : ""}`}
                    onClick={toggleFollow}
                    disabled={followBusy}
                  >
                    {followState.isFollowed ? "Following" : "Follow author"}
                  </button>
                ) : null}
              </div>

              {featuredAchievements.length ? (
                <div className="profile-badge-strip" aria-label="Featured achievements">
                  {featuredAchievements.map((achievement) => (
                    <span
                      key={achievement.key ?? achievement.Key}
                      className={`profile-achievement-badge profile-achievement-badge--${String(
                        achievement.tier ?? achievement.Tier ?? "bronze",
                      ).toLowerCase()}`}
                    >
                      <strong>{achievement.tier ?? achievement.Tier}</strong>
                      {achievement.title ?? achievement.Title}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <ErrorState
            title={t("profile.errors.loadProfileTitle")}
            subtitle={error}
          />
        ) : null}

        {!loading ? (
          <Segmented
            className="profile-tabs"
            value={activeTab}
            onChange={setActiveTab}
            options={tabOptions}
          />
        ) : null}

        {activeTab === "overview" && (
          canViewProfile ? (
            <div className="profile-overview-grid">
              <section className="profile-panel">
                <div className="profile-section-head">
                  <div>
                    <h2>{t("profile.public.overviewTitle")}</h2>
                    <p>{t("profile.public.overviewSubtitle")}</p>
                  </div>
                </div>

                <div className="profile-public-stat-grid">
                  {statItems.length ? statItems.map((item) => (
                    <article key={item.label} className="profile-metric-card">
                      <p className="profile-metric-label">{item.label}</p>
                      <p className="profile-metric-value">{item.value}</p>
                      <p className="profile-metric-hint">{item.hint}</p>
                    </article>
                  )) : (
                    <EmptyState
                      title={t("profile.public.privateTitle")}
                      subtitle={t("profile.public.privateSubtitle", { user: displayName })}
                    />
                  )}
                </div>
              </section>

              <section className="profile-panel">
                <div className="profile-section-head">
                  <div>
                    <h2>{t("profile.essentials.title")}</h2>
                    <p>{t("profile.essentials.subtitle")}</p>
                  </div>
                </div>

                <dl className="profile-essentials-list">
                  {overviewEssentials.map((item) => (
                    <div key={item.label}>
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          ) : (
            <section className="profile-panel profile-panel--wide">
              <div className="profile-public-private">
                <h2>{t("profile.public.privateTitle")}</h2>
                <p>{t("profile.public.privateSubtitle", { user: displayName })}</p>
              </div>
            </section>
          )
        )}

        {activeTab === "reviews" && (
          <section className="profile-panel">
            <div className="profile-section-head">
              <div>
                <h2>{t("profile.reviews.title")}</h2>
                <p>{t("profile.reviews.subtitle")}</p>
              </div>
            </div>

            {loading ? (
              <LoadingState text={t("profile.reviews.loading")} />
            ) : reviews.length ? (
              <div className="profile-review-list">
                {reviews.map((review) => (
                  <article key={review.id ?? review.Id} className="profile-review-item">
                    <div className="profile-review-cover">
                      <BookCover
                        variant="fill"
                        src={getBookCoverSrc(review, review?.bookCoverUrl ?? review?.BookCoverUrl)}
                        alt={review.bookTitle || review.BookTitle || t("profile.public.reviewTargetFallback")}
                        className="profile-review-coverMedia"
                      />
                    </div>

                    <div className="profile-review-body">
                      <div className="profile-review-top">
                        <div>
                          <Link
                            to={`/book/${review.bookId ?? review.BookId}`}
                            className="profile-review-book-link"
                          >
                            {review.bookTitle || review.BookTitle || t("profile.public.reviewTargetFallback")}
                          </Link>
                          <p className="profile-review-date">
                            {formatDateTime(review.createdAt ?? review.CreatedAt) || t("profile.unknownDate")}
                          </p>
                        </div>

                        <div className="profile-review-score">
                          {Number(review.rating ?? review.Rating ?? 0)} / 5
                        </div>
                      </div>

                      <p className="profile-review-content">{review.content ?? review.Content ?? ""}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("profile.public.reviewsEmptyTitle")}
                subtitle={t("profile.public.reviewsEmptySubtitle")}
              />
            )}
          </section>
        )}

        {activeTab === "comments" && (
          <section className="profile-panel">
            <div className="profile-section-head">
              <div>
                <h2>{t("profile.public.commentsTitle")}</h2>
                <p>{t("profile.public.commentsSubtitle")}</p>
              </div>
            </div>

            {loading ? (
              <LoadingState text={t("reader.comments.loading")} />
            ) : comments.length ? (
              <div className="profile-public-comment-list">
                {comments.map((comment) => (
                  <article key={comment.id ?? comment.Id} className="profile-public-comment-item">
                    <div className="profile-public-comment-head">
                      <div>
                        <Link
                          to={`/book/${comment.bookId ?? comment.BookId}/chapter/${comment.chapterId ?? comment.ChapterId}`}
                          className="profile-review-book-link"
                        >
                          {comment.bookTitle ?? comment.BookTitle ?? t("profile.public.reviewTargetFallback")}
                        </Link>
                        <p className="profile-review-date">
                          {t("profile.public.chapterFallback", {
                            chapter: comment.chapterNumber ?? comment.ChapterNumber ?? 0,
                          })}
                          {" • "}
                          {formatDateTime(comment.createdAt ?? comment.CreatedAt) || t("profile.unknownDate")}
                        </p>
                      </div>

                      <Link
                        to={`/book/${comment.bookId ?? comment.BookId}/chapter/${comment.chapterId ?? comment.ChapterId}`}
                        className="profile-public-comment-link"
                      >
                        {t("profile.public.openChapter")}
                      </Link>
                    </div>

                    <p className="profile-public-comment-content">
                      {comment.content ?? comment.Content ?? ""}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("profile.public.commentsEmptyTitle")}
                subtitle={t("profile.public.commentsEmptySubtitle")}
              />
            )}
          </section>
        )}

        {activeTab === "books" && (
          <section className="profile-panel">
            <div className="profile-section-head">
              <div>
                <h2>{t("profile.public.booksTitle")}</h2>
                <p>{t("profile.public.booksSubtitle")}</p>
              </div>
            </div>

            {loading ? (
              <LoadingState text={t("browse.page.loading")} />
            ) : authorBooks.length ? (
              <div className="profile-public-book-grid">
                {authorBooks.map((book) => (
                  <Link
                    key={book.id ?? book.Id}
                    to={`/book/${book.id ?? book.Id}`}
                    className="profile-public-book-card"
                  >
                    <div className="profile-public-book-cover">
                      <BookCover
                        variant="tile"
                        src={getBookCoverSrc(book)}
                        alt={book.title || book.Title || t("common.books.untitled")}
                      />
                    </div>
                    <div className="profile-public-book-copy">
                      <h3>{book.title || book.Title || t("common.books.untitled")}</h3>
                      <p>{book.authorName || book.AuthorName || displayName}</p>
                      <div className="profile-public-book-meta">
                        <Chip tone="neutral">{book.status || book.Status || "Unknown"}</Chip>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("profile.public.booksEmptyTitle")}
                subtitle={t("profile.public.booksEmptySubtitle")}
              />
            )}
          </section>
        )}

        {activeTab === "library" && (
          <section className="profile-panel">
            <div className="profile-section-head">
              <div>
                <h2>{t("profile.public.libraryTitle")}</h2>
                <p>{t("profile.public.librarySubtitle")}</p>
              </div>
            </div>

            {loading ? (
              <LoadingState text={t("browse.page.loading")} />
            ) : libraryBooks.length ? (
              <div className="profile-public-book-grid">
                {libraryBooks.map((book) => (
                  <Link
                    key={book.bookId ?? book.BookId}
                    to={`/book/${book.bookId ?? book.BookId}`}
                    className="profile-public-book-card"
                  >
                    <div className="profile-public-book-cover">
                      <BookCover
                        variant="tile"
                        src={getBookCoverSrc(book)}
                        alt={book.title || book.Title || t("common.books.untitled")}
                      />
                    </div>
                    <div className="profile-public-book-copy">
                      <h3>{book.title || book.Title || t("common.books.untitled")}</h3>
                      <p>{t("common.actions.openBook")}</p>
                      <div className="profile-public-book-meta">
                        <Chip tone="neutral">{book.status || book.Status || "Unknown"}</Chip>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("profile.public.libraryEmptyTitle")}
                subtitle={t("profile.public.libraryEmptySubtitle")}
              />
            )}
          </section>
        )}
      </section>
    </div>
  );
}
