import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../Api/api";
import Button from "../../Shared/ui/Button";
import LoadingState from "../../Shared/ui/LoadingState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminFormField from "../../features/admin/components/AdminFormField";
import AdminDialog from "../../features/admin/components/AdminDialog";

function countWords(text = "") {
  const clean = String(text).trim();
  return clean ? clean.split(/\s+/).length : 0;
}

export default function AdminChapterEditor({ mode }) {
  const nav = useNavigate();
  const { bookId, chapterId } = useParams();

  const bId = Number(bookId);
  const isEdit = mode === "edit";
  const cId = isEdit ? Number(chapterId) : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [arcs, setArcs] = useState([]);
  const [bookTitle, setBookTitle] = useState("");
  const [arcDialogOpen, setArcDialogOpen] = useState(false);
  const [arcDraftName, setArcDraftName] = useState("");
  const [creatingArc, setCreatingArc] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    chapterNumber: 1,
    arcId: null,
  });

  const contentWordCount = countWords(form.content);

  const fetchArcs = async () => {
    const arcsRes = await api.get(`/admin/books/${bId}/arcs`);
    setArcs(Array.isArray(arcsRes.data) ? arcsRes.data : []);
  };

  const load = async () => {
    try {
      setLoading(true);
      setErr("");

      const requests = [api.get(`/admin/books/${bId}/arcs`), api.get(`/books/${bId}`)];
      if (isEdit && cId) {
        requests.push(api.get(`/admin/books/${bId}/chapters/${cId}`));
      }

      const [arcsRes, bookRes, chapterRes] = await Promise.all(requests);

      setArcs(Array.isArray(arcsRes.data) ? arcsRes.data : []);
      setBookTitle(bookRes.data?.title ?? "");

      if (chapterRes?.data) {
        const chapter = chapterRes.data;
        setForm({
          title: chapter.title ?? "",
          content: chapter.content ?? "",
          chapterNumber: chapter.chapterNumber ?? 1,
          arcId: chapter.arcId ?? null,
        });
      }
    } catch (error) {
      console.error(error);
      setErr("Failed to load chapter.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!bId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bId, cId]);

  const createArc = async () => {
    const name = arcDraftName.trim();
    if (!name) {
      setErr("Arc name is required.");
      return;
    }

    try {
      setErr("");
      setCreatingArc(true);

      const res = await api.post(`/admin/books/${bId}/arcs`, { name });
      await fetchArcs();

      const created = res.data;
      const newId = created?.id ?? created?.ID ?? created?.Id ?? null;
      setForm((current) => ({ ...current, arcId: newId }));
      setArcDraftName("");
      setArcDialogOpen(false);
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || "Failed to create arc.");
    } finally {
      setCreatingArc(false);
    }
  };

  const save = async () => {
    try {
      setErr("");

      if (!form.title.trim()) {
        setErr("Title is required.");
        return;
      }
      if (!form.content.trim()) {
        setErr("Content is required.");
        return;
      }
      if (isEdit && (!Number(form.chapterNumber) || Number(form.chapterNumber) < 1)) {
        setErr("Chapter number must be at least 1.");
        return;
      }

      setSaving(true);

      const payload = {
        title: form.title,
        content: form.content,
        arcId: form.arcId,
        chapterNumber: Number(form.chapterNumber),
      };

      if (!isEdit) {
        await api.post(`/admin/books/${bId}/chapters`, payload);
      } else {
        await api.put(`/admin/books/${bId}/chapters/${cId}`, payload);
      }

      nav(`/admin/books/${bId}/chapters`);
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState text="Loading chapter editor..." />;

  return (
    <>
      <AdminSection
        className="admin-chapter-composer"
        bodyClassName="admin-chapter-composer__body-wrap"
      >
        <div className="admin-chapter-composer__topbar">
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="admin-chapter-composer__back"
            onClick={() => nav(`/admin/books/${bId}/chapters`)}
          >
            <i className="bi bi-arrow-left" aria-hidden="true" />
          </Button>

          <div className="admin-chapter-composer__topbar-copy">
            <p className="admin-chapter-composer__eyebrow">
              {bookTitle || `Book #${bId}`}
            </p>
            <h1 className="admin-chapter-composer__heading">
              {isEdit ? "Edit chapter" : "New chapter"}
            </h1>
          </div>

          <div className="admin-chapter-composer__topbar-actions">
            <Button
              variant="outline"
              size="md"
              onClick={() => nav(`/admin/books/${bId}/chapters`)}
            >
              Cancel
            </Button>
            <Button size="md" onClick={save} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Save chapter"}
            </Button>
          </div>
        </div>

        {err ? <div className="admin-alert">{err}</div> : null}

        <div className="admin-chapter-composer__canvas">
          <div className="admin-chapter-composer__canvas-rail">
            <div className="admin-chapter-composer__canvas-main">
              <input
                className="admin-chapter-composer__title-input"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Title here"
                aria-label="Chapter title"
              />
            </div>

            <div className="admin-chapter-composer__canvas-controls">
              <div className="admin-chapter-composer__control-group">
                {isEdit ? (
                  <input
                    type="number"
                    min="1"
                    className="admin-input admin-chapter-composer__number-input"
                    value={form.chapterNumber}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        chapterNumber: event.target.value,
                      }))
                    }
                    aria-label="Chapter number"
                  />
                ) : null}

                <select
                  className="admin-select admin-chapter-composer__arc-select"
                  value={form.arcId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      arcId:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                  aria-label="Select arc"
                >
                  <option value="">No arc</option>
                  {arcs.map((arc) => {
                    const id = arc.id ?? arc.ID ?? arc.Id;
                    const name = arc.name ?? arc.Name ?? "Untitled arc";
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  className="admin-chapter-composer__arc-button"
                  onClick={() => setArcDialogOpen(true)}
                >
                  <i className="bi bi-plus-lg" aria-hidden="true" />
                  <span>New arc</span>
                </Button>
              </div>

              <span className="admin-chapter-composer__word-count">
                {contentWordCount.toLocaleString()} word
                {contentWordCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <textarea
            className="admin-chapter-composer__textarea"
            rows={18}
            value={form.content}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                content: event.target.value,
              }))
            }
            placeholder="Write the chapter content here..."
            aria-label="Chapter content"
          />
        </div>
      </AdminSection>

      <AdminDialog
        open={arcDialogOpen}
        onClose={() => {
          if (creatingArc) return;
          setArcDialogOpen(false);
          setArcDraftName("");
        }}
        title="Create a new arc"
        subtitle="Give this chapter a clean home, then we’ll select the new arc automatically."
        size="md"
      >
        <div className="admin-form-grid">
          <AdminFormField
            label="Arc name"
            className="admin-col-12"
            hint="Use something readers and editors can recognize quickly."
          >
            <input
              className="admin-input"
              placeholder="Arc name"
              value={arcDraftName}
              onChange={(event) => setArcDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  createArc();
                }
              }}
            />
          </AdminFormField>
        </div>

        <div className="admin-dialog__footer">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => {
              setArcDialogOpen(false);
              setArcDraftName("");
            }}
            disabled={creatingArc}
          >
            Cancel
          </Button>
          <Button type="button" size="md" onClick={createArc} disabled={creatingArc}>
            {creatingArc ? "Creating..." : "Create arc"}
          </Button>
        </div>
      </AdminDialog>
    </>
  );
}
