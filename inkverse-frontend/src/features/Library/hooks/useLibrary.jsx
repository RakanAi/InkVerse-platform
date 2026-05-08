import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/Api/api";
import { normalizeLibraryItem } from "@/features/Library/utils/library.normalize";

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
      const nextItems = Array.isArray(res.data)
        ? res.data.map(normalizeLibraryItem)
        : [];
      setItems(nextItems);
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

  const changeStatus = useCallback(
    async (bookId, status) => {
      const previous = items;

      setItems((curr) =>
        curr.map((item) =>
          item.bookId === bookId
            ? normalizeLibraryItem({ ...item, status, Status: status })
            : item,
        ),
      );

      try {
        await api.put(`/books/${bookId}/library/status`, { status });
      } catch (e) {
        console.error("Update library status failed:", e);
        setItems(previous);
      }
    },
    [items],
  );

  const remove = useCallback(
    async (bookId) => {
      const previous = items;

      setItems((curr) =>
        curr.map((item) =>
          item.bookId === bookId
            ? normalizeLibraryItem({
                ...item,
                isInLibrary: false,
                IsInLibrary: false,
              })
            : item,
        ),
      );

      try {
        await api.delete(`/books/${bookId}/library`);
      } catch (e) {
        console.error("Remove from library failed:", e);
        setItems(previous);
      }
    },
    [items],
  );

  return { items, loading, error, changeStatus, remove, reload: load };
}
