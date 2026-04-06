const express = require('express');
const router = express.Router();
const pool = require('../db');

// =======================================================
// 1. GET /api/favorites/:user_id - Отримання списку обраних подій
// =======================================================
router.get('/:user_id', async (req, res) => {
    const { user_id } = req.params;

    try {
        // Використовуємо INNER JOIN, щоб об'єднати таблиці
        // Беремо всі поля події (e.*) та ID самої "вподобайки" (f.favorite_id)
        const query = `
            SELECT e.*, f.favorite_id 
            FROM events e
            INNER JOIN favorites f ON e.event_id = f.event_id
            WHERE f.user_id = $1
            ORDER BY f.favorite_id DESC
        `;
        
        const result = await pool.query(query, [user_id]);
        
        // Якщо обраних подій немає, повертаємо порожній масив (це нормально для фронтенду)
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка отримання обраних подій:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// =======================================================
// 2. POST /api/favorites - Додати подію в обране
// =======================================================
router.post('/', async (req, res) => {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
        return res.status(400).json({ error: "Не вказано user_id або event_id" });
    }

    try {
        // Перевіряємо, чи вже є така подія в обраному (захист від дублікатів)
        const checkQuery = 'SELECT * FROM favorites WHERE user_id = $1 AND event_id = $2';
        const checkResult = await pool.query(checkQuery, [user_id, event_id]);

        if (checkResult.rows.length > 0) {
            return res.status(400).json({ error: "Ця подія вже є в обраному" });
        }

        // Додаємо в базу
        const insertQuery = `
            INSERT INTO favorites (user_id, event_id) 
            VALUES ($1, $2) 
            RETURNING *`;
        const result = await pool.query(insertQuery, [user_id, event_id]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Помилка додавання в обране:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

// =======================================================
// 3. DELETE /api/favorites/:user_id/:event_id - Видалити з обраного
// =======================================================
router.delete('/:user_id/:event_id', async (req, res) => {
    // Отримуємо параметри прямо з URL
    const { user_id, event_id } = req.params;

    try {
        // Використовуємо RETURNING *, щоб перевірити, чи дійсно щось видалилося за один запит
        const deleteQuery = `
            DELETE FROM favorites 
            WHERE user_id = $1 AND event_id = $2 
            RETURNING *`;
            
        const result = await pool.query(deleteQuery, [user_id, event_id]);

        // Перевіряємо, чи існував такий запис взагалі
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Цієї події немає в обраному" });
        }

        res.json({ 
            message: "Подію успішно видалено з обраного",
            deleted_record: result.rows[0] 
        });
    } catch (err) {
        console.error('Помилка видалення з обраного:', err.message);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;