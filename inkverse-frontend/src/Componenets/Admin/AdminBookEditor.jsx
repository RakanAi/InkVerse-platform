import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminFormField from "../../features/admin/components/AdminFormField";

function CoverPreview({ src }) {
  const [failed, setFailed] = useState(false);
  const resolved = src && !failed ? absUrl(src) : "";

  return (
    <div className="admin-cover-thumb--wide">
      {resolved ? (
        <img src={resolved} alt="Book cover preview" onError={() => setFailed(true)} />
      ) : (
        <div className="admin-cover-thumb__placeholder">No cover</div>
      )}
    </div>
  );
}

export default function AdminBookEditor({ mode }) {
  const nav = useNavigate();
  const { id } = useParams();

  const isEdit = mode === "edit";
  const bookId = isEdit ? Number(id) : null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [allGenres, setAllGenres] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allTrends, setAllTrends] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    coverImageUrl: "",
    verseType: "Original",
    originType: "PlatformOriginal",
    status: "Ongoing",
    genreIds: [],
    tagIds: [],
    trendIds: [],
    sourceUrl: "",
  });

  const toggleId = (values, idValue) => {
    const safe = Array.isArray(values) ? values : [];
    return safe.includes(idValue)
      ? safe.filter((value) => value !== idValue)
      : [...safe, idValue];
  };

  const uploadCover = async (file) => {
    if (!file) return;

    try {
      setErr("");
      setUploading(true);

      const formData = new FormData();
      formData.append("File", file);

      const res = await api.post("/uploads/books/admin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.url ?? res.data?.Url ?? "";
      if (!url) {
        setErr("Upload succeeded but no URL returned.");
        return;
      }

      setForm((current) => ({ ...current, coverImageUrl: url }));
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data || error?.response?.data?.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setErr("");

      const [genreRes, tagRes, trendRes] = await Promise.all([
        api.get("/admin/genres", { params: { includeInactive: true } }),
        api.get("/admin/tags", { params: { includeInactive: true } }),
        api.get("/admin/trends", { params: { includeInactive: true } }),
      ]);

      setAllGenres(genreRes.data ?? []);
      setAllTags(tagRes.data ?? []);
      setAllTrends(trendRes.data ?? []);

      if (isEdit && bookId) {
        const bookRes = await api.get(`/books/${bookId}`);
        const book = bookRes.data;

        setForm((current) => ({
          ...current,
          title: book.title ?? "",
          description: book.description ?? "",
          coverImageUrl: book.coverImageUrl ?? "",
          verseType: book.verseType ?? book.VerseType ?? "Original",
          originType: book.originType ?? book.OriginType ?? "PlatformOriginal",
          status: book.status ?? book.Status ?? "Ongoing",
          genreIds: Array.isArray(book.genreIds) ? book.genreIds : [],
          tagIds: Array.isArray(book.tagIds) ? book.tagIds : [],
          trendIds: [],
          sourceUrl: book.sourceUrl ?? book.SourceUrl ?? "",
        }));

        const trendIds = [];
        for (const trend of trendRes.data ?? []) {
          const idsRes = await api.get(`/admin/trends/${trend.id}/books`);
          const ids = idsRes.data ?? [];
          if (ids.map(String).includes(String(bookId))) {
            trendIds.push(trend.id);
          }
        }

        setForm((current) => ({ ...current, trendIds }));
      }
    } catch (error) {
      console.error(error);
      setErr("Failed to load editor data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const save = async () => {
    try {
      setErr("");

      if (!form.title.trim()) {
        setErr("Title is required.");
        return;
      }

      if (!isEdit) {
        const payload = {
          title: form.title,
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          verseType: form.verseType,
          originType: form.originType,
          status: form.status,
          sourceUrl: form.originType === "Translation" ? form.sourceUrl : null,
          genreIds: form.genreIds,
          tagIds: form.tagIds,
        };

        const res = await api.post("/books", payload);
        const newId = res.data?.id ?? res.data?.Id;

        if (newId) {
          for (const trendId of form.trendIds) {
            await api.post(`/admin/trends/${trendId}/books`, { bookId: newId });
          }
        }
      } else {
        const payload = {
          title: form.title,
          description: form.description,
          coverImageUrl: form.coverImageUrl,
          verseType: form.verseType,
          originType: form.originType,
          status: form.status,
          genreIds: form.genreIds,
          tagIds: form.tagIds,
        };

        await api.put(`/books/${bookId}`, payload);

        const currentTrendIds = [];
        for (const trend of allTrends) {
          const idsRes = await api.get(`/admin/trends/${trend.id}/books`);
          const ids = idsRes.data ?? [];
          if (ids.map(String).includes(String(bookId))) {
            currentTrendIds.push(trend.id);
          }
        }

        const toAdd = form.trendIds.filter((value) => !currentTrendIds.includes(value));
        const toRemove = currentTrendIds.filter((value) => !form.trendIds.includes(value));

        for (const trendId of toAdd) {
          await api.post(`/admin/trends/${trendId}/books`, { bookId });
        }

        for (const trendId of toRemove) {
          await api.delete(`/admin/trends/${trendId}/books/${bookId}`);
        }
      }

      nav("/admin/books");
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || "Save failed.");
    }
  };

  if (loading) return <LoadingState text="Loading book editor..." />;

  return (
    <AdminSection
      actions={
        <Button variant="outline" onClick={() => nav("/admin/books")}>
          Back
        </Button>
      }
    >
      {err ? <div className="admin-alert">{err}</div> : null}

      <div className="admin-form-grid">
        <AdminFormField label="Title" className="admin-col-12">
          <input
            className="admin-input"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </AdminFormField>

        <AdminFormField label="Description" className="admin-col-12">
          <textarea
            className="admin-textarea"
            rows={5}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
          />
        </AdminFormField>

        <AdminFormField label="Status" className="admin-col-4">
          <select
            className="admin-select"
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="Ongoing">Ongoing</option>
            <option value="Paused">Paused</option>
            <option value="Dropped">Dropped</option>
            <option value="Completed">Completed</option>
          </select>
        </AdminFormField>

        <AdminFormField label="Verse type" className="admin-col-4">
          <select
            className="admin-select"
            value={form.verseType}
            onChange={(event) =>
              setForm((current) => ({ ...current, verseType: event.target.value }))
            }
          >
            <option value="Original">Original</option>
            <option value="Fanfic">Fanfic</option>
            <option value="AU">AU</option>
          </select>
        </AdminFormField>

        <AdminFormField label="Origin type" className="admin-col-4">
          <select
            className="admin-select"
            value={form.originType}
            onChange={(event) =>
              setForm((current) => ({ ...current, originType: event.target.value }))
            }
          >
            <option value="PlatformOriginal">Platform original</option>
            <option value="Translation">Translation</option>
          </select>
        </AdminFormField>

        {form.originType === "Translation" ? (
          <AdminFormField
            label="Source URL"
            hint="Optional link to the original source."
            className="admin-col-12"
          >
            <input
              className="admin-input"
              placeholder="https://example.com/novel/..."
              value={form.sourceUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourceUrl: event.target.value }))
              }
            />
          </AdminFormField>
        ) : null}

        <AdminFormField label="Cover upload" className="admin-col-6">
          <div className="admin-simple-stack">
            <input
              type="file"
              accept="image/*"
              className="admin-input"
              disabled={uploading}
              onChange={(event) => uploadCover(event.target.files?.[0])}
            />
            <div className="admin-inline-actions">
              {uploading ? <span className="admin-row-note">Uploading…</span> : null}
              {form.coverImageUrl ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setForm((current) => ({ ...current, coverImageUrl: "" }))}
                >
                  Remove cover
                </Button>
              ) : null}
            </div>
            <input
              className="admin-input"
              value={form.coverImageUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, coverImageUrl: event.target.value }))
              }
              placeholder="Manual image URL"
            />
          </div>
        </AdminFormField>

        <div className="admin-col-6 admin-preview-stack">
          <CoverPreview src={form.coverImageUrl} />
          <span className="admin-row-note">
            Upload a cover or paste a fallback URL.
          </span>
        </div>

        <AdminFormField label="Genres" className="admin-col-4">
          <div className="admin-choice-grid">
            {allGenres.map((genre) => (
              <label key={genre.id ?? genre.Id ?? genre.ID} className="admin-choice-tile">
                <input
                  type="checkbox"
                  checked={form.genreIds.includes(genre.id ?? genre.Id ?? genre.ID)}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      genreIds: toggleId(
                        current.genreIds,
                        genre.id ?? genre.Id ?? genre.ID,
                      ),
                    }))
                  }
                />
                <div>
                  <span>{genre.name ?? genre.Name}</span>
                  <small>{genre.slug ?? genre.Slug ?? "No slug"}</small>
                </div>
              </label>
            ))}
          </div>
        </AdminFormField>

        <AdminFormField label="Tags" className="admin-col-4">
          <div className="admin-choice-grid">
            {allTags.map((tag) => (
              <label key={tag.id ?? tag.Id ?? tag.ID} className="admin-choice-tile">
                <input
                  type="checkbox"
                  checked={form.tagIds.includes(tag.id ?? tag.Id ?? tag.ID)}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      tagIds: toggleId(current.tagIds, tag.id ?? tag.Id ?? tag.ID),
                    }))
                  }
                />
                <div>
                  <span>{tag.name ?? tag.Name}</span>
                  <small>Reader-facing tag</small>
                </div>
              </label>
            ))}
          </div>
        </AdminFormField>

        <AdminFormField label="Trends" className="admin-col-4">
          <div className="admin-choice-grid">
            {allTrends.map((trend) => (
              <label key={trend.id ?? trend.Id ?? trend.ID} className="admin-choice-tile">
                <input
                  type="checkbox"
                  checked={form.trendIds.includes(trend.id ?? trend.Id ?? trend.ID)}
                  onChange={() =>
                    setForm((current) => ({
                      ...current,
                      trendIds: toggleId(
                        current.trendIds,
                        trend.id ?? trend.Id ?? trend.ID,
                      ),
                    }))
                  }
                />
                <div>
                  <span>{trend.name ?? trend.Name}</span>
                  <small>{trend.slug ?? trend.Slug ?? "No slug"}</small>
                </div>
              </label>
            ))}
          </div>
        </AdminFormField>

        <div className="admin-col-12 admin-form-actions">
          <Button variant="outline" onClick={() => nav("/admin/books")}>
            Cancel
          </Button>
          <Button onClick={save} disabled={uploading}>
            Save book
          </Button>
        </div>
      </div>
    </AdminSection>
  );
}
