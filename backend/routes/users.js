const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SubscriptionService = require('../services/SubscriptionService');
const trialService = require('../services/TrialService');

// ==========================================
// ПАТЕРН: Decorator (asyncHandler)
// ==========================================
const asyncHandler = require('../middleware/asyncHandler');

// ==========================================
// ПАТЕРН: Repository
// ==========================================
const userRepo = require('../repositories/UserRepository');

// ==========================================
// ПАТЕРН: Custom Error Hierarchy
// ==========================================
const AppError = require('../utils/AppError');

// ==========================================
// ПАТЕРН: Logger Singleton
// ==========================================
const logger = require('../utils/Logger');

// ==========================================
// ПАТЕРН: Middleware Chain (Валідація)
// ==========================================
const { validateUserId } = require('../middleware/validate');

// Налаштування пошти (для розробки посилання просто виводиться в консоль сервера)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'test_user',
        pass: 'test_pass'
    }
});

// Допоміжна функція: перевірка правильного формату email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ==========================================
// ПАТЕРН: Data Transfer Object (DTO)
// Використовується для безпечної передачі даних користувача клієнту
// без розкриття чутливої інформації (паролі, токени)
// ==========================================
class UserDTO {
    constructor(user) {
        this.id = user.user_id;
        this.username = user.username;
        this.email = user.email;
        this.role = user.role;
        this.created_at = user.created_at;
        // Додатково можна додати поля, якщо вони з'являться (аватар тощо)
    }
}

// ==========================================
// 1. РОУТ РЕЄСТРАЦІЇ (POST /users/register)
// ПАТЕРН: Decorator (asyncHandler)
// ПАТЕРН: Repository (userRepo)
// ==========================================
router.post('/register', asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // ВАЛІДАЦІЯ 1: Обов'язкові поля
    if (!username || !email || !password) {
        throw AppError.badRequest("Всі поля (username, email, password) є обов'язковими");
    }

    // ВАЛІДАЦІЯ 2: Правильність email
    if (!isValidEmail(email)) {
        throw AppError.badRequest("Некоректний формат email адреси");
    }

    // ВАЛІДАЦІЯ 3: Довжина пароля
    if (password.length < 6) {
        throw AppError.badRequest("Пароль має містити щонайменше 6 символів");
    }

    // ПЕРЕВІРКА НА ДУБЛІКАТ — ПАТЕРН: Repository
    const existingUser = await userRepo.findByEmailOrUsername(email, username);
    
    if (existingUser) {
        if (existingUser.email === email) {
            throw AppError.conflict("Користувач з таким email вже зареєстрований");
        }
        if (existingUser.username === username) {
            throw AppError.conflict("Це ім'я користувача вже зайняте");
        }
    }

    // ХЕШУВАННЯ ПАРОЛЯ
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // ГЕНЕРАЦІЯ ТОКЕНА АКТИВАЦІЇ
    const activationToken = crypto.randomBytes(32).toString('hex');

    // ЗБЕРЕЖЕННЯ В БАЗУ ДАНИХ — ПАТЕРН: Repository
    const newUser = await userRepo.create({
        username, email, passwordHash, activationToken
    });

    // АВТОМАТИЧНЕ ПРИЗНАЧЕННЯ ТАРИФУ FREE та Активація Trial-періоду
    // ПАТЕРН: DI (Dependency Injection) — сервіси SubscriptionService та trialService
    let trialInfo = null;
    try {
        await SubscriptionService.assignFreePlan(newUser.user_id);
        const trialResult = await trialService.activateTrial(newUser.user_id);
        if (trialResult.success) {
            trialInfo = trialResult.trial_info;
        }
    } catch (err) {
        logger.warn('USERS', `Помилка призначення тарифу/trial: ${err.message}`);
        // Не блокуємо реєстрацію, якщо підписка не створилась
    }

    const activationLink = `http://localhost:5000/users/activate/${activationToken}`;
    
    // Симуляція відправки листа (виводимо в консоль)
    logger.info('USERS', `Новий користувач: ${email}`);
    logger.info('USERS', `Посилання для активації: ${activationLink}`);

    res.status(201).json({ 
        message: "Реєстрація успішна! Перевірте консоль сервера для активації акаунта.",
        user: newUser
    });
}));

// ==========================================
// 2. РОУТ АКТИВАЦІЇ (GET /users/activate/:token)
// ==========================================
router.get('/activate/:token', asyncHandler(async (req, res) => {
    const { token } = req.params;

    // ПАТЕРН: Repository
    const user = await userRepo.findByActivationToken(token);

    if (!user) {
        throw AppError.badRequest("Посилання недійсне або акаунт вже активовано.");
    }

    await userRepo.activateByToken(token);

    res.send("<h1>Акаунт успішно активовано! 🎉</h1><p>Тепер ви можете увійти в систему.</p>");
}));



// ==========================================
// 3. ЗАПИТ НА ВІДНОВЛЕННЯ ПАРОЛЯ
// ==========================================
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;

    // ПАТЕРН: Repository
    const user = await userRepo.findByEmail(email);
    
    if (!user) {
        throw AppError.notFound("Користувача з таким email не знайдено.");
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expireTime = new Date(Date.now() + 3600000); // +1 година

    // ПАТЕРН: Repository
    await userRepo.saveResetToken(email, resetToken, expireTime);

    const resetLink = `http://localhost:5000/users/reset-password/${resetToken}`;
    logger.info('USERS', `Відновлення пароля для ${email}: ${resetLink}`);

    res.json({ message: "Лист з інструкціями відправлено на вашу пошту (перевірте консоль)." });
}));


// ==========================================
// 5. ЛОГІН КОРИСТУВАЧА (ВХІД)
// ==========================================
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Перевіряємо, чи передані дані
    if (!email || !password) {
        throw AppError.badRequest("Будь ласка, введіть email та пароль.");
    }

    // 2. Шукаємо користувача в базі — ПАТЕРН: Repository
    const user = await userRepo.findByEmail(email);
    if (!user) {
        throw AppError.badRequest("Неправильний email або пароль.");
    }

    // 3. Перевіряємо пароль (порівнюємо введений пароль з хешем у базі)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
        throw AppError.badRequest("Неправильний email або пароль.");
    }

    // 4. Записуємо користувача в СЕСІЮ
    req.session.user = {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
    };

    logger.info('USERS', `Вхід: ${email}`);

    res.json({ 
        message: "Вхід успішний!", 
        user: req.session.user 
    });
}));

// ==========================================
// 6. ЛОГАУТ (ВИХІД З СИСТЕМИ)
// ==========================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Помилка при виході з системи." });
        }
        res.clearCookie('connect.sid'); // Видаляємо кукі сесії
        res.json({ message: "Ви успішно вийшли з системи." });
    });
});

// ==========================================
// 7. ОТРИМАННЯ ДАНИХ КОРИСТУВАЧА (GET /users/:id)
// ПАТЕРН: Middleware Chain (validateUserId)
// ПАТЕРН: DTO
// ПАТЕРН: Repository
// ==========================================
router.get('/:id', validateUserId('id'), asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // ПАТЕРН: Repository
    const user = await userRepo.findById(userId);

    if (!user) {
        throw AppError.notFound("Користувача не знайдено");
    }

    // Використовуємо DTO патерн для форматування вихідних даних
    const userDTO = new UserDTO(user);

    res.json(userDTO);
}));

// ==========================================
// 8. ОНОВЛЕННЯ ПРОФІЛЮ КОРИСТУВАЧА (PUT)
// ПАТЕРН: Repository (з вбудованим Builder)
// ==========================================
router.put('/:id', asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const { username, email, role } = req.body;

    // ПАТЕРН: Repository (Builder вбудований всередині)
    const updatedUser = await userRepo.update(userId, { username, email, role });

    if (!updatedUser) {
        // Якщо builder.build() повернув null (жодного поля) — або юзер не знайдений
        if (!username && !email && !role) {
            throw AppError.badRequest("Немає даних для оновлення");
        }
        throw AppError.notFound("Користувача не знайдено");
    }

    res.json({ msg: "Профіль успішно оновлено", user: updatedUser });
}));

// ==========================================
// 9. ОНОВЛЕННЯ СТАТУСУ ДО PRO (POST /users/upgrade)
// ==========================================
router.post('/upgrade', asyncHandler(async (req, res) => {
    // У реальному проекті тут була б перевірка сесії або токена
    const userId = req.session.user ? req.session.user.id : req.body.userId;

    if (!userId) {
        throw AppError.unauthorized("Ви повинні бути авторизовані");
    }

    // ПАТЕРН: Repository
    const updatedUser = await userRepo.upgradeToPro(userId);

    if (!updatedUser) {
        throw AppError.notFound("Користувача не знайдено");
    }

    // Оновлюємо дані в сесії, якщо вона є
    if (req.session.user) {
        req.session.user.role = 'pro';
    }

    logger.info('USERS', `Статус оновлено до Pro: user_id=${userId}`);

    res.json({ 
        message: "Вітаємо! Ваш статус оновлено до Pro.", 
        user: updatedUser 
    });
}));


// ==========================================
// 10. СТАТУС TRIAL-ПЕРІОДУ (GET /users/:id/trial)
// ПАТЕРН: Middleware Chain (validateUserId)
// ==========================================
router.get('/:id/trial', validateUserId('id'), asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const status = await trialService.checkTrialStatus(userId);

    if (status.error) {
        throw AppError.notFound(status.error);
    }

    res.json({
        status: 'success',
        data: status
    });
}));

// ==========================================
// 11. АКТИВАЦІЯ TRIAL-ПЕРІОДУ (POST /users/:id/trial/activate)
// Для юзерів, які зареєструвалися до впровадження trial
// ПАТЕРН: Middleware Chain (validateUserId)
// ПАТЕРН: Repository
// ==========================================
router.post('/:id/trial/activate', validateUserId('id'), asyncHandler(async (req, res) => {
    const userId = req.params.id;

    // ПАТЕРН: Repository
    const user = await userRepo.getTrialInfo(userId);

    if (!user) {
        throw AppError.notFound('Користувача не знайдено');
    }

    if (user.role === 'pro') {
        throw AppError.badRequest('Ви вже маєте Pro підписку. Trial не потрібен.');
    }

    if (user.trial_start) {
        throw AppError.badRequest('Trial-період вже було активовано для цього акаунта.');
    }

    const result = await trialService.activateTrial(userId);

    if (!result.success) {
        throw AppError.badRequest(result.reason);
    }

    res.json({
        status: 'success',
        message: `Trial-період активовано на ${trialService.TRIAL_DURATION_DAYS} днів!`,
        data: result
    });
}));

// ==========================================
// 12. ПЕРЕВІРКА ЛІМІТУ СТВОРЕННЯ ПОДІЙ (GET /users/:id/can-create-event)
// ПАТЕРН: Middleware Chain (validateUserId)
// ==========================================
router.get('/:id/can-create-event', validateUserId('id'), asyncHandler(async (req, res) => {
    const userId = req.params.id;

    const result = await trialService.canCreateEvent(userId);
    res.json({
        status: 'success',
        data: result
    });
}));

module.exports = router;
