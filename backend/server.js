require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');
const pool = require('./db');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// Імпорт для централізованої обробки помилок
// ==========================================
const AppError = require('./utils/AppError');
const logger = require('./utils/Logger');

// ==========================================
// 1. ІМПОРТ КОНТРОЛЕРІВ (РОУТІВ)
// ==========================================
const usersRoutes = require('./routes/users');
const eventsRoutes = require('./routes/events');
const categoriesRoutes = require('./routes/categories');
const commentsRoutes = require('./routes/comments');
const infoRoutes = require('./routes/info');
const favoritesRoutes = require('./routes/favorite'); 
const hotelsRoutes = require('./routes/hotels');
const authRoutes = require('./routes/auth');
const notificationsRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const subscriptionsRoutes = require('./routes/subscriptions');

// ==========================================
// ІНІЦІАЛІЗАЦІЯ ФОНОВИХ ЗАВДАНЬ (CRON JOBS)
// ==========================================
require('./cron/cleanup');
require('./cron/scheduler');

const app = express();

// ==========================================
// AUTO-MIGRATION: Додає відсутні колонки/таблиці при запуску
// ==========================================
async function runAutoMigration() {
    try {
        await pool.query(`
            -- Events: додаємо відсутні колонки
            ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;
            ALTER TABLE events ADD COLUMN IF NOT EXISTS button_color VARCHAR(20);
            ALTER TABLE events ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';
            ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending';
            ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
            ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_url TEXT;
            ALTER TABLE events ADD COLUMN IF NOT EXISTS region VARCHAR(100);
            ALTER TABLE events ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
            ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'UAH';

            -- Users: trial-колонки
            ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT FALSE;

            -- Users: дозволяємо NULL password (Google Auth)
            ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        `);

        // Створюємо таблицю notification_schedule
        await pool.query(`
            CREATE TABLE IF NOT EXISTS notification_schedule (
                schedule_id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
                remind_at TIMESTAMP NOT NULL,
                type VARCHAR(20) DEFAULT '24h',
                status VARCHAR(20) DEFAULT 'pending',
                channel VARCHAR(20) DEFAULT 'all',
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP,
                UNIQUE(event_id, user_id, type)
            );
        `);

        logger.success('MIGRATION', 'Авто-міграція виконана успішно ✅');
    } catch (err) {
        logger.error('MIGRATION', 'Помилка авто-міграції', err);
    }
}
runAutoMigration();


// ==========================================
// 2. МІДЛВЕРИ (MIDDLEWARES)
// ==========================================
app.use(cors({
    origin: true,     // Дозволяє запити з будь-якого origin (для розробки)
    credentials: true  // Дозволяє передачу cookies/сесій
}));
app.use(express.json()); // Дозволяє серверу читати JSON з req.body


// 🟢 ДОДАНО: Робимо папку 'uploads' публічною, щоб фронтенд міг читати фотографії
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Для локальної розробки HTTP. На продакшені (HTTPS) має бути true
}));
app.use(express.static(path.join(__dirname, '../frontend/css')));
// ==========================================
// 3. ПІДКЛЮЧЕННЯ МАРШРУТІВ (РОУТИНГ)
// ==========================================
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/events', eventsRoutes); // Також доступно без /api префікса (для тестів)
app.use('/api/categories', categoriesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/favorites', favoritesRoutes); 
app.use('/api/routes', require('./routes/routes')); // Виправив дублювання
app.use('/api/hotels', hotelsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/subscriptions', subscriptionsRoutes);

// Базовий тестовий роут для перевірки працездатності
app.get('/api', (req, res) => {
    res.send("Event Manager API працює 🚀");
});

// ==========================================
// 4. ПАТЕРН: ЦЕНТРАЛІЗОВАНА ОБРОБКА ПОМИЛОК
// Підтримує як AppError (операційні), так і непередбачені помилки
// ==========================================
app.use((err, req, res, next) => {
    // Якщо це наша операційна помилка (AppError) — повертаємо її статус та повідомлення
    if (err.isOperational) {
        logger.warn('HTTP', `${err.statusCode} ${req.method} ${req.originalUrl}: ${err.message}`);
        
        const response = { error: err.message };
        if (err.details) response.details = err.details;
        
        return res.status(err.statusCode).json(response);
    }

    // Непередбачена помилка — логуємо повний стек
    logger.error('SERVER', 'Неперехоплена помилка сервера', err);
    res.status(500).json({ 
        error: "Внутрішня помилка сервера", 
        message: err.message 
    });
});

// ==========================================
// 5. ЗАПУСК СЕРВЕРА
// ==========================================


// Запускаємо сервер ТІЛЬКИ якщо це не тести
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/css/index.html'));
});
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.success('SERVER', `Server працює на порту ${PORT}`);
});
// ОБОВ'ЯЗКОВО ділимося додатком з іншими файлами (для Supertest)
module.exports = app;