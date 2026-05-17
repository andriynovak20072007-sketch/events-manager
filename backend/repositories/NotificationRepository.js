// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Інкапсулює SQL-запити для таблиці notifications.
// ==========================================

const pool = require('../db');

class NotificationRepository {
    /**
     * Отримати всі сповіщення для конкретного користувача
     */
    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    }

    /**
     * Відмітити сповіщення як прочитане
     */
    async markAsRead(id) {
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Видалити сповіщення
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM notifications WHERE notification_id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Створити нове сповіщення
     * ПАТЕРН: Factory (внутрішній) — створення об'єкта через метод
     */
    async create(data) {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, type, message, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [data.user_id, data.type, data.message, data.related_id || null]
        );
        return result.rows[0];
    }

    /**
     * Отримати заплановані нагадування для користувача
     */
    async findRemindersByUserId(userId) {
        const result = await pool.query(
            `SELECT ns.*, e.title AS event_title, e.event_day, e.start_time
             FROM notification_schedule ns
             JOIN events e ON ns.event_id = e.event_id
             WHERE ns.user_id = $1
             ORDER BY ns.remind_at ASC`,
            [userId]
        );
        return result.rows;
    }

    /**
     * Видалити заплановане нагадування
     */
    async deleteReminder(scheduleId) {
        const result = await pool.query(
            'DELETE FROM notification_schedule WHERE schedule_id = $1 RETURNING *',
            [scheduleId]
        );
        return result.rows[0] || null;
    }

    /**
     * UPSERT нагадування (створити або оновити)
     */
    async upsertReminder(data) {
        const result = await pool.query(
            `INSERT INTO notification_schedule (event_id, user_id, remind_at, type, channel, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             ON CONFLICT (event_id, user_id, type) 
             DO UPDATE SET remind_at = $3, channel = $5, status = 'pending', sent_at = NULL
             RETURNING *`,
            [data.event_id, data.user_id, data.remind_at, data.type, data.channel]
        );
        return result.rows[0];
    }
}

// Singleton
module.exports = new NotificationRepository();
