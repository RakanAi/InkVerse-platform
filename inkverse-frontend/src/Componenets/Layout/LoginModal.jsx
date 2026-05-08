import { useCallback, useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../../Context/AuthProvider";
import SignUpForm from "../Registration/SignUp/SingUp";
import Form from "../Registration/SignIn/SignIn";
import "./LoginModal.css";
import "@/features/auth/auth.css";

export default function LoginModal() {
  const { isLoginOpen, closeLogin } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [frameHeight, setFrameHeight] = useState(null);
  const contentRef = useRef(null);
  const frameAnimationRef = useRef(null);

  const measureFrame = useCallback(() => {
    const nextHeight = contentRef.current?.scrollHeight;

    if (!nextHeight) return;

    setFrameHeight(`${Math.ceil(nextHeight)}px`);
  }, []);

  useEffect(() => {
    if (!isLoginOpen) {
      setMode("login");
      setFrameHeight(null);
    }
  }, [isLoginOpen]);

  useEffect(() => {
    if (!isLoginOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isLoginOpen]);

  useEffect(() => {
    if (!isLoginOpen) return undefined;

    const scheduleMeasure = () => {
      if (frameAnimationRef.current) {
        cancelAnimationFrame(frameAnimationRef.current);
      }

      frameAnimationRef.current = requestAnimationFrame(() => {
        measureFrame();
        frameAnimationRef.current = null;
      });
    };

    scheduleMeasure();

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && contentRef.current
        ? new ResizeObserver(scheduleMeasure)
        : null;

    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener("resize", scheduleMeasure);

    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      resizeObserver?.disconnect();

      if (frameAnimationRef.current) {
        cancelAnimationFrame(frameAnimationRef.current);
        frameAnimationRef.current = null;
      }
    };
  }, [isLoginOpen, measureFrame, mode]);

  if (!isLoginOpen) return null;

  return (
    <div className="iv-auth-backdrop" onClick={closeLogin}>
      <div
        className="iv-auth-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "login" ? "Sign in to InkVerse" : "Create an InkVerse account"}
      >
        <div className="iv-auth-topbar">
          <div className="iv-auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={`iv-auth-tab ${mode === "login" ? "is-active" : ""}`}
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={`iv-auth-tab ${mode === "register" ? "is-active" : ""}`}
              onClick={() => setMode("register")}
            >
              Create account
            </button>
          </div>

          <button
            type="button"
            className="iv-auth-close"
            onClick={closeLogin}
            aria-label="Close auth dialog"
          >
            ×
          </button>
        </div>

        <div className="iv-auth-frame" style={frameHeight ? { height: frameHeight } : undefined}>
          <div
            key={mode}
            ref={contentRef}
            className="iv-auth-frame__content iv-auth-frame__content--animated"
          >
            {mode === "login" ? <Form /> : <SignUpForm onLogin={() => setMode("login")} />}
          </div>
        </div>
      </div>
    </div>
  );
}
