const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Observer (реалізація API для підписників)
// Дозволяє отримувати, читати та видаляти сповіщення
// ==========================================

// 1. Отримати всі сповіщення для конкретного користувача (GET /api/notifications/:userId)
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка отримання сповіщень:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 2. Відмітити сповіщення як прочитане (PUT /api/notifications/:id/read)
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *',
            [notificationId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Сповіщення не знайдено" });
        }
        
        res.json({ message: "Сповіщення прочитано", notification: result.rows[0] });
    } catch (err) {
        console.error('Помилка оновлення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 3. Видалити сповіщення (DELETE /api/notifications/:id)
router.delete('/:id', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await pool.query(
            'DELETE FROM notifications WHERE notification_id = $1 RETURNING *',
            [notificationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Сповіщення не знайдено" });
        }

        res.json({ message: "Сповіщення видалено" });
    } catch (err) {
        console.error('Помилка видалення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 4. ПАТЕРН: Factory (Створення нового сповіщення)
// POST /api/notifications
router.post('/', async (req, res) => {
    const { user_id, type, message, related_id } = req.body;

    if (!user_id || !type || !message) {
        return res.status(400).json({ error: "Недостатньо даних для створення сповіщення" });
    }

    try {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, type, message, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, type, message, related_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Помилка створення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

module.exports = router;
