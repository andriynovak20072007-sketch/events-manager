console.log("JS підключений");

// ==========================================
// ПАТЕРН: Observer (Спостерігач) — Toast-сповіщення
// Централізована система повідомлень замість alert()
// ==========================================
function showToast(message, type = 'info', duration = 4000) {
    // Створюємо контейнер при першому виклику
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 100px;
            right: 30px;
            z-index: 99999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    // Кольори та іконки для різних типів
    const themes = {
        success: { bg: 'linear-gradient(135deg, #10B981, #059669)', icon: '✓', shadow: 'rgba(16, 185, 129, 0.3)' },
        error:   { bg: 'linear-gradient(135deg, #EF4444, #DC2626)', icon: '✕', shadow: 'rgba(239, 68, 68, 0.3)' },
        info:    { bg: 'linear-gradient(135deg, #2854C5, #00AAFF)', icon: 'ℹ', shadow: 'rgba(40, 84, 197, 0.3)' },
        warning: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', icon: '⚠', shadow: 'rgba(245, 158, 11, 0.3)' }
    };
    
    const theme = themes[type] || themes.info;
    
    toast.style.cssText = `
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background: ${theme.bg};
        color: white;
        border-radius: 16px;
        font-family: 'Montserrat', sans-serif;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 30px ${theme.shadow};
        backdrop-filter: blur(10px);
        transform: translateX(120%);
        transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        max-width: 380px;
        line-height: 1.4;
        cursor: pointer;
    `;
    
    // Іконка
    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        flex-shrink: 0;
    `;
    iconSpan.textContent = theme.icon;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    
    toast.appendChild(iconSpan);
    toast.appendChild(textSpan);
    container.appendChild(toast);
    
    // Анімація появи
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });
    
    // Закриття по кліку
    toast.addEventListener('click', () => removeToast(toast));
    
    // Автоматичне зникнення
    setTimeout(() => removeToast(toast), duration);
    
    function removeToast(el) {
        el.style.transform = 'translateX(120%)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 500);
    }
}

// ==========================================
// ПАТЕРН: Mediator — Підсвітка поля з помилкою
// Центральна функція обробки серверних помилок
// ==========================================
function highlightFieldError(field, errorMap) {
    const fieldMap = {
        'email': { input: document.getElementById('reg-email'), error: document.getElementById('email-error') },
        'password': { input: document.getElementById('reg-password'), error: document.getElementById('password-error') },
        'username': { input: document.getElementById('reg-username'), error: document.getElementById('username-error') }
    };
    
    const target = fieldMap[field];
    if (target && target.input && target.error) {
        target.input.classList.add('input-error');
        target.error.textContent = errorMap || '';
        target.input.focus();
    }
}
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

    showToast('Код відправлено на email', 'success');
    showForm("verify");
  });
}

if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();

    // ==========================================
    // РЕЄСТРАЦІЯ (підключення до бекенду)
    // ПАТЕРН: Command — кожна гілка форми = окрема команда
    // ==========================================
    if (forms.register.classList.contains("active")) {
      let valid = true;
      if (!validateUsername(regUsername, usernameError)) valid = false;
      if (!validateEmail(regEmail, emailError)) valid = false;
      if (!validatePassword(regPassword, passwordError)) valid = false;

      if (!valid) return;

      // Блокуємо кнопку на час запиту (UX)
      const submitBtn = forms.register.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Зачекайте...';
      submitBtn.style.opacity = '0.7';

      try {
        const res = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            username: regUsername.value.trim(),
            email: regEmail.value.trim(),
            password: regPassword.value
          })
        });
        const data = await res.json();

        if (!res.ok) {
          // Підсвічуємо конкретне поле з помилкою (якщо сервер вказав)
          if (data.field) {
            highlightFieldError(data.field, data.error);
          }
          showToast(data.error || 'Помилка реєстрації', 'error');
        } else {
          showToast(data.message || 'Реєстрація успішна! 🎉', 'success', 5000);
          
          // Якщо Trial активовано — показуємо додаткове повідомлення
          if (data.trial) {
            setTimeout(() => {
              showToast(`Trial-період: ${data.trial.duration_days} днів безкоштовно!`, 'info', 6000);
            }, 1500);
          }

          showForm('login');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showToast("Помилка з'єднання з сервером", 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
      }
    }

    // ==========================================
    // ВХІД (LOGIN)
    // ==========================================
    else if (forms.login.classList.contains("active")) {
      let valid = true;
      if (!validateEmail(loginEmail, loginEmailError)) valid = false;
      if (!validatePassword(loginPassword, loginPasswordError)) valid = false;

      if (!valid) return;

      const submitBtn = forms.login.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Зачекайте...';
      submitBtn.style.opacity = '0.7';

      try {
        const res = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: loginEmail.value.trim(),
            password: loginPassword.value
          })
        });
        const data = await res.json();

        if (!res.ok) {
          showToast(data.error || 'Помилка входу', 'error');
        } else {
          showToast('Вхід успішний! 👋', 'success');
          localStorage.setItem('user', JSON.stringify(data.user));
          const authModal = document.getElementById("authModal");
          if (authModal) authModal.style.display = "none";

          // Оновлюємо інтерфейс (Observer pattern — сповіщуємо підписників)
          window.dispatchEvent(new Event('userLoginStateChanged'));

          // Оновлюємо бічну панель
          updatePanelUI(data.user);
        }
      } catch (err) {
        console.error('Login error:', err);
        showToast("Помилка з'єднання з сервером", 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        submitBtn.style.opacity = '1';
      }
    }

    // Підтвердження коду
    else if (forms.verify.classList.contains("active")) {
      let code = "";
      codeBoxes.forEach(box => code += box.value);

      if (code.length !== 4) {
        showToast('Введіть 4 цифри коду', 'warning');
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

      showToast('Пароль успішно змінено ✅', 'success');
      showForm("login");
    }
  });
}

// ==========================================
// ПАТЕРН: Observer — Оновлення UI панелі після логіну
// ==========================================
function updatePanelUI(user) {
    const panelFooter = document.querySelector('.panel-footer');
    const panelNav = document.querySelector('.panel-nav');

    if (user) {
        if (panelNav) panelNav.style.display = 'flex';
        if (panelFooter) {
            panelFooter.innerHTML = `
                <div style="text-align: center; padding: 10px 0;">
                    <div style="font-weight: 700; font-size: 16px; color: #0F172A; margin-bottom: 4px;">
                        ${user.username}
                    </div>
                    <div style="font-size: 13px; color: #64748B;">${user.email}</div>
                    <div style="margin-top: 8px;">
                        <span style="
                            display: inline-block;
                            padding: 3px 12px;
                            border-radius: 20px;
                            font-size: 11px;
                            font-weight: 700;
                            text-transform: uppercase;
                            background: ${user.role === 'pro' ? 'linear-gradient(135deg, #2854C5, #00AAFF)' : '#F1F5F9'};
                            color: ${user.role === 'pro' ? 'white' : '#64748B'};
                        ">${user.role}</span>
                    </div>
                </div>
                <button class="panel-auth-btn register-btn" 
                        onclick="localStorage.removeItem('user'); showToast('Ви вийшли з системи', 'info'); location.reload();" 
                        style="background: #EF4444; margin-top: 10px;">
                    Вийти
                </button>
            `;
        }
    } else {
        if (panelNav) panelNav.style.display = 'none';
        if (panelFooter) {
            panelFooter.innerHTML = `
                <button class="panel-auth-btn login-btn" onclick="openAuthFromPanel('login')">Увійти</button>
                <button class="panel-auth-btn register-btn" onclick="openAuthFromPanel('register')">Зареєструватися</button>
            `;
        }
    }
}


// ==========================================
// Відновлення стану після перезавантаження сторінки
// ==========================================
const savedUser = localStorage.getItem('user');
document.addEventListener('DOMContentLoaded', () => {
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            updatePanelUI(userData);
        } catch(e) { 
            updatePanelUI(null);
        }
    } else {
        updatePanelUI(null);
    }
});

const authModal = document.getElementById("authModal");
const profileBtn = document.getElementById("profileBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

// Логіка для бічної панелі користувача
const userPanel = document.getElementById('userPanel');
const userPanelOverlay = document.getElementById('userPanelOverlay');
const closePanelBtn = document.getElementById('closePanelBtn');
// profileBtn вже знайдений вище у твоєму коді

function toggleUserPanel() {
  if (userPanel && userPanelOverlay) {
    userPanel.classList.toggle('open');
    if (userPanel.classList.contains('open')) {
      userPanelOverlay.classList.add('active');
    } else {
      userPanelOverlay.classList.remove('active');
    }
  }
}

// Відкриваємо панель по кліку на іконку в хедері
if (profileBtn) profileBtn.addEventListener('click', toggleUserPanel);

// Закриваємо по кліку на хрестик або на темний фон
if (closePanelBtn) closePanelBtn.addEventListener('click', toggleUserPanel);
if (userPanelOverlay) userPanelOverlay.addEventListener('click', toggleUserPanel);

// Функція для кнопок внизу панелі (відкриває модалку і потрібну форму)
function openAuthFromPanel(formType) {
  // Спочатку ховаємо бічну панель (динамічно знаходимо елементи)
  const panel = document.getElementById('userPanel');
  const overlay = document.getElementById('userPanelOverlay');
  if (panel && overlay) {
    panel.classList.remove('open');
    overlay.classList.remove('active');
  }
  
  const authModal = document.getElementById("authModal");
  if (authModal) {
    authModal.style.display = "flex"; // Показуємо модалку
    showForm(formType); // Викликаємо твою функцію перемикання форм (login або register)
  }
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
      showToast("Заявка відправлена! Ми зв'яжемося з вами.", 'success');
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

// Логіка для хрестика (закриття всього віджета) — не видаляємо, 
// бо він може знадобитися на головній сторінці, 
// хоча тепер дубльована в map.js.
// Залишимо script.js для загальних функцій сайту.

// Мої події (My events accordion in User Panel)
document.addEventListener('DOMContentLoaded', () => {
    const myEventsToggle = document.getElementById('my-events-toggle');
    const myEventsDropdown = document.getElementById('my-events-dropdown');
    
    // Initialize mock data if localStorage is empty
    if (!localStorage.getItem('myEvents')) {
        const mockData = [
            { id: "fest1", title: "Фестиваль \"Summer Fest\"", status: "Активна", statusIcon: "fa-check-circle", statusColor: "#10B981" },
            { id: "codex1", title: "ІТ Конференція \"CodeX\"", status: "На модерації", statusIcon: "fa-clock", statusColor: "#F59E0B" }
        ];
        localStorage.setItem('myEvents', JSON.stringify(mockData));
    }

    function renderMyEvents() {
        if (!myEventsDropdown) return;
        myEventsDropdown.innerHTML = '';
        const myEvents = JSON.parse(localStorage.getItem('myEvents') || '[]');
        
        if (myEvents.length === 0) {
            myEventsDropdown.innerHTML = '<div style="font-size: 13px; color: #64748B; text-align: center; padding: 10px 0;">У вас ще немає створених подій.</div>';
            return;
        }

        myEvents.forEach(event => {
            const card = document.createElement('div');
            card.className = 'my-event-card';
            card.innerHTML = `
                <div class="my-event-info">
                    <div class="my-event-title">${event.title}</div>
                    <div class="my-event-status" style="color: ${event.statusColor}">
                        <i class="fa-solid ${event.statusIcon}"></i> ${event.status}
                    </div>
                </div>
                <div class="my-event-actions">
                  <a href="create-event.html?id=${event.id}" class="my-event-action-btn edit">
                    <i class="fa-solid fa-pen-to-square"></i> Редагувати
                  </a>
                  <button type="button" class="my-event-action-btn delete delete-my-event-btn" data-id="${event.id}">
                    <i class="fa-solid fa-trash"></i> Видалити
                  </button>
                </div>
            `;
            myEventsDropdown.appendChild(card);
        });

        // Add delete logic
        document.querySelectorAll('.delete-my-event-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const eventId = this.getAttribute('data-id');
                const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
                const filteredEvents = events.filter(e => e.id !== eventId);
                localStorage.setItem('myEvents', JSON.stringify(filteredEvents));
                renderMyEvents();
            });
        });
    }

    if (myEventsToggle && myEventsDropdown) {
        renderMyEvents();
        
        myEventsToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isOpen = myEventsDropdown.style.display === 'flex';
            
            if (isOpen) {
                myEventsDropdown.style.display = 'none';
                const icon = myEventsToggle.querySelector('.chevron-icon');
                if(icon) icon.style.transform = 'rotate(0deg)';
                myEventsToggle.style.backgroundColor = '';
                myEventsToggle.style.color = '';
            } else {
                renderMyEvents(); // Re-render when opening
                myEventsDropdown.style.display = 'flex';
                myEventsToggle.style.flexDirection = 'row';
                const icon = myEventsToggle.querySelector('.chevron-icon');
                if(icon) icon.style.transform = 'rotate(180deg)';
                myEventsToggle.style.backgroundColor = '#F0F9FF';
                myEventsToggle.style.color = '#00AAFF';
                myEventsToggle.style.borderRadius = '8px';
            }
        });
    }
});

// Language Dropdown Logic
document.addEventListener('DOMContentLoaded', () => {
  const languageBtn = document.querySelector('.language-btn');
  const languageDropdown = document.querySelector('.language-dropdown');
  const langOptions = document.querySelectorAll('.lang-option');

  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      languageDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', () => {
      if (!languageDropdown.classList.contains('hidden')) {
        languageDropdown.classList.add('hidden');
      }
    });

    languageDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Extract language code (e.g. "UA" from "UA - Українська")
        const langCode = option.textContent.split(' - ')[0].toLowerCase();
        
        if (typeof applyLanguage === 'function') {
          applyLanguage(langCode);
        }
        
        languageDropdown.classList.add('hidden');
      });
    });
  }
});

// ==========================================
// ІНТЕГРАЦІЯ GOOGLE AUTH
// ==========================================
const googleScript = document.createElement('script');
googleScript.src = "https://accounts.google.com/gsi/client";
googleScript.async = true;
googleScript.defer = true;
document.head.appendChild(googleScript);

googleScript.onload = function() {
    google.accounts.id.initialize({
        client_id: '434377100313-pfs5ti7gdh0oi19o1vtd7oes099if5hs.apps.googleusercontent.com',
        callback: handleGoogleLogin
    });

    const googleLoginBtns = document.querySelectorAll('.google-login');
    googleLoginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            google.accounts.id.prompt();
        });
    });
};

async function handleGoogleLogin(response) {
    try {
        const res = await fetch('http://localhost:5000/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });
        const data = await res.json();
        
        if (res.ok) {
            showToast('Вхід через Google успішний! 👋', 'success');
            localStorage.setItem('user', JSON.stringify(data.user));
            const authModal = document.getElementById("authModal");
            if (authModal) authModal.style.display = "none";
            window.dispatchEvent(new Event('userLoginStateChanged'));
            updatePanelUI(data.user);
        } else {
            showToast(data.error || 'Помилка входу через Google', 'error');
        }
    } catch (err) {
        console.error("Google Auth error:", err);
        showToast("Помилка з'єднання з сервером", 'error');
    }
}

// ==========================================
// ІНТЕГРАЦІЯ СПОВІЩЕНЬ (NOTIFICATIONS)
// ПАТЕРН: Observer (Фронтенд підписник)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const iconBtns = document.querySelectorAll('.header-right .icon-btn');
    let bellBtn = null;
    
    iconBtns.forEach(btn => {
        const img = btn.querySelector('img');
        if (img && img.src.includes('Frame 39')) {
            bellBtn = btn;
        }
    });

    if (bellBtn) {
        const notifDropdown = document.createElement('div');
        notifDropdown.className = 'notifications-dropdown hidden';
        notifDropdown.style.cssText = `
            position: absolute;
            top: 60px;
            right: 80px;
            width: 320px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            z-index: 9999;
            max-height: 400px;
            overflow-y: auto;
            padding: 15px;
            display: none;
        `;
        
        const notifHeader = document.createElement('h3');
        notifHeader.textContent = "Сповіщення";
        notifHeader.style.cssText = "margin-top: 0; margin-bottom: 15px; font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px;";
        notifDropdown.appendChild(notifHeader);

        const notifList = document.createElement('div');
        notifList.id = 'notif-list';
        notifDropdown.appendChild(notifList);

        document.body.appendChild(notifDropdown);

        bellBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = notifDropdown.style.display === 'none';
            notifDropdown.style.display = isHidden ? 'block' : 'none';
            if (isHidden) fetchNotifications();
        });

        document.addEventListener('click', (e) => {
            if (!notifDropdown.contains(e.target) && !bellBtn.contains(e.target)) {
                notifDropdown.style.display = 'none';
            }
        });
        
        window.addEventListener('userLoginStateChanged', fetchNotifications);
        fetchNotifications();
    }
});

async function fetchNotifications() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    const notifList = document.getElementById('notif-list');
    
    try {
        const res = await fetch(`http://localhost:5000/api/notifications/${user.id}`);
        if (!res.ok) return;
        
        const notifications = await res.json();
        
        if (notifList) {
            notifList.innerHTML = '';
            
            if (notifications.length === 0) {
                notifList.innerHTML = '<p style="color: #777; text-align: center; font-size: 14px;">Немає нових сповіщень</p>';
                document.querySelectorAll('.red-dot').forEach(dot => dot.style.display = 'none');
                return;
            }
            
            let hasUnread = false;

            notifications.forEach(n => {
                if (!n.is_read) hasUnread = true;
                
                const item = document.createElement('div');
                item.style.cssText = `
                    padding: 10px;
                    border-bottom: 1px solid #f0f0f0;
                    background: ${n.is_read ? 'transparent' : '#f0f9ff'};
                    border-radius: 6px;
                    margin-bottom: 5px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                `;
                
                let iconStr = '<i class="fa-solid fa-bell" style="color: #00AAFF;"></i>';
                if (n.type === 'invite') iconStr = '<i class="fa-solid fa-envelope" style="color: #F59E0B;"></i>';
                else if (n.type === 'system') iconStr = '<i class="fa-solid fa-gear" style="color: #8B5CF6;"></i>';

                item.innerHTML = `
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <div style="font-size: 16px;">${iconStr}</div>
                        <div>
                            <p style="margin: 0; font-size: 14px; color: #333;">${n.message}</p>
                            <span style="font-size: 11px; color: #999;">${new Date(n.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <button class="del-notif" data-id="${n.notification_id}" style="border: none; background: transparent; color: #EF4444; cursor: pointer; padding: 5px;">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;

                item.addEventListener('click', async (e) => {
                    if (e.target.closest('.del-notif')) return;
                    if (!n.is_read) {
                        await fetch(`http://localhost:5000/api/notifications/${n.notification_id}/read`, { method: 'PUT' });
                        fetchNotifications();
                    }
                });

                item.querySelector('.del-notif').addEventListener('click', async () => {
                    await fetch(`http://localhost:5000/api/notifications/${n.notification_id}`, { method: 'DELETE' });
                    fetchNotifications();
                });

                notifList.appendChild(item);
            });

            document.querySelectorAll('.red-dot').forEach(dot => {
                dot.style.display = hasUnread ? 'block' : 'none';
            });
        }
    } catch (err) {
        console.error("Помилка завантаження сповіщень", err);
    }
}

// --- User Panel Calendar Dropdown ---
document.addEventListener('DOMContentLoaded', () => {
    const calendarBtn = document.getElementById('panelCalendarBtn');
    const calendarPopup = document.getElementById('panelCalendarPopup');
    const chevron = calendarBtn?.querySelector('.calendar-chevron');
    
    if (!calendarBtn || !calendarPopup) return;

    // Toggle popup
    calendarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = calendarPopup.classList.contains('hidden');
        
        if (isHidden) {
            calendarPopup.classList.remove('hidden');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
            calendarPopup.classList.add('hidden');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
    });

    // Calendar logic
    const calPrev = document.getElementById('p-cal-prev');
    const calNext = document.getElementById('p-cal-next');
    const calMonthYear = document.getElementById('p-cal-month-year');
    const calGrid = document.getElementById('p-cal-grid');

    const monthsUA = [
        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
    ];

    let currentDate = new Date();
    let selectedDate = null;
    let eventsByDate = {};

    async function fetchCalendarEvents() {
        try {
            const res = await fetch('http://localhost:5000/api/events');
            if (res.ok) {
                const data = await res.json();
                processEventsData(data);
            } else {
                throw new Error("Failed to load");
            }
        } catch (e) {
            const mock = [
                { event_id: 'fest1', event_day: '2026-04-28', title: 'Фестиваль "Summer Fest"', start_time: '18:00', img: 'images/fest1..png' },
                { event_id: 'fest2', event_day: '2026-05-30', title: 'Фестиваль "Fest"', start_time: '19:00', img: 'images/fest2.png' },
                { event_id: 'fest3', event_day: '2026-06-15', title: 'Музичний "Summer"', start_time: '20:00', img: 'images/fest3.png' },
                { event_id: 'lecture1', event_day: '2026-05-20', title: 'ІТ Конференція "CodeX"', start_time: '10:00', img: 'images/event-1.webp' },
                { event_id: 'lecture2', event_day: '2026-06-11', title: 'Майстер-клас "UX Story"', start_time: '16:00', img: 'images/event-2.jpg' },
                { event_id: 'lecture3', event_day: '2026-06-06', title: 'Лекція "Наука в ІТ"', start_time: '14:00', img: 'images/event-3.jpg' },
                { event_id: 'concert1', event_day: '2026-05-12', title: 'Концерт "Нічний Джем"', start_time: '19:00', img: 'images/event-1.webp' },
                { event_id: 'concert2', event_day: '2026-05-18', title: 'Рок-фестиваль "City Beat"', start_time: '20:00', img: 'images/event-2.jpg' },
                { event_id: 'concert3', event_day: '2026-06-03', title: 'Jazz Night "Odessa Vibes"', start_time: '19:30', img: 'images/event-3.jpg' },
                { event_id: 'sport1', event_day: '2026-05-08', title: 'Матч "Динамо" - "Шахтар"', start_time: '17:00', img: 'images/event-1.webp' },
                { event_id: 'sport2', event_day: '2026-05-22', title: 'Біг по парку "Lviv Run"', start_time: '09:00', img: 'images/event-2.jpg' },
                { event_id: 'sport3', event_day: '2026-05-27', title: 'Велокрос у Харкові', start_time: '11:00', img: 'images/event-3.jpg' }
            ];
            processEventsData(mock);
        }
    }

          function processEventsData(data) {
            eventsByDate = {};
            const userEvents = JSON.parse(localStorage.getItem('myEvents') || '[]');

            const normalizedUserEvents = userEvents.map(event => ({
                event_id: event.id,
                title: event.title || 'Без назви',
                event_day: event.date || event.dateTime || event.event_day,
                start_time: event.start_time || 'Час не вказано',
                img: event.img || event.image || 'images/fest1..png'
            }));

            const allCalendarEvents = [
                ...(Array.isArray(data) ? data : []),
                ...normalizedUserEvents
            ];

            allCalendarEvents.forEach(ev => {
            if (!ev.event_day) return;

            const rawDate = String(ev.event_day).split('T')[0];
            const d = new Date(rawDate);
            if (isNaN(d.getTime())) return;
            const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!eventsByDate[ds]) eventsByDate[ds] = [];
            eventsByDate[ds].push(ev);
        });
        renderCalendar(currentDate);
        
        // Populate initially with today if there are events
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        updateEventsList(todayStr);
    }

    function updateEventsList(dateString) {
        const eventsList = document.getElementById('p-cal-events-list');
        const selectedDateTitle = document.getElementById('p-cal-selected-date-title');
        if (!eventsList || !selectedDateTitle) return;

        const parts = dateString.split('-');
        selectedDateTitle.textContent = `Події на ${parts[2]}.${parts[1]}.${parts[0]}:`;

        eventsList.innerHTML = '';
        
        const dayEvents = eventsByDate[dateString];
        if (!dayEvents || dayEvents.length === 0) {
            eventsList.innerHTML = '<div class="p-cal-no-events">Немає подій на цю дату</div>';
            return;
        }

        dayEvents.forEach(ev => {
            const item = document.createElement('a');
            item.className = 'p-cal-event-item';
            item.href = ev.event_id ? `events.html?event=${ev.event_id}` : '#';
            
            const img = ev.custom_image || ev.img || 'images/fest1..png';
            const time = ev.start_time || 'Час не вказано';
            const title = ev.title || 'Подія';

            item.innerHTML = `
                <div class="p-cal-event-icon" style="background-image: url('${img}')"></div>
                <div class="p-cal-event-info">
                    <span class="p-cal-event-title">${title}</span>
                    <span class="p-cal-event-time"><i class="fa-regular fa-clock"></i> ${time}</span>
                </div>
            `;
            eventsList.appendChild(item);
        });
    }

    function renderCalendar(date) {
        if (!calGrid) return;
        calGrid.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        
        calMonthYear.textContent = `${monthsUA[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let firstDayIndex = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'p-cal-day empty';
            calGrid.appendChild(emptyDiv);
        }

        const today = new Date();

        for (let i = 1; i <= daysInMonth; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'p-cal-day';
            
            const numSpan = document.createElement('span');
            numSpan.textContent = i;
            dayDiv.appendChild(numSpan);

            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            if (eventsByDate[dateString]) {
                const dot = document.createElement('div');
                dot.className = 'event-dot';
                dayDiv.appendChild(dot);
                
                dayDiv.title = eventsByDate[dateString].map(e => e.title).join('\n');
            }

            if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
                dayDiv.classList.add('today');
            }

            if (selectedDate && year === selectedDate.getFullYear() && month === selectedDate.getMonth() && i === selectedDate.getDate()) {
                dayDiv.classList.add('selected');
            }

            dayDiv.addEventListener('click', () => {
                document.querySelectorAll('#p-cal-grid .p-cal-day').forEach(el => el.classList.remove('selected'));
                dayDiv.classList.add('selected');
                selectedDate = new Date(year, month, i);
                
                updateEventsList(dateString);
            });

            calGrid.appendChild(dayDiv);
        }
    }

    fetchCalendarEvents();

    calPrev?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    calNext?.addEventListener('click', (e) => {
        e.stopPropagation();
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });
});


// --- Footer Modals Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const footerLinks = document.querySelectorAll('.footer-modal-link');
  const footerModal = document.getElementById('footerModal');
  const closeFooterModalBtn = document.getElementById('closeFooterModalBtn');
  const okFooterModalBtn = document.getElementById('okFooterModalBtn');
  const footerModalTitle = document.getElementById('footerModalTitle');
  const footerModalContent = document.getElementById('footerModalContent');
  const footerModalIcon = document.getElementById('footerModalIcon');

  const modalData = {
    'support': {
      title: 'Підтримка',
      icon: '<i class="fa-solid fa-headset"></i>',
      content: 'Зв\'яжіться з нашою службою підтримки за адресою <b>support@eventmanager.com</b> або зателефонуйте: <b>+38 (044) 123-45-67</b>. Ми працюємо 24/7!'
    },
    'contacts': {
      title: 'Контакти',
      icon: '<i class="fa-solid fa-address-book"></i>',
      content: 'Головний офіс: м. Київ, вул. Хрещатик, 1.<br><br>Email: info@eventmanager.com<br>Телефон: +38 (044) 765-43-21'
    },
    'privacy': {
      title: 'Приватність & cookies',
      icon: '<i class="fa-solid fa-cookie-bite"></i>',
      content: 'Ми використовуємо cookies для покращення вашого досвіду на нашому сайті. Ваші дані надійно захищені та не передаються третім особам без вашої згоди.'
    },
    'terms': {
      title: 'Політика використання',
      icon: '<i class="fa-solid fa-file-contract"></i>',
      content: 'Використовуючи цей сайт, ви погоджуєтесь з нашими правилами. Заборонено розміщувати неправдиву інформацію про події та порушувати законодавство України.'
    },
    'team': {
      title: 'Про команду',
      icon: '<i class="fa-solid fa-users"></i>',
      content: 'Ми - команда ентузіастів CodeX, які прагнуть зробити процес організації та пошуку подій максимально простим та зручним для кожного.'
    },
    'about': {
      title: 'Про сайт',
      icon: '<i class="fa-solid fa-globe"></i>',
      content: 'Event Manager - це сучасна платформа для пошуку, створення та управління подіями. Знаходьте найцікавіші заходи у вашому місті та плануйте свій час ефективно!'
    }
  };

  if (footerLinks.length > 0 && footerModal) {
    footerLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const modalType = link.getAttribute('data-modal');
        if (modalData[modalType]) {
          footerModalTitle.textContent = modalData[modalType].title;
          footerModalContent.innerHTML = modalData[modalType].content;
          footerModalIcon.innerHTML = modalData[modalType].icon;
          footerModal.style.display = 'flex';
        }
      });
    });

    const closeFooterModal = () => {
      footerModal.style.display = 'none';
    };

    if (closeFooterModalBtn) closeFooterModalBtn.addEventListener('click', closeFooterModal);
    if (okFooterModalBtn) okFooterModalBtn.addEventListener('click', closeFooterModal);

    window.addEventListener('click', (e) => {
      if (e.target === footerModal) {
        closeFooterModal();
      }
    });
  }
});
