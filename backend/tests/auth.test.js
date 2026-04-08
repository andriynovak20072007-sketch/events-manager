const request = require('supertest');
const app = require('../server'); // Переконайся, що в server.js є module.exports = app
const pool = require('../db');

describe('Auth API Tests (Registration & Login)', () => {
    
    // Очищуємо тестового користувача перед тестами, щоб не було помилки "email вже зайнятий"
    beforeAll(async () => {
        await pool.query("DELETE FROM users WHERE email = 'test@gmail.com'");
    });

    // 1. ТЕСТ РЕЄСТРАЦІЇ
    test('TC-REG-001: Should register a new user', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                username: 'testuser',
                email: 'test@gmail.com',
                password: 'password123'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('message', 'Реєстрація успішна! Перевірте консоль сервера для активації акаунта.');
    });

    // 2. ТЕСТ ВАЛІДАЦІЇ (Короткий пароль)
    test('TC-REG-002: Should fail registration with short password', async () => {
        const res = await request(app)
            .post('/api/users/register')
            .send({
                username: 'baduser',
                email: 'bad@test.com',
                password: '123'
            });
        
        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty('error', 'Пароль має містити щонайменше 6 символів');
    });

    // 3. ТЕСТ ЛОГІНУ (Після активації в БД)
    test('TC-LOG-001: Should login successfully', async () => {
        // Симулюємо активацію акаунта в БД вручну для тесту
        await pool.query("UPDATE users SET is_active = true WHERE email = 'test@gmail.com'");

        const res = await request(app)
            .post('/api/users/login')
            .send({
                email: 'test@gmail.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Вхід успішний!');
        expect(res.body.user).toHaveProperty('email', 'test@gmail.com');
    });

    // Закриваємо з'єднання з базою після тестів
    afterAll(async () => {
        await pool.end();
    });
});