const pool = require('../db');

// ==========================================
// ПАТЕРН 1: Strategy (Стратегії нагадувань)
// Кожна стратегія визначає, за скільки часу до події надсилати нагадування
// Легко додати нові типи (наприклад '3h', '1d') без зміни основної логіки
// ==========================================
class ReminderStrategy {
    constructor(type, offsetMs, label) {
        this.type = type;
        this.offsetMs = offsetMs;
        this.label = label;
    }

    /**
     * Обчислює час нагадування на основі дати/часу події
     * @param {Date} eventDateTime — повний datetime початку події
     * @returns {Date} — момент, коли потрібно відправити нагадування
     */
    calculateRemindAt(eventDateTime) {
        return new Date(eventDateTime.getTime() - this.offsetMs);
    }

    /**
     * Формує текст повідомлення (Template Method — підкласи можуть перевизначити)
     */
    formatMessage(eventTitle, eventDay, startTime) {
        // Базова реалізація — підкласи можуть кастомізувати
        return `Нагадування: подія "${eventTitle}" відбудеться ${eventDay} о ${startTime}`;
    }
}

// Конкретні стратегії нагадувань
class Reminder24h extends ReminderStrategy {
    constructor() {
        super('24h', 24 * 60 * 60 * 1000, 'За 24 години');
    }

    formatMessage(eventTitle, eventDay, startTime) {
        return `⏰ Завтра у вас подія "${eventTitle}" о ${startTime}. Не пропустіть!`;
    }
}

class Reminder1h extends ReminderStrategy {
    constructor() {
        super('1h', 1 * 60 * 60 * 1000, 'За 1 годину');
    }

    formatMessage(eventTitle, eventDay, startTime) {
        return `🔔 Через годину починається "${eventTitle}"! Готуйтесь!`;
    }
}

class ReminderOnStart extends ReminderStrategy {
    constructor() {
        super('on_start', 0, 'При старті');
    }

    formatMessage(eventTitle, eventDay, startTime) {
        return `🚀 Подія "${eventTitle}" починається прямо зараз!`;
    }
}

// ==========================================
// ПАТЕРН 2: Registry (Реєстр стратегій)
// Централізований каталог усіх доступних стратегій нагадувань
// ==========================================
const REMINDER_STRATEGIES = {
    '24h': new Reminder24h(),
    '1h': new Reminder1h(),
    'on_start': new ReminderOnStart()
};

// ==========================================
// ПАТЕРН 3: Singleton (Єдиний екземпляр планувальника)
// Гарантує, що в усьому додатку існує лише один планувальник
// ==========================================
class EventSchedulerService {
    constructor() {
        if (EventSchedulerService._instance) {
            return EventSchedulerService._instance;
        }
        this.isProcessing = false;
        this.lastRunAt = null;
        this.stats = { scanned: 0, enqueued: 0, sent: 0, failed: 0 };
        EventSchedulerService._instance = this;
    }

    // ==========================================
    // ПАТЕРН 4: Template Method (Алгоритм з кроками)
    // Основний метод визначає кроки, а деталі — в окремих методах
    // ==========================================
    
    /**
     * Головний метод планувальника — запускається з cron
     * Template Method: scan → enqueue → process
     */
    async run() {
        if (this.isProcessing) {
            console.log('⚠️ [SCHEDULER] Попередній цикл ще не завершено, пропускаємо...');
            return { skipped: true };
        }

        this.isProcessing = true;
        this.lastRunAt = new Date();

        try {
            // Крок 1: Сканування
            const upcomingEvents = await this.scanUpcomingEvents();
            this.stats.scanned = upcomingEvents.length;

            // Крок 2: Формування черги
            const enqueued = await this.enqueueReminders(upcomingEvents);
            this.stats.enqueued += enqueued;

            // Крок 3: Обробка черги (делегується processQueue)
            const processed = await this.processQueue();
            this.stats.sent += processed.sent;
            this.stats.failed += processed.failed;

            console.log(`✅ [SCHEDULER] Цикл завершено: знайдено ${upcomingEvents.length} подій, ` +
                `додано ${enqueued} нагадувань, відправлено ${processed.sent}, помилок ${processed.failed}`);

            return { scanned: upcomingEvents.length, enqueued, ...processed };
        } catch (err) {
            console.error('❌ [SCHEDULER] Критична помилка циклу:', err.message);
            return { error: err.message };
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Крок 1: Знаходить події, що відбудуться протягом наступних 25 годин
     * (25 годин, щоб мати запас для 24-годинного нагадування)
     */
    async scanUpcomingEvents() {
        const query = `
            SELECT e.event_id, e.title, e.event_day, e.start_time, e.creator_id,
                   (e.event_day + e.start_time) AS event_datetime
            FROM events e
            WHERE (e.event_day + e.start_time) > NOW()
              AND (e.event_day + e.start_time) <= NOW() + INTERVAL '25 hours'
            ORDER BY event_datetime ASC
        `;

        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Крок 2: Створює записи в notification_schedule для кожної події + учасника
     * Використовує ПАТЕРН Strategy для визначення часу нагадування
     */
    async enqueueReminders(events) {
        let totalEnqueued = 0;

        for (const event of events) {
            // Отримуємо всіх учасників події (going/interested) + творця
            const participantsQuery = `
                SELECT DISTINCT user_id FROM (
                    SELECT creator_id AS user_id FROM events WHERE event_id = $1
                    UNION
                    SELECT user_id FROM event_participants 
                    WHERE event_id = $1 AND status IN ('going', 'interested')
                ) AS all_users
            `;
            const participants = await pool.query(participantsQuery, [event.event_id]);

            const eventDateTime = new Date(event.event_datetime);
            const now = new Date();

            // Застосовуємо кожну стратегію нагадування
            for (const strategy of Object.values(REMINDER_STRATEGIES)) {
                const remindAt = strategy.calculateRemindAt(eventDateTime);

                // Не створюємо нагадування, якщо час вже пройшов
                if (remindAt <= now) continue;

                for (const participant of participants.rows) {
                    try {
                        // UPSERT — ON CONFLICT не створює дублікатів
                        await pool.query(
                            `INSERT INTO notification_schedule 
                                (event_id, user_id, remind_at, type, status)
                             VALUES ($1, $2, $3, $4, 'pending')
                             ON CONFLICT (event_id, user_id, type) DO NOTHING`,
                            [event.event_id, participant.user_id, remindAt, strategy.type]
                        );
                        totalEnqueued++;
                    } catch (err) {
                        // Помилка окремого запису не зупиняє весь процес
                        console.error(`⚠️ [SCHEDULER] Помилка enqueue для user=${participant.user_id}, event=${event.event_id}:`, err.message);
                    }
                }
            }
        }

        return totalEnqueued;
    }

    // ==========================================
    // ПАТЕРН 5: Queue (Черга обробки)
    // Забирає pending записи, обробляє їх, оновлює статус
    // ==========================================

    /**
     * Крок 3: Обробляє чергу — знаходить pending записи, час яких настав
     * @param {Object} dispatcher — NotificationDispatcher для відправки
     */
    async processQueue(dispatcher = null) {
        const query = `
            SELECT ns.*, e.title AS event_title, e.event_day, e.start_time,
                   u.username, u.email
            FROM notification_schedule ns
            JOIN events e ON ns.event_id = e.event_id
            JOIN users u ON ns.user_id = u.user_id
            WHERE ns.status = 'pending'
              AND ns.remind_at <= NOW()
            ORDER BY ns.remind_at ASC
            LIMIT 50
        `;

        const result = await pool.query(query);
        let sent = 0;
        let failed = 0;

        for (const item of result.rows) {
            try {
                // Отримуємо стратегію для форматування повідомлення
                const strategy = REMINDER_STRATEGIES[item.type] || REMINDER_STRATEGIES['24h'];
                const message = strategy.formatMessage(item.event_title, item.event_day, item.start_time);

                // Якщо передано dispatcher — використовуємо його для відправки
                if (dispatcher) {
                    await dispatcher.dispatch({
                        userId: item.user_id,
                        email: item.email,
                        username: item.username,
                        message: message,
                        eventTitle: item.event_title,
                        type: item.type,
                        channel: item.channel || 'all'
                    });
                }

                // Записуємо in-app нотифікацію в таблицю notifications
                await pool.query(
                    `INSERT INTO notifications (user_id, type, message, related_id)
                     VALUES ($1, 'reminder', $2, $3)
                     ON CONFLICT DO NOTHING`,
                    [item.user_id, message, item.event_id]
                );

                // Оновлюємо статус на 'sent'
                await pool.query(
                    `UPDATE notification_schedule 
                     SET status = 'sent', sent_at = NOW() 
                     WHERE schedule_id = $1`,
                    [item.schedule_id]
                );
                sent++;
            } catch (err) {
                // Позначаємо як 'failed' з причиною помилки
                await pool.query(
                    `UPDATE notification_schedule 
                     SET status = 'failed', error_message = $2 
                     WHERE schedule_id = $1`,
                    [item.schedule_id, err.message]
                );
                failed++;
                console.error(`❌ [SCHEDULER] Помилка відправки schedule_id=${item.schedule_id}:`, err.message);
            }
        }

        return { sent, failed, total: result.rows.length };
    }

    /**
     * Отримує статус планувальника (для API /scheduler/status)
     */
    getStatus() {
        return {
            isProcessing: this.isProcessing,
            lastRunAt: this.lastRunAt,
            stats: { ...this.stats },
            strategies: Object.keys(REMINDER_STRATEGIES).map(key => ({
                type: key,
                label: REMINDER_STRATEGIES[key].label
            }))
        };
    }

    /**
     * Отримує список доступних типів нагадувань
     */
    static getAvailableTypes() {
        return Object.entries(REMINDER_STRATEGIES).map(([key, strategy]) => ({
            type: key,
            label: strategy.label
        }));
    }
}

// ==========================================
// Експортуємо Singleton-інстанс (патерн Singleton)
// ==========================================
module.exports = new EventSchedulerService();
