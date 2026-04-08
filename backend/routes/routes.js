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
});

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
});

// =======================================================
// 3. PUT /api/routes/:id - Оновлення існуючого маршруту
// =======================================================
router.put('/:id', async (req, res) => {
    const { id } = req.params; // ID маршруту з URL
    const { route_name, creator_id, event_ids } = req.body;

    // Базова валідація
    if (!route_name || !creator_id || !event_ids || !Array.isArray(event_ids)) {
        return res.status(400).json({ error: "Неповні дані для оновлення маршруту" });
    }

    const client = await pool.connect(); // Знову беремо клієнта для транзакції

    try {
        await client.query('BEGIN');

        // Оновлюємо заголовок маршруту + ПЕРЕВІРКА БЕЗПЕКИ
        // Ми перевіряємо creator_id, щоб ніхто не міг змінити чужий маршрут
        const updateRouteQuery = `
            UPDATE routes 
            SET route_name = $1 
            WHERE route_id = $2 AND creator_id = $3 
            RETURNING *`;
        const routeResult = await client.query(updateRouteQuery, [route_name, id, creator_id]);

        // Якщо маршрут не знайшовся або юзер не його власник — скасовуємо все
        if (routeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: "Маршрут не знайдено або у вас немає прав на його зміну" });
        }

        // =====================================================================
        // 🚀 ПАТЕРН: "CLEAR AND REPLACE" (Delete-and-Replace)
        // Замість складного вираховування різниці між старими та новими точками,
        // ми в рамках транзакції очищаємо старий список і записуємо новий.
        // Це гарантує відсутність багів із дублюванням або зміщенням індексів.
        // =====================================================================

        // --> КРОК 1: CLEAR (Очищення)
        // Видаляємо СТАРІ точки маршруту
        await client.query('DELETE FROM route_events WHERE route_id = $1', [id]);

        // --> КРОК 2: REPLACE (Заміна/Перезапис)
        // Записуємо НОВІ точки маршруту з новим порядком
        const insertEventQuery = `
            INSERT INTO route_events (route_id, event_id, order_index) 
            VALUES ($1, $2, $3)
        `;

        for (let i = 0; i < event_ids.length; i++) {
            await client.query(insertEventQuery, [id, event_ids[i], i + 1]);
        }
        
        // =====================================================================
        // КІНЕЦЬ ПАТЕРНУ
        // =====================================================================

        await client.query('COMMIT'); // Фіксуємо зміни

        res.json({ message: "Маршрут успішно оновлено" });

    } catch (err) {
        await client.query('ROLLBACK'); // Відкат у разі помилки
        console.error('Помилка оновлення маршруту:', err.message);
        res.status(500).json({ error: "Не вдалося оновити маршрут" });
    } finally {
        client.release();
    }
});

module.exports = router;