const { Pool } = require('pg');
require('dotenv').config();

// Створюємо конфігурацію підключення, використовуючи дані з твого файлу .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Функція для виконання запитів
module.exports = {
  query: (text, params) => pool.query(text, params),
};

console.log("🚀 Модуль підключення до PostgreSQL ініціалізовано!");