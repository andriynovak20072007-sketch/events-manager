const request = require('supertest');
const app = require('../server');
const eventRepo = require('../repositories/EventRepository');
const currencyService = require('../services/CurrencyService');
const pool = require('../db');

jest.mock('../cron/cleanup', () => {});
jest.mock('../cron/scheduler', () => {});
jest.mock('../repositories/EventRepository', () => ({
    findAll: jest.fn(),
    findPublicByRegion: jest.fn(),
    findScheduled: jest.fn(),
    findByDateRange: jest.fn()
}));
jest.mock('../services/CurrencyService', () => ({
    convert: jest.fn((price, from, to) => price) // Мок: повертаємо ту ж ціну
}));
jest.mock('../services/TrialService', () => ({
    canCreateEvent: jest.fn()
}));
jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));
// Мокаємо middleware upload
jest.mock('../middleware/upload', () => {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() });
});

describe('Тестування пошуку та фільтрів (search-filters.test.js)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/events (Сортування та базова фільтрація)', () => {
        it('TC-S01: повинен повертати всі події з конвертованими цінами', async () => {
            const mockEvents = [
                { event_id: 1, title: 'Подія А', price: 100, currency: 'UAH', average_rating: 4.5 },
                { event_id: 2, title: 'Подія Б', price: 50, currency: 'USD', average_rating: 4.8 }
            ];
            eventRepo.findAll.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/events');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(2);
            expect(res.body[0].title).toEqual('Подія А');
            // Перевіряємо що відпрацювала функція застосування конвертації
            expect(res.body[0].display_currency).toEqual('UAH'); 
        });

        it('TC-S02: повинен сортувати події за ціною (price_asc)', async () => {
            const mockEvents = [
                { event_id: 1, title: 'Дорога подія', price: 500, currency: 'UAH', average_rating: 4.0 },
                { event_id: 2, title: 'Дешева подія', price: 100, currency: 'UAH', average_rating: 4.5 }
            ];
            eventRepo.findAll.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/events?sort_by=price_asc');

            expect(res.statusCode).toEqual(200);
            expect(res.body[0].title).toEqual('Дешева подія'); // 100 UAH
            expect(res.body[1].title).toEqual('Дорога подія'); // 500 UAH
        });
    });

    describe('GET /api/events/filter', () => {
        it('TC-S03: повинен фільтрувати події за регіоном', async () => {
            const mockEvents = [{ event_id: 1, title: 'Львівська подія', region: 'Львівська область' }];
            eventRepo.findPublicByRegion.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/events/filter?region=Львівська область');

            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockEvents);
            expect(eventRepo.findPublicByRegion).toHaveBeenCalledWith('Львівська область');
        });

        it('TC-S04: повинен повертати 400, якщо регіон не вказано', async () => {
            const res = await request(app).get('/api/events/filter');
            
            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Не вказано регіон');
        });
    });

    describe('GET /api/events/search (Розширений пошук)', () => {
        it('TC-S05: повинен знаходити події за назвою та категорією (Query Builder)', async () => {
            pool.query.mockResolvedValue({
                rows: [{ event_id: 10, title: 'Рок концерт', category_id: 2 }]
            });

            const res = await request(app).get('/api/events/search?title=Рок&category_id=2');

            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(1);
            expect(res.body[0].title).toEqual('Рок концерт');
            // Перевіряємо, що pool.query був викликаний з правильними параметрами (LIKE %Рок% та category_id)
            expect(pool.query).toHaveBeenCalled();
            const callArgs = pool.query.mock.calls[0];
            expect(callArgs[0]).toContain('title ILIKE');
            expect(callArgs[0]).toContain('category_id =');
        });

        it('TC-S06: повинен повертати 404, якщо за пошуком нічого не знайдено', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const res = await request(app).get('/api/events/search?title=НеіснуючаПодія');

            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toContain('За вашим запитом подій не знайдено');
        });
    });

    describe('GET /api/events/calendar (Фільтр за датами)', () => {
        it('TC-S07: повинен правильно групувати події для календаря за діапазоном', async () => {
            const mockEvents = [
                { event_id: 1, title: 'Подія 1', event_day: '2026-06-15T00:00:00.000Z', average_rating: 4 },
                { event_id: 2, title: 'Подія 2', event_day: '2026-06-15T00:00:00.000Z', average_rating: 5 }
            ];
            eventRepo.findByDateRange.mockResolvedValue(mockEvents);

            const res = await request(app).get('/api/events/calendar?from=2026-06-01&to=2026-06-30');

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toEqual('success');
            expect(res.body.total_events).toEqual(2);
            // Групування за датою (2026-06-15)
            expect(res.body.events_by_date['2026-06-15']).toBeDefined();
            expect(res.body.events_by_date['2026-06-15'].length).toEqual(2);
        });

        it('TC-S08: повинен повертати 400 при неправильному форматі дати', async () => {
            const res = await request(app).get('/api/events/calendar?from=01-06-2026&to=30-06-2026');

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Невірний формат дати. Використовуйте YYYY-MM-DD');
        });

        it('TC-S09: повинен повертати 400, якщо from пізніше за to', async () => {
            const res = await request(app).get('/api/events/calendar?from=2026-07-01&to=2026-06-01');

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Дата \'from\' не може бути пізніше за \'to\'');
        });
    });
});
