import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import "./NewBooks.css";
import { absUrl } from "../../../Utils/absUrl";

const FALLBACK_COVER = "/src/assets/BackGround_04.png";

export default function NewBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleBooks, setVisibleBooks] = useState(6);

  // control how many items we SHOW (matches your old behavior)
  useEffect(() => {
    const updateVisibleBooks = () => {
      if (window.innerWidth >= 992) setVisibleBooks(6);
      else if (window.innerWidth >= 768) setVisibleBooks(4);
      else setVisibleBooks(3);
    };

    updateVisibleBooks();
    window.addEventListener("resize", updateVisibleBooks);
    return () => window.removeEventListener("resize", updateVisibleBooks);
  }, []);

  // fetch enough for the biggest layout (6), then slice by visibleBooks
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get(
          "/books?SortBy=CreatedAt&IsAscending=false&pageSize=6&pageNumber=1",
        );

        const list = Array.isArray(res.data)
          ? res.data
          : (res.data?.items ?? []);
        if (alive) setBooks(list);
      } catch (err) {
        console.error("Error fetching new books", err);
        if (alive) setBooks([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section
      className="iv-section mt-3"
      style={{ maxWidth: "1300px", justifySelf: "center" }}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex">
          <h2 className="borderStart mt-2"></h2>
          <h4 className="text-dark text-start mt-2 mb-2">New Books</h4>
        </div>

        <Link className="iv-link small mt-2" to="/Browser">
          See all →
        </Link>
      </div>

      {loading ? (
        <div className="text-muted">Loading new books…</div>
      ) : books.length === 0 ? (
        <div className="text-muted">No books yet.</div>
      ) : (
        <div className="iv-books-row">
          {books.slice(0, visibleBooks).map((book) => {
            const authorId =
              book.authorId ?? book.AuthorId ?? book.userId ?? book.UserId;
            const authorName =
              book.authorName ??
              book.AuthorName ??
              book.userName ??
              book.UserName;

            const imageUrl =
              book.coverImageUrl ??
              book.CoverImageUrl ??
              book.imageUrl ??
              book.ImageUrl ??
              "";

            const coverSrc = imageUrl
              ? absUrl(imageUrl)
              : "/img/placeholder-cover.png";

            return (
              <div key={book.id} className="iv-book-card">
                <Link
                  to={`/book/${book.id}`}
                  className="iv-book-main text-decoration-none"
                >
                  <div className="iv-cover-wrap">
                    <img
                      src={coverSrc}
                      alt={book.title}
                      className="iv-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="iv-meta">
                    <div className="iv-title" title={book.title}>
                      {book.title}
                    </div>
                  </div>
                </Link>

                {authorId ? (
                  <Link to={`/author/${authorId}`} className="iv-author">
                    {authorName || "Unknown author"}
                  </Link>
                ) : (
                  <div className="iv-author">
                    {authorName || "Unknown author"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
