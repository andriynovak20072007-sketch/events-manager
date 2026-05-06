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

module.exports = router;
