const express = require('express');
const router = express.Router();

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Repository
// ==========================================
const favoriteRepo = require('../repositories/FavoriteRepository');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// ==========================================
const AppError = require('../utils/AppError');

// ==========================================
// ПАТЕРН: Logger Singleton
// ==========================================
const logger = require('../utils/Logger');

// =======================================================
// 1. GET /api/favorites/:user_id - Отримання списку обраних подій
// ПАТЕРН: Repository + Decorator
// =======================================================
router.get('/:user_id', asyncHandler(async (req, res) => {
    const { user_id } = req.params;

    // ПАТЕРН: Repository — делегуємо SQL-запит
    const favorites = await favoriteRepo.findByUserId(user_id);
    
    // Якщо обраних подій немає, повертаємо порожній масив (це нормально для фронтенду)
    res.json(favorites);
}));

// =======================================================
// 2. POST /api/favorites - Додати подію в обране
// ПАТЕРН: Repository + Decorator
// =======================================================
router.post('/', asyncHandler(async (req, res) => {
    const { user_id, event_id } = req.body;

    if (!user_id || !event_id) {
        throw AppError.badRequest("Не вказано user_id або event_id");
    }

    // ПАТЕРН: Repository — перевірка дублікатів
    const alreadyExists = await favoriteRepo.exists(user_id, event_id);

    if (alreadyExists) {
        throw AppError.conflict("Ця подія вже є в обраному");
    }

    // ПАТЕРН: Repository — додавання
    const newFavorite = await favoriteRepo.add(user_id, event_id);
    logger.info('FAVORITES', `Подію ${event_id} додано в обране для user ${user_id}`);
    
    res.status(201).json(newFavorite);
}));

// =======================================================
// 3. DELETE /api/favorites/:user_id/:event_id - Видалити з обраного
// ПАТЕРН: Repository + Decorator
// =======================================================
router.delete('/:user_id/:event_id', asyncHandler(async (req, res) => {
    const { user_id, event_id } = req.params;

    // ПАТЕРН: Repository — видалення
    const deletedRecord = await favoriteRepo.remove(user_id, event_id);

    if (!deletedRecord) {
        throw AppError.notFound("Цієї події немає в обраному");
    }

    logger.info('FAVORITES', `Подію ${event_id} видалено з обраного для user ${user_id}`);

    res.json({ 
        message: "Подію успішно видалено з обраного",
        deleted_record: deletedRecord 
    });
}));

module.exports = router;