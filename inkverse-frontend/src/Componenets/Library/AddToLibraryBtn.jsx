import { useEffect, useState } from "react";
import api from "../../Api/api";
import "./AddToLibraryBtn.css";

export default function LibraryButton({ bookId, className = "" }) {
  const [inLibrary, setInLibrary] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    (async () => {
      try {
        const res = await api.get(`/books/${bookId}/in-library`);
        setInLibrary(!!res.data?.inLibrary);
      } catch {
        setInLibrary(false); // guest or 401
      }
    })();
  }, [bookId]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (inLibrary) {
        await api.delete(`/books/${bookId}/library`);
        setInLibrary(false);
      } else {
        await api.post(`/books/${bookId}/library`);
        setInLibrary(true);
      }
    } catch (e) {
        console.error("Add to library failed:", e);
      alert("Please sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`iv-book-hero__cta iv-book-hero__cta--secondary iv-library-btn ${inLibrary ? "is-active" : ""} ${className}`.trim()}
      type="button"
      onClick={toggle}
      disabled={loading}
    >
      <i
        className={`bi ${inLibrary ? "bi-bookmark-check-fill" : "bi-bookmark-plus"}`}
        aria-hidden="true"
      />
      <span>
        {loading
          ? "Updating..."
          : inLibrary
            ? "Saved to Library"
            : "Save to Library"}
      </span>
    </button>
  );
}
