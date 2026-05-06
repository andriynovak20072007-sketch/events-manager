const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Р’РђР›Р†Р”РђР¦Р†РЇ 1: РћР±РѕРІ'СЏР·РєРѕРІС– РїРѕР»СЏ
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Р’СЃС– РїРѕР»СЏ (username, email, password) С” РѕР±РѕРІ'СЏР·РєРѕРІРёРјРё" });
        }

        // Р’РђР›Р†Р”РђР¦Р†РЇ 2: РџСЂР°РІРёР»СЊРЅС–СЃС‚СЊ email
        if (!isValidEmail(email)) {
            return res.status(400).json({ error: "РќРµРєРѕСЂРµРєС‚РЅРёР№ С„РѕСЂРјР°С‚ email Р°РґСЂРµСЃРё" });
        }

        // Р’РђР›Р†Р”РђР¦Р†РЇ 3: Р”РѕРІР¶РёРЅР° РїР°СЂРѕР»СЏ
        if (password.length < 6) {
            return res.status(400).json({ error: "РџР°СЂРѕР»СЊ РјР°С” РјС–СЃС‚РёС‚Рё С‰РѕРЅР°Р№РјРµРЅС€Рµ 6 СЃРёРјРІРѕР»С–РІ" });
        }

        // РџР•Р Р•Р’Р†Р РљРђ РќРђ Р”РЈР‘Р›Р†РљРђРў
        const userExists = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2', 
            [email, username]
        );
        
        if (userExists.rows.length > 0) {
            const existingUser = userExists.rows[0];
            if (existingUser.email === email) {
                return res.status(400).json({ error: "РљРѕСЂРёСЃС‚СѓРІР°С‡ Р· С‚Р°РєРёРј email РІР¶Рµ Р·Р°СЂРµС”СЃС‚СЂРѕРІР°РЅРёР№" });
            }
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Р¦Рµ С–Рј'СЏ РєРѕСЂРёСЃС‚СѓРІР°С‡Р° РІР¶Рµ Р·Р°Р№РЅСЏС‚Рµ" });
            }
        }

        // РҐР•РЁРЈР’РђРќРќРЇ РџРђР РћР›РЇ
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Р“Р•РќР•Р РђР¦Р†РЇ РўРћРљР•РќРђ РђРљРўРР’РђР¦Р†Р‡
        const activationToken = crypto.randomBytes(32).toString('hex');

        // Р—Р‘Р•Р Р•Р–Р•РќРќРЇ Р’ Р‘РђР—РЈ Р”РђРќРРҐ
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash, activation_token) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email',
            [username, email, passwordHash, activationToken]
        );

        const activationLink = `http://localhost:5000/users/activate/${activationToken}`;
        
        // РЎРёРјСѓР»СЏС†С–СЏ РІС–РґРїСЂР°РІРєРё Р»РёСЃС‚Р° (РІРёРІРѕРґРёРјРѕ РІ РєРѕРЅСЃРѕР»СЊ)
        console.log(`\n=== РќРћР’РР™ РљРћР РРЎРўРЈР’РђР§ Р—РђР Р•Р„РЎРўР РћР’РђРќРР™ ===`);
        console.log(`Email: ${email}`);
        console.log(`РџРѕСЃРёР»Р°РЅРЅСЏ РґР»СЏ Р°РєС‚РёРІР°С†С–С—: ${activationLink}`);
        console.log(`=========================================\n`);

        res.status(201).json({ 
            message: "Р РµС”СЃС‚СЂР°С†С–СЏ СѓСЃРїС–С€РЅР°! РџРµСЂРµРІС–СЂС‚Рµ РєРѕРЅСЃРѕР»СЊ СЃРµСЂРІРµСЂР° РґР»СЏ Р°РєС‚РёРІР°С†С–С— Р°РєР°СѓРЅС‚Р°.",
            user: newUser.rows[0]
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Р’РЅСѓС‚СЂС–С€РЅСЏ РїРѕРјРёР»РєР° СЃРµСЂРІРµСЂР° РїСЂРё СЂРµС”СЃС‚СЂР°С†С–С—." });
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
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. РџРµСЂРµРІС–СЂСЏС”РјРѕ, С‡Рё РїРµСЂРµРґР°РЅС– РґР°РЅС–
        if (!email || !password) {
            return res.status(400).json({ error: "Р‘СѓРґСЊ Р»Р°СЃРєР°, РІРІРµРґС–С‚СЊ email С‚Р° РїР°СЂРѕР»СЊ." });
        }

        // 2. РЁСѓРєР°С”РјРѕ РєРѕСЂРёСЃС‚СѓРІР°С‡Р° РІ Р±Р°Р·С–
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: "РќРµРїСЂР°РІРёР»СЊРЅРёР№ email Р°Р±Рѕ РїР°СЂРѕР»СЊ." });
        }

        const user = userRes.rows[0];

        // 3. РџРµСЂРµРІС–СЂСЏС”РјРѕ РїР°СЂРѕР»СЊ (РїРѕСЂС–РІРЅСЋС”РјРѕ РІРІРµРґРµРЅРёР№ РїР°СЂРѕР»СЊ Р· С…РµС€РµРј Сѓ Р±Р°Р·С–)
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "РќРµРїСЂР°РІРёР»СЊРЅРёР№ email Р°Р±Рѕ РїР°СЂРѕР»СЊ." });
        }

        // 4. Р—Р°РїРёСЃСѓС”РјРѕ РєРѕСЂРёСЃС‚СѓРІР°С‡Р° РІ РЎР•РЎР†Р®
        req.session.user = {
            id: user.user_id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        res.json({ 
            message: "Р’С…С–Рґ СѓСЃРїС–С€РЅРёР№!", 
            user: req.session.user 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "РџРѕРјРёР»РєР° СЃРµСЂРІРµСЂР° РїСЂРё РІС…РѕРґС–." });
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

module.exports = router;
