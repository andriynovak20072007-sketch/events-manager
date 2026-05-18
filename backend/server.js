require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const pool = require('./db');

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
// 2. МІДЛВЕРИ (MIDDLEWARES)
// ==========================================
app.use(cors({
    origin: true,     // Дозволяє запити з будь-якого origin (для розробки)
    credentials: true  // Дозволяє передачу cookies/сесій
}));
app.use(express.json()); // Дозволяє серверу читати JSON з req.body


// 🟢 ДОДАНО: Робимо папку 'uploads' публічною, щоб фронтенд міг читати фотографії
app.use('/uploads', express.static('uploads'));

app.use(session({
    secret: process.env.SESSION_SECRET || "fallback_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Для локальної розробки HTTP. На продакшені (HTTPS) має бути true
}));

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
app.get('/', (req, res) => {
    res.send("Event Manager API працює 🚀");
});

// ==========================================
// 4. ПАТЕРН: ЦЕНТРАЛІЗОВАНА ОБРОБКА ПОМИЛОК
// ==========================================
// Цей мідлвер ловить всі помилки, які "впали" в додатку і не були оброблені
app.use((err, req, res, next) => {
    console.error('🔥 Неперехоплена помилка сервера:', err.stack);
    res.status(500).json({ 
        error: "Внутрішня помилка сервера", 
        message: err.message 
    });
});

// ==========================================
// 5. ЗАПУСК СЕРВЕРА
// ==========================================
const PORT = process.env.PORT || 5000;

// Запускаємо сервер ТІЛЬКИ якщо це не тести
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Server працює на порту ${PORT}`);
    });
}

// ОБОВ'ЯЗКОВО ділимося додатком з іншими файлами (для Supertest)
module.exports = app;