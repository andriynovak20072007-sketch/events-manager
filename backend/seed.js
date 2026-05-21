/**
 * Seed script — заповнює базу даних тестовими даними
 * Запуск: node seed.js
 */
require('dotenv').config();
const { Pool } = require('pg');

// Підключення через індивідуальні env-змінні (для локальної розробки)
const pool = new Pool({
    user: process.env.DB_USER,
    password: 'Senio728',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'Event_Manager',
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🔄 Починаю заповнення бази даних...\n');

        // ==========================================
        // 1. КАТЕГОРІЇ
        // ==========================================
        console.log('📁 Додаю категорії...');
        await client.query(`
            INSERT INTO categories (name) VALUES
                ('Концерти'),
                ('Фестивалі'),
                ('Освіта'),
                ('Спорт')
            ON CONFLICT (name) DO NOTHING;
        `);
        const cats = await client.query('SELECT * FROM categories');
        console.log(`   ✅ Категорій в базі: ${cats.rows.length}`);

        // ==========================================
        // 2. КОРИСТУВАЧІ
        // ==========================================
        console.log('👥 Додаю користувачів...');
        // bcrypt hash for 'password123'
        const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
        await client.query(`
            INSERT INTO users (username, email, password_hash, role) VALUES
                ('admin',        'admin@eventmanager.ua',     $1, 'manager'),
                ('olena_event',  'olena@gmail.com',           $1, 'manager'),
                ('ivan_music',   'ivan.music@gmail.com',      $1, 'manager'),
                ('maria_pro',    'maria.pro@outlook.com',     $1, 'pro'),
                ('petro_user',   'petro@ukr.net',             $1, 'user'),
                ('anna_fest',    'anna.fest@gmail.com',        $1, 'manager'),
                ('dmytro_sport', 'dmytro.sport@gmail.com',    $1, 'manager'),
                ('kateryna_edu', 'kateryna.edu@gmail.com',    $1, 'manager')
            ON CONFLICT (username) DO NOTHING;
        `, [hash]);
        const users = await client.query('SELECT user_id, username, role FROM users');
        console.log(`   ✅ Користувачів в базі: ${users.rows.length}`);

        // Отримуємо IDs
        const getUser = (name) => users.rows.find(u => u.username === name)?.user_id;
        const getCat = (name) => cats.rows.find(c => c.name === name)?.category_id;

        // ==========================================
        // 3. ПОДІЇ (20 подій)
        // ==========================================
        console.log('🎉 Додаю події...');

        const eventsData = [
            // Київ: Концерти
            {
                title: 'MONATIK — Великий концерт',
                description: 'Грандіозне шоу MONATIK у Палаці Спорту. Нові хіти та легендарні пісні в одному концерті!',
                event_day: '2026-06-15', start_time: '19:00', end_time: '22:00',
                lat: 50.438889, lng: 30.521389, cat: 'Концерти', creator: 'ivan_music',
                region: 'Київ', price: 1200, photo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800'
            },
            {
                title: 'Океан Ельзи — Тур 2026',
                description: 'Легендарний гурт Океан Ельзи з новою програмою на НСК Олімпійський.',
                event_day: '2026-07-20', start_time: '20:00', end_time: '23:00',
                lat: 50.432222, lng: 30.521667, cat: 'Концерти', creator: 'ivan_music',
                region: 'Київ', price: 1500, photo: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'
            },
            {
                title: 'Jazz на Хрещатику',
                description: 'Відкритий джаз-концерт просто неба. Живий звук, атмосфера та вечірній Київ.',
                event_day: '2026-06-28', start_time: '18:30', end_time: '21:30',
                lat: 50.449444, lng: 30.525278, cat: 'Концерти', creator: 'olena_event',
                region: 'Київ', price: 0, photo: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800'
            },
            // Київ: Фестивалі
            {
                title: 'Atlas Weekend 2026',
                description: 'Найбільший музичний фестиваль України! 5 днів неймовірної музики, їжі та розваг.',
                event_day: '2026-07-05', start_time: '12:00', end_time: '23:59',
                lat: 50.440833, lng: 30.597778, cat: 'Фестивалі', creator: 'anna_fest',
                region: 'Київ', price: 2500, photo: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
            },
            {
                title: 'Ulichnaya Eda — Фестиваль їжі',
                description: 'Фестиваль вуличної їжі на ВДНГ. Понад 100 фуд-кортів зі всього світу.',
                event_day: '2026-08-10', start_time: '11:00', end_time: '22:00',
                lat: 50.378611, lng: 30.478889, cat: 'Фестивалі', creator: 'anna_fest',
                region: 'Київ', price: 350, photo: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800'
            },
            // Київ: Освіта
            {
                title: 'IT конференція DevFest Kyiv',
                description: 'Щорічна конференція для розробників. Доповіді від Google, Microsoft та українських стартапів.',
                event_day: '2026-09-15', start_time: '09:00', end_time: '18:00',
                lat: 50.450556, lng: 30.523333, cat: 'Освіта', creator: 'kateryna_edu',
                region: 'Київ', price: 800, photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
            },
            {
                title: 'Startup Grind Kyiv',
                description: 'Зустріч стартап-спільноти Києва. Пітчі, нетворкінг та менторство від інвесторів.',
                event_day: '2026-06-22', start_time: '17:00', end_time: '20:00',
                lat: 50.444722, lng: 30.515278, cat: 'Освіта', creator: 'kateryna_edu',
                region: 'Київ', price: 0, photo: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800'
            },
            // Київ: Спорт
            {
                title: 'Київський Марафон 2026',
                description: 'Міжнародний марафон по вулицях Києва. Дистанції: 5 км, 10 км, напівмарафон, марафон.',
                event_day: '2026-10-05', start_time: '08:00', end_time: '15:00',
                lat: 50.450000, lng: 30.523333, cat: 'Спорт', creator: 'dmytro_sport',
                region: 'Київ', price: 600, photo: 'https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=800'
            },
            // Львів: Концерти
            {
                title: 'Дахабраха у Львові',
                description: 'Етно-хаос група ДахаБраха з концертом в оперному театрі. Незабутня акустика!',
                event_day: '2026-06-30', start_time: '19:00', end_time: '21:30',
                lat: 49.843889, lng: 24.026389, cat: 'Концерти', creator: 'ivan_music',
                region: 'Львів', price: 900, photo: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800'
            },
            {
                title: 'Джаз на площі Ринок',
                description: 'Вечір живого джазу в серці Львова. Безкоштовний вхід, атмосфера та кава.',
                event_day: '2026-07-12', start_time: '19:00', end_time: '22:00',
                lat: 49.841944, lng: 24.031389, cat: 'Концерти', creator: 'olena_event',
                region: 'Львів', price: 0, photo: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800'
            },
            // Львів: Фестивалі
            {
                title: 'Leopolis Jazz Fest 2026',
                description: 'Один з найвідоміших джазових фестивалів Європи. Музиканти зі світовим ім\'ям.',
                event_day: '2026-06-25', start_time: '14:00', end_time: '23:00',
                lat: 49.839167, lng: 24.032778, cat: 'Фестивалі', creator: 'anna_fest',
                region: 'Львів', price: 1800, photo: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800'
            },
            {
                title: 'Фестиваль Кави у Львові',
                description: 'Щорічний фестиваль для справжніх кавоманів. Дегустації, майстер-класи та бариста-баттли.',
                event_day: '2026-09-20', start_time: '10:00', end_time: '20:00',
                lat: 49.842222, lng: 24.028889, cat: 'Фестивалі', creator: 'anna_fest',
                region: 'Львів', price: 200, photo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800'
            },
            // Львів: Освіта
            {
                title: 'IT Arena Lviv 2026',
                description: 'Найбільша технологічна конференція Західної України. AI, Web3, кібербезпека.',
                event_day: '2026-10-10', start_time: '09:00', end_time: '19:00',
                lat: 49.837778, lng: 24.023333, cat: 'Освіта', creator: 'kateryna_edu',
                region: 'Львів', price: 1500, photo: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800'
            },
            // Одеса: Концерти
            {
                title: 'Бумбокс — Одеса Live',
                description: 'Енергійний концерт гурту Бумбокс на березі моря. Літній вечір та хіти!',
                event_day: '2026-07-18', start_time: '20:00', end_time: '23:00',
                lat: 46.484583, lng: 30.732500, cat: 'Концерти', creator: 'ivan_music',
                region: 'Одеса', price: 1000, photo: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'
            },
            // Одеса: Фестивалі
            {
                title: 'Koktebel Jazz Festival',
                description: 'Легендарний джазовий фестиваль тепер в Одесі! Три дні музики на узбережжі.',
                event_day: '2026-08-22', start_time: '16:00', end_time: '23:59',
                lat: 46.476944, lng: 30.748889, cat: 'Фестивалі', creator: 'anna_fest',
                region: 'Одеса', price: 1200, photo: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800'
            },
            // Одеса: Спорт
            {
                title: 'Одеський Пляжний Волейбол',
                description: 'Відкритий турнір з пляжного волейболу на Ланжероні. Запрошуємо команди!',
                event_day: '2026-07-25', start_time: '09:00', end_time: '17:00',
                lat: 46.479722, lng: 30.741667, cat: 'Спорт', creator: 'dmytro_sport',
                region: 'Одеса', price: 150, photo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800'
            },
            // Харків: Концерти
            {
                title: 'The Hardkiss — Харків',
                description: 'Рок-гурт The Hardkiss з концертом у Палаці Студентів. Нові треки та атмосфера!',
                event_day: '2026-08-05', start_time: '19:30', end_time: '22:00',
                lat: 49.993611, lng: 36.230278, cat: 'Концерти', creator: 'ivan_music',
                region: 'Харків', price: 850, photo: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800'
            },
            // Харків: Освіта
            {
                title: 'Kharkiv IT Cluster Meetup',
                description: 'Щомісячна зустріч IT-спільноти Харкова. Доповіді, нетворкінг, пітчі.',
                event_day: '2026-06-18', start_time: '18:00', end_time: '21:00',
                lat: 49.988611, lng: 36.232500, cat: 'Освіта', creator: 'kateryna_edu',
                region: 'Харків', price: 0, photo: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800'
            },
            // Харків: Спорт
            {
                title: 'Kharkiv Half Marathon',
                description: 'Напівмарафон вулицями Харкова. Дистанції: 5 км, 10 км, 21 км.',
                event_day: '2026-09-28', start_time: '07:30', end_time: '14:00',
                lat: 50.004167, lng: 36.231111, cat: 'Спорт', creator: 'dmytro_sport',
                region: 'Харків', price: 450, photo: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800'
            },
            // Додаткова подія — Київ
            {
                title: 'Вечір Електронної Музики',
                description: 'Найкращі DJ-сети на відкритій терасі з видом на Дніпро. Deep House, Techno, Progressive.',
                event_day: '2026-08-15', start_time: '21:00', end_time: '03:00',
                lat: 50.445278, lng: 30.528889, cat: 'Концерти', creator: 'olena_event',
                region: 'Київ', price: 700, photo: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800'
            },
        ];

        let insertedCount = 0;
        for (const e of eventsData) {
            try {
                await client.query(`
                    INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency, photo_url, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, $11, 'UAH', $12, 'approved')
                `, [e.title, e.description, e.event_day, e.start_time, e.end_time, e.lat, e.lng, getCat(e.cat), getUser(e.creator), e.region, e.price, e.photo]);
                insertedCount++;
            } catch (err) {
                if (err.code === '23505') { // duplicate key
                    console.log(`   ⏭️  Подія "${e.title}" вже існує, пропускаю`);
                } else {
                    console.error(`   ❌ Помилка при додаванні "${e.title}":`, err.message);
                }
            }
        }
        console.log(`   ✅ Додано подій: ${insertedCount}`);

        // ==========================================
        // 4. РЕЙТИНГИ
        // ==========================================
        console.log('⭐ Додаю рейтинги...');
        const allEvents = await client.query('SELECT event_id FROM events ORDER BY event_id');
        const allUsers = await client.query('SELECT user_id FROM users ORDER BY user_id');

        let ratingsCount = 0;
        for (const event of allEvents.rows) {
            // Кожна подія отримує 3-6 рейтингів
            const numRatings = 3 + Math.floor(Math.random() * 4);
            const shuffledUsers = [...allUsers.rows].sort(() => Math.random() - 0.5);

            for (let i = 0; i < Math.min(numRatings, shuffledUsers.length); i++) {
                const score = Math.random() < 0.15 ? 3 : (Math.random() < 0.4 ? 4 : 5);
                try {
                    await client.query(`
                        INSERT INTO ratings (event_id, user_id, score)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (user_id, event_id) DO NOTHING
                    `, [event.event_id, shuffledUsers[i].user_id, score]);
                    ratingsCount++;
                } catch (err) { /* ignore duplicates */ }
            }
        }
        console.log(`   ✅ Додано рейтингів: ${ratingsCount}`);

        // ==========================================
        // 5. УЧАСНИКИ ПОДІЙ
        // ==========================================
        console.log('🎫 Додаю учасників подій...');
        let participantsCount = 0;
        for (const event of allEvents.rows.slice(0, 12)) {
            const numParticipants = 2 + Math.floor(Math.random() * 4);
            const shuffledUsers = [...allUsers.rows].sort(() => Math.random() - 0.5);

            for (let i = 0; i < Math.min(numParticipants, shuffledUsers.length); i++) {
                const status = Math.random() < 0.7 ? 'going' : 'interested';
                try {
                    await client.query(`
                        INSERT INTO event_participants (user_id, event_id, status)
                        VALUES ($1, $2, $3)
                        ON CONFLICT (user_id, event_id) DO NOTHING
                    `, [shuffledUsers[i].user_id, event.event_id, status]);
                    participantsCount++;
                } catch (err) { /* ignore */ }
            }
        }
        console.log(`   ✅ Додано учасників: ${participantsCount}`);

        // ==========================================
        // 6. КОМЕНТАРІ
        // ==========================================
        console.log('💬 Додаю коментарі...');
        const comments = [
            { eidx: 0, user: 'maria_pro',   text: 'Не можу дочекатися цього концерту! 🎶' },
            { eidx: 0, user: 'petro_user',  text: 'Хто йде? Давайте зберемося компанією!' },
            { eidx: 1, user: 'ivan_music',  text: 'Океан Ельзи — це завжди неймовірно! 🎸' },
            { eidx: 3, user: 'petro_user',  text: 'Atlas Weekend — найкращий фестиваль! 🎉' },
            { eidx: 3, user: 'olena_event', text: 'Вже купила квитки, ледве чекаю літа' },
            { eidx: 5, user: 'maria_pro',   text: 'Хтось знає, які спікери будуть на DevFest?' },
            { eidx: 5, user: 'kateryna_edu',text: 'Минулого року було дуже круто, рекомендую' },
            { eidx: 8, user: 'petro_user',  text: 'ДахаБраха в оперному — це буде щось неймовірне!' },
            { eidx: 10, user: 'ivan_music', text: 'Leopolis Jazz Fest — перлина Львова 🎷' },
            { eidx: 13, user: 'dmytro_sport',text: 'Бумбокс на березі моря — мрія!' },
            { eidx: 7, user: 'anna_fest',   text: 'Бігти марафон по Києву — незабутній досвід' },
            { eidx: 11, user: 'maria_pro',  text: 'Фестиваль кави у Львові — це must visit! ☕' },
            { eidx: 2, user: 'anna_fest',   text: 'Джаз на Хрещатику — найкраща безкоштовна подія!' },
            { eidx: 4, user: 'dmytro_sport',text: 'Їжа була неймовірна минулого разу 🍔' },
            { eidx: 6, user: 'maria_pro',   text: 'Стартап Грайнд дуже надихає!' },
        ];

        let commentsCount = 0;
        for (const c of comments) {
            const eventId = allEvents.rows[c.eidx]?.event_id;
            const userId = getUser(c.user);
            if (eventId && userId) {
                try {
                    await client.query(
                        'INSERT INTO comments (event_id, user_id, content) VALUES ($1, $2, $3)',
                        [eventId, userId, c.text]
                    );
                    commentsCount++;
                } catch (err) { /* ignore */ }
            }
        }
        console.log(`   ✅ Додано коментарів: ${commentsCount}`);

        // ==========================================
        // 7. СПОВІЩЕННЯ
        // ==========================================
        console.log('🔔 Додаю сповіщення...');
        const notifications = [
            { user: 'maria_pro',  type: 'system',   msg: 'Ласкаво просимо до Event Manager! 🎉' },
            { user: 'petro_user', type: 'system',   msg: 'Ласкаво просимо до Event Manager! 🎉' },
            { user: 'maria_pro',  type: 'reminder', msg: 'Подія "MONATIK — Великий концерт" відбудеться незабаром!' },
            { user: 'petro_user', type: 'invite',   msg: 'Вас запрошено на подію "Atlas Weekend 2026"' },
            { user: 'ivan_music', type: 'system',   msg: 'Ваша подія "Океан Ельзи — Тур 2026" схвалена модератором ✅' },
            { user: 'anna_fest',  type: 'reminder', msg: 'Подія "Leopolis Jazz Fest 2026" вже скоро!' },
        ];

        let notifsCount = 0;
        for (const n of notifications) {
            const userId = getUser(n.user);
            if (userId) {
                try {
                    await client.query(
                        'INSERT INTO notifications (user_id, type, message, is_read) VALUES ($1, $2, $3, FALSE)',
                        [userId, n.type, n.msg]
                    );
                    notifsCount++;
                } catch (err) { /* ignore */ }
            }
        }
        console.log(`   ✅ Додано сповіщень: ${notifsCount}`);

        // ==========================================
        // ПІДСУМОК
        // ==========================================
        console.log('\n🎉 ====================================');
        console.log('   БАЗУ ДАНИХ ЗАПОВНЕНО УСПІШНО!');
        console.log('   ====================================');

        const summary = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM categories) as categories,
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM events) as events,
                (SELECT COUNT(*) FROM ratings) as ratings,
                (SELECT COUNT(*) FROM event_participants) as participants,
                (SELECT COUNT(*) FROM comments) as comments,
                (SELECT COUNT(*) FROM notifications) as notifications
        `);
        const s = summary.rows[0];
        console.log(`   📁 Категорій:   ${s.categories}`);
        console.log(`   👥 Користувачів: ${s.users}`);
        console.log(`   🎉 Подій:        ${s.events}`);
        console.log(`   ⭐ Рейтингів:    ${s.ratings}`);
        console.log(`   🎫 Учасників:    ${s.participants}`);
        console.log(`   💬 Коментарів:   ${s.comments}`);
        console.log(`   🔔 Сповіщень:    ${s.notifications}`);
        console.log('');

    } catch (err) {
        console.error('❌ ПОМИЛКА:', err.message);
        console.error(err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
