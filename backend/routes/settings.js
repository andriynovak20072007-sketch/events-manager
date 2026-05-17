const express = require('express');
const router = express.Router();
const currencyService = require('../services/CurrencyService');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Repository
// ==========================================
const settingsRepo = require('../repositories/SettingsRepository');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// ==========================================
const AppError = require('../utils/AppError');

// ==========================================
// ПАТЕРН: Middleware Chain (Валідація)
// ==========================================
const { validateUserId } = require('../middleware/validate');

// ==========================================
// ПАТЕРН: Logger Singleton
// ==========================================
const logger = require('../utils/Logger');

// ==========================================
// ПАТЕРН: Registry (Реєстр конфігурацій)
// Централізований каталог підтримуваних налаштувань
// Додати нову мову — лише додати запис сюди
// ==========================================

const DEFAULT_CURRENCY = 'UAH';
const DEFAULT_LANGUAGE = 'uk';

const SUPPORTED_LANGUAGES = [
    { code: 'uk', label: 'Українська' },
    { code: 'en', label: 'English' },
    { code: 'pl', label: 'Polski' }
];

const isValidLanguage = (code) =>
    SUPPORTED_LANGUAGES.some(l => l.code === (code || '').toLowerCase());

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
// ПАТЕРН: Middleware Chain (validateUserId)
// ПАТЕРН: Repository
// =======================================================
router.get('/:userId/currency', validateUserId(), asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // ПАТЕРН: Repository — єдиний виклик для отримання налаштування
    const currency = await settingsRepo.get(userId, 'currency', DEFAULT_CURRENCY);

    res.json({
        status: 'success',
        data: {
            user_id: parseInt(userId),
            currency
        }
    });
}));

// =======================================================
// 3. PUT /api/settings/:userId/currency — Зберегти обрану валюту
// ПАТЕРН: Middleware Chain (validateUserId)
// ПАТЕРН: Repository
// =======================================================
router.put('/:userId/currency', validateUserId(), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { currency } = req.body;

    if (!currency) {
        throw AppError.badRequest('Не вказано валюту');
    }

    if (!currencyService.isValidCurrency(currency)) {
        const supported = currencyService.getSupportedCurrencies().map(c => c.code);
        throw AppError.badRequest(
            `Непідтримувана валюта: "${currency}". Доступні: ${supported.join(', ')}`
        );
    }

    // ПАТЕРН: Repository (UPSERT)
    const result = await settingsRepo.set(userId, 'currency', currency.toUpperCase());

    logger.info('SETTINGS', `Валюта для user ${userId}: ${currency.toUpperCase()}`);

    res.json({
        status: 'success',
        msg: 'Валютні налаштування збережено',
        data: {
            user_id: parseInt(userId),
            currency: result.setting_value,
            updated_at: result.updated_at
        }
    });
}));

// =======================================================
// 4. GET /api/settings/languages — Список підтримуваних мов
// ПАТЕРН: Registry
// =======================================================
router.get('/languages', (req, res) => {
    res.json({
        status: 'success',
        data: SUPPORTED_LANGUAGES
    });
});

// =======================================================
// 5. GET /api/settings/:userId/language — Отримати обрану мову
// ПАТЕРН: Middleware Chain + Repository
// =======================================================
router.get('/:userId/language', validateUserId(), asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // ПАТЕРН: Repository
    const language = await settingsRepo.get(userId, 'language', DEFAULT_LANGUAGE);

    res.json({
        status: 'success',
        data: {
            user_id: parseInt(userId),
            language
        }
    });
}));

// =======================================================
// 6. PUT /api/settings/:userId/language — Зберегти обрану мову
// ПАТЕРН: Middleware Chain + Repository + Registry
// =======================================================
router.put('/:userId/language', validateUserId(), asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { language } = req.body;

    if (!language) {
        throw AppError.badRequest('Не вказано мову');
    }

    // ПАТЕРН: Registry — перевірка проти реєстру
    if (!isValidLanguage(language)) {
        const supported = SUPPORTED_LANGUAGES.map(l => l.code);
        throw AppError.badRequest(
            `Непідтримувана мова: "${language}". Доступні: ${supported.join(', ')}`
        );
    }

    // ПАТЕРН: Repository (UPSERT)
    const result = await settingsRepo.set(userId, 'language', language.toLowerCase());

    logger.info('SETTINGS', `Мова для user ${userId}: ${language.toLowerCase()}`);

    res.json({
        status: 'success',
        msg: 'Мовні налаштування збережено',
        data: {
            user_id: parseInt(userId),
            language: result.setting_value,
            updated_at: result.updated_at
        }
    });
}));

module.exports = router;
