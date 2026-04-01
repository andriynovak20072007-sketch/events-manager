const express = require('express');
const router = express.Router();
const pool = require('../db');

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
// 3. Дані для побудови маршруту на карті
// ==========================================
router.get('/route-data', async (req, res) => {
    const { ids } = req.query;
    if (!ids) return res.status(400).send("Не вказано ID подій");
    
    const idArray = ids.split(',').map(Number);
    try {
        const result = await pool.query(
            'SELECT event_id, title, latitude, longitude, region FROM events WHERE event_id = ANY($1)',
            [idArray]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка даних маршруту");
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

    // Балідація
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

module.exports = router;