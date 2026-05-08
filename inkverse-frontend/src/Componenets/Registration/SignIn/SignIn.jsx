import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../../../Api/api";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";

import AuthAside from "@/features/auth/components/AuthAside";
import AuthField from "@/features/auth/components/AuthField";
import AuthPanel from "@/features/auth/components/AuthPanel";
import { LOGIN_FEATURES } from "@/features/auth/auth.copy";
import {
  getLoginErrorMessage,
  isLoginReady,
} from "@/features/auth/auth.validation";

const Form = () => {
  const { setAuth, closeLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const afterLogin = location.state?.from?.pathname || "/profilePage";

  const [loginInput, setLoginInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isReady = isLoginReady(loginInput, password);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/account/login", {
        loginInput: loginInput.trim(),
        password,
      });

      if (response.status === 200) {
        const { token, userName, email, roles } = response.data;

        setAuth({
          accessToken: token,
          user: { userName, email, roles: roles ?? [] },
        });

        closeLogin();
        navigate(afterLogin, { replace: true });
      }
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      aside={
        <AuthAside
          eyebrow="Reader login"
          title="Step back into your shelf."
          text="Sign in to keep reading, save what matters, and rejoin the stories already waiting for you."
          items={LOGIN_FEATURES}
        />
      }
      formEyebrow="Welcome back"
      formTitle="Enter InkVerse"
      formText="Use your reader details to pick up right where you left off."
      footer={
        <p className="iv-auth-legal">
          By continuing, you agree to InkVerse&apos;s{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>
      }
    >
      {error ? (
        <div className="iv-auth-alert" role="alert">
          {error}
        </div>
      ) : null}

      <form className="iv-auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="login-input"
          label="Email or username"
          type="text"
          value={loginInput}
          onChange={(event) => setLoginInput(event.target.value)}
          placeholder="readername or name@example.com"
          autoComplete="username"
        />

        <AuthField
          id="login-password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          action={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        <button
          type="submit"
          className="iv-auth-submit"
          disabled={!isReady || loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="iv-auth-bridge">or continue with</div>

      <div className="iv-auth-social iv-auth-social--standalone">
        <div className="iv-auth-googleShell">
          <GoogleLoginButton
            width={320}
            text="continue_with"
            theme="filled_blue"
            locale="en"
            onSuccess={(authObj) => {
              setAuth(authObj);
              closeLogin();
              navigate(afterLogin, { replace: true });
            }}
          />
        </div>
      </div>
    </AuthPanel>
  );
};

export default Form;
