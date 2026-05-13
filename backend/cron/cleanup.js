const cron = require('node-cron');
const pool = require('../db');

// Налаштовуємо розклад: '1 0 * * *' означає "Щодня о 00:01 ночі"
// Для тестування можеш змінити на '* * * * *' (кожної хвилини)
cron.schedule('1 0 * * *', async () => {
    console.log('🧹 [CRON] Запуск автоматичного очищення старих подій...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Починаємо транзакцію

        // 1. Оскільки у нас є пов'язані таблиці, ми не можемо просто видалити подію.
        // База видасть помилку Foreign Key. Спочатку видаляємо згадки з 'favorites' та 'route_events'.
        const deleteFavorites = `
            DELETE FROM favorites 
            WHERE event_id IN (SELECT event_id FROM events WHERE event_day < CURRENT_DATE)
        `;
        await client.query(deleteFavorites);

        const deleteRouteEvents = `
            DELETE FROM route_events 
            WHERE event_id IN (SELECT event_id FROM events WHERE event_day < CURRENT_DATE)
        `;
        await client.query(deleteRouteEvents);

        // 2. Тепер, коли "хвости" обрізані, безпечно видаляємо самі події, 
        // дата яких менша за СЬОГОДНІШНЮ (CURRENT_DATE)
        const deleteEvents = `
            DELETE FROM events 
            WHERE event_day < CURRENT_DATE 
            RETURNING event_id
        `;
        const result = await client.query(deleteEvents);

        await client.query('COMMIT'); 
        console.log(`✅ [CRON] Очищення успішне. Видалено подій: ${result.rowCount}`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ [CRON] Помилка під час очищення бази:', err.message);
    } finally {
        client.release();
    }
});