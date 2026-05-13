const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /info - Отримання загальної статистики платформи
router.get('/', async (req, res) => {
    try {
        const eventsCount = await pool.query('SELECT COUNT(*) FROM events');
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories');
        const commentsCount = await pool.query('SELECT COUNT(*) FROM comments');
        const participantsCount = await pool.query('SELECT COUNT(*) FROM event_participants');

        const platformStats = {
            totalEvents: parseInt(eventsCount.rows[0].count),
            totalUsers: parseInt(usersCount.rows[0].count),
            totalCategories: parseInt(categoriesCount.rows[0].count),
            totalComments: parseInt(commentsCount.rows[0].count),
            totalRegistrations: parseInt(participantsCount.rows[0].count),
            status: "Event Manager API is running smoothly 🚀"
        };

        res.status(200).json({
            status: "success",
            data: platformStats
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера при отриманні статистики" });
    }
});

module.exports = router;