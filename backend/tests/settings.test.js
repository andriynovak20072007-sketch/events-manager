const request = require('supertest');

// Мокаємо cron, щоб не підключався до БД
jest.mock('../cron/cleanup', () => { });

// Мокаємо middleware upload
jest.mock('../middleware/upload', () => {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() });
});

// =======================================================
// МОК БАЗИ ДАНИХ
// =======================================================
jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

const pool = require('../db');

// =======================================================
// МОК SettingsRepository
// =======================================================
jest.mock('../repositories/SettingsRepository', () => ({
    get: jest.fn(),
    set: jest.fn()
}));

const settingsRepo = require('../repositories/SettingsRepository');

const app = require('../server');

// =======================================================
// Скидаємо моки перед кожним тестом
// =======================================================
beforeEach(() => {
    jest.clearAllMocks();
});

// =======================================================
// 1. GET /api/settings/currencies — Список підтримуваних валют
// =======================================================
describe('Тестування списку валют (GET /api/settings/currencies)', () => {

    it('TC-S01: Успішне отримання списку підтримуваних валют', async () => {
        const res = await request(app).get('/api/settings/currencies');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Перевіряємо структуру кожного запису
        const currency = res.body.data[0];
        expect(currency).toHaveProperty('code');
        expect(currency).toHaveProperty('rate');
        expect(currency).toHaveProperty('label');
    });

    it('TC-S02: Список містить UAH, USD, EUR', async () => {
        const res = await request(app).get('/api/settings/currencies');

        expect(res.statusCode).toEqual(200);
        const codes = res.body.data.map(c => c.code);
        expect(codes).toContain('UAH');
        expect(codes).toContain('USD');
        expect(codes).toContain('EUR');
    });
});

// =======================================================
// 2. GET /api/settings/:userId/currency — Отримати валюту
// =======================================================
describe('Тестування отримання валюти користувача (GET /api/settings/:userId/currency)', () => {

    it('TC-S03: Успішне отримання збереженої валюти', async () => {
        settingsRepo.get.mockResolvedValueOnce('USD');

        const res = await request(app).get('/api/settings/1/currency');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.user_id).toEqual(1);
        expect(res.body.data.currency).toEqual('USD');

        // Перевіряємо, що репозиторій було викликано з правильними параметрами
        expect(settingsRepo.get).toHaveBeenCalledWith('1', 'currency', 'UAH');
    });

    it('TC-S04: Якщо валюта не збережена — повертається UAH за замовчуванням', async () => {
        // Мок повертає defaultValue (UAH)
        settingsRepo.get.mockResolvedValueOnce('UAH');

        const res = await request(app).get('/api/settings/5/currency');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.currency).toEqual('UAH');
    });

    it('TC-S05: Помилка 400, якщо userId не є числом', async () => {
        const res = await request(app).get('/api/settings/abc/currency');

        expect(res.statusCode).toEqual(400);
    });

    it('TC-S06: Помилка 500, якщо репозиторій кидає виключення', async () => {
        settingsRepo.get.mockRejectedValueOnce(new Error('DB error'));

        const res = await request(app).get('/api/settings/1/currency');

        expect(res.statusCode).toEqual(500);
    });
});

// =======================================================
// 3. PUT /api/settings/:userId/currency — Зберегти валюту
// =======================================================
describe('Тестування збереження валюти (PUT /api/settings/:userId/currency)', () => {

    it('TC-S07: Успішна зміна валюти на USD', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'USD',
            updated_at: '2026-05-21T10:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'USD' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.msg).toContain('Валютні налаштування збережено');
        expect(res.body.data.currency).toEqual('USD');
        expect(res.body.data.user_id).toEqual(1);
        expect(res.body.data.updated_at).toBeDefined();

        // Перевіряємо UPSERT-виклик
        expect(settingsRepo.set).toHaveBeenCalledWith('1', 'currency', 'USD');
    });

    it('TC-S08: Успішна зміна валюти на EUR', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'EUR',
            updated_at: '2026-05-21T10:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/2/currency')
            .send({ currency: 'EUR' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.currency).toEqual('EUR');
    });

    it('TC-S09: Зміна в нижньому регістрі — "usd" → зберігається як "USD"', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'USD',
            updated_at: '2026-05-21T10:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'usd' }); // нижній регістр

        expect(res.statusCode).toEqual(200);
        // Перевіряємо, що set викликано з верхнім регістром
        expect(settingsRepo.set).toHaveBeenCalledWith('1', 'currency', 'USD');
    });

    it('TC-S10: Помилка 400 — не вказано валюту', async () => {
        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Не вказано валюту');
    });

    it('TC-S11: Помилка 400 — непідтримувана валюта "GBP"', async () => {
        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'GBP' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Непідтримувана валюта');
        expect(res.body.error).toContain('GBP');
    });

    it('TC-S12: Помилка 400 — userId не є числом', async () => {
        const res = await request(app)
            .put('/api/settings/xyz/currency')
            .send({ currency: 'USD' });

        expect(res.statusCode).toEqual(400);
    });

    it('TC-S13: Помилка 500 — збій БД при збереженні валюти', async () => {
        settingsRepo.set.mockRejectedValueOnce(new Error('DB write failed'));

        const res = await request(app)
            .put('/api/settings/1/currency')
            .send({ currency: 'USD' });

        expect(res.statusCode).toEqual(500);
    });
});

// =======================================================
// 4. GET /api/settings/languages — Список підтримуваних мов
// =======================================================
describe('Тестування списку мов (GET /api/settings/languages)', () => {

    it('TC-S14: Успішне отримання списку підтримуваних мов', async () => {
        const res = await request(app).get('/api/settings/languages');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Перевіряємо структуру
        const lang = res.body.data[0];
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('label');
    });

    it('TC-S15: Список містить uk, en, pl', async () => {
        const res = await request(app).get('/api/settings/languages');

        expect(res.statusCode).toEqual(200);
        const codes = res.body.data.map(l => l.code);
        expect(codes).toContain('uk');
        expect(codes).toContain('en');
        expect(codes).toContain('pl');
    });
});

// =======================================================
// 5. GET /api/settings/:userId/language — Отримати мову
// =======================================================
describe('Тестування отримання мови користувача (GET /api/settings/:userId/language)', () => {

    it('TC-S16: Успішне отримання збереженої мови', async () => {
        settingsRepo.get.mockResolvedValueOnce('en');

        const res = await request(app).get('/api/settings/3/language');

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.data.user_id).toEqual(3);
        expect(res.body.data.language).toEqual('en');

        expect(settingsRepo.get).toHaveBeenCalledWith('3', 'language', 'uk');
    });

    it('TC-S17: Якщо мова не збережена — повертається "uk" за замовчуванням', async () => {
        settingsRepo.get.mockResolvedValueOnce('uk');

        const res = await request(app).get('/api/settings/7/language');

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.language).toEqual('uk');
    });

    it('TC-S18: Помилка 400 — userId не є числом', async () => {
        const res = await request(app).get('/api/settings/notAnId/language');

        expect(res.statusCode).toEqual(400);
    });

    it('TC-S19: Помилка 500 — збій репозиторію при отриманні мови', async () => {
        settingsRepo.get.mockRejectedValueOnce(new Error('Connection timeout'));

        const res = await request(app).get('/api/settings/1/language');

        expect(res.statusCode).toEqual(500);
    });
});

// =======================================================
// 6. PUT /api/settings/:userId/language — Зберегти мову
// =======================================================
describe('Тестування збереження мови (PUT /api/settings/:userId/language)', () => {

    it('TC-S20: Успішна зміна мови на "en"', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'en',
            updated_at: '2026-05-21T11:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'en' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toEqual('success');
        expect(res.body.msg).toContain('Мовні налаштування збережено');
        expect(res.body.data.language).toEqual('en');
        expect(res.body.data.user_id).toEqual(1);
        expect(res.body.data.updated_at).toBeDefined();

        expect(settingsRepo.set).toHaveBeenCalledWith('1', 'language', 'en');
    });

    it('TC-S21: Успішна зміна мови на "pl"', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'pl',
            updated_at: '2026-05-21T11:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/4/language')
            .send({ language: 'pl' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.language).toEqual('pl');
    });

    it('TC-S22: Мова у верхньому регістрі "EN" → зберігається як "en"', async () => {
        settingsRepo.set.mockResolvedValueOnce({
            setting_value: 'en',
            updated_at: '2026-05-21T11:00:00.000Z'
        });

        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'EN' }); // верхній регістр

        expect(res.statusCode).toEqual(200);
        // Перевіряємо, що set викликано з нижнім регістром
        expect(settingsRepo.set).toHaveBeenCalledWith('1', 'language', 'en');
    });

    it('TC-S23: Помилка 400 — не вказано мову', async () => {
        const res = await request(app)
            .put('/api/settings/1/language')
            .send({});

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Не вказано мову');
    });

    it('TC-S24: Помилка 400 — непідтримувана мова "de"', async () => {
        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'de' });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain('Непідтримувана мова');
        expect(res.body.error).toContain('de');
    });

    it('TC-S25: Помилка 400 — userId не є числом', async () => {
        const res = await request(app)
            .put('/api/settings/invalid/language')
            .send({ language: 'uk' });

        expect(res.statusCode).toEqual(400);
    });

    it('TC-S26: Помилка 500 — збій БД при збереженні мови', async () => {
        settingsRepo.set.mockRejectedValueOnce(new Error('DB write failed'));

        const res = await request(app)
            .put('/api/settings/1/language')
            .send({ language: 'en' });

        expect(res.statusCode).toEqual(500);
    });
});
