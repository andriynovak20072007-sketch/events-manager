const express = require('express');
const router = express.Router();
const pool = require('../db');

<<<<<<< HEAD
// 1. ОТРИМАННЯ ВСІХ ПОДІЙ (GET)
router.get('/', async (req, res) => {
    try {
        // Додаємо сортування за датою створення, щоб нові були зверху
        const result = await pool.query('SELECT * FROM events ORDER BY created_at DESC');
=======
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events');
>>>>>>> d2db084073ceef8e6bf0579440d0a59080e0f750
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

<<<<<<< HEAD
// 2. СТВОРЕННЯ НОВОЇ ПОДІЇ (POST) — Додай це сюди!
router.post('/', async (req, res) => {
    const { title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id } = req.body;

    // --- ВАЛІДАЦІЯ (Твій таск!) ---
    if (!title || title.trim().length < 5) {
        return res.status(400).json({ error: "Назва занадто коротка (мін. 5 симв.)" });
    }
    if (!description || description.trim().length < 10) {
        return res.status(400).json({ error: "Опис має бути не менше 10 символів" });
    }
    if (!event_day || !start_time || !end_time) {
        return res.status(400).json({ error: "Дата та час обов'язкові" });
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
        res.status(500).json({ error: "Помилка при створенні події" });
    }
});

=======
>>>>>>> d2db084073ceef8e6bf0579440d0a59080e0f750
module.exports = router;
