const eventPageData = {
    'fest1': {
        title: 'Фестиваль "Summer Fest"',
        city: 'Львів, Стадіон "Прайм"',
        date: '28 квітня, 18:00',
        image: 'images/fest1..png',
        price: 'Від 450 грн',
        regionId: 'Lviv' // Точно як id="Lviv" у вашому HTML
    },
    'fest2': {
        title: 'Фестиваль "Fest"',
        city: 'Київ, Стадіон "Прайм"',
        date: '30 травня, 19:00',
        image: 'images/fest2.png',
        price: 'Від 500 грн',
        regionId: 'kyiv' // Точно як id="kyiv" у вашому HTML
    },
    'fest3': {
        title: 'Музичний "Summer"',
        city: 'Одеса, Пляж "Аркадія"',
        date: '15 червня, 20:00',
        image: 'images/fest3.png',
        price: 'Від 300 грн',
        regionId: 'odesa' // Точно як id="odesa" у вашому HTML
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. ЛОГІКА СТОРІНКИ ПОДІЇ (Підстановка даних) ---
    
    // Отримуємо ID події з посилання
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    // Якщо така подія є в нашому списку — підставляємо дані
    if (eventId && eventPageData[eventId]) {
        const data = eventPageData[eventId];
        
        const titleEl = document.querySelector('.event-page-title');
        if (titleEl) titleEl.innerText = data.title;
        
        const metaSpans = document.querySelectorAll('.meta-row span');
        if (metaSpans.length >= 2) {
            metaSpans[0].innerText = data.city; 
            metaSpans[1].innerText = data.date; 
        }
        
        const posterImg = document.querySelector('.event-poster-img');
        if (posterImg) posterImg.src = data.image;
        
        const buyBtn = document.querySelector('.buy-ticket-main-btn');
        if (buyBtn) buyBtn.innerText = `Придбати квиток | ${data.price}`;
    }

    // 2. Логіка "Читати далі" 
    const descriptionBlock = document.querySelector('.event-details-text');
    if (descriptionBlock) {
        const readMoreBtn = document.createElement('button');
        readMoreBtn.innerText = 'Читати далі';
        readMoreBtn.className = 'read-more-btn';
        
        descriptionBlock.parentNode.insertBefore(readMoreBtn, descriptionBlock.nextSibling);

        readMoreBtn.addEventListener('click', () => {
            descriptionBlock.classList.toggle('expanded');
            readMoreBtn.innerText = descriptionBlock.classList.contains('expanded') ? 'Згорнути' : 'Читати далі';
        });
    }

    // --- 3. ЛОГІКА ПОШУКУ ПОДІЙ ---
    
    // Отримуємо елементи пошуку зі сторінки
    // Додано гнучкий пошук: шукає по ID (якщо є) або бере інпут з .search-box
    const searchInput = document.getElementById('title-search-input') || document.querySelector('.search-box input');
    const searchMessage = document.getElementById('search-message');

    // Вивід повідомлень
    function showSearchMessage(text, isError = false) {
        if (!searchMessage) return;
        searchMessage.textContent = text;
        searchMessage.style.display = 'block';
        searchMessage.style.color = isError ? 'red' : '#333';
    }

    // Очищення повідомлень
    function clearSearchMessage() {
        if (!searchMessage) return;
        searchMessage.textContent = '';
        searchMessage.style.display = 'none';
    }

    // Обробка результатів пошуку
    function handleSearchResults(events) {
        // Якщо API повернув null або undefined
        if (events == null) {
            showSearchMessage('Подій не знайдено');
            return;
        }

        // Якщо API повернув не масив (помилка формату)
        if (!Array.isArray(events)) {
            showSearchMessage('Неправильний формат даних пошуку', true);
            return;
        }

        // Якщо масив пустий
        if (events.length === 0) {
            showSearchMessage('Подій не знайдено');
            return;
        }

        // Якщо все ок — прибираємо повідомлення
        clearSearchMessage();

        // Тут буде відображення списку подій
        console.log('Знайдені події:', events);
    }

    // Обробка помилок
    function handleSearchError() {
        showSearchMessage('Сталася помилка під час пошуку', true);
    }

    // Запит до локальних даних (імітація API)
    function searchByTitle(title) {
        try {
            clearSearchMessage();

            const query = title.toLowerCase();
            const results = Object.values(eventPageData).filter(event => 
                event.title.toLowerCase().includes(query) || 
                event.city.toLowerCase().includes(query)
            );

            handleSearchResults(results);

        } catch (error) {
            console.error('Search error:', error);
            handleSearchError();
        }
    }

    // Слухач подій для поля вводу
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = searchInput.value.trim();

                if (value === '') {
                    showSearchMessage('Введіть назву події');
                    return;
                }

                searchByTitle(value);
            }
        });
    }
});