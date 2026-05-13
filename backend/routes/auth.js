const express = require('express');
const router = express.Router();
const pool = require('../db');
const { OAuth2Client } = require('google-auth-library');

// ==========================================
// ПАТЕРН: Singleton
// Створюємо єдиний екземпляр OAuth2Client
// ==========================================
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
// Авторизація через Google
router.post('/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: "Токен обов'язковий" });
    }

    try {
        // 1. Верифікація токена через Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: google_id, email, name: username } = payload;

        // 2. Шукаємо користувача в БД за google_id або email
        let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);
        
        let user;

        if (result.rows.length > 0) {
            user = result.rows[0];
            
            // ПАТЕРН: Adapter / Фасад - Якщо користувач реєструвався раніше через email, додаємо йому google_id
            if (!user.google_id) {
                await pool.query('UPDATE users SET google_id = $1 WHERE user_id = $2', [google_id, user.user_id]);
                user.google_id = google_id;
            }
        } else {
            // 3. Якщо користувача немає, створюємо нового
            const insertResult = await pool.query(
                'INSERT INTO users (username, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING *',
                [username, email, google_id, 'user']
            );
            user = insertResult.rows[0];
        }

        // 4. Зберігаємо сесію
        if (req.session) {
            req.session.userId = user.user_id;
            req.session.role = user.role;
        }

        res.status(200).json({
            message: "Авторизація успішна",
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Помилка Google Авторизації:', error);
        res.status(401).json({ error: "Недійсний токен або помилка сервера" });
    }
});

module.exports = router;
