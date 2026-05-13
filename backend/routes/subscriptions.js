const express = require('express');
const router = express.Router();
const SubscriptionService = require('../services/SubscriptionService');

// ==========================================
// 1. ОТРИМАННЯ СПИСКУ ТАРИФНИХ ПЛАНІВ
// GET /api/subscriptions/plans
// ==========================================
router.get('/plans', async (req, res) => {
    try {
        const plans = await SubscriptionService.getAllPlans();

        res.json({
            status: 'success',
            data: plans,
            count: plans.length
        });
    } catch (err) {
        console.error('Помилка отримання тарифів:', err.message);
        res.status(500).json({ error: 'Помилка сервера при отриманні тарифних планів' });
    }
});

// ==========================================
// 2. ОТРИМАННЯ ПОТОЧНОЇ ПІДПИСКИ КОРИСТУВАЧА
// GET /api/subscriptions/:userId
// ==========================================
router.get('/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Невалідний ID користувача' });
        }

        const subscription = await SubscriptionService.getUserSubscription(userId);

        if (!subscription) {
            return res.status(404).json({ error: 'Підписку не знайдено для цього користувача' });
        }

        res.json({
            status: 'success',
            data: subscription
        });
    } catch (err) {
        console.error('Помилка отримання підписки:', err.message);
        res.status(500).json({ error: 'Помилка сервера при отриманні підписки' });
    }
});

// ==========================================
// 3. ЗМІНА ТАРИФНОГО ПЛАНУ (UPGRADE)
// POST /api/subscriptions/:userId/upgrade
// ==========================================
router.post('/:userId/upgrade', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { plan } = req.body;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'Невалідний ID користувача' });
        }

        if (!plan) {
            return res.status(400).json({ error: "Вкажіть назву тарифу (plan: 'pro' або 'premium')" });
        }

        // Валідація назви тарифу
        const validPlans = ['free', 'pro', 'premium'];
        if (!validPlans.includes(plan)) {
            return res.status(400).json({ 
                error: `Невалідний тариф "${plan}". Доступні: ${validPlans.join(', ')}` 
            });
        }

        const result = await SubscriptionService.upgradePlan(userId, plan);

        if (result.error) {
            return res.status(result.status).json({ error: result.error });
        }

        res.json({
            status: 'success',
            msg: `Тариф успішно змінено на "${result.plan.display_name}"`,
            data: {
                subscription: result.subscription,
                plan: {
                    name: result.plan.name,
                    display_name: result.plan.display_name,
                    max_events: result.plan.max_events,
                    max_routes: result.plan.max_routes,
                    can_create_public: result.plan.can_create_public,
                    can_export: result.plan.can_export,
                    priority_support: result.plan.priority_support
                }
            }
        });
    } catch (err) {
        console.error('Помилка зміни тарифу:', err.message);
        res.status(500).json({ error: 'Помилка сервера при зміні тарифу' });
    }
});

module.exports = router;
