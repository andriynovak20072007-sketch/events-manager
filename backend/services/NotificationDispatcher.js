const nodemailer = require('nodemailer');

// ==========================================
// ПАТЕРН 1: Chain of Responsibility (Ланцюг відповідальності)
// Кожен обробник (handler) вирішує, чи може він обробити запит,
// і передає далі по ланцюгу. Це дозволяє легко додавати нові канали
// (наприклад, SMS, Push, Telegram) без зміни існуючого коду.
// ==========================================

/**
 * Базовий обробник каналу доставки (абстрактний)
 * ПАТЕРН: Template Method — визначає скелет алгоритму
 */
class NotificationHandler {
    constructor() {
        this.nextHandler = null;
        this.channelName = 'base';
    }

    /**
     * Встановлює наступний обробник у ланцюгу
     * @param {NotificationHandler} handler
     * @returns {NotificationHandler} — наступний обробник (для chaining)
     */
    setNext(handler) {
        this.nextHandler = handler;
        return handler;
    }

    /**
     * Обробляє сповіщення. Якщо канал підходить — відправляє,
     * потім передає наступному обробнику
     */
    async handle(notification) {
        const results = [];

        if (this.shouldHandle(notification)) {
            try {
                const result = await this.send(notification);
                results.push({ channel: this.channelName, success: true, result });
            } catch (err) {
                results.push({ channel: this.channelName, success: false, error: err.message });
                console.error(`⚠️ [${this.channelName.toUpperCase()}] Помилка відправки:`, err.message);
            }
        }

        // Передаємо далі по ланцюгу
        if (this.nextHandler) {
            const nextResults = await this.nextHandler.handle(notification);
            results.push(...nextResults);
        }

        return results;
    }

    /**
     * Визначає, чи повинен цей обробник обробляти сповіщення
     * (на основі вибраного каналу)
     */
    shouldHandle(notification) {
        const channel = notification.channel || 'all';
        return channel === 'all' || channel === this.channelName;
    }

    /**
     * Абстрактний метод відправки (реалізується в підкласах)
     */
    async send(notification) {
        throw new Error('Метод send() повинен бути реалізований в підкласі');
    }
}

// ==========================================
// КОНКРЕТНІ ОБРОБНИКИ (Concrete Handlers)
// ==========================================

/**
 * Обробник Email-каналу (через Nodemailer)
 * ПАТЕРН: Adapter — адаптує nodemailer до загального інтерфейсу NotificationHandler
 */
class EmailHandler extends NotificationHandler {
    constructor() {
        super();
        this.channelName = 'email';
        this.transporter = null;
        this._initTransporter();
    }

    /**
     * Ініціалізує SMTP-транспортер
     * Graceful: якщо змінні не задані — транспортер не створюється
     */
    _initTransporter() {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        // Без SMTP-конфігурації email просто пропускається
        if (!host || !user || !pass) {
            console.log('📧 [EMAIL] SMTP не налаштовано — email-канал деактивовано');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(port) || 587,
            secure: parseInt(port) === 465, // true для порту 465 (SSL), false для інших (STARTTLS)
            auth: {
                user: user,
                pass: pass
            }
        });

        console.log(`📧 [EMAIL] SMTP транспортер налаштовано: ${host}:${port}`);
    }

    shouldHandle(notification) {
        // Пропускаємо, якщо транспортер не ініціалізований або у юзера немає email
        if (!this.transporter) return false;
        if (!notification.email) return false;
        return super.shouldHandle(notification);
    }

    async send(notification) {
        const fromAddress = process.env.SMTP_FROM || 'EventManager <noreply@eventmanager.com>';

        const mailOptions = {
            from: fromAddress,
            to: notification.email,
            subject: `🔔 Нагадування: ${notification.eventTitle}`,
            html: this._buildEmailHtml(notification)
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`📧 [EMAIL] Лист відправлено: ${notification.email} (${info.messageId})`);
        return { messageId: info.messageId };
    }

    /**
     * ПАТЕРН: Builder (Побудова HTML-листа крок за кроком)
     */
    _buildEmailHtml(notification) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; 
                             box-shadow: 0 2px 12px rgba(0,0,0,0.08); overflow: hidden; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          padding: 24px; color: #fff; text-align: center; }
                .header h1 { margin: 0; font-size: 20px; }
                .body { padding: 24px; }
                .body p { color: #555; line-height: 1.6; font-size: 15px; }
                .event-title { color: #667eea; font-weight: bold; font-size: 18px; }
                .footer { padding: 16px 24px; background: #f8f9fa; text-align: center; 
                          color: #999; font-size: 12px; }
                .btn { display: inline-block; padding: 10px 24px; background: #667eea; 
                       color: #fff; text-decoration: none; border-radius: 6px; margin-top: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Event Manager</h1>
                </div>
                <div class="body">
                    <p>Привіт, <strong>${notification.username || 'користувачу'}</strong>!</p>
                    <p>${notification.message}</p>
                    <p class="event-title">${notification.eventTitle}</p>
                </div>
                <div class="footer">
                    <p>Event Manager • Планувальник подій</p>
                </div>
            </div>
        </body>
        </html>`;
    }
}

/**
 * Обробник In-App каналу (запис в таблицю notifications)
 * Цей обробник завжди працює — це fallback
 */
class InAppHandler extends NotificationHandler {
    constructor(pool) {
        super();
        this.channelName = 'in_app';
        this.pool = pool;
    }

    async send(notification) {
        // In-app нотифікація вже створюється в EventSchedulerService.processQueue()
        // Тут ми просто логуємо для підтвердження
        console.log(`🔔 [IN-APP] Нотифікація створена для user_id=${notification.userId}`);
        return { stored: true };
    }
}

// ==========================================
// ПАТЕРН 2: Facade (Фасад)
// Простий інтерфейс для складної системи доставки сповіщень
// ==========================================
class NotificationDispatcher {
    constructor(pool) {
        // Будуємо ланцюг обробників
        this.emailHandler = new EmailHandler();
        this.inAppHandler = new InAppHandler(pool);

        // Chain of Responsibility: Email → In-App
        this.emailHandler.setNext(this.inAppHandler);

        // Точка входу ланцюга
        this.chain = this.emailHandler;

        console.log('📬 [DISPATCHER] Ланцюг обробників ініціалізовано: Email → In-App');
    }

    /**
     * Головний метод — запускає ланцюг обробки
     * @param {Object} notification — об'єкт сповіщення
     * @returns {Array} — результати кожного обробника
     */
    async dispatch(notification) {
        console.log(`📬 [DISPATCHER] Відправка для user_id=${notification.userId}, ` +
            `тип="${notification.type}", канал="${notification.channel}"`);
        
        const results = await this.chain.handle(notification);
        
        const successCount = results.filter(r => r.success).length;
        console.log(`📬 [DISPATCHER] Результат: ${successCount}/${results.length} каналів успішно`);
        
        return results;
    }

    /**
     * Перевіряє, чи налаштований email-канал
     */
    isEmailConfigured() {
        return this.emailHandler.transporter !== null;
    }
}

module.exports = NotificationDispatcher;
