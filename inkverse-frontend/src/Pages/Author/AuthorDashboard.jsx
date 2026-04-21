import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Surface from "../../Shared/ui/Surface";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import { fetchMyBooks } from "./authorApi";

export default function AuthorDashboard() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchMyBooks();
      setBooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load author dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalBooks = books.length;
    const totalWords = books.reduce((sum, b) => sum + (b.wordCount || 0), 0);
    const totalViews = books.reduce((sum, b) => sum + (b.totalViews || 0), 0);
    const avgRating = totalBooks
      ? books.reduce((sum, b) => sum + (b.averageRating || 0), 0) / totalBooks
      : 0;

    const topBooks = [...books]
      .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
      .slice(0, 5);

    const recentBooks = [...books]
      .sort((a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime(),
      )
      .slice(0, 6);

    return { totalBooks, totalWords, totalViews, avgRating, topBooks, recentBooks };
  }, [books]);

  if (loading) return <LoadingState text="Loading your author dashboard..." />;
  if (error) return <ErrorState title="Dashboard Unavailable" subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-page">
      <section className="authorx-hero">
        <div>
          <h1>Author Dashboard</h1>
          <p>Track your stories and performance at a glance.</p>
        </div>
        <div className="authorx-hero-actions">
          <Link to="/author/workspace">
            <Button variant="primary" size="md">Create or Manage Books</Button>
          </Link>
        </div>
      </section>

      <section className="authorx-kpi-grid">
        <Surface className="authorx-kpi-card">
          <span>Books</span>
          <strong>{stats.totalBooks}</strong>
        </Surface>
        <Surface className="authorx-kpi-card">
          <span>Total Words</span>
          <strong>{stats.totalWords.toLocaleString()}</strong>
        </Surface>
        <Surface className="authorx-kpi-card">
          <span>Total Views</span>
          <strong>{stats.totalViews.toLocaleString()}</strong>
        </Surface>
        <Surface className="authorx-kpi-card">
          <span>Average Rating</span>
          <strong>{stats.avgRating.toFixed(2)}</strong>
        </Surface>
      </section>

      <section className="authorx-grid-2">
        <Surface>
          <div className="authorx-section-head">
            <h3>Top Performing Stories</h3>
          </div>
          {stats.topBooks.length === 0 ? (
            <EmptyState title="No books yet" subtitle="Create your first story from Workspace." />
          ) : (
            <div className="authorx-list">
              {stats.topBooks.map((book, idx) => (
                <div key={book.id} className="authorx-row">
                  <div className="authorx-row-main">
                    <span className="authorx-rank">#{idx + 1}</span>
                    <div>
                      <div className="authorx-row-title">{book.title || "Untitled"}</div>
                      <div className="authorx-row-sub">{book.status || "Ongoing"}</div>
                    </div>
                  </div>
                  <div className="authorx-row-metric">{(book.totalViews || 0).toLocaleString()} views</div>
                </div>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <div className="authorx-section-head">
            <h3>Recently Updated</h3>
          </div>
          {stats.recentBooks.length === 0 ? (
            <EmptyState title="No updates yet" subtitle="Your recent books will appear here." />
          ) : (
            <div className="authorx-list">
              {stats.recentBooks.map((book) => (
                <div key={book.id} className="authorx-row">
                  <div>
                    <div className="authorx-row-title">{book.title || "Untitled"}</div>
                    <div className="authorx-row-sub">
                      Updated {new Date(book.updatedAt || book.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                  <Link to={`/book/${book.id}`} className="authorx-link">View</Link>
                </div>
              ))}
            </div>
          )}
        </Surface>
      </section>
    </div>
  );
}