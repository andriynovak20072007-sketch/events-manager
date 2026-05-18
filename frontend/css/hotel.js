const hotelsList = [
    {
        id: 'hotel1',
        title: 'Готель "Premier Palace"',
        location: 'Київ, бульвар Тараса Шевченка, 5-7',
        dateStr: 'Відкрито 24/7',
        lat: 50.4650, lng: 30.5050,
        city: 'kyiv',
        category: 'hotel',
        icon: 'hotel',
        color: 'marker-yellow',
        x: 46.5, y: 25.5,
        ratingValue: 4.8,
        price: '3500',
        currency: 'UAH',
        siteUrl: 'https://premier-palace.phnr.com/'
    },
    {
        id: 'hotel2',
        title: 'Готель "Львів"',
        location: 'Львів, проспект В’ячеслава Чорновола, 7',
        dateStr: 'Відкрито 24/7',
        lat: 49.8550, lng: 24.0150,
        city: 'lviv',
        category: 'hotel',
        icon: 'hotel',
        color: 'marker-purple',
        x: 15.5, y: 34.0,
        ratingValue: 4.2,
        price: '1800',
        currency: 'UAH',
        siteUrl: 'http://hotel-lviv.com.ua/'
    },
    {
        id: 'hotel3',
        title: 'Nemo Hotel Resort & SPA',
        location: 'Одеса, Пляж Ланжерон, 25',
        dateStr: 'Відкрито 24/7',
        lat: 46.4780, lng: 30.7650,
        city: 'odesa',
        category: 'hotel',
        icon: 'hotel',
        color: 'marker-blue',
        x: 45.5, y: 79.5,
        ratingValue: 4.8,
        price: '6500',
        currency: 'UAH',
        siteUrl: 'https://nemohotels.com/'
    },
    {
        id: 'hotel4',
        title: 'Kharkiv Palace Hotel',
        location: 'Харків, проспект Незалежності, 2',
        dateStr: 'Відкрито 24/7',
        lat: 49.9800, lng: 36.2500,
        city: 'kharkiv',
        category: 'hotel',
        icon: 'hotel',
        color: 'marker-blue',
        x: 71.5, y: 33.5,
        ratingValue: 4.7,
        price: '2900',
        currency: 'UAH',
        siteUrl: 'https://kharkiv-palace.com/'
    }
];

function renderSvgHotelMarkers(hotelsToRender) {
    const markersLayer = document.getElementById('markers-layer');
    if (!markersLayer) return;

    hotelsToRender.forEach(ev => {
        const marker = document.createElement('div');
        // Додаємо специфічний зелений бекграунд для svg маркера також
        marker.className = `map-marker is-dot`;
        marker.style.backgroundColor = '#2ECC71';
        marker.style.borderColor = '#ffffff';
        marker.style.borderWidth = '2px';
        marker.style.left = `${ev.x}%`;
        marker.style.top = `${ev.y}%`;

        marker.style.pointerEvents = 'auto';
        marker.setAttribute('data-event-id', ev.id);

        marker.dataset.lat = ev.lat;
        marker.dataset.lng = ev.lng;
        marker.dataset.date = ev.dateStr;
        marker.dataset.city = ev.city;
        marker.dataset.category = ev.category;

        marker.addEventListener('click', (e) => {
            e.stopPropagation();
            const offset = marker.classList.contains('is-pin') ? 10 : 20;
            if (window.showEventTooltip) {
                window.showEventTooltip(ev, marker, offset);
            }
        });

        markersLayer.appendChild(marker);

        // Якщо потрібно, щоб готелі теж зменшувались/збільшувались разом із мапою (zoom/pan),
        // їх треба додавати у глобальний масив markersList з map.js.
        // Це робиться в самому map.js, коли викликається ця функція.
    });
}

let leafletHotelMarkers = [];

function renderHotelMarkers(hotelsToRender) {
    if (!leafletMap) return;

    // Очищуємо старі маркери готелів
    leafletHotelMarkers.forEach(marker => marker.remove());
    leafletHotelMarkers = [];

    hotelsToRender.forEach(ev => {
        const lat = parseFloat(ev.lat);
        const lng = parseFloat(ev.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            // Зелений колір і трохи інший стиль для готелю
            const iconHtml = `<div class="map-marker is-dot" style="background-color: #2ECC71; position: absolute; top: 0; left: 0; border-color: #ffffff; width: 12px; height: 12px;"></div>`;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: '',
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            });

            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);

            marker.eventId = ev.id;
            marker.eventDate = ev.dateStr;
            marker.cityId = ev.city;
            marker.category = ev.category;
            marker.eventData = ev;

            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e);
                if (e.originalEvent) e.originalEvent.stopPropagation();

                // Скидаємо всі інші маркери до стану "крапка"
                document.querySelectorAll('.map-marker').forEach(m => {
                    m.classList.remove('is-pin');
                    m.classList.add('is-dot');
                });

                // Робимо поточний маркер "піном"
                const iconElement = e.target._icon.querySelector('.map-marker');
                if (iconElement) {
                    iconElement.classList.remove('is-dot');
                    iconElement.classList.add('is-pin');
                }

                if (window.showEventTooltip) {
                    window.showEventTooltip({
                        id: ev.id,
                        title: ev.title,
                        location: ev.location,
                        dateStr: ev.dateStr,
                        category: ev.category,
                        lat: ev.lat,
                        lng: ev.lng,
                        icon: 'hotel'
                    }, e.target._icon, 40);
                }
            });

            leafletHotelMarkers.push(marker);
        }
    });
}

function renderHotelCards(cityFilter = 'all') {
    const grid = document.getElementById('hotels-grid');
    if (!grid) return;
    
    // Фільтруємо список готелів за містом
    let filteredHotels = hotelsList;
    if (cityFilter !== 'all') {
        filteredHotels = hotelsList.filter(h => h.city === cityFilter);
    }

    // Якщо нічого не знайдено для міста
    if (filteredHotels.length === 0) {
        grid.innerHTML = '<div style="color: #94A3B8; text-align: center; width: 100%; padding: 40px;">Готелів у цьому місті поки не знайдено.</div>';
        return;
    }
    
    // Беремо перші 4 готелі для відмальовки
    const topHotels = filteredHotels.slice(0, 4);
    // Дублюємо масив для безперервної анімації "бігучої стрічки"
    const displayHotels = filteredHotels.length > 2 ? [...topHotels, ...topHotels] : topHotels;
    
    let html = '';
    displayHotels.forEach((hotel, index) => {
        // Проста логіка для красивого рейтингу на демо
        const ratingHtml = `
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star${index === 2 ? '-half-stroke' : ''}"></i>
        `;
        
        html += `
        <div class="hotel-card">
          <div class="hotel-price-badge">~${hotel.price} ${hotel.currency}</div>
          <div class="hotel-image-wrapper">
            <img src="images/${hotel.id}.png" alt="${hotel.title}">
          </div>
          <div class="hotel-info">
            <h3>${hotel.title}</h3>
            <div class="hotel-rating">
              ${ratingHtml}
            </div>
            <div class="hotel-location">
              <i class="fa-solid fa-location-dot"></i>
              <span>${hotel.location}</span>
            </div>
            <a href="hotel.html?id=${hotel.id}" class="hotel-link">Бронювати номер</a>
          </div>
        </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Запускаємо відмальовку карток при завантаженні
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderHotelCards());
} else {
    renderHotelCards();
}

// Глобальна функція для фільтрації готелів
window.filterHotelsByCity = function(cityName) {
    const cityMapping = {
        'Львів': 'lviv',
        'Львівська область': 'lviv',
        'Київ': 'kyiv',
        'Київська область': 'kyiv',
        'Одеса': 'odesa',
        'Одеська область': 'odesa',
        'Харків': 'kharkiv',
        'Харківська область': 'kharkiv',
        'Усі міста': 'all',
        'lviv': 'lviv',
        'kyiv': 'kyiv',
        'odesa': 'odesa',
        'kharkiv': 'kharkiv',
        'all': 'all'
    };
    
    const cityId = cityMapping[cityName] || 'all';
    
    // 1. Оновлюємо картки
    renderHotelCards(cityId);
    
    // 2. Оновлюємо маркери на SVG карті
    const svgMarkersLayer = document.getElementById('markers-layer');
    if (svgMarkersLayer) {
        // Видаляємо старі маркери готелів з SVG (вони мають колір #2ECC71)
        const oldMarkers = svgMarkersLayer.querySelectorAll('.map-marker');
        oldMarkers.forEach(m => {
            if (m.style.backgroundColor === 'rgb(46, 204, 113)' || m.style.backgroundColor === '#2ECC71') {
                m.remove();
            }
        });
        
        let hotelsToRender = hotelsList;
        if (cityId !== 'all') {
            hotelsToRender = hotelsList.filter(h => h.city === cityId);
        }
        renderSvgHotelMarkers(hotelsToRender);
    }
    
    // 3. Оновлюємо маркери на Leaflet карті
    if (typeof leafletMap !== 'undefined' && leafletMap) {
        let hotelsToRender = hotelsList;
        if (cityId !== 'all') {
            hotelsToRender = hotelsList.filter(h => h.city === cityId);
        }
        renderHotelMarkers(hotelsToRender);
    }
};

// Додаємо обробник для селекту в сайдбарі
document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    if (citySelect) {
        citySelect.addEventListener('change', () => {
            const selectedCity = citySelect.value;
            window.filterHotelsByCity(selectedCity);
        });
    }
});

