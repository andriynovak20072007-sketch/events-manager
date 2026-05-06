const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });

// google-auth-library мокається автоматично через __mocks__/google-auth-library.js

// Внутрішнє сховище для імітації таблиці user_settings (In-Memory)
const settingsStore = {};

jest.mock('../db', () => ({
    query: jest.fn((sql, values) => {
        const trimmedSql = typeof sql === 'string' ? sql.trim() : '';

        // --- Обробка запитів для user_settings ---

        // SELECT (отримання налаштування)
        if (trimmedSql.startsWith('SELECT') && trimmedSql.includes('user_settings')) {
            const userId = values[0];
            const key = values[1];
            const storeKey = `${userId}:${key}`;
            
            if (settingsStore[storeKey]) {
                return Promise.resolve({
                    rows: [{ setting_value: settingsStore[storeKey] }]
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
            
            settingsStore[storeKey] = value;
            
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
    Object.keys(settingsStore).forEach(key => delete settingsStore[key]);
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