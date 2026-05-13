const express = require('express');
const router = express.Router();
const pool = require('../db');
const currencyService = require('../services/CurrencyService');

const DEFAULT_CURRENCY = 'UAH';

// =======================================================
// 1. GET /api/settings/currencies — Список підтримуваних валют
// =======================================================
router.get('/currencies', (req, res) => {
    const currencies = currencyService.getSupportedCurrencies();
    res.json({
        status: 'success',
        data: currencies
    });
});

// =======================================================
// 2. GET /api/settings/:userId/currency — Отримати обрану валюту
// =======================================================
router.get('/:userId/currency', async (req, res) => {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const result = await pool.query(
            'SELECT setting_value FROM user_settings WHERE user_id = $1 AND setting_key = $2',
            [userId, 'currency']
        );

        res.json({
            status: 'success',
            data: {
                user_id: parseInt(userId),
                currency: result.rows.length > 0 ? result.rows[0].setting_value : DEFAULT_CURRENCY
            }
        });
    } catch (err) {
        console.error('Помилка отримання валютних налаштувань:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// =======================================================
// 3. PUT /api/settings/:userId/currency — Зберегти обрану валюту
// =======================================================
router.put('/:userId/currency', async (req, res) => {
    const { userId } = req.params;
    const { currency } = req.body;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    if (!currency) {
        return res.status(400).json({ error: 'Не вказано валюту' });
    }

    if (!currencyService.isValidCurrency(currency)) {
        const supported = currencyService.getSupportedCurrencies().map(c => c.code);
        return res.status(400).json({
            error: `Непідтримувана валюта: "${currency}". Доступні: ${supported.join(', ')}`
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, 'currency', currency.toUpperCase()]
        );

        res.json({
            status: 'success',
            msg: 'Валютні налаштування збережено',
            data: {
                user_id: parseInt(userId),
                currency: result.rows[0].setting_value,
                updated_at: result.rows[0].updated_at
            }
        });
    } catch (err) {
        console.error('Помилка збереження валютних налаштувань:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// =======================================================
// МОВНІ НАЛАШТУВАННЯ
// =======================================================

const DEFAULT_LANGUAGE = 'uk';

const SUPPORTED_LANGUAGES = [
    { code: 'uk', label: 'Українська' },
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' }
];

const isValidLanguage = (code) =>
    SUPPORTED_LANGUAGES.some(l => l.code === (code || '').toLowerCase());

// =======================================================
// 4. GET /api/settings/languages — Список підтримуваних мов
// =======================================================
router.get('/languages', (req, res) => {
    res.json({
        status: 'success',
        data: SUPPORTED_LANGUAGES
    });
});

// =======================================================
// 5. GET /api/settings/:userId/language — Отримати обрану мову
// =======================================================
router.get('/:userId/language', async (req, res) => {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const result = await pool.query(
            'SELECT setting_value FROM user_settings WHERE user_id = $1 AND setting_key = $2',
            [userId, 'language']
        );

        res.json({
            status: 'success',
            data: {
                user_id: parseInt(userId),
                language: result.rows.length > 0 ? result.rows[0].setting_value : DEFAULT_LANGUAGE
            }
        });
    } catch (err) {
        console.error('Помилка отримання мовних налаштувань:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// =======================================================
// 6. PUT /api/settings/:userId/language — Зберегти обрану мову
// =======================================================
router.put('/:userId/language', async (req, res) => {
    const { userId } = req.params;
    const { language } = req.body;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    if (!language) {
        return res.status(400).json({ error: 'Не вказано мову' });
    }

    if (!isValidLanguage(language)) {
        const supported = SUPPORTED_LANGUAGES.map(l => l.code);
        return res.status(400).json({
            error: `Непідтримувана мова: "${language}". Доступні: ${supported.join(', ')}`
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO user_settings (user_id, setting_key, setting_value, updated_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, setting_key)
             DO UPDATE SET setting_value = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [userId, 'language', language.toLowerCase()]
        );

        res.json({
            status: 'success',
            msg: 'Мовні налаштування збережено',
            data: {
                user_id: parseInt(userId),
                language: result.rows[0].setting_value,
                updated_at: result.rows[0].updated_at
            }
        });
    } catch (err) {
        console.error('Помилка збереження мовних налаштувань:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

module.exports = router;
