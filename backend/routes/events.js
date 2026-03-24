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

// 2. СТВОРЕННЯ НОВОЇ ПОДІЇ (POST)
router.post('/', async (req, res) => {
    const { 
        title, 
        description, 
        event_day, 
        start_time, 
        end_time, 
        latitude, 
        longitude, 
        category_id, 
        creator_id 
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

    try {
        const query = `
            INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`;
        
        const values = [title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні події в базі даних" });
    }
});

module.exports = router;
