document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    const style = document.createElement('style');
    style.innerHTML = `
        .region { transition: fill 0.3s ease, filter 0.3s ease; cursor: pointer; }
        .region:hover { fill: #00AAFF !important; filter: drop-shadow(0 0 5px rgba(0,170,255,0.5)); }
        .region.active-region { fill: #2854C5 !important; stroke: white; stroke-width: 1.5px; }

        #region-tooltip {
            position: absolute; background-color: #2D2D35; color: #ffffff;
            padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 500;
            font-family: 'Montserrat', sans-serif; pointer-events: none; z-index: 999999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); white-space: nowrap; display: none;
        }

        .map-marker { position: absolute; cursor: pointer; z-index: 100; transition: all 0.3s ease; }
        .map-marker.is-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; transform: translate(-50%, -50%); box-shadow: 0 2px 5px rgba(0,0,0,0.3); }
        .map-marker.is-pin { width: 34px; height: 34px; border-radius: 50% 50% 50% 0; border: 3px solid white; transform: translate(-50%, -100%) rotate(-45deg); box-shadow: -3px 4px 8px rgba(0,0,0,0.3); }
        .map-marker.is-pin::after { content: ''; position: absolute; top: 50%; left: 50%; width: 14px; height: 14px; background: white; border-radius: 50%; transform: translate(-50%, -50%); }

        .marker-yellow { background-color: #FFB300; }
        .marker-blue { background-color: #00AAFF; }
        .marker-purple { background-color: #6209DD; }

        .bp-tooltip {
            position: fixed; background: white; padding: 16px 20px; border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); width: 260px; z-index: 10000;
            opacity: 0; visibility: hidden; pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform: translate(-50%, 10px); display: flex; flex-direction: column; gap: 16px;
        }
        .bp-tooltip.show { opacity: 1; visibility: visible; pointer-events: auto; transform: translate(-50%, -100%); }
        .bp-tooltip::after {
            content: ''; position: absolute; bottom: -8px; left: 50%;
            transform: translateX(-50%) rotate(45deg); width: 18px; height: 18px; background: white;
            box-shadow: 4px 4px 5px rgba(0,0,0,0.03); z-index: -1;
        }
        
        .bp-top-row { display: flex; align-items: flex-start; gap: 12px; }
        .bp-icon { color: #737373; margin-top: 2px; }
        .bp-icon svg { width: 22px; height: 22px; }
        .bp-text { text-align: left; }
        .bp-text h4 { margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #1a1a1a; font-family: 'Montserrat', sans-serif; line-height: 1.3;}
        .bp-text p { margin: 0 0 2px 0; font-size: 11px; color: #737373; line-height: 1.3; font-family: 'Montserrat', sans-serif; }
        
        .bp-btn {
            display: block; width: 100%; text-align: center; padding: 10px 0;
            background: #6209DD; color: white; text-decoration: none; border-radius: 20px;
            font-size: 13px; font-weight: 600; font-family: 'Montserrat', sans-serif; transition: 0.2s;
        }
        .bp-btn:hover { background: #4e07b0; }

        /* Стиль для курсора при гортанні карти */
        #map-zoom-wrapper { cursor: grab; }
        #map-zoom-wrapper:active { cursor: grabbing; }
    `;
    document.head.appendChild(style);

    // ПОП-АПИ 
    const regionTooltip = document.createElement('div');
    regionTooltip.id = 'region-tooltip';
    document.body.appendChild(regionTooltip);

    const eventTooltip = document.createElement('div');
    eventTooltip.className = 'bp-tooltip';
    eventTooltip.innerHTML = `
        <div class="bp-top-row">
            <div class="bp-icon" id="bp-icon-container"></div>
            <div class="bp-text">
                <h4 id="bp-title">Подія</h4>
                <p id="bp-location">Локація</p>
                <p id="bp-time">Час</p>
            </div>
        </div>
        <a href="#" id="bp-btn" class="bp-btn">Детальніше</a>
    `;
    document.body.appendChild(eventTooltip);

    const icons = {
        music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
        education: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>'
    };

    // ГОЛОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ КАРТИ 
    function initMap(svgElement) {
        mapContainer.innerHTML = '';
        mapContainer.style.overflow = 'hidden'; 

        const wrapperHTML = `
            <div id="map-zoom-wrapper" style="position: relative; width: 100%; height: 100%; transform-origin: center center; transition: transform 0.3s ease;">
                <div id="svg-layer" style="width: 100%;"></div>
                <div id="markers-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></div>
            </div>
        `;
        mapContainer.innerHTML = wrapperHTML;
        
        const zoomWrapper = document.getElementById('map-zoom-wrapper');
        const markersLayer = document.getElementById('markers-layer');
        
        svgElement.style.width = '100%';
        svgElement.style.height = 'auto';
        document.getElementById('svg-layer').appendChild(svgElement);

        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;
        let scale = 1;

        mapContainer.addEventListener('mousedown', (e) => {
            if (scale > 1) { 
                isDragging = true;
                // ТРЮК: Вимикаємо плавність анімації на час перетягування
                zoomWrapper.style.transition = 'none';
                
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault(); 
            
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            
            updateTransform();
        });

        window.addEventListener('mouseup', () => { 
            if(isDragging) {
                isDragging = false; 
                // Повертаємо плавність назад для зуму
                zoomWrapper.style.transition = 'transform 0.3s ease';
            }
        });
        
        // Запобіжник: якщо курсор вийшов за межі карти
        window.addEventListener('mouseleave', () => {
            if(isDragging) {
                isDragging = false; 
                zoomWrapper.style.transition = 'transform 0.3s ease';
            }
        });

        function updateTransform() {
            zoomWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
// ДАНІ МАРКЕРІВ
const events = [
    { id: 'fest2', title: 'Фестиваль "Fest"', cityId: 'kyiv', category: 'festival', location: 'Київ, Стадіон "Прайм"', time: '30 травня, 19:00', date: '2026-05-30', color: 'marker-yellow', icon: 'music', x: 48, y: 26 },
    { id: 'fest3', title: 'Музичний "Summer"', cityId: 'odesa', category: 'festival', location: 'Одеса, Пляж "Аркадія"', time: '15 червня, 20:00', date: '2026-06-15', color: 'marker-blue', icon: 'music', x: 49, y: 72 },
    { id: 'fest1', title: 'Фестиваль "Summer Fest"', cityId: 'lviv', category: 'festival', location: 'Львів, Стадіон "Прайм"', time: '28 квітня, 18:00', date: '2026-04-28', color: 'marker-purple', icon: 'music', x: 18.5, y: 35 },
    { id: 'lecture1', title: 'ІТ Конференція "CodeX"', cityId: 'lviv', category: 'education', location: 'Львів, Арена Львів', time: '20 травня, 10:00', date: '2026-05-20', color: 'marker-purple', icon: 'education', x: 21, y: 38 }
];

        const markersList = [];
        events.forEach(ev => {
            const marker = document.createElement('div');
            marker.className = `map-marker is-dot ${ev.color}`;
            marker.style.left = `${ev.x}%`;
            marker.style.top = `${ev.y}%`;
            marker.style.pointerEvents = 'auto';
            marker.setAttribute('data-event-id', ev.id);
            
            // НОВЕ: Зберігаємо дату і місто для фільтрації
            marker.dataset.date = ev.date; 
            marker.dataset.city = ev.cityId;
            marker.dataset.category = ev.category;
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.getElementById('bp-title').textContent = ev.title;
                document.getElementById('bp-location').textContent = ev.location;
                document.getElementById('bp-time').textContent = ev.time;
                document.getElementById('bp-icon-container').innerHTML = icons[ev.icon];
                document.getElementById('bp-btn').href = `events.html?event=${ev.id}`;
                
                const rect = marker.getBoundingClientRect();
                eventTooltip.style.left = `${rect.left + rect.width / 2}px`;
                const yOffset = marker.classList.contains('is-pin') ? 10 : 20; 
                eventTooltip.style.top = `${rect.top - yOffset}px`;
                eventTooltip.classList.add('show');
            });
            markersLayer.appendChild(marker);
            markersList.push(marker);
        });

        // ЛОГІКА РЕГІОНІВ ТА ЧОРНОГО ТУЛТІПА
        const regions = document.querySelectorAll('.region');
        regions.forEach(region => {
            region.addEventListener('click', (e) => {
                e.stopPropagation();
                regions.forEach(r => r.classList.remove('active-region'));
                region.classList.add('active-region');
                markersList.forEach(m => { m.classList.remove('is-dot'); m.classList.add('is-pin'); });
            });

            region.addEventListener('mouseenter', () => { regionTooltip.style.display = "block"; });
            region.addEventListener('mousemove', (e) => {
                regionTooltip.innerText = region.dataset.name || "Область";
                regionTooltip.style.left = (e.pageX + 15) + "px";
                regionTooltip.style.top = (e.pageY - 30) + "px";
            });
            region.addEventListener('mouseleave', () => { regionTooltip.style.display = "none"; });
        });

        const zoomInBtn = document.querySelector('.zoom button:first-child');
        const zoomOutBtn = document.querySelector('.zoom button:last-child');

        if (zoomInBtn && zoomOutBtn) {
            zoomInBtn.addEventListener('click', () => {
                if (scale < 3) {
                    scale += 0.4;
                    updateTransform();
                    markersList.forEach(m => { m.classList.remove('is-dot'); m.classList.add('is-pin'); });
                }
            });

            zoomOutBtn.addEventListener('click', () => {
                if (scale > 1) {
                    scale -= 0.4;
                    if (scale <= 1) {
                        scale = 1;
                        translateX = 0; 
                        translateY = 0; 
                        markersList.forEach(m => { m.classList.remove('is-pin'); m.classList.add('is-dot'); });
                    }
                    updateTransform();
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.bp-tooltip')) {
                eventTooltip.classList.remove('show');
            }
        });
    }

    // ПЕРЕВІРКА ТА ЗАВАНТАЖЕННЯ
    const existingSvg = mapContainer.querySelector('svg');
    if (existingSvg) {
        initMap(existingSvg);
    } else {
        fetch('map.html')
            .then(res => res.text())
            .then(htmlText => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const svg = doc.querySelector('svg');
                if (svg) initMap(svg);
            })
            .catch(err => console.error("Помилка:", err));
    }
});
// Дані подій (переконайся, що ID збігаються з тими, що в map.js)
const eventsData = {
    'fest1': { title: 'Фестиваль "Summer Fest"', city: 'Львів, Стадіон "Прайм"' },
    'fest2': { title: 'Фестиваль "Fest"', city: 'Київ, Стадіон "Прайм"' },
    'fest3': { title: 'Музичний "Summer"', city: 'Одеса, Пляж "Аркадія"' }
};

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.querySelector('.search-box input');
    const searchBox = document.querySelector('.search-box');
    
    if (!searchInput || !searchBox) return;

    // Створюємо випадаючий список результатів
    const resultsList = document.createElement('ul');
    resultsList.className = 'search-results';
    searchBox.appendChild(resultsList);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        resultsList.innerHTML = ''; 

        if (query.length === 0) {
            resultsList.style.display = 'none';
            return;
        }

        const matched = Object.entries(eventsData).filter(([id, data]) => {
            return data.title.toLowerCase().includes(query) || data.city.toLowerCase().includes(query);
        });

        if (matched.length > 0) {
            matched.forEach(([id, data]) => {
                const li = document.createElement('li');
                li.innerText = `${data.title} (${data.city.split(',')[0]})`;
                
                li.addEventListener('click', () => {
                    searchInput.value = data.title;
                    resultsList.style.display = 'none';
                    
                    // 1. Шукаємо маркер на карті за доданим атрибутом
                    const marker = document.querySelector(`.map-marker[data-event-id="${id}"]`);
                    
                    if (marker) {
                        // 2. Плавно скролимо до карти
                        document.getElementById('map-container').scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // 3. Імітуємо клік, щоб відкрився твій тултіп
                        setTimeout(() => {
                            marker.click();
                        }, 500);
                    }
                });
                resultsList.appendChild(li);
            });
            resultsList.style.display = 'block';
        } else {
            resultsList.style.display = 'none';
        }
    });

    // Закриття пошуку при кліку в інше місце
    document.addEventListener('click', (e) => {
        if (!searchBox.contains(e.target)) resultsList.style.display = 'none';
    });
    
});
// === ЄДИНА ЛОГІКА ФІЛЬТРАЦІЇ (КАТЕГОРІЇ + МІСТО + ДАТА) ===
document.addEventListener('DOMContentLoaded', () => {
    const applyBtn = document.getElementById('apply-btn');
    const dateInput = document.getElementById('sidebar-date');
    const citySelect = document.getElementById('city-select');
    const categoryButtons = document.querySelectorAll('.categories .category-pill');

    // Глобальний об'єкт для зберігання активної категорії
    window.currentFilters = { category: '' };

    // ГОЛОВНА ФУНКЦІЯ: перевіряє всі маркери і ховає зайві
    function filterMapMarkers() {
        const selectedDate = dateInput ? dateInput.value : ''; 
        const selectedCity = citySelect ? citySelect.value : ''; 
        const selectedCategory = window.currentFilters.category;

        const allMarkers = document.querySelectorAll('.map-marker');
        let visibleMarkers = []; 

        allMarkers.forEach(marker => {
            const markerDate = marker.dataset.date;
            const markerCity = marker.dataset.city;
            const markerCategory = marker.dataset.category;

            // Перевіряємо, чи збігаються параметри (якщо фільтр порожній - підходить все)
            const matchDate = selectedDate ? (markerDate === selectedDate) : true;
            const matchCity = selectedCity ? (markerCity === selectedCity) : true;
            const matchCategory = selectedCategory ? (markerCategory === selectedCategory) : true;

            if (matchDate && matchCity && matchCategory) {
                marker.style.display = 'block';
                // Робимо активні маркери великими пінами
                marker.classList.remove('is-dot');
                marker.classList.add('is-pin');
                visibleMarkers.push(marker);
            } else {
                marker.style.display = 'none';
            }
        });
        
        // Ховаємо тултіп, якщо він був відкритий
        const tooltip = document.querySelector('.bp-tooltip');
        if (tooltip) tooltip.classList.remove('show');
        if (popularSection && visibleMarkers.length > 0) {
            setTimeout(() => {
                popularSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start'      
                });
            }, 300); // Затримка 0.3 сек, щоб було плавно
        }

        // Якщо фільтр знайшов рівно ОДНУ подію, автоматично клікаємо по ній
        if (visibleMarkers.length === 1) {
            setTimeout(() => {
                visibleMarkers[0].click();
            }, 100); 
        }
    }

    // 1. Запуск фільтрації по кнопці "Застосувати"
    if (applyBtn) {
        applyBtn.addEventListener('click', filterMapMarkers);
    }
// --- КНОПКА СКИНУТИ ФІЛЬТРИ ---
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // 1. Очищаємо інпути в сайдбарі
            if (dateInput) dateInput.value = '';
            if (citySelect) citySelect.value = '';

            // 2. Скидаємо глобальну категорію
            window.currentFilters.category = '';

            // 3. Знімаємо підсвітку з кнопок категорій
            categoryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.opacity = '1';
            });

            // 4. Оновлюємо маркери на карті (показуємо всі)
            filterMapMarkers();

            // 5. Скидаємо випадаючі списки сортування
            const sortPrice = document.getElementById('sort-price');
            const sortRating = document.getElementById('sort-rating');
            const sortDate = document.getElementById('sort-date');
            
            if (sortPrice) sortPrice.value = 'default';
            if (sortRating) sortRating.value = 'default';
            if (sortDate) sortDate.value = 'default';

            // 6. Повертаємо картки в початковий стан
            // Оскільки ми скинули селект на 'default', зміна (change) відмалює початковий масив
            if (sortPrice) {
                sortPrice.dispatchEvent(new Event('change'));
            }
        });
    }
    // 2. Запуск фільтрації по кнопках Категорій
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Отримуємо клас (concert, festival тощо)
            const categoryClasses = Array.from(button.classList).filter(c => c !== 'category-pill' && c !== 'active');
            const selectedCategory = categoryClasses[0]; 

            // Якщо клікнули на ту саму - знімаємо фільтр
            if (window.currentFilters.category === selectedCategory) {
                window.currentFilters.category = '';
                button.classList.remove('active');
                categoryButtons.forEach(btn => btn.style.opacity = '1');
            } 
            // Якщо вибрали нову категорію
            else {
                window.currentFilters.category = selectedCategory;
                
                categoryButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.opacity = '0.5'; // Інші робимо напівпрозорими
                });
                button.classList.add('active');
                button.style.opacity = '1';
            }

            // Викликаємо оновлення маркерів!
            filterMapMarkers();
        });
    });
});
// ==========================================
// СОРТУВАННЯ ПОДІЙ ЗА ЦІНОЮ, РЕЙТИНГОМ ТА ДАТОЮ
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Наша база подій (додано поле timestamp для точного сортування дат)
    const eventsList = [
        { 
            id: 'fest1', 
            title: 'Фестиваль "Summer Fest"', 
            location: 'Львів, Стадіон "Прайм"', 
            dateStr: '28 квітня, 18:00', 
            timestamp: new Date('2026-04-28T18:00:00').getTime(), // Додано для сортування
            price: 500, 
            rating: 4.8, 
            img: 'images/fest1..png' 
        },
        { 
            id: 'fest2', 
            title: 'Фестиваль "Fest"', 
            location: 'Київ, Стадіон "Прайм"', 
            dateStr: '30 травня, 19:00', 
            timestamp: new Date('2026-05-30T19:00:00').getTime(),
            price: 1200, 
            rating: 4.9, 
            img: 'images/fest2.png' 
        },
        { 
            id: 'fest3', 
            title: 'Музичний "Summer"', 
            location: 'Одеса, Пляж "Аркадія"', 
            dateStr: '15 червня, 20:00', 
            timestamp: new Date('2026-06-15T20:00:00').getTime(),
            price: 0, 
            rating: 4.2, 
            img: 'images/fest3.png' 
        },
        { 
            id: 'lecture1', 
            title: 'ІТ Конференція "CodeX"', 
            location: 'Львів, Арена Львів', 
            dateStr: '20 травня, 10:00', 
            timestamp: new Date('2026-05-20T10:00:00').getTime(),
            price: 800, 
            rating: 5.0, 
            img: 'images/fest1..png' 
        }
    ];

    const sortPriceSelect = document.getElementById('sort-price');
    const sortRatingSelect = document.getElementById('sort-rating');
    const sortDateSelect = document.getElementById('sort-date'); // Додано селект дати
    const eventsGrid = document.querySelector('.events-grid');

    // 2. Функція, яка малює картки
    function renderEventCards(eventsToRender) {
        if (!eventsGrid) return;
        eventsGrid.innerHTML = ''; 

        eventsToRender.forEach(ev => {
            const priceHTML = ev.price === 0 
                ? '<span style="color: #2854C5; font-weight: 700;">Безкоштовно</span>' 
                : `<span style="color:#737373; font-weight:500; font-size:13px;">| Ціна:</span> <span style="color: #2854C5; font-weight: 700; margin-left: 5px;">${ev.price} ₴</span>`;

            const cardHTML = `
                <div class="event-card">
                  <img src="${ev.img}" alt="${ev.title}" class="event-img">
                  <h3 class="event-name">${ev.title}</h3>
                  
                  <div class="event-info-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <div class="event-detail" style="margin: 0;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2854C5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      ${ev.location}
                    </div>
                    <div class="event-rating-badge">
                      <svg viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/></svg>
                      <span>${ev.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div class="event-info-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div class="event-detail" style="margin: 0;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#737373" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      ${ev.dateStr}
                    </div>
                    <div>${priceHTML}</div>
                  </div>
                  
                  <a href="events.html?event=${ev.id}" class="event-link">Дізнатися більше</a>
                </div>
            `;
            eventsGrid.insertAdjacentHTML('beforeend', cardHTML);
        });
    }

    // 3. Відстежуємо клік по випадаючому списку "Ціна"
    if (sortPriceSelect) {
        sortPriceSelect.addEventListener('change', (e) => {
            const sortOrder = e.target.value; 
            let sortedEvents = [...eventsList];

            if (sortOrder === 'asc') sortedEvents.sort((a, b) => a.price - b.price);
            else if (sortOrder === 'desc') sortedEvents.sort((a, b) => b.price - a.price);

            if (sortRatingSelect) sortRatingSelect.value = 'default';
            if (sortDateSelect) sortDateSelect.value = 'default';
            renderEventCards(sortedEvents);
        });
    }

    // 4. Відстежуємо клік по випадаючому списку "Рейтинг"
    if (sortRatingSelect) {
        sortRatingSelect.addEventListener('change', (e) => {
            const sortOrder = e.target.value; 
            let sortedEvents = [...eventsList];

            if (sortOrder === 'asc') sortedEvents.sort((a, b) => a.rating - b.rating);
            else if (sortOrder === 'desc') sortedEvents.sort((a, b) => b.rating - a.rating);

            if (sortPriceSelect) sortPriceSelect.value = 'default';
            if (sortDateSelect) sortDateSelect.value = 'default';
            renderEventCards(sortedEvents);
        });
    }

    // 5. Відстежуємо клік по випадаючому списку "Дата"
    if (sortDateSelect) {
        sortDateSelect.addEventListener('change', (e) => {
            const sortOrder = e.target.value; 
            let sortedEvents = [...eventsList];

            if (sortOrder === 'asc') {
                // Найближчі події спочатку
                sortedEvents.sort((a, b) => a.timestamp - b.timestamp);
            } else if (sortOrder === 'desc') {
                // Пізніші події спочатку
                sortedEvents.sort((a, b) => b.timestamp - a.timestamp);
            }

            // Скидаємо інші селекти
            if (sortPriceSelect) sortPriceSelect.value = 'default';
            if (sortRatingSelect) sortRatingSelect.value = 'default';

            renderEventCards(sortedEvents);
        });
    }

    // Відмальовка
    renderEventCards(eventsList);
});