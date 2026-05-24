import { useContext, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../../../Api/api";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";

import AuthAside from "@/features/auth/components/AuthAside";
import AuthField from "@/features/auth/components/AuthField";
import AuthPanel from "@/features/auth/components/AuthPanel";
import { getLoginFeatures } from "@/features/auth/auth.copy";
import {
  getLoginErrorMessage,
  isLoginReady,
} from "@/features/auth/auth.validation";

const Form = () => {
  const { setAuth, closeLogin } = useContext(AuthContext);
  const { t } = useTranslation();
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
        const { token, userName, email, avatarUrl, roles } = response.data;

        setAuth({
          accessToken: token,
          user: { userName, email, avatarUrl, roles: roles ?? [] },
        });

        closeLogin();
        navigate(afterLogin, { replace: true });
      }
    } catch (err) {
      setError(getLoginErrorMessage(t, err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      aside={
        <AuthAside
          eyebrow={t("auth.login.aside.eyebrow")}
          title={t("auth.login.aside.title")}
          text={t("auth.login.aside.text")}
          items={getLoginFeatures(t)}
        />
      }
      formEyebrow={t("auth.login.form.eyebrow")}
      formTitle={t("auth.login.form.title")}
      formText={t("auth.login.form.text")}
      footer={
        <p className="iv-auth-legal">
          <Trans
            i18nKey="auth.legal.signIn"
            components={[<Link to="/terms" />, <Link to="/privacy" />]}
          />
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
          label={t("auth.login.form.loginInput")}
          type="text"
          value={loginInput}
          onChange={(event) => setLoginInput(event.target.value)}
          placeholder={t("auth.login.form.loginPlaceholder")}
          autoComplete="username"
        />

        <AuthField
          id="login-password"
          label={t("auth.login.form.password")}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.login.form.passwordPlaceholder")}
          autoComplete="current-password"
          action={
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? t("auth.login.form.hide") : t("auth.login.form.show")}
            </button>
          }
        />

        <button
          type="submit"
          className="iv-auth-submit"
          disabled={!isReady || loading}
        >
          {loading ? t("auth.login.form.submitting") : t("auth.login.form.submit")}
        </button>
      </form>

      <div className="iv-auth-bridge">{t("auth.googleBridge")}</div>

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
