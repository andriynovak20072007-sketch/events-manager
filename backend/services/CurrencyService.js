// ==========================================
// ПАТЕРН: Singleton
// Єдиний екземпляр сервісу конвертації валют.
// ==========================================

class CurrencyService {
    constructor() {
        this.rates = {
            'UAH': 1.00,
            'USD': 40.50,
            'EUR': 44.20
        };
    }

    convert(amount, fromCurrency, toCurrency) {
        if (!amount || amount <= 0) return 0;
        const fromRate = this.rates[(fromCurrency || 'UAH').toUpperCase()] || 1;
        const toRate = this.rates[toCurrency.toUpperCase()];
        if (!toRate) return amount;
        const amountInBase = amount * fromRate;
        return (amountInBase / toRate).toFixed(2);
    }

    getSupportedCurrencies() {
        return Object.entries(this.rates).map(([code, rate]) => ({
            code,
            rate,
            label: { 'UAH': 'Гривня (₴)', 'USD': 'Долар ($)', 'EUR': 'Євро (€)' }[code] || code
        }));
    }

    isValidCurrency(code) {
        return !!this.rates[(code || '').toUpperCase()];
    }
}

// Singleton — один екземпляр на весь додаток
module.exports = new CurrencyService();
