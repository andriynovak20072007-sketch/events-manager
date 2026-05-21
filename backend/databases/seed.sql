------------------------------------------------------------
-- SEED DATA: Event Manager DB
-- Заповнення бази даних тестовими даними
------------------------------------------------------------

-- ==========================================
-- 1. КАТЕГОРІЇ
-- ==========================================
INSERT INTO categories (name) VALUES
    ('Концерти'),
    ('Фестивалі'),
    ('Освіта'),
    ('Спорт')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- 2. КОРИСТУВАЧІ
-- Пароль для всіх: password123
-- Хеш: $2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012
-- ==========================================
INSERT INTO users (username, email, password_hash, role) VALUES
    ('admin',       'admin@eventmanager.ua',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('olena_event', 'olena@gmail.com',           '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('ivan_music',  'ivan.music@gmail.com',      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('maria_pro',   'maria.pro@outlook.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'pro'),
    ('petro_user',  'petro@ukr.net',             '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'user'),
    ('anna_fest',   'anna.fest@gmail.com',        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('dmytro_sport','dmytro.sport@gmail.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager'),
    ('kateryna_edu','kateryna.edu@gmail.com',     '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'manager')
ON CONFLICT (username) DO NOTHING;

-- ==========================================
-- 3. ПОДІЇ (20 подій у різних містах)
-- Координати відповідають реальним локаціям в Україні
-- ==========================================

-- Київ: Концерти
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'MONATIK — Великий концерт',
    'Грандіозне шоу MONATIK у Палаці Спорту. Нові хіти та легендарні пісні в одному концерті!',
    '2026-06-15', '19:00', '22:00',
    50.438889, 30.521389,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'ivan_music'),
    'Київ', FALSE, 1200.00, 'UAH',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Океан Ельзи — Тур 2026',
    'Легендарний гурт Океан Ельзи з новою програмою на НСК Олімпійський.',
    '2026-07-20', '20:00', '23:00',
    50.432222, 30.521667,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'ivan_music'),
    'Київ', FALSE, 1500.00, 'UAH',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Jazz на Хрещатику',
    'Відкритий джаз-концерт просто неба. Живий звук, атмосфера та вечірній Київ.',
    '2026-06-28', '18:30', '21:30',
    50.449444, 30.525278,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'olena_event'),
    'Київ', FALSE, 0.00, 'UAH',
    'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
    'approved'
);

-- Київ: Фестивалі
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Atlas Weekend 2026',
    'Найбільший музичний фестиваль України! 5 днів неймовірної музики, їжі та розваг.',
    '2026-07-05', '12:00', '23:59',
    50.440833, 30.597778,
    (SELECT category_id FROM categories WHERE name = 'Фестивалі'),
    (SELECT user_id FROM users WHERE username = 'anna_fest'),
    'Київ', FALSE, 2500.00, 'UAH',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Ulichnaya Eda — Фестиваль їжі',
    'Фестиваль вуличної їжі на ВДНГ. Понад 100 фуд-кортів зі всього світу.',
    '2026-08-10', '11:00', '22:00',
    50.378611, 30.478889,
    (SELECT category_id FROM categories WHERE name = 'Фестивалі'),
    (SELECT user_id FROM users WHERE username = 'anna_fest'),
    'Київ', FALSE, 350.00, 'UAH',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    'approved'
);

-- Київ: Освіта
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'IT конференція DevFest Kyiv',
    'Щорічна конференція для розробників. Доповіді від Google, Microsoft та українських стартапів.',
    '2026-09-15', '09:00', '18:00',
    50.450556, 30.523333,
    (SELECT category_id FROM categories WHERE name = 'Освіта'),
    (SELECT user_id FROM users WHERE username = 'kateryna_edu'),
    'Київ', FALSE, 800.00, 'UAH',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Startup Grind Kyiv',
    'Зустріч стартап-спільноти Києва. Пітчі, нетворкінг та менторство від інвесторів.',
    '2026-06-22', '17:00', '20:00',
    50.444722, 30.515278,
    (SELECT category_id FROM categories WHERE name = 'Освіта'),
    (SELECT user_id FROM users WHERE username = 'kateryna_edu'),
    'Київ', FALSE, 0.00, 'UAH',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    'approved'
);

-- Київ: Спорт
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Київський Марафон 2026',
    'Міжнародний марафон по вулицях Києва. Дистанції: 5 км, 10 км, напівмарафон, марафон.',
    '2026-10-05', '08:00', '15:00',
    50.450000, 30.523333,
    (SELECT category_id FROM categories WHERE name = 'Спорт'),
    (SELECT user_id FROM users WHERE username = 'dmytro_sport'),
    'Київ', FALSE, 600.00, 'UAH',
    'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800',
    'approved'
);

-- Львів: Концерти
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Дахабраха у Львові',
    'Етно-хаос група ДахаБраха з концертом в оперному театрі. Незабутня акустика!',
    '2026-06-30', '19:00', '21:30',
    49.843889, 24.026389,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'ivan_music'),
    'Львів', FALSE, 900.00, 'UAH',
    'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Джаз на площі Ринок',
    'Вечір живого джазу в серці Львова. Безкоштовний вхід, атмосфера та кава.',
    '2026-07-12', '19:00', '22:00',
    49.841944, 24.031389,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'olena_event'),
    'Львів', FALSE, 0.00, 'UAH',
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
    'approved'
);

-- Львів: Фестивалі
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Leopolis Jazz Fest 2026',
    'Один з найвідоміших джазових фестивалів Європи. Музиканти зі світовим ім''ям.',
    '2026-06-25', '14:00', '23:00',
    49.839167, 24.032778,
    (SELECT category_id FROM categories WHERE name = 'Фестивалі'),
    (SELECT user_id FROM users WHERE username = 'anna_fest'),
    'Львів', FALSE, 1800.00, 'UAH',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
    'approved'
);

INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Фестиваль Кави у Львові',
    'Щорічний фестиваль для справжніх кавоманів. Дегустації, майстер-класи та бариста-баттли.',
    '2026-09-20', '10:00', '20:00',
    49.842222, 24.028889,
    (SELECT category_id FROM categories WHERE name = 'Фестивалі'),
    (SELECT user_id FROM users WHERE username = 'anna_fest'),
    'Львів', FALSE, 200.00, 'UAH',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    'approved'
);

-- Львів: Освіта
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'IT Arena Lviv 2026',
    'Найбільша технологічна конференція Західної України. AI, Web3, кібербезпека.',
    '2026-10-10', '09:00', '19:00',
    49.837778, 24.023333,
    (SELECT category_id FROM categories WHERE name = 'Освіта'),
    (SELECT user_id FROM users WHERE username = 'kateryna_edu'),
    'Львів', FALSE, 1500.00, 'UAH',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800',
    'approved'
);

-- Одеса: Концерти
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Бумбокс — Одеса Live',
    'Енергійний концерт гурту Бумбокс на березі моря. Літній вечір та хіти!',
    '2026-07-18', '20:00', '23:00',
    46.484583, 30.732500,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'ivan_music'),
    'Одеса', FALSE, 1000.00, 'UAH',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'approved'
);

-- Одеса: Фестивалі
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Koktebel Jazz Festival',
    'Легендарний джазовий фестиваль тепер в Одесі! Три дні музики на узбережжі.',
    '2026-08-22', '16:00', '23:59',
    46.476944, 30.748889,
    (SELECT category_id FROM categories WHERE name = 'Фестивалі'),
    (SELECT user_id FROM users WHERE username = 'anna_fest'),
    'Одеса', FALSE, 1200.00, 'UAH',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    'approved'
);

-- Одеса: Спорт
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Одеський Пляжний Волейбол',
    'Відкритий турнір з пляжного волейболу на Ланжероні. Запрошуємо команди!',
    '2026-07-25', '09:00', '17:00',
    46.479722, 30.741667,
    (SELECT category_id FROM categories WHERE name = 'Спорт'),
    (SELECT user_id FROM users WHERE username = 'dmytro_sport'),
    'Одеса', FALSE, 150.00, 'UAH',
    'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800',
    'approved'
);

-- Харків: Концерти
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'The Hardkiss — Харків',
    'Рок-гурт The Hardkiss з концертом у Палаці Студентів. Нові треки та атмосфера!',
    '2026-08-05', '19:30', '22:00',
    49.993611, 36.230278,
    (SELECT category_id FROM categories WHERE name = 'Концерти'),
    (SELECT user_id FROM users WHERE username = 'ivan_music'),
    'Харків', FALSE, 850.00, 'UAH',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    'approved'
);

-- Харків: Освіта  
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Kharkiv IT Cluster Meetup',
    'Щомісячна зустріч IT-спільноти Харкова. Доповіді, нетворкінг, пітчі.',
    '2026-06-18', '18:00', '21:00',
    49.988611, 36.232500,
    (SELECT category_id FROM categories WHERE name = 'Освіта'),
    (SELECT user_id FROM users WHERE username = 'kateryna_edu'),
    'Харків', FALSE, 0.00, 'UAH',
    'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800',
    'approved'
);

-- Харків: Спорт
INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
VALUES (
    'Kharkiv Half Marathon',
    'Напівмарафон вулицями Харкова. Дистанції: 5 км, 10 км, 21 км.',
    '2026-09-28', '07:30', '14:00',
    50.004167, 36.231111,
    (SELECT category_id FROM categories WHERE name = 'Спорт'),
    (SELECT user_id FROM users WHERE username = 'dmytro_sport'),
    'Харків', FALSE, 450.00, 'UAH',
    'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800',
    'approved'
);

-- ==========================================
-- 4. РЕЙТИНГИ (оцінки подій)
-- ==========================================
INSERT INTO ratings (event_id, user_id, score)
SELECT e.event_id, u.user_id, 
    CASE 
        WHEN random() < 0.2 THEN 3
        WHEN random() < 0.5 THEN 4
        ELSE 5
    END
FROM events e
CROSS JOIN users u
WHERE e.event_id <= 5 AND u.user_id <= 5
ON CONFLICT (user_id, event_id) DO NOTHING;

INSERT INTO ratings (event_id, user_id, score)
SELECT e.event_id, u.user_id,
    CASE 
        WHEN random() < 0.3 THEN 4
        ELSE 5
    END
FROM events e
CROSS JOIN users u
WHERE e.event_id BETWEEN 6 AND 10 AND u.user_id BETWEEN 3 AND 8
ON CONFLICT (user_id, event_id) DO NOTHING;

INSERT INTO ratings (event_id, user_id, score)
SELECT e.event_id, u.user_id,
    CASE 
        WHEN random() < 0.2 THEN 3
        WHEN random() < 0.6 THEN 4
        ELSE 5
    END
FROM events e
CROSS JOIN users u
WHERE e.event_id > 10 AND u.user_id <= 6
ON CONFLICT (user_id, event_id) DO NOTHING;

-- ==========================================
-- 5. УЧАСНИКИ ПОДІЙ
-- ==========================================
INSERT INTO event_participants (user_id, event_id, status)
SELECT u.user_id, e.event_id, 
    CASE 
        WHEN random() < 0.7 THEN 'going'
        ELSE 'interested'
    END
FROM users u
CROSS JOIN events e
WHERE u.user_id <= 5 AND e.event_id <= 8
ON CONFLICT (user_id, event_id) DO NOTHING;

-- ==========================================
-- 6. КОМЕНТАРІ
-- ==========================================
INSERT INTO comments (event_id, user_id, content) VALUES
    (1, 4, 'Не можу дочекатися цього концерту! 🎶'),
    (1, 5, 'Хто йде? Давайте зберемося компанією!'),
    (2, 3, 'Океан Ельзи — це завжди неймовірно! 🎸'),
    (4, 5, 'Atlas Weekend — найкращий фестиваль! 🎉'),
    (4, 2, 'Вже купила квитки, ледве чекаю літа'),
    (6, 4, 'Хтось знає, які спікери будуть на DevFest?'),
    (6, 8, 'Минулого року було дуже круто, рекомендую'),
    (9, 5, 'ДахаБраха в оперному — це буде щось неймовірне!'),
    (11, 3, 'Leopolis Jazz Fest — перлина Львова 🎷'),
    (14, 7, 'Бумбокс на березі моря — мрія!'),
    (8, 6, 'Бігти марафон по Києву — незабутній досвід'),
    (12, 4, 'Фестиваль кави у Львові — це must visit! ☕');

-- ==========================================
-- 7. СПОВІЩЕННЯ
-- ==========================================
INSERT INTO notifications (user_id, type, message, related_id, is_read) VALUES
    (4, 'system', 'Ласкаво просимо до Event Manager! 🎉', NULL, FALSE),
    (5, 'system', 'Ласкаво просимо до Event Manager! 🎉', NULL, FALSE),
    (4, 'reminder', 'Подія "MONATIK — Великий концерт" відбудеться через 3 дні', 1, FALSE),
    (5, 'invite', 'Вас запрошено на подію "Atlas Weekend 2026"', 4, FALSE),
    (3, 'system', 'Ваша подія "Океан Ельзи — Тур 2026" схвалена модератором ✅', 2, TRUE),
    (6, 'reminder', 'Подія "Leopolis Jazz Fest 2026" вже скоро!', 11, FALSE);

-- ==========================================
-- ГОТОВО! ✅
-- ==========================================
SELECT 'Seed data inserted successfully! 🎉' AS result;
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Events: ' || COUNT(*) FROM events;
SELECT 'Ratings: ' || COUNT(*) FROM ratings;
SELECT 'Comments: ' || COUNT(*) FROM comments;
SELECT 'Participants: ' || COUNT(*) FROM event_participants;
SELECT 'Notifications: ' || COUNT(*) FROM notifications;
