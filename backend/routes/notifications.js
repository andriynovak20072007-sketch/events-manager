const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Observer (реалізація API для підписників)
// Дозволяє отримувати, читати та видаляти сповіщення
// ==========================================

// 1. Отримати всі сповіщення для конкретного користувача (GET /api/notifications/:userId)
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка отримання сповіщень:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 2. Відмітити сповіщення як прочитане (PUT /api/notifications/:id/read)
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 RETURNING *',
            [notificationId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Сповіщення не знайдено" });
        }
        
        res.json({ message: "Сповіщення прочитано", notification: result.rows[0] });
    } catch (err) {
        console.error('Помилка оновлення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 3. Видалити сповіщення (DELETE /api/notifications/:id)
router.delete('/:id', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const result = await pool.query(
            'DELETE FROM notifications WHERE notification_id = $1 RETURNING *',
            [notificationId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Сповіщення не знайдено" });
        }

        res.json({ message: "Сповіщення видалено" });
    } catch (err) {
        console.error('Помилка видалення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 4. ПАТЕРН: Factory (Створення нового сповіщення)
// POST /api/notifications
router.post('/', async (req, res) => {
    const { user_id, type, message, related_id } = req.body;

    if (!user_id || !type || !message) {
        return res.status(400).json({ error: "Недостатньо даних для створення сповіщення" });
    }

    try {
        const result = await pool.query(
            'INSERT INTO notifications (user_id, type, message, related_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, type, message, related_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Помилка створення сповіщення:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// ==========================================
// ПЛАНУВАЛЬНИК ПОДІЙ (SCHEDULER / QUEUE)
// ПАТЕРН: Facade — спрощений API для взаємодії з EventSchedulerService
// ==========================================
const schedulerService = require('../services/EventSchedulerService');

// 5. POST /api/notifications/reminders — Підписка на нагадування про подію
// ПАТЕРН: Factory (створення нагадування через фабрику)
router.post('/reminders', async (req, res) => {
    const { event_id, user_id, type, channel } = req.body;

    // Валідація обов'язкових полів
    if (!event_id || !user_id) {
        return res.status(400).json({ error: "Потрібно вказати event_id та user_id" });
    }

    // Валідація типу нагадування
    const validTypes = schedulerService.constructor.getAvailableTypes().map(t => t.type);
    const reminderType = type || '24h';
    if (!validTypes.includes(reminderType)) {
        return res.status(400).json({ 
            error: `Невалідний тип нагадування. Допустимі: ${validTypes.join(', ')}` 
        });
    }

    // Валідація каналу доставки
    const validChannels = ['all', 'email', 'in_app'];
    const reminderChannel = channel || 'all';
    if (!validChannels.includes(reminderChannel)) {
        return res.status(400).json({ 
            error: `Невалідний канал. Допустимі: ${validChannels.join(', ')}` 
        });
    }

    try {
        // Отримуємо дані події для обчислення remind_at
        const eventResult = await pool.query(
            'SELECT event_id, title, event_day, start_time FROM events WHERE event_id = $1',
            [event_id]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ error: "Подію не знайдено" });
        }

        const event = eventResult.rows[0];
        const eventDateTime = new Date(`${event.event_day}T${event.start_time}`);

        // Обчислюємо час нагадування через стратегію
        const availableTypes = schedulerService.constructor.getAvailableTypes();
        const strategyInfo = availableTypes.find(t => t.type === reminderType);

        // Обчислення remind_at залежно від типу
        const offsets = { '24h': 24*60*60*1000, '1h': 1*60*60*1000, 'on_start': 0 };
        const remindAt = new Date(eventDateTime.getTime() - (offsets[reminderType] || 0));

        // Перевіряємо, що час нагадування ще не пройшов
        if (remindAt <= new Date()) {
            return res.status(400).json({ error: "Час нагадування вже пройшов" });
        }

        // UPSERT — створюємо або оновлюємо нагадування
        const result = await pool.query(
            `INSERT INTO notification_schedule (event_id, user_id, remind_at, type, channel, status)
             VALUES ($1, $2, $3, $4, $5, 'pending')
             ON CONFLICT (event_id, user_id, type) 
             DO UPDATE SET remind_at = $3, channel = $5, status = 'pending', sent_at = NULL
             RETURNING *`,
            [event_id, user_id, remindAt, reminderType, reminderChannel]
        );

        res.status(201).json({
            msg: "Нагадування заплановано",
            reminder: result.rows[0],
            event_title: event.title,
            strategy: strategyInfo
        });
    } catch (err) {
        console.error('Помилка створення нагадування:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 6. GET /api/notifications/:userId/reminders — Отримати заплановані нагадування
router.get('/:userId/reminders', async (req, res) => {
    const userId = req.params.userId;

    try {
        const result = await pool.query(
            `SELECT ns.*, e.title AS event_title, e.event_day, e.start_time
             FROM notification_schedule ns
             JOIN events e ON ns.event_id = e.event_id
             WHERE ns.user_id = $1
             ORDER BY ns.remind_at ASC`,
            [userId]
        );
        res.json({
            status: 'success',
            count: result.rows.length,
            reminders: result.rows
        });
    } catch (err) {
        console.error('Помилка отримання нагадувань:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 7. DELETE /api/notifications/reminders/:scheduleId — Скасувати нагадування
router.delete('/reminders/:scheduleId', async (req, res) => {
    const scheduleId = req.params.scheduleId;

    try {
        const result = await pool.query(
            'DELETE FROM notification_schedule WHERE schedule_id = $1 RETURNING *',
            [scheduleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Нагадування не знайдено" });
        }

        res.json({ msg: "Нагадування скасовано", deleted: result.rows[0] });
    } catch (err) {
        console.error('Помилка видалення нагадування:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 8. GET /api/notifications/scheduler/status — Статус планувальника (debug/admin)
router.get('/scheduler/status', (req, res) => {
    const status = schedulerService.getStatus();
    res.json({
        status: 'success',
        scheduler: status,
        email_configured: false, // Визначається при ініціалізації dispatcher
        available_types: schedulerService.constructor.getAvailableTypes()
    });
});

module.exports = router;

