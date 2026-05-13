const pool = require('../db');

const analyticsController = {
    // Ініціалізація таблиць (якщо вони не існують)
    initDB: async () => {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS event_views (
                    id SERIAL PRIMARY KEY,
                    event_id INTEGER NOT NULL,
                    utm_source TEXT,
                    utm_medium TEXT,
                    utm_campaign TEXT,
                    ip_address TEXT,
                    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE IF NOT EXISTS tickets (
                    id SERIAL PRIMARY KEY,
                    event_id INTEGER NOT NULL,
                    user_id INTEGER,
                    price DECIMAL(10,2) NOT NULL,
                    currency TEXT DEFAULT 'UAH',
                    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Analytics tables checked/created');
        } catch (err) {
            console.error('DB Init Error:', err.message);
        }
    },

    // Реєстрація продажу квитка
    recordSale: async (req, res) => {
        const { eventId } = req.params;
        const { user_id, price, currency } = req.body;

        try {
            await pool.query(
                'INSERT INTO tickets (event_id, user_id, price, currency) VALUES ($1, $2, $3, $4)',
                [eventId, user_id || null, price || 0, currency || 'UAH']
            );
            res.status(200).json({ msg: 'Sale recorded' });
        } catch (err) {
            console.error('Error recording sale:', err.message);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Реєстрація перегляду події
    recordView: async (req, res) => {
        const { eventId } = req.params;
        const { utm_source, utm_medium, utm_campaign } = req.body;
        const ip_address = req.ip;

        try {
            await pool.query(
                'INSERT INTO event_views (event_id, utm_source, utm_medium, utm_campaign, ip_address) VALUES ($1, $2, $3, $4, $5)',
                [eventId, utm_source || null, utm_medium || null, utm_campaign || null, ip_address]
            );
            res.status(200).json({ msg: 'View recorded' });
        } catch (err) {
            console.error('Error recording view:', err.message);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Базова статистика (Безкоштовно)
    getEventSummary: async (req, res) => {
        const { eventId } = req.params;

        try {
            // Кількість переглядів
            const viewsRes = await pool.query('SELECT COUNT(*) FROM event_views WHERE event_id = $1', [eventId]);
            
            // Кількість проданих квитків та дохід
            const ticketsRes = await pool.query(
                'SELECT COUNT(*) as total_tickets, SUM(price) as total_revenue FROM tickets WHERE event_id = $1',
                [eventId]
            );

            res.json({
                views: parseInt(viewsRes.rows[0].count),
                tickets: parseInt(ticketsRes.rows[0].total_tickets) || 0,
                revenue: parseFloat(ticketsRes.rows[0].total_revenue) || 0
            });
        } catch (err) {
            console.error('Error getting event summary:', err.message);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Розширена статистика (Pro+)
    getEventDetailed: async (req, res) => {
        const { eventId } = req.params;
        const { user_id } = req.query;

        try {
            // Продажі по днях (останні 30 днів)
            const salesRes = await pool.query(`
                SELECT DATE(purchased_at) as date, SUM(price) as amount, COUNT(*) as count
                FROM tickets
                WHERE event_id = $1 AND purchased_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE(purchased_at)
                ORDER BY DATE(purchased_at)
            `, [eventId]);

            // Джерела трафіку (UTM)
            const utmRes = await pool.query(`
                SELECT COALESCE(utm_source, 'Direct') as utm_source, COUNT(*) as count
                FROM event_views
                WHERE event_id = $1
                GROUP BY utm_source
                ORDER BY count DESC
            `, [eventId]);

            res.json({
                daily_sales: salesRes.rows,
                utm_stats: utmRes.rows
            });
        } catch (err) {
            console.error('Error getting detailed stats:', err.message);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = analyticsController;
