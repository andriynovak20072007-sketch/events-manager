let leafletMap = null;
let leafletEventMarkers = [];
let isLeafletMapReady = false;
let routeLine = null;
// Об'єднана база подій з координатами для обох типів карт
const eventsList = [
    {
        id: 'fest1',
        title: 'Фестиваль "Summer Fest"',
        location: 'Львів, Стадіон "Прайм"',
        dateStr: '28 квітня, 18:00',
        timestamp: new Date('2026-04-28T18:00:00').getTime(),
        price: 500,
        rating: 4.8,
        img: 'images/fest1..png',
        lat: 49.8397, lng: 24.0297, city: 'lviv', category: 'festival', eventDate: '2026-04-28',
        x: 14.2, y: 35.5, color: 'marker-purple', icon: 'music'
    },
    {
        id: 'fest2',
        title: 'Фестиваль "Fest"',
        location: 'Київ, Стадіон "Прайм"',
        dateStr: '30 травня, 19:00',
        timestamp: new Date('2026-05-30T19:00:00').getTime(),
        price: 1200,
        rating: 4.9,
        img: 'images/fest2.png',
        lat: 50.4501, lng: 30.5234, city: 'kyiv', category: 'festival', eventDate: '2026-05-30',
        x: 47.6, y: 25.2, color: 'marker-yellow', icon: 'music'
    },
    {
        id: 'fest3',
        title: 'Музичний "Summer"',
        location: 'Одеса, Пляж "Аркадія"',
        dateStr: '15 червня, 20:00',
        timestamp: new Date('2026-06-15T20:00:00').getTime(),
        price: 0,
        rating: 4.2,
        img: 'images/fest3.png',
        lat: 46.4825, lng: 30.7233, city: 'odesa', category: 'festival', eventDate: '2026-06-15',
        x: 46.5, y: 76.5, color: 'marker-blue', icon: 'music'
    },
    {
        id: 'lecture1',
        title: 'ІТ Конференція "CodeX"',
        location: 'Львів, Арена Львів',
        dateStr: '20 травня, 10:00',
        timestamp: new Date('2026-05-20T10:00:00').getTime(),
        price: 800,
        rating: 5.0,
        img: 'images/event-1.webp',
        lat: 49.8420, lng: 24.0250, city: 'lviv', category: 'education', eventDate: '2026-05-20',
        x: 15.5, y: 36.8, color: 'marker-purple', icon: 'education'
    },
    {
        id: 'lecture2',
        title: 'Майстер-клас "UX Story"',
        location: 'Одеса, IT Hub',
        dateStr: '11 червня, 16:00',
        timestamp: new Date('2026-06-11T16:00:00').getTime(),
        price: 400,
        rating: 4.7,
        img: 'images/event-2.jpg',
        lat: 46.4850, lng: 30.7250, city: 'odesa', category: 'education', eventDate: '2026-06-11',
        x: 48.0, y: 78.0, color: 'marker-blue', icon: 'education'
    },
    {
        id: 'lecture3',
        title: 'Лекція "Наука в ІТ"',
        location: 'Київ, UNIT.City',
        dateStr: '06 червня, 14:00',
        timestamp: new Date('2026-06-06T14:00:00').getTime(),
        price: 650,
        rating: 4.5,
        img: 'images/event-3.jpg',
        lat: 50.4550, lng: 30.5280, city: 'kyiv', category: 'education', eventDate: '2026-06-06',
        x: 49.0, y: 26.5, color: 'marker-yellow', icon: 'education'
    },
    {
        id: 'concert1',
        title: 'Концерт "Нічний Джем"',
        location: 'Київ, МВЦ',
        dateStr: '12 травня, 19:00',
        timestamp: new Date('2026-05-12T19:00:00').getTime(),
        price: 900,
        rating: 4.6,
        img: 'images/event-1.webp',
        lat: 50.4520, lng: 30.5300, city: 'kyiv', category: 'concert', eventDate: '2026-05-12',
        x: 46.0, y: 24.0, color: 'marker-yellow', icon: 'music'
    },
    {
        id: 'concert2',
        title: 'Рок-фестиваль "City Beat"',
        location: 'Харків, Парк Горького',
        dateStr: '18 травня, 20:00',
        timestamp: new Date('2026-05-18T20:00:00').getTime(),
        price: 1100,
        rating: 4.4,
        img: 'images/event-2.jpg',
        lat: 49.9935, lng: 36.2304, city: 'kharkiv', category: 'concert', eventDate: '2026-05-18',
        x: 72.5, y: 33.5, color: 'marker-blue', icon: 'music'
    },
    {
        id: 'concert3',
        title: 'Jazz Night "Odessa Vibes"',
        location: 'Одеса, Клуб "Море"',
        dateStr: '03 червня, 19:30',
        timestamp: new Date('2026-06-03T19:30:00').getTime(),
        price: 700,
        rating: 4.3,
        img: 'images/event-3.jpg',
        lat: 46.4800, lng: 30.7200, city: 'odesa', category: 'concert', eventDate: '2026-06-03',
        x: 45.0, y: 75.0, color: 'marker-blue', icon: 'music'
    },
    {
        id: 'sport1',
        title: 'Матч "Динамо" - "Шахтар"',
        location: 'Київ, НСК "Олімпійський"',
        dateStr: '08 травня, 17:00',
        timestamp: new Date('2026-05-08T17:00:00').getTime(),
        price: 1400,
        rating: 4.9,
        img: 'images/event-1.webp',
        lat: 50.4480, lng: 30.5210, city: 'kyiv', category: 'sport', eventDate: '2026-05-08',
        x: 48.5, y: 26.0, color: 'marker-yellow', icon: 'sport'
    },
    {
        id: 'sport2',
        title: 'Біг по парку "Lviv Run"',
        location: 'Львів, Стрийський парк',
        dateStr: '22 травня, 09:00',
        timestamp: new Date('2026-05-22T09:00:00').getTime(),
        price: 250,
        rating: 4.1,
        img: 'images/event-2.jpg',
        lat: 49.8350, lng: 24.0250, city: 'lviv', category: 'sport', eventDate: '2026-05-22',
        x: 13.8, y: 37.5, color: 'marker-purple', icon: 'sport'
    },
    {
        id: 'sport3',
        title: 'Велокрос у Харкові',
        location: 'Харків, Парк Шевченка',
        dateStr: '27 травня, 11:00',
        timestamp: new Date('2026-05-27T11:00:00').getTime(),
        price: 300,
        rating: 4.2,
        img: 'images/event-3.jpg',
        lat: 49.9950, lng: 36.2320, city: 'kharkiv', category: 'sport', eventDate: '2026-05-27',
        x: 72.5, y: 32.0, color: 'marker-blue', icon: 'sport'
    }
];


function openLeafletMarkerById(eventId) {
    if (!leafletMap || !leafletEventMarkers.length) return;

    const marker = leafletEventMarkers.find(m => m.eventId === eventId);
    if (!marker) return;

    leafletMap.setView(marker.getLatLng(), 10, { animate: true });
    marker.openPopup();
}

document.addEventListener("DOMContentLoaded", () => {
    const cityFilterMessage = document.getElementById('city-filter-message');
    const eventsListContainer = document.getElementById('events-list');
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
        
        /* Стилізація нативних Leaflet поп-апів під наш дизайн */
        .leaflet-popup-content-wrapper {
            background: white;
            border-radius: 20px;
            padding: 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
            margin: 16px 20px;
            width: 260px !important;
            font-family: 'Montserrat', sans-serif;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .leaflet-popup-tip {
            background: white;
        }
        .leaflet-container a.leaflet-popup-close-button {
            top: 10px;
            right: 10px;
            color: #737373;
        }
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
    // === ЗМІНЕНО: Оновлений HTML для тултіпа з кнопкою "+" ===
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
        <div class="popup-actions" style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
            <a href="#" id="bp-btn" class="bp-btn" style="flex: 1; margin: 0;">Детальніше</a>
            <button id="bp-add-route-btn" title="Додати до маршруту" style="width: 42px; height: 42px; border-radius: 50%; background-color: #f0eeff; color: #6209DD; border: none; display: flex; align-items: center; justify-content: center; font-size: 18px; cursor: pointer; flex-shrink: 0; transition: all 0.2s ease;">
                <i class="fa-solid fa-plus"></i>
            </button>
        </div>
    `;
    document.body.appendChild(eventTooltip);
    // Глобальний об'єкт іконок
    const icons = {
        music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>',
        education: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
        sport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M12 3v4M12 13v8M7 6l3 3M14 9l3-3M7 14l3-3M14 15l3 3"/></svg>'
    };

    // Глобальна функція для показу поп-апу (спільна для SVG та Leaflet)
    window.showEventTooltip = function(ev, anchorElement, yOffset = 20) {
        const tooltip = document.querySelector('.bp-tooltip');
        if (!tooltip) return;

        document.getElementById('bp-title').textContent = ev.title;
        document.getElementById('bp-location').textContent = ev.location;
        document.getElementById('bp-time').textContent = ev.dateStr;
        document.getElementById('bp-icon-container').innerHTML = icons[ev.icon] || '';
        document.getElementById('bp-btn').href = `events.html?event=${ev.id}`;

        const addRouteBtn = document.getElementById('bp-add-route-btn');
        if (addRouteBtn) {
            addRouteBtn.onclick = () => {
                if (window.addToRoute) {
                    window.addToRoute(ev.title, ev.location, ev.dateStr, ev.lat, ev.lng);
                }
            };
        }

        const rect = anchorElement.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - yOffset}px`;
        tooltip.classList.add('show');
    };

    var markersLayer;
    var markersList = [];

    function renderMarkers(eventsToRender) {
        if (!markersLayer || !markersList) return;
        markersLayer.innerHTML = '';
        markersList.length = 0;

        if (!eventsToRender || eventsToRender.length === 0) return;

        eventsToRender.forEach(ev => {
            const marker = document.createElement('div');
            marker.className = `map-marker is-dot ${ev.color}`;
            marker.style.left = `${ev.x}%`;
            marker.style.top = `${ev.y}%`;
            
            marker.style.pointerEvents = 'auto';
            marker.setAttribute('data-event-id', ev.id);

            marker.dataset.lat = ev.lat;
            marker.dataset.lng = ev.lng;
            marker.dataset.date = ev.eventDate;
            marker.dataset.city = ev.city;
            marker.dataset.category = ev.category;

            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                const offset = marker.classList.contains('is-pin') ? 10 : 20;
                window.showEventTooltip(ev, marker, offset);
            });

            markersLayer.appendChild(marker);
            markersList.push(marker);
        });
    }

    // ГОЛОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ КАРТИ 
    function initMap(svgElement) {
        mapContainer.innerHTML = '';
        mapContainer.style.overflow = 'hidden';

        const wrapperHTML = `
            <div id="map-zoom-wrapper" style="position: relative; width: 100%; height: 100%; transform-origin: center center; transition: transform 0.3s ease; display: flex; align-items: center; justify-content: center;">
                <div id="map-content-box" style="position: relative; width: 100%; height: 100%; aspect-ratio: 1390/926; max-width: 100%; max-height: 100%; display: flex; align-items: center; justify-content: center;">
                    <div id="svg-layer" style="width: 100%; height: 100%;"></div>
                    <div id="markers-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 10;"></div>
                </div>
            </div>
        `;
        mapContainer.innerHTML = wrapperHTML;

        const zoomWrapper = document.getElementById('map-zoom-wrapper');
        const svgLayer = document.getElementById('svg-layer');
        markersLayer = document.getElementById('markers-layer');

        // Налаштування SVG
        svgElement.style.width = '100%';
        svgElement.style.height = '100%';
        svgElement.style.display = 'block';
        svgLayer.appendChild(svgElement);

        let scale = 1;
        let translateX = 0;
        let translateY = 0;
        let isDragging = false;
        let startX, startY;

        // Зум
        mapContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = scale * delta;
            
            if (newScale >= 1 && newScale <= 8) {
                scale = newScale;
                updateTransform();
            }
        }, { passive: false });

        // Перетягування (Drag)
        mapContainer.addEventListener('mousedown', (e) => {
            if (e.target.closest('.map-marker')) return;
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            zoomWrapper.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                zoomWrapper.style.transition = 'transform 0.3s ease';
            }
        });

        window.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                zoomWrapper.style.transition = 'transform 0.3s ease';
            }
        });

        function updateTransform() {
            zoomWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }
        
    const events = eventsList;

        
        // Оновлення карти та списку після застосування фільтру (по місту)
        // показ повідомлення
        function showCityFilterMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }

        // очистка повідомлення
        function clearCityFilterMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }

        // список подій
        function renderEventsList(eventsToRender) {
            if (!eventsListContainer) return;

            eventsListContainer.innerHTML = '';

            if (!eventsToRender || eventsToRender.length === 0) {
                showCityFilterMessage('У вибраному місті подій не знайдено');
                return;
            }

            clearCityFilterMessage();

            eventsToRender.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-card';

                card.innerHTML = `
            <h3>${event.title || 'Без назви'}</h3>
            <p>${event.location || 'Локацію не вказано'}</p>
            <p>${event.time || 'Час не вказано'}</p>
            <a href="events.html?event=${event.id}">Детальніше</a>
        `;

                eventsListContainer.appendChild(card);
            });
        }


        // ГОЛОВНА функція твого таску
        function updateUIAfterCityFilter(filteredEvents) {
            try {
                if (!filteredEvents || filteredEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showCityFilterMessage('У вибраному місті подій не знайдено');
                    return;
                }

                clearCityFilterMessage();
                renderMarkers(filteredEvents);
                renderEventsList(filteredEvents);

            } catch (error) {
                console.error('City filter UI error:', error);
                showCityFilterMessage('Сталася помилка при оновленні', true);
            }
        }

        /*
        Оновлення карти та списку після застосування фільтру (за датою)
        Показує повідомлення користувачу, якщо після фільтрації за датою
        нічого не знайдено або сталася помилка
        */
        function showDateFilterMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }


        /*
        Очищає повідомлення перед новим оновленням карти і списку
        */
        function clearDateFilterMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }


        /*
        - оновлює карту
        - оновлює список
        - показує повідомлення, якщо результат порожній
        - показує повідомлення про помилку, якщо щось зламалось
        */
        function updateUIAfterDateFilter(filteredEvents) {
            try {
                if (!filteredEvents || filteredEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showDateFilterMessage('На вибрану дату подій не знайдено');
                    return;
                }

                clearDateFilterMessage();
                renderMarkers(filteredEvents);
                renderEventsList(filteredEvents);

            } catch (error) {
                console.error('Date filter UI error:', error);
                showDateFilterMessage('Сталася помилка під час оновлення по даті', true);
            }
        }

        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по категорії)
        =====================================================
        Опис:
        Показує повідомлення користувачу, якщо після фільтрації по категорії
        нічого не знайдено або сталася помилка
        */
        function showCategoryFilterMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по категорії)
        =====================================================
        Опис:
        Очищає повідомлення перед новим оновленням карти і списку
        */
        function clearCategoryFilterMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по категорії)
        =====================================================
        Опис:
        Це головна функція твого таску.
        Вона НЕ фільтрує сама по категорії.
        Вона приймає вже готовий відфільтрований масив подій
        і після цього:
        - оновлює карту
        - оновлює список
        - показує повідомлення, якщо результат порожній
        - показує повідомлення про помилку, якщо щось зламалось
        */
        function updateUIAfterCategoryFilter(filteredEvents) {
            try {
                if (!filteredEvents || filteredEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showCategoryFilterMessage('У вибраній категорії подій не знайдено');
                    return;
                }

                clearCategoryFilterMessage();
                renderMarkers(filteredEvents);
                renderEventsList(filteredEvents);

            } catch (error) {
                console.error('Category filter UI error:', error);
                showCategoryFilterMessage('Сталася помилка під час оновлення по категорії', true);
            }
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (за ціною)
        =====================================================
        Опис:
        Показує повідомлення користувачу, якщо після фільтрації за ціною
        нічого не знайдено або сталася помилка
        */
        function showPriceFilterMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (за ціною)
        =====================================================
        Опис:
        Очищає повідомлення перед новим оновленням карти і списку
        */
        function clearPriceFilterMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після затосування фільтру (за ціною)
        =====================================================с
        Опис:
        Це головна функція твого таску.
        Вона НЕ фільтрує сама за ціною.
        Вона приймає вже готовий відфільтрований масив подій
        і після цього:
        - оновлює карту
        - оновлює список
        - показує повідомлення, якщо результат порожній
        - показує повідомлення про помилку, якщо щось зламалось
        */
        function updateUIAfterPriceFilter(filteredEvents) {
            try {
                if (!filteredEvents || filteredEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showPriceFilterMessage('У вибраному ціновому діапазоні подій не знайдено');
                    return;
                }

                clearPriceFilterMessage();
                renderMarkers(filteredEvents);
                renderEventsList(filteredEvents);

            } catch (error) {
                console.error('Price filter UI error:', error);
                showPriceFilterMessage('Сталася помилка під час оновлення за ціною', true);
            }
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по рейтингу)
        =====================================================
        Опис:
        Показує повідомлення користувачу, якщо після фільтрації по рейтингу
        нічого не знайдено або сталася помилка
        */
        function showRatingFilterMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по рейтингу)
        =====================================================
        Опис:
        Очищає повідомлення перед новим оновленням карти і списку
        */
        function clearRatingFilterMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після застосування фільтру (по рейтингу)
        =====================================================
        Опис:
        Це головна функція твого таску.
        Вона НЕ фільтрує сама по рейтингу.
        Вона приймає вже готовий відфільтрований масив подій
        і після цього:
        - оновлює карту
        - оновлює список
        - показує повідомлення, якщо результат порожній
        - показує повідомлення про помилку, якщо щось зламалось
        */
        function updateUIAfterRatingFilter(filteredEvents) {
            try {
                if (!filteredEvents || filteredEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showRatingFilterMessage('Подій із вибраним рейтингом не знайдено');
                    return;
                }

                clearRatingFilterMessage();
                renderMarkers(filteredEvents);
                renderEventsList(filteredEvents);

            } catch (error) {
                console.error('Rating filter UI error:', error);
                showRatingFilterMessage('Сталася помилка під час оновлення по рейтингу', true);
            }
        }

        /*
        =====================================================
        ТАСК: Оновлення карти та списку після сортування (по даті)
        =====================================================
        Опис:
        Показує повідомлення користувачу, якщо після сортування
        дані відсутні або сталася помилка
        */
        function showDateSortMessage(text, isError = false) {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = text;
            cityFilterMessage.style.display = 'block';
            cityFilterMessage.style.color = isError ? 'red' : '#333';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після сортування (по даті)
        =====================================================
        Опис:
        Очищає повідомлення перед новим оновленням карти і списку
        */
        function clearDateSortMessage() {
            if (!cityFilterMessage) return;

            cityFilterMessage.textContent = '';
            cityFilterMessage.style.display = 'none';
        }


        /*
        =====================================================
        ТАСК: Оновлення карти та списку після сортування (по даті)
        =====================================================
        Опис:
        Це головна функція твого таску.
        Вона НЕ сортує сама по даті.
        Вона приймає вже готовий відсортований масив подій
        і після цього:
        - оновлює карту
        - оновлює список
        - показує повідомлення, якщо масив порожній
        - показує повідомлення про помилку, якщо щось зламалось
        */
        function updateUIAfterDateSorting(sortedEvents) {
            try {
                if (!sortedEvents || sortedEvents.length === 0) {
                    renderMarkers([]);
                    renderEventsList([]);
                    showDateSortMessage('Події для сортування відсутні');
                    return;
                }

                clearDateSortMessage();
                renderMarkers(sortedEvents);
                renderEventsList(sortedEvents);

            } catch (error) {
                console.error('Date sorting UI error:', error);
                showDateSortMessage('Сталася помилка під час оновлення після сортування', true);
            }
        }

        const markersLayer_init = document.getElementById('markers-layer');
        const markersList_init = [];
        markersLayer = markersLayer_init;
        markersList = markersList_init;
        renderMarkers(eventsList);


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
            // Закриваємо тільки якщо клік НЕ по тултіпу і НЕ по маркеру
            if (!e.target.closest('.bp-tooltip') && !e.target.closest('.map-marker') && !e.target.closest('.leaflet-marker-icon')) {
                eventTooltip.classList.remove('show');
            }
        });
    }

    // ПЕРЕВІРКА ТА ЗАВАНТАЖЕННЯ
    const existingSvg = mapContainer.querySelector('svg');
    if (existingSvg) {
        initMap(existingSvg);
        // Initial render of all markers
        renderMarkers(eventsList);

    } else {
        fetch('map.html')
            .then(res => res.text())
            .then(htmlText => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(htmlText, 'text/html');
                const svg = doc.querySelector('svg');
                if (svg) {
                    initMap(svg);
                    renderMarkers(eventsList);

                }
            })
            .catch(err => console.error("Помилка:", err));
    }
});
// Дані подій (переконайся, що ID збігаються з тими, що в map.js)
const eventsData = {
    'fest1': { title: 'Фестиваль "Summer Fest"', city: 'Львів, Стадіон "Прайм"' },
    'fest2': { title: 'Фестиваль "Fest"', city: 'Київ, Стадіон "Прайм"' },
    'fest3': { title: 'Музичний "Summer"', city: 'Одеса, Пляж "Аркадія"' },
    'lecture1': { title: 'ІТ Конференція "CodeX"', city: 'Львів, Арена Львів' },
    'lecture2': { title: 'Майстер-клас "UX Story"', city: 'Одеса, IT Hub' },
    'lecture3': { title: 'Лекція "Наука в ІТ"', city: 'Київ, UNIT.City' },
    'concert1': { title: 'Концерт "Нічний Джем"', city: 'Київ, МВЦ' },
    'concert2': { title: 'Рок-фестиваль "City Beat"', city: 'Харків, Парк Горького' },
    'concert3': { title: 'Jazz Night "Odessa Vibes"', city: 'Одеса, Клуб "Море"' },
    'sport1': { title: 'Матч "Динамо" - "Шахтар"', city: 'Київ, НСК "Олімпійський"' },
    'sport2': { title: 'Біг по парку "Lviv Run"', city: 'Львів, Стрийський парк' },
    'sport3': { title: 'Велокрос у Харкові', city: 'Харків, Парк Шевченка' }
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
                        // 2. Плавно скролимо до активної карти
                        const activeMap = document.getElementById('leaflet-map').classList.contains('active')
                            ? document.getElementById('leaflet-map')
                            : document.getElementById('map-container');

                        activeMap.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });

                        // 3. Імітуємо клік, щоб відкрився тултіп
                        setTimeout(() => {
                            if (document.getElementById('leaflet-map').classList.contains('active')) {
                                openLeafletMarkerById(id);
                            } else {
                                marker.click();
                            }
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
    const popularSection = document.querySelector('.popular-events');

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

        // Синхронізуємо з Leaflet-картою
        updateLeafletMarkers(selectedDate, selectedCity, selectedCategory);

        // Ховаємо тултіп, якщо він був відкритий
        const tooltip = document.querySelector('.bp-tooltip');
        if (tooltip) tooltip.classList.remove('show');

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
    
    // 2. Кнопка "Скинути"
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (dateInput) dateInput.value = '';
            if (citySelect) citySelect.value = '';
            window.currentFilters.category = '';
            
            categoryButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.style.opacity = '1';
            });
            
            filterMapMarkers();
            
            // Скидаємо сортування карток
            if (sortPriceSelect) sortPriceSelect.value = 'default';
            if (sortRatingSelect) sortRatingSelect.value = 'default';
            if (sortDateSelect) sortDateSelect.value = 'default';
            renderEventCards(eventsList);
        });
    }

    // 3. Фільтрація по категоріях
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const categoryClasses = Array.from(button.classList).filter(c => c !== 'category-pill' && c !== 'active');
            const selectedCategory = categoryClasses[0];

            if (window.currentFilters.category === selectedCategory) {
                window.currentFilters.category = '';
                button.classList.remove('active');
                categoryButtons.forEach(btn => btn.style.opacity = '1');
            } else {
                window.currentFilters.category = selectedCategory;
                categoryButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.style.opacity = '0.5';
                });
                button.classList.add('active');
                button.style.opacity = '1';
            }
            filterMapMarkers();
        });
    });



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

document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('toggle-map-type');
    const svgMap = document.getElementById('map-container');
    const leafletElem = document.getElementById('leaflet-map');

    if (!toggleBtn || !svgMap || !leafletElem) return;

toggleBtn.addEventListener('click', function () {
    const isSvgActive = svgMap.classList.contains('active');
    const btnText = toggleBtn.querySelector('span');

    if (isSvgActive) {
        svgMap.classList.remove('active');
        leafletElem.classList.add('active');
        btnText.innerText = "SVG Карта";

        setTimeout(() => {
            if (!isLeafletMapReady) {
                leafletMap = L.map('leaflet-map').setView([48.3794, 31.1656], 6);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(leafletMap);
                isLeafletMapReady = true;

               // Закриваємо поп-ап тільки при зумі або перетягуванні мишкою вручну
                leafletMap.on('dragstart zoomstart', () => {
                    const tooltip = document.querySelector('.bp-tooltip');
                    if (tooltip) tooltip.classList.remove('show');
                });
            }

    leafletMap.invalidateSize();
    renderLeafletMarkers(eventsList); 
    
    updateRouteLine(); // <--- ДОДАЙ ТУТ, щоб лінія з'явилася при переході на карту
}, 300);
           
    } else {
        leafletElem.classList.remove('active');
        svgMap.classList.add('active');
        btnText.innerText = "Реальна карта";
    }

    
});
});
function renderLeafletMarkers(eventsToRender) {
    if (!leafletMap) return;

    // Очищуємо старі маркери
    leafletEventMarkers.forEach(marker => marker.remove());
    leafletEventMarkers = [];

    eventsToRender.forEach(ev => {
        const lat = parseFloat(ev.lat);
        const lng = parseFloat(ev.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            // Створюємо іконку-крапку
            const iconHtml = `<div class="map-marker is-dot ${ev.color}" style="width:14px; height:14px; position:static; transform:none;"></div>`;
            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'leaflet-custom-marker',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
            
            // Клік на маркер на реальній карті
            // Клік на маркер на реальній карті
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (e.originalEvent) e.originalEvent.stopPropagation();
                window.showEventTooltip(ev, e.target._icon, 40);
                // leafletMap.panTo([lat, lng]); // <- ВИДАЛИЛИ, щоб карта не тікала
            });

            leafletEventMarkers.push(marker);
        }
    });
}
function updateLeafletMarkers(selectedDate = '', selectedCity = '', selectedCategory = '') {
    if (!leafletMap || !leafletEventMarkers.length) return;
    leafletEventMarkers.forEach(marker => {
        const matchDate = selectedDate ? marker.eventDate === selectedDate : true;
        const matchCity = selectedCity ? marker.cityId === selectedCity : true;
        const matchCategory = selectedCategory ? marker.category === selectedCategory : true;

        if (matchDate && matchCity && matchCategory) {
            if (!leafletMap.hasLayer(marker)) marker.addTo(leafletMap);
        } else {
            if (leafletMap.hasLayer(marker)) marker.remove();
        }
    });
}

window.updateRouteLine = function() {
    if (!leafletMap) return;

    // 1. Видаляємо попередню лінію з карти, якщо вона існує
    if (routeLine) {
        leafletMap.removeLayer(routeLine);
        routeLine = null;
    }

    // 2. Якщо в маршруті менше 2 точок, лінію малювати немає сенсу
    if (window.routeEvents.length < 2) return;

    // 3. Збираємо координати точок у форматі [[lat, lng], [lat, lng]...]
    const coordinates = window.routeEvents
        .filter(ev => ev.lat && ev.lng)
        .map(ev => [parseFloat(ev.lat), parseFloat(ev.lng)]);

    if (coordinates.length < 2) return;

    // 4. Створюємо нову лінію
    routeLine = L.polyline(coordinates, {
        color: '#6209DD',      // Твій фіолетовий колір
        weight: 4,             // Товщина лінії
        opacity: 0.6,          // Прозорість
        dashArray: '10, 10',   // Робимо її пунктирною (можна прибрати для суцільної)
        lineJoin: 'round'      // Заокруглені кути на поворотах
    }).addTo(leafletMap);

    // 5. Опціонально: підганяємо масштаб карти, щоб весь маршрут було видно
    // leafletMap.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

window.routeEvents = window.routeEvents || [];

// ОНОВЛЕНА ФУНКЦІЯ ДОДАВАННЯ ДО МАРШРУТУ
window.addToRoute = function (title, location, time, lat, lng) {
    const routeWidget = document.getElementById('route-planner-widget');

    // Перевіряємо, чи подія вже є в списку
    const exists = window.routeEvents.find(ev => ev.title === title);
    if (exists) {
        alert('Цю подію вже додано до маршруту!');
        return;
    }

    // ВАЖЛИВО: Перетворюємо lat і lng на числа перед збереженням
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    console.log(`Додаємо подію: ${title}, Координати:`, parsedLat, parsedLng);

    window.routeEvents.push({ 
        title: title, 
        location: location, 
        time: time, 
        lat: parsedLat, 
        lng: parsedLng 
    });

    // Показуємо віджет
    if (routeWidget) routeWidget.classList.remove('hidden');

    // Оновлюємо HTML списку
    if (typeof renderRouteItems === 'function') {
        renderRouteItems();
    }

    // Оновлюємо час у дорозі
    if (typeof updateRouteTimes === 'function') {
        updateRouteTimes();
    }

    // Ховаємо тултіп на карті
    const tooltip = document.querySelector('.bp-tooltip');
    if (tooltip) tooltip.classList.remove('show');

    // МАЛЮЄМО ЛІНІЮ!
    if (typeof window.updateRouteLine === 'function') {
        window.updateRouteLine();
    } else {
        console.error("Функція updateRouteLine не знайдена!");
    }
};

// ОНОВЛЕНА ФУНКЦІЯ ВИДАЛЕННЯ З МАРШРУТУ
window.removeFromRoute = function (index) {
    window.routeEvents.splice(index, 1); 
    
    if (typeof renderRouteItems === 'function') {
        renderRouteItems();
    }

    if (window.routeEvents.length === 0) {
        const widget = document.getElementById('route-planner-widget');
        if (widget) widget.classList.add('hidden');
    }

    if (typeof window.updateRouteLine === 'function') {
        window.updateRouteLine();
    }
};

// ОНОВЛЕНА ФУНКЦІЯ МАЛЮВАННЯ ЛІНІЇ
window.updateRouteLine = function() {
    console.log("Викликано updateRouteLine. Кількість точок:", window.routeEvents ? window.routeEvents.length : 0);
    
    // Якщо карта ще не завантажена, не робимо нічого
    if (!leafletMap) {
        console.log("Карта leafletMap ще не ініціалізована. Лінія не буде намальована.");
        return;
    }

    // Видаляємо стару лінію
    if (routeLine) {
        leafletMap.removeLayer(routeLine);
        routeLine = null;
    }

    // Якщо точок менше 2, малювати немає сенсу
    if (!window.routeEvents || window.routeEvents.length < 2) return;

    // Збираємо координати
    const coordinates = window.routeEvents
        .filter(ev => !isNaN(ev.lat) && !isNaN(ev.lng))
        .map(ev => [ev.lat, ev.lng]);

    console.log("Координати для лінії:", coordinates);

    if (coordinates.length < 2) {
        console.log("Недостатньо валідних координат для малювання лінії.");
        return;
    }

    // Малюємо нову лінію
    routeLine = L.polyline(coordinates, {
        color: '#6209DD',      // Колір лінії
        weight: 4,             // Товщина
        opacity: 0.8,          // Прозорість
        dashArray: '10, 10',   // Пунктир
        lineJoin: 'round'
    }).addTo(leafletMap);

    console.log("Лінія успішно намальована!");
    
    // Опціонально: автоматично підігнати масштаб, щоб було видно весь маршрут
    // leafletMap.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
};

/**
 * Функція для малювання списку подій у віджеті маршруту.
 */
function renderRouteItems() {
    const routeItemsContainer = document.getElementById('route-items-list');
    const distanceInfo = document.getElementById('route-distance-info');
    if (!routeItemsContainer) return;

    routeItemsContainer.innerHTML = ''; // Очищаємо перед новим малюванням

    // Малюємо всі картки з масиву
    window.routeEvents.forEach((ev, index) => {
        const newItem = document.createElement('div');
        newItem.className = 'route-item-card';
        newItem.style.animation = "fadeIn 0.3s ease";

        newItem.innerHTML = `
            <div class="route-info">
                <h4>${ev.title}</h4>
                <p>${ev.location}</p>
                <p>${ev.time}</p>
            </div>
            <button class="remove-route-btn" onclick="removeFromRoute(${index})">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        routeItemsContainer.appendChild(newItem);
    });

    // Якщо подій 2 або більше — показуємо блок з часом у дорозі
    if (distanceInfo) {
        if (window.routeEvents.length >= 2) {
            distanceInfo.classList.remove('hidden');
            const startName = document.getElementById('route-start-name');
            const endName = document.getElementById('route-end-name');
            if (startName) startName.textContent = window.routeEvents[0].title;
            if (endName) endName.textContent = window.routeEvents[window.routeEvents.length - 1].title;
            updateRouteTimes();
        } else {
            distanceInfo.classList.add('hidden');
        }
    }
}

/**
 * Оновлює блоки часу в маршруті (авто та пішки).
 */
function updateRouteTimes() {
    const distanceInfo = document.getElementById('route-distance-info');
    if (!distanceInfo) return;
    if (window.routeEvents.length < 2) {
        distanceInfo.classList.add('hidden');
        return;
    }
    const start = window.routeEvents[0];
    const end = window.routeEvents[window.routeEvents.length - 1];

    // Час авто від користувача до першої події (якщо відомо місцезнаходження)
    let carMinutes = '--';
    if (window.userLocation && start.lat && start.lng) {
        const d = getDistanceKm(
            window.userLocation.latitude,
            window.userLocation.longitude,
            start.lat,
            start.lng
        );
        carMinutes = minutesFromDistance(d, 50); // 50 км/год
    }

    // Час пішки між першою та останньою подією
    let walkMinutes = '--';
    if (start.lat && start.lng && end.lat && end.lng) {
        const walkDist = getDistanceKm(start.lat, start.lng, end.lat, end.lng);
        walkMinutes = minutesFromDistance(walkDist, 5); // 5 км/год
    }

    const carEl = document.getElementById('car-time');
    const walkEl = document.getElementById('walk-time');
    if (carEl) carEl.textContent = `${carMinutes} хв.`;
    if (walkEl) walkEl.textContent = `${walkMinutes} хв.`;
    distanceInfo.classList.remove('hidden');
}

/**
 * Обчислює відстань між двома координатами (км) за формулою Haversine.
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // радіус Землі в км
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Повертає приблизний час у хвилинах для заданої швидкості (км/год).
 */
function minutesFromDistance(distanceKm, speedKmh) {
    return Math.round((distanceKm / speedKmh) * 60);
}

// Ініціалізація обробників подій для віджета
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка "Побудувати маршрут"
    const buildRouteBtn = document.querySelector('.build-route-btn');
    if (buildRouteBtn) {
        buildRouteBtn.addEventListener('click', () => {
             const svgMap = document.getElementById('map-container');
             const toggleBtn = document.getElementById('toggle-map-type');
             
             // Якщо зараз SVG карта, перемикаємо на реальну
             if (svgMap && svgMap.classList.contains('active')) {
                 if (toggleBtn) toggleBtn.click();
             }
             
             // Малюємо лінію
             window.updateRouteLine();
             
             // Прокручуємо до карти (якщо ми на великій сторінці)
             const leafletElem = document.getElementById('leaflet-map');
             if (leafletElem) {
                 leafletElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
        });
    }

    // Обробник для закриття віджета
    const closeWidgetBtn = document.getElementById('close-widget-btn');
    if (closeWidgetBtn) {
        closeWidgetBtn.addEventListener('click', () => {
            const widget = document.getElementById('route-planner-widget');
            if (widget) widget.classList.add('hidden');
        });
    }
    
    // Спроба отримати геолокацію користувача
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                window.userLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                if (window.routeEvents.length >= 2) updateRouteTimes();
            },
            (error) => { console.warn('Геолокацію не отримано:', error); }
        );
    }
});

// Робимо функції глобальними для виклику з onclick
window.renderRouteItems = renderRouteItems;
window.updateRouteTimes = updateRouteTimes;