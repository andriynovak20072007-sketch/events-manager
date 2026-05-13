const restaurantsList = [
    {
        id: 'restaurant1',
        title: 'Ресторан "Baczewski"',
        location: 'Львів, вул. Шевська, 8',
        dateStr: 'Відкрито 08:00 - 23:00',
        lat: 49.8420, lng: 24.0300,
        city: 'lviv',
        category: 'restaurant',
        icon: 'utensils',
        color: 'marker-orange',
        x: 16.5, y: 35.0,
        ratingValue: 4.9,
        price: '800',
        currency: 'UAH',
        siteUrl: 'https://baczewski.rest/'
    },
    {
        id: 'restaurant2',
        title: 'Ресторан "Канапа"',
        location: 'Київ, Андріївський узвіз, 19',
        dateStr: 'Відкрито 10:00 - 22:00',
        lat: 50.4610, lng: 30.5180,
        city: 'kyiv',
        category: 'restaurant',
        icon: 'utensils',
        color: 'marker-orange',
        x: 47.0, y: 26.0,
        ratingValue: 4.7,
        price: '1200',
        currency: 'UAH',
        siteUrl: 'https://borysov.com.ua/uk/kanapa'
    },
    {
        id: 'restaurant3',
        title: 'Ресторан "Дача"',
        location: 'Одеса, Французький бульвар, 85',
        dateStr: 'Відкрито 09:00 - 23:00',
        lat: 46.4550, lng: 30.7600,
        city: 'odesa',
        category: 'restaurant',
        icon: 'utensils',
        color: 'marker-orange',
        x: 46.0, y: 80.0,
        ratingValue: 4.8,
        price: '1500',
        currency: 'UAH',
        siteUrl: 'https://dacha.com.ua/'
    },
    {
        id: 'restaurant4',
        title: 'Ресторан "Наша Дача"',
        location: 'Харків, вул. Батумська, 4А',
        dateStr: 'Відкрито 10:00 - 22:00',
        lat: 50.0200, lng: 36.2550,
        city: 'kharkiv',
        category: 'restaurant',
        icon: 'utensils',
        color: 'marker-orange',
        x: 72.0, y: 34.0,
        ratingValue: 4.6,
        price: '1000',
        currency: 'UAH',
        siteUrl: 'https://borysov.com.ua/uk/nasha-dacha'
    }
];

function renderSvgRestaurantMarkers(restaurantsToRender) {
    const markersLayer = document.getElementById('markers-layer');
    if (!markersLayer) return;

    restaurantsToRender.forEach(ev => {
        const marker = document.createElement('div');
        marker.className = `map-marker is-dot`;
        // Оранжевий колір для ресторанів
        marker.style.backgroundColor = '#E67E22';
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
    });
}

let leafletRestaurantMarkers = [];

function renderRestaurantMarkers(restaurantsToRender) {
    if (typeof leafletMap === 'undefined' || !leafletMap) return;

    // Очищуємо старі маркери
    leafletRestaurantMarkers.forEach(marker => marker.remove());
    leafletRestaurantMarkers = [];

    restaurantsToRender.forEach(ev => {
        const lat = parseFloat(ev.lat);
        const lng = parseFloat(ev.lng);

        if (!isNaN(lat) && !isNaN(lng)) {
            const iconHtml = `<div class="map-marker is-dot" style="background-color: #E67E22; position: absolute; top: 0; left: 0; border-color: #ffffff; width: 12px; height: 12px;"></div>`;

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

                document.querySelectorAll('.map-marker').forEach(m => {
                    m.classList.remove('is-pin');
                    m.classList.add('is-dot');
                });

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
                        icon: 'utensils'
                    }, e.target._icon, 40);
                }
            });

            leafletRestaurantMarkers.push(marker);
        }
    });
}

function renderRestaurantCards(cityFilter = 'all') {
    const grid = document.getElementById('restaurants-grid');
    if (!grid) return;
    
    // Фільтруємо список ресторанів за містом
    let filteredRestaurants = restaurantsList;
    if (cityFilter !== 'all') {
        filteredRestaurants = restaurantsList.filter(r => r.city === cityFilter);
    }

    // Якщо нічого не знайдено для міста
    if (filteredRestaurants.length === 0) {
        grid.innerHTML = '<div style="color: #94A3B8; text-align: center; width: 100%; padding: 40px;">Ресторанів у цьому місті поки не знайдено.</div>';
        return;
    }
    
    // Беремо перші 4 ресторани для відмальовки
    const topRestaurants = filteredRestaurants.slice(0, 4);
    // Дублюємо масив для безперервної анімації (якщо потрібно)
    const displayRestaurants = filteredRestaurants.length > 2 ? [...topRestaurants, ...topRestaurants] : topRestaurants;
    
    let html = '';
    displayRestaurants.forEach((rest, index) => {
        const ratingHtml = `
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star${index === 3 ? '-half-stroke' : ''}"></i>
        `;
        
        html += `
        <div class="restaurant-card">
          <div class="restaurant-image-wrapper">
             <img src="images/restaurant${(index % 4) + 1}.png" alt="${rest.title}">
             <div class="restaurant-price-badge">~${rest.price} ${rest.currency}</div>
          </div>
          <div class="restaurant-info">
            <h3>${rest.title}</h3>
            <div class="restaurant-rating">
              ${ratingHtml}
            </div>
            <div class="restaurant-location">
              <i class="fa-solid fa-location-dot"></i>
              <span>${rest.location}</span>
            </div>
            <a href="${rest.siteUrl}" target="_blank" class="restaurant-link">Забронювати столик</a>
          </div>
        </div>
        `;
    });
    
    grid.innerHTML = html;
}

// Запускаємо відмальовку карток при завантаженні
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderRestaurantCards());
} else {
    renderRestaurantCards();
}

// Глобальна функція для фільтрації ресторанів
window.filterRestaurantsByCity = function(cityName) {
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
    renderRestaurantCards(cityId);
    
    // 2. Оновлюємо маркери на SVG карті
    const svgMarkersLayer = document.getElementById('markers-layer');
    if (svgMarkersLayer) {
        const oldMarkers = svgMarkersLayer.querySelectorAll('.map-marker');
        oldMarkers.forEach(m => {
            // Оранжевий колір для ресторанів (#E67E22)
            if (m.style.backgroundColor === 'rgb(230, 126, 34)' || m.style.backgroundColor === '#E67E22') {
                m.remove();
            }
        });
        
        let restsToRender = restaurantsList;
        if (cityId !== 'all') {
            restsToRender = restaurantsList.filter(r => r.city === cityId);
        }
        renderSvgRestaurantMarkers(restsToRender);
    }
    
    // 3. Оновлюємо маркери на Leaflet карті
    if (typeof leafletMap !== 'undefined' && leafletMap) {
        let restsToRender = restaurantsList;
        if (cityId !== 'all') {
            restsToRender = restaurantsList.filter(r => r.city === cityId);
        }
        renderRestaurantMarkers(restsToRender);
    }
};

// Додаємо обробник для селекту в сайдбарі
document.addEventListener('DOMContentLoaded', () => {
    const citySelect = document.getElementById('city-select');
    if (citySelect) {
        citySelect.addEventListener('change', () => {
            const selectedCity = citySelect.value;
            window.filterRestaurantsByCity(selectedCity);
        });
    }
});

