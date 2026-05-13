const pool = require('../db');

// ==========================================
// ПАТЕРН: Singleton + Strategy
// Сервіс управління Trial-періодом (2 місяці)
// ==========================================

class TrialService {
    constructor() {
        if (TrialService._instance) {
            return TrialService._instance;
        }

        // Тривалість trial-періоду (2 місяці в мілісекундах)
        this.TRIAL_DURATION_MS = 2 * 30 * 24 * 60 * 60 * 1000; // ~60 днів
        this.TRIAL_DURATION_DAYS = 60;

        // Ліміти для Starter (trial) плану
        this.STARTER_LIMITS = {
            max_active_events: 3,
            has_analytics: true,       // Базова аналітика
            has_map_search: true,      // Пошук по карті
            has_priority: false,       // Пріоритетне просування
            has_ticket_sales: false,   // Продаж квитків
            has_verified_badge: false  // Синя галочка
        };

        TrialService._instance = this;
    }

    // ==========================================
    // 1. Активація Trial-періоду при реєстрації
    // ==========================================
    async activateTrial(userId) {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + this.TRIAL_DURATION_MS);

        try {
            const result = await pool.query(
                `UPDATE users 
                 SET trial_start = $1, trial_end = $2, is_trial_active = TRUE
                 WHERE user_id = $3 AND trial_start IS NULL
                 RETURNING user_id, username, email, role, trial_start, trial_end, is_trial_active`,
                [now, trialEnd, userId]
            );

            if (result.rows.length === 0) {
                return { success: false, reason: 'Користувач не знайдений або trial вже активовано' };
            }

            console.log(`🎁 [TRIAL] Активовано для user_id=${userId}, закінчується ${trialEnd.toISOString()}`);

            return {
                success: true,
                user: result.rows[0],
                trial_info: {
                    starts: now.toISOString(),
                    ends: trialEnd.toISOString(),
                    duration_days: this.TRIAL_DURATION_DAYS,
                    limits: this.STARTER_LIMITS
                }
            };
        } catch (err) {
            console.error('❌ [TRIAL] Помилка активації:', err.message);
            throw err;
        }
    }

    // ==========================================
    // 2. Перевірка статусу Trial-періоду
    // ==========================================
    async checkTrialStatus(userId) {
        try {
            const result = await pool.query(
                `SELECT user_id, username, role, trial_start, trial_end, is_trial_active,
                        created_at
                 FROM users WHERE user_id = $1`,
                [userId]
            );

            if (result.rows.length === 0) {
                return { error: 'Користувача не знайдено' };
            }

            const user = result.rows[0];

            // Pro/admin юзери — необмежений доступ
            if (user.role === 'pro' || user.role === 'admin') {
                return {
                    user_id: user.user_id,
                    plan: user.role,
                    is_active: true,
                    is_trial: false,
                    limits: null // Безлімітний
                };
            }

            // Якщо trial не активовано
            if (!user.trial_start) {
                return {
                    user_id: user.user_id,
                    plan: 'free',
                    is_active: true,
                    is_trial: false,
                    trial_available: true, // Може активувати trial
                    limits: this.STARTER_LIMITS
                };
            }

            const now = new Date();
            const trialEnd = new Date(user.trial_end);
            const isExpired = now > trialEnd;

            // Якщо trial закінчився — автоматично деактивуємо
            if (isExpired && user.is_trial_active) {
                await this.expireTrial(userId);
            }

            if (isExpired) {
                return {
                    user_id: user.user_id,
                    plan: 'free_expired',
                    is_active: true,
                    is_trial: false,
                    trial_expired: true,
                    trial_ended_at: trialEnd.toISOString(),
                    message: 'Trial-період закінчився. Оновіть до Pro для повного доступу.',
                    limits: this.STARTER_LIMITS
                };
            }

            // Trial активний
            const daysLeft = Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000));

            return {
                user_id: user.user_id,
                plan: 'starter_trial',
                is_active: true,
                is_trial: true,
                trial_start: user.trial_start,
                trial_end: trialEnd.toISOString(),
                days_remaining: daysLeft,
                limits: this.STARTER_LIMITS
            };
        } catch (err) {
            console.error('❌ [TRIAL] Помилка перевірки статусу:', err.message);
            throw err;
        }
    }

    // ==========================================
    // 3. Деактивація Trial при закінченні терміну
    // ==========================================
    async expireTrial(userId) {
        try {
            await pool.query(
                `UPDATE users SET is_trial_active = FALSE WHERE user_id = $1`,
                [userId]
            );
            console.log(`⏰ [TRIAL] Закінчився для user_id=${userId}`);
        } catch (err) {
            console.error('❌ [TRIAL] Помилка деактивації:', err.message);
        }
    }

    // ==========================================
    // 4. Перевірка лімітів (кількість подій)
    // ==========================================
    async canCreateEvent(userId) {
        try {
            const status = await this.checkTrialStatus(userId);

            // Pro/admin — завжди можуть
            if (status.plan === 'pro' || status.plan === 'admin') {
                return { allowed: true };
            }

            // Перевіряємо кількість активних подій
            const countResult = await pool.query(
                `SELECT COUNT(*) as active_count 
                 FROM events 
                 WHERE creator_id = $1 
                   AND (event_day + start_time) > NOW()`,
                [userId]
            );

            const activeCount = parseInt(countResult.rows[0].active_count);
            const maxEvents = this.STARTER_LIMITS.max_active_events;

            if (activeCount >= maxEvents) {
                return {
                    allowed: false,
                    reason: `Досягнуто ліміт активних подій (${maxEvents}). Оновіть до Pro для безлімітних подій.`,
                    current_count: activeCount,
                    max_count: maxEvents
                };
            }

            return {
                allowed: true,
                current_count: activeCount,
                max_count: maxEvents,
                remaining: maxEvents - activeCount
            };
        } catch (err) {
            console.error('❌ [TRIAL] Помилка перевірки лімітів:', err.message);
            // У разі помилки — дозволяємо створення (graceful degradation)
            return { allowed: true };
        }
    }

    // ==========================================
    // 5. Масова перевірка закінчених trial-ів (для cron)
    // ==========================================
    async expireAllOverdueTrials() {
        try {
            const result = await pool.query(
                `UPDATE users 
                 SET is_trial_active = FALSE 
                 WHERE is_trial_active = TRUE AND trial_end < NOW()
                 RETURNING user_id, username, email`
            );

            if (result.rows.length > 0) {
                console.log(`⏰ [TRIAL] Деактивовано ${result.rows.length} закінчених trial-ів`);
            }

            return result.rows;
        } catch (err) {
            console.error('❌ [TRIAL] Помилка масової деактивації:', err.message);
            return [];
        }
    }
}

// Експортуємо Singleton-інстанс
module.exports = new TrialService();
