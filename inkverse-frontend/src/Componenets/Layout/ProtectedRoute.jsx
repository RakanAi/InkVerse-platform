import { Navigate, Outlet } from "react-router-dom";
import { useContext, useEffect } from "react";
import AuthContext from "../../Context/AuthProvider";

export default function ProtectedRoute({ allowedRoles }) {
  const { auth, openLogin } = useContext(AuthContext);

  const isLoggedIn = !!auth?.accessToken;

  useEffect(() => {
    if (!isLoggedIn) openLogin?.();
  }, [isLoggedIn, openLogin]);

  if (!isLoggedIn) {
    return <Navigate to="/signin" replace />;
  }

  if (!allowedRoles || allowedRoles.length === 0) return <Outlet />;

  const userRoles = auth?.user?.roles ?? [];
  const hasRole = allowedRoles.some((r) => userRoles.includes(r));

  if (!hasRole) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
