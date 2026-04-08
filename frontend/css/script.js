console.log("JS підключений");
const form = document.getElementById("registrationForm");

// Форми 
const forms = {
  register: document.querySelector(".register"), 
  login: document.querySelector(".login"),   
  forgot: document.querySelector(".forgot"),     
  verify: document.querySelector(".verify"),    
  reset: document.querySelector(".reset-password") 
};

// Кнопки 
const switchLogin = document.querySelector(".switch-login"); // кнопка "Увійти"
const switchRegister = document.querySelector(".switch-register"); // кнопка "Створити" 
const forgotBtn = document.querySelector(".forgot-password"); // посилання "Забули пароль?"
const backLoginBtns = document.querySelectorAll(".back-login"); // кнопки повернення до входу
const forgotSubmitBtn = document.getElementById("forgot-submit"); // кнопка відправки email для відновлення

// Поля введення 
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");
const regUsername = document.getElementById("reg-username");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const forgotEmail = document.getElementById("forgot-email");
const newPassword = document.getElementById("new-password"); 
const confirmPassword = document.getElementById("confirm-password"); 

//Елементи для відображення помилок
const emailError = document.getElementById("email-error");
const passwordError = document.getElementById("password-error");
const usernameError = document.getElementById("username-error");

const loginEmailError = document.getElementById("login-email-error");
const loginPasswordError = document.getElementById("login-password-error");

const forgotEmailError = document.getElementById("forgot-email-error");

const newPasswordError = document.getElementById("new-password-error");
const confirmPasswordError = document.getElementById("confirm-password-error");

// Показує потрібну форму, ховає інші та скидає всі поля і помилки
function showForm(name) {
  if (form) form.reset(); 
  document.querySelectorAll(".error").forEach(e => e.textContent = ""); 
  document.querySelectorAll(".input-error").forEach(i => i.classList.remove("input-error"));

  // Скидання полів пароля та іконки очей
  document.querySelectorAll(".password-wrapper input").forEach(input => input.type = "password");
  document.querySelectorAll(".toggle-password").forEach(iconBtn => {
    iconBtn.querySelector(".eye-open").style.display = "none";
    iconBtn.querySelector(".eye-closed").style.display = "block";
  });

  // Приховуємо всі форми і показуємо потрібну
  Object.values(forms).forEach(item => item.classList.remove("active"));
  forms[name].classList.add("active");
}

// Перемикання форм 
if (switchLogin) {
  switchLogin.addEventListener("click", e => {
    e.preventDefault();
    showForm("login");
  });
}

if (switchRegister) {
  switchRegister.addEventListener("click", e => {
    e.preventDefault();
    showForm("register");
  });
}

if (forgotBtn) {
  forgotBtn.addEventListener("click", e => {
    e.preventDefault();
    showForm("forgot");
  });
}

backLoginBtns.forEach(btn => {
  btn.addEventListener("click", e => {
    e.preventDefault();
    showForm("login");
  });
});

// Функції валідації
// Показати повідомлення про помилку
function showError(input, error, message) {
  error.textContent = message;
  input.classList.add("input-error");
}

// Очистити повідомлення про помилку
function clearError(input, error) {
  error.textContent = "";
  input.classList.remove("input-error");
}

// Перевірка email
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

// Перевірка пароля
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

// Перевірка імені користувача
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

// Підтвердження пароля
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

// Валідація при введенні
if (regEmail) {
    regEmail.addEventListener("input", () => validateEmail(regEmail, emailError));
    regPassword.addEventListener("input", () => validatePassword(regPassword, passwordError));
    regUsername.addEventListener("input", () => validateUsername(regUsername, usernameError));
}

if (loginEmail) {
    loginEmail.addEventListener("input", () => validateEmail(loginEmail, loginEmailError));
    loginPassword.addEventListener("input", () => validatePassword(loginPassword, loginPasswordError));
}

if (forgotEmail) {
    forgotEmail.addEventListener("input", () => validateEmail(forgotEmail, forgotEmailError));
}

if (newPassword) {
    newPassword.addEventListener("input", () => validatePassword(newPassword, newPasswordError));
    confirmPassword.addEventListener("input", () => validateConfirmPassword(newPassword, confirmPassword, confirmPasswordError));
}

// Показ / приховування пароля 
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

// Підтвердження коду
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

// Відновлення пароля 
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

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    // Реєстрація
    if (forms.register.classList.contains("active")) {
      let valid = true;
      if (!validateUsername(regUsername, usernameError)) valid = false;
      if (!validateEmail(regEmail, emailError)) valid = false;
      if (!validatePassword(regPassword, passwordError)) valid = false;

      if (!valid) return;
      
      try {
        const res = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            username: regUsername.value, 
            email: regEmail.value, 
            password: regPassword.value 
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert("Помилка реєстрації: " + (data.error || "Невідома помилка"));
        } else {
          alert(data.message || "Реєстрація успішна! Перевірте консоль сервера для активації.");
          showForm("login");
        }
      } catch (err) {
        console.error(err);
        alert("Помилка з'єднання з сервером.");
      }
    }

    // Вхід
    else if (forms.login.classList.contains("active")) {
      let valid = true;
      if (!validateEmail(loginEmail, loginEmailError)) valid = false;
      if (!validatePassword(loginPassword, loginPasswordError)) valid = false;

      if (!valid) return;
      
      try {
        const res = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: loginEmail.value, 
            password: loginPassword.value 
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert("Помилка входу: " + (data.error || "Невідома помилка"));
        } else {
          alert("Вхід успішний!");
          localStorage.setItem('user', JSON.stringify(data.user));
          const authModal = document.getElementById("authModal");
          if (authModal) authModal.style.display = "none";
          
          window.dispatchEvent(new Event('userLoginStateChanged'));
        }
      } catch (err) {
        console.error(err);
        alert("Помилка з'єднання з сервером.");
      }
    }

    // Підтвердження коду
    else if (forms.verify.classList.contains("active")) {
      let code = "";
      codeBoxes.forEach(box => code += box.value);

      if (code.length !== 4) {
        alert("Введіть 4 цифри коду");
        return;
      }

      showForm("reset");
    }

    // Зміна пароля
    else if (forms.reset.classList.contains("active")) {
      let valid = true;

      if (!validatePassword(newPassword, newPasswordError)) valid = false;
      if (!validateConfirmPassword(newPassword, confirmPassword, confirmPasswordError)) valid = false;

      if (!valid) return;

      alert("Пароль змінено ✅");
      showForm("login");
    }
  });
}

const authModal = document.getElementById("authModal");
const profileBtn = document.getElementById("profileBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// Відкрити форму по кліку на іконку
if (profileBtn && authModal) {
  profileBtn.addEventListener("click", () => {
    authModal.style.display = "flex";
  });
}

// Закрити форму по кліку на хрестик
if (closeModalBtn && authModal) {
  closeModalBtn.addEventListener("click", () => {
    authModal.style.display = "none";
  });
}

if (authModal) {
  window.addEventListener("click", (e) => {
    if (e.target === authModal) {
      authModal.style.display = "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("header-date");
  const dateText = document.getElementById("header-date-text");
  const cityFilter = document.querySelector(".city-filter");
  const cityDropdown = document.querySelector(".city-dropdown");
  const cityFilterText = document.querySelector(".city-filter-text");
  const categoryFilter = document.querySelector(".category-filter");
  const categoryDropdown = document.querySelector(".category-dropdown");
  const categoryFilterText = document.querySelector(".category-filter-text");

  const closeDropdowns = (exclude = null) => {
    if (cityDropdown && exclude !== cityDropdown) {
      cityDropdown.classList.add("hidden");
    }
    if (categoryDropdown && exclude !== categoryDropdown) {
      categoryDropdown.classList.add("hidden");
    }
  };

  if (dateInput && dateText) {
    const dateFilterPill = document.querySelector(".date-filter");
    if (dateFilterPill) {
      dateFilterPill.addEventListener("click", () => {
        try {
          if (typeof dateInput.showPicker === 'function') {
            dateInput.showPicker();
          } else {
            dateInput.focus();
          }
        } catch (e) {}
      });
    }

    dateInput.addEventListener("input", () => {
      if (dateInput.value) {
        const selectedDate = new Date(dateInput.value);
        dateText.textContent = selectedDate.toLocaleDateString("uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
      } else {
        dateText.textContent = "Дата";
      }
    });
  }

  if (cityFilter && cityDropdown && cityFilterText) {
    cityFilter.addEventListener("click", (e) => {
      if (e.target.closest(".city-option") || e.target.closest(".city-reset")) {
        return;
      }
      const isHidden = cityDropdown.classList.contains("hidden");
      closeDropdowns(cityDropdown);
      if (isHidden) {
        cityDropdown.classList.remove("hidden");
      } else {
        cityDropdown.classList.add("hidden");
      }
    });

    cityDropdown.addEventListener("click", (e) => {
      const option = e.target.closest(".city-option");
      const reset = e.target.closest(".city-reset");
      if (option) {
        cityFilterText.textContent = option.textContent;
        cityDropdown.classList.add("hidden");
      }
      if (reset) {
        cityFilterText.textContent = "Місто";
        cityDropdown.classList.add("hidden");
      }
    });
  }

  if (categoryFilter && categoryDropdown && categoryFilterText) {
    categoryFilter.addEventListener("click", (e) => {
      if (e.target.closest(".category-option") || e.target.closest(".category-reset")) {
        return;
      }
      const isHidden = categoryDropdown.classList.contains("hidden");
      closeDropdowns(categoryDropdown);
      if (isHidden) {
        categoryDropdown.classList.remove("hidden");
      } else {
        categoryDropdown.classList.add("hidden");
      }
    });

    categoryDropdown.addEventListener("click", (e) => {
      const option = e.target.closest(".category-option");
      const reset = e.target.closest(".category-reset");
      if (option) {
        categoryFilterText.textContent = option.textContent;
        categoryDropdown.classList.add("hidden");
      }
      if (reset) {
        categoryFilterText.textContent = "Категорії";
        categoryDropdown.classList.add("hidden");
      }
    });
  }

  document.addEventListener("click", (e) => {
    if (cityFilter && !cityFilter.contains(e.target) && cityDropdown) {
      cityDropdown.classList.add("hidden");
    }
    if (categoryFilter && !categoryFilter.contains(e.target) && categoryDropdown) {
      categoryDropdown.classList.add("hidden");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdowns();
    }
  });
});

// ВАЛІДАЦІЯ ПРОМО-ФОРМИ (Стати менеджером) ---
const promoForm = document.getElementById("promoForm");
const promoName = document.getElementById("promo-name");
const promoSphere = document.getElementById("promo-sphere");
const promoEmail = document.getElementById("promo-email");

const promoNameError = document.getElementById("promo-name-error");
const promoSphereError = document.getElementById("promo-sphere-error");
const promoEmailError = document.getElementById("promo-email-error");

// Проста перевірка для  (ім'я, сфера)
function validateText(input, error, message) {
  clearError(input, error);
  if (input.value.trim() === "") {
    showError(input, error, message);
    return false;
  }
  return true;
}

if (promoForm) {
  // Валідація під час введення тексту
  promoName.addEventListener("input", () => validateText(promoName, promoNameError, "Введіть ваше ім'я"));
  promoSphere.addEventListener("input", () => validateText(promoSphere, promoSphereError, "Введіть вашу сферу"));
  promoEmail.addEventListener("input", () => validateEmail(promoEmail, promoEmailError));

  // Перевірка при натисканні "Подати заявку"
  promoForm.addEventListener("submit", (e) => {
    e.preventDefault(); 

    let valid = true;
    if (!validateText(promoName, promoNameError, "Введіть ваше ім'я")) valid = false;
    if (!validateText(promoSphere, promoSphereError, "Введіть вашу сферу")) valid = false;
    if (!validateEmail(promoEmail, promoEmailError)) valid = false;

    if (valid) {
      alert("Ваша заявка успішно відправлена! Ми зв'яжемося з вами.");
      promoForm.reset(); 
    }
  });
}

// --- ПЕРЕХІД МІЖ ПОЛЯМИ ПО ENTER ---
const promoInputsArr = [promoName, promoSphere, promoEmail];

promoInputsArr.forEach((input, index) => {
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault(); 
        if (index < promoInputsArr.length - 1) {
          promoInputsArr[index + 1].focus();
        } else {  
          promoForm.querySelector('button[type="submit"]').click();
        }
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const sortBtn = document.getElementById('sort-btn');
    const sortCard = document.getElementById('sort-card');
    const popularCard = document.getElementById('popular-card');
    const sortClose = document.getElementById('sort-close');

    // Перевіряємо, чи дійсно ці елементи є на поточній сторінці
    if (sortBtn && sortCard && popularCard && sortClose) {
        
        // Коли клікаємо на кнопку "Сортувати за"
        sortBtn.addEventListener('click', () => {
            sortBtn.classList.add('hidden');       // Ховаємо кнопку-капсулу
            popularCard.classList.add('hidden');   // Ховаємо "Популярні"
            sortCard.classList.remove('hidden');   // Показуємо розгорнуту картку сортування
        });

        // Коли клікаємо на заголовок "Сортувати за ^"
        sortClose.addEventListener('click', () => {
            sortCard.classList.add('hidden');      // Ховаємо картку сортування
            sortBtn.classList.remove('hidden');    // Повертаємо кнопку-капсулу
            popularCard.classList.remove('hidden');// Повертаємо "Популярні"
        });
        
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Знаходимо контейнер, де лежать наші картки подій
    const eventsGrid = document.querySelector('.events-grid');

    // Перевіряємо, чи є такий блок на сторінці
    if (eventsGrid) {
        new Sortable(eventsGrid, {
            animation: 200, // Плавна анімація переміщення (в мілісекундах)
            ghostClass: 'sortable-ghost', // Клас для "тіні" картки на новому місці
            dragClass: 'sortable-drag', // Клас для картки, яку ми тримаємо
            delay: 50, // Невелика затримка для мобільних пристроїв, щоб не плутати зі скролом
            delayOnTouchOnly: true
        });
    }
});