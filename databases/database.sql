------------------------------------------------------------
-- FINAL PRODUCTION SCHEMA: EVENT MANAGER DB
------------------------------------------------------------

DROP TRIGGER IF EXISTS trigger_check_privacy ON events;
DROP FUNCTION IF EXISTS check_event_privacy();
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS invitations;
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

-- 1. Створюємо розробницького користувача з паролем
CREATE USER event_dev WITH PASSWORD 'dev_password_123';

-- 2. Даємо йому доступ підключатися до БД (заміни events_db на свою назву, якщо вона інша)
GRANT CONNECT ON DATABASE "Event_Manager" TO event_dev;

-- 3. Даємо права працювати в стандартній схемі
GRANT USAGE ON SCHEMA public TO event_dev;

-- 4. Даємо права читати, додавати, змінювати та видаляти дані з усіх таблиць
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO event_dev;

-- 5. Даємо доступ до генератора ID (щоб працював SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO event_dev;
