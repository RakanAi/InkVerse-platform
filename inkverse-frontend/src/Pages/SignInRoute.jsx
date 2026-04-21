import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../Context/AuthProvider";

export default function SignInRoute() {
  const { openLogin, auth } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (auth?.accessToken) {
      navigate("/profilePage", { replace: true });
      return;
    }

    openLogin();

  }, [auth, openLogin, navigate]);

  return null; 
}
