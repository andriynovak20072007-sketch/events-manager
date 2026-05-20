const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Repository
// ==========================================
const notificationRepo = require('../repositories/NotificationRepository');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// ==========================================
const AppError = require('../utils/AppError');

// ==========================================
// ПАТЕРН: Logger Singleton
// ==========================================
const logger = require('../utils/Logger');

// ==========================================
// ПАТЕРН: Observer (реалізація API для підписників)
// Дозволяє отримувати, читати та видаляти сповіщення
// ==========================================

// 1. Отримати всі сповіщення для конкретного користувача (GET /api/notifications/:userId)
router.get('/:userId', asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    // ПАТЕРН: Repository
    const notifications = await notificationRepo.findByUserId(userId);
    res.json(notifications);
}));

// 2. Відмітити сповіщення як прочитане (PUT /api/notifications/:id/read)
router.put('/:id/read', asyncHandler(async (req, res) => {
    const notificationId = req.params.id;

    // ПАТЕРН: Repository
    const notification = await notificationRepo.markAsRead(notificationId);
    
    if (!notification) {
        throw AppError.notFound("Сповіщення не знайдено");
    }
    
    res.json({ message: "Сповіщення прочитано", notification });
}));

// 3. Видалити сповіщення (DELETE /api/notifications/:id)
router.delete('/:id', asyncHandler(async (req, res) => {
    const notificationId = req.params.id;

    // ПАТЕРН: Repository
    const deleted = await notificationRepo.delete(notificationId);

    if (!deleted) {
        throw AppError.notFound("Сповіщення не знайдено");
    }

    res.json({ message: "Сповіщення видалено" });
}));

// 4. ПАТЕРН: Factory (Створення нового сповіщення)
// POST /api/notifications
router.post('/', asyncHandler(async (req, res) => {
    const { user_id, type, message, related_id } = req.body;

    if (!user_id || !type || !message) {
        throw AppError.badRequest("Недостатньо даних для створення сповіщення");
    }

    // ПАТЕРН: Repository (з Factory всередині)
    const notification = await notificationRepo.create({ user_id, type, message, related_id });
    logger.info('NOTIFICATIONS', `Створено сповіщення типу "${type}" для user ${user_id}`);

    res.status(201).json(notification);
}));

// ==========================================
// ПЛАНУВАЛЬНИК ПОДІЙ (SCHEDULER / QUEUE)
// ПАТЕРН: Facade — спрощений API для взаємодії з EventSchedulerService
// ==========================================
const schedulerService = require('../services/EventSchedulerService');

// 5. POST /api/notifications/reminders — Підписка на нагадування про подію
// ПАТЕРН: Factory (створення нагадування через фабрику)
router.post('/reminders', asyncHandler(async (req, res) => {
    const { event_id, user_id, type, channel } = req.body;

    // Валідація обов'язкових полів
    if (!event_id || !user_id) {
        throw AppError.badRequest("Потрібно вказати event_id та user_id");
    }

    // ПАТЕРН: Registry (реєстр допустимих типів)
    const validTypes = schedulerService.constructor.getAvailableTypes().map(t => t.type);
    const reminderType = type || '24h';
    if (!validTypes.includes(reminderType)) {
        throw AppError.badRequest(
            `Невалідний тип нагадування. Допустимі: ${validTypes.join(', ')}`
        );
    }

    // ПАТЕРН: Registry (реєстр допустимих каналів)
    const validChannels = ['all', 'email', 'in_app'];
    const reminderChannel = channel || 'all';
    if (!validChannels.includes(reminderChannel)) {
        throw AppError.badRequest(
            `Невалідний канал. Допустимі: ${validChannels.join(', ')}`
        );
    }

    // Отримуємо дані події для обчислення remind_at
    const eventResult = await pool.query(
        'SELECT event_id, title, event_day, start_time FROM events WHERE event_id = $1',
        [event_id]
    );

    if (eventResult.rows.length === 0) {
        throw AppError.notFound("Подію не знайдено");
    }

    const event = eventResult.rows[0];
    
    // pg може повертати DATE як об'єкт Date, або як рядок
    const dateString = event.event_day instanceof Date 
        ? event.event_day.toISOString().split('T')[0] 
        : String(event.event_day).split('T')[0];
        
    const eventDateTime = new Date(`${dateString}T${event.start_time}`);

    // Обчислюємо час нагадування через стратегію
    const availableTypes = schedulerService.constructor.getAvailableTypes();
    const strategyInfo = availableTypes.find(t => t.type === reminderType);

    // Обчислення remind_at залежно від типу
    const offsets = { '24h': 24*60*60*1000, '1h': 1*60*60*1000, 'on_start': 0 };
    const remindAt = new Date(eventDateTime.getTime() - (offsets[reminderType] || 0));

    // Перевіряємо, що час нагадування ще не пройшов
    if (remindAt <= new Date()) {
        throw AppError.badRequest("Час нагадування вже пройшов");
    }

    // ПАТЕРН: Repository (UPSERT)
    const reminder = await notificationRepo.upsertReminder({
        event_id, user_id, remind_at: remindAt, type: reminderType, channel: reminderChannel
    });

    logger.info('NOTIFICATIONS', `Нагадування "${reminderType}" заплановано для події "${event.title}"`);

    res.status(201).json({
        msg: "Нагадування заплановано",
        reminder,
        event_title: event.title,
        strategy: strategyInfo
    });
}));

// 6. GET /api/notifications/:userId/reminders — Отримати заплановані нагадування
router.get('/:userId/reminders', asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    // ПАТЕРН: Repository
    const reminders = await notificationRepo.findRemindersByUserId(userId);

    res.json({
        status: 'success',
        count: reminders.length,
        reminders
    });
}));

// 7. DELETE /api/notifications/reminders/:scheduleId — Скасувати нагадування
router.delete('/reminders/:scheduleId', asyncHandler(async (req, res) => {
    const scheduleId = req.params.scheduleId;

    // ПАТЕРН: Repository
    const deleted = await notificationRepo.deleteReminder(scheduleId);

    if (!deleted) {
        throw AppError.notFound("Нагадування не знайдено");
    }

    res.json({ msg: "Нагадування скасовано", deleted });
}));

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

