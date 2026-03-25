const pool = require('../db');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // 1. Шифруємо пароль (10 — це "солоність" шифрування)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Зберігаємо в базу
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [username, email, hashedPassword]
        );

        res.status(201).json({ 
            message: "Користувач успішно зареєстрований!",
            user: { id: newUser.rows[0].user_id, username: newUser.rows[0].username }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Помилка сервера при реєстрації");
    }
};

module.exports = { registerUser };
