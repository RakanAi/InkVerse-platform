import React, { useState } from "react";
import { FiInfo } from "react-icons/fi";
import "./AuthorDashboard.css";

const NEWS_ITEMS = [
  "Do not use AI to edit your contract application!",
  "Spam Comment Detection Upgraded",
  "Plagiarism & Use of AI & Abusing MGS/win-win",
  "Notes in Inkstone and WebNovel app Available",
  "These AI-created works are not welcomed!",
  '"Free" "99% off", "Hot" labels are not allowed on book covers',
];

export default function AuthorDashboard() {
  const [activeTab, setActiveTab] = useState("stories");
  const [newsTab, setNewsTab] = useState("news");
  const [period, setPeriod] = useState("7");

  /* Line chart: wavy trend (blue line + yellow baseline) */
  const chartPoints = [20, 45, 35, 70, 55, 85, 60, 75];
  const chartMax = Math.max(...chartPoints);
  const chartH = 160;
  const chartW = 100;
  const linePath = chartPoints
    .map((v, i) => {
      const x = (i / (chartPoints.length - 1)) * chartW;
      const y = chartH - (v / chartMax) * chartH;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div className="author-dashboard">
      {/* Header */}
      <header className="author-dashboard-header">
        <div>
          <h1 className="author-dashboard-title">Dashboard</h1>
          <div className="author-dashboard-tabs">
            <button
              className={`author-dashboard-tab ${activeTab === "stories" ? "active" : ""}`}
              onClick={() => setActiveTab("stories")}
            >
              Stories
            </button>
          </div>
        </div>
        <button className="author-btn-outline" type="button">
          SUPPORT
        </button>
      </header>

      {/* Promotional banners */}
      <div className="author-banners">
        <div className="author-banner">
          <div className="author-banner-body">
            <div className="author-banner-title">WebNovel Author Benefits & Policies</div>
            <div className="author-banner-content">
              Why choose InkVerse as your creator starting line?
            </div>
          </div>
        </div>
        <div className="author-banner">
          <div className="author-banner-body">
            <div className="author-banner-title">Writing Contests</div>
            <div className="author-banner-content promo">
              Weekly Love Tales: Forbidden Love
            </div>
          </div>
        </div>
      </div>

      {/* Work section */}
      <section className="author-work-section">
        <h2 className="author-work-title">Apocalypse : Copy Master</h2>
        <p className="author-work-meta">
          Incremental data was recorded on 2/6 00:00-24:00 (GMT-8)
        </p>
        <div className="author-work-actions">
          <button className="author-btn-primary" type="button">
            NEW CHAPTER
          </button>
          <button className="author-btn-outline" type="button">
            DETAIL
          </button>
        </div>
        <div className="author-stats-row">
          <div className="author-stat-card">
            <div className="author-stat-label">Collections</div>
            <div className="author-stat-value">5.65K</div>
            <div className="author-stat-change neutral">0.0% since previous day</div>
          </div>
          <div className="author-stat-card">
            <div className="author-stat-label">Views</div>
            <div className="author-stat-value">2.68M</div>
            <div className="author-stat-change positive">+43</div>
            <div className="author-stat-change negative">-25.9% since previous day</div>
          </div>
          <div className="author-stat-card">
            <div className="author-stat-label">Power Ranking</div>
            <div className="author-stat-value">No.0</div>
            <div className="author-stat-change neutral">0 since previous day</div>
          </div>
          <div className="author-stat-card">
            <div className="author-stat-label">Chapters</div>
            <div className="author-stat-value">183</div>
            <div className="author-stat-change neutral">0.0% since previous week</div>
          </div>
          <div className="author-stat-card">
            <div className="author-stat-label">Words</div>
            <div className="author-stat-value">332.48K</div>
            <div className="author-stat-change neutral">0.0% since previous week</div>
          </div>
        </div>
      </section>

      {/* Release stats & News row */}
      <div className="author-content-row">
        <div className="author-panel">
          <div className="author-panel-header">
            <span className="author-panel-title">Release Statistics</span>
          </div>
          <div className="author-panel-subtitle">Chapter completion rate</div>
          <div className="author-panel-value">0.0%</div>
          <div className="author-panel-subtitle" style={{ marginTop: "1rem" }}>
            Average words / chapter
          </div>
          <div className="author-panel-value">1.82K</div>
        </div>
        <div className="author-panel">
          <div className="author-panel-header">
            <div className="author-news-tabs">
              <button
                className={`author-news-tab ${newsTab === "news" ? "active" : ""}`}
                onClick={() => setNewsTab("news")}
              >
                News
              </button>
              <button
                className={`author-news-tab ${newsTab === "inbox" ? "active" : ""}`}
                onClick={() => setNewsTab("inbox")}
              >
                Inbox
              </button>
            </div>
            <a href="#all" style={{ fontSize: "0.8rem", color: "#1e6fd9", fontWeight: 500 }}>
              SEE ALL &gt;
            </a>
          </div>
          <ul className="author-news-list">
            {NEWS_ITEMS.map((item, i) => (
              <li key={i} className="author-news-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Daily Key Metrics - Line chart */}
      <section className="author-metrics-section">
        <div className="author-metrics-header">
          <div>
            <div className="author-metrics-title-wrap">
              <h3 className="author-metrics-title">Daily Key Metrics</h3>
              <FiInfo className="author-metrics-info" size={16} />
            </div>
            <div className="author-metrics-subtitle">Valid Views Trends</div>
          </div>
          <div className="author-metrics-periods">
            {["7", "14", "30"].map((p) => (
              <button
                key={p}
                className={`author-metrics-period ${period === p ? "active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}-Days
              </button>
            ))}
          </div>
        </div>
        <div className="author-metrics-line-chart">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none">
            <line
              x1="0"
              y1={chartH - 5}
              x2={chartW}
              y2={chartH - 5}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <path
              d={linePath}
              fill="none"
              stroke="#4a9eff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="author-metrics-chart-legend">
          <span className="author-metrics-legend-item">
            <span className="author-metrics-legend-dot pink" />
            READER COUNT
          </span>
          <span className="author-metrics-legend-item">
            <span className="author-metrics-legend-dot yellow" />
            EFFECTIVE READER COUNT
          </span>
          <span className="author-metrics-legend-item">
            <span className="author-metrics-legend-dot blue" />
            COLLECTIONS
          </span>
        </div>
      </section>
    </div>
  );
}
