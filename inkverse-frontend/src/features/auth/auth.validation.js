function extractApiMessage(err) {
  const data = err?.response?.data;

  if (data?.errors) {
    if (typeof data.errors === "string") return data.errors.toLowerCase();
    if (Array.isArray(data.errors)) return data.errors.join(" ").toLowerCase();
  }

  if (data?.message) return String(data.message).toLowerCase();
  if (data?.error) return String(data.error).toLowerCase();
  if (typeof data === "string") return data.toLowerCase();

  return "";
}

export function isLoginReady(loginInput, password) {
  return loginInput.trim() !== "" && password.trim() !== "";
}

export function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isUsernameValid(username) {
  const trimmed = username.trim();
  return /^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(trimmed);
}

export function getPasswordChecks(password) {
  return [
    {
      label: "At least 8 characters",
      passed: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      passed: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      passed: /[a-z]/.test(password),
    },
    {
      label: "One number",
      passed: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function getRegistrationState(formData) {
  const firstName = formData.firstName.trim();
  const lastName = formData.lastName.trim();
  const username = formData.username.trim();
  const email = formData.email.trim();
  const password = formData.password;
  const confirmPassword = formData.confirmPassword;

  const sections = [
    {
      title: "Identity",
      items: [
        {
          label: "First name has at least 2 characters",
          passed: firstName.length >= 2,
        },
        {
          label: "Last name has at least 2 characters",
          passed: lastName.length >= 2,
        },
        {
          label: "Username is 3 to 20 characters",
          passed: username.length >= 3 && username.length <= 20,
        },
        {
          label: "Username starts with a letter",
          passed: username.length > 0 && /^[A-Za-z]/.test(username),
        },
        {
          label: "Username uses letters, numbers, or underscores",
          passed: username.length > 0 && /^[A-Za-z][A-Za-z0-9_]*$/.test(username),
        },
      ],
    },
    {
      title: "Credentials",
      items: [
        {
          label: "Email looks valid",
          passed: isEmailValid(email),
        },
        ...getPasswordChecks(password),
      ],
    },
    {
      title: "Confirmation",
      items: [
        {
          label: "Passwords match",
          passed:
            confirmPassword.length > 0 && password.length > 0 && password === confirmPassword,
        },
      ],
    },
  ];

  const total = sections.reduce((sum, section) => sum + section.items.length, 0);
  const completed = sections.reduce(
    (sum, section) => sum + section.items.filter((item) => item.passed).length,
    0,
  );

  return {
    sections,
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    isReady:
      firstName.length >= 2 &&
      lastName.length >= 2 &&
      isUsernameValid(username) &&
      isEmailValid(email) &&
      getPasswordChecks(password).every((item) => item.passed) &&
      confirmPassword.length > 0 &&
      password === confirmPassword,
  };
}

export function getLoginErrorMessage(err) {
  if (err?.response) {
    const status = err.response.status;
    const message = extractApiMessage(err);

    if (status === 401) {
      return "Invalid username, email, or password. Please try again.";
    }

    if (status === 400) {
      if (message.includes("username") || message.includes("email")) {
        return "Enter a valid username or email address.";
      }

      if (message.includes("password")) {
        return "Enter your password to continue.";
      }

      return (
        err.response.data?.message ||
        err.response.data?.errors ||
        "Login failed. Please check your information."
      );
    }

    if (status === 422) {
      return "Please review the fields and try again.";
    }

    if (status >= 500) {
      return "Server error. Please try again in a moment.";
    }

    return (
      err.response.data?.message ||
      err.response.data?.errors ||
      "Login failed. Please try again."
    );
  }

  if (err?.request) {
    return "Network error. Check your connection and try again.";
  }

  return "An unexpected error occurred. Please try again.";
}

export function getRegisterErrorMessage(err) {
  if (err?.response) {
    const status = err.response.status;
    const message = extractApiMessage(err);

    if (status === 409 || status === 400) {
      if (message.includes("username") && (message.includes("already") || message.includes("taken"))) {
        return "That username is already taken. Try another one.";
      }

      if (message.includes("email") && (message.includes("already") || message.includes("taken"))) {
        return "That email is already registered. Try signing in instead.";
      }

      if (message.includes("username") && message.includes("email")) {
        return "Both the username and email are already in use.";
      }

      return (
        err.response.data?.message ||
        err.response.data?.errors ||
        "Registration failed. Please check your information."
      );
    }

    if (status === 422) {
      return "Please review the form details and make sure every requirement is met.";
    }

    if (status >= 500) {
      return "Server error. Please try again later.";
    }

    return (
      err.response.data?.message ||
      err.response.data?.errors ||
      "Registration failed. Please try again."
    );
  }

  if (err?.request) {
    return "Network error. Check your connection and try again.";
  }

  return "An unexpected error occurred. Please try again.";
}
