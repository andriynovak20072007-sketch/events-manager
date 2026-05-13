const cron = require('node-cron');
const pool = require('../db');
const schedulerService = require('../services/EventSchedulerService');
const NotificationDispatcher = require('../services/NotificationDispatcher');
const trialService = require('../services/TrialService');

// ==========================================
// ПАТЕРН: Mediator (Посередник)
// Цей cron-модуль координує взаємодію між:
// - EventSchedulerService (сканування та черга)
// - NotificationDispatcher (відправка по каналах)
// - TrialService (деактивація закінчених trial-ів)
// Жоден з них не знає про інший — координація тут
// ==========================================

// Ініціалізуємо диспетчер сповіщень
const dispatcher = new NotificationDispatcher(pool);

// Налаштовуємо розклад: '*/5 * * * *' означає "кожні 5 хвилин"
// Для тестування можна змінити на '* * * * *' (кожної хвилини)
cron.schedule('*/5 * * * *', async () => {
    console.log('🔔 [SCHEDULER] Запуск циклу планувальника сповіщень...');
    
    try {
        // Крок 1-2: Сканування подій та формування черги
        const upcomingEvents = await schedulerService.scanUpcomingEvents();
        schedulerService.stats.scanned = upcomingEvents.length;

        if (upcomingEvents.length > 0) {
            const enqueued = await schedulerService.enqueueReminders(upcomingEvents);
            console.log(`📋 [SCHEDULER] Додано ${enqueued} нагадувань до черги`);
        }

        // Крок 3: Обробка черги з використанням диспетчера
        const processed = await schedulerService.processQueue(dispatcher);
        
        if (processed.total > 0) {
            console.log(`✅ [SCHEDULER] Оброблено: ${processed.sent} відправлено, ${processed.failed} помилок`);
        }

        // Крок 4: Деактивація закінчених trial-періодів
        await trialService.expireAllOverdueTrials();

    } catch (err) {
        console.error('❌ [SCHEDULER] Помилка циклу планувальника:', err.message);
    }
});

console.log('🔔 [SCHEDULER] Планувальник сповіщень запущено (інтервал: кожні 5 хвилин)');
