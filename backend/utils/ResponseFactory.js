// ==========================================
// ПАТЕРН: Factory Method (Фабрика відповідей)
// Уніфікує формат JSON-відповідей для всього API.
//
// Замість різних форматів у кожному роуті:
//   res.json({ status: 'success', data: ... })
//   res.json({ msg: '...', event: ... })
//   res.json(result.rows)
//
// Тепер єдиний формат:
//   ResponseFactory.success(res, data, 'Повідомлення')
// ==========================================

class ResponseFactory {
    /**
     * Успішна відповідь
     * @param {Response} res — Express response
     * @param {*} data — дані відповіді
     * @param {string} message — повідомлення (опціонально)
     * @param {number} statusCode — HTTP-статус (за замовчуванням 200)
     */
    static success(res, data = null, message = null, statusCode = 200) {
        const response = { status: 'success' };

        if (message) response.message = message;
        if (data !== null && data !== undefined) response.data = data;

        return res.status(statusCode).json(response);
    }

    /**
     * Створено (201)
     */
    static created(res, data, message = 'Ресурс успішно створено') {
        return this.success(res, data, message, 201);
    }

    /**
     * Помилка
     * @param {Response} res
     * @param {string} message — повідомлення про помилку
     * @param {number} statusCode — HTTP-статус
     * @param {*} details — додаткові деталі (опціонально)
     */
    static error(res, message, statusCode = 500, details = null) {
        const response = {
            status: 'error',
            error: message
        };

        if (details) response.details = details;

        return res.status(statusCode).json(response);
    }

    /**
     * Пагінована відповідь
     */
    static paginated(res, data, total, page = 1, limit = 20) {
        return res.status(200).json({
            status: 'success',
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }

    /**
     * Список з кількістю
     */
    static list(res, items, message = null) {
        const response = {
            status: 'success',
            count: items.length,
            data: items
        };

        if (message) response.message = message;

        return res.status(200).json(response);
    }
}

module.exports = ResponseFactory;
