------------------------------------------------------------
-- FINAL PRODUCTION SCHEMA: EVENT MANAGER DB
------------------------------------------------------------

-- Спочатку видаляємо ті таблиці, які залежать від інших
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS route_events;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS invitations;

-- Тепер можна безпечно видаляти головні таблиці
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- 1. Користувачі
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Категорії подій (для фільтрації на карті)
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    -- Твої нові поля для розкладу
    event_day DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Геопозиція та приватність
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    is_private BOOLEAN DEFAULT TRUE,
    -- Зв'язки
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    creator_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
    access_token UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Учасники
CREATE TABLE event_participants (
    registration_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'going', -- 'going', 'interested'
    UNIQUE(user_id, event_id)
);

-- 5. Коментарі (щоб оживити застосунок)
CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Запрошення
CREATE TABLE invitations (
    invitation_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    invite_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Таблиця самих маршрутів (заголовок маршруту)
CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,
    creator_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Таблиця зв'язку (які події входять у маршрут і в якому порядку)
-- Це патерн Many-to-Many з додатковим полем порядку
CREATE TABLE route_events (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(route_id) ON DELETE CASCADE,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE,
    order_index INT NOT NULL -- Порядок події в маршруті (1, 2, 3...)
);

-- 3. Таблиця "Обране"
-- Сюди юзер може додати АБО окрему подію, АБО цілий маршрут
CREATE TABLE favorites (
    favorite_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INT REFERENCES events(event_id) ON DELETE CASCADE, -- Якщо лайкнув подію
    route_id INT REFERENCES routes(route_id) ON DELETE CASCADE, -- Якщо лайкнув маршрут
    CHECK (
        (event_id IS NOT NULL AND route_id IS NULL) OR 
        (event_id IS NULL AND route_id IS NOT NULL)
    ) -- Перевірка, що в одному рядку або подія, або маршрут
);

-- Таблиця рейтингів (Оцінки від 1 до 5)
CREATE TABLE ratings (
    rating_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    score INTEGER CHECK (score >= 1 AND score <= 5), -- Захист: оцінка тільки 1-5
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id) -- Захист від накрутки: 1 юзер = 1 оцінка на 1 подію
);

-- БІЗНЕС-ЛОГІКА (ТРИГЕР)
CREATE OR REPLACE FUNCTION check_event_privacy()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_private = FALSE AND (SELECT role FROM users WHERE user_id = NEW.creator_id) = 'user' THEN
        RAISE EXCEPTION 'Звичайні користувачі не можуть створювати публічні події!';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_privacy
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION check_event_privacy();

SELECT * FROM users;

ALTER TABLE events ADD COLUMN region VARCHAR(100);

ALTER TABLE events 
ADD COLUMN price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN currency VARCHAR(3) DEFAULT 'UAH',
ADD COLUMN photo_url TEXT;

-- 1. Створюємо розробницького користувача з паролем
ALTER USER event_dev WITH PASSWORD 'dev_password_123';

-- 2. Даємо йому доступ підключатися до БД (заміни events_db на свою назву, якщо вона інша)
GRANT CONNECT ON DATABASE "Event_Manager" TO event_dev;

-- 3. Даємо права працювати в стандартній схемі
GRANT USAGE ON SCHEMA public TO event_dev;

-- 4. Даємо права читати, додавати, змінювати та видаляти дані з усіх таблиць
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO event_dev;

-- 5. Даємо доступ до генератора ID (щоб працював SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO event_dev;

ALTER TABLE events ADD COLUMN image_url VARCHAR(255);

-- ==========================================
-- ОНОВЛЕННЯ ДЛЯ GOOGLE AUTH
-- ==========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- ==========================================
-- 7. СПОВІЩЕННЯ (NOTIFICATIONS)
-- ПАТЕРН: Observer (в базі даних для зберігання подій)
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'system', 'invite', 'reminder'
    message TEXT NOT NULL,
    related_id INTEGER, -- ID події або іншого об'єкта
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. НАЛАШТУВАННЯ КОРИСТУВАЧІВ (USER SETTINGS)
-- Гнучка таблиця для зберігання будь-яких налаштувань
-- (валюта, мова, тема тощо) без потреби міграцій
-- ==========================================
CREATE TABLE IF NOT EXISTS user_settings (
    setting_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, setting_key)
);

