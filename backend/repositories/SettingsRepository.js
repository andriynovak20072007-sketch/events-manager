// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Інкапсулює SQL-запити для таблиці user_settings.
// Використовує UPSERT (INSERT ON CONFLICT) для збереження.
// ==========================================

const pool = require('../db');

class SettingsRepository {
    /**
     * Отримати значення налаштування
     * @param {number} userId
     * @param {string} key — ключ налаштування ('currency', 'language')
     * @param {string} defaultValue — значення за замовчуванням
     */
    async get(userId, key, defaultValue = null) {
        const result = await pool.query(
            'SELECT setting_value FROM user_settings WHERE user_id = $1 AND setting_key = $2',
            [userId, key]
        );
        return result.rows.length > 0 ? result.rows[0].setting_value : defaultValue;
    }

    /**
     * Зберегти значення налаштування (UPSERT)
     * @param {number} userId
     * @param {string} key — ключ налаштування
     * @param {string} value — нове значення
     */
    async set(userId, key, value) {
        const result = await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, key, value]
        );
        return result.rows[0];
    }
}

// Singleton
module.exports = new SettingsRepository();
