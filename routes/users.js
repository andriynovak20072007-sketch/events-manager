const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
// 8. ОНОВЛЕННЯ ТАРИФУ (UPGRADE TO PRO+)
// ==========================================
router.post('/upgrade', async (req, res) => {
    try {
        const userId = req.session.user ? req.session.user.id : null;
        
        // В демо-режимі, якщо сесії немає, ми все одно повертаємо успіх для фронтенду,
        // щоб localStorage міг оновитися.
        if (userId) {
            await pool.query('UPDATE users SET role = $1 WHERE user_id = $2', ['pro_plus', userId]);
            req.session.user.role = 'pro_plus';
        }

        res.json({ message: "Акаунт успішно оновлено до PRO+! 🎉" });
    } catch (err) {
        console.error('Помилка оновлення тарифу:', err.message);
        res.status(500).json({ error: "Помилка сервера при оновленні тарифу." });
    }
});

module.exports = router;