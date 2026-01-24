import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingEle from "./BookRating2";
import "./Data.css";
import api from "../../../Api/api";
import LibraryButton from "../../Library/AddToLibraryBtn";
import { absUrl } from "../../../Utils/absUrl";
import BookMetaBox from "./BookMetaBox";

export default function BookData({ book, averageRating }) {
  const navigate = useNavigate();

  // ✅ Hooks must be before any return
  const [lastReadChapterId, setLastReadChapterId] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [hasChapters, setHasChapters] = useState(true);

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

  // ✅ now safe
  if (!book) return null;

  const imageUrl =
    book.coverImageUrl ??
    book.CoverImageUrl ??
    book.imageUrl ??
    book.ImageUrl ??
    "";

  const cover = imageUrl ? absUrl(imageUrl) : "/img/placeholder-cover.png";

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

  return (
    <div className="row mx-0 px-3 px-lg-4 py-4 DataBox  border align-items-stretch">

  {/* LEFT — COVER */}
  <div className="col-auto d-flex justify-content-center justify-content-lg-start pe-3 me-3">
    <div className="iv-coverr">
      <img
        src={cover}
        alt={book.title || "Book cover"}
        className="iv-coverr-img imgHover"
      />
    </div>
  </div>

  {/* RIGHT — CONTENT */}
  <div className="col-12 col-lg d-flex flex-column mt-3 mt-lg-0">

    {/* TOP INFO */}
    <div>
      <div className="text-center text-lg-start titleF mb-2">
        <h1 className="mb-0 titleF" title={book.title}>{book.title}</h1>
      </div>

      <p className="text-white text-center text-lg-start mb-2">
        by <strong>{book.authorName || "Unknown"}</strong>
      </p>
      <div className="">
      <RatingEle rating={averageRating ?? 0} /></div>

      <BookMetaBox book={book} />

    </div>

    {/* PUSH BUTTONS TO BOTTOM */}
    <div className="mt-auto d-flex gap-2 flex-wrap justify-content-center justify-content-lg-between pt-3">

      <button
        onClick={handleReadClick}
        className="btn btn-primary px-4"
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
    </div>
  </div>
</div>

  );
}
