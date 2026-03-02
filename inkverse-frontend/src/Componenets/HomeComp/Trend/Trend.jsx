import React, { useEffect, useState } from "react";
import Carousel from "react-bootstrap/Carousel";
import { Link } from "react-router-dom";
import api from "../../../Api/api";
import "./Trend.css";
import { absUrl } from "../../../Utils/absUrl";
import Button from "@/Shared/ui/Button";

import PageHeader from "@/Shared/ui/PageHeader";
import LoadingState from "@/Shared/ui/LoadingState";
import EmptyState from "@/Shared/ui/EmptyState";

export default function TrendCora() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const getImg = (t) => t.imageUrl ?? t.ImageUrl ?? "";
  const getName = (t) => t.name ?? t.Name ?? "";
  const getSlug = (t) => t.slug ?? t.Slug ?? "";
  const getDesc = (t) => t.description ?? t.Description ?? "";
  const getId = (t) => t.id ?? t.Id ?? t.ID;

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await api.get("/trends");
        const list = Array.isArray(res.data) ? res.data : [];

        // shuffle + take 7
        const randomSeven = shuffleArray(list).slice(0, 7);

        if (alive) setTrends(randomSeven);
      } catch (e) {
        console.error("Error fetching trends:", e);
        if (alive) setTrends([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);
  const limited = trends.slice(0, 7);

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  return (
    <section
      className="iv-trends iv iv-container mt-3"
      style={{ maxWidth: "1300px", justifySelf: "center" }}
    >
      <div className="iv-trends__header mb-2">

          <span className="borderStart mt-2" />
            <PageHeader
              title="Trending Concepts"
              subtitle="Fresh ideas and worlds readers are exploring right now."
            />

        <Button className="text-white small" to="/trend">
          SeeAll→
        </Button>
      </div>

      {loading ? (
        <LoadingState title="Loading trends…" />
      ) : trends.length === 0 ? (
        <EmptyState title="No trending items yet." />
      ) : (
        <Carousel className="iv-trends__carousel" interval={5000} pause="hover">
          {limited.map((t) => (
            <Carousel.Item key={getId(t)}>
                <img
                  className="iv-trends__img"
                  src={absUrl(getImg(t))}
                  alt={getName(t)}
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div className="iv-trends__overlay" />
                <div className="iv-trends__caption text-white">
                  <div className="iv-trends__badge">
                    🔥 Trending : {getSlug(t)}
                  </div>
                  <p className="iv-trends__title text-white">{getName(t)}</p>
                  {getDesc(t) ? (
                    <p className="iv-trends__desc">{getDesc(t)}</p>
                  ) : null}
                  <Button className="iv-trends__cta btn btn-outline-light btn-sm" to={`/trend/${getId(t)}`}>
                    Explore
                  </Button>
                </div>
            </Carousel.Item>
          ))}
        </Carousel>
      )}
    </section>
  );
}
