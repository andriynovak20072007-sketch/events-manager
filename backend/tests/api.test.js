const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });
jest.mock('../cron/scheduler', () => { });

// google-auth-library мокається автоматично через __mocks__/google-auth-library.js

// Мокаємо nodemailer, щоб не відправляти реальних листів
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' }))
    }))
}));

// Внутрішнє сховище для імітації таблиці user_settings (In-Memory)
const mockSettingsStore = {};

// Внутрішнє сховище для імітації таблиці notification_schedule (In-Memory)
// Імена починаються з 'mock' — вимога Jest для доступу всередині jest.mock()
const mockScheduleStore = {};
let mockScheduleIdCounter = 1;

// Внутрішнє сховище для імітації таблиць підписок (In-Memory)
const mockPlansStore = [
    { plan_id: 1, name: 'free', display_name: 'Безкоштовний', price: 0, currency: 'UAH', duration_days: null, max_events: 5, max_routes: 1, can_create_public: false, can_export: false, priority_support: false, description: 'Базовий план' },
    { plan_id: 2, name: 'pro', display_name: 'Професійний', price: 149, currency: 'UAH', duration_days: 30, max_events: 50, max_routes: 10, can_create_public: true, can_export: true, priority_support: false, description: 'Розширений план' },
    { plan_id: 3, name: 'premium', display_name: 'Преміум', price: 299, currency: 'UAH', duration_days: 30, max_events: -1, max_routes: -1, can_create_public: true, can_export: true, priority_support: true, description: 'Необмежений план' }
];
const mockSubscriptionsStore = {};
let mockSubscriptionIdCounter = 1;

jest.mock('../db', () => ({
    query: jest.fn((sql, values) => {
        const trimmedSql = typeof sql === 'string' ? sql.trim() : '';

        // --- Обробка запитів для subscription_plans ---

        // SELECT всіх планів (GET /plans)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('subscription_plans') && !trimmedSql.includes('user_subscriptions')) {
            if (values && values.length > 0) {
                // Пошук конкретного плану за назвою
                const plan = mockPlansStore.find(p => p.name === values[0]);
                return Promise.resolve({ rows: plan ? [plan] : [] });
            }
            return Promise.resolve({ rows: [...mockPlansStore] });
        }

        // SELECT підписки користувача (JOIN)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('user_subscriptions') && trimmedSql.includes('subscription_plans')) {
            const userId = values[0];
            const sub = Object.values(mockSubscriptionsStore).find(s => s.user_id == userId && s.status === 'active');
            if (sub) {
                const plan = mockPlansStore.find(p => p.plan_id === sub.plan_id);
                return Promise.resolve({
                    rows: [{
                        subscription_id: sub.subscription_id,
                        status: sub.status,
                        started_at: sub.started_at,
                        expires_at: sub.expires_at,
                        plan_id: plan.plan_id,
                        plan_name: plan.name,
                        display_name: plan.display_name,
                        price: plan.price,
                        currency: plan.currency,
                        max_events: plan.max_events,
                        max_routes: plan.max_routes,
                        can_create_public: plan.can_create_public,
                        can_export: plan.can_export,
                        priority_support: plan.priority_support,
                        description: plan.description
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        }

        // INSERT підписки (assignFreePlan / upgradePlan)
        if (trimmedSql.startsWith('INSERT') && trimmedSql.includes('user_subscriptions')) {
            const userId = values[0];
            const planId = values[1];
            const newSub = {
                subscription_id: mockSubscriptionIdCounter++,
                user_id: userId,
                plan_id: planId,
                status: 'active',
                started_at: new Date().toISOString(),
                expires_at: values[2] || null,
                created_at: new Date().toISOString()
            };
            mockSubscriptionsStore[`${userId}:active`] = newSub;
            return Promise.resolve({ rows: [newSub] });
        }

        // UPDATE підписки (деактивація при upgrade)
        if (trimmedSql.startsWith('UPDATE') && trimmedSql.includes('user_subscriptions')) {
            const userId = values[0];
            const key = `${userId}:active`;
            if (mockSubscriptionsStore[key]) {
                mockSubscriptionsStore[key].status = 'cancelled';
                delete mockSubscriptionsStore[key];
            }
            return Promise.resolve({ rows: [] });
        }

        // --- Обробка запитів для notification_schedule ---

        // SELECT нагадувань для юзера (GET /:userId/reminders)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('notification_schedule') && trimmedSql.includes('ns.user_id')) {
            const userId = values[0];
            const userReminders = Object.values(mockScheduleStore).filter(r => r.user_id == userId);
            return Promise.resolve({
                rows: userReminders.map(r => ({
                    ...r,
                    event_title: 'Тестова подія',
                    event_day: '2026-12-25',
                    start_time: '18:00'
                }))
            });
        }

        // INSERT нагадування (POST /reminders) — UPSERT
        if (trimmedSql.startsWith('INSERT') && trimmedSql.includes('notification_schedule')) {
            const eventId = values[0];
            const userId = values[1];
            const remindAt = values[2];
            const type = values[3];
            const channel = values[4] || 'all';
            const key = `${eventId}:${userId}:${type}`;

            if (mockScheduleStore[key]) {
                // ON CONFLICT — update
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

        // DELETE нагадування (DELETE /reminders/:scheduleId)
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

        // SELECT подію за ID (для POST /reminders — отримання event_day/start_time)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('events') && trimmedSql.includes('event_id') && !trimmedSql.includes('user_id')) {
            const eventId = values[0];
            if (parseInt(eventId) === 1) {
                return Promise.resolve({
                    rows: [{
                        event_id: 1,
                        title: 'Тестова подія',
                        event_day: '2026-12-25',
                        start_time: '18:00:00'
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        }

        // --- Обробка запитів для user_settings ---

        // SELECT (отримання налаштування)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('user_settings')) {
            const userId = values[0];
            const key = values[1];
            const storeKey = `${userId}:${key}`;

            if (mockSettingsStore[storeKey]) {
                return Promise.resolve({
                    rows: [{ setting_value: mockSettingsStore[storeKey] }]
                });
            }
            return Promise.resolve({ rows: [] });
        }

        // INSERT ON CONFLICT (UPSERT — збереження налаштування)
        if (trimmedSql.startsWith('INSERT') && trimmedSql.includes('user_settings')) {
            const userId = values[0];
            const key = values[1];
            const value = values[2];
            const storeKey = `${userId}:${key}`;

            mockSettingsStore[storeKey] = value;

            return Promise.resolve({
                rows: [{
                    setting_id: 1,
                    user_id: userId,
                    setting_key: key,
                    setting_value: value,
                    updated_at: new Date().toISOString()
                }]
            });
        }

        // --- Обробка запитів для users ---

        // SELECT користувача за ID
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('users') && trimmedSql.includes('user_id')) {
            const userId = values[0];
            // Імітуємо: юзер з ID=1 існує, решта — ні
            if (parseInt(userId) === 1) {
                return Promise.resolve({
                    rows: [{
                        user_id: 1,
                        username: 'testuser',
                        email: 'test@example.com',
                        role: 'user',
                        password_hash: '$2b$10$fakehash',
                        created_at: '2026-01-01T00:00:00.000Z'
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        }

        // UPDATE користувача (профіль)
        if (trimmedSql.startsWith('UPDATE') && trimmedSql.includes('users')) {
            const lastValue = values[values.length - 1]; // user_id — завжди останній параметр
            if (parseInt(lastValue) === 1) {
                return Promise.resolve({
                    rows: [{
                        user_id: 1,
                        username: values[0] || 'testuser',
                        email: values[1] || 'test@example.com',
                        role: values[2] || 'user',
                        created_at: '2026-01-01T00:00:00.000Z'
                    }]
                });
            }
            return Promise.resolve({ rows: [] });
        }

        // --- Обробка запитів для events (існуюча логіка) ---
        if (trimmedSql.startsWith('INSERT')) {
            return Promise.resolve({
                rows: [{
                    event_id: 1,
                    title: values[0],
                    description: values[1],
                    event_day: values[2],
                    start_time: values[3],
                    end_time: values[4],
                    latitude: values[5],
                    longitude: values[6],
                    category_id: values[7],
                    creator_id: values[8],
                    region: values[9],
                    is_private: values[10],
                    price: values[11],
                    currency: values[12]
                }]
            });
        }

        return Promise.resolve({ rows: [] });
    }),
    connect: jest.fn()
}));

const app = require('../server');

// Очищаємо in-memory store між тестами
beforeEach(() => {
    Object.keys(mockSettingsStore).forEach(key => delete mockSettingsStore[key]);
    Object.keys(mockScheduleStore).forEach(key => delete mockScheduleStore[key]);
    mockScheduleIdCounter = 1;
    Object.keys(mockSubscriptionsStore).forEach(key => delete mockSubscriptionsStore[key]);
    mockSubscriptionIdCounter = 1;
});

// =======================================================
// ТЕСТУВАННЯ ФОРМИ СТВОРЕННЯ ПОДІЇ (POST /events)
// =======================================================

describe('Тестування обробки даних з форми створення події', () => {

    it('TC-01: Форма успішно відправляється з валідними даними', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: "Вечірня прогулянка містом",
                description: "Запрошую на цікаву екскурсію історичним центром.",
                event_day: "2026-05-20",
                start_time: "18:00",
                end_time: "20:00",
                latitude: 49.8397,
                longitude: 24.0297,
                category_id: 1,
                creator_id: 1,
                region: "Львівська область",
                is_private: false,
                price: 150,
                currency: "UAH"
            });

        // Очікуємо 201 (Created)
        expect(res.statusCode).toEqual(201);
        expect(res.body.title).toEqual("Вечірня прогулянка містом");
    });

    it('TC-02: Форма відхиляється, якщо назва коротша за 5 символів', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: "Бал",
                region: "Львівська область"
            });

        expect(res.statusCode).toEqual(400);
        // Змінено текст, щоб він збігався з твоїм бекендом:
        expect(res.body.error).toContain("Назва коротка");
    });

    it('TC-03: Форма відхиляється, якщо не вибрано "Область"', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: "Великий концерт",
                creator_id: 1
            });

        expect(res.statusCode).toEqual(400);
        // Змінено текст, щоб він збігався з твоїм бекендом:
        expect(res.body.error).toContain("Вкажіть область");
    });

    it('TC-04: Форма відхиляється, якщо введено від\'ємну ціну', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: "Платна виставка",
                region: "Київська область",
                price: -50
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Ціна не може бути від'ємною");
    });

});

// =======================================================
// ТЕСТУВАННЯ ВАЛЮТНИХ НАЛАШТУВАНЬ (GET/PUT /api/settings)
// =======================================================

describe('Тестування збереження валютних налаштувань', () => {

    it('TC-05: Успішне збереження валюти користувача (PUT)', async () => {
        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'USD' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.currency).toEqual('USD');
        expect(res.body.msg).toContain('збережено');
    });

    it('TC-06: Отримання збереженої валюти (GET)', async () => {
        // Спочатку зберігаємо
        await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'EUR' });

        // Потім отримуємо
        const res = await request(app)
            .get('/api/settings/1/currency');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.currency).toEqual('EUR');
        expect(res.body.data.user_id).toEqual(1);
    });

    it('TC-07: Відхилення невалідної валюти (PUT → 400)', async () => {
        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'BTC' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Непідтримувана валюта');
    });

    it('TC-08: Повернення дефолту (UAH) якщо налаштувань ще немає', async () => {
        const res = await request(app)
            .get('/api/settings/999/currency');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.currency).toEqual('UAH');
    });

    it('TC-09: Отримання списку підтримуваних валют', async () => {
        const res = await request(app)
            .get('/api/settings/currencies');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3);

        const uah = res.body.data.find(c => c.code === 'UAH');
        expect(uah).toBeDefined();
        expect(uah.label).toContain('Гривня');
        expect(uah.rate).toEqual(1);
    });

});

// =======================================================
// ТЕСТУВАННЯ МОВНИХ НАЛАШТУВАНЬ (GET/PUT /api/settings)
// =======================================================

describe('Тестування збереження мовних налаштувань', () => {

    it('TC-10: Успішне збереження мови користувача (PUT)', async () => {
        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'en' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.language).toEqual('en');
        expect(res.body.msg).toContain('збережено');
    });

    it('TC-11: Отримання збереженої мови (GET)', async () => {
        await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'pl' });

        const res = await request(app)
            .get('/api/settings/1/language');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.language).toEqual('pl');
        expect(res.body.data.user_id).toEqual(1);
    });

    it('TC-12: Відхилення невалідної мови (PUT → 400)', async () => {
        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'jp' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Непідтримувана мова');
    });

    it('TC-13: Повернення дефолту (uk) якщо мову ще не обрано', async () => {
        const res = await request(app)
            .get('/api/settings/999/language');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.language).toEqual('uk');
    });

    it('TC-14: Отримання списку підтримуваних мов', async () => {
        const res = await request(app)
            .get('/api/settings/languages');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.data.length).toBeGreaterThanOrEqual(3);

        const uk = res.body.data.find(l => l.code === 'uk');
        expect(uk).toBeDefined();
        expect(uk.label).toEqual('Українська');
    });

});

// =======================================================
// ТЕСТУВАННЯ НАЛАШТУВАНЬ ПРОФІЛЮ (GET/PUT /api/users/:id)
// =======================================================

describe('Тестування налаштувань профілю користувача', () => {

    it('TC-15: Отримання профілю існуючого користувача (GET)', async () => {
        const res = await request(app)
            .get('/api/users/1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.id).toEqual(1);
        expect(res.body.username).toEqual('testuser');
        expect(res.body.email).toEqual('test@example.com');
        expect(res.body.role).toEqual('user');
    });

    it('TC-16: Профіль неіснуючого користувача повертає 404', async () => {
        const res = await request(app)
            .get('/api/users/999');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toBeDefined();
    });

    it('TC-17: Успішне оновлення профілю (PUT)', async () => {
        const res = await request(app)
            .put('/api/users/1')
            .send({ username: 'new_name', email: 'new@example.com' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toContain('оновлено');
        expect(res.body.user).toBeDefined();
        expect(res.body.user.username).toEqual('new_name');
    });

    it('TC-18: Оновлення без даних повертає 400', async () => {
        const res = await request(app)
            .put('/api/users/1')
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Немає даних');
    });

    it('TC-19: DTO приховує password_hash від клієнта (GET)', async () => {
        const res = await request(app)
            .get('/api/users/1');

        expect(res.statusCode).toEqual(200);
        // UserDTO НЕ повинен повертати хеш пароля
        expect(res.body.password_hash).toBeUndefined();
        // Але має повертати безпечні поля
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBeDefined();
    });

});

// =======================================================
// ТЕСТУВАННЯ ПЛАНУВАЛЬНИКА ПОДІЙ (SCHEDULER / QUEUE)
// ПАТЕРН: Observer — тестуємо підписку, отримання, скасування нагадувань
// =======================================================

describe('Тестування планувальника сповіщень (Scheduler)', () => {

    it('TC-20: Підписка на нагадування про подію (POST /reminders)', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({
                event_id: 1,
                user_id: 1,
                type: '24h',
                channel: 'all'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.msg).toContain('Нагадування заплановано');
        expect(res.body.reminder).toBeDefined();
        expect(res.body.reminder.event_id).toEqual(1);
        expect(res.body.reminder.user_id).toEqual(1);
        expect(res.body.reminder.type).toEqual('24h');
        expect(res.body.reminder.status).toEqual('pending');
        expect(res.body.event_title).toEqual('Тестова подія');
        expect(res.body.strategy).toBeDefined();
    });

    it('TC-21: Відхилення нагадування без event_id або user_id (POST → 400)', async () => {
        const res = await request(app)
            .post('/api/notifications/reminders')
            .send({ type: '1h' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('event_id');
    });

    it('TC-22: Отримання запланованих нагадувань (GET /:userId/reminders)', async () => {
        // Спочатку створюємо нагадування
        await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h' });

        // Отримуємо список
        const res = await request(app)
            .get('/api/notifications/1/reminders');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.reminders).toBeInstanceOf(Array);
        expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('TC-23: Скасування нагадування (DELETE /reminders/:scheduleId)', async () => {
        // Спочатку створюємо
        const createRes = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '1h' });

        const scheduleId = createRes.body.reminder.schedule_id;

        // Видаляємо
        const res = await request(app)
            .delete(`/api/notifications/reminders/${scheduleId}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toContain('скасовано');
        expect(res.body.deleted).toBeDefined();
    });

    it('TC-24: Отримання статусу планувальника (GET /scheduler/status)', async () => {
        const res = await request(app)
            .get('/api/notifications/scheduler/status');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.scheduler).toBeDefined();
        expect(res.body.scheduler.isProcessing).toBeDefined();
        expect(res.body.available_types).toBeInstanceOf(Array);
        expect(res.body.available_types.length).toBeGreaterThanOrEqual(3);

        // Перевіряємо що всі 3 типи нагадувань доступні
        const types = res.body.available_types.map(t => t.type);
        expect(types).toContain('24h');
        expect(types).toContain('1h');
        expect(types).toContain('on_start');
    });

    it('TC-25: Захист від дублікатів — повторний POST оновлює, а не створює', async () => {
        // Перше нагадування
        const first = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'email' });

        expect(first.statusCode).toEqual(201);

        // Повторне — з іншим каналом
        const second = await request(app)
            .post('/api/notifications/reminders')
            .send({ event_id: 1, user_id: 1, type: '24h', channel: 'in_app' });

        expect(second.statusCode).toEqual(201);

        // Перевіряємо що schedule_id такий самий (оновлення, не дублікат)
        expect(second.body.reminder.schedule_id).toEqual(first.body.reminder.schedule_id);
        // Але канал оновився
        expect(second.body.reminder.channel).toEqual('in_app');
    });

});

// =======================================================
// ТЕСТУВАННЯ СТРУКТУРИ ПІДПИСОК (SUBSCRIPTION PLANS)
// ПАТЕРН: Strategy — різні тарифи = різні стратегії доступу
// =======================================================

describe('Тестування структури підписок (Subscriptions)', () => {

    it('TC-26: Отримання списку тарифних планів (GET /plans)', async () => {
        const res = await request(app)
            .get('/api/subscriptions/plans');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data).toBeInstanceOf(Array);
        expect(res.body.count).toBeGreaterThanOrEqual(1);
    });

    it('TC-27: Список містить 3 плани (free, pro, premium)', async () => {
        const res = await request(app)
            .get('/api/subscriptions/plans');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.length).toEqual(3);

        const names = res.body.data.map(p => p.name);
        expect(names).toContain('free');
        expect(names).toContain('pro');
        expect(names).toContain('premium');

        // Перевіряємо, що плани відсортовані за ціною (ASC)
        const prices = res.body.data.map(p => p.price);
        expect(prices[0]).toBeLessThanOrEqual(prices[1]);
        expect(prices[1]).toBeLessThanOrEqual(prices[2]);
    });

    it('TC-28: Отримання підписки існуючого користувача (GET /:userId)', async () => {
        // Спочатку створюємо підписку для юзера 1
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);

        const res = await request(app)
            .get('/api/subscriptions/1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.plan_name).toEqual('free');
        expect(res.body.data.status).toEqual('active');
        expect(res.body.data.max_events).toEqual(5);
        expect(res.body.data.max_routes).toEqual(1);
    });

    it('TC-29: Автоматичне призначення Free для нового юзера', async () => {
        const SubscriptionService = require('../services/SubscriptionService');
        const result = await SubscriptionService.assignFreePlan(42);

        expect(result).toBeDefined();
        expect(result.user_id).toEqual(42);
        expect(result.plan_id).toEqual(1); // Free = plan_id 1
        expect(result.status).toEqual('active');
        expect(result.expires_at).toBeNull(); // Free — безстроковий
    });

    it('TC-30: Оновлення тарифу до Pro (POST /upgrade)', async () => {
        // Спочатку призначаємо Free
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);

        const res = await request(app)
            .post('/api/subscriptions/1/upgrade')
            .send({ plan: 'pro' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.msg).toContain('Професійний');
        expect(res.body.data.plan.name).toEqual('pro');
        expect(res.body.data.plan.max_events).toEqual(50);
        expect(res.body.data.plan.can_create_public).toEqual(true);
    });

    it('TC-31: Відхилення невалідного тарифу (POST → 400)', async () => {
        const res = await request(app)
            .post('/api/subscriptions/1/upgrade')
            .send({ plan: 'enterprise' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Невалідний тариф');
    });

    it('TC-32: Підписка неіснуючого юзера → 404', async () => {
        const res = await request(app)
            .get('/api/subscriptions/999');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toContain('не знайдено');
    });

    it('TC-33: Перевірка лімітів тарифу Free (checkFeatureAccess)', async () => {
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);

        // Free не має доступу до публічних подій
        const publicAccess = await SubscriptionService.checkFeatureAccess(1, 'create_public');
        expect(publicAccess.allowed).toEqual(false);
        expect(publicAccess.plan).toEqual('free');

        // Free не має доступу до експорту
        const exportAccess = await SubscriptionService.checkFeatureAccess(1, 'export');
        expect(exportAccess.allowed).toEqual(false);

        // Free не має пріоритетної підтримки
        const supportAccess = await SubscriptionService.checkFeatureAccess(1, 'priority_support');
        expect(supportAccess.allowed).toEqual(false);
    });

});