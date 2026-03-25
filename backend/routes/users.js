const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt'); // Для шифрування паролів

// 1. Отримати всіх користувачів (це у тебе вже було)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, username, email, role FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// 2. РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Шифруємо пароль перед збереженням
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Вставляємо в базу (таблиця users)
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [username, email, hashedPassword]
        );

        res.status(201).json({
            message: "Користувач створений!",
            user: {
                id: newUser.rows[0].user_id,
                username: newUser.rows[0].username
            }
        });
    } catch (err) {
        console.error(err.message);
        // Якщо такий email або username вже є (UNIQUE constraint)
        if (err.code === '23505') {
            return res.status(400).json({ message: "Користувач з таким email або логіном вже існує" });
        }
        res.status(500).send("Помилка сервера при реєстрації");
    }
});

module.exports = router;
