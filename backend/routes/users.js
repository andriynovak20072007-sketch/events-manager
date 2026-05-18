const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const trialService = require('../services/TrialService');
const SubscriptionService = require('../services/SubscriptionService');
const userService = require('../services/UserService');

// РќР°Р»Р°С€С‚СѓРІР°РЅРЅСЏ РїРѕС€С‚Рё (РґР»СЏ СЂРѕР·СЂРѕР±РєРё РїРѕСЃРёР»Р°РЅРЅСЏ РїСЂРѕСЃС‚Рѕ РІРёРІРѕРґРёС‚СЊСЃСЏ РІ РєРѕРЅСЃРѕР»СЊ СЃРµСЂРІРµСЂР°)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'test_user',
        pass: 'test_pass'
    }
});

// Р”РѕРїРѕРјС–Р¶РЅР° С„СѓРЅРєС†С–СЏ: РїРµСЂРµРІС–СЂРєР° РїСЂР°РІРёР»СЊРЅРѕРіРѕ С„РѕСЂРјР°С‚Сѓ email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ==========================================
// РџРђРўР•Р Рќ: Data Transfer Object (DTO)
// Р’РёРєРѕСЂРёСЃС‚РѕРІСѓС”С‚СЊСЃСЏ РґР»СЏ Р±РµР·РїРµС‡РЅРѕС— РїРµСЂРµРґР°С‡С– РґР°РЅРёС… РєРѕСЂРёСЃС‚СѓРІР°С‡Р° РєР»С–С”РЅС‚Сѓ
// Р±РµР· СЂРѕР·РєСЂРёС‚С‚СЏ С‡СѓС‚Р»РёРІРѕС— С–РЅС„РѕСЂРјР°С†С–С— (РїР°СЂРѕР»С–, С‚РѕРєРµРЅРё)
// ==========================================
class UserDTO {
    constructor(user) {
        this.id = user.user_id;
        this.username = user.username;
        this.email = user.email;
        this.role = user.role;
        this.created_at = user.created_at;
        // Р”РѕРґР°С‚РєРѕРІРѕ РјРѕР¶РЅР° РґРѕРґР°С‚Рё РїРѕР»СЏ, СЏРєС‰Рѕ РІРѕРЅРё Р·'СЏРІР»СЏС‚СЊСЃСЏ (Р°РІР°С‚Р°СЂ С‚РѕС‰Рѕ)
    }
}

// ==========================================
// 1. Р РћРЈРў Р Р•Р„РЎРўР РђР¦Р†Р‡ (POST /users/register)
// ==========================================
// ==========================================
// 1. РОУТ РЕЄСТРАЦІЇ (POST /users/register)
// ПАТЕРН: Service Layer (Thin Controller)
// Контролер лише приймає запит і делегує логіку UserService
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Делегуємо бізнес-логіку до UserService (Service Layer pattern)
        const result = await userService.register({ username, email, password });

        if (!result.success) {
            return res.status(result.status).json({ 
                error: result.error,
                field: result.field  // Поле з помилкою (для підсвітки на фронтенді)
            });
        }

        res.status(result.status).json(result.data);
    } catch (err) {
        console.error('❌ Registration error:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при реєстрації." });
    }
});


// ==========================================
// 2. Р РћРЈРў РђРљРўРР’РђР¦Р†Р‡ (GET /users/activate/:token)
// ==========================================
router.get('/activate/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const userResult = await pool.query('SELECT * FROM users WHERE activation_token = $1', [token]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "РџРѕСЃРёР»Р°РЅРЅСЏ РЅРµРґС–Р№СЃРЅРµ Р°Р±Рѕ Р°РєР°СѓРЅС‚ РІР¶Рµ Р°РєС‚РёРІРѕРІР°РЅРѕ." });
        }

        // РћРЅРѕРІР»СЋС”РјРѕ СЃС‚Р°С‚СѓСЃ РЅР° is_active = TRUE
        await pool.query(
            'UPDATE users SET is_active = TRUE, activation_token = NULL WHERE activation_token = $1',
            [token]
        );

        res.send("<h1>РђРєР°СѓРЅС‚ СѓСЃРїС–С€РЅРѕ Р°РєС‚РёРІРѕРІР°РЅРѕ! рџЋ‰</h1><p>РўРµРїРµСЂ РІРё РјРѕР¶РµС‚Рµ СѓРІС–Р№С‚Рё РІ СЃРёСЃС‚РµРјСѓ.</p>");

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "РџРѕРјРёР»РєР° СЃРµСЂРІРµСЂР° РїСЂРё Р°РєС‚РёРІР°С†С–С—." });
    }
});



// ==========================================
// 3. Р—РђРџРРў РќРђ Р’Р†Р”РќРћР’Р›Р•РќРќРЇ РџРђР РћР›РЇ
// ==========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        
        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: "РљРѕСЂРёСЃС‚СѓРІР°С‡Р° Р· С‚Р°РєРёРј email РЅРµ Р·РЅР°Р№РґРµРЅРѕ." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expireTime = new Date(Date.now() + 3600000); // +1 РіРѕРґРёРЅР°

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [resetToken, expireTime, email]
        );

        const resetLink = `http://localhost:5000/users/reset-password/${resetToken}`;
        console.log(`\n=== Р’Р†Р”РќРћР’Р›Р•РќРќРЇ РџРђР РћР›РЇ ===\nEmail: ${email}\nРџРѕСЃРёР»Р°РЅРЅСЏ: ${resetLink}\n==========================\n`);

        res.json({ message: "Р›РёСЃС‚ Р· С–РЅСЃС‚СЂСѓРєС†С–СЏРјРё РІС–РґРїСЂР°РІР»РµРЅРѕ РЅР° РІР°С€Сѓ РїРѕС€С‚Сѓ (РїРµСЂРµРІС–СЂС‚Рµ РєРѕРЅСЃРѕР»СЊ)." });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "РџРѕРјРёР»РєР° СЃРµСЂРІРµСЂР°." });
    }
});


// ==========================================
// 5. Р›РћР“Р†Рќ РљРћР РРЎРўРЈР’РђР§Рђ (Р’РҐР†Р”)
// ==========================================
// ==========================================
// 5. ЛОГІН КОРИСТУВАЧА (ВХІД)
// ПАТЕРН: Service Layer (Thin Controller)
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Делегуємо автентифікацію до UserService
        const result = await userService.login({ email, password });

        if (!result.success) {
            return res.status(result.status).json({ error: result.error });
        }

        // Записуємо користувача в СЕСІЮ (це відповідальність контролера)
        req.session.user = result.data.user;

        res.json(result.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Помилка сервера при вході." });
    }
});


// ==========================================
// 6. Р›РћР“РђРЈРў (Р’РРҐР†Р” Р— РЎРРЎРўР•РњР)
// ==========================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "РџРѕРјРёР»РєР° РїСЂРё РІРёС…РѕРґС– Р· СЃРёСЃС‚РµРјРё." });
        }
        res.clearCookie('connect.sid'); // Р’РёРґР°Р»СЏС”РјРѕ РєСѓРєС– СЃРµСЃС–С—
        res.json({ message: "Р’Рё СѓСЃРїС–С€РЅРѕ РІРёР№С€Р»Рё Р· СЃРёСЃС‚РµРјРё." });
    });
});

// ==========================================
// 7. РћРўР РРњРђРќРќРЇ Р”РђРќРРҐ РљРћР РРЎРўРЈР’РђР§Рђ (GET /users/:id)
// ==========================================
router.get('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "РљРѕСЂРёСЃС‚СѓРІР°С‡Р° РЅРµ Р·РЅР°Р№РґРµРЅРѕ" });
        }

        // Р’РёРєРѕСЂРёСЃС‚РѕРІСѓС”РјРѕ DTO РїР°С‚РµСЂРЅ РґР»СЏ С„РѕСЂРјР°С‚СѓРІР°РЅРЅСЏ РІРёС…С–РґРЅРёС… РґР°РЅРёС…
        const userDTO = new UserDTO(result.rows[0]);

        res.json(userDTO);
    } catch (err) {
        console.error('РџРѕРјРёР»РєР° РѕС‚СЂРёРјР°РЅРЅСЏ РґР°РЅРёС… РєРѕСЂРёСЃС‚СѓРІР°С‡Р°:', err.message);
        res.status(500).json({ error: "Р’РЅСѓС‚СЂС–С€РЅСЏ РїРѕРјРёР»РєР° СЃРµСЂРІРµСЂР° РїСЂРё РѕС‚СЂРёРјР°РЅРЅС– РїСЂРѕС„С–Р»СЋ." });
    }
});

// ==========================================
// ПАТЕРН: Builder (Будівельник) для UPDATE запитів
// Дозволяє динамічно формувати запит на оновлення тільки тих полів, які передані
// ==========================================
class UpdateQueryBuilder {
    constructor(tableName, idColumn, idValue) {
        this.tableName = tableName;
        this.idColumn = idColumn;
        this.idValue = idValue;
        this.fields = [];
        this.values = [];
        this.paramIndex = 1;
    }

    set(column, value) {
        if (value !== undefined && value !== null) {
            this.fields.push(`${column} = $${this.paramIndex}`);
            this.values.push(value);
            this.paramIndex++;
        }
        return this;
    }

    build() {
        if (this.fields.length === 0) return null;

        // Додаємо ID як останній параметр
        this.values.push(this.idValue);
        
        const query = `
            UPDATE ${this.tableName}
            SET ${this.fields.join(', ')}
            WHERE ${this.idColumn} = $${this.paramIndex}
            RETURNING user_id, username, email, role, created_at`;
            
        return { text: query, values: this.values };
    }
}

// ==========================================
// 8. ОНОВЛЕННЯ ПРОФІЛЮ КОРИСТУВАЧА (PUT)
// ==========================================
router.put('/:id', async (req, res) => {
    const userId = req.params.id;
    const { username, email, role } = req.body;

    // Використовуємо патерн Builder
    const builder = new UpdateQueryBuilder('users', 'user_id', userId)
        .set('username', username)
        .set('email', email)
        .set('role', role);

    const builtQuery = builder.build();

    if (!builtQuery) {
        return res.status(400).json({ error: "Немає даних для оновлення" });
    }

    try {
        const result = await pool.query(builtQuery.text, builtQuery.values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ msg: "Профіль успішно оновлено", user: result.rows[0] });
    } catch (err) {
        console.error('Помилка при оновленні профілю:', err.message);
        res.status(500).json({ error: "Внутрішня помилка сервера при оновленні профілю" });
    }
});

// ==========================================
// 9. ОНОВЛЕННЯ СТАТУСУ ДО PRO (POST /users/upgrade)
// ==========================================
router.post('/upgrade', async (req, res) => {
    try {
        // У реальному проекті тут була б перевірка сесії або токена
        const userId = req.session.user ? req.session.user.id : req.body.userId;

        if (!userId) {
            return res.status(401).json({ error: "Ви повинні бути авторизовані" });
        }

        // Оновлюємо роль до Pro та деактивуємо trial
        const result = await pool.query(
            `UPDATE users 
             SET role = 'pro', is_trial_active = FALSE 
             WHERE user_id = $1 
             RETURNING user_id, username, email, role`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        // Оновлюємо дані в сесії, якщо вона є
        if (req.session.user) {
            req.session.user.role = 'pro';
        }

        res.json({ 
            message: "Вітаємо! Ваш статус оновлено до Pro.", 
            user: result.rows[0] 
        });

    } catch (err) {
        console.error('Помилка при оновленні статусу:', err.message);
        res.status(500).json({ error: "Помилка сервера при оновленні статусу" });
    }
});

// ==========================================
// 10. СТАТУС TRIAL-ПЕРІОДУ (GET /users/:id/trial)
// ==========================================
router.get('/:id/trial', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const status = await trialService.checkTrialStatus(parseInt(userId));

        if (status.error) {
            return res.status(404).json({ error: status.error });
        }

        res.json({
            status: 'success',
            data: status
        });
    } catch (err) {
        console.error('Помилка перевірки trial-статусу:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// ==========================================
// 11. АКТИВАЦІЯ TRIAL-ПЕРІОДУ (POST /users/:id/trial/activate)
// Для юзерів, які зареєструвалися до впровадження trial
// ==========================================
router.post('/:id/trial/activate', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        // Перевіряємо, що юзер не Pro (Pro не потребує trial)
        const userResult = await pool.query(
            'SELECT role, trial_start FROM users WHERE user_id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Користувача не знайдено' });
        }

        const user = userResult.rows[0];

        if (user.role === 'pro') {
            return res.status(400).json({ error: 'Ви вже маєте Pro підписку. Trial не потрібен.' });
        }

        if (user.trial_start) {
            return res.status(400).json({ error: 'Trial-період вже було активовано для цього акаунта.' });
        }

        const result = await trialService.activateTrial(parseInt(userId));

        if (!result.success) {
            return res.status(400).json({ error: result.reason });
        }

        res.json({
            status: 'success',
            message: `Trial-період активовано на ${trialService.TRIAL_DURATION_DAYS} днів!`,
            data: result
        });
    } catch (err) {
        console.error('Помилка активації trial:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

// ==========================================
// 12. ПЕРЕВІРКА ЛІМІТУ СТВОРЕННЯ ПОДІЙ (GET /users/:id/can-create-event)
// ==========================================
router.get('/:id/can-create-event', async (req, res) => {
    const userId = req.params.id;

    if (!userId || isNaN(userId)) {
        return res.status(400).json({ error: 'Невалідний ID користувача' });
    }

    try {
        const result = await trialService.canCreateEvent(parseInt(userId));
        res.json({
            status: 'success',
            data: result
        });
    } catch (err) {
        console.error('Помилка перевірки ліміту:', err.message);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

module.exports = router;
