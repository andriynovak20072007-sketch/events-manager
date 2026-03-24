const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. ОТРИМАННЯ ВСІХ ПОДІЙ (GET)
router.get('/', async (req, res) => {
    try {
        // Отримуємо всі події, сортуємо так, щоб нові були зверху
        const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// ==========================================
// НОВЕ: ЛОГІКА СПІВСТАВЛЕННЯ З ОБЛАСТЯМИ
// ==========================================
// Виклик з фронтенду: /api/events/filter?region=Львівська
router.get('/filter', async (req, res) => {
    const { region } = req.query;
    try {
        // Шукаємо події тільки в цій області і ТІЛЬКИ ПУБЛІЧНІ (щоб не засмічувати карту приватними)
        const result = await pool.query(
            'SELECT * FROM events WHERE region = $1 AND is_private = FALSE ORDER BY event_day ASC', 
            [region]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка фільтрації за областю");
    }
});

// ==========================================
// НОВЕ: ЛОГІКА МАРШРУТІВ (Точки А, Б, С)
// ==========================================
// Виклик з фронтенду: /api/events/route-data?ids=1,5,12
router.get('/route-data', async (req, res) => {
    const { ids } = req.query; // Отримуємо список ID подій через кому
    if (!ids) return res.status(400).send("Не вказано ID подій для маршруту");
    
    // Перетворюємо рядок "1,5,12" на масив чисел [1, 5, 12]
    const idArray = ids.split(',').map(Number);
    try {
        // Витягуємо тільки точні координати для побудови лінії маршруту
        const result = await pool.query(
            'SELECT event_id, title, latitude, longitude FROM events WHERE event_id = ANY($1)',
            [idArray]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка підготовки даних маршруту");
    }
});

// 2. СТВОРЕННЯ НОВОЇ ПОДІЇ (POST) — ОНОВЛЕНО
router.post('/', async (req, res) => {
    // ДОДАНО: region та is_private
    const { 
        title, 
        description, 
        event_day, 
        start_time, 
        end_time, 
        latitude, 
        longitude, 
        category_id, 
        creator_id,
        region,         
        is_private      
    } = req.body;

    // --- ВАЛІДАЦІЯ ---
    if (!title || title.trim().length < 5) {
        return res.status(400).json({ error: "Назва занадто коротка (мін. 5 симв.)" });
    }
    if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: "Опис має бути не менше 10 символів" });
    }
    if (!event_day || !start_time || !end_time) {
        return res.status(400).json({ error: "Дата та час обов'язкові" });
    }
    if (!creator_id) {
        return res.status(400).json({ error: "Не вказано ID творця події" });
    }
    if (!region) {
        return res.status(400).json({ error: "Обов'язково вкажіть область (region)" });
    }

    try {
        // ДОДАНО: поля region та is_private у запит до бази
        const query = `
            INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
            RETURNING *`;
        
        // Якщо is_private не передали, за замовчуванням робимо подію приватною (true)
        const eventIsPrivate = is_private !== undefined ? is_private : true;
        
        const values = [title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, eventIsPrivate];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні події в базі даних" });
    }
});

module.exports = router;
