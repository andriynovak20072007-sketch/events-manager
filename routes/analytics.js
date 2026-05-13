const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// Маршрут для запису перегляду
router.post('/:eventId/view', analyticsController.recordView);

// Маршрут для базової статистики
router.get('/:eventId/summary', analyticsController.getEventSummary);

// Маршрут для детальної статистики (Pro+)
router.get('/:eventId/detailed', analyticsController.getEventDetailed);

// Маршрут для запису продажу
router.post('/:eventId/sale', analyticsController.recordSale);

module.exports = router;
