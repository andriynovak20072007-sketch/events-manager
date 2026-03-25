document.addEventListener("DOMContentLoaded", () => {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    // --- 1. ДОДАЄМО СТИЛІ (Зберігаємо твої стилі + додаємо курсор для гортання) ---
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

        /* Стиль для можливості гортання карти */
        #map-zoom-wrapper { cursor: grab; }
        #map-zoom-wrapper:active { cursor: grabbing; }
    `;
    document.head.appendChild(style);

    // --- 2. СТВОРЮЄМО ЧОРНИЙ ТА БІЛИЙ ПОП-АПИ ---
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

    // --- 3. ГОЛОВНА ФУНКЦІЯ ІНІЦІАЛІЗАЦІЇ КАРТИ ---
    function initMap(svgElement) {
        mapContainer.innerHTML = '';
        mapContainer.style.overflow = 'hidden'; // Щоб карта не вилазила за межі при зумі

        const wrapperHTML = `
            <div id="map-zoom-wrapper" style="position: relative; width: 100%; height: 100%; transition: transform 0.3s ease; transform-origin: center center;">
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

        // --- ЛОГІКА ГОРТАННЯ (PANNING) ---
        let isDragging = false;
        let startX, startY, translateX = 0, translateY = 0;

        mapContainer.addEventListener('mousedown', (e) => {
            if (scale > 1) { // Дозволяємо гортати тільки якщо є зум
                isDragging = true;
                startX = e.clientX - translateX;
                startY = e.clientY - translateY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        function updateTransform() {
            zoomWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        }

        // --- 4. ДАНІ МАРКЕРІВ (ВИПРАВЛЕНІ КООРДИНАТИ ТА ПОСИЛАННЯ) ---
        const events = [
            { id: 'fest2', title: 'Фестиваль "Fest"', location: 'Київ, Стадіон "Прайм"', time: '30 травня, 19:00', color: 'marker-yellow', icon: 'music', x: 48, y: 26 },
            { id: 'fest3', title: 'Музичний "Summer"', location: 'Одеса, Пляж "Аркадія"', time: '15 червня, 20:00', color: 'marker-blue', icon: 'music', x: 49, y: 72 },
            { id: 'fest1', title: 'Фестиваль "Summer Fest"', location: 'Львів, Стадіон "Прайм"', time: '28 квітня, 18:00', color: 'marker-purple', icon: 'music', x: 18.5, y: 35 },
            { id: 'lecture1', title: 'ІТ Конференція "CodeX"', location: 'Львів, Арена Львів', time: '20 травня, 10:00', color: 'marker-purple', icon: 'education', x: 21, y: 38 }
        ];

        const markersList = [];

        events.forEach(ev => {
            const marker = document.createElement('div');
            marker.className = `map-marker is-dot ${ev.color}`;
            marker.style.left = `${ev.x}%`;
            marker.style.top = `${ev.y}%`;
            marker.style.pointerEvents = 'auto';

            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('bp-title').textContent = ev.title;
                document.getElementById('bp-location').textContent = ev.location;
                document.getElementById('bp-time').textContent = ev.time;
                document.getElementById('bp-icon-container').innerHTML = icons[ev.icon];
                
                // Перехід на різні сторінки подій за ID
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

        // --- 5. ЛОГІКА РЕГІОНІВ ТА ЧОРНОГО ТУЛТІПА ---
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

        // --- 6. ЛОГІКА ЗУМУ (Використовуємо updateTransform для сумісності з гортанням) ---
        let scale = 1;
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
                    if (scale === 1) { translateX = 0; translateY = 0; } // Скидаємо гортання при scale 1
                    updateTransform();
                    if (scale <= 1) markersList.forEach(m => { m.classList.remove('is-pin'); m.classList.add('is-dot'); });
                }
            });
        }

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.bp-tooltip')) {
                eventTooltip.classList.remove('show');
            }
        });
    }

    // --- ПЕРЕВІРКА ТА ЗАВАНТАЖЕННЯ ---
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