import React from "react";
import "./SignIn.css";
import { useState, useContext } from "react";
import api from "../../../Api/api";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";
import icon from "../../../assets/icons/InkVerseIcon.jpeg";

const Form = ({ onRegister }) => {
  const { setAuth, closeLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const AFTER_LOGIN = "/profilePage";

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitPulse, setSubmitPulse] = useState(false);

  const isFormFilled = loginInput.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitPulse(true);
    window.setTimeout(() => setSubmitPulse(false), 420);
    setLoading(true);
    setError("");

    try {
      const loginData = {
        loginInput: loginInput.trim(),
        password,
      };

      const response = await api.post("/account/login", loginData);

      if (response.status === 200) {
        const { token, userName, email, roles } = response.data;

        setAuth({
          accessToken: token,
          user: { userName, email, roles: roles ?? [] },
        });

        closeLogin();
        navigate(AFTER_LOGIN, { replace: true });
      }
    } catch (err) {
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        let errorMessage = "";

        if (errorData?.errors) {
          if (typeof errorData.errors === "string") {
            errorMessage = errorData.errors.toLowerCase();
          } else if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(" ").toLowerCase();
          }
        } else if (errorData?.message) {
          errorMessage = errorData.message.toLowerCase();
        } else if (errorData?.error) {
          errorMessage = errorData.error.toLowerCase();
        } else if (typeof errorData === "string") {
          errorMessage = errorData.toLowerCase();
        }

        if (status === 401) {
          setError("Invalid username/email or password. Please try again.");
        } else if (status === 400) {
          if (errorMessage.includes("username") || errorMessage.includes("email")) {
            setError("Please enter a valid username or email address.");
          } else if (errorMessage.includes("password")) {
            setError("Please enter your password.");
          } else {
            setError(errorData?.message || errorData?.errors || "Login failed. Please check your information.");
          }
        } else if (status === 422) {
          setError("Please ensure all fields are filled correctly.");
        } else if (status === 500) {
          setError("Server error. Please try again later.");
        } else {
          setError(errorData?.message || errorData?.errors || "Login failed. Please try again.");
        }
      } else if (err.request) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-container auth-pane signin-shell ${submitPulse ? "submit-pulse" : ""}`}>
      <aside className="signin-visual">
        <div className="signin-visual-content">
          <p className="signin-kicker">InkVerse</p>
          <h3>Stories, worlds, and writers in one place.</h3>
          <p>Sign in to continue reading and join your favorite universes.</p>
        </div>
      </aside>

      <section className="signin-form-panel">
        <div className="auth-brand">
          <img src={icon} alt="InkVerse" className="auth-logo" />
          <h2 className="Greeting">Welcome Back</h2>
          <p className="title">Sign in to continue your reading journey.</p>
        </div>

        <form className="form auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="input-group">
            <input
              placeholder="Email or username"
              type="text"
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="input-group password-group">
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`sign mt-2 login-btn ${isFormFilled ? "show" : ""}`}
            disabled={!isFormFilled || loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="auth-divider" />

          <p className="text-center mt-2 mb-3 auth-switch-text">
            Don't have an account?{" "}
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => onRegister?.()}
            >
              Register here
            </button>
          </p>

          <div className="d-grid justify-content-center">
            <GoogleLoginButton
              onSuccess={(authObj) => {
                setAuth(authObj);
                closeLogin();
                navigate("/profilePage", { replace: true });
              }}
            />
          </div>
        </form>

        <footer className="text-center mt-4 footerr">
          <p className="mb-0 footerrr">
            (c) 2026 InkVerse |{" "}
            <a href="/terms" className="text-decoration-none text-light">
              Terms of Service
            </a>{" "}
            |{" "}
            <a href="/privacy" className="text-decoration-none text-light">
              Privacy Policy
            </a>
          </p>
        </footer>
      </section>
    </div>
  );
};

export default Form;