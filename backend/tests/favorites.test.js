const request = require('supertest');
const app = require('../server');
const favoriteRepo = require('../repositories/FavoriteRepository');

jest.mock('../cron/cleanup', () => {});
jest.mock('../cron/scheduler', () => {});
jest.mock('../repositories/FavoriteRepository', () => ({
    findByUserId: jest.fn(),
    exists: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
}));
jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

describe('Тестування роботи обраного (favorites.test.js)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/favorites/:user_id', () => {
        it('TC-F01: повинен повертати список обраних подій для користувача', async () => {
            const mockFavorites = [
                { event_id: 1, title: 'Концерт', user_id: 1 },
                { event_id: 2, title: 'Виставка', user_id: 1 }
            ];
            favoriteRepo.findByUserId.mockResolvedValue(mockFavorites);

            const res = await request(app).get('/api/favorites/1');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual(mockFavorites);
            expect(favoriteRepo.findByUserId).toHaveBeenCalledWith('1');
        });

        it('TC-F02: повинен повертати порожній масив, якщо обраних подій немає', async () => {
            favoriteRepo.findByUserId.mockResolvedValue([]);

            const res = await request(app).get('/api/favorites/2');
            
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });
    });

    describe('POST /api/favorites', () => {
        it('TC-F03: повинен успішно додавати подію в обране', async () => {
            favoriteRepo.exists.mockResolvedValue(false);
            const newFavorite = { favorite_id: 10, user_id: 1, event_id: 5 };
            favoriteRepo.add.mockResolvedValue(newFavorite);

            const res = await request(app)
                .post('/api/favorites')
                .send({ user_id: 1, event_id: 5 });

            expect(res.statusCode).toEqual(201);
            expect(res.body).toEqual(newFavorite);
            expect(favoriteRepo.exists).toHaveBeenCalledWith(1, 5);
            expect(favoriteRepo.add).toHaveBeenCalledWith(1, 5);
        });

        it('TC-F04: повинен повертати 400, якщо не передані обов\'язкові дані', async () => {
            const res = await request(app)
                .post('/api/favorites')
                .send({ user_id: 1 }); // Відсутній event_id

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain('Не вказано user_id або event_id');
        });

        it('TC-F05: повинен повертати 409, якщо подія вже в обраному', async () => {
            favoriteRepo.exists.mockResolvedValue(true);

            const res = await request(app)
                .post('/api/favorites')
                .send({ user_id: 1, event_id: 5 });

            expect(res.statusCode).toEqual(409);
            expect(res.body.error).toContain('вже є в обраному');
        });
    });

    describe('DELETE /api/favorites/:user_id/:event_id', () => {
        it('TC-F06: повинен успішно видаляти подію з обраного', async () => {
            const deletedRecord = { favorite_id: 10, user_id: 1, event_id: 5 };
            favoriteRepo.remove.mockResolvedValue(deletedRecord);

            const res = await request(app).delete('/api/favorites/1/5');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('успішно видалено');
            expect(res.body.deleted_record).toEqual(deletedRecord);
            expect(favoriteRepo.remove).toHaveBeenCalledWith('1', '5');
        });

        it('TC-F07: повинен повертати 404, якщо події немає в обраному', async () => {
            favoriteRepo.remove.mockResolvedValue(null);

            const res = await request(app).delete('/api/favorites/1/99');

            expect(res.statusCode).toEqual(404);
            expect(res.body.error).toContain('немає в обраному');
        });
    });
});
