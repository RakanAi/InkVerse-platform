import React from "react";
import { Link } from "react-router-dom";
import "./TagSec.css";
import api from "../../../Api/api";

function TopTags() {
  const [bookTags, setBookTags] = React.useState([]);

  React.useEffect(() => {
    api
      .get("/tags/popular?take=80")
      .then((response) => setBookTags(Array.isArray(response.data) ? response.data : []))
      .catch((e) => {
        console.error(e);
        setBookTags([]);
      });
  }, []);

  return (
    <div style={{ maxWidth: "1300px", margin: "auto" }}>
      <div className="d-flex">
        <h2 className="borderStart mt-2"></h2>
        <h3 className="my-4 ms-2 text-start">Tags</h3>
      </div>

      <div className="row cardd d-flex" style={{ maxWidth: "1300px", margin: "auto" }}>
        <div className="container d-flex">
          <span className="shadow__btn mx-1 justify-content-between align-items-center d-flex ms-auto fluid">
            Popular Tags
          </span>

          <div className="d-flex flex-wrap gap-2">
            {Array.isArray(bookTags) &&
              bookTags.map((tag, index) => (
                <Link
                  to={`/Browser?tag=${encodeURIComponent(tag.name)}`}
                  key={tag.id ?? tag.ID ?? index}
                  className="btn btn-outline-primary btn-sm rounded-pill"
                >
                  #{tag.name}
                </Link>
              ))}
          </div>
        </div>
      </div>

    </div>
  );
}

export default TopTags;
