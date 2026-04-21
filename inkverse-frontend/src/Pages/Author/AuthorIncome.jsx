import { useCallback, useEffect, useMemo, useState } from "react";
import Surface from "../../Shared/ui/Surface";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import { fetchMyBooks } from "./authorApi";

export default function AuthorIncome() {
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
      setError(e?.response?.data?.message || "Failed to load income data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analytics = useMemo(() => {
    const totalViews = books.reduce((sum, b) => sum + (b.totalViews || 0), 0);
    const totalWords = books.reduce((sum, b) => sum + (b.wordCount || 0), 0);
    const totalBooks = books.length;
    const estRevenue = totalViews * 0.0025;

    const best = [...books]
      .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
      .slice(0, 5);

    return { totalViews, totalWords, totalBooks, estRevenue, best };
  }, [books]);

  if (loading) return <LoadingState text="Loading income analytics..." />;
  if (error) return <ErrorState title="Income Unavailable" subtitle={error} onRetry={load} />;

  return (
    <div className="authorx-page">
      <section className="authorx-hero">
        <div>
          <h1>Income & Performance</h1>
          <p>Real-time overview based on your current books and traffic.</p>
        </div>
      </section>

      <section className="authorx-kpi-grid">
        <Surface className="authorx-kpi-card"><span>Estimated Revenue</span><strong>${analytics.estRevenue.toFixed(2)}</strong></Surface>
        <Surface className="authorx-kpi-card"><span>Total Views</span><strong>{analytics.totalViews.toLocaleString()}</strong></Surface>
        <Surface className="authorx-kpi-card"><span>Total Words</span><strong>{analytics.totalWords.toLocaleString()}</strong></Surface>
        <Surface className="authorx-kpi-card"><span>Published Books</span><strong>{analytics.totalBooks}</strong></Surface>
      </section>

      <Surface>
        <div className="authorx-section-head"><h3>Top Earning Potential Stories</h3></div>
        {analytics.best.length === 0 ? (
          <EmptyState title="No books yet" subtitle="Publish books to unlock analytics." />
        ) : (
          <div className="authorx-list">
            {analytics.best.map((book, idx) => (
              <div key={book.id} className="authorx-row">
                <div className="authorx-row-main">
                  <span className="authorx-rank">#{idx + 1}</span>
                  <div>
                    <div className="authorx-row-title">{book.title || "Untitled"}</div>
                    <div className="authorx-row-sub">{(book.totalViews || 0).toLocaleString()} views</div>
                  </div>
                </div>
                <div className="authorx-row-metric">${((book.totalViews || 0) * 0.0025).toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}