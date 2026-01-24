// ✅ ContentSection.jsx (FULL FIX)
// - Mobile: offcanvas from BOTTOM
// - LG+: offcanvas from RIGHT
// - Same buttons behavior + mobile tap toolbar
// - Reader settings (font size/line height/font) persisted in localStorage
// - No duplicate IDs, no CSS hacks

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import "./PageParts.css";
import PageBread from "./PageBBP";
import ChapterComments from "./ChapterComments";
import AuthContext from "../../Context/AuthProvider";
import ReaderSettings, { loadReaderPrefs, saveReaderPrefs } from "./ReaderSettings";

export default function ContentSection() {
  const { id, chapterId } = useParams(); // id = bookId
  const navigate = useNavigate();

  const [chapter, setChapter] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);

  const { auth } = useContext(AuthContext);
  const myUserId = auth?.user?.id;

  // prevent duplicate save (StrictMode / re-render)
  const lastSavedKeyRef = useRef(null);

  // =========================
  // Reader prefs + mobile tools
  // =========================
  const [prefs, setPrefs] = useState(() => loadReaderPrefs());
  useEffect(() => saveReaderPrefs(prefs), [prefs]);

  const [toolsOpen, setToolsOpen] = useState(false);
  const hideTimerRef = useRef(null);

  const showTools = useCallback(() => {
    setToolsOpen(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setToolsOpen(false), 3500);
  }, []);

  const toggleTools = useCallback(() => {
    setToolsOpen((v) => {
      const next = !v;
      if (next) {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setToolsOpen(false), 3500);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // =========================
  // Data fetching
  // =========================
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

  // Save progress after chapter loads
  useEffect(() => {
    const saveProgress = async () => {
      if (!id || !chapterId || !chapter) return;

      const key = `${id}:${chapterId}`;
      if (lastSavedKeyRef.current === key) return;
      lastSavedKeyRef.current = key;

      try {
        setSaving(true);

        await api.post(`/books/${id}/reading-progress/${chapterId}`);

        try {
          await api.post(`/books/${id}/library/touch-last-read/${chapterId}`);
        } catch (e2) {
          console.log("touch-last-read failed (ignored):", e2);
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

  const goTo = useCallback(
    (targetChapterId) => {
      if (!targetChapterId || !id) return;
      navigate(`/book/${id}/chapter/${targetChapterId}`);
    },
    [id, navigate]
  );

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

  // =========================
  // UI states
  // =========================
  if (loading) return <p>Loading chapter...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!chapter)
    return (
      <p className="my-5 fs-1 fw-bold border-bottom p-5">Chapter not found.</p>
    );

  // =========================
  // Small reusable list for chapters
  // =========================
  const ChapterList = ({ dismissTarget = true }) => (
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
            {...(dismissTarget ? { "data-bs-dismiss": "offcanvas" } : {})}
            onClick={() => goTo(c.id)}
          >
            <span className="me-2 text-truncate">{c.title || "Untitled"}</span>
            <span className="badge bg-secondary">#{c.chapterNumber ?? "?"}</span>
          </button>
        ))}
      {!chapters?.length && (
        <p className="text-muted mt-3 mb-0">No chapters yet.</p>
      )}
    </div>
  );

  // =========================
  // RENDER
  // =========================
  return (
    <div className="reader-page">
      <div className="reader-shell">
        {/* MAIN READER */}
        <main className="reader-main" onClick={toggleTools}>
          <PageBread />

          <div className="reader-header">
            <h3 className="reader-title">{chapter.title}</h3>
            <span className="reader-saving">{saving ? "Saving..." : ""}</span>
          </div>

          <div className="reader-meta">
            <span className="bi bi-clock">
              {" "}
              Uploaded:{" "}
              {new Date(chapter.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>

            <span className="reader-divider">•</span>

            <span className="bi bi-123">
              {" "}
              Words: {Number(chapter.wordCount ?? 0).toLocaleString()}
            </span>
          </div>

          <div className="reader-navrow" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-outline-secondary border-0"
              disabled={!prevId}
              onClick={() => goTo(prevId)}
              type="button"
            >
              ← Previous
            </button>

            <button
              className="btn btn-outline-secondary border-0"
              disabled={!nextId}
              onClick={() => goTo(nextId)}
              type="button"
            >
              Next →
            </button>
          </div>

          <div
            className={`reader-content font-${prefs.font}`}
            style={{ fontSize: prefs.fontSize, lineHeight: prefs.lineHeight }}
          >
            {String(chapter.content ?? "")
              .split("\n")
              .map((paragraph, idx) => {
                const t = paragraph.trim();
                if (!t) return <div key={idx} style={{ height: 12 }} />;
                return <p key={idx}>{t}</p>;
              })}
          </div>

          <div className="reader-bottom" onClick={(e) => e.stopPropagation()}>
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

          <div className="reader-select" onClick={(e) => e.stopPropagation()}>
            <select
              className="form-select form-select-sm"
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
        </main>

        {/* DESKTOP RAIL (LG+) */}
        <aside className="reader-tools-rail d-none d-lg-flex">
          <button
            className="btn btn-dark text-light reader-toolbtn bi bi-book-half"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#chaptersDesktop"
            aria-controls="chaptersDesktop"
            title="Chapters"
          />
          <button
            className="btn btn-dark text-light reader-toolbtn bi bi-chat-left-text"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#commentsDesktop"
            aria-controls="commentsDesktop"
            title="Comments"
          />
          <button
            className="btn btn-dark text-light reader-toolbtn bi bi-sliders"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#settingsDesktop"
            aria-controls="settingsDesktop"
            title="Settings"
          />
        </aside>
      </div>

      {/* MOBILE TAP TOOLBAR (below LG) */}
      <div className={`iv-mobile-tools ${toolsOpen ? "show" : ""}`}>
        <button
          className="btn btn-dark iv-tool"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#chaptersMobile"
          aria-controls="chaptersMobile"
          onClick={(e) => {
            e.stopPropagation();
            showTools();
          }}
          title="Chapters"
        >
          <i className="bi bi-book-half" />
        </button>

        <button
          className="btn btn-dark iv-tool"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#commentsMobile"
          aria-controls="commentsMobile"
          onClick={(e) => {
            e.stopPropagation();
            showTools();
          }}
          title="Comments"
        >
          <i className="bi bi-chat-left-text" />
        </button>

        <button
          className="btn btn-dark iv-tool"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#settingsMobile"
          aria-controls="settingsMobile"
          onClick={(e) => {
            e.stopPropagation();
            showTools();
          }}
          title="Settings"
        >
          <i className="bi bi-sliders" />
        </button>
      </div>

      {/* =========================
          OFFCANVAS: CHAPTERS
          ========================= */}
      {/* Mobile bottom */}
      <div
        className="offcanvas offcanvas-bottom iv-sheet d-lg-none"
        tabIndex="-1"
        id="chaptersMobile"
        aria-labelledby="chaptersMobileLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="chaptersMobileLabel">
            Chapters
          </h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body p-2">
          <ChapterList />
        </div>
      </div>

      {/* Desktop right */}
      <div
        className="offcanvas offcanvas-end d-none d-lg-flex"
        tabIndex="-1"
        id="chaptersDesktop"
        aria-labelledby="chaptersDesktopLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="chaptersDesktopLabel">
            Chapters
          </h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body p-2">
          <ChapterList />
        </div>
      </div>

      {/* =========================
          OFFCANVAS: COMMENTS
          ========================= */}
      {/* Mobile bottom */}
      <div
        className="offcanvas offcanvas-bottom iv-sheet d-lg-none"
        tabIndex="-1"
        id="commentsMobile"
        aria-labelledby="commentsMobileLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="commentsMobileLabel">
            Comments
          </h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body p-2">
          <ChapterComments chapterId={chapterId} myUserId={myUserId} />
        </div>
      </div>

      {/* Desktop right */}
      <div
        className="offcanvas offcanvas-end d-none d-lg-flex"
        tabIndex="-1"
        id="commentsDesktop"
        aria-labelledby="commentsDesktopLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="commentsDesktopLabel">
            Comments
          </h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>
        <div className="offcanvas-body p-2">
          <ChapterComments chapterId={chapterId} myUserId={myUserId} />
        </div>
      </div>

      {/* =========================
          OFFCANVAS: SETTINGS
          ========================= */}
      {/* Mobile bottom */}
      <div className="d-lg-none">
        <ReaderSettings value={prefs} onChange={setPrefs} offcanvasId="settingsMobile" />
      </div>

      {/* Desktop right */}
      <div
        className="offcanvas offcanvas-end d-none d-lg-flex"
        tabIndex="-1"
        id="settingsDesktop"
        aria-labelledby="settingsDesktopLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="settingsDesktopLabel">
            Reader settings
          </h5>
          <button className="btn-close" data-bs-dismiss="offcanvas" />
        </div>

        <div className="offcanvas-body">
          {/* Reuse the same settings UI by rendering the component body inside */}
          {/* Easiest: render ReaderSettings as a normal component (not offcanvas) */}
          <DesktopSettingsPanel value={prefs} onChange={setPrefs} />
        </div>
      </div>
    </div>
  );
}

// ✅ Desktop settings panel (same controls, NOT an offcanvas)
function DesktopSettingsPanel({ value, onChange }) {
  const prefs = value;

  const fonts = useMemo(
    () => [
      { value: "system", label: "System" },
      { value: "serif", label: "Serif" },
      { value: "sans", label: "Sans" },
      { value: "mono", label: "Mono" },
    ],
    []
  );

  const set = (patch) => onChange?.({ ...prefs, ...patch });

  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <div className="d-flex justify-content-between">
          <span className="fw-semibold">Text size</span>
          <span className="text-muted">{prefs.fontSize}px</span>
        </div>
        <input
          className="form-range"
          type="range"
          min="14"
          max="28"
          value={prefs.fontSize}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
        />
      </div>

      <div>
        <div className="d-flex justify-content-between">
          <span className="fw-semibold">Line spacing</span>
          <span className="text-muted">{prefs.lineHeight.toFixed(2)}</span>
        </div>
        <input
          className="form-range"
          type="range"
          min="1.4"
          max="2.4"
          step="0.05"
          value={prefs.lineHeight}
          onChange={(e) => set({ lineHeight: Number(e.target.value) })}
        />
      </div>

      <div>
        <div className="fw-semibold mb-1">Font</div>
        <select
          className="form-select"
          value={prefs.font}
          onChange={(e) => set({ font: e.target.value })}
        >
          {fonts.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <button className="btn btn-outline-secondary" type="button" onClick={() => onChange?.({
        fontSize: 18,
        lineHeight: 1.85,
        font: "system",
      })}>
        Reset to default
      </button>
    </div>
  );
}
