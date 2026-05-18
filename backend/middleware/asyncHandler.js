// ==========================================
// ПАТЕРН: Decorator (Декоратор)
// Обгортає async-функції роутів, автоматично перехоплюючи помилки
// та передаючи їх до централізованого error-handler (next(err)).
//
// БЕЗ цього декоратора кожен роут потребує:
//   try { ... } catch(err) { res.status(500).json({...}) }
//
// З ДЕКОРАТОРОМ достатньо:
//   router.get('/', asyncHandler(async (req, res) => { ... }));
// ==========================================

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
