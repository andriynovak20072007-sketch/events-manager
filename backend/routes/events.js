const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Singleton / Service Pattern
// Виносимо логіку конвертації в окремий сервіс
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

// =======================================================
// 1. GET /events - Отримання всіх подій (Фільтр по регіону + Конвертація)
// =======================================================
router.get('/', async (req, res) => {
    const { region, target_currency } = req.query;

    try {
        let queryText = 'SELECT * FROM events';
        let queryParams = [];

        // Фільтрація по регіону
        if (region) {
            queryText += ' WHERE region = $1';
            queryParams.push(region);
        }

        queryText += ' ORDER BY created_at DESC';

        const result = await pool.query(queryText, queryParams);
        let events = result.rows;

        // Конвертація валют
        if (target_currency) {
            events = events.map(event => {
                if (event.price > 0) {
                    return {
                        ...event,
                        display_price: currencyService.convert(event.price, event.currency, target_currency),
                        display_currency: target_currency.toUpperCase()
                    };
                }
                return event;
            });
        }

        res.json(events);
    } catch (err) {
        console.error('Помилка отримання подій:', err.message);
        res.status(500).send("Server error");
    }
});

// ==========================================
// 2. ЛОГІКА СПІВСТАВЛЕННЯ З ОБЛАСТЯМИ
// ==========================================
router.get('/filter', async (req, res) => {
    const { region } = req.query;
            //обробка помилки

    try {
        const result = await pool.query(
            'SELECT * FROM events WHERE region = $1 AND is_private = FALSE ORDER BY event_day ASC', 
            [region]
        );
        res.json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка фільтрації за областю");
    }
});

// ==========================================
// 3. ЛОГІКА ДЛЯ МАРШРУТІВ
// ==========================================
router.get('/route-data', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).send("Не вказано ID подій для маршруту");
    
    const idArray = ids.split(',').map(Number);
    try {
        const result = await pool.query(
            'SELECT event_id, title, latitude, longitude, region FROM events WHERE event_id = ANY($1)',
            [idArray]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка підготовки даних маршруту");
    }
});

// ==========================================
// ПАТЕРН: Query Builder (Будівельник запитів)
// Використовується виключно для нових завдань фільтрації та пошуку
// ==========================================
class EventSearchBuilder {
    constructor() {
        // Базовий запит (1=1 дозволяє легко додавати AND умови далі)
        this.query = 'SELECT * FROM events WHERE 1=1';
        this.values = [];
        this.paramIndex = 1;
    }

    // 1. Реалізувати API пошуку за назвою
    searchByTitle(title) {
        if (title) {
            this.query += ` AND title ILIKE $${this.paramIndex}`;
            this.values.push(`%${title}%`); // ILIKE забезпечує пошук без урахування регістру
            this.paramIndex++;
        }
        return this;
    }

    // 2. Реалізувати API пошуку за тегами/ключовими словами
    searchByKeyword(keyword) {
        if (keyword) {
            // Шукаємо ключове слово і в назві, і в описі
            this.query += ` AND (title ILIKE $${this.paramIndex} OR description ILIKE $${this.paramIndex})`;
            this.values.push(`%${keyword}%`);
            this.paramIndex++;
        }
        return this;
    }

    // 3. Реалізувати API фільтрації по даті
    filterByDate(date) {
        if (date) {
            this.query += ` AND event_day = $${this.paramIndex}`;
            this.values.push(date);
            this.paramIndex++;
        }
        return this;
    }

    // 4. Реалізувати API фільтрації по місту (використовуємо поле region)
    filterByCity(city) {
        if (city) {
            this.query += ` AND region ILIKE $${this.paramIndex}`;
            this.values.push(`%${city}%`);
            this.paramIndex++;
        }
        return this;
    }

    // 5. Реалізувати API фільтрації по категорії
    filterByCategory(categoryId) {
        if (categoryId) {
            this.query += ` AND category_id = $${this.paramIndex}`;
            this.values.push(categoryId);
            this.paramIndex++;
        }
        return this;
    }

    build() {
        // Додаємо сортування за замовчуванням: найближчі події першими
        this.query += ' ORDER BY event_day ASC, start_time ASC';
        return { text: this.query, values: this.values };
    }
}

// =======================================================
// НОВИЙ МАРШРУТ: GET /events/search
// Обробляє: пошук за назвою, ключовими словами, датою, містом, категорією
// ВАЖЛИВО: Розмістити ПЕРЕД router.get('/:id', ...)
// =======================================================
router.get('/search', async (req, res) => {
    // Зчитуємо параметри з URL (наприклад: /api/events/search?city=Львів&date=2024-05-20)
    const { title, keyword, date, city, category_id } = req.query;

    try {
        // Використовуємо наш патерн Будівельник для формування запиту
        const builder = new EventSearchBuilder()
            .searchByTitle(title)
            .searchByKeyword(keyword)
            .filterByDate(date)
            .filterByCity(city)
            .filterByCategory(category_id);

        const { text, values } = builder.build();

        // Виконуємо згенерований запит у БД
        const result = await pool.query(text, values);

        // Обробка пустого результату 
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "За вашим запитом подій не знайдено" });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Помилка розширеного пошуку подій:', err.message);
        res.status(500).send("Внутрішня помилка сервера під час пошуку");
    }
});

// =======================================================
// 4. GET /events/:id - Отримання однієї події за ID
// =======================================================
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const result = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);

        //обробка помилок

        if (result.rows.length === 0) {
            return res.status(404).json({ msg: "Подію не знайдено" });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Помилка отримання події за ID:', err.message);
        res.status(500).send("Server error");
    }
});

// ==========================================
// 5. СТВОРЕННЯ НОВОЇ ПОДІЇ (POST)
// ==========================================
router.post('/', async (req, res) => {
    const { 
        title, description, event_day, start_time, end_time, 
        latitude, longitude, category_id, creator_id,
        region, is_private, price, currency 
    } = req.body;

    if (!title || title.trim().length < 5) return res.status(400).json({ error: "Назва занадто коротка" });
    if (!description || description.trim().length < 10) return res.status(400).json({ error: "Опис занадто короткий" });
    if (!event_day || !start_time || !end_time) return res.status(400).json({ error: "Дата та час обов'язкові" });
    if (!creator_id) return res.status(400).json({ error: "Не вказано ID творця події" });
    if (!region) return res.status(400).json({ error: "Обов'язково вкажіть область (region)" });

    const eventPrice = price !== undefined ? parseFloat(price) : 0.00;
    if (eventPrice < 0) return res.status(400).json({ error: "Ціна не може бути від'ємною" });
    const eventCurrency = currency ? currency.toUpperCase() : 'UAH';
    
    //обробка помилки

    try {
        const query = `
            INSERT INTO events (title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, is_private, price, currency) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
            RETURNING *`;
        
        const eventIsPrivate = is_private !== undefined ? is_private : true;
        const values = [title, description, event_day, start_time, end_time, latitude, longitude, category_id, creator_id, region, eventIsPrivate, eventPrice, eventCurrency];
        
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка при створенні події в БД" });
    }
});

module.exports = router;