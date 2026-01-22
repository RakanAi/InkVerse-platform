import { createContext, useState, useEffect } from "react";
import api from "../Api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const openLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  useEffect(() => {
    if (auth) localStorage.setItem("auth", JSON.stringify(auth));
    else localStorage.removeItem("auth");
  }, [auth]);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        if (!auth?.accessToken) {
          setLoading(false);
          return;
        }

        const res = await api.get("/account/me"); // ✅ interceptor attaches token

        setAuth((prev) => ({
          ...prev,
          user: {
            ...(prev?.user || {}),
            id: res.data?.id ?? prev?.user?.id,
            userName: res.data?.userName ?? prev?.user?.userName,
            email: res.data?.email ?? prev?.user?.email,
            roles: res.data?.roles ?? prev?.user?.roles ?? [],
          },
        }));
      } catch (e) {
        console.error("fetch /me failed:", e);
        // if token is invalid/expired -> log out
        if (e?.response?.status === 401) setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [auth?.accessToken]);

  return (
    <AuthContext.Provider
      value={{ auth, setAuth, loading, isLoginOpen, openLogin, closeLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
