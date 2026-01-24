import React from "react";
// import styled from 'styled-components';
import "./SignIn.css";
import { useState, useContext, useEffect } from "react";
import api from "../../../Api/api";
// import ProtectedRoute from '../../Layout/ProtectedRoute';
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";
import icon from "../../../assets/icons/InkVerseIcon.jpeg";

const Form = ({ onRegister }) => {
  const { setAuth, closeLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isFormFilled = loginInput.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare the data for API call
      const loginData = {
        loginInput: loginInput.trim(),
        password: password,
      };

      // Make API call to login user
      const response = await api.post(
        "/account/login",
        loginData,
      );

      if (response.status === 200) {
        const { token, userName, email, roles } = response.data;

        setAuth({
          accessToken: token,
          user: { userName, email, roles: roles ?? [] },
        });

        closeLogin();
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error response data:", err.response?.data);
      console.error("Error status:", err.response?.status);
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const errorData = err.response.data;
        let errorMessage = "";

        // Handle different error response formats - check errors field first
        if (errorData?.errors) {
          // Handle validation errors array or string
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
          // Unauthorized - invalid credentials
          setError(
            "Invalid username/email or password. Please check your credentials and try again.",
          );
        } else if (status === 400) {
          // Bad request - validation failed
          if (
            errorMessage.includes("username") ||
            errorMessage.includes("email")
          ) {
            setError("Please enter a valid username or email address.");
          } else if (errorMessage.includes("password")) {
            setError("Please enter your password.");
          } else {
            setError(
              errorData?.message ||
                errorData?.errors ||
                "Login failed. Please check your information.",
            );
          }
        } else if (status === 422) {
          // Unprocessable entity - validation failed
          setError("Please ensure all fields are filled correctly.");
        } else if (status === 500) {
          // Server error
          setError("Server error. Please try again later.");
        } else {
          // Other server errors
          setError(
            errorData?.message ||
              errorData?.errors ||
              "Login failed. Please try again.",
          );
        }
      } else if (err.request) {
        // Network error
        setError("Network error. Please check your connection and try again.");
      } else {
        // Other error
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const onTouch = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      console.log("TOUCH TARGET:", el, "classes:", el?.className);
    };

    document.addEventListener("touchstart", onTouch, { passive: true });
    return () => document.removeEventListener("touchstart", onTouch);
  }, []);
  const isMobile = useIsMobile();

  function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(
      () => window.innerWidth <= breakpoint,
    );

    useEffect(() => {
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      const onChange = () => setIsMobile(mq.matches);
      onChange();
      mq.addEventListener?.("change", onChange);
      return () => mq.removeEventListener?.("change", onChange);
    }, [breakpoint]);

    return isMobile;
  }
  return (
    <div className="form-container mx-auto rounded-5 p-4 text-light shadow-lg loginForm">
      <div className="container py-4 d-flex flex-column align-items-center justify-content-top h-100">
        <img
          src={icon}
          alt="InkVerse"
          className="rounded-circle"
          style={{ height: 200 }}
        />

        <h2 className="Greeting mt-2 fw-light">Welcome To InkVerse</h2>
        <span className="title shadow-sm mt-1 fw-light">
          Access tons of Fanfic Universes by a single tap!
        </span>

        <div className="mt-3">
          <p className="title fw-light">Sign In to continue</p>
          <hr />
          <form className="form" onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {!isMobile && (
              <>
                <div className="input-group">
                  <input
                    placeholder="Enter your Email / Username"
                    type="text"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="input-group password-group">
                  <input
                    placeholder="Enter your password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className={`sign mt-3 login-btn ${isFormFilled ? "show" : ""}`}
                  disabled={!isFormFilled || loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>

                <hr />
              </>
            )}
            <p className="text-center mt-3 d-none d-md-block">
              Don’t have an account?{" "}
              <button
                type="button"
                className="btn btn-link p-0"
                onClick={() => {
                  console.log("Register clicked");
                  onRegister?.();
                }}
              >
                Register here
              </button>
            </p>

            <div className="d-grid justify-content-center">
                <GoogleLoginButton
                  onSuccess={(authObj) => {
                    setAuth(authObj);
                    closeLogin();
                    navigate(from, { replace: true });
                  }}
                />
            </div>
          </form>
          <footer className="text-center mt-4 footerr align-self-end justify-self-end">
            <p className="mb-0 footerrr">
              © 2026 InkVerse |{" "}
              <a href="/terms" className="text-decoration-none text-light">
                Terms of Service
              </a>{" "}
              |{" "}
              <a href="/privacy" className="text-decoration-none text-light">
                Privacy Policy
              </a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Form;
