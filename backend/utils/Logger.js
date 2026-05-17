// ==========================================
// ПАТЕРН: Singleton + Strategy (Логер)
// Централізований логер, який замінює розкидані console.log/error.
// Надає єдиний інтерфейс для логування з контекстом та рівнями.
//
// Використання:
//   const logger = require('../utils/Logger');
//   logger.info('EVENTS', 'Подію створено');
//   logger.error('AUTH', 'Помилка авторизації', err);
// ==========================================

class Logger {
    constructor() {
        // Singleton — гарантуємо один екземпляр
        if (Logger._instance) {
            return Logger._instance;
        }

        // Рівні логування (Strategy — можна легко додати файловий логер, etc.)
        this.levels = {
            INFO: '📋',
            WARN: '⚠️',
            ERROR: '❌',
            DEBUG: '🔍',
            SUCCESS: '✅'
        };

        Logger._instance = this;
    }

    /**
     * Форматує повідомлення з часом та контекстом
     * @private
     */
    _format(level, context, message) {
        const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS
        const icon = this.levels[level] || '📋';
        return `${icon} [${timestamp}] [${context}] ${message}`;
    }

    /** Інформаційне повідомлення */
    info(context, message) {
        console.log(this._format('INFO', context, message));
    }

    /** Попередження */
    warn(context, message) {
        console.warn(this._format('WARN', context, message));
    }

    /** Помилка (з опціональним об'єктом Error) */
    error(context, message, err = null) {
        console.error(this._format('ERROR', context, message));
        if (err && err.stack) {
            console.error(`   └─ Stack: ${err.message}`);
        }
    }

    /** Дебаг (тільки якщо NODE_ENV !== 'production') */
    debug(context, message) {
        if (process.env.NODE_ENV !== 'production') {
            console.log(this._format('DEBUG', context, message));
        }
    }

    /** Успішна операція */
    success(context, message) {
        console.log(this._format('SUCCESS', context, message));
    }
}

// Singleton — один екземпляр на весь додаток
module.exports = new Logger();
