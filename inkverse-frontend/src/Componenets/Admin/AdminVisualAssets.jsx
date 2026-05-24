import { useEffect, useMemo, useState } from "react";
import { absUrl } from "../../Utils/absUrl";
import Button from "../../Shared/ui/Button";
import TextField from "../../Shared/ui/TextField";
import LoadingState from "../../Shared/ui/LoadingState";
import ErrorState from "../../Shared/ui/ErrorState";
import AdminSection from "../../features/admin/components/AdminSection";
import AdminFormField from "../../features/admin/components/AdminFormField";
import {
  fetchAdminSiteVisualAssets,
  updateAdminSiteVisualAsset,
  uploadSiteVisualAsset,
} from "../../Api/siteVisualAssets.api";
import { clearSiteVisualAssetCache } from "../../features/site-visuals/useSiteVisualAsset";

const EMPTY_FORM = {
  imageUrl: "",
  altText: "",
  imagePositionX: 50,
  imagePositionY: 50,
  imageScale: 1,
  isActive: true,
};

function clamp(value, min, max) {
  const next = Number(value);
  if (!Number.isFinite(next)) return min;
  return Math.min(max, Math.max(min, next));
}

function getSlotKey(asset) {
  return asset?.slotKey ?? asset?.SlotKey ?? "";
}

function getAssetName(asset) {
  return asset?.name ?? asset?.Name ?? "Visual asset";
}

function getAssetDescription(asset) {
  return asset?.description ?? asset?.Description ?? "";
}

function getAssetImage(asset) {
  return asset?.imageUrl ?? asset?.ImageUrl ?? "";
}

function getAssetAlt(asset) {
  return asset?.altText ?? asset?.AltText ?? "";
}

function getAssetActive(asset) {
  return (asset?.isActive ?? asset?.IsActive ?? true) === true;
}

function getAssetNumber(asset, camelKey, pascalKey, fallback) {
  const value = Number(asset?.[camelKey] ?? asset?.[pascalKey] ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

function getAssetForm(asset) {
  return {
    imageUrl: getAssetImage(asset),
    altText: getAssetAlt(asset),
    imagePositionX: clamp(getAssetNumber(asset, "imagePositionX", "ImagePositionX", 50), 0, 100),
    imagePositionY: clamp(getAssetNumber(asset, "imagePositionY", "ImagePositionY", 50), 0, 100),
    imageScale: clamp(getAssetNumber(asset, "imageScale", "ImageScale", 1), 1, 3),
    isActive: getAssetActive(asset),
  };
}

function getFrameClass(slotKey) {
  if (slotKey === "author.onboarding") return "admin-visual-preview--portrait";
  return "admin-visual-preview--hero";
}

function getFrameLabel(slotKey) {
  if (slotKey === "author.onboarding") return "Author onboarding frame";
  return "Home hero poster frame";
}

function VisualAssetPreview({
  slotKey,
  imageUrl,
  altText,
  fallbackLabel,
  placement,
  onPlacementChange,
}) {
  const [failed, setFailed] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const resolved = imageUrl && !failed ? absUrl(imageUrl) : "";
  const positionX = clamp(placement.imagePositionX, 0, 100);
  const positionY = clamp(placement.imagePositionY, 0, 100);
  const scale = clamp(placement.imageScale, 1, 3);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const updatePlacement = (patch) => {
    onPlacementChange({
      imagePositionX: positionX,
      imagePositionY: positionY,
      imageScale: scale,
      ...patch,
    });
  };

  const handlePointerDown = (event) => {
    if (!resolved) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragStart({
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      width: rect.width || 1,
      height: rect.height || 1,
      positionX,
      positionY,
    });
  };

  const handlePointerMove = (event) => {
    if (!dragStart) return;
    const deltaX = event.clientX - dragStart.clientX;
    const deltaY = event.clientY - dragStart.clientY;

    updatePlacement({
      imagePositionX: clamp(dragStart.positionX - (deltaX / dragStart.width) * 100, 0, 100),
      imagePositionY: clamp(dragStart.positionY - (deltaY / dragStart.height) * 100, 0, 100),
    });
  };

  const stopDragging = (event) => {
    if (dragStart?.pointerId != null) {
      event.currentTarget.releasePointerCapture?.(dragStart.pointerId);
    }
    setDragStart(null);
  };

  return (
    <div className="admin-visual-preview-shell">
      <div className="admin-visual-preview-shell__head">
        <span>{getFrameLabel(slotKey)}</span>
        <strong>
          {Math.round(positionX)} / {Math.round(positionY)} · {scale.toFixed(2)}x
        </strong>
      </div>

      <div
        className={`admin-visual-preview ${getFrameClass(slotKey)} ${
          dragStart ? "is-dragging" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={altText || fallbackLabel}
            onError={() => setFailed(true)}
            draggable="false"
            style={{
              objectPosition: `${positionX}% ${positionY}%`,
              transform: `scale(${scale})`,
              transformOrigin: `${positionX}% ${positionY}%`,
            }}
          />
        ) : (
          <div className="admin-visual-preview__empty">
            <i className="bi bi-image" />
            <span>No image selected</span>
          </div>
        )}
      </div>

      <p className="admin-row-note">Drag inside the frame to choose the crop. Use zoom for tighter framing.</p>
    </div>
  );
}

export default function AdminVisualAssets() {
  const [assets, setAssets] = useState([]);
  const [forms, setForms] = useState({});
  const [activeSlot, setActiveSlot] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingSlot, setSavingSlot] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState("");

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const data = await fetchAdminSiteVisualAssets();
      setAssets(data);
      setForms(
        data.reduce((next, asset) => {
          const slotKey = getSlotKey(asset);
          next[slotKey] = getAssetForm(asset);
          return next;
        }, {}),
      );
      setActiveSlot((current) => current || getSlotKey(data[0]) || "");
    } catch (requestError) {
      console.error("Failed to load visual assets:", requestError);
      setError("Failed to load visual assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sortedAssets = useMemo(
    () => [...assets].sort((left, right) => getSlotKey(left).localeCompare(getSlotKey(right))),
    [assets],
  );

  useEffect(() => {
    if (!activeSlot && sortedAssets.length) {
      setActiveSlot(getSlotKey(sortedAssets[0]));
    }
  }, [activeSlot, sortedAssets]);

  const activeAsset = useMemo(
    () => sortedAssets.find((asset) => getSlotKey(asset) === activeSlot) || sortedAssets[0],
    [activeSlot, sortedAssets],
  );

  const activeSlotKey = getSlotKey(activeAsset);
  const activeForm = forms[activeSlotKey] || EMPTY_FORM;
  const isSaving = savingSlot === activeSlotKey;
  const isUploading = uploadingSlot === activeSlotKey;

  const updateForm = (slotKey, patch) => {
    setForms((current) => ({
      ...current,
      [slotKey]: {
        ...EMPTY_FORM,
        ...(current[slotKey] || EMPTY_FORM),
        ...patch,
      },
    }));
  };

  const handleUpload = async (slotKey, file, input) => {
    if (!file) return;

    try {
      setUploadingSlot(slotKey);
      setError("");
      const url = await uploadSiteVisualAsset(file, { slotKey });
      updateForm(slotKey, {
        imageUrl: url,
        imagePositionX: 50,
        imagePositionY: 50,
        imageScale: 1,
        isActive: true,
      });
    } catch (requestError) {
      console.error("Visual asset upload failed:", requestError);
      setError("Image upload failed.");
    } finally {
      setUploadingSlot("");
      if (input) input.value = "";
    }
  };

  const save = async (slotKey) => {
    const form = forms[slotKey] || EMPTY_FORM;

    try {
      setSavingSlot(slotKey);
      setError("");
      const updated = await updateAdminSiteVisualAsset(slotKey, {
        imageUrl: form.imageUrl.trim(),
        altText: form.altText.trim(),
        imagePositionX: clamp(form.imagePositionX, 0, 100),
        imagePositionY: clamp(form.imagePositionY, 0, 100),
        imageScale: clamp(form.imageScale, 1, 3),
        isActive: form.isActive,
      });

      clearSiteVisualAssetCache();
      setAssets((current) =>
        current.map((asset) => (getSlotKey(asset) === slotKey ? updated : asset)),
      );
      updateForm(slotKey, getAssetForm(updated));
    } catch (requestError) {
      console.error("Visual asset save failed:", requestError);
      setError(requestError?.response?.data?.message || "Failed to save visual asset.");
    } finally {
      setSavingSlot("");
    }
  };

  if (loading) return <LoadingState text="Loading visual assets..." />;
  if (error && !assets.length) {
    return <ErrorState title="Cannot load visual assets" subtitle={error} onRetry={load} />;
  }

  return (
    <AdminSection
      title="Visual assets"
      subtitle="Choose each fixed page image, then crop it inside the real frame instead of letting the upload reshape the UI."
    >
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-visual-tabs" role="tablist" aria-label="Visual asset slots">
        {sortedAssets.map((asset) => {
          const slotKey = getSlotKey(asset);
          const isActive = activeSlotKey === slotKey;

          return (
            <button
              key={slotKey}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`admin-visual-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setActiveSlot(slotKey)}
            >
              <span>{getAssetName(asset)}</span>
              <small>{slotKey}</small>
            </button>
          );
        })}
      </div>

      {activeAsset ? (
        <article className="admin-visual-editor">
          <div className="admin-visual-editor__preview">
            <VisualAssetPreview
              slotKey={activeSlotKey}
              imageUrl={activeForm.imageUrl}
              altText={activeForm.altText}
              fallbackLabel={getAssetName(activeAsset)}
              placement={activeForm}
              onPlacementChange={(placement) => updateForm(activeSlotKey, placement)}
            />
          </div>

          <div className="admin-visual-editor__panel">
            <div className="admin-visual-card__copy">
              <span className="admin-row-note">{activeSlotKey}</span>
              <h3>{getAssetName(activeAsset)}</h3>
              <p>{getAssetDescription(activeAsset)}</p>
            </div>

            <div className="admin-visual-controls">
              <label>
                <span>Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={activeForm.imageScale}
                  onChange={(event) =>
                    updateForm(activeSlotKey, { imageScale: Number(event.target.value) })
                  }
                />
                <strong>{Number(activeForm.imageScale).toFixed(2)}x</strong>
              </label>

              <label>
                <span>Horizontal</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={activeForm.imagePositionX}
                  onChange={(event) =>
                    updateForm(activeSlotKey, { imagePositionX: Number(event.target.value) })
                  }
                />
                <strong>{Math.round(activeForm.imagePositionX)}%</strong>
              </label>

              <label>
                <span>Vertical</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={activeForm.imagePositionY}
                  onChange={(event) =>
                    updateForm(activeSlotKey, { imagePositionY: Number(event.target.value) })
                  }
                />
                <strong>{Math.round(activeForm.imagePositionY)}%</strong>
              </label>
            </div>

            <div className="admin-visual-card__fields">
              <AdminFormField label="Image URL">
                <input
                  className="admin-input"
                  value={activeForm.imageUrl}
                  onChange={(event) =>
                    updateForm(activeSlotKey, { imageUrl: event.target.value })
                  }
                  placeholder="/uploads/site-visuals/image.webp"
                />
              </AdminFormField>

              <AdminFormField label="Alt text">
                <TextField
                  value={activeForm.altText}
                  onChange={(value) => updateForm(activeSlotKey, { altText: value })}
                  placeholder="Describe the visual for accessibility"
                />
              </AdminFormField>
            </div>

            <div className="admin-visual-card__row">
              <label className="admin-inline-check">
                <input
                  type="checkbox"
                  checked={activeForm.isActive}
                  onChange={(event) =>
                    updateForm(activeSlotKey, { isActive: event.target.checked })
                  }
                />
                <span>{activeForm.isActive ? "Use this image" : "Use frontend fallback"}</span>
              </label>

              <label className="admin-visual-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    handleUpload(activeSlotKey, event.target.files?.[0], event.target)
                  }
                />
                <span>{isUploading ? "Uploading..." : "Upload image"}</span>
              </label>
            </div>

            <div className="admin-visual-card__actions">
              <Button
                variant="outline"
                onClick={() => updateForm(activeSlotKey, getAssetForm(activeAsset))}
                disabled={isSaving || isUploading}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  updateForm(activeSlotKey, {
                    imagePositionX: 50,
                    imagePositionY: 50,
                    imageScale: 1,
                  })
                }
                disabled={isSaving || isUploading}
              >
                Reset crop
              </Button>
              <Button onClick={() => save(activeSlotKey)} disabled={isSaving || isUploading}>
                {isSaving ? "Saving..." : "Save visual"}
              </Button>
            </div>
          </div>
        </article>
      ) : (
        <div className="admin-empty-state">No visual asset slots are configured yet.</div>
      )}
    </AdminSection>
  );
}
