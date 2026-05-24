import api from "./api";

export async function fetchWallet() {
  const res = await api.get("/wallet", { timeout: 12000 });
  return res.data ?? null;
}

export async function fetchWalletLedger() {
  const res = await api.get("/wallet/ledger", { timeout: 12000 });
  return res.data ?? [];
}

export async function createCoinCheckoutSession(packCode) {
  const res = await api.post("/wallet/checkout-sessions", { packCode }, { timeout: 12000 });
  return res.data;
}

export async function unlockChapter(chapterId) {
  const res = await api.post(`/chapters/${chapterId}/unlock`, {}, { timeout: 12000 });
  return res.data;
}

export async function updateChapterMonetization(chapterId, payload) {
  const res = await api.put(`/chapters/${chapterId}/monetization`, payload, { timeout: 12000 });
  return res.data;
}

export async function fetchAuthorAgreement() {
  const res = await api.get("/author/monetization/agreement", { timeout: 12000 });
  return res.data ?? null;
}

export async function acceptAuthorAgreement() {
  const res = await api.post("/author/monetization/agreement/accept", { accept: true }, { timeout: 12000 });
  return res.data ?? null;
}

export async function fetchAuthorEarnings() {
  const res = await api.get("/author/monetization/earnings", { timeout: 12000 });
  return res.data ?? null;
}

export async function requestAuthorPayout(amountCoins) {
  const res = await api.post("/author/monetization/payout-requests", { amountCoins }, { timeout: 12000 });
  return res.data ?? null;
}

export async function fetchBookAiApproval(bookId) {
  const res = await api.get(`/admin/books/${bookId}/ai-services-approval`, { timeout: 12000 });
  return res.data ?? null;
}

export async function updateBookAiApproval(bookId, payload) {
  const res = await api.put(`/admin/books/${bookId}/ai-services-approval`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function quoteAiService(payload) {
  const res = await api.post("/ai-services/quote", payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function createAiServiceOrder(payload) {
  const res = await api.post("/ai-services/orders", payload, { timeout: 30000 });
  return res.data ?? null;
}

export async function fetchBookNotebook(bookId) {
  const res = await api.get(`/author/story-studio/books/${bookId}/notebook`, { timeout: 12000 });
  return res.data ?? [];
}

export async function createNotebookEntry(bookId, payload) {
  const res = await api.post(`/author/story-studio/books/${bookId}/notebook`, payload, { timeout: 12000 });
  return res.data ?? null;
}

export async function createProofreadingDraft(chapterId) {
  const res = await api.post("/author/story-studio/proofreading/orders", { chapterId }, { timeout: 30000 });
  return res.data ?? null;
}
