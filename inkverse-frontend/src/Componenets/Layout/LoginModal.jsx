import { useContext, useState, useEffect } from "react";
import AuthContext from "../../Context/AuthProvider";
import SignUpForm from "../Registration/SignUp/SingUp";
import Form from "../Registration/SignIn/SignIn";
import "./LoginModal.css";

export default function LoginModal() {
  const { isLoginOpen, closeLogin } = useContext(AuthContext);
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (!isLoginOpen) setMode("login"); // reset when closed
  }, [isLoginOpen]);

  if (!isLoginOpen) return null;

  return (
    <div className="iv-backdrop" onClick={closeLogin}>
      <div className="iv-modal" onClick={(e) => e.stopPropagation()}>
        <button className="iv-close" onClick={closeLogin}>✕</button>

        <div className="iv-card">
          {mode === "login" ? (
            <Form onRegister={() => setMode("register")} />
          ) : (
            <SignUpForm onLogin={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
