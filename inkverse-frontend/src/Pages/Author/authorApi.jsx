import api from "../../Api/api";

export async function fetchMyBooks() {
  const res = await api.get("/books/mine", { timeout: 12000 });
  return res.data ?? [];
}

export async function fetchGenres() {
  const res = await api.get("/genres", { timeout: 12000 });
  return res.data ?? [];
}

export async function fetchTags() {
  const res = await api.get("/tags", { timeout: 12000 });
  return res.data ?? [];
}

export async function fetchTrends() {
  const res = await api.get("/trends", { timeout: 12000 });
  return res.data ?? [];
}

export async function createBook(payload) {
  const res = await api.post("/books", payload, { timeout: 12000 });
  return res.data;
}

export async function linkBookToTrend(trendId, bookId) {
  const res = await api.post(
    `/admin/trends/${trendId}/books`,
    { bookId },
    { timeout: 12000 },
  );
  return res.data;
}

export async function uploadBookCover(file, { bookId, title } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (bookId) form.append("EntityId", String(bookId));
  if (title) form.append("EntityName", title);
  form.append("Purpose", "cover");

  const res = await api.post("/uploads/books/user", form, {
    timeout: 20000,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.url ?? null;
}

export async function fetchBookById(bookId) {
  const res = await api.get(`/books/${bookId}`, { timeout: 12000 });
  return res.data ?? null;
}

export async function fetchBookChapters(bookId) {
  const res = await api.get(`/chapters/book/${bookId}`, { timeout: 12000 });
  return res.data ?? [];
}

export async function updateBook(bookId, payload) {
  const res = await api.put(`/books/${bookId}`, payload, { timeout: 12000 });
  return res.data;
}

export async function deleteBook(bookId) {
  const res = await api.delete(`/books/${bookId}`, { timeout: 12000 });
  return res.data;
}

export async function fetchBookArcs(bookId) {
  const res = await api.get(`/admin/books/${bookId}/arcs`, { timeout: 12000 });
  return res.data ?? [];
}

export async function createChapter(payload) {
  const res = await api.post("/chapters", payload, { timeout: 12000 });
  return res.data;
}

export async function deleteChapter(chapterId) {
  const res = await api.delete(`/chapters/${chapterId}`, { timeout: 12000 });
  return res.data;
}

export async function createBookArc(bookId, name) {
  const res = await api.post(
    `/admin/books/${bookId}/arcs`,
    { name },
    { timeout: 12000 },
  );
  return res.data;
}
