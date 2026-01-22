import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingEle from "./BookRating2";
import "./Data.css";
import api from "../../../Api/api";
import LibraryButton from "../../Library/AddToLibraryBtn";
import { absUrl } from "../../../Utils/absUrl";

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
    <div
      className="row mx-0 px-4 py-4 DataBox shadow-lg border align-items-start"
      style={{ position: "relative" }}
    >
      <div className="BookImg text-center text-lg-start col-12 col-lg-auto">
        <img
          src={cover}
          alt={book.title || "Book cover"}
          className="BookImg shadow-lg mt-2"
        />
      </div>

      <div className="d-flex flex-wrap col-12 col-lg-9 mt-3 mt-lg-0 justify-content-start">
        <div className="ps-2 rounded d-flex mt-1 align-items-center">
          <h2 className="borderStart my-0"></h2>
          <h2 className="titleF">{book.title}</h2>
        </div>

        <div className="dataBoxs boxHover flex-fill rounded-3 border text-white">
          <p className="text-lg-start text-center contentHover pt-1">
            Author:{" "}
            <a href="#" className="fs-5 text-decoration-none">
              {book.authorName || "Unknown"}
            </a>
          </p>
        </div>

        <div className="dataBoxs boxHover metadata-content flex-fill rounded-3 border text-white ft-3">
          <RatingEle rating={averageRating ?? book.averageRating ?? 0} />
        </div>

        <div className="d-flex gap-3 flex-wrap justify-content-center justify-content-lg-between col-12 mt-2 mb-2">
          <div className="dataBoxs w-auto rounded-3 border text-white ft-3 boxHover p-2">
            <button
              onClick={handleReadClick}
              className="text-light btn btn-link text-decoration-none"
              type="button"
              disabled={loadingProgress || !hasChapters}
            >
              {loadingProgress
                ? "Loading..."
                : !hasChapters
                  ? "No chapters yet"
                  : lastReadChapterId != null
                    ? "Continue Reading"
                    : "Start Reading"}
            </button>
          </div>
          <div className="dataBoxs w-auto rounded-3 border text-white ft-3 boxHover p-2">
            <LibraryButton bookId={book.id} className="" />{" "}
          </div>
        </div>
      </div>
    </div>
  );
}
