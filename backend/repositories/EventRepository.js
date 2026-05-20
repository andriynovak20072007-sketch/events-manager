// ==========================================
// ПАТЕРН: Repository (Репозиторій)
// Інкапсулює ВСІ SQL-запити для таблиці events.
// Роути більше не знають про структуру БД чи SQL —
// вони працюють з методами: findAll(), findById(), create() тощо.
//
// Переваги:
// 1. Один місце для зміни SQL (наприклад, додати поле — лише тут)
// 2. Легко тестувати — можна замокати весь репозиторій
// 3. Захист від SQL-ін'єкцій — параметризовані запити в одному місці
// ==========================================

const pool = require('../db');
const AppError = require('../utils/AppError');
const logger = require('../utils/Logger');

class EventRepository {
    /**
     * Отримати всі події з рейтингом та динамічним статусом
     * @param {Object} filters — { region }
     */
    async findAll(filters = {}) {
        let queryText = `
            SELECT e.*, 
                   COALESCE(ROUND(AVG(r.score), 1), 0) as average_rating,
                   CASE 
                       WHEN (e.event_day + e.start_time) < NOW() THEN 'завершена'
                       ELSE 'активна'
                   END as status
            FROM events e
            LEFT JOIN ratings r ON e.event_id = r.event_id
        `;
        let queryParams = [];
        let whereClauses = [];

        if (filters.region) {
            whereClauses.push(`e.region = $1`);
            queryParams.push(filters.region);
        }

        if (whereClauses.length > 0) {
            queryText += ' WHERE ' + whereClauses.join(' AND ');
        }

        queryText += ' GROUP BY e.event_id ORDER BY e.created_at DESC';

        const result = await pool.query(queryText, queryParams);
        return result.rows;
    }

    /**
     * Отримати одну подію за ID
     */
    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM events WHERE event_id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Створити нову подію
     * @param {Object} data — дані події
     */
    async create(data) {
        const query = `
            INSERT INTO events (
                title, description, event_day, start_time, end_time, 
                latitude, longitude, category_id, creator_id, region, 
                is_private, price, currency,
                banner_url, button_color, theme
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
            RETURNING *`;

        const values = [
            data.title, data.description, data.event_day, data.start_time, data.end_time,
            data.latitude, data.longitude, data.category_id, data.creator_id, data.region,
            data.is_private ?? true, data.price || 0, data.currency || 'UAH',
            data.banner_url || null, data.button_color || null, data.theme || 'light'
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Створити приватну подію
     */
    async createPrivate(data) {
        const query = `
            INSERT INTO events (
                title, description, event_day, start_time, end_time, 
                latitude, longitude, category_id, creator_id, region, 
                is_private, price, currency, photo_url
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, $11, $12, $13) 
            RETURNING *`;

        const values = [
            data.title, data.description, data.event_day, data.start_time, data.end_time,
            data.latitude, data.longitude, data.category_id, data.creator_id, data.region,
            data.price || 0, data.currency || 'UAH', data.photo_url
        ];

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Оновити приватну подію
     */
    async updatePrivate(id, data) {
        const query = `
            UPDATE events 
            SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                event_day = COALESCE($3, event_day),
                start_time = COALESCE($4, start_time),
                end_time = COALESCE($5, end_time),
                latitude = COALESCE($6, latitude),
                longitude = COALESCE($7, longitude),
                category_id = COALESCE($8, category_id),
                region = COALESCE($9, region),
                price = COALESCE($10, price),
                currency = COALESCE($11, currency),
                photo_url = COALESCE($12, photo_url),
                banner_url = COALESCE($13, banner_url),
                button_color = COALESCE($14, button_color),
                theme = COALESCE($15, theme)
                status = COALESCE($16, status)
            WHERE event_id = $17 AND is_private = TRUE
            RETURNING *`;

        const values = [
            data.title,
            data.description,
            data.event_day,
            data.start_time,
            data.end_time,
            data.latitude,
            data.longitude,
            data.category_id,
            data.region,
            data.price,
            data.currency,
            data.photo_url,
            data.banner_url,
            data.button_color,
            data.theme,
            data.status,
            id
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Оновити звичайну подію
     */
    async update(id, data) {
        const query = `
            UPDATE events 
            SET 
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                event_day = COALESCE($3, event_day),
                start_time = COALESCE($4, start_time),
                end_time = COALESCE($5, end_time),
                latitude = COALESCE($6, latitude),
                longitude = COALESCE($7, longitude),
                category_id = COALESCE($8, category_id),
                region = COALESCE($9, region),
                is_private = COALESCE($10, is_private),
                price = COALESCE($11, price),
                currency = COALESCE($12, currency),
                banner_url = COALESCE($13, banner_url),
                button_color = COALESCE($14, button_color),
                theme = COALESCE($15, theme),
                status = COALESCE($16, status)
            WHERE event_id = $17
            RETURNING *`;

        const values = [
            data.title,
            data.description,
            data.event_day,
            data.start_time,
            data.end_time,
            data.latitude,
            data.longitude,
            data.category_id,
            data.region,
            data.is_private,
            data.price,
            data.currency,
            data.banner_url,
            data.button_color,
            data.theme,
            data.status,
            id
        ];

        const result = await pool.query(query, values);
        return result.rows[0] || null;
    }

    /**
     * Видалити подію
     */
    async delete(id) {
        const result = await pool.query(
            'DELETE FROM events WHERE event_id = $1 RETURNING *',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Оновити зображення події
     */
    async updateImage(id, imageUrl) {
        const result = await pool.query(
            'UPDATE events SET image_url = $1 WHERE event_id = $2 RETURNING *',
            [imageUrl, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Фільтр публічних подій за регіоном
     */
    async findPublicByRegion(region) {
        const result = await pool.query(
            'SELECT * FROM events WHERE region = $1 AND is_private = FALSE ORDER BY event_day ASC',
            [region]
        );
        return result.rows;
    }

    /**
     * Дані для маршруту (координати)
     */
    async findRouteData(idArray) {
        const result = await pool.query(
            'SELECT event_id, title, latitude, longitude, region FROM events WHERE event_id = ANY($1)',
            [idArray]
        );
        return result.rows;
    }

    /**
     * Заплановані (майбутні) події з фільтрами
     */
    async findScheduled(filters = {}) {
        let queryText = `
            SELECT e.*, 
                   COALESCE(ROUND(AVG(r.score), 1), 0) as average_rating,
                   'запланована' as status,
                   (e.event_day + e.start_time) AS event_datetime
            FROM events e
            LEFT JOIN ratings r ON e.event_id = r.event_id
            WHERE (e.event_day + e.start_time) > NOW()
        `;
        let queryParams = [];
        let paramIndex = 1;

        if (filters.region) {
            queryText += ` AND e.region = $${paramIndex}`;
            queryParams.push(filters.region);
            paramIndex++;
        }

        if (filters.creator_id) {
            queryText += ` AND e.creator_id = $${paramIndex}`;
            queryParams.push(filters.creator_id);
            paramIndex++;
        }

        queryText += ' GROUP BY e.event_id ORDER BY event_datetime ASC';

        if (filters.limit && !isNaN(filters.limit)) {
            queryText += ` LIMIT $${paramIndex}`;
            queryParams.push(parseInt(filters.limit));
            paramIndex++;
        }

        const result = await pool.query(queryText, queryParams);
        return result.rows;
    }

    /**
     * Фільтрація подій за діапазоном дат (для календаря)
     */
    async findByDateRange(from, to, filters = {}) {
        let queryText = `
            SELECT e.*, 
                   COALESCE(ROUND(AVG(r.score), 1), 0) as average_rating,
                   CASE 
                       WHEN (e.event_day + e.start_time) < NOW() THEN 'завершена'
                       ELSE 'активна'
                   END as status
            FROM events e
            LEFT JOIN ratings r ON e.event_id = r.event_id
            WHERE e.event_day >= $1 AND e.event_day <= $2
        `;
        let queryParams = [from, to];
        let paramIndex = 3;

        if (filters.creator_id) {
            queryText += ` AND e.creator_id = $${paramIndex}`;
            queryParams.push(filters.creator_id);
            paramIndex++;
        }

        if (filters.region) {
            queryText += ` AND e.region = $${paramIndex}`;
            queryParams.push(filters.region);
            paramIndex++;
        }

        if (filters.category_id) {
            queryText += ` AND e.category_id = $${paramIndex}`;
            queryParams.push(filters.category_id);
            paramIndex++;
        }

        queryText += ' GROUP BY e.event_id ORDER BY e.event_day ASC, e.start_time ASC';

        const result = await pool.query(queryText, queryParams);
        return result.rows;
    }

    /**
     * Отримати поточний статус події
     */
    async getStatus(id) {
        const result = await pool.query(
            'SELECT status FROM events WHERE event_id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    /**
     * Оновити статус події
     */
    async updateStatus(id, status) {
        const result = await pool.query(
            'UPDATE events SET status = $1 WHERE event_id = $2 RETURNING *',
            [status, id]
        );
        return result.rows[0] || null;
    }

    /**
     * Отримати роль творця за ID
     */
    async getCreatorRole(creatorId) {
        const result = await pool.query(
            'SELECT role FROM users WHERE user_id = $1',
            [creatorId]
        );
        return result.rows[0] || null;
    }

    /**
     * Запрошення учасників (транзакція)
     */
    async inviteParticipants(eventId, userIds) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (let uid of userIds) {
                const inviteQuery = `
                    INSERT INTO event_participants (user_id, event_id, status)
                    VALUES ($1, $2, 'invited')
                    ON CONFLICT (user_id, event_id) DO NOTHING
                    RETURNING *;
                `;
                const resInvite = await client.query(inviteQuery, [uid, eventId]);
                if (resInvite.rows.length > 0) {
                    results.push(resInvite.rows[0]);
                }
            }

            await client.query('COMMIT');
            return results;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    /**
     * Оновити статус учасника
     */
    async updateParticipantStatus(eventId, userId, status) {
        const result = await pool.query(
            `UPDATE event_participants 
             SET status = $1
             WHERE event_id = $2 AND user_id = $3
             RETURNING *`,
            [status, eventId, userId]
        );
        return result.rows[0] || null;
    }
}

// Singleton — один екземпляр на весь додаток
module.exports = new EventRepository();
