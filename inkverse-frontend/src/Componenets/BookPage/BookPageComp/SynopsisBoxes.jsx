import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../../Api/api"; // ✅ Your axios instance

export default function SynopsisBox() {
  const { id } = useParams(); // Get book ID from the URL
  const [synopsis, setSynopsis] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSynopsis = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/books/${id}`); // ✅ API endpoint for book details
        setSynopsis(response.data.description);
      } catch (err) {
        console.error("Failed to fetch synopsis:", err);
        setError("Failed to load synopsis.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchSynopsis();
  }, [id]);

  return (
    <div className="row mx-0 justify-content-between">
      <div className="col-12 text-start rounded  mb-4">
        <div className="d-flex border-bottom mb-3">
          <p className="borderStart mt-2"></p>

          <h3 className="">Synopsis</h3>
        </div>
        {loading ? (
          <p>Loading synopsis...</p>
        ) : error ? (
          <p className="text-danger">{error}</p>
        ) : (
          <p className="synopsis text-lg-start ms-3">
            {synopsis || "No synopsis available."}
          </p>
        )}
      </div>
    </div>
  );
}
