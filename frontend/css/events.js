document.addEventListener("DOMContentLoaded", async () => {
    // --- 1. ЛОГІКА ІНТЕРФЕЙСУ (ПРАЦЮЄ ЗАВЖДИ, ДЕ Є ЦІ ЕЛЕМЕНТИ) ---

    // Кнопка "Читати далі"
    const descriptionBlock = document.querySelector('.event-details-text');
    if (descriptionBlock) {
        // Перевіряємо, чи ще немає кнопки, щоб не наплодити дублікатів
        if (!document.querySelector('.read-more-btn')) {
            const readMoreBtn = document.createElement('button');
            readMoreBtn.innerText = 'Читати далі';
            readMoreBtn.className = 'read-more-btn';
            
            descriptionBlock.parentNode.insertBefore(readMoreBtn, descriptionBlock.nextSibling);

            readMoreBtn.addEventListener('click', () => {
                descriptionBlock.classList.toggle('expanded');
                readMoreBtn.innerText = descriptionBlock.classList.contains('expanded') ? 'Згорнути' : 'Читати далі';
            });
        }
    }

    // Кнопка "ОБРАНЕ"
    const favoriteBtn = document.getElementById('favoriteToggleBtn');
    const favoriteIcon = document.getElementById('favoriteIcon');
    const favoriteText = document.getElementById('favoriteText');

    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Зупиняємо стрибок сторінки вгору
            
            const isFavorite = favoriteBtn.classList.contains('active');
            
            if (isFavorite) {
                // ВИДАЛЯЄМО З ОБРАНОГО
                favoriteBtn.classList.remove('active');
                favoriteIcon.style.fill = 'none'; // Робимо прозорим
                favoriteText.innerText = 'Додати до обраного'; 
            } else {
                // ДОДАЄМО В ОБРАНЕ
                favoriteBtn.classList.add('active');
                favoriteIcon.style.fill = '#ff4d4d'; // Заливаємо червоним (колір var(--red))
                favoriteText.innerText = 'Видалити з обраного'; 
            }
        });
    }

    // --- 2. ЛОГІКА ЗАВАНТАЖЕННЯ ДАНИХ (API) ---

    const allMockEvents = [
        { id: 'fest1', title: 'Фестиваль "Summer Fest"', location: 'Львів, Стадіон "Прайм"', eventDate: '2026-04-28', start_time: '18:00', price: 500, img: 'images/fest1..png' },
        { id: 'fest2', title: 'Фестиваль "Fest"', location: 'Київ, Стадіон "Прайм"', eventDate: '2026-05-30', start_time: '19:00', price: 1200, img: 'images/fest2.png' },
        { id: 'fest3', title: 'Музичний "Summer"', location: 'Одеса, Пляж "Аркадія"', eventDate: '2026-06-15', start_time: '20:00', price: 0, img: 'images/fest3.png' },
        { id: 'lecture1', title: 'ІТ Конференція "CodeX"', location: 'Львів, Арена Львів', eventDate: '2026-05-20', start_time: '10:00', price: 800, img: 'images/event-1.webp' },
        { id: 'lecture2', title: 'Майстер-клас "UX Story"', location: 'Одеса, IT Hub', eventDate: '2026-06-11', start_time: '16:00', price: 400, img: 'images/event-2.jpg' },
        { id: 'lecture3', title: 'Лекція "Наука в ІТ"', location: 'Київ, UNIT.City', eventDate: '2026-06-06', start_time: '14:00', price: 650, img: 'images/event-3.jpg' },
        { id: 'concert1', title: 'Концерт "Нічний Джем"', location: 'Київ, МВЦ', eventDate: '2026-05-12', start_time: '19:00', price: 900, img: 'images/event-1.webp' },
        { id: 'concert2', title: 'Рок-фестиваль "City Beat"', location: 'Харків, Парк Горького', eventDate: '2026-05-18', start_time: '20:00', price: 1100, img: 'images/event-2.jpg' },
        { id: 'concert3', title: 'Jazz Night "Odessa Vibes"', location: 'Одеса, Клуб "Море"', eventDate: '2026-06-03', start_time: '19:30', price: 700, img: 'images/event-3.jpg' },
        { id: 'sport1', title: 'Матч "Динамо" - "Шахтар"', location: 'Київ, НСК "Олімпійський"', eventDate: '2026-05-08', start_time: '17:00', price: 1400, img: 'images/event-1.webp' },
        { id: 'sport2', title: 'Біг по парку "Lviv Run"', location: 'Львів, Стрийський парк', eventDate: '2026-05-22', start_time: '09:00', price: 250, img: 'images/event-2.jpg' },
        { id: 'sport3', title: 'Велокрос у Харкові', location: 'Харків, Парк Шевченка', eventDate: '2026-05-27', start_time: '11:00', price: 300, img: 'images/event-3.jpg' }
    ];

    const fallbackEvents = allMockEvents.map(e => ({
        event_id: e.id,
        title: e.title,
        region: e.location,
        event_day: e.eventDate,
        start_time: e.start_time,
        price: e.price,
        currency: 'UAH',
        custom_image: e.img,
        description: 'Чудова подія для вас і ваших друзів! Долучайтеся та отримуйте незабутні емоції.'
    }));

    let eventsData = [];
    try {
        const response = await fetch('http://localhost:5000/api/events');
        if (response.ok) {
            eventsData = await response.json();
        } else {
            console.error('Не вдалося завантажити події');
        }
    } catch (e) {
        console.error('Помилка підключення до API:', e);
    }

    if (!eventsData || eventsData.length === 0) {
        eventsData = fallbackEvents;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    // Якщо ми на сторінці окремої події і є ID
    if (eventId) {
        // Утиліта для візуального оновлення DOM сторінки події
        const updateEventPage = (data) => {
            const titleEl = document.querySelector('.event-page-title');
            if (titleEl) titleEl.innerText = data.title;
            
            const metaSpans = document.querySelectorAll('.meta-row span');
            if (metaSpans.length >= 2) {
                metaSpans[0].innerText = data.region || 'Регіон не вказано'; 
                const dateObj = new Date(data.event_day);
                const formattedDate = dateObj.toLocaleDateString("uk-UA");
                metaSpans[1].innerText = `${formattedDate}, ${data.start_time}`; 
            }
            
            const posterImg = document.querySelector('.event-poster-img');
            if (posterImg) {
                // Виводимо картинку події, якщо знайдена (або залишаємо заглушку)
                posterImg.src = data.custom_image || 'images/fest1..png'; 
            }
            
            const buyBtn = document.querySelector('.buy-ticket-main-btn');
            if (buyBtn) {
               const priceString = data.price > 0 ? `${data.price} ${data.currency || 'UAH'}` : 'Безкоштовно';
               buyBtn.innerText = `Придбати квиток | Від ${priceString}`;
               
               // Додаємо перехід на зовнішній сайт
               buyBtn.addEventListener('click', async () => {
                   // Analytics: record "sale" (click-to-buy)
                   fetch(`http://localhost:5000/api/analytics/${eventId}/sale`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                           price: data.price,
                           currency: data.currency || 'UAH'
                       })
                   }).catch(err => console.warn('Sale tracking error:', err));

                   const bookingUrl = data.booking_url || 'https://karabas.com/ua/'; 
                   window.open(bookingUrl, '_blank');
               });
            }

            const descpriptionEl = document.querySelector('.event-details-text p');
            if (descpriptionEl && data.description) descpriptionEl.innerText = data.description;

            // --- TRACK VIEW (Analytics) ---
            const utmSource = urlParams.get('utm_source') || 'direct';
            const utmMedium = urlParams.get('utm_medium');
            const utmCampaign = urlParams.get('utm_campaign');

            fetch(`http://localhost:5000/api/analytics/${eventId}/view`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    utm_source: utmSource,
                    utm_medium: utmMedium,
                    utm_campaign: utmCampaign
                })
            }).catch(err => console.warn('Analytics tracking error:', err));
        };

        try {
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                updateEventPage(data);
            } else {
                throw new Error('API повернув помилку або подія не знайдена');
            }
        } catch(e) {
            console.warn("Помилка БД, використовуємо заглушку: ", e.message);
            // Шукаємо в локальних моках, якщо бекенд не віддав інфу
            const fallbackData = fallbackEvents.find(ev => String(ev.event_id) === String(eventId));
            if (fallbackData) {
                updateEventPage(fallbackData);
            } else {
                const titleEl = document.querySelector('.event-page-title');
                if (titleEl) titleEl.innerText = 'Подію не знайдено :(';
            }
        }
    } 
    // Якщо ми на головній сторінці (рендеримо сітку)
    else if (document.getElementById('events-grid')) {
        const eventsGrid = document.getElementById('events-grid');
        
        const renderEvents = (eventsToRender) => {
            if (!eventsGrid) return;
            eventsGrid.innerHTML = '';
            
            // Отримуємо поточну мову
            const currentLang = localStorage.getItem('language') || 'ua';
            const dateLocale = currentLang === 'en' ? 'en-US' : 'uk-UA';
            
            if (eventsToRender.length === 0) {
                const noEventsMsg = currentLang === 'en' ? 'No events found.' : 'Подій не знайдено.';
                eventsGrid.innerHTML = `<p>${noEventsMsg}</p>`;
                return;
            }

            eventsToRender.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                
                // Динамічне форматування дати
                const dateObj = new Date(ev.event_day);
                const dateSplit = dateObj.toLocaleDateString(dateLocale);
                
                // Переклад тексту "Безкоштовно"
                const priceValue = parseFloat(ev.display_price || ev.price);
                let priceText = "";
                if (priceValue > 0) {
                    priceText = `${priceValue} ${ev.display_currency || ev.currency || 'UAH'}`;
                } else {
                    priceText = currentLang === 'en' ? 'Free' : 'Безкоштовно';
                }
                
                // Переклад допоміжних текстів
                const learnMoreText = currentLang === 'en' ? 'Learn more' : 'Дізнатися більше';
                
                // Спроба перекласти заголовок та регіон, якщо вони є в словнику
                let titleText = ev.title;
                let regionText = ev.region || 'Не вказано';
                
                if (currentLang === 'en' && typeof translations !== 'undefined') {
                    if (translations.en[ev.title]) titleText = translations.en[ev.title];
                    if (translations.en[ev.region]) regionText = translations.en[ev.region];
                    else if (ev.region === 'Не вказано') regionText = 'Not specified';
                }

                const imgSrc = ev.custom_image || 'images/fest1..png';
                
                card.innerHTML = `
                    <div style="background-image: url('${imgSrc}'); background-size: cover; background-position: center; border-radius: 18px; width: 100%; height: 200px; margin-bottom: 15px;"></div>
                    <h3 class="event-name">${titleText}</h3>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2854C5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${regionText}
                    </div>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${dateSplit}, ${ev.start_time}
                    </div>
                    <div class="event-detail" style="font-weight: 600; color: var(--blue-dark); margin-bottom:15px; margin-top:5px;">
                        ${priceText}
                    </div>
                    <a href="events.html?event=${ev.event_id}" class="event-link">${learnMoreText}</a>
                `;
                eventsGrid.appendChild(card);
            });
        };

        renderEvents(eventsData);

        // Перемальовуємо картки при зміні мови
        window.addEventListener('languageChanged', () => {
            renderEvents(eventsData);
        });

        // --- 3. ЛОГІКА ПОШУКУ ПОДІЙ ---
        const searchInput = document.getElementById('title-search-input') || document.querySelector('.search-box input');
        const searchMessage = document.getElementById('search-message');

        function showSearchMessage(text, isError = false) {
            if (!searchMessage) return;
            searchMessage.textContent = text;
            searchMessage.style.display = 'block';
            searchMessage.style.color = isError ? 'red' : '#333';
        }
        function clearSearchMessage() {
            if (!searchMessage) return;
            searchMessage.textContent = '';
            searchMessage.style.display = 'none';
        }

        function searchByTitle(title) {
            try {
                clearSearchMessage();
                const query = title.toLowerCase();
                const results = eventsData.filter(event => 
                    event.title.toLowerCase().includes(query) || 
                    (event.region && event.region.toLowerCase().includes(query))
                );
                
                if (results.length === 0) {
                    showSearchMessage('Подій не знайдено');
                } else {
                    clearSearchMessage();
                }
                
                renderEvents(results);
            } catch (error) {
                console.error('Search error:', error);
                showSearchMessage('Сталася помилка під час пошуку', true);
            }
        }

        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const value = searchInput.value.trim();
                    if (value === '') {
                        renderEvents(eventsData);
                        clearSearchMessage();
                        return;
                    }
                    searchByTitle(value);
                }
            });
        }
    }

    // --- 4. ЛОГІКА КАРУСЕЛІ (ГОТЕЛІ / РЕСТОРАНИ) ---
    const nearbyCarousel = document.getElementById('nearbyCarousel');
    const prevBtn = document.getElementById('nearbyPrevBtn');
    const nextBtn = document.getElementById('nearbyNextBtn');

    if (nearbyCarousel && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            nearbyCarousel.scrollBy({ left: -300, behavior: 'smooth' });
        });
        nextBtn.addEventListener('click', () => {
            nearbyCarousel.scrollBy({ left: 300, behavior: 'smooth' });
        });
    }
});


