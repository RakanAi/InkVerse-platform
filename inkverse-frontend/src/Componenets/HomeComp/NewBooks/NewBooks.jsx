import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import "./NewBooks.css";

import { getBookCoverSrc } from "@/domain/books/book-cover";
import BookCover from "@/Shared/books/BookCover/BookCover";

import LoadingState from "@/Shared/ui/LoadingState";
import ErrorState from "@/Shared/ui/ErrorState";
import EmptyState from "@/Shared/ui/EmptyState";
import Button from "@/Shared/ui/Button";

import {
  NEWBOOKS_MAX_WIDTH,
  NEWBOOKS_QUERY,
  NEWBOOKS_VISIBLE_BY_WIDTH,
} from "@/features/home/newbooks/newbooks.presets";
import { getVisibleCount } from "@/features/home/newbooks/getVisibleCount";
import { buildBooksQuery } from "@/features/home/newbooks/utils/buildBooksQuery";
import Chip from "@/Shared/ui/Chip";
import PageHeader from "@/Shared/ui/PageHeader";

export default function NewBooks() {
  const [books, setBooks] = useState([]);
  const [visibleBooks, setVisibleBooks] = useState(6);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const endpoint = useMemo(() => buildBooksQuery(NEWBOOKS_QUERY), []);

  const fetchBooks = useCallback(async (aliveRef) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(endpoint);
      const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      if (aliveRef.current) setBooks(list);
    } catch (err) {
      console.error("Error fetching new books", err);
      if (aliveRef.current) {
        setBooks([]);
        setError("Failed to load new books.");
      }
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [endpoint]);

  // control how many items we SHOW (matches your old behavior)
  useEffect(() => {
    const updateVisibleBooks = () => {
      setVisibleBooks(getVisibleCount(window.innerWidth, NEWBOOKS_VISIBLE_BY_WIDTH));
    };

    updateVisibleBooks();
    window.addEventListener("resize", updateVisibleBooks);
    return () => window.removeEventListener("resize", updateVisibleBooks);
  }, []);

  // fetch enough for the biggest layout (6), then slice by visibleBooks
  useEffect(() => {
    const aliveRef = { current: true };
    fetchBooks(aliveRef);

    return () => {
      aliveRef.current = false;
    };
  }, [fetchBooks]);

  return (
    <section
      className="iv-section iv-surface mt-3"
      style={{ maxWidth: `${NEWBOOKS_MAX_WIDTH}px`, justifySelf: "center" }}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex">
           <PageHeader
                        title="Inkverse Leatest"
                        subtitle="Discover the latest stories and worlds just added to InkVerse."
            />
        </div>

        <Link className="iv-link small my-1" to="/Browser">
          <Button>SeeAll→</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingState title="Loading new books…" />
      ) : error ? (
        <div className="d-flex flex-column gap-2">
          <ErrorState title={error} />
          <div>
            <Button variant="secondary" onClick={() => fetchBooks({ current: true })}>
              Retry
            </Button>
          </div>
        </div>
      ) : books.length === 0 ? (
        <EmptyState title="No books yet." />
      ) : (
        <div className="iv-books-row">
          {books.slice(0, visibleBooks).map((book) => {
            const id = book.id ?? book.Id;
            const title = book.title ?? book.Title ?? "Untitled";

            const authorId =
              book.authorId ?? book.AuthorId ?? book.userId ?? book.UserId;
            const authorName =
              book.authorName ??
              book.AuthorName ??
              book.userName ??
              book.UserName;

            return (
              <div key={id} className="iv-book-card">
                <Link
                  to={`/book/${id}`}
                  className="iv-book-main text-decoration-none"
                >
                  <div className="iv-cover-wrap">
                    <BookCover variant="tile" src={getBookCoverSrc(book)} alt={title} />
                  </div>

                  <div className="iv-meta">
                    <div className="iv-title" title={title}>
                      {title}
                    </div>
                  </div>
                </Link>

                {authorId ? (
                  <Link to={`/author/${authorId}`} className="iv-author">
                    {authorName || "Unknown author"}
                  </Link>
                ) : (
                  <div className="iv-author">{authorName || "Unknown author"}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}