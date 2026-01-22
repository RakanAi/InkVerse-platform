import React from "react";
import "./Footer.css";
import inkVerseIcon from "../../assets/te.png"; // Assuming the icon is here
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="iv-footer">
      <div className="container py-5">
        <div className="row g-4 align-items-start">
          {/* Brand */}
          <div className="col-12 col-md-4">
            <div className="iv-footer-brand">
              <img
                src={inkVerseIcon}
                alt="InkVerse"
                className="iv-footer-logo rounded-5 border border-2"
              />
              INKVERSE
            </div>
            <div className="iv-footer-tagline">
              Read. Write. Build worlds together.
            </div>
            <div className="d-flex gap-3 mt-3">
              <a
                className="iv-footer-social"
                href="#"
                onClick={() => alert("Coming soon")}
                aria-label="Facebook"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a
                className="iv-footer-social"
                href="#"
                onClick={() => alert("Coming soon")}
                aria-label="Twitter/X"
              >
                <i className="bi bi-twitter-x"></i>
              </a>
              <a
                className="iv-footer-social"
                href="#"
                onClick={() => alert("Coming soon")}
                aria-label="Instagram"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a
                className="iv-footer-social"
                href="#"
                aria-label="Discord"
                onClick={() => alert("Coming soon")}
              >
                <i className="bi bi-discord"></i>
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="col-6 col-md-2">
            <div className="iv-footer-title text-lg-start">Explore</div>
            <ul className="list-unstyled mt-2 mb-0">
              <li>
                <Link className="iv-footer-link" to="/">
                  <i className="bi bi-house-door me-2"></i>Home
                </Link>
              </li>

              <li>
                <Link className="iv-footer-link" to="/browser">
                  <i className="bi bi-search me-2"></i>Browse
                </Link>
              </li>

              <li>
                <Link className="iv-footer-link" to="/ranking">
                  <i className="bi bi-trophy me-2"></i>Rankings
                </Link>
              </li>

              <li>
                <Link className="iv-footer-link" to="/Trend">
                  <i className="bi bi-star-fill me-2"></i>Trends
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-6 col-md-2">
            <div className="iv-footer-title text-lg-start">Support</div>
            <ul className="list-unstyled mt-2 mb-0">
              <li>
                <Link className="iv-footer-link" to="/about">
                  <i className="bi bi-info-circle me-2"></i>About
                </Link>
              </li>
              <li>
                <Link className="iv-footer-link" to="/contact">
                  <i className="bi bi-envelope me-2"></i>Contact
                </Link>
              </li>
              <li>
                <Link className="iv-footer-link" to="/privacy">
                  <i className="bi bi-shield-check me-2"></i>Privacy
                </Link>
              </li>
              <li>
                <Link className="iv-footer-link" to="/dmca">
                  <i className="bi bi-file-earmark-text me-2"></i>DMCA
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-12 col-md-4">
  <div className="iv-footer-title">Stay Updated</div>
  <p className="text-secondary mt-2 mb-3">
    <span className="text-warning">V1 is live.</span> Author tools, character pages, and more are coming soon.
  </p>

  <div className="d-flex gap-2 flex-wrap justify-content-center">
    <a className="btn btn-outline-light" href="" onClick={() => alert("Coming soon")} target="_blank" rel="noreferrer">
      <i className="bi bi-discord me-2"></i>Discord
    </a>

    <a className="btn btn-outline-light" href="InkVerseOdeh@gmail.com">
      <i className="bi bi-envelope me-2"></i>Contact
    </a>
  </div>

  <div className="small text-secondary mt-2">
    Newsletter coming later <br /> (maybe...)
  </div>
</div>
        </div>

        <hr className="iv-footer-divider my-4" />

        <div className="d-flex flex-column flex-md-row gap-2 justify-content-between align-items-md-center">
          <div className="text-secondary small">
            © {year} InkVerse. All rights reserved.
          </div>
          <div className="text-secondary small">
            <span className="badge bg-success">v1.0 - Demo Mode</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
