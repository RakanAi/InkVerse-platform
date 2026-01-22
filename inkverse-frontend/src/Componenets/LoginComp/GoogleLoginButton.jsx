import { useEffect, useRef } from "react";
import api from "../../Api/api";

export default function GoogleLoginButton({ onSuccess }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!window.google || !divRef.current) return;

    // ✅ init only once per page load
    if (!window.__inkverse_gsi_inited) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            const res = await api.post("/auth/google", {
              idToken: response.credential,
            });

            const dto = res.data; // { userName, email, token, roles }

            const authToStore = {
              accessToken: dto.token,
              user: {
                userName: dto.userName,
                email: dto.email,
                roles: dto.roles ?? [],
              },
            };

            localStorage.setItem("auth", JSON.stringify(authToStore));
            onSuccess?.(authToStore);
          } catch (err) {
            console.error("Google login failed", err);
          }
        },
      });

      window.__inkverse_gsi_inited = true;
    }

    // ✅ safe to re-render button each time
    divRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(divRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 260,
    });
  }, [onSuccess]);

  return <div ref={divRef} />;
}
