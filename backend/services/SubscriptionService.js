const pool = require('../db');

// ==========================================
// ПАТЕРН: Strategy (Стратегія)
// Різні тарифні плани = різні стратегії доступу
// Сервіс інкапсулює бізнес-логіку підписок
// ==========================================

class SubscriptionService {

    // ------------------------------------------
    // Отримати всі доступні тарифні плани
    // ------------------------------------------
    static async getAllPlans() {
        const result = await pool.query(
            'SELECT * FROM subscription_plans ORDER BY price ASC'
        );
        return result.rows;
    }

    // ------------------------------------------
    // Отримати поточну підписку користувача
    // Повертає план + деталі підписки
    // ------------------------------------------
    static async getUserSubscription(userId) {
        const result = await pool.query(
            `SELECT us.subscription_id, us.status, us.started_at, us.expires_at,
                    sp.plan_id, sp.name AS plan_name, sp.display_name, sp.price, sp.currency,
                    sp.max_events, sp.max_routes, sp.can_create_public, sp.can_export, 
                    sp.priority_support, sp.description
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.plan_id
             WHERE us.user_id = $1 AND us.status = 'active'
             ORDER BY us.started_at DESC
             LIMIT 1`,
            [userId]
        );
        return result.rows[0] || null;
    }

    // ------------------------------------------
    // Призначити тариф Free новому користувачу
    // Викликається автоматично при реєстрації
    // ------------------------------------------
    static async assignFreePlan(userId) {
        // Знаходимо план 'free'
        const planResult = await pool.query(
            "SELECT plan_id FROM subscription_plans WHERE name = 'free'"
        );

        if (planResult.rows.length === 0) {
            throw new Error('План Free не знайдено в базі даних');
        }

        const planId = planResult.rows[0].plan_id;

        // Створюємо підписку (expires_at = NULL для безстрокового Free)
        const result = await pool.query(
            `INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at)
             VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, NULL)
             RETURNING *`,
            [userId, planId]
        );

        return result.rows[0];
    }

    // ------------------------------------------
    // Зміна тарифного плану (Upgrade / Downgrade)
    // ------------------------------------------
    static async upgradePlan(userId, planName) {
        // 1. Перевіряємо, чи існує цільовий план
        const planResult = await pool.query(
            'SELECT * FROM subscription_plans WHERE name = $1',
            [planName]
        );

        if (planResult.rows.length === 0) {
            return { error: 'План не знайдено', status: 400 };
        }

        const newPlan = planResult.rows[0];

        // 2. Деактивуємо поточну підписку
        await pool.query(
            "UPDATE user_subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'",
            [userId]
        );

        // 3. Розраховуємо дату закінчення
        const expiresAt = newPlan.duration_days
            ? new Date(Date.now() + newPlan.duration_days * 24 * 60 * 60 * 1000)
            : null;

        // 4. Створюємо нову підписку
        const result = await pool.query(
            `INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, expires_at)
             VALUES ($1, $2, 'active', CURRENT_TIMESTAMP, $3)
             RETURNING *`,
            [userId, newPlan.plan_id, expiresAt]
        );

        return {
            subscription: result.rows[0],
            plan: newPlan,
            status: 200
        };
    }

    // ------------------------------------------
    // Перевірка доступу до функції за поточним тарифом
    // feature: 'create_public', 'export', 'priority_support'
    // ------------------------------------------
    static async checkFeatureAccess(userId, feature) {
        const subscription = await this.getUserSubscription(userId);

        if (!subscription) {
            return { allowed: false, reason: 'Підписка не знайдена' };
        }

        const featureMap = {
            'create_public': subscription.can_create_public,
            'export': subscription.can_export,
            'priority_support': subscription.priority_support
        };

        const allowed = featureMap[feature] || false;

        return {
            allowed,
            plan: subscription.plan_name,
            reason: allowed ? 'Доступ дозволено' : `Функція "${feature}" недоступна на тарифі "${subscription.display_name}"`
        };
    }
}

module.exports = SubscriptionService;
