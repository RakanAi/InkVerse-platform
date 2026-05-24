import api from "./api";

const base = (bookId) => `/author/book-bible/books/${bookId}`;

export async function fetchBookBible(bookId) {
  const res = await api.get(base(bookId), { timeout: 12000 });
  return res.data ?? null;
}

export async function updateBookBibleProfile(bookId, payload) {
  const res = await api.put(`${base(bookId)}/profile`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function createBookBibleItem(bookId, section, payload) {
  const res = await api.post(`${base(bookId)}/${section}`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function updateBookBibleItem(bookId, section, itemId, payload) {
  const res = await api.put(`${base(bookId)}/${section}/${itemId}`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function deleteBookBibleItem(bookId, section, itemId) {
  const res = await api.delete(`${base(bookId)}/${section}/${itemId}`, { timeout: 12000 });
  return res.data ?? null;
}

export async function quoteBookBibleAi(bookId, payload) {
  const res = await api.post(`${base(bookId)}/ai/quote`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function runBookBibleAi(bookId, payload) {
  const res = await api.post(`${base(bookId)}/ai/suggestions`, payload, { timeout: 30000 });
  return res.data ?? null;
}

export async function acceptBookBibleSuggestion(bookId, suggestionId) {
  const res = await api.post(`${base(bookId)}/suggestions/${suggestionId}/accept`, {}, { timeout: 12000 });
  return res.data ?? null;
}

export async function rejectBookBibleSuggestion(bookId, suggestionId) {
  const res = await api.post(`${base(bookId)}/suggestions/${suggestionId}/reject`, {}, { timeout: 12000 });
  return res.data ?? null;
}
