// ==========================================
// ПАТЕРН 1: Adapter (Адаптер)
// Адаптує зовнішній Overpass API (OpenStreetMap) до внутрішнього інтерфейсу.
// Роути не знають про деталі зовнішнього API — вони працюють з findNearby().
//
// ПАТЕРН 2: Proxy / Cache (Проксі / Кеш)
// Кешує результати зовнішнього API на 5 хвилин.
// Це зменшує навантаження на зовнішній сервер і прискорює відповідь.
//
// ПАТЕРН 3: Singleton
// Один екземпляр на весь додаток (module.exports = new HotelService())
// ==========================================

const logger = require('../utils/Logger');

class HotelService {
    constructor() {
        // Singleton
        if (HotelService._instance) {
            return HotelService._instance;
        }

        // Proxy/Cache — зберігаємо результати в пам'яті
        this.cache = new Map();
        this.CACHE_TTL = 5 * 60 * 1000; // 5 хвилин (у мілісекундах)

        HotelService._instance = this;
    }

    /**
     * Генерує ключ кешу на основі координат та радіусу
     * @private
     */
    _getCacheKey(lat, lng, radius) {
        // Округлюємо до 4 знаків для "нечіткого" кешу
        // (координати 49.8397 та 49.8398 потраплять в один кеш)
        const roundedLat = parseFloat(lat).toFixed(4);
        const roundedLng = parseFloat(lng).toFixed(4);
        return `${roundedLat}_${roundedLng}_${radius}`;
    }

    /**
     * Перевіряє, чи запис кешу ще актуальний
     * @private
     */
    _isExpired(entry) {
        return Date.now() - entry.timestamp > this.CACHE_TTL;
    }

    /**
     * Валідація та форматування URL готелю
     * @private
     */
    _validateAndFormatUrl(url) {
        if (!url) return null;

        let formattedUrl = url.trim();

        if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
            formattedUrl = 'https://' + formattedUrl;
        }

        try {
            new URL(formattedUrl);
            return formattedUrl;
        } catch (err) {
            return null;
        }
    }

    /**
     * ADAPTER: Пошук готелів поблизу координат
     * Адаптує Overpass API до простого внутрішнього інтерфейсу
     *
     * @param {number} lat — широта
     * @param {number} lng — довгота
     * @param {number} radius — радіус пошуку (метри, за замовчуванням 2000)
     * @returns {Array} — масив готелів [{id, name, lat, lng, website, bookingLink}]
     */
    async findNearby(lat, lng, radius = 2000) {
        // PROXY: Перевіряємо кеш
        const cacheKey = this._getCacheKey(lat, lng, radius);
        const cached = this.cache.get(cacheKey);

        if (cached && !this._isExpired(cached)) {
            logger.debug('HOTELS', `Cache HIT для ${cacheKey} (${cached.data.length} готелів)`);
            return cached.data;
        }

        // ADAPTER: Формуємо запит до зовнішнього API
        const overpassQuery = `
            [out:json];
            node(around:${radius},${lat},${lng})["tourism"="hotel"];
            out 10;
        `;

        const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

        logger.debug('HOTELS', `Cache MISS для ${cacheKey}, запит до Overpass API...`);

        const response = await fetch(overpassUrl);

        if (!response.ok) {
            throw new Error(`Помилка зовнішнього API: ${response.statusText}`);
        }

        const data = await response.json();

        // ADAPTER: Перетворюємо зовнішній формат у внутрішній
        const hotels = data.elements.map(hotel => {
            const hotelName = hotel.tags.name || "Готель (назва не вказана)";
            return {
                id: hotel.id,
                name: hotelName,
                lat: hotel.lat,
                lng: hotel.lon,
                website: this._validateAndFormatUrl(hotel.tags.website),
                bookingLink: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotelName)}`
            };
        });

        // PROXY: Зберігаємо в кеш
        this.cache.set(cacheKey, {
            data: hotels,
            timestamp: Date.now()
        });

        logger.info('HOTELS', `Знайдено ${hotels.length} готелів, збережено в кеш (TTL: ${this.CACHE_TTL / 1000}с)`);

        return hotels;
    }

    /**
     * Очистити кеш (для тестування або адміністрування)
     */
    clearCache() {
        this.cache.clear();
        logger.info('HOTELS', 'Кеш очищено');
    }

    /**
     * Статистика кешу
     */
    getCacheStats() {
        let activeEntries = 0;
        let expiredEntries = 0;

        for (const [key, entry] of this.cache) {
            if (this._isExpired(entry)) {
                expiredEntries++;
            } else {
                activeEntries++;
            }
        }

        return {
            total: this.cache.size,
            active: activeEntries,
            expired: expiredEntries,
            ttl_seconds: this.CACHE_TTL / 1000
        };
    }
}

// Singleton — один екземпляр на весь додаток
module.exports = new HotelService();
