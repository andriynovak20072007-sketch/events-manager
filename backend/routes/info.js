const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Logger Singleton
// ==========================================
const logger = require('../utils/Logger');

// ==========================================
// GET /info - Отримання загальної статистики платформи
// ПАТЕРН: Aggregate Query — один запит замість п'яти окремих
// Раніше робилось 5 послідовних SELECT COUNT(*), тепер все в одному запиті
// ==========================================
router.get('/', asyncHandler(async (req, res) => {
    // ПАТЕРН: Aggregate Query — збираємо всю статистику одним запитом
    const aggregateQuery = `
        SELECT 
            (SELECT COUNT(*) FROM events) AS total_events,
            (SELECT COUNT(*) FROM users) AS total_users,
            (SELECT COUNT(*) FROM categories) AS total_categories,
            (SELECT COUNT(*) FROM comments) AS total_comments,
            (SELECT COUNT(*) FROM event_participants) AS total_registrations
    `;

    const result = await pool.query(aggregateQuery);
    const stats = result.rows[0];

    const platformStats = {
        totalEvents: parseInt(stats.total_events),
        totalUsers: parseInt(stats.total_users),
        totalCategories: parseInt(stats.total_categories),
        totalComments: parseInt(stats.total_comments),
        totalRegistrations: parseInt(stats.total_registrations),
        status: "Event Manager API is running smoothly 🚀"
    };

    res.status(200).json({
        status: "success",
        data: platformStats
    });
}));

module.exports = router;