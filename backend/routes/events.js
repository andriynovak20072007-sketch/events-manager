const express = require('express');
const router = express.Router();
const pool = require('../db'); // Твоє підключення до бази PostgreSQL

// =======================================================
// GET /events - Отримання всіх подій + фільтр по регіону
// =======================================================
router.get('/', async (req, res) => {
    try {
        const { region } = req.query; 

        // Базовий запит
        let queryText = 'SELECT * FROM events';
        let queryParams = [];

        // Якщо клієнт передав ?region=..., додаємо фільтрацію
        if (region) {
            queryText += ' WHERE region = $1';
            queryParams.push(region);
        }

        // Виконуємо запит до БД
        const result = await pool.query(queryText, queryParams);
        
        // Відправляємо масив подій на фронтенд
        res.json(result.rows);

    } catch (err) {
        console.error('Помилка отримання подій:', err.message);
        res.status(500).send("Server error");
    }
});

// =======================================================
// GET /events/:id - Отримання однієї події за ID
// =======================================================
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Подію не знайдено" });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Помилка отримання події за ID:', err.message);
        res.status(500).send("Server error");
    }
});

// Експорт роутера МАЄ БУТИ В САМОМУ КІНЦІ ФАЙЛУ
module.exports = router;