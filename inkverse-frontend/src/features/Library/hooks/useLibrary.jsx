// features/library/hooks/useLibrary.js
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/Api/api";

export function useLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const didLoadRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get("/me/library");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Load library failed:", e);
      setError("Failed to load library.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    load();
  }, [load]);

  const changeStatus = useCallback(async (bookId, status) => {
    const previous = items;

    setItems((curr) =>
      curr.map((x) =>
        (x.bookId ?? x.BookId) === bookId
          ? { ...x, status }
          : x
      )
    );

    try {
      await api.put(`/books/${bookId}/library/status`, { status });
    } catch (setItems) {
      setItems(previous); // rollback
    }
  }, [items]);

  const remove = useCallback(async (bookId) => {
    const previous = items;

    setItems((curr) =>
      curr.filter((x) => (x.bookId ?? x.BookId) !== bookId)
    );

    try {
      await api.delete(`/books/${bookId}/library`);
    } catch {
      setItems(previous); // rollback
    }
  }, [items]);

  return { items, loading, error, changeStatus, remove };
}