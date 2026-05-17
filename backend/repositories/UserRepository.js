// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Інкапсулює SQL-запити для таблиці users.
// Використовує існуючий UpdateQueryBuilder (патерн Builder).
// ==========================================

const pool = require('../db');

// ==========================================
// ПАТЕРН: Builder (Будівельник) для UPDATE запитів
// Перенесено з users.js — тепер є частиною Repository
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

        this.values.push(this.idValue);
        
        const query = `
            UPDATE ${this.tableName}
            SET ${this.fields.join(', ')}
            WHERE ${this.idColumn} = $${this.paramIndex}
            RETURNING user_id, username, email, role, created_at`;
            
        return { text: query, values: this.values };
    }
}

class UserRepository {
    /**
     * Знайти користувача за ID
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Знайти за email або username
     */
    async findByEmailOrUsername(email, username) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        return result.rows[0] || null;
    }

    /**
     * Знайти за email
     */
    async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return result.rows[0] || null;
    }

    /**
     * Знайти за токеном активації
     */
    async findByActivationToken(token) {
        const result = await pool.query(
            'SELECT * FROM users WHERE activation_token = $1',
            [token]
        );
        return result.rows[0] || null;
    }

    /**
     * Створити нового користувача
     */
    async create(data) {
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, activation_token) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email',
            [data.username, data.email, data.passwordHash, data.activationToken]
        );
        return result.rows[0];
    }

    /**
     * Активувати акаунт (за токеном)
     */
    async activateByToken(token) {
        const result = await pool.query(
            'UPDATE users SET is_active = TRUE, activation_token = NULL WHERE activation_token = $1 RETURNING *',
            [token]
        );
        return result.rows[0] || null;
    }

    /**
     * Зберегти reset-токен для відновлення пароля
     */
    async saveResetToken(email, resetToken, expireTime) {
        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
            [resetToken, expireTime, email]
        );
    }

    /**
     * Оновити профіль (використовує Builder Pattern)
     */
    async update(id, data) {
        const builder = new UpdateQueryBuilder('users', 'user_id', id)
            .set('username', data.username)
            .set('email', data.email)
            .set('role', data.role);

        const builtQuery = builder.build();
        if (!builtQuery) return null;

        const result = await pool.query(builtQuery.text, builtQuery.values);
        return result.rows[0] || null;
    }

    /**
     * Оновити роль до Pro
     */
    async upgradeToPro(id) {
        const result = await pool.query(
            "UPDATE users SET role = 'pro' WHERE user_id = $1 RETURNING user_id, username, email, role",
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Отримати роль та trial-інформацію
     */
    async getTrialInfo(id) {
        const result = await pool.query(
            'SELECT role, trial_start FROM users WHERE user_id = $1',
            [id]
        );
        return result.rows[0] || null;
    }
}

// Singleton — один екземпляр на весь додаток
module.exports = new UserRepository();
