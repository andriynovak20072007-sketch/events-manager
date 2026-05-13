------------------------------------------------------------
-- МІГРАЦІЯ: Trial-період (2 місяці безкоштовного використання)
-- Додає поля для відстеження trial-статусу користувачів
------------------------------------------------------------

-- Додаємо поля для trial-періоду до таблиці users
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trial_active BOOLEAN DEFAULT FALSE;

-- Індекс для швидкого пошуку користувачів з активним trial
CREATE INDEX IF NOT EXISTS idx_users_trial_active 
ON users (is_trial_active, trial_end) 
WHERE is_trial_active = TRUE;

-- Оновлюємо існуючих юзерів зі стартовим планом (role = 'user'):
-- Ті, хто зареєструвався раніше, отримують trial від моменту міграції
-- UPDATE users 
-- SET trial_start = CURRENT_TIMESTAMP, 
--     trial_end = CURRENT_TIMESTAMP + INTERVAL '2 months',
--     is_trial_active = TRUE
-- WHERE role = 'user' AND trial_start IS NULL;
