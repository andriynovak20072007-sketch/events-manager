------------------------------------------------------------
-- МІГРАЦІЯ: Структура підписок (Subscription Plans)
-- Тарифні плани та підписки користувачів
------------------------------------------------------------

-- 1. Довідник тарифних планів
-- Зберігає всі доступні тарифи з їх лімітами та можливостями
CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,           -- Системна назва ('free', 'pro', 'premium')
    display_name VARCHAR(100) NOT NULL,         -- Назва для UI ('Безкоштовний', 'Професійний', 'Преміум')
    price NUMERIC(10, 2) DEFAULT 0.00,          -- Ціна тарифу
    currency VARCHAR(3) DEFAULT 'UAH',          -- Валюта
    duration_days INTEGER DEFAULT NULL,         -- Тривалість (NULL = безстроково для Free)
    max_events INTEGER DEFAULT 5,               -- Ліміт створення подій
    max_routes INTEGER DEFAULT 1,               -- Ліміт створення маршрутів
    can_create_public BOOLEAN DEFAULT FALSE,    -- Дозвіл на публічні події
    can_export BOOLEAN DEFAULT FALSE,           -- Дозвіл на експорт даних
    priority_support BOOLEAN DEFAULT FALSE,     -- Пріоритетна підтримка
    description TEXT,                           -- Опис тарифу для відображення
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Підписки користувачів
-- Зв'язує користувача з його поточним тарифом
CREATE TABLE IF NOT EXISTS user_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(plan_id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active',        -- 'active', 'cancelled', 'expired'
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,                       -- NULL для безстрокових планів (Free)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекс для швидкого пошуку активної підписки користувача
CREATE INDEX IF NOT EXISTS idx_user_subscription_active 
ON user_subscriptions (user_id, status) 
WHERE status = 'active';

-- Індекс для пошуку підписок, що закінчуються (для cron-завдань)
CREATE INDEX IF NOT EXISTS idx_subscription_expiry 
ON user_subscriptions (expires_at) 
WHERE status = 'active' AND expires_at IS NOT NULL;

-- ==========================================
-- SEED DATA: Початкові тарифні плани
-- ==========================================

INSERT INTO subscription_plans (name, display_name, price, currency, duration_days, max_events, max_routes, can_create_public, can_export, priority_support, description)
VALUES
    ('free', 'Безкоштовний', 0.00, 'UAH', NULL, 5, 1, FALSE, FALSE, FALSE, 
     'Базовий план для початківців. Створюйте до 5 подій та 1 маршрут.'),
    ('pro', 'Професійний', 149.00, 'UAH', 30, 50, 10, TRUE, TRUE, FALSE, 
     'Розширені можливості для активних організаторів. До 50 подій, 10 маршрутів, публічні події та експорт.'),
    ('premium', 'Преміум', 299.00, 'UAH', 30, -1, -1, TRUE, TRUE, TRUE, 
     'Необмежений доступ до всіх функцій платформи з пріоритетною підтримкою.')
ON CONFLICT (name) DO NOTHING;
