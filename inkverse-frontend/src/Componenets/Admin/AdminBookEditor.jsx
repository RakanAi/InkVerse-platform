import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import { absUrl } from "../../Utils/absUrl";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import Surface from "../../Shared/ui/Surface";
import DropdownSelectSearchable from "../../Shared/ui/DropdownSelectSearchable";
import MultiSelectDropdownSearchable from "../../Shared/ui/MultiSelectDropdownSearchable";
import AdminSection from "../../features/admin/components/AdminSection";
import { buildBookCoverUploadFile } from "../../domain/books/build-book-cover-upload-file";
import AdminFormField from "../../features/admin/components/AdminFormField";
import {
  fetchBookAiApproval,
  updateBookAiApproval,
} from "../../Api/monetization.api";

function CoverPreview({ src, title }) {
  const [failed, setFailed] = useState(false);
  const resolved = src && !failed ? absUrl(src) : "";
  const initial = (title || "InkVerse").trim().slice(0, 1).toUpperCase() || "I";

  return (
    <div className="admin-book-editor__cover-preview">
      {resolved ? (
        <img src={resolved} alt="Book cover preview" onError={() => setFailed(true)} />
      ) : (
        <div className="admin-book-editor__cover-placeholder">
          <span>{initial}</span>
          <small>No cover yet</small>
        </div>
      )}
    </div>
  );
}

function SelectionSummary({ items, emptyText, onRemove }) {
  if (!items.length) {
    return <p className="admin-book-editor__selection-empty">{emptyText}</p>;
  }

  return (
    <div className="admin-book-editor__selection-summary">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className="admin-book-editor__selection-chip"
          onClick={() => onRemove(item.value)}
        >
          <span>{item.label}</span>
          <strong aria-hidden="true">×</strong>
        </button>
      ))}
    </div>
  );
}

function getEntityId(entity) {
  return Number(entity?.id ?? entity?.Id ?? entity?.ID ?? 0) || null;
}

function getEntityName(entity, fallback = "Untitled") {
  return entity?.name ?? entity?.Name ?? fallback;
}

function getEntitySlug(entity) {
  return entity?.slug ?? entity?.Slug ?? "";
}

function toOption(entity) {
  const value = getEntityId(entity);
  if (!value) return null;

  return {
    value,
    label: getEntityName(entity),
    meta: getEntitySlug(entity),
  };
}

const STATUS_OPTIONS = [
  { value: "Ongoing", label: "Ongoing" },
  { value: "Paused", label: "Paused" },
  { value: "Dropped", label: "Dropped" },
  { value: "Completed", label: "Completed" },
];

const VERSE_TYPE_OPTIONS = [
  { value: "Original", label: "Original" },
  { value: "Fanfic", label: "Fanfic" },
  { value: "AU", label: "AU" },
];

const ORIGIN_TYPE_OPTIONS = [
  { value: "PlatformOriginal", label: "Platform original" },
  { value: "Translation", label: "Translation" },
];

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
  const [aiApproval, setAiApproval] = useState({
    translationEnabled: false,
    ttsEnabled: false,
  });
  const [savingAiApproval, setSavingAiApproval] = useState(false);
  const fileInputRef = useRef(null);

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

  const genreOptions = useMemo(
    () => allGenres.map(toOption).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label)),
    [allGenres],
  );

  const tagOptions = useMemo(
    () => allTags.map(toOption).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label)),
    [allTags],
  );

  const trendOptions = useMemo(
    () => allTrends.map(toOption).filter(Boolean).sort((a, b) => a.label.localeCompare(b.label)),
    [allTrends],
  );

  const genreMap = useMemo(
    () => new Map(genreOptions.map((option) => [option.value, option])),
    [genreOptions],
  );

  const tagMap = useMemo(
    () => new Map(tagOptions.map((option) => [option.value, option])),
    [tagOptions],
  );

  const trendMap = useMemo(
    () => new Map(trendOptions.map((option) => [option.value, option])),
    [trendOptions],
  );

  const selectedGenres = useMemo(
    () => form.genreIds.map((value) => genreMap.get(value)).filter(Boolean),
    [form.genreIds, genreMap],
  );

  const selectedTags = useMemo(
    () => form.tagIds.map((value) => tagMap.get(value)).filter(Boolean),
    [form.tagIds, tagMap],
  );

  const selectedTrends = useMemo(
    () => form.trendIds.map((value) => trendMap.get(value)).filter(Boolean),
    [form.trendIds, trendMap],
  );

  const toggleId = (values, idValue) => {
    const safe = Array.isArray(values) ? values : [];
    return safe.includes(idValue)
      ? safe.filter((value) => value !== idValue)
      : [...safe, idValue];
  };

  const loadTrendIdsForBook = async (targetBookId, trends) => {
    const linkedTrendIds = await Promise.all(
      (trends ?? []).map(async (trend) => {
        const trendId = getEntityId(trend);
        if (!trendId) return null;

        const idsRes = await api.get(`/admin/trends/${trendId}/book-ids`);
        const ids = Array.isArray(idsRes.data) ? idsRes.data.map(Number) : [];
        return ids.includes(Number(targetBookId)) ? trendId : null;
      }),
    );

    return linkedTrendIds.filter(Boolean);
  };

  const uploadCover = async (file) => {
    if (!file) return;

    try {
      setErr("");
      setUploading(true);

      const optimizedFile = await buildBookCoverUploadFile(file, {
        title: form.title || "book",
      });

      const formData = new FormData();
      formData.append("File", optimizedFile);
      if (bookId) formData.append("EntityId", String(bookId));
      formData.append("EntityName", form.title || "book");
      formData.append("Purpose", "cover");

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
        const approvalRes = await fetchBookAiApproval(bookId).catch(() => null);
        const book = bookRes.data;
        if (approvalRes) {
          setAiApproval({
            translationEnabled: Boolean(approvalRes.translationEnabled ?? approvalRes.TranslationEnabled),
            ttsEnabled: Boolean(approvalRes.ttsEnabled ?? approvalRes.TtsEnabled),
          });
        }

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

        const trendIds = await loadTrendIdsForBook(bookId, trendRes.data ?? []);

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
          sourceUrl: form.originType === "Translation" ? form.sourceUrl : null,
          genreIds: form.genreIds,
          tagIds: form.tagIds,
        };

        await api.put(`/books/${bookId}`, payload);

        const currentTrendIds = await loadTrendIdsForBook(bookId, allTrends);

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

  const saveAiApproval = async () => {
    if (!bookId) return;
    setSavingAiApproval(true);
    setErr("");
    try {
      const updated = await updateBookAiApproval(bookId, aiApproval);
      setAiApproval({
        translationEnabled: Boolean(updated?.translationEnabled ?? updated?.TranslationEnabled),
        ttsEnabled: Boolean(updated?.ttsEnabled ?? updated?.TtsEnabled),
      });
    } catch (error) {
      setErr(error?.response?.data?.message || "Could not save AI service approval.");
    } finally {
      setSavingAiApproval(false);
    }
  };

  if (loading) return <LoadingState text="Loading book editor..." />;

  return (
    <AdminSection
      flat
      className="admin-book-editor-page"
      bodyClassName="admin-book-editor-page__body"
    >
      {err ? <div className="admin-alert">{err}</div> : null}

      <div className="admin-book-editor-stack">
        <Surface className="admin-book-editor-hero">
          <div className="admin-book-editor-hero__grid">
            <aside className="admin-book-editor-cover-card">
              <div className="admin-book-editor-cover-card__preview">
                <CoverPreview src={form.coverImageUrl} title={form.title} />
              </div>

              <div className="admin-book-editor-cover-card__copy">
                <span className="admin-book-editor__eyebrow">Cover artwork</span>
                <h3>{form.title.trim() || "Untitled book"}</h3>
                <p>
                  {form.description.trim() ||
                    "Add a short book description and cover so the shelf card feels complete."}
                </p>
              </div>

              <div className="admin-book-editor-cover-card__meta">
                <span className="admin-pill admin-pill--neutral">{form.status}</span>
                <span className="admin-pill admin-pill--neutral">{form.verseType}</span>
                <span className="admin-pill admin-pill--neutral">
                  {form.originType === "PlatformOriginal"
                    ? "Platform original"
                    : form.originType}
                </span>
              </div>

              <div className="admin-book-editor-cover-card__actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="admin-book-editor__file-input"
                  disabled={uploading}
                  onChange={(event) => uploadCover(event.target.files?.[0])}
                />

                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload cover"}
                </Button>

                {form.coverImageUrl ? (
                  <Button
                    variant="danger"
                    onClick={() => setForm((current) => ({ ...current, coverImageUrl: "" }))}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </aside>

            <div className="admin-book-editor-hero__content">
              <div className="admin-book-editor-hero__head">
                <span className="admin-book-editor__eyebrow">
                  {isEdit ? "Book settings" : "New title"}
                </span>
                <h2 className="admin-book-editor__title">
                  {isEdit ? "Polish the book page" : "Build the book entry"}
                </h2>
                <p className="admin-book-editor__subtitle">
                  Keep the main story details clean here, then use the pickers below for
                  genres, tags, and trend links.
                </p>
              </div>

              <div className="admin-form-grid">
                <AdminFormField label="Title" className="admin-col-12">
                  <input
                    className="admin-input"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Book title"
                  />
                </AdminFormField>

                <AdminFormField label="Description" className="admin-col-12">
                  <textarea
                    className="admin-textarea"
                    rows={6}
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Write the blurb readers should see."
                  />
                </AdminFormField>

                <AdminFormField label="Status" className="admin-col-4">
                  <DropdownSelectSearchable
                    value={form.status}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, status: value }))
                    }
                    options={STATUS_OPTIONS}
                    placeholder="Choose status"
                    searchPlaceholder="Search status..."
                  />
                </AdminFormField>

                <AdminFormField label="Verse type" className="admin-col-4">
                  <DropdownSelectSearchable
                    value={form.verseType}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, verseType: value }))
                    }
                    options={VERSE_TYPE_OPTIONS}
                    placeholder="Choose verse type"
                    searchPlaceholder="Search verse types..."
                  />
                </AdminFormField>

                <AdminFormField label="Origin type" className="admin-col-4">
                  <DropdownSelectSearchable
                    value={form.originType}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, originType: value }))
                    }
                    options={ORIGIN_TYPE_OPTIONS}
                    placeholder="Choose origin type"
                    searchPlaceholder="Search origin types..."
                  />
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
              </div>
            </div>
          </div>
        </Surface>

        {isEdit ? (
          <Surface className="admin-book-editor-pickers">
            <div className="admin-book-editor-pickers__head">
              <span className="admin-book-editor__eyebrow">Reader AI services</span>
              <h3>Approve translation and TTS</h3>
              <p>
                Reader-paid AI services only work after admin approval for this book.
              </p>
            </div>
            <div className="admin-book-editor__selection-summary">
              <label className="admin-book-editor__selection-chip">
                <input
                  type="checkbox"
                  checked={aiApproval.translationEnabled}
                  onChange={(event) =>
                    setAiApproval((current) => ({
                      ...current,
                      translationEnabled: event.target.checked,
                    }))
                  }
                />
                <span>AI translation</span>
              </label>
              <label className="admin-book-editor__selection-chip">
                <input
                  type="checkbox"
                  checked={aiApproval.ttsEnabled}
                  onChange={(event) =>
                    setAiApproval((current) => ({
                      ...current,
                      ttsEnabled: event.target.checked,
                    }))
                  }
                />
                <span>AI TTS</span>
              </label>
              <Button type="button" variant="outline" onClick={saveAiApproval} disabled={savingAiApproval}>
                {savingAiApproval ? "Saving..." : "Save AI approval"}
              </Button>
            </div>
          </Surface>
        ) : null}

        <Surface className="admin-book-editor-pickers">
          <div className="admin-book-editor-pickers__head">
            <span className="admin-book-editor__eyebrow">Discovery setup</span>
            <h3>Pick the shelf signals</h3>
            <p>
              Use searchable pickers instead of huge checklists. You can remove any
              selected item directly from the chips below.
            </p>
          </div>

          <div className="admin-book-editor-pickers__grid">
            <AdminFormField label="Genres">
              <MultiSelectDropdownSearchable
                label={
                  form.genreIds.length ? `${form.genreIds.length} genres selected` : "Choose genres"
                }
                values={form.genreIds}
                onChange={(values) =>
                  setForm((current) => ({ ...current, genreIds: values }))
                }
                options={genreOptions}
                searchPlaceholder="Search genres..."
                className="admin-book-editor__dropdown"
              />
              <SelectionSummary
                items={selectedGenres}
                emptyText="No genres selected yet."
                onRemove={(value) =>
                  setForm((current) => ({
                    ...current,
                    genreIds: toggleId(current.genreIds, value),
                  }))
                }
              />
            </AdminFormField>

            <AdminFormField label="Tags">
              <MultiSelectDropdownSearchable
                label={form.tagIds.length ? `${form.tagIds.length} tags selected` : "Choose tags"}
                values={form.tagIds}
                onChange={(values) => setForm((current) => ({ ...current, tagIds: values }))}
                options={tagOptions}
                searchPlaceholder="Search tags..."
                className="admin-book-editor__dropdown"
              />
              <SelectionSummary
                items={selectedTags}
                emptyText="No tags selected yet."
                onRemove={(value) =>
                  setForm((current) => ({
                    ...current,
                    tagIds: toggleId(current.tagIds, value),
                  }))
                }
              />
            </AdminFormField>

            <AdminFormField label="Trends">
              <MultiSelectDropdownSearchable
                label={
                  form.trendIds.length
                    ? `${form.trendIds.length} trends linked`
                    : "Link trends"
                }
                values={form.trendIds}
                onChange={(values) => setForm((current) => ({ ...current, trendIds: values }))}
                options={trendOptions}
                searchPlaceholder="Search trends..."
                className="admin-book-editor__dropdown"
              />
              <SelectionSummary
                items={selectedTrends}
                emptyText="No trends linked yet."
                onRemove={(value) =>
                  setForm((current) => ({
                    ...current,
                    trendIds: toggleId(current.trendIds, value),
                  }))
                }
              />
            </AdminFormField>
          </div>
        </Surface>

        <div className="admin-book-editor__footer admin-form-actions">
          <Button variant="outline" onClick={() => nav("/admin/books")}>
            Cancel
          </Button>
          <Button onClick={save} disabled={uploading}>
            {isEdit ? "Save changes" : "Create book"}
          </Button>
        </div>
      </div>
    </AdminSection>
  );
}
