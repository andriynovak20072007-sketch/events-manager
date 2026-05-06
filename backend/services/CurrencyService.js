// ==========================================
// ПАТЕРН: Singleton
// Єдиний екземпляр сервісу конвертації валют.
// Раніше цей клас дублювався в routes/events.js та routes/users.js.
// Тепер він живе в одному місці (DRY принцип).
// ==========================================

class CurrencyService {
    constructor() {
        // Базова валюта - UAH (Єдине джерело правди)
        this.rates = {
            'UAH': 1.00,
            'USD': 40.50,
            'EUR': 44.20
        };
    }

    /**
     * Конвертація суми з однієї валюти в іншу.
     * Математика: спочатку переводимо в базову валюту (UAH),
     * а потім — у цільову.
     */
    convert(amount, fromCurrency, toCurrency) {
        if (!amount || amount <= 0) return 0;

        const fromRate = this.rates[(fromCurrency || 'UAH').toUpperCase()] || 1;
        const toRate = this.rates[toCurrency.toUpperCase()];

        if (!toRate) return amount; // Якщо валюту не знайдено, повертаємо як є

        const amountInBase = amount * fromRate;
        return (amountInBase / toRate).toFixed(2);
    }

    /**
     * Повертає масив підтримуваних валют із їхніми курсами.
     * Корисно для фронтенду — побудувати dropdown/select.
     */
    getSupportedCurrencies() {
        return Object.entries(this.rates).map(([code, rate]) => ({
            code,
            rate,
            label: this._getCurrencyLabel(code)
        }));
    }

    /**
     * Перевіряє, чи підтримується дана валюта.
     */
    isValidCurrency(code) {
        if (!code) return false;
        return code.toUpperCase() in this.rates;
    }

    /**
     * Приватний хелпер: людиночитабельні назви валют.
     */
    _getCurrencyLabel(code) {
        const labels = {
            'UAH': 'Гривня (₴)',
            'USD': 'Долар ($)',
            'EUR': 'Євро (€)'
        };
        return labels[code] || code;
    }
}

// Створюємо єдиний екземпляр (Singleton) і експортуємо саме його
const currencyService = new CurrencyService();
module.exports = currencyService;
