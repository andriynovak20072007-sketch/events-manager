------------------------------------------------------------
-- МІГРАЦІЯ: Планувальник сповіщень (Event Scheduler)
-- Таблиця для відстеження стану відправки нагадувань
------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notification_schedule (
    schedule_id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(event_id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    remind_at TIMESTAMP NOT NULL,           -- Коли потрібно нагадати
    type VARCHAR(20) DEFAULT '24h',         -- '24h', '1h', 'on_start'
    status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'sent', 'failed'
    channel VARCHAR(20) DEFAULT 'all',      -- 'email', 'in_app', 'all'
    error_message TEXT,                     -- Причина помилки (якщо failed)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    UNIQUE(event_id, user_id, type)         -- Захист від дублікатів: 1 юзер = 1 нагадування = 1 тип
);

-- Індекс для швидкого пошуку pending нагадувань, що настали
CREATE INDEX IF NOT EXISTS idx_schedule_pending 
ON notification_schedule (status, remind_at) 
WHERE status = 'pending';

-- Індекс для швидкого пошуку за користувачем
CREATE INDEX IF NOT EXISTS idx_schedule_user 
ON notification_schedule (user_id);
