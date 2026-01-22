import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../../Context/AuthProvider";

export default function ProtectedRoute({ allowedRoles }) {
  const { auth } = useContext(AuthContext);
  const location = useLocation();

  // 1) not logged in
  if (!auth?.accessToken) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 2) if no roles required => allow any logged-in user
  if (!allowedRoles || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // 3) normalize roles to array
  const userRoles = auth?.user?.roles ?? [];
  const hasRole = allowedRoles.some((r) => userRoles.includes(r));

  if (!hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
