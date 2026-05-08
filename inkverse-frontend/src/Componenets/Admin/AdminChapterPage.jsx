import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import LinkButton from "../../Shared/ui/LinkButton";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import EmptyState from "../../Shared/ui/EmptyState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminTable from "../../features/admin/components/AdminTable";

export default function AdminChaptersPage() {
  const { bookId } = useParams();
  const bId = Number(bookId);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const normalizeImportedChapter = (chapter) => {
    const number = Number(chapter.number ?? chapter.chapterNumber ?? 0) || 0;
    const title = (chapter.title ?? "").trim();
    const content = (chapter.content ?? "").trim();
    return { number, title, content };
  };

  const getChapterNumber = (chapter) =>
    Number(chapter?.chapterNumber ?? chapter?.ChapterNumber ?? 0) || 0;

  const getChapterUrl = (chapter) => String(chapter?.url ?? chapter?.Url ?? "").trim();

  const importChaptersFile = async (file) => {
    if (!file) return;

    try {
      setErr("");
      setImporting(true);

      let currentItems = items;
      if (!Array.isArray(currentItems) || currentItems.length === 0) {
        const chapterRes = await api.get(`/admin/books/${bId}/chapters`);
        currentItems = Array.isArray(chapterRes.data) ? chapterRes.data : [];
      }

      const existingNumbers = new Set(
        currentItems.map(getChapterNumber).filter((value) => value > 0),
      );

      const existingUrls = new Set(currentItems.map(getChapterUrl).filter(Boolean));

      const text = await file.text();
      const data = JSON.parse(text);
      const chapters = Array.isArray(data?.chapters) ? data.chapters : [];

      if (!chapters.length) {
        setErr("No chapters found in this JSON file.");
        return;
      }

      const sorted = chapters
        .map(normalizeImportedChapter)
        .filter((chapter) => chapter.title && chapter.content)
        .sort((left, right) => (left.number || 0) - (right.number || 0));

      if (!sorted.length) {
        setErr("Chapters were found, but titles or content were empty after parsing.");
        return;
      }

      const missingOnly = sorted.filter((chapter) => {
        const number = Number(chapter.number) || 0;
        const url = (chapter.url || "").trim();
        const duplicateNumber = number > 0 && existingNumbers.has(number);
        const duplicateUrl = url && existingUrls.has(url);
        return !duplicateNumber && !duplicateUrl;
      });

      if (!missingOnly.length) {
        window.alert("All chapters in this file already exist.");
        return;
      }

      let created = 0;
      let skipped = sorted.length - missingOnly.length;

      for (const chapter of missingOnly) {
        if (chapter.number) existingNumbers.add(chapter.number);
        if (chapter.url) existingUrls.add(chapter.url);

        try {
          await api.post(`/admin/books/${bId}/chapters`, {
            title: chapter.title,
            content: chapter.content,
            chapterNumber: chapter.number || 1,
            arcId: null,
          });
          created += 1;
        } catch (error) {
          if (error?.response?.status === 409) {
            skipped += 1;
            continue;
          }
          throw error;
        }
      }

      await load();
      window.alert(`Import done. Added: ${created} | Skipped: ${skipped}`);
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || error.message || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  const groups = useMemo(() => {
    const list = Array.isArray(items) ? items : [];
    if (!list.length) return [];

    const hasRealArcs = list.some((chapter) => chapter.arcId != null);

    if (hasRealArcs) {
      const map = new Map();

      for (const chapter of list) {
        const rawName = chapter.arcName ?? chapter.ArcName;
        const cleanedName =
          rawName && String(rawName).trim().toLowerCase() !== "null"
            ? String(rawName).trim()
            : "";

        const key = cleanedName || "No arc";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(chapter);
      }

      return Array.from(map.entries()).map(([name, chapters]) => ({
        name,
        chapters: chapters
          .slice()
          .sort((left, right) => (left.chapterNumber ?? 0) - (right.chapterNumber ?? 0)),
      }));
    }

    const maxNumber = Math.max(...list.map((chapter) => Number(chapter.chapterNumber) || 0));
    const step = maxNumber > 300 ? 250 : 100;

    const map = new Map();
    for (const chapter of list) {
      const number = Number(chapter.chapterNumber) || 0;
      const start = Math.floor((Math.max(number, 1) - 1) / step) * step + 1;
      const end = start + step - 1;
      const key = `${start}–${end}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(chapter);
    }

    const parseStart = (label) => Number(label.split("–")[0]) || 0;

    return Array.from(map.entries())
      .sort((left, right) => parseStart(left[0]) - parseStart(right[0]))
      .map(([name, chapters]) => ({
        name,
        chapters: chapters
          .slice()
          .sort((left, right) => (left.chapterNumber ?? 0) - (right.chapterNumber ?? 0)),
      }));
  }, [items]);

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const [chapterRes, bookRes] = await Promise.all([
        api.get(`/admin/books/${bId}/chapters`),
        api.get(`/books/${bId}`),
      ]);

      setItems(Array.isArray(chapterRes.data) ? chapterRes.data : []);
      setBookTitle(bookRes.data?.title ?? "");
    } catch (error) {
      console.error(error);
      setErr("Failed to load chapters.");
      setItems([]);
      setBookTitle("");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bId]);

  const remove = async (chapterId) => {
    if (!window.confirm("Delete this chapter?")) return;

    try {
      await api.delete(`/admin/books/${bId}/chapters/${chapterId}`);
      await load();
    } catch (error) {
      console.error(error);
      window.alert("Delete failed.");
    }
  };

  if (loading) return <LoadingState text="Loading chapters..." />;
  if (err && !items.length) return <ErrorState title="Cannot load chapters" subtitle={err} onRetry={load} />;

  return (
    <>
      <AdminSection
        title={bookTitle ? `Book: ${bookTitle}` : `Book #${bId}`}
        actions={
          <div className="admin-inline-actions">
            <label className="iv-btn iv-btn-outline iv-btn-sm">
              {importing ? "Importing..." : "Import JSON"}
              <input
                type="file"
                hidden
                accept="application/json"
                disabled={importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  importChaptersFile(file);
                }}
              />
            </label>
            <LinkButton to={`/admin/books/${bId}/chapters/new`}>New chapter</LinkButton>
          </div>
        }
      >
        {err ? <div className="admin-alert">{err}</div> : null}
        <p className="admin-page-note">
          Chapters are grouped by real arcs when available, otherwise by numbered ranges.
        </p>
      </AdminSection>

      {!groups.length ? (
        <EmptyState title="No chapters yet" subtitle="Import a batch or create the first chapter." />
      ) : (
        groups.map((group) => (
          <AdminSection key={group.name} title={group.name}>
            <AdminTable
              compact
              columns={[
                {
                  key: "chapterNumber",
                  label: "#",
                  width: 90,
                  render: (chapter) => chapter.chapterNumber,
                },
                {
                  key: "title",
                  label: "Title",
                  render: (chapter) => (
                    <div className="admin-simple-stack admin-simple-stack--sm">
                      <p className="admin-row-title">{chapter.title}</p>
                      <p className="admin-row-note">
                        {chapter.arcName ?? chapter.ArcName ?? "No arc"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  align: "right",
                  width: 240,
                  render: (chapter) => (
                    <div className="admin-action-row">
                      <LinkButton
                        to={`/admin/books/${bId}/chapters/${chapter.id}`}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </LinkButton>
                      <Button variant="danger" size="sm" onClick={() => remove(chapter.id)}>
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={group.chapters}
              rowKey="id"
              emptyTitle="No chapters in this group"
              emptySubtitle="Add a chapter to populate this section."
            />
          </AdminSection>
        ))
      )}
    </>
  );
}
