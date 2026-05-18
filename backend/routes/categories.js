const express = require('express');
const router = express.Router();
const pool = require('../db');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
}));

module.exports = router;