const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });

// Мокаємо middleware upload
jest.mock('../middleware/upload', () => {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() });
});

// Мокаємо pool (БД)
jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

// =======================================================
// МОК ГЛОБАЛЬНОГО fetch (для Overpass API)
// =======================================================
const originalFetch = global.fetch;

beforeEach(() => {
    jest.clearAllMocks();
    // Очищаємо кеш HotelService перед кожним тестом,
    // щоб закешовані результати не впливали на інші тести
    const hotelService = require('../services/HotelService');
    hotelService.clearCache();
});

afterAll(() => {
    global.fetch = originalFetch;
});

const app = require('../server');

// =======================================================
// ТЕСТУВАННЯ МОДУЛЯ ГОТЕЛІВ — ПЕРЕГЛЯД (GET /api/hotels)
// =======================================================
describe('Тестування перегляду готелів (GET /api/hotels)', () => {

    it('TC-H01: Успішний пошук готелів за координатами', async () => {
        // Мокаємо Overpass API відповідь
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    elements: [
                        {
                            id: 1001,
                            lat: 49.8400,
                            lon: 24.0300,
                            tags: {
                                name: "Готель Дністер",
                                website: "https://www.dnister.lviv.ua"
                            }
                        },
                        {
                            id: 1002,
                            lat: 49.8420,
                            lon: 24.0280,
                            tags: {
                                name: "Готель Леополіс",
                                website: "www.leopolis.com.ua"
                            }
                        }
                    ]
                })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.8397, lng: 24.0297 });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(2);

        // Перевіряємо формат першого готелю
        const hotel = res.body[0];
        expect(hotel.id).toEqual(1001);
        expect(hotel.name).toEqual("Готель Дністер");
        expect(hotel.lat).toEqual(49.84);
        expect(hotel.lng).toEqual(24.03);
        expect(hotel.website).toEqual("https://www.dnister.lviv.ua");
        expect(hotel.bookingLink).toContain("booking.com");
        expect(hotel.bookingLink).toContain(encodeURIComponent("Готель Дністер"));
    });

    it('TC-H02: URL без протоколу автоматично отримує https://', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    elements: [
                        {
                            id: 2001,
                            lat: 50.45,
                            lon: 30.52,
                            tags: {
                                name: "Готель Київ",
                                website: "www.hotelkyiv.com"
                            }
                        }
                    ]
                })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 50.4501, lng: 30.5234 });

        expect(res.statusCode).toEqual(200);
        // Перевіряємо, що URL було автоматично доповнено протоколом
        expect(res.body[0].website).toEqual("https://www.hotelkyiv.com");
    });

    it('TC-H03: Готель без назви отримує значення за замовчуванням', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    elements: [
                        {
                            id: 3001,
                            lat: 48.92,
                            lon: 24.71,
                            tags: {} // Немає тегу name
                        }
                    ]
                })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 48.9226, lng: 24.7111 });

        expect(res.statusCode).toEqual(200);
        expect(res.body[0].name).toEqual("Готель (назва не вказана)");
    });

    it('TC-H04: Готель без сайту — website дорівнює null', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    elements: [
                        {
                            id: 4001,
                            lat: 49.23,
                            lon: 28.47,
                            tags: {
                                name: "Готель без сайту"
                                // website відсутній
                            }
                        }
                    ]
                })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.2328, lng: 28.4682 });

        expect(res.statusCode).toEqual(200);
        expect(res.body[0].website).toBeNull();
    });

    it('TC-H05: Некоректний URL сайту — website дорівнює null', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    elements: [
                        {
                            id: 5001,
                            lat: 46.48,
                            lon: 30.73,
                            tags: {
                                name: "Готель Одеса",
                                website: "немає сайту" // Некоректний URL
                            }
                        }
                    ]
                })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 46.4825, lng: 30.7233 });

        expect(res.statusCode).toEqual(200);
        expect(res.body[0].website).toBeNull();
    });

    it('TC-H06: Пошук з кастомним радіусом', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ elements: [] })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.8397, lng: 24.0297, radius: 5000 });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);

        // Перевіряємо, що fetch був викликаний з правильним радіусом
        const fetchUrl = global.fetch.mock.calls[0][0];
        expect(fetchUrl).toContain('5000');
    });

    it('TC-H07: Порожній список — жодного готелю не знайдено', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ elements: [] })
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 70.0000, lng: 25.0000 }); // Арктика — нема готелів

        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual([]);
    });
});

// =======================================================
// ТЕСТУВАННЯ ВАЛІДАЦІЇ ПАРАМЕТРІВ (GET /api/hotels)
// =======================================================
describe('Тестування валідації параметрів готелів', () => {

    it('TC-H08: Помилка 400, якщо не вказано lat', async () => {
        const res = await request(app)
            .get('/api/hotels')
            .query({ lng: 24.0297 }); // lat не передано

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Не вказані координати");
    });

    it('TC-H09: Помилка 400, якщо не вказано lng', async () => {
        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.8397 }); // lng не передано

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Не вказані координати");
    });

    it('TC-H10: Помилка 400, якщо координати не передані взагалі', async () => {
        const res = await request(app)
            .get('/api/hotels');

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Не вказані координати");
    });
});

// =======================================================
// ТЕСТУВАННЯ ПОМИЛОК ЗОВНІШНЬОГО API (GET /api/hotels)
// =======================================================
describe('Тестування помилок зовнішнього API (Overpass)', () => {

    it('TC-H11: Помилка 500, якщо Overpass API повертає помилку', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: false,
                statusText: "Service Unavailable"
            })
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.8397, lng: 24.0297 });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toContain("Внутрішня помилка сервера");
    });

    it('TC-H12: Помилка 500, якщо fetch впав з мережевою помилкою', async () => {
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('Network error'))
        );

        const res = await request(app)
            .get('/api/hotels')
            .query({ lat: 49.8397, lng: 24.0297 });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toContain("Внутрішня помилка сервера");
    });
});

// =======================================================
// ТЕСТУВАННЯ ВИДАЛЕННЯ ГОТЕЛЮ (DELETE /api/hotels/:id)
// =======================================================
describe('Тестування видалення готелю (DELETE /api/hotels/:id)', () => {

    it('TC-H13: Успішне видалення готелю зі списку', async () => {
        const res = await request(app)
            .delete('/api/hotels/1001');

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain("успішно видалено");
        expect(res.body.deletedId).toEqual("1001");
    });

    it('TC-H14: Видалення готелю з іншим ID', async () => {
        const res = await request(app)
            .delete('/api/hotels/9999');

        expect(res.statusCode).toEqual(200);
        expect(res.body.deletedId).toEqual("9999");
    });
});
