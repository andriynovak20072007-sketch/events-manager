const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });

// Мокаємо middleware upload
jest.mock('../middleware/upload', () => {
    const multer = require('multer');
    return multer({ storage: multer.memoryStorage() });
});

// =======================================================
// МОК БАЗИ ДАНИХ
// Імітуємо pool.query та pool.connect для транзакцій
// =======================================================
const mockClient = {
    query: jest.fn(),
    release: jest.fn()
};

jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn(() => Promise.resolve(mockClient))
}));

const pool = require('../db');
const app = require('../server');

// =======================================================
// Скидаємо моки перед кожним тестом
// =======================================================
beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
});

// =======================================================
// ТЕСТУВАННЯ ПОБУДОВИ МАРШРУТУ (POST /api/routes)
// =======================================================
describe('Тестування побудови маршруту (POST /api/routes)', () => {

    it('TC-R01: Маршрут успішно створюється з валідними даними', async () => {
        // Налаштовуємо мок-клієнт для транзакції
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ route_id: 42 }] }) // INSERT routes
            .mockResolvedValueOnce({}) // INSERT route_events #1
            .mockResolvedValueOnce({}) // INSERT route_events #2
            .mockResolvedValueOnce({}) // INSERT route_events #3
            .mockResolvedValueOnce({}); // COMMIT

        const res = await request(app)
            .post('/api/routes')
            .send({
                route_name: "Львівська екскурсія",
                creator_id: 1,
                event_ids: [10, 20, 30]
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.message).toContain("Маршрут успішно створено");
        expect(res.body.route_id).toEqual(42);

        // Перевіряємо, що транзакція відбулась правильно
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('TC-R02: Помилка, якщо не вказано назву маршруту', async () => {
        const res = await request(app)
            .post('/api/routes')
            .send({
                creator_id: 1,
                event_ids: [10, 20]
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Неповні дані для створення маршруту");
    });

    it('TC-R03: Помилка, якщо не вказано creator_id', async () => {
        const res = await request(app)
            .post('/api/routes')
            .send({
                route_name: "Тестовий маршрут",
                event_ids: [10, 20]
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Неповні дані для створення маршруту");
    });

    it('TC-R04: Помилка, якщо event_ids не є масивом', async () => {
        const res = await request(app)
            .post('/api/routes')
            .send({
                route_name: "Тестовий маршрут",
                creator_id: 1,
                event_ids: "10,20,30" // Невірний формат — рядок замість масиву
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Неповні дані для створення маршруту");
    });

    it('TC-R05: Помилка, якщо event_ids відсутній', async () => {
        const res = await request(app)
            .post('/api/routes')
            .send({
                route_name: "Тестовий маршрут",
                creator_id: 1
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Неповні дані для створення маршруту");
    });

    it('TC-R06: Серверна помилка при збої БД під час створення маршруту', async () => {
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockRejectedValueOnce(new Error('DB connection lost')); // INSERT fails

        const res = await request(app)
            .post('/api/routes')
            .send({
                route_name: "Маршрут з помилкою",
                creator_id: 1,
                event_ids: [10, 20]
            });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toContain("Не вдалося створити маршрут");

        // Перевіряємо, що ROLLBACK було викликано
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });
});

// =======================================================
// ТЕСТУВАННЯ ОТРИМАННЯ МАРШРУТУ (GET /api/routes/:id)
// =======================================================
describe('Тестування перегляду маршруту (GET /api/routes/:id)', () => {

    it('TC-R07: Успішне отримання маршруту за ID', async () => {
        pool.query.mockResolvedValueOnce({
            rows: [
                {
                    route_name: "Культурний Львів",
                    order_index: 1,
                    event_id: 10,
                    title: "Оперний театр",
                    latitude: "49.8440",
                    longitude: "24.0260",
                    event_day: "2026-06-01",
                    start_time: "10:00"
                },
                {
                    route_name: "Культурний Львів",
                    order_index: 2,
                    event_id: 20,
                    title: "Ратуша",
                    latitude: "49.8414",
                    longitude: "24.0318",
                    event_day: "2026-06-01",
                    start_time: "12:00"
                }
            ]
        });

        const res = await request(app).get('/api/routes/1');

        expect(res.statusCode).toEqual(200);
        expect(res.body.name).toEqual("Культурний Львів");
        expect(res.body.waypoints).toHaveLength(2);

        // Перевіряємо формат waypoint
        expect(res.body.waypoints[0]).toEqual({
            event_id: 10,
            title: "Оперний театр",
            lat: 49.844,
            lng: 24.026,
            order: 1
        });

        // Перевіряємо порядок
        expect(res.body.waypoints[0].order).toBeLessThan(res.body.waypoints[1].order);
    });

    it('TC-R08: Маршрут не знайдено — повертає 404', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const res = await request(app).get('/api/routes/999');

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toContain("Маршрут не знайдено");
    });

    it('TC-R09: Серверна помилка при отриманні маршруту', async () => {
        pool.query.mockRejectedValueOnce(new Error('Connection refused'));

        const res = await request(app).get('/api/routes/1');

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toContain("Помилка сервера при завантаженні маршруту");
    });
});

// =======================================================
// ТЕСТУВАННЯ ОНОВЛЕННЯ МАРШРУТУ (PUT /api/routes/:id)
// =======================================================
describe('Тестування оновлення маршруту (PUT /api/routes/:id)', () => {

    it('TC-R10: Маршрут успішно оновлюється', async () => {
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [{ route_id: 1, route_name: "Оновлений маршрут" }] }) // UPDATE routes
            .mockResolvedValueOnce({}) // DELETE old route_events
            .mockResolvedValueOnce({}) // INSERT route_events #1
            .mockResolvedValueOnce({}) // INSERT route_events #2
            .mockResolvedValueOnce({}); // COMMIT

        const res = await request(app)
            .put('/api/routes/1')
            .send({
                route_name: "Оновлений маршрут",
                creator_id: 1,
                event_ids: [30, 40]
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain("Маршрут успішно оновлено");
        expect(mockClient.release).toHaveBeenCalled();
    });

    it('TC-R11: Помилка, якщо маршрут не належить користувачу (403)', async () => {
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockResolvedValueOnce({ rows: [] }); // UPDATE — маршрут не знайдено

        const res = await request(app)
            .put('/api/routes/1')
            .send({
                route_name: "Чужий маршрут",
                creator_id: 999,
                event_ids: [10]
            });

        expect(res.statusCode).toEqual(403);
        expect(res.body.error).toContain("немає прав на його зміну");

        // Перевіряємо що ROLLBACK відбувся
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('TC-R12: Помилка валідації при оновленні — відсутня назва', async () => {
        const res = await request(app)
            .put('/api/routes/1')
            .send({
                creator_id: 1,
                event_ids: [10, 20]
            });

        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toContain("Неповні дані для оновлення маршруту");
    });

    it('TC-R13: Серверна помилка при збої БД під час оновлення', async () => {
        mockClient.query
            .mockResolvedValueOnce({}) // BEGIN
            .mockRejectedValueOnce(new Error('Disk I/O error')); // UPDATE fails

        const res = await request(app)
            .put('/api/routes/1')
            .send({
                route_name: "Маршрут з помилкою",
                creator_id: 1,
                event_ids: [10]
            });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toContain("Не вдалося оновити маршрут");
        expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
        expect(mockClient.release).toHaveBeenCalled();
    });
});
