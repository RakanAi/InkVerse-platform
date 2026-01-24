import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="container-fluid">
      <div className="row" style={{ minHeight: "100vh", textAlign:"center" }}>
        <aside className="col-12 col-md-3 col-lg-2 border-end p-3">
          <h5 className="mb-3">Admin Panel</h5>

          <div className="nav flex-column gap-1">
            <NavLink className="btn btn-outline-dark text-start" to="/admin">
              Dashboard
            </NavLink>

            <NavLink className="btn btn-outline-dark text-start" to="/admin/books">
              Books
            </NavLink>

            <NavLink className="btn btn-outline-dark text-start" to="/admin/trends">
              Trends
            </NavLink>

            <NavLink className="btn btn-outline-dark text-start" to="/admin/tags">
              Tags
            </NavLink>

            <NavLink className="btn btn-outline-dark text-start" to="/admin/genres">
              Genres
            </NavLink>
          </div>
        </aside>

        <main className="col p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
