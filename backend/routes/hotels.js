const express = require('express');
const router = express.Router();

// ==========================================
// ХЕЛПЕР: Валідація та форматування URL
// ==========================================
function validateAndFormatUrl(url) {
    if (!url) return null; // Якщо сайту немає, повертаємо null

    let formattedUrl = url.trim();

    // Якщо хтось вписав просто "www.hotel.lviv.ua" без протоколу
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl; 
    }

    try {
        // Вбудований парсер Node.js. Якщо URL некоректний - він викине помилку
        new URL(formattedUrl); 
        return formattedUrl;
    } catch (err) {
        // Якщо це був просто текст типу "немає сайту"
        return null; 
    }
}

// =======================================================
// GET /api/hotels?lat=49.8397&lng=24.0297&radius=2000
// =======================================================
router.get('/', async (req, res) => {
    // Отримуємо координати події та радіус пошуку (за замовчуванням 2 км)
    const { lat, lng, radius = 2000 } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: "Не вказані координати події (lat, lng)" });
    }

    try {
        // Формуємо запит до Overpass API (OpenStreetMap)
        // Шукаємо точки (node) в заданому радіусі з тегом tourism=hotel
        const overpassQuery = `
            [out:json];
            node(around:${radius},${lat},${lng})["tourism"="hotel"];
            out 10; 
        `; // out 10 - беремо максимум 10 готелів, щоб не засмічувати карту

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        // Робимо запит до зовнішнього API
        const response = await fetch(overpassUrl);
        
        if (!response.ok) {
            throw new Error(`Помилка зовнішнього API: ${response.statusText}`);
        }

        const data = await response.json();

        // Форматуємо відповідь для нашого фронтенду (залишаємо тільки потрібне)
        const hotels = data.elements.map(hotel => ({
            id: hotel.id,
            name: hotel.tags.name || "Готель (назва не вказана)",
            lat: hotel.lat,
            lng: hotel.lon,
            // 🟢 ДОДАНО: Використовуємо нашу функцію для перевірки посилання
            website: validateAndFormatUrl(hotel.tags.website)
        }));

        // Віддаємо масив готелів клієнту
        res.json(hotels);

    } catch (err) {
        console.error("Помилка пошуку готелів:", err.message);
        res.status(500).json({ error: "Помилка сервера при пошуку готелів" });
    }
});

module.exports = router;