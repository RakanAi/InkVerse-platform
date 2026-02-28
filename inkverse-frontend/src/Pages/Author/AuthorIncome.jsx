import React, { useState } from "react";
import { FiInfo } from "react-icons/fi";
import "./AuthorIncome.css";

/* Line chart: wavy blue line + yellow baseline */
const LINE_POINTS = [20, 45, 35, 70, 55, 85, 60, 75, 50, 80, 65, 90];
const CHART_HEIGHT = 180;
const CHART_WIDTH = 100;

function buildLinePath(points, height) {
  const max = Math.max(...points);
  let path = `M 0 ${height - (points[0] / max) * height}`;
  for (let i = 1; i < points.length; i++) {
    const x = (i / (points.length - 1)) * CHART_WIDTH;
    const y = height - (points[i] / max) * height;
    path += ` L ${x} ${y}`;
  }
  return path;
}

/* x,y as % of map (1000x500 equirectangular) for bubble placement */
const GEO_DATA = [
  { name: "Other", value: 70.62, x: 50, y: 50 },
  { name: "United States", value: 12.94, x: 15, y: 35 },
  { name: "India", value: 4.62, x: 72, y: 32 },
  { name: "Philippines", value: 3.99, x: 82, y: 25 },
  { name: "United Kingdom", value: 2, x: 48, y: 22 },
  { name: "Indonesia", value: 1.95, x: 82, y: 42 },
  { name: "Malaysia", value: 1.09, x: 78, y: 35 },
  { name: "Canada", value: 1.07, x: 12, y: 20 },
  { name: "Australia", value: 0.92, x: 88, y: 72 },
  { name: "Nigeria", value: 0.76, x: 52, y: 38 },
];

/* U-shaped distribution for reading time (high ends, low middle) */
const READING_TIME_DATA = [
  85, 72, 58, 42, 28, 22, 18, 15, 18, 22, 28, 38, 52, 65, 78, 88, 82, 70, 58, 45, 35, 28, 35, 50, 68, 82, 90,
];

export default function AuthorIncome() {
  const [period, setPeriod] = useState("7");

  const linePath = buildLinePath(LINE_POINTS, CHART_HEIGHT);
  const readingMax = Math.max(...READING_TIME_DATA);

  /* Donut: MALE 39.72%, FEMALE 1.88%, UNKNOWN 58.40% */
  const r = 60;
  const cx = 80;
  const cy = 80;
  const malePct = 39.72;
  const femalePct = 1.88;
  const unknownPct = 58.4;
  const circumf = 2 * Math.PI * r;
  const maleDash = (malePct / 100) * circumf;
  const femaleDash = (femalePct / 100) * circumf;
  const unknownDash = (unknownPct / 100) * circumf;

  return (
    <div className="author-page">
      <header className="author-income-header">
        <h1 className="author-income-title">Income</h1>
        <p className="author-income-subtitle">
          Track your earnings, engagement metrics, and audience insights.
        </p>
      </header>

      {/* Daily Key Metrics - Line chart */}
      <section className="author-income-metrics-section">
        <div className="author-income-metrics-header">
          <div>
            <div className="author-income-metrics-title-wrap">
              <h3 className="author-income-metrics-title">Daily Key Metrics</h3>
              <FiInfo className="author-income-metrics-info" size={16} />
            </div>
            <div className="author-income-metrics-subtitle">Valid Views Trends</div>
          </div>
          <div className="author-income-metrics-periods">
            {["7", "14", "30"].map((p) => (
              <button
                key={p}
                className={`author-income-metrics-period ${period === p ? "active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}-Days
              </button>
            ))}
          </div>
        </div>
        <div className="author-income-line-chart">
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none">
            {/* Yellow baseline */}
            <line
              x1="0"
              y1={CHART_HEIGHT - 5}
              x2={CHART_WIDTH}
              y2={CHART_HEIGHT - 5}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Blue wavy line */}
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
        <div className="author-income-chart-legend">
          <span className="author-income-legend-item">
            <span className="author-income-legend-dot pink" />
            READER COUNT
          </span>
          <span className="author-income-legend-item">
            <span className="author-income-legend-dot yellow" />
            EFFECTIVE READER COUNT
          </span>
          <span className="author-income-legend-item">
            <span className="author-income-legend-dot blue" />
            COLLECTIONS
          </span>
        </div>
      </section>

      {/* 6 Metric cards + period selector */}
      <div className="author-income-stats-header">
        <div />
        <select className="author-income-period-select" defaultValue="week">
          <option value="week">THIS WEEK</option>
          <option value="month">THIS MONTH</option>
        </select>
      </div>
      <div className="author-income-stats-grid">
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Power Stones Growth</div>
          <div className="author-income-stat-value">0</div>
          <div className="author-income-stat-trend">↑ 0.00%</div>
        </div>
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Cumulative Power Stones</div>
          <div className="author-income-stat-value">19.27K</div>
        </div>
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Reviews Growth</div>
          <div className="author-income-stat-value">0</div>
          <div className="author-income-stat-trend">↑ 0.00%</div>
        </div>
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Cumulative Reviews</div>
          <div className="author-income-stat-value">96</div>
        </div>
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Comments Growth</div>
          <div className="author-income-stat-value">0</div>
          <div className="author-income-stat-trend">↑ 0.00%</div>
        </div>
        <div className="author-income-stat-card">
          <div className="author-income-stat-label">Cumulative Comments</div>
          <div className="author-income-stat-value">3.21K</div>
        </div>
      </div>

      {/* Interaction Trends */}
      <section className="author-income-interaction-section">
        <div className="author-income-interaction-header">Interaction Trends</div>
        <div className="author-income-interaction-legend">
          <span className="author-income-interaction-legend-item">
            <span className="author-income-legend-dot blue" />
            THIS WEEK
          </span>
          <span className="author-income-interaction-legend-item">
            <span className="author-income-legend-dot pink" />
            WEEK ON WEEK
          </span>
        </div>

        {/* Geo + Gender row */}
        <div className="author-income-geo-gender-row">
          {/* Geographical Distribution */}
          <div className="author-income-geo-panel">
            <div className="author-income-geo-header">Geographical Distribution</div>
            <div className="author-income-geo-content">
              <ul className="author-income-geo-list">
                {GEO_DATA.map((item) => (
                  <li key={item.name} className="author-income-geo-item">
                    <span>{item.name}</span>
                    <span>{item.value}%</span>
                  </li>
                ))}
              </ul>
              <div className="author-income-geo-map-wrap">
                <img
                  src="/images/world-map.svg"
                  alt="World map"
                  className="author-income-geo-map"
                />
                {GEO_DATA.filter((d) => d.name !== "Other").map((item, i) => (
                  <div
                    key={i}
                    className="author-income-geo-bubble"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      width: 14 + (item.value / 70) * 28,
                      height: 14 + (item.value / 70) * 28,
                      transform: "translate(-50%, -50%)",
                    }}
                    title={`${item.name}: ${item.value}%`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Gender Distribution */}
          <div className="author-income-gender-panel">
            <div className="author-income-gender-header">Gender</div>
            <div className="author-income-gender-content">
              <div className="author-income-donut-wrap">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#4a9eff"
                    strokeWidth="24"
                    strokeDasharray={`${maleDash} ${circumf}`}
                    strokeDashoffset={0}
                    transform="rotate(-90 80 80)"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="24"
                    strokeDasharray={`${femaleDash} ${circumf}`}
                    strokeDashoffset={-maleDash}
                    transform="rotate(-90 80 80)"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="none"
                    stroke="#d1d5db"
                    strokeWidth="24"
                    strokeDasharray={`${unknownDash} ${circumf}`}
                    strokeDashoffset={-(maleDash + femaleDash)}
                    transform="rotate(-90 80 80)"
                  />
                </svg>
              </div>
              <div className="author-income-gender-legend">
                <span className="author-income-gender-legend-item">
                  <span className="author-income-gender-square male" />
                  MALE: 39.72%
                </span>
                <span className="author-income-gender-legend-item">
                  <span className="author-income-gender-square female" />
                  FEMALE: 1.88%
                </span>
                <span className="author-income-gender-legend-item">
                  <span className="author-income-gender-square unknown" />
                  UNKNOWN: 58.40%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Distribution of Reading Time */}
      <section className="author-income-reading-section">
        <div className="author-income-reading-header">Distribution of Reading Time</div>
        <div className="author-income-reading-chart">
          {READING_TIME_DATA.map((val, i) => (
            <div
              key={i}
              className="author-income-reading-bar"
              style={{ height: `${(val / readingMax) * 100}%` }}
              aria-hidden
            />
          ))}
        </div>
      </section>
    </div>
  );
}
