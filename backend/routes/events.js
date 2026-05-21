const express = require('express');
const router = express.Router();
const pool = require('../db');
const upload = require('../middleware/upload'); // 🟢 Підключаємо Multer для роботи з файлами

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// Обгортає кожен роут — помилки автоматично передаються до error-handler
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Всі SQL-запити інкапсульовані в одному місці
// ==========================================
const eventRepo = require('../repositories/EventRepository');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// Спеціалізовані помилки з HTTP-статусами
// ==========================================
const AppError = require('../utils/AppError');

// ==========================================
// ПАТЕРН: Logger Singleton
// Централізоване логування
// ==========================================
const logger = require('../utils/Logger');

// ==========================================
// ПАТЕРН 1: Singleton / Service Pattern
// Логіка конвертації валют (імпортована зі спільного сервісу)
// ==========================================
const currencyService = require('../services/CurrencyService');
const trialService = require('../services/TrialService');

// ==========================================
// ПАТЕРН 1.1: Service Pattern
// Логіка обчислення відстаней між подіями (OSRM API)
// ==========================================
class DistanceService {
    constructor() {
        // Публічний демо-сервер OSRM (безкоштовний для базових запитів)
        // Для продакшену можна буде легко замінити URL на Mapbox або Google Maps
        this.baseUrl = 'http://router.project-osrm.org/route/v1/driving';
    }

    async calculateRoute(points) {
        // Потрібно мінімум 2 точки (старт і фініш) для обчислення
        if (!points || points.length < 2) return null;

        // OSRM очікує формат: "довгота,широта;довгота,широта;..."
        const coordinates = points
            .map(p => `${p.longitude},${p.latitude}`)
            .join(';');

        try {
            // Робимо запит (використовуємо вбудований fetch Node.js 18+)
            const response = await fetch(`${this.baseUrl}/${coordinates}?overview=false`);
            const data = await response.json();

            if (data.code === 'Ok' && data.routes.length > 0) {
                const route = data.routes[0];
                return {
                    distance_km: parseFloat((route.distance / 1000).toFixed(2)), // Метри в км
                    duration_min: Math.round(route.duration / 60)                // Секунди у хвилини
                };
            }
            return null;
        } catch (error) {
            logger.error('DISTANCE', 'Помилка під час звернення до Distance API', error);
            return null;
        }
    }
}
const distanceService = new DistanceService();

// ==========================================
// ПАТЕРН 2: Strategy Pattern для сортування
// Дозволяє легко додавати нові типи сортування
// ==========================================
const sortStrategies = {
    'price_asc': (a, b) => a.base_uah_price - b.base_uah_price,
    'price_desc': (a, b) => b.base_uah_price - a.base_uah_price,
    'rating_desc': (a, b) => b.average_rating - a.average_rating,
    'rating_asc': (a, b) => a.average_rating - b.average_rating,
    'date_asc': (a, b) => new Date(a.event_day) - new Date(b.event_day),
    'date_desc': (a, b) => new Date(b.event_day) - new Date(a.event_day)
};

// ==========================================
// ПАТЕРН: DRY / Extract Method
// Виділення дублікату конвертації валюти в переиспользовуваний хелпер
// Раніше цей код дублювався в GET / та GET /scheduled
// ==========================================
function applyPriceConversion(events, targetCurrency) {
    return events.map(event => {
        const eventPrice = parseFloat(event.price) || 0;
        const eventCurrency = event.currency || 'UAH';

        // Рахуємо приховану ціну в грн для сортування
        const baseUahPrice = parseFloat(currencyService.convert(eventPrice, eventCurrency, 'UAH'));

        let displayPrice = eventPrice;
        let displayCurrency = eventCurrency;

        if (targetCurrency) {
            displayPrice = currencyService.convert(eventPrice, eventCurrency, targetCurrency);
            displayCurrency = targetCurrency.toUpperCase();
        }

        return {
            ...event,
            average_rating: parseFloat(event.average_rating),
            base_uah_price: baseUahPrice,
            display_price: displayPrice,
            display_currency: displayCurrency
        };
    });
}

/**
 * Видаляє технічне поле base_uah_price перед відправкою
 */
function stripTechnicalFields(events) {
    return events.map(event => {
        delete event.base_uah_price;
        return event;
    });
}

// =======================================================
// 1. GET /events - Отримання всіх подій (Фільтр + Рейтинг + Сортування)
// ПАТЕРН: Repository (SQL в EventRepository)
// ПАТЕРН: Decorator (asyncHandler замість try/catch)
// ПАТЕРН: DRY (applyPriceConversion замість дублювання)
// =======================================================
router.get('/', asyncHandler(async (req, res) => {
    const { region, target_currency, sort_by } = req.query;

    // ПАТЕРН: Repository — делегуємо SQL-запит
    const rawEvents = await eventRepo.findAll({ region });

    // ПАТЕРН: DRY — спільна функція конвертації
    let events = applyPriceConversion(rawEvents, target_currency);

    // Застосування сортування за стратегією
    if (sort_by && sortStrategies[sort_by.toLowerCase()]) {
        events.sort(sortStrategies[sort_by.toLowerCase()]);
    }

    // Видаляємо технічне поле перед відправкою клієнту
    events = stripTechnicalFields(events);

    res.json(events);
}));

// ==========================================
// 2. Фільтрація публічних подій за областю
// ==========================================
router.get('/filter', asyncHandler(async (req, res) => {
    const { region } = req.query;
    if (!region) throw AppError.badRequest("Не вказано регіон");

    const events = await eventRepo.findPublicByRegion(region);
    res.json(events);
}));

// ==========================================
// 3. Дані для побудови маршруту на карті ТА розрахунок відстані
// ==========================================
router.get('/route-data', asyncHandler(async (req, res) => {
    const { ids } = req.query;
    if (!ids) throw AppError.badRequest("Не вказано ID подій");

    // Зберігаємо оригінальний порядок ID (наприклад: "3,1,5" -> перша подія 3, друга 1, третя 5)
    const idArray = ids.split(',').map(Number);

    let events = await eventRepo.findRouteData(idArray);

    // Сортуємо події рівно в тому порядку, в якому юзер хоче їх відвідати
    events.sort((a, b) => idArray.indexOf(a.event_id) - idArray.indexOf(b.event_id));

    // Витягуємо лише валідні координати для сервісу
    const validPoints = events
        .filter(e => e.latitude && e.longitude)
        .map(e => ({
            latitude: parseFloat(e.latitude),
            longitude: parseFloat(e.longitude)
        }));

    // Базові значення маршруту
    let routingInfo = { distance_km: 0, duration_min: 0, status: "Немає даних для маршруту" };

    // Викликаємо інтеграцію API, якщо є хоча б 2 події з геолокацією
    if (validPoints.length >= 2) {
        const apiResult = await distanceService.calculateRoute(validPoints);
        if (apiResult) {
            routingInfo = {
                ...apiResult,
                status: "Успішно розраховано"
            };
        }
    }

    res.json({
        route_points: events,
        routing_info: routingInfo
    });
}));

// ==========================================
// ПАТЕРН 3: Query Builder (Будівельник запитів)
// ==========================================
class EventSearchBuilder {
    constructor() {
        this.query = 'SELECT * FROM events WHERE 1=1';
        this.values = [];
        this.paramIndex = 1;
    }

    searchByTitle(title) {
        if (title) {
            this.query += ` AND title ILIKE $${this.paramIndex}`;
            this.values.push(`%${title}%`);
            this.paramIndex++;
        }
        return this;
    }

    searchByKeyword(keyword) {
        if (keyword) {
            this.query += ` AND (title ILIKE $${this.paramIndex} OR description ILIKE $${this.paramIndex})`;
            this.values.push(`%${keyword}%`);
            this.paramIndex++;
        }
        return this;
    }

    filterByDate(date) {
        if (date) {
            this.query += ` AND event_day = $${this.paramIndex}`;
            this.values.push(date);
            this.paramIndex++;
        }
        return this;
    }

    filterByCity(city) {
        if (city) {
            this.query += ` AND region ILIKE $${this.paramIndex}`;
            this.values.push(`%${city}%`);
            this.paramIndex++;
        }
        return this;
    }

    filterByCategory(categoryId) {
        if (categoryId) {
            this.query += ` AND category_id = $${this.paramIndex}`;
            this.values.push(categoryId);
            this.paramIndex++;
        }
        return this;
    }

    build() {
        this.query += ' ORDER BY event_day ASC, start_time ASC';
        return { text: this.query, values: this.values };
    }
}

// =======================================================
// НОВИЙ МАРШРУТ: GET /events/search
// Обробляє: пошук за назвою, ключовими словами, датою, містом, категорією
// =======================================================
router.get('/search', asyncHandler(async (req, res) => {
    const { title, keyword, date, city, category_id } = req.query;

    const builder = new EventSearchBuilder()
        .searchByTitle(title)
        .searchByKeyword(keyword)
        .filterByDate(date)
        .filterByCity(city)
        .filterByCategory(category_id);

    const { text, values } = builder.build();
    const result = await pool.query(text, values);

    if (result.rows.length === 0) {
        throw AppError.notFound("За вашим запитом подій не знайдено");
    }

    res.json(result.rows);
}));

// =======================================================
// НОВИЙ МАРШРУТ: GET /events/scheduled
// Отримання лише запланованих (майбутніх) подій
// ПАТЕРН: Repository + DRY
// =======================================================
router.get('/scheduled', asyncHandler(async (req, res) => {
    const { region, target_currency, sort_by, creator_id, limit } = req.query;

    // ПАТЕРН: Repository — делегуємо SQL-запит
    const rawEvents = await eventRepo.findScheduled({ region, creator_id, limit });

    // ПАТЕРН: DRY — та сама функція конвертації, що і в GET /
    let events = applyPriceConversion(rawEvents, target_currency);

    // Сортування
    if (sort_by && sortStrategies[sort_by.toLowerCase()]) {
        events.sort(sortStrategies[sort_by.toLowerCase()]);
    }

    // Видаляємо технічне поле
    events = stripTechnicalFields(events);

    res.json({
        status: 'success',
        count: events.length,
        events: events
    });
}));

// =======================================================
// НОВИЙ МАРШРУТ: GET /events/calendar
// Фільтрація подій за діапазоном дат (для календаря)
// Query params: from (YYYY-MM-DD), to (YYYY-MM-DD)
// =======================================================
router.get('/calendar', asyncHandler(async (req, res) => {
    const { from, to, creator_id, region, category_id } = req.query;

    // Валідація: обов'язкові параметри дат
    if (!from || !to) {
        throw AppError.badRequest("Потрібно вказати параметри 'from' та 'to' у форматі YYYY-MM-DD");
    }

    // Валідація формату дат
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
        throw AppError.badRequest("Невірний формат дати. Використовуйте YYYY-MM-DD");
    }

    // Валідація: from не може бути пізніше to
    if (new Date(from) > new Date(to)) {
        throw AppError.badRequest("Дата 'from' не може бути пізніше за 'to'");
    }

    // ПАТЕРН: Repository
    const rows = await eventRepo.findByDateRange(from, to, { creator_id, region, category_id });

    // Групування подій за датами (зручно для календаря)
    const eventsByDate = {};
    for (const event of rows) {
        const dateKey = event.event_day instanceof Date 
            ? event.event_day.toISOString().split('T')[0] 
            : String(event.event_day).split('T')[0];
        
        if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
        }
        eventsByDate[dateKey].push({
            ...event,
            average_rating: parseFloat(event.average_rating)
        });
    }

    res.json({
        status: 'success',
        period: { from, to },
        total_events: rows.length,
        dates_with_events: Object.keys(eventsByDate).length,
        events_by_date: eventsByDate,
        events: rows.map(event => ({
            ...event,
            average_rating: parseFloat(event.average_rating)
        }))
    });
}));

// ==========================================
// 4. Отримання однієї події за ID
// ==========================================
router.get('/:id', asyncHandler(async (req, res) => {
    const event = await eventRepo.findById(req.params.id);
    if (!event) throw AppError.notFound("Не знайдено");
    res.json(event);
}));

// ==========================================
// 8. СТВОРЕННЯ ПРИВАТНОЇ ПОДІЇ (POST)
// УВАГА: повинен бути ДО /:id, щоб Express не плутав /private з ID
// ==========================================
router.post('/private', asyncHandler(async (req, res) => {
    const { title, creator_id } = req.body;

    if (!title || title.trim().length < 3) throw AppError.badRequest("Назва занадто коротка");
    if (!creator_id) throw AppError.badRequest("Не вказано creator_id");

    // ПАТЕРН: Repository
    const newEvent = await eventRepo.createPrivate(req.body);
    logger.info('EVENTS', `Приватну подію створено: "${title}"`);

    res.status(201).json({
        msg: "Приватна подія успішно створена",
        event: newEvent
    });
}));

// ==========================================
// 9. РЕДАГУВАННЯ ПРИВАТНОЇ ПОДІЇ (PUT)
// УВАГА: повинен бути ДО /:id
// ==========================================
router.put('/private/:id', asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    // ПАТЕРН: Repository
    const updatedEvent = await eventRepo.updatePrivate(eventId, req.body);

    if (!updatedEvent) {
        throw AppError.notFound("Приватну подію не знайдено, або ви не можете її змінити (можливо вона публічна)");
    }

    res.json({ msg: "Приватну подію успішно оновлено", updated_event: updatedEvent });
}));

// ==========================================
// 5. Створення нової події
// ==========================================
router.post('/', asyncHandler(async (req, res) => {
    const {
        title, description, event_day, start_time, end_time,
        latitude, longitude, category_id, creator_id,
        region, is_private, price, currency
    } = req.body;

    // Валідація
    if (!title || title.length < 5) throw AppError.badRequest("Назва коротка");
    if (!region) throw AppError.badRequest("Вкажіть область");
    if (price !== undefined && price < 0) throw AppError.badRequest("Ціна не може бути від'ємною");

    // Перевірка ліміту Trial/Starter плану (макс. 3 активні події)
    if (creator_id) {
        try {
            const canCreate = await trialService.canCreateEvent(creator_id);
            if (!canCreate.allowed) {
                throw AppError.forbidden(canCreate.reason, {
                    current_count: canCreate.current_count,
                    max_count: canCreate.max_count
                });
            }
        } catch (limitErr) {
            // Якщо це наша AppError — прокидуємо далі
            if (limitErr.isOperational) throw limitErr;
            // Інакше — Graceful degradation (дозволяємо створення)
            logger.warn('EVENTS', `Помилка перевірки ліміту: ${limitErr.message}`);
        }
    }

    // Check for Pro features (Design Constructor)
    let eventData = { ...req.body };
    if ((req.body.banner_url || req.body.button_color || req.body.theme !== 'light')) {
        const creatorInfo = await eventRepo.getCreatorRole(creator_id);
        if (!creatorInfo || creatorInfo.role !== 'pro') {
            eventData.banner_url = null;
            eventData.button_color = null;
            eventData.theme = 'light';
        }
    }

    // ПАТЕРН: Repository
    const newEvent = await eventRepo.create(eventData);
    logger.info('EVENTS', `Подію створено: "${title}" (ID: ${newEvent.event_id})`);
    res.status(201).json(newEvent);
}));

// ==========================================
// 🟢 НОВИЙ МАРШРУТ: POST /events/:id/image - Завантаження фото
// ==========================================
router.post('/:id/image', upload.single('image'), asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    // Перевіряємо, чи файл взагалі прийшов
    if (!req.file) {
        throw AppError.badRequest("Файл не завантажено або неправильний формат");
    }

    // Формуємо шлях до картинки, який запишемо в БД
    const imageUrl = `/uploads/${req.file.filename}`;

    // ПАТЕРН: Repository
    const updatedEvent = await eventRepo.updateImage(eventId, imageUrl);

    if (!updatedEvent) {
        throw AppError.notFound("Подію не знайдено");
    }

    res.json({
        message: "Фото успішно додано",
        image_url: imageUrl,
        event: updatedEvent
    });
}));

// ==========================================
// 5.1 РЕДАГУВАННЯ ПОДІЇ (PUT)
// ==========================================
router.put('/:id', asyncHandler(async (req, res) => {
    const eventId = req.params.id;

    const updatedEvent = await eventRepo.update(eventId, req.body);

    if (!updatedEvent) {
        throw AppError.notFound("Подію не знайдено");
    }

    logger.info('EVENTS', `Подію оновлено: ID ${eventId}`);

    res.json({
        msg: "Подію успішно оновлено",
        event: updatedEvent
    });
}));

// ==========================================
// 6. ВИДАЛЕННЯ ПОДІЇ (DELETE)
// ==========================================
router.delete('/:id', asyncHandler(async (req, res) => {
    const deletedEvent = await eventRepo.delete(req.params.id);

    if (!deletedEvent) {
        throw AppError.notFound("Подію не знайдено або вже видалено");
    }

    logger.info('EVENTS', `Подію видалено: ID ${req.params.id}`);
    res.json({
        msg: "Подію успішно видалено",
        deleted_event: deletedEvent
    });
}));



// ==========================================
// 10. ЗАПРОШЕННЯ ДРУЗІВ (POST)
// ==========================================
router.post('/:id/invite', asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const { user_ids } = req.body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
        throw AppError.badRequest("Передайте масив user_ids (IDs друзів) для запрошення");
    }

    // ПАТЕРН: Repository (транзакція інкапсульована)
    const results = await eventRepo.inviteParticipants(eventId, user_ids);

    res.status(200).json({
        msg: "Запрошення успішно надіслані",
        invited_count: results.length,
        invites: results
    });
}));

// ==========================================
// ПАТЕРН 4: State Machine (Кінцевий автомат) для статусів події
// Контролює валідні переходи між статусами
// ==========================================
class EventStateMachine {
    constructor() {
        // Описуємо можливі переходи: з якого статусу в які можна перейти
        this.transitions = {
            'planned': ['ongoing', 'cancelled'],
            'ongoing': ['completed', 'cancelled'],
            'completed': [], // З завершеної події не можна перейти в інший стан
            'cancelled': []  // Скасовану подію не можна відновити
        };
    }

    canTransition(currentStatus, newStatus) {
        // Якщо статус не змінюється, це ок (наприклад, при іншому апдейті)
        if (currentStatus === newStatus) return true;

        const allowedNext = this.transitions[currentStatus] || [];
        return allowedNext.includes(newStatus);
    }

    get validStatuses() {
        return Object.keys(this.transitions);
    }
}
const eventStateMachine = new EventStateMachine();

// ==========================================
// 11. ОНОВЛЕННЯ СТАТУСУ ПОДІЇ ТА УЧАСНИКА (PATCH)
// ==========================================
router.patch('/:id/status', asyncHandler(async (req, res) => {
    const eventId = req.params.id;
    const { status: newStatus } = req.body;

    if (!newStatus || !eventStateMachine.validStatuses.includes(newStatus)) {
        throw AppError.badRequest("Недійсний статус. Допустимі: " + eventStateMachine.validStatuses.join(', '));
    }

    // ПАТЕРН: Repository
    const currentEvent = await eventRepo.getStatus(eventId);

    if (!currentEvent) {
        throw AppError.notFound("Подію не знайдено");
    }

    const currentStatus = currentEvent.status || 'planned';

    // Використовуємо патерн State Machine для перевірки логіки переходу
    if (!eventStateMachine.canTransition(currentStatus, newStatus)) {
        throw AppError.badRequest(
            `Помилка бізнес-логіки: неможливо перейти зі статусу '${currentStatus}' в '${newStatus}'`
        );
    }

    const updatedEvent = await eventRepo.updateStatus(eventId, newStatus);
    logger.info('EVENTS', `Статус події ${eventId} змінено: ${currentStatus} → ${newStatus}`);

    res.json({ msg: "Статус події оновлено", event: updatedEvent });
}));

router.patch('/:id/participants/:user_id/status', asyncHandler(async (req, res) => {
    const { id: eventId, user_id: userId } = req.params;
    const { status } = req.body;

    // ==========================================
    // ПАТЕРН: Registry (реєстр допустимих значень)
    // ==========================================
    const allowedStatuses = ['going', 'interested', 'invited', 'declined'];

    if (!status || !allowedStatuses.includes(status)) {
        throw AppError.badRequest("Недійсний статус учасника. Допустимі: " + allowedStatuses.join(', '));
    }

    // ПАТЕРН: Repository
    const updatedParticipant = await eventRepo.updateParticipantStatus(eventId, userId, status);

    if (!updatedParticipant) {
        throw AppError.notFound("Учасника не знайдено");
    }

    res.json({ msg: "Статус учасника оновлено", participant: updatedParticipant });
}));

module.exports = router;