const request = require('supertest');

jest.mock('../cron/cleanup', () => {});
jest.mock('../cron/scheduler', () => {});
jest.mock('nodemailer', () => ({
    createTransport: jest.fn(() => ({
        sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' }))
    }))
}));

// In-memory stores
const mockPlans = [
    { plan_id: 1, name: 'free', display_name: 'Безкоштовний', price: 0, currency: 'UAH', duration_days: null, max_events: 5, max_routes: 1, can_create_public: false, can_export: false, priority_support: false, description: 'Базовий' },
    { plan_id: 2, name: 'pro', display_name: 'Професійний', price: 149, currency: 'UAH', duration_days: 30, max_events: 50, max_routes: 10, can_create_public: true, can_export: true, priority_support: false, description: 'Розширений' },
    { plan_id: 3, name: 'premium', display_name: 'Преміум', price: 299, currency: 'UAH', duration_days: 30, max_events: -1, max_routes: -1, can_create_public: true, can_export: true, priority_support: true, description: 'Необмежений' }
];
const mockSubs = {};
let mockSubId = 1;
const mockSettings = {};
const mockViews = [];
const mockParticipants = [];
const mockUsers = {
    1: { user_id: 1, username: 'testuser', email: 'test@example.com', role: 'user', password_hash: '$2b$10$fake', created_at: '2026-01-01', trial_start: null, trial_end: null, is_trial_active: false },
    2: { user_id: 2, username: 'prouser', email: 'pro@example.com', role: 'pro_plus', password_hash: '$2b$10$fake', created_at: '2026-01-01' },
    3: { user_id: 3, username: 'admin', email: 'admin@example.com', role: 'pro', password_hash: '$2b$10$fake', created_at: '2026-01-01', trial_start: null }
};

jest.mock('../db', () => ({
    query: jest.fn((sql, values) => {
        const t = (typeof sql === 'string' ? sql.trim() : '');

        // subscription_plans SELECT (no join)
        if (t.startsWith('SELECT') && t.includes('subscription_plans') && !t.includes('user_subscriptions')) {
            if (values && values.length > 0) {
                const p = mockPlans.find(x => x.name === values[0]);
                return Promise.resolve({ rows: p ? [p] : [] });
            }
            return Promise.resolve({ rows: [...mockPlans] });
        }

        // user_subscriptions JOIN
        if (t.startsWith('SELECT') && t.includes('user_subscriptions') && t.includes('subscription_plans')) {
            const s = Object.values(mockSubs).find(x => x.user_id == values[0] && x.status === 'active');
            if (s) {
                const p = mockPlans.find(x => x.plan_id === s.plan_id);
                return Promise.resolve({ rows: [{ ...s, plan_name: p.name, display_name: p.display_name, price: p.price, currency: p.currency, max_events: p.max_events, max_routes: p.max_routes, can_create_public: p.can_create_public, can_export: p.can_export, priority_support: p.priority_support, description: p.description }] });
            }
            return Promise.resolve({ rows: [] });
        }

        // INSERT user_subscriptions
        if (t.startsWith('INSERT') && t.includes('user_subscriptions')) {
            const sub = { subscription_id: mockSubId++, user_id: values[0], plan_id: values[1], status: 'active', started_at: new Date().toISOString(), expires_at: values[2] || null };
            mockSubs[`${values[0]}:active`] = sub;
            return Promise.resolve({ rows: [sub] });
        }

        // UPDATE user_subscriptions
        if (t.startsWith('UPDATE') && t.includes('user_subscriptions')) {
            const k = `${values[0]}:active`;
            if (mockSubs[k]) { mockSubs[k].status = 'cancelled'; delete mockSubs[k]; }
            return Promise.resolve({ rows: [] });
        }

        // event_views INSERT
        if (t.startsWith('INSERT') && t.includes('event_views')) {
            mockViews.push({ event_id: values[0], utm_source: values[1], utm_medium: values[2], utm_campaign: values[3], created_at: new Date().toISOString() });
            return Promise.resolve({ rows: [] });
        }

        // event_views COUNT
        if (t.startsWith('SELECT') && t.includes('COUNT') && t.includes('event_views') && !t.includes('utm_source,')) {
            const cnt = mockViews.filter(v => v.event_id == values[0]).length;
            return Promise.resolve({ rows: [{ count: cnt }] });
        }

        // event_views UTM stats
        if (t.includes('utm_source') && t.includes('GROUP BY') && t.includes('event_views')) {
            const groups = {};
            mockViews.filter(v => v.event_id == values[0]).forEach(v => { groups[v.utm_source] = (groups[v.utm_source] || 0) + 1; });
            const rows = Object.entries(groups).map(([s, c]) => ({ utm_source: s, count: c })).sort((a, b) => b.count - a.count);
            return Promise.resolve({ rows });
        }

        // event_participants summary
        if (t.startsWith('SELECT') && t.includes('event_participants') && t.includes('tickets_sold')) {
            const evParts = mockParticipants.filter(p => p.event_id == values[0] && p.status === 'going');
            return Promise.resolve({ rows: [{ tickets_sold: evParts.length, total_revenue: evParts.reduce((s, p) => s + (p.paid_amount || 0), 0) }] });
        }

        // daily_sales for detailed
        if (t.includes('DATE(created_at)') && t.includes('event_participants')) {
            return Promise.resolve({ rows: [{ date: '2026-05-14', count: 2, amount: 300 }] });
        }

        // SELECT user by user_id
        if (t.startsWith('SELECT') && t.includes('users') && t.includes('user_id')) {
            const uid = values[0];
            const u = mockUsers[uid];
            return Promise.resolve({ rows: u ? [u] : [] });
        }

        // SELECT user_settings
        if (t.startsWith('SELECT') && t.includes('user_settings')) {
            const sk = `${values[0]}:${values[1]}`;
            return mockSettings[sk] ? Promise.resolve({ rows: [{ setting_value: mockSettings[sk] }] }) : Promise.resolve({ rows: [] });
        }

        // INSERT/UPSERT user_settings
        if (t.startsWith('INSERT') && t.includes('user_settings')) {
            const sk = `${values[0]}:${values[1]}`;
            mockSettings[sk] = values[2];
            return Promise.resolve({ rows: [{ setting_id: 1, user_id: values[0], setting_key: values[1], setting_value: values[2], updated_at: new Date().toISOString() }] });
        }

        // UPDATE users (trial, role)
        if (t.startsWith('UPDATE') && t.includes('users')) {
            const uid = values[values.length - 1];
            const u = mockUsers[uid];
            if (u) return Promise.resolve({ rows: [u] });
            return Promise.resolve({ rows: [] });
        }

        // Default fallback for INSERT (events)
        if (t.startsWith('INSERT')) {
            return Promise.resolve({ rows: [{ event_id: 1, title: values[0] }] });
        }

        return Promise.resolve({ rows: [] });
    }),
    connect: jest.fn()
}));

const app = require('../server');

beforeEach(() => {
    Object.keys(mockSubs).forEach(k => delete mockSubs[k]);
    mockSubId = 1;
    Object.keys(mockSettings).forEach(k => delete mockSettings[k]);
    mockViews.length = 0;
    mockParticipants.length = 0;
});

// =========================================================
// 1. ТАРИФНІ ПЛАНИ (Pricing Page)
// =========================================================
describe('Тарифні плани — сторінка тарифів', () => {

    it('TC-SUB-01: GET /plans повертає 3 плани', async () => {
        const res = await request(app).get('/api/subscriptions/plans');
        expect(res.statusCode).toBe(200);
        expect(res.body.data.length).toBe(3);
        expect(res.body.data.map(p => p.name)).toEqual(expect.arrayContaining(['free', 'pro', 'premium']));
    });

    it('TC-SUB-02: Плани відсортовані за ціною ASC', async () => {
        const res = await request(app).get('/api/subscriptions/plans');
        const prices = res.body.data.map(p => p.price);
        expect(prices).toEqual([0, 149, 299]);
    });

    it('TC-SUB-03: Кожен план має обовʼязкові поля', async () => {
        const res = await request(app).get('/api/subscriptions/plans');
        for (const plan of res.body.data) {
            expect(plan).toHaveProperty('name');
            expect(plan).toHaveProperty('display_name');
            expect(plan).toHaveProperty('price');
            expect(plan).toHaveProperty('max_events');
            expect(plan).toHaveProperty('can_create_public');
            expect(plan).toHaveProperty('can_export');
            expect(plan).toHaveProperty('priority_support');
        }
    });

    it('TC-SUB-04: Free план — безстроковий (duration_days=null)', async () => {
        const res = await request(app).get('/api/subscriptions/plans');
        const free = res.body.data.find(p => p.name === 'free');
        expect(free.duration_days).toBeNull();
        expect(free.price).toBe(0);
    });

    it('TC-SUB-05: Premium має необмежені ліміти та priority support', async () => {
        const res = await request(app).get('/api/subscriptions/plans');
        const premium = res.body.data.find(p => p.name === 'premium');
        expect(premium.max_events).toBe(-1);
        expect(premium.max_routes).toBe(-1);
        expect(premium.priority_support).toBe(true);
    });

    it('TC-SUB-06: Upgrade Free → Pro', async () => {
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);
        const res = await request(app).post('/api/subscriptions/1/upgrade').send({ plan: 'pro' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.plan.name).toBe('pro');
        expect(res.body.data.plan.can_export).toBe(true);
    });

    it('TC-SUB-07: Upgrade Pro → Premium', async () => {
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);
        await SubscriptionService.upgradePlan(1, 'pro');
        const res = await request(app).post('/api/subscriptions/1/upgrade').send({ plan: 'premium' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.plan.name).toBe('premium');
        expect(res.body.data.plan.priority_support).toBe(true);
    });

    it('TC-SUB-08: Downgrade Premium → Free', async () => {
        const SubscriptionService = require('../services/SubscriptionService');
        await SubscriptionService.assignFreePlan(1);
        await SubscriptionService.upgradePlan(1, 'premium');
        const res = await request(app).post('/api/subscriptions/1/upgrade').send({ plan: 'free' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.plan.name).toBe('free');
    });

    it('TC-SUB-09: Невалідний тариф → 400', async () => {
        const res = await request(app).post('/api/subscriptions/1/upgrade').send({ plan: 'enterprise' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Невалідний тариф');
    });

    it('TC-SUB-10: Upgrade без body.plan → 400', async () => {
        const res = await request(app).post('/api/subscriptions/1/upgrade').send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Вкажіть');
    });

    it('TC-SUB-11: Невалідний userId → 400', async () => {
        const res = await request(app).get('/api/subscriptions/abc');
        expect(res.statusCode).toBe(400);
    });

    it('TC-SUB-12: Підписка неіснуючого юзера → 404', async () => {
        const res = await request(app).get('/api/subscriptions/999');
        expect(res.statusCode).toBe(404);
    });
});

// =========================================================
// 2. КАСТОМІЗАЦІЯ (Settings — валюта, мова)
// =========================================================
describe('Кастомізація — налаштування користувача', () => {

    // --- Валюта ---
    it('TC-SET-01: Збереження валюти USD', async () => {
        const res = await request(app).put('/api/settings/1/currency').send({ currency: 'USD' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.currency).toBe('USD');
    });

    it('TC-SET-02: Отримання збереженої валюти', async () => {
        await request(app).put('/api/settings/1/currency').send({ currency: 'EUR' });
        const res = await request(app).get('/api/settings/1/currency');
        expect(res.body.data.currency).toBe('EUR');
    });

    it('TC-SET-03: Дефолт UAH якщо не задано', async () => {
        const res = await request(app).get('/api/settings/999/currency');
        expect(res.body.data.currency).toBe('UAH');
    });

    it('TC-SET-04: Невалідна валюта BTC → 400', async () => {
        const res = await request(app).put('/api/settings/1/currency').send({ currency: 'BTC' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Непідтримувана валюта');
    });

    it('TC-SET-05: Пустий body → 400', async () => {
        const res = await request(app).put('/api/settings/1/currency').send({});
        expect(res.statusCode).toBe(400);
    });

    it('TC-SET-06: Список валют містить UAH, USD, EUR', async () => {
        const res = await request(app).get('/api/settings/currencies');
        expect(res.statusCode).toBe(200);
        const codes = res.body.data.map(c => c.code);
        expect(codes).toEqual(expect.arrayContaining(['UAH', 'USD', 'EUR']));
    });

    it('TC-SET-07: Перезапис валюти (USD → EUR)', async () => {
        await request(app).put('/api/settings/1/currency').send({ currency: 'USD' });
        await request(app).put('/api/settings/1/currency').send({ currency: 'EUR' });
        const res = await request(app).get('/api/settings/1/currency');
        expect(res.body.data.currency).toBe('EUR');
    });

    // --- Мова ---
    it('TC-SET-08: Збереження мови en', async () => {
        const res = await request(app).put('/api/settings/1/language').send({ language: 'en' });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.language).toBe('en');
    });

    it('TC-SET-09: Отримання збереженої мови', async () => {
        await request(app).put('/api/settings/1/language').send({ language: 'pl' });
        const res = await request(app).get('/api/settings/1/language');
        expect(res.body.data.language).toBe('pl');
    });

    it('TC-SET-10: Дефолт uk якщо не задано', async () => {
        const res = await request(app).get('/api/settings/999/language');
        expect(res.body.data.language).toBe('uk');
    });

    it('TC-SET-11: Невалідна мова jp → 400', async () => {
        const res = await request(app).put('/api/settings/1/language').send({ language: 'jp' });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('Непідтримувана мова');
    });

    it('TC-SET-12: Список мов містить uk, en, pl', async () => {
        const res = await request(app).get('/api/settings/languages');
        const codes = res.body.data.map(l => l.code);
        expect(codes).toEqual(expect.arrayContaining(['uk', 'en', 'pl']));
    });

    it('TC-SET-13: Невалідний userId → 400', async () => {
        const res = await request(app).put('/api/settings/abc/currency').send({ currency: 'USD' });
        expect(res.statusCode).toBe(400);
    });

    it('TC-SET-14: Валюта та мова зберігаються незалежно', async () => {
        await request(app).put('/api/settings/1/currency').send({ currency: 'USD' });
        await request(app).put('/api/settings/1/language').send({ language: 'en' });
        const cur = await request(app).get('/api/settings/1/currency');
        const lang = await request(app).get('/api/settings/1/language');
        expect(cur.body.data.currency).toBe('USD');
        expect(lang.body.data.language).toBe('en');
    });
});

// =========================================================
// 3. ДОСТУП (Access Control — Feature Gating)
// =========================================================
describe('Контроль доступу — перевірка фіч за тарифом', () => {

    it('TC-ACC-01: Free — немає доступу до публічних подій', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        const r = await SS.checkFeatureAccess(1, 'create_public');
        expect(r.allowed).toBe(false);
        expect(r.plan).toBe('free');
    });

    it('TC-ACC-02: Free — немає доступу до експорту', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        const r = await SS.checkFeatureAccess(1, 'export');
        expect(r.allowed).toBe(false);
    });

    it('TC-ACC-03: Free — немає priority support', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        const r = await SS.checkFeatureAccess(1, 'priority_support');
        expect(r.allowed).toBe(false);
    });

    it('TC-ACC-04: Pro — доступ до публічних подій та експорту', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        await SS.upgradePlan(1, 'pro');
        const pub = await SS.checkFeatureAccess(1, 'create_public');
        const exp = await SS.checkFeatureAccess(1, 'export');
        expect(pub.allowed).toBe(true);
        expect(exp.allowed).toBe(true);
    });

    it('TC-ACC-05: Pro — немає priority support', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        await SS.upgradePlan(1, 'pro');
        const r = await SS.checkFeatureAccess(1, 'priority_support');
        expect(r.allowed).toBe(false);
    });

    it('TC-ACC-06: Premium — повний доступ', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        await SS.upgradePlan(1, 'premium');
        const pub = await SS.checkFeatureAccess(1, 'create_public');
        const exp = await SS.checkFeatureAccess(1, 'export');
        const sup = await SS.checkFeatureAccess(1, 'priority_support');
        expect(pub.allowed).toBe(true);
        expect(exp.allowed).toBe(true);
        expect(sup.allowed).toBe(true);
    });

    it('TC-ACC-07: Юзер без підписки → allowed=false', async () => {
        const SS = require('../services/SubscriptionService');
        const r = await SS.checkFeatureAccess(999, 'export');
        expect(r.allowed).toBe(false);
        expect(r.reason).toContain('не знайдена');
    });

    it('TC-ACC-08: Після downgrade Pro→Free, фічі блокуються', async () => {
        const SS = require('../services/SubscriptionService');
        await SS.assignFreePlan(1);
        await SS.upgradePlan(1, 'pro');
        let r = await SS.checkFeatureAccess(1, 'create_public');
        expect(r.allowed).toBe(true);
        await SS.upgradePlan(1, 'free');
        r = await SS.checkFeatureAccess(1, 'create_public');
        expect(r.allowed).toBe(false);
    });

    it('TC-ACC-09: Detailed аналітика — не-pro_plus → 403', async () => {
        const res = await request(app).get('/api/analytics/1/detailed?user_id=1');
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toContain('Pro+');
    });

    it('TC-ACC-10: Detailed аналітика — pro_plus → 200', async () => {
        const res = await request(app).get('/api/analytics/1/detailed?user_id=2');
        expect(res.statusCode).toBe(200);
        expect(res.body.daily_sales).toBeDefined();
        expect(res.body.utm_stats).toBeDefined();
    });
});

// =========================================================
// 4. АНАЛІТИКА (Analytics)
// =========================================================
describe('Аналітика — перегляди та статистика', () => {

    it('TC-AN-01: Логування перегляду (POST /view)', async () => {
        const res = await request(app).post('/api/analytics/view').send({ event_id: 1, utm_source: 'google' });
        expect(res.statusCode).toBe(200);
        expect(res.body.msg).toContain('View logged');
    });

    it('TC-AN-02: POST /view без event_id → 400', async () => {
        const res = await request(app).post('/api/analytics/view').send({});
        expect(res.statusCode).toBe(400);
    });

    it('TC-AN-03: Summary повертає views/tickets/revenue', async () => {
        mockViews.push({ event_id: 5, utm_source: 'direct' }, { event_id: 5, utm_source: 'google' });
        mockParticipants.push({ event_id: 5, status: 'going', paid_amount: 150 });
        const res = await request(app).get('/api/analytics/5/summary');
        expect(res.statusCode).toBe(200);
        expect(res.body.views).toBe(2);
        expect(res.body.tickets).toBe(1);
        expect(res.body.revenue).toBe(150);
    });

    it('TC-AN-04: Summary без даних → нулі', async () => {
        const res = await request(app).get('/api/analytics/999/summary');
        expect(res.statusCode).toBe(200);
        expect(res.body.views).toBe(0);
        expect(res.body.tickets).toBe(0);
        expect(res.body.revenue).toBe(0);
    });

    it('TC-AN-05: Дефолт utm_source = direct', async () => {
        await request(app).post('/api/analytics/view').send({ event_id: 1 });
        const lastView = mockViews[mockViews.length - 1];
        expect(lastView.utm_source).toBe('direct');
    });

    it('TC-AN-06: UTM-параметри зберігаються', async () => {
        await request(app).post('/api/analytics/view').send({
            event_id: 1, utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'summer'
        });
        const v = mockViews[mockViews.length - 1];
        expect(v.utm_source).toBe('facebook');
        expect(v.utm_medium).toBe('cpc');
        expect(v.utm_campaign).toBe('summer');
    });

    it('TC-AN-07: Detailed stats містить daily_sales та utm_stats', async () => {
        const res = await request(app).get('/api/analytics/1/detailed?user_id=2');
        expect(res.statusCode).toBe(200);
        expect(res.body.daily_sales).toBeInstanceOf(Array);
        expect(res.body.utm_stats).toBeInstanceOf(Array);
    });

    it('TC-AN-08: Кілька переглядів підсумовуються', async () => {
        mockViews.push(
            { event_id: 7, utm_source: 'a' },
            { event_id: 7, utm_source: 'b' },
            { event_id: 7, utm_source: 'c' }
        );
        const res = await request(app).get('/api/analytics/7/summary');
        expect(res.body.views).toBe(3);
    });
});
