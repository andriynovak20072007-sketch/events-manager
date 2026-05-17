// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Інкапсулює SQL-запити для таблиці favorites.
// ==========================================

const pool = require('../db');

class FavoriteRepository {
    /**
     * Отримати список обраних подій для користувача
     * Використовує INNER JOIN для об'єднання таблиць
     */
    async findByUserId(userId) {
        const query = `
            SELECT e.*, f.favorite_id 
            FROM events e
            INNER JOIN favorites f ON e.event_id = f.event_id
            WHERE f.user_id = $1
            ORDER BY f.favorite_id DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    }

    /**
     * Перевірити, чи подія вже в обраному
     */
    async exists(userId, eventId) {
        const result = await pool.query(
            'SELECT * FROM favorites WHERE user_id = $1 AND event_id = $2',
            [userId, eventId]
        );
        return result.rows.length > 0;
    }

    /**
     * Додати подію в обране
     */
    async add(userId, eventId) {
        const result = await pool.query(
            'INSERT INTO favorites (user_id, event_id) VALUES ($1, $2) RETURNING *',
            [userId, eventId]
        );
        return result.rows[0];
    }

    /**
     * Видалити подію з обраного
     */
    async remove(userId, eventId) {
        const result = await pool.query(
            'DELETE FROM favorites WHERE user_id = $1 AND event_id = $2 RETURNING *',
            [userId, eventId]
        );
        return result.rows[0] || null;
    }
}

// Singleton
module.exports = new FavoriteRepository();
