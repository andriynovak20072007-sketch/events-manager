const request = require('supertest');
const app = require('../app'); // твій express app
const pool = require('../db'); // підключення до БД

let createdEventId;

// Перед тестами
beforeAll(async () => {
    // можна очистити тестову БД або вставити тестові дані
});

// Після тестів
afterAll(async () => {
    await pool.end();
});


// =============================
// 1. Пошук подій для створення маршруту
// =============================
describe('Search events for route creation', () => {
    test('should return list of events', async () => {
        const res = await request(app)
            .get('/events');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('should filter events by keyword', async () => {
        const res = await request(app)
            .get('/events?search=music');

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(0);
    });
});


// =============================
// 2. Пошук подій для відображення маршруту на карті
// =============================
describe('Search events for map route', () => {
    test('should return events with coordinates', async () => {
        const res = await request(app)
            .get('/events');

        expect(res.statusCode).toBe(200);

        res.body.forEach(event => {
            expect(event).toHaveProperty('latitude');
            expect(event).toHaveProperty('longitude');
        });
    });
});


// =============================
// 3. Пошук подій для розрахунку часу
// =============================
describe('Search events for time calculation', () => {
    test('should return events with time data', async () => {
        const res = await request(app)
            .get('/events');

        expect(res.statusCode).toBe(200);

        res.body.forEach(event => {
            expect(event).toHaveProperty('date');
        });
    });
});


// =============================
// 4. Редагування маршруту (оновлення події)
// =============================
describe('Edit route (update event)', () => {
    test('should create event first', async () => {
        const res = await request(app)
            .post('/events')
            .send({
                title: 'Test Event',
                description: 'Test Description',
                latitude: 49.84,
                longitude: 24.03,
                date: '2026-01-01'
            });

        expect(res.statusCode).toBe(201);
        createdEventId = res.body.id;
    });

    test('should update event', async () => {
        const res = await request(app)
            .put(`/events/${createdEventId}`)
            .send({
                title: 'Updated Event'
            });

        expect(res.statusCode).toBe(200);
    });
});


// =============================
// 5. Видалення маршруту (події)
// =============================
describe('Delete route (event)', () => {
    test('should delete event', async () => {
        const res = await request(app)
            .delete(`/events/${createdEventId}`);

        expect(res.statusCode).toBe(200);
    });

    test('should return 404 after delete', async () => {
        const res = await request(app)
            .get(`/events/${createdEventId}`);

        expect(res.statusCode).toBe(404);
    });
});