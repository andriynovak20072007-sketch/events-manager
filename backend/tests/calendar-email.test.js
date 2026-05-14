const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });
jest.mock('../cron/scheduler', () => { });

// Мокаємо nodemailer з детальним відстеженням відправки
const mockSendMail = jest.fn(() => Promise.resolve({ messageId: 'test-msg-001' }));
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: mockSendMail
    }))
}));

// ==========================================
// IN-MEMORY СХОВИЩА ДЛЯ ІНТЕГРАЦІЙНИХ ТЕСТІВ
// ==========================================
const mockNotificationsStore = {};
let mockNotificationIdCounter = 1;

const mockScheduleStore = {};
let mockScheduleIdCounter = 1;

// Тестові події (календар)
const mockEventsStore = {
    1: {
        event_id: 1,
        title: 'Конференція JavaScript',
        event_day: '2026-12-25',
        start_time: '10:00:00',
        creator_id: 1
    },
    2: {
        event_id: 2,
        title: 'Воркшоп з React',
        event_day: '2026-12-26',
        start_time: '14:00:00',
        creator_id: 1
    },
    // Подія, що вже пройшла
    3: {
        event_id: 3,
        title: 'Минула подія',
        event_day: '2020-01-01',
        start_time: '09:00:00',
        creator_id: 1
    }
};

const mockUsersStore = {
    1: { user_id: 1, username: 'testuser', email: 'test@example.com', role: 'user' },
    2: { user_id: 2, username: 'anotheruser', email: 'other@example.com', role: 'user' }
};

// Учасники подій
const mockParticipantsStore = {
    1: [{ user_id: 1 }, { user_id: 2 }],  // Обидва юзери на події 1
    2: [{ user_id: 1 }]                     // Тільки юзер 1 на події 2
};

// ==========================================
// МОК БАЗИ ДАНИХ
// ==========================================
jest.mock('../db', () => ({
    query: jest.fn((sql, values) => {
        const trimmedSql = typeof sql === 'string' ? sql.trim() : '';

        // --- subscription_plans (потрібно для server.js import) ---
        if (trimmedSql.includes('subscription_plans') && !trimmedSql.includes('user_subscriptions')) {
            return Promise.resolve({ rows: [{ plan_id: 1, name: 'free' }] });
        }
        if (trimmedSql.includes('user_subscriptions')) {
            return Promise.resolve({ rows: [{ subscription_id: 1 }] });
        }

        // --- notifications ---

        // SELECT сповіщень користувача
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('notifications') && !trimmedSql.includes('notification_schedule')) {
            const userId = values[0];
            const userNotifs = Object.values(mockNotificationsStore).filter(n => n.user_id == userId);
            return Promise.resolve({ rows: userNotifs.sort((a, b) => b.notification_id - a.notification_id) });
        }

        // INSERT сповіщення
        if (trimmedSql.startsWith('INSERT') && trimmedSql.includes('notifications') && !trimmedSql.includes('notification_schedule')) {
            const newNotif = {
                notification_id: mockNotificationIdCounter++,
                user_id: values[0],
                type: values[1],
                message: values[2],
                related_id: values[3] || null,
                is_read: false,
                created_at: new Date().toISOString()
            };
            mockNotificationsStore[newNotif.notification_id] = newNotif;
            return Promise.resolve({ rows: [newNotif] });
        }

        // UPDATE сповіщення (mark as read)
        if (trimmedSql.startsWith('UPDATE') && trimmedSql.includes('notifications') && trimmedSql.includes('is_read')) {
            const notifId = parseInt(values[0]);
            if (mockNotificationsStore[notifId]) {
                mockNotificationsStore[notifId].is_read = true;
                return Promise.resolve({ rows: [mockNotificationsStore[notifId]] });
            }
            return Promise.resolve({ rows: [] });
        }

        // DELETE сповіщення
        if (trimmedSql.startsWith('DELETE') && trimmedSql.includes('notifications') && !trimmedSql.includes('notification_schedule')) {
            const notifId = parseInt(values[0]);
            if (mockNotificationsStore[notifId]) {
                const deleted = mockNotificationsStore[notifId];
                delete mockNotificationsStore[notifId];
                return Promise.resolve({ rows: [deleted] });
            }
            return Promise.resolve({ rows: [] });
        }

        // --- notification_schedule ---

        // SELECT pending нагадувань для processQueue (JOIN з events + users)
        // ВАЖЛИВО: цей блок повинен бути ПЕРЕД перевіркою ns.user_id,
        // бо SQL processQueue теж містить ns.user_id
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('notification_schedule') && trimmedSql.includes('ns.status') && trimmedSql.includes('users')) {
            const pendingItems = Object.values(mockScheduleStore).filter(r => r.status === 'pending');
            return Promise.resolve({
                rows: pendingItems.map(r => {
                    const event = mockEventsStore[r.event_id] || {};
                    const user = mockUsersStore[r.user_id] || {};
                    return {
                        ...r,
                        event_title: event.title,
                        event_day: event.event_day,
                        start_time: event.start_time,
                        username: user.username,
                        email: user.email
                    };
                })
            });
        }

        // SELECT нагадувань для юзера (JOIN з events)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('notification_schedule') && trimmedSql.includes('ns.user_id')) {
            const userId = values[0];
            const userReminders = Object.values(mockScheduleStore).filter(r => r.user_id == userId);
            return Promise.resolve({
                rows: userReminders.map(r => {
                    const event = mockEventsStore[r.event_id] || {};
                    return {
                        ...r,
                        event_title: event.title || 'Unknown',
                        event_day: event.event_day || '2026-01-01',
                        start_time: event.start_time || '00:00'
                    };
                })
            });
        }

        // INSERT нагадування (UPSERT)
        if (trimmedSql.startsWith('INSERT') && trimmedSql.includes('notification_schedule')) {
            const eventId = values[0];
            const userId = values[1];
            const remindAt = values[2];
            const type = values[3];
            const channel = values[4] || 'all';
            const key = `${eventId}:${userId}:${type}`;

            if (mockScheduleStore[key]) {
                mockScheduleStore[key].remind_at = remindAt;
                mockScheduleStore[key].channel = channel;
                mockScheduleStore[key].status = 'pending';
                return Promise.resolve({ rows: [mockScheduleStore[key]] });
            }

            const newSchedule = {
                schedule_id: mockScheduleIdCounter++,
                event_id: eventId,
                user_id: userId,
                remind_at: remindAt,
                type: type,
                channel: channel,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            mockScheduleStore[key] = newSchedule;
            return Promise.resolve({ rows: [newSchedule] });
        }

        // UPDATE notification_schedule (status → sent/failed)
        if (trimmedSql.startsWith('UPDATE') && trimmedSql.includes('notification_schedule') && trimmedSql.includes('status')) {
            const scheduleId = parseInt(values[0]);
            const entry = Object.values(mockScheduleStore).find(s => s.schedule_id === scheduleId);
            if (entry) {
                if (trimmedSql.includes('sent')) {
                    entry.status = 'sent';
                    entry.sent_at = new Date().toISOString();
                } else if (trimmedSql.includes('failed')) {
                    entry.status = 'failed';
                    entry.error_message = values[1];
                }
            }
            return Promise.resolve({ rows: [] });
        }

        // DELETE нагадування
        if (trimmedSql.startsWith('DELETE') && trimmedSql.includes('notification_schedule')) {
            const scheduleId = parseInt(values[0]);
            const key = Object.keys(mockScheduleStore).find(k => mockScheduleStore[k].schedule_id === scheduleId);
            if (key) {
                const deleted = mockScheduleStore[key];
                delete mockScheduleStore[key];
                return Promise.resolve({ rows: [deleted] });
            }
            return Promise.resolve({ rows: [] });
        }

        // --- events ---

        // --- Upcoming events (для scanUpcomingEvents) ---
        // ВАЖЛИВО: цей блок повинен бути ПЕРЕД перевіркою event_id,
        // бо SQL scanUpcomingEvents теж містить event_id (в SELECT), але не має values
        if (trimmedSql.includes('events') && trimmedSql.includes("NOW()") && trimmedSql.includes('25 hours')) {
            // Повертаємо події 1 та 2 як "майбутні"
            const upcoming = [mockEventsStore[1], mockEventsStore[2]].map(e => ({
                ...e,
                event_datetime: `${e.event_day}T${e.start_time}`
            }));
            return Promise.resolve({ rows: upcoming });
        }

        // SELECT подію за ID
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('events') && trimmedSql.includes('event_id')) {
            const eventId = parseInt(values[0]);
            const event = mockEventsStore[eventId];
            return Promise.resolve({ rows: event ? [event] : [] });
        }

        // --- participants ---
        if (trimmedSql.includes('event_participants') || trimmedSql.includes('creator_id AS user_id')) {
            const eventId = parseInt(values[0]);
            return Promise.resolve({ rows: mockParticipantsStore[eventId] || [] });
        }

        // --- user_settings (потрібно для server.js) ---
        if (trimmedSql.includes('user_settings')) {
            return Promise.resolve({ rows: [] });
        }

        return Promise.resolve({ rows: [] });
    }),
    connect: jest.fn()
}));

const app = require('../server');

// Очищаємо сховища між тестами
beforeEach(() => {
    Object.keys(mockNotificationsStore).forEach(key => delete mockNotificationsStore[key]);
    mockNotificationIdCounter = 1;
    Object.keys(mockScheduleStore).forEach(key => delete mockScheduleStore[key]);
    mockScheduleIdCounter = 1;
    mockSendMail.mockClear();
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: КАЛЕНДАР СПОВІЩЕНЬ
// Повний цикл: створення → планування → отримання → скасування
// =======================================================

describe('Інтеграція: Календар сповіщень (повний цикл)', () => {

    it('TC-CAL-01: Створення нагадування → отримання списку → скасування', async () => {
        // 1. Створюємо нагадування
        const createRes = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'all' });

        expect(createRes.statusCode).toEqual(201);
        expect(createRes.body.reminder.status).toEqual('pending');
        const scheduleId = createRes.body.reminder.schedule_id;

        // 2. Отримуємо список нагадувань
        const listRes = await request(app)
            .get('/api/notifications/1/reminders');

        expect(listRes.statusCode).toEqual(200);
        expect(listRes.body.count).toBeGreaterThanOrEqual(1);
        expect(listRes.body.reminders.some(r => r.schedule_id === scheduleId)).toBe(true);

        // 3. Скасовуємо нагадування
        const deleteRes = await request(app)
            .delete(`/api/notifications/reminders/${scheduleId}`);

        expect(deleteRes.statusCode).toEqual(200);
        expect(deleteRes.body.msg).toContain('скасовано');

        // 4. Перевіряємо що список тепер порожній
        const listAfter = await request(app)
            .get('/api/notifications/1/reminders');

        expect(listAfter.body.count).toEqual(0);
    });

    it('TC-CAL-02: Множинні типи нагадувань для одної події', async () => {
        // Створюємо 3 різні нагадування для однієї події
        const types = ['24h', '1h', 'on_start'];

        for (const type of types) {
            const res = await request(app)
                .post('/api/notifications/reminders')
                .send({ event_id: 1, user_id: 1, type, channel: 'all' });
            expect(res.statusCode).toEqual(201);
        }

        // Перевіряємо що всі 3 створені
        const listRes = await request(app)
            .get('/api/notifications/1/reminders');

        expect(listRes.body.count).toEqual(3);

        const createdTypes = listRes.body.reminders.map(r => r.type);
        expect(createdTypes).toContain('24h');
        expect(createdTypes).toContain('1h');
        expect(createdTypes).toContain('on_start');
    });

    it('TC-CAL-03: Нагадування для різних подій одного юзера', async () => {
        // Нагадування для події 1
        await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h' });

        // Нагадування для події 2
        await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 2, user_id: 1, type: '24h' });

        const listRes = await request(app)
            .get('/api/notifications/1/reminders');

        expect(listRes.body.count).toEqual(2);

        const eventIds = listRes.body.reminders.map(r => r.event_id);
        expect(eventIds).toContain(1);
        expect(eventIds).toContain(2);
    });

    it('TC-CAL-04: Неіснуюча подія → 404', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 999, user_id: 1, type: '24h' });

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toContain('не знайдено');
    });

    it('TC-CAL-05: Невалідний тип нагадування → 400', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '30min' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Невалідний тип');
    });

    it('TC-CAL-06: Невалідний канал доставки → 400', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'telegram' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Невалідний канал');
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: СПОВІЩЕННЯ (CRUD + LIFECYCLE)
// =======================================================

describe('Інтеграція: Повний цикл сповіщень (CRUD)', () => {

    it('TC-NOT-01: Створення → прочитання → видалення сповіщення', async () => {
        // 1. Створюємо сповіщення
        const createRes = await request(app)
            .post('/api/notifications')
            .send({
                user_id: 1,
                type: 'reminder',
                message: 'Конференція через 24 години!',
                related_id: 1
            });

        expect(createRes.statusCode).toEqual(201);
        expect(createRes.body.is_read).toEqual(false);
        const notifId = createRes.body.notification_id;

        // 2. Перевіряємо список — сповіщення є і непрочитане
        const listRes = await request(app)
            .get('/api/notifications/1');

        expect(listRes.statusCode).toEqual(200);
        expect(listRes.body.length).toEqual(1);
        expect(listRes.body[0].is_read).toEqual(false);

        // 3. Позначаємо як прочитане
        const readRes = await request(app)
            .put(`/api/notifications/${notifId}/read`);

        expect(readRes.statusCode).toEqual(200);
        expect(readRes.body.notification.is_read).toEqual(true);

        // 4. Видаляємо
        const deleteRes = await request(app)
            .delete(`/api/notifications/${notifId}`);

        expect(deleteRes.statusCode).toEqual(200);
        expect(deleteRes.body.message).toContain('видалено');

        // 5. Перевіряємо — список порожній
        const emptyRes = await request(app)
            .get('/api/notifications/1');

        expect(emptyRes.body.length).toEqual(0);
    });

    it('TC-NOT-02: Множинні сповіщення для юзера (сортування DESC)', async () => {
        // Створюємо 3 сповіщення
        await request(app).post('/api/notifications').send({
            user_id: 1, type: 'system', message: 'Перше сповіщення'
        });
        await request(app).post('/api/notifications').send({
            user_id: 1, type: 'reminder', message: 'Друге сповіщення'
        });
        await request(app).post('/api/notifications').send({
            user_id: 1, type: 'invite', message: 'Третє сповіщення'
        });

        const res = await request(app).get('/api/notifications/1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toEqual(3);

        // Перевіряємо різні типи
        const types = res.body.map(n => n.type);
        expect(types).toContain('system');
        expect(types).toContain('reminder');
        expect(types).toContain('invite');
    });

    it('TC-NOT-03: Сповіщення без обов\'язкових полів → 400', async () => {
        // Без user_id
        const res1 = await request(app).post('/api/notifications')
            .send({ type: 'system', message: 'test' });
        expect(res1.statusCode).toEqual(400);

        // Без message
        const res2 = await request(app).post('/api/notifications')
            .send({ user_id: 1, type: 'system' });
        expect(res2.statusCode).toEqual(400);

        // Без type
        const res3 = await request(app).post('/api/notifications')
            .send({ user_id: 1, message: 'test' });
        expect(res3.statusCode).toEqual(400);
    });

    it('TC-NOT-04: Видалення неіснуючого сповіщення → 404', async () => {
        const res = await request(app)
            .delete('/api/notifications/9999');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toContain('не знайдено');
    });

    it('TC-NOT-05: Прочитання неіснуючого сповіщення → 404', async () => {
        const res = await request(app)
            .put('/api/notifications/9999/read');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toContain('не знайдено');
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: EMAIL + DISPATCHER
// Тестування ланцюга відповідальності (Chain of Responsibility)
// =======================================================

describe('Інтеграція: Email-сповіщення та Dispatcher', () => {

    it('TC-EMAIL-01: NotificationDispatcher ініціалізується без помилок', () => {
        const tempHost = process.env.SMTP_HOST;
        delete process.env.SMTP_HOST;

        let dispatcher;
        jest.isolateModules(() => {
            const NotificationDispatcher = require('../services/NotificationDispatcher');
            const pool = require('../db');
            dispatcher = new NotificationDispatcher(pool);
        });

        expect(dispatcher).toBeDefined();
        expect(dispatcher.chain).toBeDefined();
        // SMTP не налаштовано в тестах — email не активний
        expect(dispatcher.isEmailConfigured()).toBe(false);

        if (tempHost) process.env.SMTP_HOST = tempHost;
    });

    it('TC-EMAIL-02: Dispatch in_app сповіщення без SMTP', async () => {
        const tempHost = process.env.SMTP_HOST;
        delete process.env.SMTP_HOST;

        let dispatcher;
        jest.isolateModules(() => {
            const NotificationDispatcher = require('../services/NotificationDispatcher');
            const pool = require('../db');
            dispatcher = new NotificationDispatcher(pool);
        });

        const results = await dispatcher.dispatch({
            userId: 1,
            email: 'test@example.com',
            username: 'testuser',
            message: 'Тестове нагадування',
            eventTitle: 'Конференція',
            type: '24h',
            channel: 'in_app'
        });

        expect(results).toBeInstanceOf(Array);
        const inApp = results.find(r => r.channel === 'in_app');
        expect(inApp).toBeDefined();
        expect(inApp.success).toBe(true);

        if (tempHost) process.env.SMTP_HOST = tempHost;
    });

    it('TC-EMAIL-03: ReminderStrategy форматує повідомлення правильно', () => {
        // Тестуємо стратегії безпосередньо
        jest.isolateModules(() => {
            // Через Singleton потрібно отримати інстанс
            const scheduler = require('../services/EventSchedulerService');

            const types = scheduler.constructor.getAvailableTypes();
            expect(types.length).toEqual(3);
            expect(types.map(t => t.type)).toEqual(['24h', '1h', 'on_start']);

            // Перевіряємо labels
            const labels = types.map(t => t.label);
            expect(labels).toContain('За 24 години');
            expect(labels).toContain('За 1 годину');
            expect(labels).toContain('При старті');
        });
    });

    it('TC-EMAIL-04: Канал "all" проходить через весь ланцюг обробників', async () => {
        const tempHost = process.env.SMTP_HOST;
        delete process.env.SMTP_HOST;

        let dispatcher;
        jest.isolateModules(() => {
            const NotificationDispatcher = require('../services/NotificationDispatcher');
            const pool = require('../db');
            dispatcher = new NotificationDispatcher(pool);
        });

        const results = await dispatcher.dispatch({
            userId: 1,
            email: 'test@example.com',
            username: 'testuser',
            message: 'Повний ланцюг',
            eventTitle: 'Подія',
            type: '24h',
            channel: 'all'
        });

        // in_app повинен спрацювати (email пропускається бо SMTP не налаштовано)
        expect(results.length).toBeGreaterThanOrEqual(1);
        const inApp = results.find(r => r.channel === 'in_app');
        expect(inApp).toBeDefined();
        expect(inApp.success).toBe(true);

        if (tempHost) process.env.SMTP_HOST = tempHost;
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: SCHEDULER SERVICE
// Тестування планувальника подій напряму
// =======================================================

describe('Інтеграція: EventSchedulerService (планувальник)', () => {

    it('TC-SCHED-01: getStatus повертає коректну структуру', () => {
        const scheduler = require('../services/EventSchedulerService');
        const status = scheduler.getStatus();

        expect(status).toBeDefined();
        expect(status.isProcessing).toBeDefined();
        expect(status.stats).toBeDefined();
        expect(status.stats).toHaveProperty('scanned');
        expect(status.stats).toHaveProperty('enqueued');
        expect(status.stats).toHaveProperty('sent');
        expect(status.stats).toHaveProperty('failed');
        expect(status.strategies).toBeInstanceOf(Array);
        expect(status.strategies.length).toEqual(3);
    });

    it('TC-SCHED-02: GET /scheduler/status повертає доступні типи', async () => {
        const res = await request(app)
            .get('/api/notifications/scheduler/status');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.scheduler).toBeDefined();
        expect(res.body.available_types.length).toEqual(3);

        const typeNames = res.body.available_types.map(t => t.type);
        expect(typeNames).toContain('24h');
        expect(typeNames).toContain('1h');
        expect(typeNames).toContain('on_start');
    });

    it('TC-SCHED-03: Дублікат нагадування оновлює канал, не створює новий', async () => {
        // Перше нагадування — email
        const first = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'email' });

        expect(first.statusCode).toEqual(201);

        // Повторне — in_app (UPSERT)
        const second = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'in_app' });

        expect(second.statusCode).toEqual(201);
        expect(second.body.reminder.schedule_id).toEqual(first.body.reminder.schedule_id);
        expect(second.body.reminder.channel).toEqual('in_app');
    });

    it('TC-SCHED-04: Нагадування містить інформацію про стратегію', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '1h' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.strategy).toBeDefined();
        expect(res.body.strategy.type).toEqual('1h');
        expect(res.body.strategy.label).toEqual('За 1 годину');
        expect(res.body.event_title).toEqual('Конференція JavaScript');
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: EMAIL З НАЛАШТОВАНИМ SMTP
// Перевірка відправки листів через мок nodemailer
// =======================================================

describe('Інтеграція: Email-відправка з SMTP', () => {

    let dispatcher;

    beforeEach(() => {
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@test.com';
        process.env.SMTP_PASS = 'secret';
        process.env.SMTP_FROM = 'EventManager <noreply@test.com>';
        mockSendMail.mockClear();

        jest.isolateModules(() => {
            const ND = require('../services/NotificationDispatcher');
            const p = require('../db');
            dispatcher = new ND(p);
        });
    });

    afterEach(() => {
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
        delete process.env.SMTP_USER;
        delete process.env.SMTP_PASS;
        delete process.env.SMTP_FROM;
    });

    it('TC-EMAIL-05: Email відправляється коли SMTP налаштовано', async () => {
        const results = await dispatcher.dispatch({
            userId: 1, email: 'user@example.com', username: 'TestUser',
            message: 'Завтра конференція!', eventTitle: 'JS Conf',
            type: '24h', channel: 'email'
        });

        const emailResult = results.find(r => r.channel === 'email');
        expect(emailResult).toBeDefined();
        expect(emailResult.success).toBe(true);
        expect(emailResult.result.messageId).toEqual('test-msg-001');
        expect(mockSendMail).toHaveBeenCalledTimes(1);

        const mailArgs = mockSendMail.mock.calls[0][0];
        expect(mailArgs.to).toEqual('user@example.com');
        expect(mailArgs.subject).toContain('JS Conf');
        expect(mailArgs.html).toContain('TestUser');
    });

    it('TC-EMAIL-06: Канал "all" відправляє і email, і in_app', async () => {
        const results = await dispatcher.dispatch({
            userId: 1, email: 'both@example.com', username: 'BothUser',
            message: 'Повний ланцюг', eventTitle: 'Full Chain',
            type: '1h', channel: 'all'
        });

        expect(results.length).toEqual(2);
        expect(results.find(r => r.channel === 'email').success).toBe(true);
        expect(results.find(r => r.channel === 'in_app').success).toBe(true);
        expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('TC-EMAIL-07: Email HTML містить правильну структуру', async () => {
        await dispatcher.dispatch({
            userId: 2, email: 'html@example.com', username: 'HTMLUser',
            message: 'Шаблон листа', eventTitle: 'Template Test',
            type: '24h', channel: 'email'
        });

        const html = mockSendMail.mock.calls[0][0].html;
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('HTMLUser');
        expect(html).toContain('Template Test');
        expect(html).toContain('Event Manager');
    });

    it('TC-EMAIL-08: Помилка sendMail не ламає ланцюг', async () => {
        mockSendMail.mockRejectedValueOnce(new Error('SMTP connection refused'));

        const results = await dispatcher.dispatch({
            userId: 1, email: 'fail@example.com', username: 'FailUser',
            message: 'Має впасти email', eventTitle: 'Fail Event',
            type: '24h', channel: 'all'
        });

        expect(results.find(r => r.channel === 'email').success).toBe(false);
        expect(results.find(r => r.channel === 'email').error).toContain('SMTP connection refused');
        expect(results.find(r => r.channel === 'in_app').success).toBe(true);
    });

    it('TC-EMAIL-09: Без email адреси — email-канал пропускається', async () => {
        const results = await dispatcher.dispatch({
            userId: 1, email: null, username: 'NoEmail',
            message: 'Без email', eventTitle: 'No Email',
            type: '24h', channel: 'all'
        });

        expect(results.length).toEqual(1);
        expect(results[0].channel).toEqual('in_app');
        expect(mockSendMail).not.toHaveBeenCalled();
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: PIPELINE ПЛАНУВАЛЬНИКА
// =======================================================

describe('Інтеграція: Pipeline планувальника', () => {

    it('TC-PIPE-01: scanUpcomingEvents повертає майбутні події', async () => {
        const scheduler = require('../services/EventSchedulerService');
        const events = await scheduler.scanUpcomingEvents();

        expect(events).toBeInstanceOf(Array);
        expect(events.length).toEqual(2);
        expect(events[0].title).toEqual('Конференція JavaScript');
        expect(events[1].title).toEqual('Воркшоп з React');
    });

    it('TC-PIPE-02: enqueueReminders створює записи для учасників', async () => {
        const scheduler = require('../services/EventSchedulerService');
        const events = await scheduler.scanUpcomingEvents();
        const enqueued = await scheduler.enqueueReminders(events);
        expect(enqueued).toBeGreaterThan(0);
    });

    it('TC-PIPE-03: processQueue повертає структуру sent/failed/total', async () => {
        const scheduler = require('../services/EventSchedulerService');
        const result = await scheduler.processQueue(null);
        expect(result).toHaveProperty('sent');
        expect(result).toHaveProperty('failed');
        expect(result).toHaveProperty('total');
    });

    it('TC-PIPE-04: getStatus відображає актуальну статистику', () => {
        const scheduler = require('../services/EventSchedulerService');
        const status = scheduler.getStatus();
        expect(status.isProcessing).toBe(false);
        expect(typeof status.stats.scanned).toBe('number');
        expect(typeof status.stats.sent).toBe('number');
        expect(typeof status.stats.failed).toBe('number');
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: ІЗОЛЯЦІЯ МІЖ КОРИСТУВАЧАМИ
// =======================================================

describe('Інтеграція: Ізоляція сповіщень між користувачами', () => {

    it('TC-ISO-01: Сповіщення user1 не видні user2', async () => {
        await request(app).post('/api/notifications').send({
            user_id: 1, type: 'reminder', message: 'Тільки для юзера 1'
        });
        await request(app).post('/api/notifications').send({
            user_id: 2, type: 'invite', message: 'Тільки для юзера 2'
        });

        const u1 = await request(app).get('/api/notifications/1');
        const u2 = await request(app).get('/api/notifications/2');

        expect(u1.body.length).toEqual(1);
        expect(u2.body.length).toEqual(1);
        expect(u1.body[0].user_id).toEqual(1);
        expect(u2.body[0].user_id).toEqual(2);
    });

    it('TC-ISO-02: Видалення сповіщення user1 не впливає на user2', async () => {
        const n1 = await request(app).post('/api/notifications').send({
            user_id: 1, type: 'reminder', message: 'User1 msg'
        });
        await request(app).post('/api/notifications').send({
            user_id: 2, type: 'reminder', message: 'User2 msg'
        });

        await request(app).delete(`/api/notifications/${n1.body.notification_id}`);

        const u2 = await request(app).get('/api/notifications/2');
        expect(u2.body.length).toEqual(1);
        expect(u2.body[0].message).toEqual('User2 msg');
    });
});

// =======================================================
// ІНТЕГРАЦІЙНІ ТЕСТИ: E2E — ПОДІЯ → НАГАДУВАННЯ → EMAIL
// =======================================================

describe('Інтеграція: E2E — Календар → Планувальник → Доставка', () => {

    it('TC-E2E-01: Створення нагадування → Список → Доставка dispatcher', async () => {
        const createRes = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'all' });

        expect(createRes.statusCode).toEqual(201);
        expect(createRes.body.event_title).toEqual('Конференція JavaScript');

        const listRes = await request(app).get('/api/notifications/1/reminders');
        expect(listRes.body.count).toBeGreaterThanOrEqual(1);

        const NotificationDispatcher = require('../services/NotificationDispatcher');
        const pool = require('../db');
        const disp = new NotificationDispatcher(pool);

        const results = await disp.dispatch({
            userId: 1, email: 'test@example.com', username: 'testuser',
            message: 'Конференція завтра!', eventTitle: 'Конференція JavaScript',
            type: '24h', channel: 'all'
        });
        expect(results.some(r => r.success)).toBe(true);
    });

    it('TC-E2E-02: Множинні юзери → Масові нагадування → Статус', async () => {
        await request(app).post('/api/notifications/reminders').send({
            event_id: 1, user_id: 1, type: '1h', channel: 'in_app'
        });
        await request(app).post('/api/notifications/reminders').send({
            event_id: 1, user_id: 2, type: '1h', channel: 'in_app'
        });

        const u1 = await request(app).get('/api/notifications/1/reminders');
        const u2 = await request(app).get('/api/notifications/2/reminders');

        expect(u1.body.reminders.some(r => r.type === '1h')).toBe(true);
        expect(u2.body.reminders.some(r => r.type === '1h')).toBe(true);

        const status = await request(app).get('/api/notifications/scheduler/status');
        expect(status.statusCode).toEqual(200);
        expect(status.body.available_types.length).toEqual(3);
    });

    it('TC-E2E-03: Повний lifecycle сповіщення (create→read→delete)', async () => {
        const c = await request(app).post('/api/notifications').send({
            user_id: 2, type: 'reminder', message: 'E2E lifecycle'
        });
        const id = c.body.notification_id;

        const r = await request(app).put(`/api/notifications/${id}/read`);
        expect(r.body.notification.is_read).toBe(true);

        await request(app).delete(`/api/notifications/${id}`);

        const list = await request(app).get('/api/notifications/2');
        expect(list.body.length).toEqual(0);
    });

    it('TC-E2E-04: Нагадування on_start → скасування до обробки', async () => {
        const create = await request(app).post('/api/notifications/reminders').send({
            event_id: 2, user_id: 1, type: 'on_start', channel: 'email'
        });
        expect(create.body.strategy.label).toEqual('При старті');
        const scheduleId = create.body.reminder.schedule_id;

        const cancel = await request(app).delete(`/api/notifications/reminders/${scheduleId}`);
        expect(cancel.body.msg).toContain('скасовано');

        const list = await request(app).get('/api/notifications/1/reminders');
        expect(list.body.reminders.find(r => r.schedule_id === scheduleId)).toBeUndefined();
    });
});
