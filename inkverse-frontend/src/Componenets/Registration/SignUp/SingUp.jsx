import { useContext, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../../../Api/api";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";

import AuthAside from "@/features/auth/components/AuthAside";
import AuthChecklist from "@/features/auth/components/AuthChecklist";
import AuthField from "@/features/auth/components/AuthField";
import AuthPanel from "@/features/auth/components/AuthPanel";
import { getRegisterFeatures } from "@/features/auth/auth.copy";
import {
  getRegisterErrorMessage,
  getRegistrationState,
} from "@/features/auth/auth.validation";

const SignUpForm = ({ onLogin }) => {
  const { setAuth, closeLogin } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registrationState = useMemo(() => getRegistrationState(t, formData), [formData, t]);
  const registerFeatures = useMemo(() => getRegisterFeatures(t), [t]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/account/register", {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
      }
    } catch (err) {
      setError(getRegisterErrorMessage(t, err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      aside={
        <AuthAside
          eyebrow={registerFeatures.eyebrow}
          title={registerFeatures.title}
          text={registerFeatures.text}
        >
          <AuthChecklist
            sections={registrationState.sections}
            completed={registrationState.completed}
            total={registrationState.total}
            percent={registrationState.percent}
          />
        </AuthAside>
      }
      formEyebrow={
        success
          ? t("auth.register.form.successEyebrow")
          : t("auth.register.form.eyebrow")
      }
      formTitle={
        success
          ? t("auth.register.form.successTitle")
          : t("auth.register.form.title")
      }
      formText={
        success
          ? t("auth.register.form.successText")
          : t("auth.register.form.text")
      }
      footer={
        <p className="iv-auth-legal">
          <Trans
            i18nKey="auth.legal.register"
            components={[<Link to="/terms" />, <Link to="/privacy" />]}
          />
        </p>
      }
    >
      {success ? (
        <div className="iv-auth-success">
          <span className="iv-auth-success__badge" aria-hidden="true">
            ✓
          </span>
          <div>
            <h2 className="iv-auth-success__title">
              {t("auth.register.form.successCardTitle")}
            </h2>
            <p className="iv-auth-success__text">
              {t("auth.register.form.successCardText")}
            </p>
          </div>
          <div className="iv-auth-success__actions">
            <button
              type="button"
              className="iv-auth-submit"
              onClick={() => onLogin?.()}
            >
              {t("auth.register.form.signInNow")}
            </button>
            <button
              type="button"
              className="iv-auth-secondaryAction"
              onClick={closeLogin}
            >
              {t("auth.register.form.continueBrowsing")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="iv-auth-alert" role="alert">
              {error}
            </div>
          ) : null}

          <form className="iv-auth-form" onSubmit={handleSubmit}>
            <div className="iv-auth-nameGrid">
              <AuthField
                id="register-first-name"
                label={t("auth.register.form.firstName")}
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder={t("auth.register.form.firstNamePlaceholder")}
                autoComplete="given-name"
              />

              <AuthField
                id="register-last-name"
                label={t("auth.register.form.lastName")}
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder={t("auth.register.form.lastNamePlaceholder")}
                autoComplete="family-name"
              />
            </div>

            <AuthField
              id="register-username"
              label={t("auth.register.form.username")}
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder={t("auth.register.form.usernamePlaceholder")}
              autoComplete="username"
              helper={t("auth.register.form.usernameHelper")}
            />

            <AuthField
              id="register-email"
              label={t("auth.register.form.email")}
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("auth.register.form.emailPlaceholder")}
              autoComplete="email"
            />

            <AuthField
              id="register-password"
              label={t("auth.register.form.password")}
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("auth.register.form.passwordPlaceholder")}
              autoComplete="new-password"
              helper={t("auth.register.form.passwordHelper")}
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? t("auth.register.form.hide") : t("auth.register.form.show")}
                </button>
              }
            />

            <AuthField
              id="register-confirm-password"
              label={t("auth.register.form.confirmPassword")}
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder={t("auth.register.form.confirmPasswordPlaceholder")}
              autoComplete="new-password"
              action={
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                >
                  {showConfirmPassword ? t("auth.register.form.hide") : t("auth.register.form.show")}
                </button>
              }
            />

            <button
              type="submit"
              className="iv-auth-submit"
              disabled={!registrationState.isReady || loading}
            >
              {loading ? t("auth.register.form.submitting") : t("auth.register.form.submit")}
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
                  navigate(from, { replace: true });
                }}
              />
            </div>
          </div>
        </>
      )}
    </AuthPanel>
  );
};

export default SignUpForm;
