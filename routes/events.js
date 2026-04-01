const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН 1: Singleton / Service Pattern
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

// ==========================================
// ПАТЕРН: Strategy Pattern для сортування (ОНОВЛЕНО)
// ==========================================
const sortStrategies = {
    'price_asc': (a, b) => a.base_uah_price - b.base_uah_price,       // Найдешевші
    'price_desc': (a, b) => b.base_uah_price - a.base_uah_price,      // Найдорожчі
    'rating_desc': (a, b) => b.average_rating - a.average_rating,     // Топ рейтинг (5.0 -> 0.0)
    'rating_asc': (a, b) => a.average_rating - b.average_rating       // Найгірші (0.0 -> 5.0)
};

// =======================================================
// 1. GET /events - Отримання всіх подій (Фільтр + Конвертація + Сортування)
// Виклик: /api/events?sort_by=rating_desc
// =======================================================
router.get('/', async (req, res) => {
    // Додали параметр sort_by (замість sort_price)
    const { region, target_currency, sort_by } = req.query;

    try {
        // ВИКОРИСТОВУЄМО LEFT JOIN та AVG() для підрахунку рейтингу "на льоту"
        let queryText = `
            SELECT e.*, 
                   COALESCE(ROUND(AVG(r.score), 1), 0) as average_rating 
            FROM events e
            LEFT JOIN ratings r ON e.event_id = r.event_id
        `;
        let queryParams = [];
        let whereClauses = [];

        // Фільтрація по регіону
        if (region) {
            whereClauses.push(`e.region = $1`);
            queryParams.push(region);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        // Групуємо, бо використовуємо агрегатну функцію AVG
        queryText += ' GROUP BY e.event_id ORDER BY e.created_at DESC';

        const result = await pool.query(queryText, queryParams);
        let events = result.rows;

        // Нормалізація цін та конвертація валют
        events = events.map(event => {
            const eventPrice = parseFloat(event.price) || 0;
            const eventCurrency = event.currency || 'UAH';
            const baseUahPrice = parseFloat(currencyService.convert(eventPrice, eventCurrency, 'UAH'));
            
            let displayPrice = eventPrice;
            let displayCurrency = eventCurrency;
            
            if (target_currency) {
                displayPrice = currencyService.convert(eventPrice, eventCurrency, target_currency);
                displayCurrency = target_currency.toUpperCase();
            }

            return {
                ...event,
                average_rating: parseFloat(event.average_rating), // Перетворюємо з рядка в число
                base_uah_price: baseUahPrice,
                display_price: displayPrice,
                display_currency: displayCurrency
            };
        });

        // Застосовуємо Патерн Стратегія для сортування (ціна АБО рейтинг)
        if (sort_by && sortStrategies[sort_by.toLowerCase()]) {
            events.sort(sortStrategies[sort_by.toLowerCase()]);
        }

        // Очищаємо технічне поле ціни
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

// =======================================================
// 4. GET /events/:id - Отримання однієї події за ID
// =======================================================
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Зверни увагу: у твоїй базі колонка називається event_id, а не id
        const result = await pool.query('SELECT * FROM events WHERE event_id = $1', [eventId]);

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
