import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../Api/api";
import "./PageParts.css";
import PageBread from "./PageBBP";
import ChapterComments from "./ChapterComments";
import { useContext } from "react";
import AuthContext from "../../Context/AuthProvider";

export default function ContentSection() {
  const { id, chapterId } = useParams(); // id = bookId
  const navigate = useNavigate();

  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]); // list for neighbors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);

  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  // prevent duplicate save (StrictMode / re-render)
  const lastSavedKeyRef = useRef(null);

  // 1) Fetch chapter
  useEffect(() => {
    const fetchChapter = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/chapters/${chapterId}`);
        setChapter(response.data);
      } catch (err) {
        console.error("Failed to fetch chapter:", err);
        setError("Failed to load chapter.");
        setChapter(null);
      } finally {
        setLoading(false);
      }
    };

    if (chapterId) fetchChapter();
  }, [chapterId]);

  // 2) Fetch chapter list for this book (for prev/next)
  useEffect(() => {
    const fetchChapterList = async () => {
      if (!id) return;

      try {
        const res = await api.get(`/chapters/book/${id}`);
        setChapters(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch chapter list:", err);
        setChapters([]);
      }
    };

    fetchChapterList();
  }, [id]);

  // 3) Save progress ONLY after chapter is loaded
  useEffect(() => {
    const saveProgress = async () => {
      if (!id || !chapterId || !chapter) return;

      const key = `${id}:${chapterId}`;
      if (lastSavedKeyRef.current === key) return;
      lastSavedKeyRef.current = key;

      try {
        setSaving(true);

        // ✅ 1) Source of truth: reading progress
        await api.post(`/books/${id}/reading-progress/${chapterId}`);

        // ✅ 2) Optional: also mark in library/history (keep if you want history)
        // If this endpoint requires being "in library", it might 400/404; ignore those.
        try {
          await api.post(`/books/${id}/library/touch-last-read/${chapterId}`);
        } catch (e2) {
          console(e2);
          // ignore if user isn't in library or endpoint rules differ
        }
      } catch (e) {
        if (e?.response?.status === 401 || e?.response?.status === 403) return;
        console.error("Save progress failed:", e);
      } finally {
        setSaving(false);
      }
    };

    saveProgress();
  }, [id, chapterId, chapter]);

  // 4) Compute prev/next using chapterNumber order
  const { prevId, nextId } = useMemo(() => {
    if (!chapters?.length || !chapterId) return { prevId: null, nextId: null };

    const sorted = [...chapters].sort(
      (a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0)
    );

    const currentIndex = sorted.findIndex(
      (c) => String(c.id) === String(chapterId)
    );
    if (currentIndex === -1) return { prevId: null, nextId: null };

    return {
      prevId: sorted[currentIndex - 1]?.id ?? null,
      nextId: sorted[currentIndex + 1]?.id ?? null,
    };
  }, [chapters, chapterId]);

  // 5) Navigation handler (also saves current chapter best-effort)
  const goTo = useCallback(
    (targetChapterId) => {
      if (!targetChapterId || !id) return;
      navigate(`/book/${id}/chapter/${targetChapterId}`);
    },
    [id, navigate]
  );

  // 6) Keyboard navigation (optional)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft" && prevId) goTo(prevId);
      if (e.key === "ArrowRight" && nextId) goTo(nextId);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevId, nextId, goTo]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [chapterId]);

  useEffect(() => {
    const handler = () => {
      if (id && chapterId) {
        navigator.sendBeacon?.(
          `${api.defaults.baseURL}/books/${id}/reading-progress/${chapterId}`
        );
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [id, chapterId]);

  if (loading) return <p>Loading chapter...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!chapter)
    return (
      <p className="my-5 fs-1 fw-bold border-bottom p-5">Chapter not found .</p>
    );

  return (
    <div className="d-flex left">
      <div className="container w-auto"></div>

      <div
        className=" flex-column mt-1  border py-3 mx-auto"
        style={{ maxWidth: "900px", padding: "64px 64px 0px" }}
      >
        <PageBread />

        {/* Header */}
        <div className="d-flex justify-content-start align-items-center">
          <h2 className="borderStart mt-2"></h2>

          <h3 className="text-start m-0">{chapter.title}</h3>
          <span className="text-muted small">{saving ? "Saving..." : ""}</span>
        </div>

        {/* Meta */}
        <div className="d-flex gap-3 text-muted align-items-cente">
          <h2 className="borderStart mt-2"></h2>

          <p className="bi bi-clock">
            Uploaded:{" "}
            {new Date(chapter.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
          <span>-</span>
          <p className="bi bi-123 bi-end">: {chapter.wordCount}</p>
        </div>

        {/* Nav buttons */}
        <div className="d-flex justify-content-start gap-2 my-3">
          <button
            className="btn border-0 btn-outline-secondary"
            disabled={!prevId}
            onClick={() => goTo(prevId)}
            type="button"
          >
            ← Previous
          </button>

          <button
            className="btn border-0 btn-outline-secondary"
            disabled={!nextId}
            onClick={() => goTo(nextId)}
            type="button"
          >
            Next →
          </button>
        </div>

        <br />

        {/* Content */}
        <p className="m-2 text-start">
          {chapter.content.split("\n").map((paragraph, idx) => (
            <span key={idx}>
              {paragraph}
              <br />
              <br />
            </span>
          ))}
        </p>

        {/* Nav buttons */}
        <div className="d-flex  justify-content-center gap-2 my-3">
          <button
            className="btn nextPrev btn-outline-dark"
            disabled={!prevId}
            onClick={() => goTo(prevId)}
            type="button"
          >
            ← Prev
          </button>

          <button
            className="btn nextPrev btn-outline-dark"
            onClick={() => navigate(`/book/${id}`)}
            type="button"
          >
            Home Page
          </button>

          <button
            className="btn nextPrev btn-outline-dark"
            disabled={!nextId}
            onClick={() => goTo(nextId)}
            type="button"
          >
            Next →
          </button>
        </div>

        <div className=" gap-2 my-2 d-flex justify-content-center align-items-center">
          {/* <span className="text-muted small">Chapters:</span> */}

          <select
            className="form-select form-select-sm"
            style={{ maxWidth: 320 }}
            value={String(chapterId ?? "")}
            onChange={(e) => goTo(e.target.value)}
          >
            {chapters
              .slice()
              .sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.chapterNumber ?? "?"}. ${c.title ?? "Untitled"}`}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="container page w-auto">
        <div className="ChaptersBtn reader-tools ">
          <button
            className="btn btn-lg chapters-btn d-none d-lg-block btn-dark text-light btn-outline-secondary bi bi-book-half"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#chaptersOffcanvas"
            aria-controls="chaptersOffcanvas"
          ></button>

          <span className="text-muted small">{saving ? "Saving..." : ""}</span>
        </div>
        <div className="CommentBtn reader-tools">
          {/* Chapters button */}
          <button
            className="btn btn-lg chapters-btn d-none d-lg-block btn-dark text-light bi bi-book-half"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#chaptersOffcanvas"
            aria-controls="chaptersOffcanvas"
            title="Chapters"
          />

          {/* Comments button */}
          <button
            className="btn btn-lg chapters-btn d-none d-lg-block btn-dark text-light bi bi-chat-left-text"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#commentsOffcanvas"
            aria-controls="commentsOffcanvas"
            title="Comments"
            style={{ marginTop: "10px" }}
          />

          <span className="text-muted small">{saving ? "Saving..." : ""}</span>
        </div>

        <div
          className="offcanvas offcanvas-end"
          tabIndex="-1"
          id="chaptersOffcanvas"
          aria-labelledby="chaptersOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="chaptersOffcanvasLabel">
              Chapters
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            />
          </div>

          <div className="offcanvas-body p-2">
            <div className="list-group">
              {[...chapters]
                .sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0))
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={
                      "list-group-item list-group-item-action d-flex justify-content-between align-items-center " +
                      (String(c.id) === String(chapterId) ? "active" : "")
                    }
                    data-bs-dismiss="offcanvas"
                    onClick={() => goTo(c.id)}
                  >
                    <span
                      className="me-2 text-truncate"
                      style={{ maxWidth: 260 }}
                    >
                      {c.title || "Untitled"}
                    </span>

                    <span className="badge bg-secondary">
                      #{c.chapterNumber ?? "?"}
                    </span>
                  </button>
                ))}
            </div>

            {!chapters?.length && (
              <p className="text-muted mt-3 mb-0">No chapters yet.</p>
            )}
          </div>
        </div>
        <div
          className="offcanvas offcanvas-end"
          tabIndex="-1"
          id="commentsOffcanvas"
          aria-labelledby="commentsOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="commentsOffcanvasLabel">
              Comments
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            />
          </div>

          <div className="offcanvas-body p-2">
            <ChapterComments chapterId={chapterId} myUserId={myUserId} />
          </div>
        </div>
      </div>
    </div>
  );
}
