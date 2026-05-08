import { useEffect, useMemo, useState } from "react";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import LinkButton from "../../Shared/ui/LinkButton";
import api from "../../Api/api";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminMetricCard from "../../features/admin/components/AdminMetricCard";
import AdminTable from "../../features/admin/components/AdminTable";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr("");
      const res = await api.get("/admin/dashboard/stats");
      setData(res.data);
    } catch (error) {
      console.error(error);
      setErr("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const volumeMetrics = useMemo(() => {
    if (!data) return [];

    return [
      { label: "Catalog titles", value: data.books, meta: "Books currently stored in the platform." },
      { label: "Chapter entries", value: data.chapters, meta: "Drafted or published chapters across all books." },
      { label: "Browse genres", value: data.genres, meta: "Genre lanes readers can filter by." },
      { label: "Discovery tags", value: data.tags, meta: "Reader-facing tags used across the shelf." },
      { label: "Trend rows", value: data.trends, meta: "Curated spotlight collections available now." },
    ];
  }, [data]);

  const attentionMetrics = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Chapterless books",
        value: data.booksWithNoChapters,
        meta: "Titles that still need their first chapter entries.",
      },
      {
        label: "Missing genre links",
        value: data.booksWithNoGenres,
        meta: "Titles not assigned to any browse genre yet.",
      },
      {
        label: "Missing tag links",
        value: data.booksWithNoTags,
        meta: "Titles still absent from tag-led discovery.",
      },
    ];
  }, [data]);

  if (loading) return <LoadingState text="Loading dashboard..." />;
  if (err) return <ErrorState title="Dashboard unavailable" subtitle={err} onRetry={load} />;
  if (!data) return <EmptyState title="No dashboard data" subtitle="Try again in a moment." />;

  return (
    <>
      <AdminSection title="Overview">
        <div className="admin-metric-grid">
          {volumeMetrics.map((metric, index) => (
            <AdminMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              meta={metric.meta}
              tone={index === 0 ? "brand" : "default"}
            />
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Needs attention">
        <div className="admin-alert-grid">
          {attentionMetrics.map((metric) => (
            <AdminMetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              meta={metric.meta}
              tone={Number(metric.value) > 0 ? "warn" : "ok"}
            />
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Latest books">
        <AdminTable
          compact
          columns={[
            {
              key: "title",
              label: "Book",
              render: (book) => (
                <div className="admin-simple-stack admin-simple-stack--sm">
                  <p className="admin-row-title">{book.title}</p>
                  <p className="admin-row-note">{book.status}</p>
                </div>
              ),
            },
            {
              key: "wordCount",
              label: "Words",
              align: "right",
              render: (book) => book.wordCount ?? 0,
            },
            {
              key: "actions",
              label: "Action",
              align: "right",
              render: (book) => (
                <LinkButton to={`/admin/books/${book.id}`} variant="outline" size="sm">
                  Edit
                </LinkButton>
              ),
            },
          ]}
          rows={data.latestBooks ?? []}
          rowKey="id"
          emptyTitle="No books yet"
          emptySubtitle="New titles will appear here."
        />
      </AdminSection>
    </>
  );
}
