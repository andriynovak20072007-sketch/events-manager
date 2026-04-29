-- Додаємо нового користувача
INSERT INTO users (username, email, password_hash, role) 
VALUES ('ivan_dev', 'ivan@example.com', 'hashed_password_123', 'user');

-- Створюємо приватну подію для цього користувача (id = 3, бо двоє вже є в тестах)
INSERT INTO events (title, description, event_date, latitude, longitude, is_private, creator_id, category_id) 
VALUES ('Workshop SQL', 'Навчаємось CRUD запитам', '2026-05-20 12:00:00', 50.4501, 30.5234, TRUE, 3, 3);

-- Отримати список усіх ПУБЛІЧНИХ подій для карти
SELECT title, latitude, longitude, event_date FROM events WHERE is_private = FALSE;

-- Отримати детальну інформацію про подію та її категорію
SELECT e.title, e.description, c.name AS category_name, u.username AS creator
FROM events e
JOIN categories c ON e.category_id = c.category_id
JOIN users u ON e.creator_id = u.user_id
WHERE e.event_id = 1;

-- Оновлюємо опис події
UPDATE events 
SET description = 'Оновлений опис: Навчаємось SQL разом з Gemini' 
WHERE event_id = 2;

-- Змінюємо статус участі користувача
UPDATE event_participants 
SET status = 'going' 
WHERE user_id = 2 AND event_id = 1;

-- Видаляємо конкретний коментар
DELETE FROM comments WHERE comment_id = 1;

-- Видаляємо подію (завдяки нашому ON DELETE CASCADE, всі учасники та коментарі видаляться автоматично)
DELETE FROM events WHERE event_id = 2;