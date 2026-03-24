require('dotenv').config(); // ПЕРШИЙ РЯДОК
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const pool = require('./db');

// Імпорт роутів
const usersRoutes = require('./routes/users');
const eventsRoutes = require('./routes/events');
const categoriesRoutes = require('./routes/categories');
const commentsRoutes = require('./routes/comments');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // ЦЕ ВАЖЛИВО ДЛЯ POST-ЗАПИТІВ

app.use(session({
    secret: process.env.SESSION_SECRET || "secretkey", // Краще винести в .env
    resave: false,
    saveUninitialized: true
}));

// Підключення маршрутів
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/comments', commentsRoutes);

app.get('/', (req, res) => {
    res.send("Event Manager API працює 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server працює на порту ${PORT}`);
});
