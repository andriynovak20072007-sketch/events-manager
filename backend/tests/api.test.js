const request = require('supertest');

// Мокаємо cron, щоб він не підключався до БД
jest.mock('../cron/cleanup', () => { });

// Мокаємо pool (БД), щоб тести працювали без реального PostgreSQL
jest.mock('../db', () => ({
    query: jest.fn((sql, values) => {
        // Для INSERT запитів — повертаємо об'єкт з переданими даними
        if (typeof sql === 'string' && sql.trim().startsWith('INSERT')) {
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