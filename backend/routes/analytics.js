const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. Log a view (Basic Analytics)
router.post('/view', async (req, res) => {
    const { event_id, utm_source, utm_medium, utm_campaign } = req.body;
    
    if (!event_id) return res.status(400).json({ error: "event_id is required" });

    try {
        await pool.query(
            'INSERT INTO event_views (event_id, utm_source, utm_medium, utm_campaign) VALUES ($1, $2, $3, $4)',
            [event_id, utm_source || 'direct', utm_medium || null, utm_campaign || null]
        );
        res.status(200).json({ msg: "View logged" });
    } catch (err) {
        console.error('Error logging view:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// 2. Get Summary Stats (Basic Analytics)
router.get('/:event_id/summary', async (req, res) => {
    const eventId = req.params.event_id;

    try {
        const viewsRes = await pool.query('SELECT COUNT(*) FROM event_views WHERE event_id = $1', [eventId]);
        const salesRes = await pool.query(
            `SELECT 
                COUNT(*) as tickets_sold, 
                SUM(paid_amount) as total_revenue 
             FROM event_participants 
             WHERE event_id = $1 AND status = 'going'`,
            [eventId]
        );

        res.json({
            views: parseInt(viewsRes.rows[0].count),
            tickets: parseInt(salesRes.rows[0].tickets_sold || 0),
            revenue: parseFloat(salesRes.rows[0].total_revenue || 0)
        });
    } catch (err) {
        console.error('Error fetching summary:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// 3. Get Detailed Stats (Pro+ Analytics)
router.get('/:event_id/detailed', async (req, res) => {
    const eventId = req.params.event_id;
    const { user_id } = req.query;

    try {
        const userRes = await pool.query('SELECT role FROM users WHERE user_id = $1', [user_id]);
        if (userRes.rows.length === 0 || userRes.rows[0].role !== 'pro_plus') {
            return res.status(403).json({ error: "Доступно лише в тарифі Pro+" });
        }

        const dailySales = await pool.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count, SUM(paid_amount) as amount 
             FROM event_participants 
             WHERE event_id = $1 AND status = 'going'
             GROUP BY DATE(created_at) ORDER BY date ASC`,
            [eventId]
        );

        const utmStats = await pool.query(
            `SELECT utm_source, COUNT(*) as count 
             FROM event_views 
             WHERE event_id = $1 
             GROUP BY utm_source ORDER BY count DESC`,
            [eventId]
        );

        res.json({
            daily_sales: dailySales.rows,
            utm_stats: utmStats.rows
        });
    } catch (err) {
        console.error('Error fetching detailed stats:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
