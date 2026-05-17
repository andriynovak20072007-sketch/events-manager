const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/Logger');

// =======================================================
// 1. POST /api/routes - Створення нового маршруту
// =======================================================
router.post('/', asyncHandler(async (req, res) => {
    const { route_name, creator_id, event_ids } = req.body;

    if (!route_name || !creator_id || !event_ids || !Array.isArray(event_ids)) {
        throw AppError.badRequest("Неповні дані для створення маршруту");
    }

    const client = await pool.connect(); 

    try {
        await client.query('BEGIN');

        const routeResult = await client.query(
            'INSERT INTO routes (route_name, creator_id) VALUES ($1, $2) RETURNING route_id',
            [route_name, creator_id]
        );
        const routeId = routeResult.rows[0].route_id;

        const insertEventQuery = `
            INSERT INTO route_events (route_id, event_id, order_index) 
            VALUES ($1, $2, $3)
        `;

        for (let i = 0; i < event_ids.length; i++) {
            await client.query(insertEventQuery, [routeId, event_ids[i], i + 1]);
        }

        await client.query('COMMIT'); 

        logger.info('ROUTES', `Маршрут "${route_name}" створено (ID: ${routeId})`);

        res.status(201).json({ 
            message: "Маршрут успішно створено", 
            route_id: routeId 
        });

    } catch (err) {
        await client.query('ROLLBACK'); 
        throw AppError.internal("Не вдалося створити маршрут");
    } finally {
        client.release(); 
    }
}));

// =======================================================
// 2. GET /api/routes/:id - Отримання конкретного маршруту
// =======================================================
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

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

    let result;
    try {
        result = await pool.query(query, [id]);
    } catch (err) {
        throw AppError.internal("Помилка сервера при завантаженні маршруту");
    }

    if (result.rows.length === 0) {
        throw AppError.notFound("Маршрут не знайдено або він порожній");
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
}));

// =======================================================
// 3. PUT /api/routes/:id - Оновлення існуючого маршруту
// ПАТЕРН: "CLEAR AND REPLACE" (Delete-and-Replace)
// =======================================================
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { route_name, creator_id, event_ids } = req.body;

    if (!route_name || !creator_id || !event_ids || !Array.isArray(event_ids)) {
        throw AppError.badRequest("Неповні дані для оновлення маршруту");
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const updateRouteQuery = `
            UPDATE routes 
            SET route_name = $1 
            WHERE route_id = $2 AND creator_id = $3 
            RETURNING *`;
        const routeResult = await client.query(updateRouteQuery, [route_name, id, creator_id]);

        if (routeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            throw AppError.forbidden("Маршрут не знайдено або у вас немає прав на його зміну");
        }

        // ПАТЕРН: "CLEAR AND REPLACE"
        // КРОК 1: CLEAR
        await client.query('DELETE FROM route_events WHERE route_id = $1', [id]);

        // КРОК 2: REPLACE
        const insertEventQuery = `
            INSERT INTO route_events (route_id, event_id, order_index) 
            VALUES ($1, $2, $3)
        `;

        for (let i = 0; i < event_ids.length; i++) {
            await client.query(insertEventQuery, [id, event_ids[i], i + 1]);
        }

        await client.query('COMMIT');

        logger.info('ROUTES', `Маршрут ${id} оновлено`);
        res.json({ message: "Маршрут успішно оновлено" });

    } catch (err) {
        await client.query('ROLLBACK');
        if (err.isOperational) throw err;
        throw AppError.internal("Не вдалося оновити маршрут");
    } finally {
        client.release();
    }
}));

module.exports = router;