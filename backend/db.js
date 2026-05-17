// ==========================================
// ПАТЕРН: Singleton (Підключення до бази даних)
// Модуль Node.js кешує результат require(), тому
// цей файл завжди повертає ОДИН і ТОЙ САМИЙ pool.
// Це гарантує, що всі частини додатку використовують
// спільний пул з'єднань, а не створюють нові.
// ==========================================

const { Pool } = require('pg');
require('dotenv').config(); // Залишаємо тільки один раз

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// ==========================================
// ПАТЕРН: Observer (слухач подій)
// Підписуємося на помилки пулу з'єднань,
// щоб логувати їх централізовано
// ==========================================
pool.on('error', (err) => {
  console.error('❌ [DB] Непередбачена помилка пулу підключень:', err.message);
});

module.exports = pool;
