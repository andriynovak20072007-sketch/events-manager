------------------------------------------------------------
-- МІГРАЦІЯ ДЛЯ RENDER: Всі відсутні колонки та таблиці
-- Запустіть цей скрипт один раз у PostgreSQL на Render
------------------------------------------------------------

-- 1. Додаємо відсутні колонки до таблиці events
ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS button_color VARCHAR(20);
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';
ALTER TABLE events ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending';
ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);
ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE events ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'UAH';

-- 2. Додаємо trial-колонки до таблиці users
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Дозволяємо password_hash бути NULL (для Google Auth)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 3. Створюємо таблицю notification_schedule (планувальник сповіщень)
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

-- 4. Створюємо таблицю notifications (якщо не існує)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Створюємо таблицю user_settings (якщо не існує)
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

-- 6. Індекси
CREATE INDEX IF NOT EXISTS idx_users_trial_active 
ON users (is_trial_active, trial_end) 
WHERE is_trial_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_schedule_pending 
ON notification_schedule (status, remind_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_schedule_user 
ON notification_schedule (user_id);

-- 7. Таблиці аналітики
CREATE TABLE IF NOT EXISTS event_views (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    ip_address TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'UAH',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Готово! ✅
