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
  toggleUserPanel(); // Спочатку ховаємо бічну панель
  
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
        client_id: 'YOUR_GOOGLE_CLIENT_ID', // ЗАМІНИТИ НА РЕАЛЬНИЙ КЛІЄНТ ID
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
            alert("Вхід успішний!");
            localStorage.setItem('user', JSON.stringify(data.user));
            const authModal = document.getElementById("authModal");
            if (authModal) authModal.style.display = "none";
            window.dispatchEvent(new Event('userLoginStateChanged'));
        } else {
            alert("Помилка входу: " + (data.error || "Невідома помилка"));
        }
    } catch (err) {
        console.error("Google Auth error:", err);
        alert("Помилка з'єднання з сервером.");
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

