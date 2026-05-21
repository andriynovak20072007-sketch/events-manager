const { Pool } = require('pg');
  require('dotenv').config();

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  : {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || 'Event_Manager',
      ssl: false
    };

  const pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('❌ [DB] Помилка підключення:', err.message);
  });

  module.exports = pool;