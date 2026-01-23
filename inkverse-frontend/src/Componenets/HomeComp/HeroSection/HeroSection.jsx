import { Link } from "react-router-dom";
import "./HeroSection.css";

const HeroSection = () => {
  return (
    <div
      className="bgImgg  p-5 hero text-white text-center py-16 border rounded-5"
      style={{ maxWidth: "1300px", justifySelf: "center" }}
    >
      <div className="">
        <h1 className="pt-5 fontS fw-bold display-5 hero-title">
          Find your next obsession.
        </h1>

        <p className="fontS mt-3 fs-5 opacity-75 hero-subtitle">
          A fresh reading multiverse—original stories and wild fanfiction you
          won’t find anywhere else.
        </p>

        <div className="d-flex justify-content-center gap-2 mt-4 flex-wrap">
          <Link
            to="/Browser"
            className="btn btn-light px-4 py-2 rounded-5 hero-btn"
          >
            Start Reading
          </Link>

          <Link
            to="/Browser"
            className="btn btn-outline-light fontS px-4 py-2 rounded-5 hero-btn"
          >
            Explore Books
          </Link>
        </div>

        <div className="fontS small mt-3 opacity-75 hero-tagline">
          Discover new worlds. Fall into a verse.
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
