// ==========================================
// ПАТЕРН: Custom Error Hierarchy (Ієрархія помилок)
// Спеціалізовані класи помилок, які несуть HTTP-статус.
// Дозволяє централізовано обробляти всі помилки в одному місці
// (error-handler мідлвер у server.js), замість повторення
// res.status(XXX).json({...}) в кожному роуті.
// ==========================================

class AppError extends Error {
    /**
     * @param {string} message — повідомлення про помилку
     * @param {number} statusCode — HTTP-статус (400, 404, 500 тощо)
     * @param {*} details — додаткові деталі (опціонально)
     */
    constructor(message, statusCode, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true; // Відрізняє "очікувані" помилки від "критичних"
        Error.captureStackTrace(this, this.constructor);
    }

    // ==========================================
    // ПАТЕРН: Factory Method (Фабричні методи)
    // Зручні статичні методи для створення типових помилок
    // ==========================================

    /** 400 — Некоректний запит */
    static badRequest(message, details = null) {
        return new AppError(message, 400, details);
    }

    /** 401 — Не авторизований */
    static unauthorized(message = 'Ви повинні бути авторизовані') {
        return new AppError(message, 401);
    }

    /** 403 — Заборонено (немає прав) */
    static forbidden(message, details = null) {
        return new AppError(message, 403, details);
    }

    /** 404 — Не знайдено */
    static notFound(message = 'Ресурс не знайдено') {
        return new AppError(message, 404);
    }

    /** 409 — Конфлікт (дублікат тощо) */
    static conflict(message) {
        return new AppError(message, 409);
    }

    /** 500 — Внутрішня помилка */
    static internal(message = 'Внутрішня помилка сервера') {
        return new AppError(message, 500);
    }
}

module.exports = AppError;
