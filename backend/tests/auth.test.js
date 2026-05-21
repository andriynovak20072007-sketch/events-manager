const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../server');

// Мокаємо модулі, щоб не підключатися до реальної БД та сервісів
jest.mock('../cron/cleanup', () => { });
jest.mock('../cron/scheduler', () => { });

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' }))
    }))
}));

jest.mock('../repositories/UserRepository', () => ({
    findByEmailOrUsername: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
}));

jest.mock('../services/SubscriptionService', () => ({
    assignFreePlan: jest.fn()
}));

jest.mock('../services/TrialService', () => ({
    activateTrial: jest.fn(() => Promise.resolve({ success: true, trial_info: {} }))
}));

// Мокаємо db.js щоб сервер не впав при ініціалізації
jest.mock('../db', () => ({
    query: jest.fn(),
    connect: jest.fn()
}));

const userRepo = require('../repositories/UserRepository');
const SubscriptionService = require('../services/SubscriptionService');

describe('Тестування авторизації та реєстрації (auth.test.js)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /users/register', () => {
        it('TC-A01: повинен успішно зареєструвати користувача з валідними даними', async () => {
            userRepo.findByEmailOrUsername.mockResolvedValue(null);
            userRepo.create.mockResolvedValue({
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com'
            });

            const res = await request(app)
                .post('/users/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.message).toContain('Реєстрація успішна');
            expect(res.body.user).toBeDefined();
            expect(userRepo.create).toHaveBeenCalled();
            expect(SubscriptionService.assignFreePlan).toHaveBeenCalledWith(1);
        });

        it('TC-A02: повинен повернути помилку 400, якщо відсутні обов\'язкові поля', async () => {
            const res = await request(app)
                .post('/users/register')
                .send({ username: 'testuser' }); // Немає email та password

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Всі поля");
        });

        it('TC-A03: повинен повернути помилку 400, якщо формат email невірний', async () => {
            const res = await request(app)
                .post('/users/register')
                .send({
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Некоректний формат email");
        });

        it('TC-A04: повинен повернути помилку 400, якщо пароль коротший за 6 символів', async () => {
            const res = await request(app)
                .post('/users/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: '123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("щонайменше 6 символів");
        });

        it('TC-A05: повинен повернути помилку 409, якщо користувач вже існує', async () => {
            userRepo.findByEmailOrUsername.mockResolvedValue({
                email: 'test@example.com',
                username: 'otheruser'
            });

            const res = await request(app)
                .post('/users/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(409);
            expect(res.body.error).toContain("з таким email вже зареєстрований");
        });
    });

    describe('POST /users/login', () => {
        it('TC-A06: повинен успішно увійти з правильними даними', async () => {
            // Створюємо справжній хеш для тесту
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            userRepo.findByEmail.mockResolvedValue({
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
                password_hash: hashedPassword
            });

            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('Вхід успішний');
            expect(res.body.user.email).toEqual('test@example.com');
        });

        it('TC-A07: повинен повернути помилку 400, якщо email не знайдено', async () => {
            userRepo.findByEmail.mockResolvedValue(null);

            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Неправильний email або пароль");
        });

        it('TC-A08: повинен повернути помилку 400, якщо пароль невірний', async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            userRepo.findByEmail.mockResolvedValue({
                user_id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password_hash: hashedPassword
            });

            const res = await request(app)
                .post('/users/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.error).toContain("Неправильний email або пароль");
        });
    });

    describe('POST /users/logout', () => {
        it('TC-A09: повинен успішно виконати логаут', async () => {
            const res = await request(app)
                .post('/users/logout');

            expect(res.statusCode).toEqual(200);
            expect(res.body.message).toContain('Ви успішно вийшли з системи');
        });
    });

});
