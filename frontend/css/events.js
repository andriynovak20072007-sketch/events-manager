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

    const fallbackEvents = [
        { event_id: 'fest1', title: 'Фестиваль "Summer Fest"', region: 'Львів, Стадіон "Прайм"', event_day: '2026-04-28', start_time: '18:00', price: '450', currency: 'UAH', custom_image: 'images/fest1..png' },
        { event_id: 'fest2', title: 'Фестиваль "Fest"', region: 'Київ, Стадіон "Прайм"', event_day: '2026-05-30', start_time: '19:00', price: '500', currency: 'UAH', custom_image: 'images/fest2.png' },
        { event_id: 'fest3', title: 'Музичний "Summer"', region: 'Одеса, Пляж "Аркадія"', event_day: '2026-06-15', start_time: '20:00', price: '300', currency: 'UAH', custom_image: 'images/fest3.png' },
        { event_id: 'fest4', title: 'Концерт "Арт-Зима"', region: 'Харків, "Арена"', event_day: '2026-12-05', start_time: '19:30', price: '400', currency: 'UAH', custom_image: 'images/fest2.png' }
    ];

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
        try {
            const res = await fetch(`http://localhost:5000/api/events/${eventId}`);
            if (res.ok) {
                const data = await res.json();
                
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
                if (posterImg) posterImg.src = 'images/fest1..png'; // Заглушка
                
                const buyBtn = document.querySelector('.buy-ticket-main-btn');
                if (buyBtn) {
                   const priceString = data.price > 0 ? `${data.price} ${data.currency || 'UAH'}` : 'Безкоштовно';
                   buyBtn.innerText = `Придбати квиток | Від ${priceString}`;
                }

                const descpriptionEl = document.querySelector('.event-details-text p');
                if (descpriptionEl && data.description) descpriptionEl.innerText = data.description;
            }
        } catch(e) {
            console.error("Помилка завантаження події: ", e);
        }
    } 
    // Якщо ми на головній сторінці (рендеримо сітку)
    else if (document.getElementById('events-grid')) {
        const eventsGrid = document.getElementById('events-grid');
        
        const renderEvents = (eventsToRender) => {
            if (!eventsGrid) return;
            eventsGrid.innerHTML = '';
            
            if (eventsToRender.length === 0) {
                eventsGrid.innerHTML = '<p>Подій не знайдено.</p>';
                return;
            }

            eventsToRender.forEach(ev => {
                const card = document.createElement('div');
                card.className = 'event-card';
                const dateObj = new Date(ev.event_day);
                const dateSplit = dateObj.toLocaleDateString("uk-UA");
                
                const priceValue = parseFloat(ev.display_price || ev.price);
                const priceText = priceValue > 0 ? `${priceValue} ${ev.display_currency || ev.currency || 'UAH'}` : 'Безкоштовно';
                
                const imgSrc = ev.custom_image || 'images/fest1..png';
                
                card.innerHTML = `
                    <div style="background-image: url('${imgSrc}'); background-size: cover; background-position: center; border-radius: 18px; width: 100%; height: 200px; margin-bottom: 15px;"></div>
                    <h3 class="event-name">${ev.title}</h3>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2854C5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${ev.region || 'Не вказано'}
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
                    <a href="events.html?event=${ev.event_id}" class="event-link">Дізнатися більше</a>
                `;
                eventsGrid.appendChild(card);
            });
        };

        renderEvents(eventsData);

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
});

// Отримуємо елементи пошуку зі сторінки
const searchInput = document.getElementById('title-search-input');
const searchMessage = document.getElementById('search-message');


/*
 Обробка помилок і порожнього результату (за назвою)
 Обробка null/порожнього результату (пошук)
*/
function showSearchMessage(text, isError = false) {
  if (!searchMessage) return;

  searchMessage.textContent = text;
  searchMessage.style.display = 'block';
  searchMessage.style.color = isError ? 'red' : '#333';
}


//Очищає повідомлення перед новим пошуком
function clearSearchMessage() {
  if (!searchMessage) return;

  searchMessage.textContent = '';
  searchMessage.style.display = 'none';
}


/*
Обробка null/порожнього результату (пошук)
Обробка помилок і порожнього результату (за назвою)
*/
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

  // відображення списку подій
  console.log('Знайдені події:', events);
}


// якщо сталася помилка запиту (fetch, сервер, мережа)
function handleSearchError() {
  showSearchMessage('Сталася помилка під час пошуку', true);
}


/*
- викликає API
- отримує дані
- передає їх у handleSearchResults
- при помилці викликає handleSearchError
*/
async function searchByTitle(title) {
  try {
    clearSearchMessage();

    const response = await fetch(`/events?title=${encodeURIComponent(title)}`);

    // Якщо сервер повернув помилку
    if (!response.ok) {
      throw new Error('Помилка запиту');
    }

    const data = await response.json();

    // Якщо API повернув null
    if (data == null) {
      handleSearchResults(null);
      return;
    }

    handleSearchResults(data);

  } catch (error) {
    console.error('Search error:', error);
    handleSearchError();
  }
}


/*
- якщо поле пусте → показує повідомлення
- якщо є текст → запускає пошук
*/
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
