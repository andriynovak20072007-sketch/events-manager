const express = require('express');
const router = express.Router();
const pool = require('../db');

// =======================================================
// 1. POST /api/routes - Створення нового маршруту
// =======================================================
router.post('/', async (req, res) => {
    const { route_name, creator_id, event_ids } = req.body;

    // Валідація
    if (!route_name || !creator_id || !event_ids || !Array.isArray(event_ids)) {
        return res.status(400).json({ error: "Неповні дані для створення маршруту" });
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN'); // Початок транзакції

        // Вставляємо заголовок маршруту
        const routeResult = await client.query(
            'INSERT INTO routes (route_name, creator_id) VALUES ($1, $2) RETURNING route_id',
            [route_name, creator_id]
        );
        const routeId = routeResult.rows[0].route_id;

        // Вставляємо всі події маршруту по порядку
        const insertEventQuery = `
            INSERT INTO route_events (route_id, event_id, order_index) 
            VALUES ($1, $2, $3)
        `;

        for (let i = 0; i < event_ids.length; i++) {
            await client.query(insertEventQuery, [routeId, event_ids[i], i + 1]);
        }

        await client.query('COMMIT'); 

        res.status(201).json({ 
            message: "Маршрут успішно створено", 
            route_id: routeId 
        });

    } catch (err) {
        await client.query('ROLLBACK'); 
        console.error('Помилка створення маршруту:', err.message);
        res.status(500).json({ error: "Не вдалося створити маршрут" });
    } finally {
        client.release(); 
    }
}); // <--- Крок 1 закінчився тут

// =======================================================
// 2. GET /api/routes/:id - Отримання конкретного маршруту
// =======================================================
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const query = `
            SELECT 
                r.route_name,
                re.order_index,
                e.event_id,
                e.title,
                e.latitude,
                e.longitude,
                e.event_day,
                e.start_time
            FROM routes r
            JOIN route_events re ON r.route_id = re.route_id
            JOIN events e ON re.event_id = e.event_id
            WHERE r.route_id = $1
            ORDER BY re.order_index ASC
        `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Маршрут не знайдено або він порожній" });
        }

        const routeData = {
            name: result.rows[0].route_name,
            waypoints: result.rows.map(row => ({
                event_id: row.event_id,
                title: row.title,
                lat: parseFloat(row.latitude),
                lng: parseFloat(row.longitude),
                order: row.order_index
            }))
        };

        res.json(routeData);

    } catch (err) {
        console.error('Помилка при отриманні маршруту:', err.message);
        res.status(500).json({ error: "Помилка сервера при завантаженні маршруту" });
    }
}); // <--- Крок 2 закінчився тут

module.exports = router;