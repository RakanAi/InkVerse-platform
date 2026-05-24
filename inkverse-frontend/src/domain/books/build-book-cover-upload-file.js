const DEFAULT_COVER_WIDTH = 600;
const DEFAULT_COVER_HEIGHT = 800;
const DEFAULT_COVER_QUALITY = 0.84;

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function buildSafeBookFileName(title) {
  return (
    (title || "book")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "book"
  );
}

export async function buildBookCoverUploadFile(
  file,
  {
    title = "book",
    width = DEFAULT_COVER_WIDTH,
    height = DEFAULT_COVER_HEIGHT,
    zoom = 1,
    offsetX = 0,
    offsetY = 0,
    quality = DEFAULT_COVER_QUALITY,
    background = "#0f172a",
  } = {},
) {
  if (!file) throw new Error("No cover file provided.");

  const srcUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(srcUrl);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Unable to prepare cover image.");

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    const baseScale = Math.max(width / image.width, height / image.height);
    const drawW = image.width * baseScale * zoom;
    const drawH = image.height * baseScale * zoom;
    const drawX = (width - drawW) / 2 + offsetX;
    const drawY = (height - drawH) / 2 + offsetY;

    ctx.drawImage(image, drawX, drawY, drawW, drawH);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", quality);
    });

    if (!blob) throw new Error("Could not build cover preview.");

    const safeName = buildSafeBookFileName(title);
    return new File([blob], `${safeName}-cover.webp`, { type: blob.type || "image/webp" });
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}
