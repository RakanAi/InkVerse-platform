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

export function getPasswordChecks(t, password) {
  return [
    {
      label: t("auth.register.checklist.rules.passwordLength"),
      passed: password.length >= 8,
    },
    {
      label: t("auth.register.checklist.rules.passwordUpper"),
      passed: /[A-Z]/.test(password),
    },
    {
      label: t("auth.register.checklist.rules.passwordLower"),
      passed: /[a-z]/.test(password),
    },
    {
      label: t("auth.register.checklist.rules.passwordNumber"),
      passed: /[0-9]/.test(password),
    },
    {
      label: t("auth.register.checklist.rules.passwordSpecial"),
      passed: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function getRegistrationState(t, formData) {
  const firstName = formData.firstName.trim();
  const lastName = formData.lastName.trim();
  const username = formData.username.trim();
  const email = formData.email.trim();
  const password = formData.password;
  const confirmPassword = formData.confirmPassword;

  const sections = [
    {
      title: t("auth.register.checklist.sections.identity"),
      items: [
        {
          label: t("auth.register.checklist.rules.firstNameLength"),
          passed: firstName.length >= 2,
        },
        {
          label: t("auth.register.checklist.rules.lastNameLength"),
          passed: lastName.length >= 2,
        },
        {
          label: t("auth.register.checklist.rules.usernameLength"),
          passed: username.length >= 3 && username.length <= 20,
        },
        {
          label: t("auth.register.checklist.rules.usernameLetter"),
          passed: username.length > 0 && /^[A-Za-z]/.test(username),
        },
        {
          label: t("auth.register.checklist.rules.usernameCharset"),
          passed: username.length > 0 && /^[A-Za-z][A-Za-z0-9_]*$/.test(username),
        },
      ],
    },
    {
      title: t("auth.register.checklist.sections.credentials"),
      items: [
        {
          label: t("auth.register.checklist.rules.emailValid"),
          passed: isEmailValid(email),
        },
        ...getPasswordChecks(t, password),
      ],
    },
    {
      title: t("auth.register.checklist.sections.confirmation"),
      items: [
        {
          label: t("auth.register.checklist.rules.passwordsMatch"),
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
      getPasswordChecks(t, password).every((item) => item.passed) &&
      confirmPassword.length > 0 &&
      password === confirmPassword,
  };
}

export function getLoginErrorMessage(t, err) {
  if (err?.response) {
    const status = err.response.status;
    const message = extractApiMessage(err);

    if (status === 401) {
      return t("auth.login.errors.invalidCredentials");
    }

    if (status === 400) {
      if (message.includes("username") || message.includes("email")) {
        return t("auth.login.errors.validLoginInput");
      }

      if (message.includes("password")) {
        return t("auth.login.errors.passwordRequired");
      }

      return (
        err.response.data?.message ||
        err.response.data?.errors ||
        t("auth.login.errors.generic400")
      );
    }

    if (status === 422) {
      return t("auth.login.errors.reviewFields");
    }

    if (status >= 500) {
      return t("auth.login.errors.server");
    }

    return (
      err.response.data?.message ||
      err.response.data?.errors ||
      t("auth.login.errors.generic")
    );
  }

  if (err?.request) {
    return t("auth.login.errors.network");
  }

  return t("auth.login.errors.unexpected");
}

export function getRegisterErrorMessage(t, err) {
  if (err?.response) {
    const status = err.response.status;
    const message = extractApiMessage(err);

    if (status === 409 || status === 400) {
      if (message.includes("username") && (message.includes("already") || message.includes("taken"))) {
        return t("auth.register.errors.usernameTaken");
      }

      if (message.includes("email") && (message.includes("already") || message.includes("taken"))) {
        return t("auth.register.errors.emailTaken");
      }

      if (message.includes("username") && message.includes("email")) {
        return t("auth.register.errors.bothTaken");
      }

      return (
        err.response.data?.message ||
        err.response.data?.errors ||
        t("auth.register.errors.generic400")
      );
    }

    if (status === 422) {
      return t("auth.register.errors.reviewFields");
    }

    if (status >= 500) {
      return t("auth.register.errors.server");
    }

    return (
      err.response.data?.message ||
      err.response.data?.errors ||
      t("auth.register.errors.generic")
    );
  }

  if (err?.request) {
    return t("auth.register.errors.network");
  }

  return t("auth.register.errors.unexpected");
}
