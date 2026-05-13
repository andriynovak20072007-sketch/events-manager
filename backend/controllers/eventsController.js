const pool = require('../db'); // Підключення до твоєї бази даних

const createEvent = async (req, res) => {
    try {
        // 1. ВИТЯГУЄМО ДАНІ З ЗАПИТУ (Request Body)
        // Тут ми додаємо наші нові поля: event_day, start_time, end_time
        const { 
            title, 
            description, 
            event_day,    // НОВЕ
            start_time,   // НОВЕ
            end_time,     // НОВЕ
            latitude, 
            longitude, 
            category_id, 
            creator_id 
        } = req.body;

        // 2. ВАЛІДАЦІЯ (Перевірка перед записом в базу)
        if (!title || title.trim().length < 5) {
            return res.status(400).json({ error: "Назва занадто коротка (мін. 5 симв.)" });
        }
        if (!event_day || !start_time || !end_time) {
            return res.status(400).json({ error: "Дата та час обов'язкові" });
        }
        if (start_time >= end_time) {
            return res.status(400).json({ error: "Час початку не може бути пізнішим за час кінця" });
        }

        // 3. ЗАПИТ ДО БАЗИ ДАНИХ (SQL Query)
        // ВАЖЛИВО: Кількість колонок має збігатися з кількістю $1, $2...
        const query = `
            INSERT INTO events (
                title, description, event_day, start_time, end_time, 
                latitude, longitude, category_id, creator_id
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`;

        const values = [
            title, description, event_day, start_time, end_time, 
            latitude, longitude, category_id, creator_id
        ];

        const newEvent = await pool.query(query, values);

        // 4. ВІДПОВІДЬ КЛІЄНТУ
        res.status(201).json(newEvent.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера при створенні події" });
    }
};

// Не забудь експортувати функцію, щоб роути її бачили
module.exports = {
    createEvent,
    // тут можуть бути інші функції (getAllEvents тощо)
};
