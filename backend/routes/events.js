const express = require('express');
const router = express.Router();
const pool = require('../db');
const upload = require('../middleware/upload'); // 🟢 Підключаємо Multer для роботи з файлами

// ==========================================
// ПАТЕРН 1: Singleton / Service Pattern
// Логіка конвертації валют
// ==========================================
class CurrencyService {
    constructor() {
        this.rates = {
            'UAH': 1.00,
            'USD': 40.50,
            'EUR': 44.20
        };
    }

    convert(amount, fromCurrency, toCurrency) {
        if (!amount || amount <= 0) return 0;
        const fromRate = this.rates[(fromCurrency || 'UAH').toUpperCase()] || 1;
        const toRate = this.rates[toCurrency.toUpperCase()];
        if (!toRate) return amount; 
        const amountInBase = amount * fromRate;
        return (amountInBase / toRate).toFixed(2);
    }
}
const currencyService = new CurrencyService();

// ==========================================
// ПАТЕРН 1.1: Service Pattern
// Логіка обчислення відстаней між подіями (OSRM API)
// ==========================================
class DistanceService {
    constructor() {
        // Публічний демо-сервер OSRM (безкоштовний для базових запитів)
        // Для продакшену можна буде легко замінити URL на Mapbox або Google Maps
        this.baseUrl = 'http://router.project-osrm.org/route/v1/driving';
    }

    async calculateRoute(points) {
        // Потрібно мінімум 2 точки (старт і фініш) для обчислення
        if (!points || points.length < 2) return null;

        // OSRM очікує формат: "довгота,широта;довгота,широта;..."
        const coordinates = points
            .map(p => `${p.longitude},${p.latitude}`)
            .join(';');

        try {
            // Робимо запит (використовуємо вбудований fetch Node.js 18+)
            const response = await fetch(`${this.baseUrl}/${coordinates}?overview=false`);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                return {
                    distance_km: parseFloat((route.distance / 1000).toFixed(2)), // Метри в км
                    duration_min: Math.round(route.duration / 60)                // Секунди у хвилини
                };
            }
            return null;
        } catch (error) {
            console.error('Помилка під час звернення до Distance API:', error.message);
            return null;
        }
    }
}
const distanceService = new DistanceService();

// ==========================================
// ПАТЕРН 2: Strategy Pattern для сортування
// Дозволяє легко додавати нові типи сортування
// ==========================================
const sortStrategies = {
    'price_asc': (a, b) => a.base_uah_price - b.base_uah_price,
    'price_desc': (a, b) => b.base_uah_price - a.base_uah_price,
    'rating_desc': (a, b) => b.average_rating - a.average_rating,
    'rating_asc': (a, b) => a.average_rating - b.average_rating,
    'date_asc': (a, b) => new Date(a.event_day) - new Date(b.event_day),
    'date_desc': (a, b) => new Date(b.event_day) - new Date(a.event_day)
};

// =======================================================
// 1. GET /events - Отримання всіх подій (Фільтр + Рейтинг + Сортування)
// =======================================================
router.get('/', async (req, res) => {
    const { region, target_currency, sort_by } = req.query;

    try {
        // SQL запит з LEFT JOIN для динамічного підрахунку середнього рейтингу
        let queryText = `
            SELECT e.*, 
                   COALESCE(ROUND(AVG(r.score), 1), 0) as average_rating 
            FROM events e
            LEFT JOIN ratings r ON e.event_id = r.event_id
        `;
        let queryParams = [];
        let whereClauses = [];

        if (region) {
            whereClauses.push(`e.region = $1`);
            queryParams.push(region);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryText += ' GROUP BY e.event_id ORDER BY e.created_at DESC';

        const result = await pool.query(queryText, queryParams);
        let events = result.rows;

        // Обробка кожної події (Конвертація та підготовка до сортування)
        events = events.map(event => {
            const eventPrice = parseFloat(event.price) || 0;
            const eventCurrency = event.currency || 'UAH';
            
            // Рахуємо приховану ціну в грн для сортування
            const baseUahPrice = parseFloat(currencyService.convert(eventPrice, eventCurrency, 'UAH'));
            
            let displayPrice = eventPrice;
            let displayCurrency = eventCurrency;
            
            if (target_currency) {
                displayPrice = currencyService.convert(eventPrice, eventCurrency, target_currency);
                displayCurrency = target_currency.toUpperCase();
            }

            return {
                ...event,
                average_rating: parseFloat(event.average_rating),
                base_uah_price: baseUahPrice,
                display_price: displayPrice,
                display_currency: displayCurrency
            };
        });

        // Застосування сортування за стратегією
        if (sort_by && sortStrategies[sort_by.toLowerCase()]) {
            events.sort(sortStrategies[sort_by.toLowerCase()]);
        }

        // Видаляємо технічне поле перед відправкою клієнту
        events = events.map(event => {
            delete event.base_uah_price;
            return event;
        });

        res.json(events);
    } catch (err) {
        console.error('Помилка отримання подій:', err.message);
        res.status(500).send("Server error");
    }
});

// ==========================================
// 2. Фільтрація публічних подій за областю
// ==========================================
router.get('/filter', async (req, res) => {
    const { region } = req.query;
    if (!region) return res.status(400).json({ error: "Не вказано регіон" });

    try {
        const result = await pool.query(
            'SELECT * FROM events WHERE region = $1 AND is_private = FALSE ORDER BY event_day ASC', 
            [region]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка фільтрації");
    }
});

// ==========================================
// 3. Дані для побудови маршруту на карті ТА розрахунок відстані
// ==========================================
router.get('/route-data', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).send("Не вказано ID подій");
    
    // Зберігаємо оригінальний порядок ID
    const idArray = ids.split(',').map(Number);
    
    try {
        const result = await pool.query(
            'SELECT event_id, title, latitude, longitude, region FROM events WHERE event_id = ANY($1)',
            [idArray]
        );
        
        let events = result.rows;

        // Сортуємо події рівно в тому порядку, в якому юзер хоче їх відвідати
        events.sort((a, b) => idArray.indexOf(a.event_id) - idArray.indexOf(b.event_id));

        // Витягуємо лише валідні координати для сервісу
        const validPoints = events
            .filter(e => e.latitude && e.longitude)
            .map(e => ({
                latitude: parseFloat(e.latitude),
                longitude: parseFloat(e.longitude)
            }));

        // Базові значення маршруту
        let routingInfo = { distance_km: 0, duration_min: 0, status: "Немає даних для маршруту" };

        // Викликаємо інтеграцію API, якщо є хоча б 2 події з геолокацією
        if (validPoints.length >= 2) {
            const apiResult = await distanceService.calculateRoute(validPoints);
            if (apiResult) {
                routingInfo = { 
                    ...apiResult, 
                    status: "Успішно розраховано" 
                };
            }
        }

        res.json({
            route_points: events,
            routing_info: routingInfo
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка даних маршруту");
    }
});

// ==========================================
// ПАТЕРН 3: Query Builder (Будівельник запитів)
// ==========================================
class EventSearchBuilder {
    constructor() {
        this.query = 'SELECT * FROM events WHERE 1=1';
        this.values = [];
        this.paramIndex = 1;
    }

    searchByTitle(title) {
        if (title) {
            this.query += ` AND title ILIKE $${this.paramIndex}`;
            this.values.push(`%${title}%`);
            this.paramIndex++;
        }
        return this;
    }

    searchByKeyword(keyword) {
        if (keyword) {
            this.query += ` AND (title ILIKE $${this.paramIndex} OR description ILIKE $${this.paramIndex})`;
            this.values.push(`%${keyword}%`);
            this.paramIndex++;
        }
        return this;
    }

    filterByDate(date) {
        if (date) {
            this.query += ` AND event_day = $${this.paramIndex}`;
            this.values.push(date);
            this.paramIndex++;
        }
        return this;
    }

    filterByCity(city) {
        if (city) {
            this.query += ` AND region ILIKE $${this.paramIndex}`;
            this.values.push(`%${city}%`);
            this.paramIndex++;
        }
        return this;
    }

    filterByCategory(categoryId) {
        if (categoryId) {
            this.query += ` AND category_id = $${this.paramIndex}`;
            this.values.push(categoryId);
            this.paramIndex++;
        }
        return this;
    }

    build() {
        this.query += ' ORDER BY event_day ASC, start_time ASC';
        return { text: this.query, values: this.values };
    }
}

// =======================================================
// НОВИЙ МАРШРУТ: GET /events/search
// Обробляє: пошук за назвою, ключовими словами, датою, містом, категорією
// =======================================================
router.get('/search', async (req, res) => {
    const { title, keyword, date, city, category_id } = req.query;

    try {
        const builder = new EventSearchBuilder()
            .searchByTitle(title)
            .searchByKeyword(keyword)
            .filterByDate(date)
            .filterByCity(city)
            .filterByCategory(category_id);

        const { text, values } = builder.build();
        const result = await pool.query(text, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "За вашим запитом подій не знайдено" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Помилка розширеного пошуку подій:', err.message);
        res.status(500).send("Внутрішня помилка сервера під час пошуку");
    }
});

// ==========================================
// 4. Отримання однієї події за ID
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM events WHERE event_id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ msg: "Не знайдено" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// ==========================================
// 5. Створення нової події
// ==========================================
router.post('/', async (req, res) => {
    const { 
        title, description, event_day, start_time, end_time, 
        latitude, longitude, category_id, creator_id,
        region, is_private, price, currency 
    } = req.body;

    // Валідація
    if (!title || title.length < 5) return res.status(400).json({ error: "Назва коротка" });
    if (!region) return res.status(400).json({ error: "Вкажіть область" });

    try {
        const query = `
            INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`;
        
        const values = [title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private ?? true, price || 0, currency || 'UAH'];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка БД" });
    }
});

// ==========================================
// 🟢 НОВИЙ МАРШРУТ: POST /events/:id/image - Завантаження фото
// ==========================================
router.post('/:id/image', upload.single('image'), async (req, res) => {
    const eventId = req.params.id;

    // Перевіряємо, чи файл взагалі прийшов
    if (!req.file) {
        return res.status(400).json({ error: "Файл не завантажено або неправильний формат" });
    }

    // Формуємо шлях до картинки, який запишемо в БД
    const imageUrl = `/uploads/${req.file.filename}`;

    try {
        // Оновлюємо подію в базі даних
        const query = `
            UPDATE events 
            SET image_url = $1 
            WHERE event_id = $2 
            RETURNING *`;
        
        const result = await pool.query(query, [imageUrl, eventId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Подію не знайдено" });
        }

        res.json({ 
            message: "Фото успішно додано", 
            image_url: imageUrl,
            event: result.rows[0] 
        });

    } catch (err) {
        console.error("Помилка завантаження фото:", err.message);
        res.status(500).json({ error: "Помилка бази даних" });
    }
});

// ==========================================
// 6. ВИДАЛЕННЯ ПОДІЇ (DELETE)
// ==========================================
router.delete('/:id', async (req, res) => {
    const eventId = req.params.id;

    try {
        const result = await pool.query(
            'DELETE FROM events WHERE event_id = $1 RETURNING *', 
            [eventId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Подію не знайдено або вже видалено" });
        }

        res.json({ 
            msg: "Подію успішно видалено", 
            deleted_event: result.rows[0] 
        });
    } catch (err) {
        console.error('Помилка при видаленні події:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при видаленні" });
    }
});

module.exports = router;