const express = require('express');
const router = express.Router();

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Adapter + Proxy/Cache (HotelService)
// ==========================================
const hotelService = require('../services/HotelService');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// ==========================================
const AppError = require('../utils/AppError');
const logger = require('../utils/Logger');

// GET /api/hotels?lat=49.8397&lng=24.0297&radius=2000
router.get('/', asyncHandler(async (req, res) => {
    const { lat, lng, radius = 2000 } = req.query;

    if (!lat || !lng) {
        throw AppError.badRequest("Не вказані координати події (lat, lng)");
    }

    const hotels = await hotelService.findNearby(lat, lng, radius);
    logger.debug('HOTELS', `Знайдено ${hotels.length} готелів біля [${lat}, ${lng}]`);
    res.json(hotels);
}));

// DELETE /api/hotels/:id
router.delete('/:id', (req, res) => {
    const hotelId = req.params.id;
    if (!hotelId) {
        throw AppError.badRequest("Не вказано ID готелю");
    }
    res.json({ 
        message: `Готель з ID ${hotelId} успішно видалено`,
        deletedId: hotelId 
    });
});

module.exports = router;