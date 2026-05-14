const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SubscriptionService = require('../services/SubscriptionService');
const trialService = require('../services/TrialService');

// Налаштування пошти (для розробки посилання просто виводиться в консоль сервера)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'test_user',
        pass: 'test_pass'
    }
});

// Допоміжна функція: перевірка правильного формату email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ==========================================
// ПАТЕРН: Data Transfer Object (DTO)
// Використовується для безпечної передачі даних користувача клієнту
// без розкриття чутливої інформації (паролі, токени)
// ==========================================
class UserDTO {
    constructor(user) {
        this.id = user.user_id;
        this.username = user.username;
        this.email = user.email;
        this.role = user.role;
        this.created_at = user.created_at;
        // Додатково можна додати поля, якщо вони з'являться (аватар тощо)
    }
}

// ==========================================
// 1. РОУТ РЕЄСТРАЦІЇ (POST /users/register)
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // ВАЛІДАЦІЯ 1: Обов'язкові поля
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Всі поля (username, email, password) є обов'язковими" });
        }

        // ВАЛІДАЦІЯ 2: Правильність email
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "Некоректний формат email адреси" });
        }

        // ВАЛІДАЦІЯ 3: Довжина пароля
        if (password.length < 6) {
            return res.status(400).json({ error: "Пароль має містити щонайменше 6 символів" });
        }

        // ПЕРЕВІРКА НА ДУБЛІКАТ
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2', 
            [email, username]
        );
        
        if (userExists.rows.length > 0) {
            const existingUser = userExists.rows[0];
            if (existingUser.email === email) {
                return res.status(400).json({ error: "Користувач з таким email вже зареєстрований" });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Це ім'я користувача вже зайняте" });
            }
        }

        // ХЕШУВАННЯ ПАРОЛЯ
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // ГЕНЕРАЦІЯ ТОКЕНА АКТИВАЦІЇ
        const activationToken = crypto.randomBytes(32).toString('hex');

        // ЗБЕРЕЖЕННЯ В БАЗУ ДАНИХ
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash, activation_token) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email',
            [username, email, passwordHash, activationToken]
        );

        // АВТОМАТИЧНЕ ПРИЗНАЧЕННЯ ТАРИФУ FREE та Активація Trial-періоду
        let trialInfo = null;
        try {
            await SubscriptionService.assignFreePlan(newUser.rows[0].user_id);
            const trialResult = await trialService.activateTrial(newUser.rows[0].user_id);
            if (trialResult.success) {
                trialInfo = trialResult.trial_info;
            }
        } catch (err) {
            console.error('Помилка призначення тарифу/trial:', err.message);
            // Не блокуємо реєстрацію, якщо підписка не створилась
        }

        const activationLink = `http://localhost:5000/users/activate/${activationToken}`;
        
        // Симуляція відправки листа (виводимо в консоль)
        console.log(`\n=== НОВИЙ КОРИСТУВАЧ ЗАРЕЄСТРОВАНИЙ ===`);
        console.log(`Email: ${email}`);
        console.log(`Посилання для активації: ${activationLink}`);
        console.log(`=========================================\n`);

        res.status(201).json({ 
            message: "Реєстрація успішна! Перевірте консоль сервера для активації акаунта.",
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при реєстрації." });
    }
});

// ==========================================
// 2. РОУТ АКТИВАЦІЇ (GET /users/activate/:token)
// ==========================================
router.get('/activate/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const userResult = await pool.query('SELECT * FROM users WHERE activation_token = $1', [token]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Посилання недійсне або акаунт вже активовано." });
        }

        // Оновлюємо статус на is_active = TRUE
        await pool.query(
            'UPDATE users SET is_active = TRUE, activation_token = NULL WHERE activation_token = $1',
            [token]
        );

        res.send("<h1>Акаунт успішно активовано! 🎉</h1><p>Тепер ви можете увійти в систему.</p>");

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера при активації." });
    }
});



// ==========================================
// 3. ЗАПИТ НА ВІДНОВЛЕННЯ ПАРОЛЯ
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "Користувача з таким email не знайдено." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expireTime = new Date(Date.now() + 3600000); // +1 година

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [resetToken, expireTime, email]
        );

        const resetLink = `http://localhost:5000/users/reset-password/${resetToken}`;
        console.log(`\n=== ВІДНОВЛЕННЯ ПАРОЛЯ ===\nEmail: ${email}\nПосилання: ${resetLink}\n==========================\n`);

        res.json({ message: "Лист з інструкціями відправлено на вашу пошту (перевірте консоль)." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера." });
    }
});


// ==========================================
// 5. ЛОГІН КОРИСТУВАЧА (ВХІД)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Перевіряємо, чи передані дані
        if (!email || !password) {
            return res.status(400).json({ error: "Будь ласка, введіть email та пароль." });
        }

        // 2. Шукаємо користувача в базі
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: "Неправильний email або пароль." });
        }

        const user = userRes.rows[0];

        // 3. Перевіряємо пароль (порівнюємо введений пароль з хешем у базі)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "Неправильний email або пароль." });
        }

        // 4. Записуємо користувача в СЕСІЮ
        req.session.user = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.json({ 
            message: "Вхід успішний!", 
            user: req.session.user 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера при вході." });
    }
});

// ==========================================
// 6. ЛОГАУТ (ВИХІД З СИСТЕМИ)
// ==========================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Помилка при виході з системи." });
        }
        res.clearCookie('connect.sid'); // Видаляємо кукі сесії
        res.json({ message: "Ви успішно вийшли з системи." });
    });
});

// ==========================================
// 7. ОТРИМАННЯ ДАНИХ КОРИСТУВАЧА (GET /users/:id)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // Використовуємо DTO патерн для форматування вихідних даних
        const userDTO = new UserDTO(result.rows[0]);

        res.json(userDTO);
    } catch (err) {
        console.error('Помилка отримання даних користувача:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при отриманні профілю." });
    }
});

// ==========================================
// ПАТЕРН: Builder (Будівельник) для UPDATE запитів
// Дозволяє динамічно формувати запит на оновлення тільки тих полів, які передані
// ==========================================
class UpdateQueryBuilder {
    constructor(tableName, idColumn, idValue) {
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.idValue = idValue;
        this.fields = [];
        this.values = [];
        this.paramIndex = 1;
    }

    set(column, value) {
        if (value !== undefined && value !== null) {
            this.fields.push(`${column} = $${this.paramIndex}`);
            this.values.push(value);
            this.paramIndex++;
        }
        return this;
    }

    build() {
        if (this.fields.length === 0) return null;

        // Додаємо ID як останній параметр
        this.values.push(this.idValue);
        
        const query = `
            UPDATE ${this.tableName}
            SET ${this.fields.join(', ')}
            WHERE ${this.idColumn} = $${this.paramIndex}
            RETURNING user_id, username, email, role, created_at`;
            
        return { text: query, values: this.values };
    }
}

// ==========================================
// 8. ОНОВЛЕННЯ ПРОФІЛЮ КОРИСТУВАЧА (PUT)
// ==========================================
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, role } = req.body;

    // Використовуємо патерн Builder
    const builder = new UpdateQueryBuilder('users', 'user_id', userId)
        .set('username', username)
        .set('email', email)
        .set('role', role);

    const builtQuery = builder.build();

    if (!builtQuery) {
        return res.status(400).json({ error: "Немає даних для оновлення" });
    }

    try {
        const result = await pool.query(builtQuery.text, builtQuery.values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ msg: "Профіль успішно оновлено", user: result.rows[0] });
    } catch (err) {
        console.error('Помилка при оновленні профілю:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при оновленні профілю" });
    }
});

// ==========================================
// 9. ОНОВЛЕННЯ СТАТУСУ ДО PRO (POST /users/upgrade)
// ==========================================
router.post('/upgrade', async (req, res) => {
    try {
        // У реальному проекті тут була б перевірка сесії або токена
        const userId = req.session.user ? req.session.user.id : req.body.userId;

        if (!userId) {
            return res.status(401).json({ error: "Ви повинні бути авторизовані" });
        }

        const result = await pool.query(
            "UPDATE users SET role = 'pro' WHERE user_id = $1 RETURNING user_id, username, email, role",
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // Оновлюємо дані в сесії, якщо вона є
        if (req.session.user) {
            req.session.user.role = 'pro';
        }

        res.json({ 
            message: "Вітаємо! Ваш статус оновлено до Pro.", 
            user: result.rows[0] 
        });

    } catch (err) {
        console.error('Помилка при оновленні статусу:', err.message);
        res.status(500).json({ error: "Помилка сервера при оновленні статусу" });
    }
});


// ==========================================
// 10. СТАТУС TRIAL-ПЕРІОДУ (GET /users/:id/trial)
// ==========================================
router.get('/:id/trial', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const status = await trialService.checkTrialStatus(parseInt(userId));

        if (status.error) {
            return res.status(404).json({ error: status.error });
        }

        res.json({
            status: 'success',
            data: status
        });
    } catch (err) {
        console.error('Помилка перевірки trial-статусу:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// ==========================================
// 11. АКТИВАЦІЯ TRIAL-ПЕРІОДУ (POST /users/:id/trial/activate)
// Для юзерів, які зареєструвалися до впровадження trial
// ==========================================
router.post('/:id/trial/activate', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        // Перевіряємо, що юзер не Pro (Pro не потребує trial)
        const userResult = await pool.query(
            'SELECT role, trial_start FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const user = userResult.rows[0];

        if (user.role === 'pro') {
            return res.status(400).json({ error: 'Ви вже маєте Pro підписку. Trial не потрібен.' });
        }

        if (user.trial_start) {
            return res.status(400).json({ error: 'Trial-період вже було активовано для цього акаунта.' });
        }

        const result = await trialService.activateTrial(parseInt(userId));

        if (!result.success) {
            return res.status(400).json({ error: result.reason });
        }

        res.json({
            status: 'success',
            message: `Trial-період активовано на ${trialService.TRIAL_DURATION_DAYS} днів!`,
            data: result
        });
    } catch (err) {
        console.error('Помилка активації trial:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// ==========================================
// 12. ПЕРЕВІРКА ЛІМІТУ СТВОРЕННЯ ПОДІЙ (GET /users/:id/can-create-event)
// ==========================================
router.get('/:id/can-create-event', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const result = await trialService.canCreateEvent(parseInt(userId));
        res.json({
            status: 'success',
            data: result
        });
    } catch (err) {
        console.error('Помилка перевірки ліміту:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

module.exports = router;
