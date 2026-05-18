------------------------------------------------------------
-- МІГРАЦІЯ: Поля для реєстрації (activation_token, is_active)
-- Додає колонки для email-активації акаунта
------------------------------------------------------------

-- Додаємо поле для токена активації email
ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token TEXT;

-- Додаємо поле для статусу активації
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Додаємо поле для токена скидання пароля
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;

-- Індекс для швидкого пошуку по activation_token
CREATE INDEX IF NOT EXISTS idx_users_activation_token 
ON users (activation_token) 
WHERE activation_token IS NOT NULL;
