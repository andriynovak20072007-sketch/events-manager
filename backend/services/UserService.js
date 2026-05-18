const pool = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const trialService = require('./TrialService');

// ==========================================
// ПАТЕРН: Strategy (Стратегія валідації)
// Дозволяє легко додавати/змінювати правила перевірки
// ==========================================
class ValidationStrategy {
    validate(data) {
        throw new Error('Метод validate() має бути реалізований');
    }
}

class EmailValidation extends ValidationStrategy {
    validate(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email) {
            return { valid: false, field: 'email', message: "Email є обов'язковим полем" };
        }
        if (!emailRegex.test(data.email)) {
            return { valid: false, field: 'email', message: "Некоректний формат email адреси" };
        }
        return { valid: true };
    }
}

class PasswordValidation extends ValidationStrategy {
    validate(data) {
        if (!data.password) {
            return { valid: false, field: 'password', message: "Пароль є обов'язковим полем" };
        }
        if (data.password.length < 6) {
            return { valid: false, field: 'password', message: "Пароль має містити щонайменше 6 символів" };
        }
        return { valid: true };
    }
}

class UsernameValidation extends ValidationStrategy {
    validate(data) {
        if (!data.username) {
            return { valid: false, field: 'username', message: "Ім'я користувача є обов'язковим" };
        }
        if (data.username.length < 3) {
            return { valid: false, field: 'username', message: "Ім'я має містити щонайменше 3 символи" };
        }
        return { valid: true };
    }
}

// ==========================================
// ПАТЕРН: Chain of Responsibility (Ланцюг валідацій)
// Послідовна перевірка кожного правила
// ==========================================
class RegistrationValidator {
    constructor() {
        this.strategies = [
            new UsernameValidation(),
            new EmailValidation(),
            new PasswordValidation()
        ];
    }

    validate(data) {
        for (const strategy of this.strategies) {
            const result = strategy.validate(data);
            if (!result.valid) {
                return result;
            }
        }
        return { valid: true };
    }
}

// ==========================================
// ПАТЕРН: Data Transfer Object (DTO)
// Безпечна передача даних без чутливої інформації
// ==========================================
class UserDTO {
    constructor(user) {
        this.id = user.user_id;
        this.username = user.username;
        this.email = user.email;
        this.role = user.role;
        this.created_at = user.created_at;
    }

    static fromRow(row) {
        return new UserDTO(row);
    }
}

// ==========================================
// ПАТЕРН: Service Layer (Сервісний шар)
// Інкапсулює бізнес-логіку реєстрації в одному місці
// ==========================================
class UserService {
    constructor() {
        if (UserService._instance) {
            return UserService._instance;
        }
        this.validator = new RegistrationValidator();
        this.SALT_ROUNDS = 10;
        UserService._instance = this;
    }

    // ==========================================
    // 1. РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА
    // ==========================================
    async register({ username, email, password }) {
        // Крок 1: Валідація (Strategy pattern)
        const validation = this.validator.validate({ username, email, password });
        if (!validation.valid) {
            return {
                success: false,
                status: 400,
                error: validation.message,
                field: validation.field
            };
        }

        // Крок 2: Перевірка на дублікати
        const duplicateCheck = await this._checkDuplicates(email, username);
        if (!duplicateCheck.valid) {
            return {
                success: false,
                status: 400,
                error: duplicateCheck.message,
                field: duplicateCheck.field
            };
        }

        // Крок 3: Хешування пароля
        const salt = await bcrypt.genSalt(this.SALT_ROUNDS);
        const passwordHash = await bcrypt.hash(password, salt);

        // Крок 4: Генерація токена активації
        const activationToken = crypto.randomBytes(32).toString('hex');

        // Крок 5: Збереження в базу даних
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password_hash, activation_token) 
             VALUES ($1, $2, $3, $4) 
             RETURNING user_id, username, email, role, created_at`,
            [username, email, passwordHash, activationToken]
        );

        const user = newUser.rows[0];

        // Крок 6: Активація Trial-періоду (Facade pattern — використання TrialService)
        let trialInfo = null;
        try {
            const trialResult = await trialService.activateTrial(user.user_id);
            if (trialResult.success) {
                trialInfo = trialResult.trial_info;
            }
        } catch (trialErr) {
            console.error('⚠️ Trial activation error:', trialErr.message);
        }

        // Крок 7: Логування
        const activationLink = `http://localhost:5000/api/users/activate/${activationToken}`;
        console.log(`\n=== 🎉 NEW USER REGISTERED ===`);
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Activation: ${activationLink}`);
        console.log(`Trial: ${trialInfo ? 'activated for 60 days' : 'not activated'}`);
        console.log(`==============================\n`);

        // Крок 8: Повертаємо DTO (Data Transfer Object)
        return {
            success: true,
            status: 201,
            data: {
                message: "Реєстрація успішна! Перевірте email для активації.",
                user: UserDTO.fromRow(user),
                trial: trialInfo
            }
        };
    }

    // ==========================================
    // 2. ВХІД КОРИСТУВАЧА (LOGIN)
    // ==========================================
    async login({ email, password }) {
        if (!email || !password) {
            return {
                success: false,
                status: 400,
                error: "Будь ласка, введіть email та пароль."
            };
        }

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return {
                success: false,
                status: 400,
                error: "Неправильний email або пароль."
            };
        }

        const user = userRes.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return {
                success: false,
                status: 400,
                error: "Неправильний email або пароль."
            };
        }

        // Повертаємо безпечні дані через DTO
        return {
            success: true,
            status: 200,
            data: {
                message: "Вхід успішний!",
                user: {
                    id: user.user_id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        };
    }

    // ==========================================
    // ПРИВАТНИЙ МЕТОД: Перевірка дублікатів
    // ==========================================
    async _checkDuplicates(email, username) {
        const result = await pool.query(
            'SELECT email, username FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (result.rows.length === 0) {
            return { valid: true };
        }

        const existing = result.rows[0];
        if (existing.email === email) {
            return { valid: false, field: 'email', message: "Користувач з таким email вже зареєстрований" };
        }
        if (existing.username === username) {
            return { valid: false, field: 'username', message: "Це ім'я користувача вже зайняте" };
        }

        return { valid: true };
    }
}

// Експортуємо Singleton
module.exports = new UserService();
