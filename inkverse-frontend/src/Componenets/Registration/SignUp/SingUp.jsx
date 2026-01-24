import React from "react";
// import styled from 'styled-components';
import "./SignUp.css";
import { useState, useContext } from "react";
import api from "../../../Api/api";
import { useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../../../Context/AuthProvider";
import GoogleLoginButton from "../../LoginComp/GoogleLoginButton";

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

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormFilled =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.username.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.password.trim() !== "" &&
    formData.confirmPassword.trim() !== "" &&
    formData.password === formData.confirmPassword;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Prepare the data for API call
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      // Make API call to register user
      const response = await api.post(
        "/account/register",
        userData,
      );

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Registration error:", err);
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

        if (status === 409 || status === 400) {
          // Check for duplicate username/email errors
          if (
            errorMessage.includes("username") &&
            (errorMessage.includes("already taken") ||
              errorMessage.includes("is already"))
          ) {
            setError(
              "This username is already taken. Please choose a different username.",
            );
          } else if (
            errorMessage.includes("email") &&
            (errorMessage.includes("already taken") ||
              errorMessage.includes("is already"))
          ) {
            setError(
              "This email address is already registered. Please use a different email or try logging in.",
            );
          } else if (
            errorMessage.includes("username") &&
            errorMessage.includes("email")
          ) {
            // Both username and email are taken
            setError(
              "Both the username and email address are already in use. Please choose different credentials.",
            );
          } else {
            // Fallback to server message
            setError(
              errorData?.message ||
                errorData?.errors ||
                "Registration failed. Please check your information.",
            );
          }
        } else if (status === 422) {
          // Unprocessable entity - validation failed
          setError(
            "Please ensure all fields are filled correctly and meet the requirements.",
          );
        } else if (status === 500) {
          // Server error
          setError("Server error. Please try again later.");
        } else {
          // Other server errors
          setError(
            errorData?.message ||
              errorData?.errors ||
              "Registration failed. Please try again.",
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

  return (
    <>
      {success ? (
        <div
          className="signup-container mx-auto border rounded-3 text-light shadow-lg d-flex align-items-center justify-content-center"
          style={{
            width: "900px",
            height: "600px",
            backgroundColor: "rgba(11, 11, 11, 1)",
          }}
        >
          <div className="text-center">
            <div className="success-icon mb-4">
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#28a745"
                  strokeWidth="2"
                  fill="#28a745"
                  opacity="0.1"
                />
                <path
                  d="M8 12l2 2 4-4"
                  stroke="#28a745"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-success mb-3">Account Created Successfully!</h1>
            <p className="mb-4">
              Welcome to InkVerse! Your account has been created and you can now
              start exploring our collection of books.
            </p>
            <button
              type="button"
              className="btn btn-success btn-lg px-4 py-2"
              onClick={onLogin}
            >
              Continue to Login
            </button>
          </div>
        </div>
      ) : (
        <div
          className="signup-container mx-auto  rounded-3 text-light shadow-lg"
          style={{ width: "100%", backgroundColor: "rgba(11, 11, 11, 1)" }}
        >
          <div className="row h-100 g-0">
            {/* Left Side - Rules & Guidelines */}
            <div className="col-md-5 rules-panel p-4 d-flex flex-column d-none d-md-block">
              <div className="rules-header text-center mb-4">
                <img
                  src="src\assets\icons\InkVerseIcon.jpeg"
                  alt=""
                  className=""
                  style={{ width: "auto", height: "180px" }}
                />
                <h3 className="Greeting mb-2">Join InkVerse</h3>
              </div>

              <div className="rules-content">
                <h5 className="rules-title mb-3">
                  Account Creation Guidelines
                </h5>

                {/* Name Fields Rules */}
                <div className="rule-section mb-3">
                  <h6 className="rule-heading text-start px-3">
                    Name Information:
                  </h6>
                  <ul className="rule-list">
                    <li
                      className={`rule-item ${formData.firstName.trim().length >= 2 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      First name: at least 2 characters
                    </li>
                    <li
                      className={`rule-item ${formData.lastName.trim().length >= 2 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Last name: at least 2 characters
                    </li>
                  </ul>
                </div>

                {/* Username Rules */}
                <div className="rule-section mb-3">
                  <h6 className="rule-heading text-start px-3"> Username:</h6>
                  <ul className="rule-list">
                    <li
                      className={`rule-item ${formData.username.trim().length >= 3 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      At least 3 characters long
                    </li>
                    <li
                      className={`rule-item ${formData.username.trim().length > 0 && /^[a-zA-Z0-9_]+$/.test(formData.username) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Letters, numbers, and underscores only
                    </li>
                    <li
                      className={`rule-item ${formData.username.trim().length > 0 && !/^\d/.test(formData.username) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Cannot start with a number
                    </li>
                    <li
                      className={`rule-item ${formData.username.trim().length <= 20 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Maximum 20 characters
                    </li>
                  </ul>
                </div>

                {/* Email Rules */}
                <div className="rule-section mb-3 px-3">
                  <h6 className="rule-heading text-start">Email Address:</h6>
                  <ul className="rule-list">
                    <li
                      className={`rule-item ${formData.email.includes("@") && formData.email.includes(".") ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Valid email format (name@domain.com)
                    </li>
                    <li
                      className={`rule-item ${formData.email.trim().length > 0 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Required field
                    </li>
                  </ul>
                </div>

                {/* Password Rules */}
                <div className="rule-section mb-3 px-3">
                  <h6 className="rule-heading text-start">
                    Password Requirements:
                  </h6>
                  <ul className="rule-list">
                    <li
                      className={`rule-item ${formData.password.length >= 8 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      At least 8 characters long
                    </li>
                    <li
                      className={`rule-item ${/[A-Z]/.test(formData.password) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      One uppercase letter (A-Z)
                    </li>
                    <li
                      className={`rule-item ${/[a-z]/.test(formData.password) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      One lowercase letter (a-z)
                    </li>
                    <li
                      className={`rule-item ${/[0-9]/.test(formData.password) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      One number (0-9)
                    </li>
                    <li
                      className={`rule-item ${/[^A-Za-z0-9]/.test(formData.password) ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      One special character (!@#$%^&*)
                    </li>
                  </ul>
                </div>

                {/* Password Confirmation */}
                <div className="rule-section mb-3 px-3">
                  <h6 className="rule-heading text-start">
                    Password Confirmation:
                  </h6>
                  <ul className="rule-list">
                    <li
                      className={`rule-item ${formData.confirmPassword.length > 0 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Password confirmation entered
                    </li>
                    <li
                      className={`rule-item ${formData.password === formData.confirmPassword && formData.confirmPassword.length > 0 ? "completed" : ""}`}
                    >
                      <span className="rule-check">✓</span>
                      Passwords match
                    </li>
                  </ul>
                </div>

                {/* Overall Progress */}
                <div className="progress-section mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="progress-label">Setup Progress</span>
                    <span className="progress-percentage">
                      {Math.round(
                        (((formData.firstName.trim().length >= 2 ? 1 : 0) +
                          (formData.lastName.trim().length >= 2 ? 1 : 0) +
                          (formData.firstName.trim().length > 0 &&
                          /^[a-zA-Z\s]+$/.test(formData.firstName)
                            ? 1
                            : 0) +
                          (formData.lastName.trim().length > 0 &&
                          /^[a-zA-Z\s]+$/.test(formData.lastName)
                            ? 1
                            : 0) +
                          (formData.username.trim().length >= 3 ? 1 : 0) +
                          (formData.username.trim().length > 0 &&
                          /^[a-zA-Z0-9_]+$/.test(formData.username)
                            ? 1
                            : 0) +
                          (formData.username.trim().length > 0 &&
                          !/^\d/.test(formData.username)
                            ? 1
                            : 0) +
                          (formData.username.trim().length <= 20 ? 1 : 0) +
                          (formData.email.includes("@") &&
                          formData.email.includes(".")
                            ? 1
                            : 0) +
                          (formData.password.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(formData.password) ? 1 : 0) +
                          (/[a-z]/.test(formData.password) ? 1 : 0) +
                          (/[0-9]/.test(formData.password) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0) +
                          (formData.password === formData.confirmPassword &&
                          formData.confirmPassword.length > 0
                            ? 1
                            : 0)) /
                          14) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{
                        width: `${Math.round(
                          (((formData.firstName.trim().length >= 2 ? 1 : 0) +
                            (formData.lastName.trim().length >= 2 ? 1 : 0) +
                            (formData.firstName.trim().length > 0 &&
                            /^[a-zA-Z\s]+$/.test(formData.firstName)
                              ? 1
                              : 0) +
                            (formData.lastName.trim().length > 0 &&
                            /^[a-zA-Z\s]+$/.test(formData.lastName)
                              ? 1
                              : 0) +
                            (formData.username.trim().length >= 3 ? 1 : 0) +
                            (formData.username.trim().length > 0 &&
                            /^[a-zA-Z0-9_]+$/.test(formData.username)
                              ? 1
                              : 0) +
                            (formData.username.trim().length > 0 &&
                            !/^\d/.test(formData.username)
                              ? 1
                              : 0) +
                            (formData.username.trim().length <= 20 ? 1 : 0) +
                            (formData.email.includes("@") &&
                            formData.email.includes(".")
                              ? 1
                              : 0) +
                            (formData.password.length >= 8 ? 1 : 0) +
                            (/[A-Z]/.test(formData.password) ? 1 : 0) +
                            (/[a-z]/.test(formData.password) ? 1 : 0) +
                            (/[0-9]/.test(formData.password) ? 1 : 0) +
                            (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0) +
                            (formData.password === formData.confirmPassword &&
                            formData.confirmPassword.length > 0
                              ? 1
                              : 0)) /
                            14) *
                            100,
                        )}%`,
                      }}
                      aria-valuenow={Math.round(
                        (((formData.firstName.trim().length >= 2 ? 1 : 0) +
                          (formData.lastName.trim().length >= 2 ? 1 : 0) +
                          (formData.firstName.trim().length > 0 &&
                          /^[a-zA-Z\s]+$/.test(formData.firstName)
                            ? 1
                            : 0) +
                          (formData.lastName.trim().length > 0 &&
                          /^[a-zA-Z\s]+$/.test(formData.lastName)
                            ? 1
                            : 0) +
                          (formData.username.trim().length >= 3 ? 1 : 0) +
                          (formData.username.trim().length > 0 &&
                          /^[a-zA-Z0-9_]+$/.test(formData.username)
                            ? 1
                            : 0) +
                          (formData.username.trim().length > 0 &&
                          !/^\d/.test(formData.username)
                            ? 1
                            : 0) +
                          (formData.username.trim().length <= 20 ? 1 : 0) +
                          (formData.email.includes("@") &&
                          formData.email.includes(".")
                            ? 1
                            : 0) +
                          (formData.password.length >= 8 ? 1 : 0) +
                          (/[A-Z]/.test(formData.password) ? 1 : 0) +
                          (/[a-z]/.test(formData.password) ? 1 : 0) +
                          (/[0-9]/.test(formData.password) ? 1 : 0) +
                          (/[^A-Za-z0-9]/.test(formData.password) ? 1 : 0) +
                          (formData.password === formData.confirmPassword &&
                          formData.confirmPassword.length > 0
                            ? 1
                            : 0)) /
                          14) *
                          100,
                      )}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="col-md-7 form-panel p-4 d-flex flex-column justify-content-center rounded">
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  {error}
                </div>
              )}
              <form className="form" onSubmit={handleSubmit}>
                <div className="my-5">
                  <h2>Welcome To InkVerse</h2>
                  <p>Access tons of Fanfic Universes by a single tap!</p>
                </div>
                <hr />
                <div className="">
                  <div className="input-group">
                    <input
                      placeholder="First Name"
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      id="firstName"
                    />
                  </div>

                  <div>
                    <div className="input-group">
                      <input
                        placeholder="Last Name"
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        id="lastName"
                      />
                    </div>
                  </div>
                </div>
                <div className="input-group">
                  <input
                    placeholder="Choose a Username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    id="signup-username"
                  />
                </div>
                <div className="input-group">
                  <input
                    placeholder="Enter your Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    id="email"
                  />
                </div>
                <div className="input-group password-group">
                  <input
                    placeholder="Create Password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    id="signup-password"
                  />
                </div>
                <div className="input-group password-group">
                  <input
                    placeholder="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    id="confirmPassword"
                  />
                </div>
                <button
                  type="submit"
                  className={`sign mt-3 login-btn ${isFormFilled ? "show" : ""}`}
                  disabled={!isFormFilled || loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
                <hr />
                <p className="text-center mt-3">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="btn btn-link p-0"
                    onClick={onLogin}
                  >
                    Sign in
                  </button>
                </p>

                <div className="text-center mt-3">
                  <div className="d-flex justify-content-center gap-2">
                   <span>
                                   <GoogleLoginButton
                                     onSuccess={(authObj) => {
                                       setAuth(authObj);
                                       closeLogin();
                                       navigate(from, { replace: true });
                                       
                                     }}
                                   />
                                 </span>
                  </div>
                </div>

                <footer className="text-center mt-4 footerr">
                  <p className="mb-0">
                    © 2026 InkVerse |{" "}
                    <a href="/terms" className="text-decoration-none text-primary">
                      Terms of Service
                    </a>{" "}
                    |{" "}
                    <a href="/privacy" className="text-decoration-none text-primary">
                      Privacy Policy
                    </a>
                  </p>
                </footer>
              </form>
            </div>

            {/* Footer */}
          </div>
        </div>
      )}
    </>
  );
};

export default SignUpForm;
