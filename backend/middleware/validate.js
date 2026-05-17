// ==========================================
// ПАТЕРН: Middleware Chain (Ланцюг мідлверів валідації)
// Переносимо повторювану логіку валідації з кожного роуту
// в окремі, переиспользовувані мідлвери.
//
// Використання:
//   router.get('/:userId/currency', validateUserId(), async (req, res) => { ... });
//   router.post('/', validateRequiredBody('user_id', 'type'), async (req, res) => { ... });
// ==========================================

const AppError = require('../utils/AppError');

/**
 * Мідлвер: перевірка, що userId в параметрах — валідне число
 * @param {string} paramName — назва параметра (за замовчуванням 'userId')
 */
const validateUserId = (paramName = 'userId') => {
    return (req, res, next) => {
        const value = req.params[paramName];

        if (!value || isNaN(value)) {
            return next(AppError.badRequest(`Невалідний ID користувача (параметр: ${paramName})`));
        }

        // Зберігаємо перетворене значення для зручності
        req.params[paramName] = parseInt(value, 10);
        next();
    };
};

/**
 * Мідлвер: перевірка наявності обов'язкових полів у req.body
 * @param {...string} fields — список обов'язкових полів
 */
const validateRequiredBody = (...fields) => {
    return (req, res, next) => {
        const missing = fields.filter(field => {
            const value = req.body[field];
            return value === undefined || value === null || value === '';
        });

        if (missing.length > 0) {
            return next(AppError.badRequest(
                `Відсутні обов'язкові поля: ${missing.join(', ')}`
            ));
        }

        next();
    };
};

/**
 * Мідлвер: перевірка, що id в параметрах — валідне число
 * @param {string} paramName — назва параметра (за замовчуванням 'id')
 */
const validateParamId = (paramName = 'id') => {
    return (req, res, next) => {
        const value = req.params[paramName];

        if (!value || isNaN(value)) {
            return next(AppError.badRequest(`Невалідний ID (параметр: ${paramName})`));
        }

        req.params[paramName] = parseInt(value, 10);
        next();
    };
};

module.exports = {
    validateUserId,
    validateRequiredBody,
    validateParamId
};
