console.log("JS підключений");

const form = document.getElementById("registrationForm");

/* FORMS */
const forms = {
  register: document.querySelector(".register"),
  login: document.querySelector(".login"),
  forgot: document.querySelector(".forgot"),
  verify: document.querySelector(".verify"),
  reset: document.querySelector(".reset-password")
};

/* BUTTONS */
const switchLogin = document.querySelector(".switch-login");
const switchRegister = document.querySelector(".switch-register");
const forgotBtn = document.querySelector(".forgot-password");
const backLoginBtns = document.querySelectorAll(".back-login");
const forgotSubmitBtn = document.getElementById("forgot-submit");

/* INPUTS */
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");
const regUsername = document.getElementById("reg-username");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const forgotEmail = document.getElementById("forgot-email");

/* NEW PASSWORD */
const newPassword = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");

/* ERRORS */
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const usernameError = document.getElementById("username-error");

const loginEmailError = document.getElementById("login-email-error");
const loginPasswordError = document.getElementById("login-password-error");

const forgotEmailError = document.getElementById("forgot-email-error");

const newPasswordError = document.getElementById("new-password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");

/* SHOW FORM */
function showForm(name) {
  form.reset();

  document.querySelectorAll(".error").forEach(e => e.textContent = "");
  document.querySelectorAll(".input-error").forEach(i => i.classList.remove("input-error"));
  
  // Скидаємо поля паролів на тип password та повертаємо закрите око
  document.querySelectorAll(".password-wrapper input").forEach(input => input.type = "password");
  document.querySelectorAll(".toggle-password").forEach(iconBtn => {
    iconBtn.querySelector(".eye-open").style.display = "none";
    iconBtn.querySelector(".eye-closed").style.display = "block";
  });

  Object.values(forms).forEach(item => item.classList.remove("active"));
  forms[name].classList.add("active");
}

/* SWITCH */
switchLogin.addEventListener("click", e => {
  e.preventDefault();
  showForm("login");
});

if (switchRegister) {
  switchRegister.addEventListener("click", e => {
    e.preventDefault();
    showForm("register");
  });
}

forgotBtn.addEventListener("click", e => {
  e.preventDefault();
  showForm("forgot");
});

backLoginBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    showForm("login");
  });
});

/* VALIDATION */
function showError(input, error, message) {
  error.textContent = message;
  input.classList.add("input-error");
}

function clearError(input, error) {
  error.textContent = "";
  input.classList.remove("input-error");
}

function validateEmail(input, error) {
  clearError(input, error);
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (input.value.trim() === "") {
    showError(input, error, "Введіть email");
    return false;
  }
  if (!regex.test(input.value)) {
    showError(input, error, "Некоректний email");
    return false;
  }
  return true;
}

function validatePassword(input, error) {
  clearError(input, error);

  if (input.value === "") {
    showError(input, error, "Введіть пароль");
    return false;
  }
  if (input.value.length < 6) {
    showError(input, error, "Мінімум 6 символів");
    return false;
  }
  return true;
}

function validateUsername(input, error) {
  clearError(input, error);

  if (input.value.trim() === "") {
    showError(input, error, "Введіть ім'я");
    return false;
  }
  if (input.value.length < 3) {
    showError(input, error, "Мінімум 3 символи");
    return false;
  }
  return true;
}

function validateConfirmPassword(pass, confirm, error) {
  clearError(confirm, error);

  if (confirm.value === "") {
    showError(confirm, error, "Підтвердіть пароль");
    return false;
  }

  if (pass.value !== confirm.value) {
    showError(confirm, error, "Паролі не співпадають");
    return false;
  }

  return true;
}

/* LIVE VALIDATION */
regEmail.addEventListener("input", () => validateEmail(regEmail, emailError));
regPassword.addEventListener("input", () => validatePassword(regPassword, passwordError));
regUsername.addEventListener("input", () => validateUsername(regUsername, usernameError));

loginEmail.addEventListener("input", () => validateEmail(loginEmail, loginEmailError));
loginPassword.addEventListener("input", () => validatePassword(loginPassword, loginPasswordError));

forgotEmail.addEventListener("input", () => validateEmail(forgotEmail, forgotEmailError));

newPassword.addEventListener("input", () => validatePassword(newPassword, newPasswordError));
confirmPassword.addEventListener("input", () => validateConfirmPassword(newPassword, confirmPassword, confirmPasswordError));


/* 👁️ SHOW / HIDE PASSWORD (СУЧАСНИЙ SVG ВАРІАНТ) */
document.querySelectorAll(".toggle-password").forEach(iconBtn => {
  iconBtn.addEventListener("click", () => {
    const input = iconBtn.previousElementSibling;
    const eyeOpen = iconBtn.querySelector(".eye-open");
    const eyeClosed = iconBtn.querySelector(".eye-closed");

    if (input.type === "password") {
      input.type = "text";
      eyeOpen.style.display = "block";
      eyeClosed.style.display = "none";
    } else {
      input.type = "password";
      eyeOpen.style.display = "none";
      eyeClosed.style.display = "block";
    }
  });
});

/* VERIFY CODE */
const codeBoxes = document.querySelectorAll(".code-box");

codeBoxes.forEach((box, index) => {
  box.addEventListener("input", () => {
    if (box.value.length === 1 && index < codeBoxes.length - 1) {
      codeBoxes[index + 1].focus();
    }
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && box.value === "" && index > 0) {
      codeBoxes[index - 1].focus();
    }
  });
});

/* FORGOT PASSWORD */
if (forgotSubmitBtn) {
  forgotSubmitBtn.addEventListener("click", (e) => {
    e.preventDefault();

    let valid = true;
    if (!validateEmail(forgotEmail, forgotEmailError)) valid = false;

    if (!valid) return;

    alert("Код відправлено на email");
    showForm("verify");
  });
}

/* MAIN SUBMIT */
form.addEventListener("submit", e => {
  e.preventDefault();

  if (forms.register.classList.contains("active")) {
    let valid = true;
    if (!validateUsername(regUsername, usernameError)) valid = false;
    if (!validateEmail(regEmail, emailError)) valid = false;
    if (!validatePassword(regPassword, passwordError)) valid = false;

    if (!valid) return;
    alert("Реєстрація успішна");
  }

  else if (forms.login.classList.contains("active")) {
    let valid = true;
    if (!validateEmail(loginEmail, loginEmailError)) valid = false;
    if (!validatePassword(loginPassword, loginPasswordError)) valid = false;

    if (!valid) return;
    alert("Вхід успішний");
  }

  else if (forms.verify.classList.contains("active")) {
    let code = "";
    codeBoxes.forEach(box => code += box.value);

    if (code.length !== 4) {
      alert("Введіть 4 цифри коду");
      return;
    }

    showForm("reset");
  }

  else if (forms.reset.classList.contains("active")) {
    let valid = true;

    if (!validatePassword(newPassword, newPasswordError)) valid = false;
    if (!validateConfirmPassword(newPassword, confirmPassword, confirmPasswordError)) valid = false;

    if (!valid) return;

    alert("Пароль змінено ✅");
    showForm("login");
  }
});
