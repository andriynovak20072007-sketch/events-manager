const express = require('express');
const router = express.Router();
const pool = require('../db');

// =======================================================
// POST /api/routes - Створення нового маршруту
// =======================================================
router.post('/', async (req, res) => {
    const { route_name, creator_id, event_ids } = req.body;

    // 1. Валідація
    if (!route_name || !creator_id || !event_ids || !Array.isArray(event_ids)) {
        return res.status(400).json({ error: "Неповні дані для створення маршруту" });
    }

    const client = await pool.connect(); // Беремо клієнта для транзакції

    try {
        await client.query('BEGIN'); // Початок транзакції

        // 2. Вставляємо заголовок маршруту
        const routeResult = await client.query(
            'INSERT INTO routes (route_name, creator_id) VALUES ($1, $2) RETURNING route_id',
            [route_name, creator_id]
        );
        const routeId = routeResult.rows[0].route_id;

        // 3. Вставляємо всі події маршруту по черзі (зберігаючи порядок)
        const insertEventQuery = `
            INSERT INTO route_events (route_id, event_id, order_index) 
            VALUES ($1, $2, $3)
        `;

        for (let i = 0; i < event_ids.length; i++) {
            // i + 1 — це наш порядок (1-ша подія, 2-га і т.д.)
            await client.query(insertEventQuery, [routeId, event_ids[i], i + 1]);
        }

        await client.query('COMMIT'); // Фіксуємо зміни в базі

        res.status(201).json({ 
            message: "Маршрут успішно створено", 
            route_id: routeId 
        });

    } catch (err) {
        await client.query('ROLLBACK'); // Якщо хоч одна помилка — скасовуємо все
        console.error('Помилка створення маршруту:', err.message);
        res.status(500).json({ error: "Не вдалося створити маршрут" });
    } finally {
        client.release(); // Повертаємо клієнта в пул
    }
});

module.exports = router;