require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const pool = require('./db');

const usersRoutes = require('./routes/users');
const eventsRoutes = require('./routes/events');
const categoriesRoutes = require('./routes/categories');
const commentsRoutes = require('./routes/comments');
const analyticsRoutes = require('./routes/analytics');
const analyticsController = require('./controllers/analyticsController');

analyticsController.initDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "fallback_secret_key",
        resave: false,
        saveUninitialized: true
    })
);

app.use('/users', usersRoutes);
app.use('/events', eventsRoutes);
app.use('/categories', categoriesRoutes);
app.use('/comments', commentsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
    res.send("Event Manager API працює 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server працює на порту ${PORT}`);
});