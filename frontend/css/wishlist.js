// Event Data - Simulated Database
const allEventsDB = [
  { id: 'fest1', title: 'Фестиваль "Summer Fest"', location: 'Львів, Стадіон "Прайм"', date: '2026-04-28', time: '18:00', description: 'Найяскравіша подія сезону! Виступи кращих артистів, фуд-корти та незабутня атмосфера під відкритим небом.', imageUrl: 'images/fest1..png' },
  { id: 'fest2', title: 'Фестиваль "Fest"', location: 'Київ, Стадіон "Прайм"', date: '2026-05-30', time: '19:00', description: 'Грандіозний фестиваль сучасного мистецтва та музики в самому серці столиці.', imageUrl: 'images/fest2.png' },
  { id: 'lecture1', title: 'ІТ Конференція "CodeX"', location: 'Львів, Арена Львів', date: '2026-05-20', time: '10:00', description: 'Найбільша технологічна конференція року. Досвідчені спікери, нетворкінг та новітні розробки.', imageUrl: 'images/event-1.webp' },
  { id: 'lecture2', title: 'Майстер-клас "UX Story"', location: 'Одеса, IT Hub', date: '2026-06-11', time: '16:00', description: 'Пориньте у світ дизайну. Практичні поради від провідних UX-спеціалістів.', imageUrl: 'images/event-2.jpg' },
  { id: 'concert1', title: 'Концерт "Нічний Джем"', location: 'Київ, МВЦ', date: '2026-05-12', time: '19:00', description: 'Вечір драйвової музики та неймовірного шоу. Живий звук та спецефекти.', imageUrl: 'images/event-1.webp' },
  { id: 'sport1', title: 'Матч "Динамо" - "Шахтар"', location: 'Київ, НСК "Олімпійський"', date: '2026-05-08', time: '17:00', description: 'Головне футбольне протистояння року. Напружена гра та шалені емоції на трибунах.', imageUrl: 'images/event-1.webp' }
];

// State
let selectedEvents = [
  allEventsDB[0], // Summer Fest
  allEventsDB[2], // CodeX
  allEventsDB[5]  // Dynamo-Shakhtar
];

let currentFilter = 'all';
let searchQuery = '';

// Icons
const icons = {
    location: '<i class="fa-solid fa-location-dot"></i>',
    calendar: '<i class="fa-solid fa-calendar-days"></i>',
    heart: '<i class="fa-solid fa-heart"></i>',
    trash: '<i class="fa-solid fa-heart-crack"></i>',
    view: '<i class="fa-solid fa-eye"></i>',
    plus: '<i class="fa-solid fa-plus"></i>'
};

// --- CORE RENDERING ---

function createEventCard(event, isWishlist = true) {
    const dateObj = new Date(event.date);
    const formattedDate = dateObj.toLocaleDateString("uk-UA", { day: 'numeric', month: 'long' });
    
    return `
        <div class="event-card" id="card-${event.id}">
            <div class="card-image" style="background-image: url('${event.imageUrl}')">
                ${isWishlist ? `
                    <div class="favorite-badge" onclick="toggleFavorite('${event.id}')" title="Видалити з обраного">
                        ${icons.trash}
                    </div>
                ` : `
                     <div class="favorite-badge" style="color: #64748B;" onclick="addToWishlist('${event.id}')" title="Додати до обраного">
                        <i class="fa-regular fa-heart"></i>
                    </div>
                `}
            </div>
            <div class="card-content">
                <h3>${event.title}</h3>
                <div class="event-info-list">
                    <div class="info-item">
                        ${icons.location}
                        <span>${event.location}</span>
                    </div>
                    <div class="info-item">
                        ${icons.calendar}
                        <span>${formattedDate}, ${event.time || '18:00'}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-view" onclick="showDetails('${event.id}')">
                        ${icons.view} Переглянути
                    </button>
                    <button class="btn-action" onclick="addToCalendar('${event.id}')">
                        ${icons.plus} Календар
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getFilteredEvents() {
    let filtered = [...selectedEvents];
    
    if (searchQuery) {
        filtered = filtered.filter(e => 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.location.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    if (currentFilter !== 'all') {
        const now = new Date();
        filtered = filtered.filter(e => {
            const eventDate = new Date(e.date);
            return currentFilter === 'upcoming' ? eventDate >= now : eventDate < now;
        });
    }
    
    return filtered;
}

function renderEvents() {
    const selectedEventsContainer = document.getElementById('selectedEvents');
    const popularEventsContainer = document.getElementById('popularEvents');
    const favoriteCountElement = document.getElementById('favoriteCount');

    if (!selectedEventsContainer || !popularEventsContainer) return;

    // Update Counter
    if (favoriteCountElement) {
        animateValue(favoriteCountElement, parseInt(favoriteCountElement.innerText) || 0, selectedEvents.length, 500);
    }

    const filtered = getFilteredEvents();

    // Render Wishlist
    if (filtered.length === 0) {
        selectedEventsContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 80px 20px; background: white; border-radius: 40px; border: 2px dashed #E2E8F0;">
                <i class="fa-regular fa-heart" style="font-size: 50px; color: #E2E8F0; margin-bottom: 20px;"></i>
                <p style="color: var(--text-muted); font-size: 18px; font-weight: 600;">
                    ${searchQuery ? 'Подій не знайдено за вашим запитом' : 'Ваш список обраного порожній'}
                </p>
                ${!searchQuery ? `<button class="view-all-btn" style="margin: 20px auto;" onclick="window.location.href='events.html'">Знайти події</button>` : ''}
            </div>
        `;
    } else {
        selectedEventsContainer.innerHTML = filtered
            .map(event => createEventCard(event, true))
            .join('');
    }

    // Render Popular (Recommendations)
    if (popularEventsContainer.children.length === 0) {
        const popularEvents = allEventsDB.slice(1, 5); 
        popularEventsContainer.innerHTML = popularEvents
            .map(event => createEventCard(event, false))
            .join('');
    }
}

// --- UTILITIES ---

function animateValue(obj, start, end, duration) {
    if (start === end) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

function toggleFavorite(eventId) {
    const card = document.getElementById(`card-${eventId}`);
    if (card) {
        card.style.transform = 'scale(0.8) rotate(-5deg)';
        card.style.opacity = '0';
        setTimeout(() => {
            selectedEvents = selectedEvents.filter(event => event.id !== eventId);
            renderEvents();
            showToast('Видалено з обраного');
        }, 400);
    }
}

function addToWishlist(eventId) {
    const eventToAdd = allEventsDB.find(e => e.id === eventId);
    if (eventToAdd && !selectedEvents.find(e => e.id === eventId)) {
        selectedEvents.push(eventToAdd);
        renderEvents();
        showToast('Додано до обраного!');
    } else {
        showToast('Ця подія вже в обраному');
    }
}

function showToast(message) {
    const existing = document.querySelector('.custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'custom-toast';
    toast.style.cssText = `
        position: fixed; bottom: 30px; right: 30px; background: #0F172A; color: white;
        padding: 16px 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 2000; font-weight: 700; display: flex; align-items: center; gap: 12px;
        animation: toastIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    `;
    toast.innerHTML = `<i class="fa-solid fa-check" style="color: #00AAFF;"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.5s forwards';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function showDetails(eventId) {
    window.location.href = `events.html?event=${eventId}`;
}

function addToCalendar(eventId) {
    showToast('Подію додано до календаря!');
}

// --- INTERFACE LOGIC ---

function updateFilterIndicator(btn) {
    const indicator = document.querySelector('.filter-indicator');
    if (indicator && btn) {
        indicator.style.width = `${btn.offsetWidth}px`;
        indicator.style.left = `${btn.offsetLeft}px`;
    }
}

function initSidePanel() {
    const profileBtn = document.getElementById('profileBtn');
    const userPanel = document.getElementById('userPanel');
    const overlay = document.getElementById('userPanelOverlay');
    const closeBtn = document.getElementById('closePanelBtn');

    if (profileBtn && userPanel && overlay) {
        profileBtn.addEventListener('click', () => {
            userPanel.classList.add('open');
            overlay.classList.add('active');
        });

        const closePanel = () => {
            userPanel.classList.remove('open');
            overlay.classList.remove('active');
        };

        if (closeBtn) closeBtn.addEventListener('click', closePanel);
        overlay.addEventListener('click', closePanel);
    }
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    renderEvents();
    initSidePanel();
    
    // Search listener
    const searchInput = document.getElementById('wishlistSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderEvents();
        });
    }
    
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        if (btn.classList.contains('active')) {
            updateFilterIndicator(btn);
        }
        
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateFilterIndicator(btn);
            currentFilter = btn.getAttribute('data-filter');
            renderEvents();
        });
    });

    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        updateFilterIndicator(activeBtn);
    });

    // Add shine effect to cards
    const observer = new MutationObserver(() => {
        document.querySelectorAll('.event-card').forEach(card => {
            if(!card.querySelector('.shine')) {
                const shine = document.createElement('div');
                shine.className = 'shine';
                card.appendChild(shine);
            }
        });
    });
    
    const grid = document.getElementById('selectedEvents');
    if(grid) observer.observe(grid, { childList: true });
});

// Toast Styles
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes toastIn { from { opacity: 0; transform: translateX(100%) scale(0.5); } to { opacity: 1; transform: translateX(0) scale(1); } }
    @keyframes toastOut { from { opacity: 1; transform: translateX(0) scale(1); } to { opacity: 0; transform: translateX(100%) scale(0.5); } }
    .custom-toast i { font-size: 1.2em; }
`;
document.head.appendChild(toastStyle);
