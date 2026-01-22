import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../../Context/AuthProvider";

export default function AdminRoute() {
  const { auth } = useContext(AuthContext);
  const user = auth?.user;

  // not logged in
  if (!user) return <Navigate to="/" replace />;

  // adjust this based on your auth shape:
  const roles = user.roles || user.Roles || [];
  const isAdmin =
    user.role === "Admin" ||
    user.Role === "Admin" ||
    roles.includes("Admin");

  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
}
