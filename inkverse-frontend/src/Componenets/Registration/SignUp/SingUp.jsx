import { useContext, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../../../Api/api";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";

import AuthAside from "@/features/auth/components/AuthAside";
import AuthChecklist from "@/features/auth/components/AuthChecklist";
import AuthField from "@/features/auth/components/AuthField";
import AuthPanel from "@/features/auth/components/AuthPanel";
import { REGISTER_FEATURES } from "@/features/auth/auth.copy";
import {
  getRegisterErrorMessage,
  getRegistrationState,
} from "@/features/auth/auth.validation";

const SignUpForm = ({ onLogin }) => {
  const { setAuth, closeLogin } = useContext(AuthContext);
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

  const registrationState = useMemo(
    () => getRegistrationState(formData),
    [formData],
  );

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
      setError(getRegisterErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      aside={
        <AuthAside
          eyebrow={REGISTER_FEATURES.eyebrow}
          title={REGISTER_FEATURES.title}
          text={REGISTER_FEATURES.text}
        >
          <AuthChecklist
            sections={registrationState.sections}
            completed={registrationState.completed}
            total={registrationState.total}
            percent={registrationState.percent}
          />
        </AuthAside>
      }
      formEyebrow={success ? "Account ready" : "Create your pass"}
      formTitle={
        success ? "Your account is ready." : "Create your InkVerse account"
      }
      formText={
        success
          ? "Sign in with your new credentials and start shaping your shelf."
          : "Set up a reader identity for reviews, saved books, rankings, and your personal library."
      }
      footer={
        <p className="iv-auth-legal">
          By creating an account, you agree to InkVerse&apos;s{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
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
              Welcome to InkVerse.
            </h2>
            <p className="iv-auth-success__text">
              Your reader account is live. You can sign in now with your new
              username and password, or continue with Google whenever you like.
            </p>
          </div>
          <div className="iv-auth-success__actions">
            <button
              type="button"
              className="iv-auth-submit"
              onClick={() => onLogin?.()}
            >
              Sign in now
            </button>
            <button
              type="button"
              className="iv-auth-secondaryAction"
              onClick={closeLogin}
            >
              Continue browsing
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
                label="First name"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Rakan"
                autoComplete="given-name"
              />

              <AuthField
                id="register-last-name"
                label="Last name"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Odeh"
                autoComplete="family-name"
              />
            </div>

            <AuthField
              id="register-username"
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="inkverse_reader"
              autoComplete="username"
              helper="3 to 20 characters, starting with a letter. Letters, numbers, and underscores only."
            />

            <AuthField
              id="register-email"
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@example.com"
              autoComplete="email"
            />

            <AuthField
              id="register-password"
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a secure password"
              autoComplete="new-password"
              helper="Use 8+ characters with upper, lower, number, and symbol."
              action={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />

            <AuthField
              id="register-confirm-password"
              label="Confirm password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Repeat your password"
              autoComplete="new-password"
              action={
                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              }
            />

            <button
              type="submit"
              className="iv-auth-submit"
              disabled={!registrationState.isReady || loading}
            >
              {loading ? "Creating account..." : "Create account"}
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
