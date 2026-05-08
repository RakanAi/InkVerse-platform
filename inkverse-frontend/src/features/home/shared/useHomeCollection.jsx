import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/Api/api";
import { getCollectionItems } from "./home.models";

const EMPTY_ITEMS = [];

export default function useHomeCollection({
  endpoint,
  errorMessage = "Failed to load content.",
  selectItems = getCollectionItems,
  transformItems,
  initialItems = EMPTY_ITEMS,
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    try {
      setLoading(true);
      setError("");

      const response = await api.get(endpoint);
      const selectedItems = selectItems(response?.data);
      const nextItems = transformItems ? transformItems(selectedItems) : selectedItems;

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setItems(nextItems);
    } catch (fetchError) {
      console.error(errorMessage, fetchError);

      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setItems(initialItems);
      setError(errorMessage);
    } finally {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setLoading(false);
    }
  }, [endpoint, errorMessage, initialItems, selectItems, transformItems]);

  useEffect(() => {
    mountedRef.current = true;
    refetch();

    return () => {
      mountedRef.current = false;
    };
  }, [refetch]);

  return {
    items,
    loading,
    error,
    refetch,
  };
}
