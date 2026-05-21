document.addEventListener('DOMContentLoaded', () => {
    const billingSwitch = document.getElementById('billing-switch');
    const monthlyLabel = document.getElementById('monthly-label');
    const yearlyLabel = document.getElementById('yearly-label');
    const amounts = document.querySelectorAll('.amount');
    const periods = document.querySelectorAll('.period');

    // Billing Toggle Logic
    billingSwitch.addEventListener('change', () => {
        const isYearly = billingSwitch.checked;
        
        if (isYearly) {
            monthlyLabel.classList.remove('active');
            yearlyLabel.classList.add('active');
            
            amounts.forEach(amount => {
                amount.textContent = amount.dataset.yearly;
                amount.style.animation = 'fadeIn 0.5s';
            });
            
            periods.forEach((period, index) => {
                if (index === 0) {
                    period.textContent = '/рік*'; // Keep note for Starter
                } else {
                    period.textContent = '/рік';
                }
            });
        } else {
            monthlyLabel.classList.add('active');
            yearlyLabel.classList.remove('active');
            
            amounts.forEach(amount => {
                amount.textContent = amount.dataset.monthly;
                amount.style.animation = 'fadeIn 0.5s';
            });
            
            periods.forEach((period, index) => {
                if (index === 0) {
                    period.textContent = '/2 міс*';
                } else {
                    period.textContent = '/міс';
                }
            });
        }
    });

    // Payment Modal Logic
    const buyProBtn = document.getElementById('buy-pro-btn');
    const starterBtn = document.getElementById('starter-btn');
    const enterpriseBtn = document.getElementById('enterprise-btn');
    
    const paymentModal = document.getElementById('paymentModal');
    const contactModal = document.getElementById('contactModal');
    const starterModal = document.getElementById('starterModal');
    const successModal = document.getElementById('successModal');
    
    const closePaymentBtn = document.getElementById('closePaymentBtn');
    const closeContactBtn = document.getElementById('closeContactBtn');
    const closeStarterBtn = document.getElementById('closeStarterBtn');
    const starterOkBtn = document.getElementById('starter-ok-btn');
    
    const paymentForm = document.getElementById('payment-form');
    const contactForm = document.getElementById('contact-form');
    
    const selectedPeriodText = document.getElementById('selected-period');
    const totalAmountText = document.getElementById('total-amount');

    // Starter Plan Action
    starterBtn.addEventListener('click', () => {
        starterModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Pro Plan Action
    buyProBtn.addEventListener('click', () => {
        const isYearly = billingSwitch.checked;
        const isEn = localStorage.getItem('language') === 'en';
        selectedPeriodText.textContent = isYearly ? (isEn ? 'Yearly' : 'Щорічно') : (isEn ? 'Monthly' : 'Щомісячно');
        totalAmountText.textContent = isYearly ? '₴3900' : '₴499';
        
        paymentModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Enterprise Plan Action
    enterpriseBtn.addEventListener('click', () => {
        contactModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Close Handlers
    const closeModals = () => {
        paymentModal.style.display = 'none';
        contactModal.style.display = 'none';
        starterModal.style.display = 'none';
        successModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    closePaymentBtn.addEventListener('click', closeModals);
    closeContactBtn.addEventListener('click', closeModals);
    closeStarterBtn.addEventListener('click', closeModals);
    starterOkBtn.addEventListener('click', closeModals);

    // Mock Payment Submission
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('confirm-payment-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');
        
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('/api/users/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (response.ok) {
                localStorage.setItem('userRole', 'pro_plus'); // Set role to pro_plus on success
                setTimeout(() => {
                    paymentModal.style.display = 'none';
                    successModal.style.display = 'flex';
                }, 1500);
            } else {
                const data = await response.json();
                const isEn = localStorage.getItem('language') === 'en';
                alert(data.error || (isEn ? 'Payment error.' : 'Помилка при оплаті.'));
                btnText.classList.remove('hidden');
                loader.classList.add('hidden');
                submitBtn.disabled = false;
            }
        } catch (error) {
            console.error('Payment error:', error);
            // Demo fallback
            setTimeout(() => {
                localStorage.setItem('userRole', 'pro_plus'); // Set role to pro_plus for demo
                paymentModal.style.display = 'none';
                successModal.style.display = 'flex';
            }, 1500);
        }
    });

    // Contact Form Submission
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const isEn = localStorage.getItem('language') === 'en';
        alert(isEn ? 'Thank you! Your request has been sent. A manager will contact you shortly.' : 'Дякуємо! Ваш запит надіслано. Менеджер зв’яжеться з вами найближчим часом.');
        closeModals();
    });

    // Input Formatting
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            value = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = value;
        });
    }

    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModals();
        }
    });
});
