document.addEventListener("DOMContentLoaded", () => {
    const eventsGrid = document.getElementById('myEventsGrid');
    const searchInput = document.getElementById('eventSearch');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Stats elements
    const totalCountEl = document.getElementById('totalCount');
    const approvedCountEl = document.getElementById('approvedCount');
    const pendingCountEl = document.getElementById('pendingCount');

    // Mock data for user's events
    let myEvents = [
        { id: 'fest1', title: 'Фестиваль "Summer Fest"', location: 'Львів, Стадіон "Прайм"', date: '2026-04-28', status: 'approved', img: 'images/fest1..png' },
        { id: 'fest3', title: 'Музичний "Summer"', location: 'Одеса, Пляж "Аркадія"', date: '2026-06-15', status: 'pending', img: 'images/fest3.png' },
        { id: 'user_event_1', title: 'Виставка ретро автомобілів', location: 'Київ, ВДНГ', date: '2026-05-10', status: 'pending', img: 'images/event-1.webp' },
        { id: 'user_event_2', title: 'IT Weekend Lviv', location: 'Львів, Технопарк', date: '2026-07-20', status: 'approved', img: 'images/event-2.jpg' }
    ];

    function renderEvents(eventsToRender) {
        if (!eventsGrid) return;
        
        if (eventsToRender.length === 0) {
            eventsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 100px 0; animation: fadeIn 0.5s ease;">
                    <i class="fa-regular fa-calendar-xmark" style="font-size: 60px; color: #E2E8F0; margin-bottom: 20px;"></i>
                    <h3 style="font-size: 24px; color: var(--text-main);">Подій не знайдено</h3>
                    <p style="color: var(--text-muted);">Ви ще не створили жодної події або змініть параметри пошуку.</p>
                </div>
            `;
            return;
        }

        eventsGrid.innerHTML = eventsToRender.map((ev, index) => `
            <div class="event-card" data-id="${ev.id}" style="animation: cardEntrance 0.7s cubic-bezier(0.23, 1, 0.32, 1) both; animation-delay: ${index * 0.1}s">
                <div class="card-image" style="background-image: url('${ev.img}')">
                    <span class="status-badge status-${ev.status}">
                        ${ev.status === 'approved' ? 'Схвалено' : (ev.status === 'pending' ? 'На розгляді' : 'Відхилено')}
                    </span>
                </div>
                <div class="card-content">
                    <h3>${ev.title}</h3>
                    <div class="event-info">
                        <div class="info-item">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>${ev.location}</span>
                        </div>
                        <div class="info-item">
                            <i class="fa-solid fa-calendar-days"></i>
                            <span>${ev.date}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn-analytics" onclick="viewAnalytics('${ev.id}')">
                            <i class="fa-solid fa-chart-line"></i> Аналітика
                        </button>
                        <button class="btn-edit" onclick="editEvent('${ev.id}')">
                            <i class="fa-solid fa-pen-to-square"></i> Редагувати
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function updateStats() {
        const total = myEvents.length;
        const approved = myEvents.filter(e => e.status === 'approved').length;
        const pending = myEvents.filter(e => e.status === 'pending').length;

        if (totalCountEl) animateValue(totalCountEl, 0, total, 1000);
        if (approvedCountEl) animateValue(approvedCountEl, 0, approved, 1200);
        if (pendingCountEl) animateValue(pendingCountEl, 0, pending, 1400);
    }

    // Filter indicator logic
    const filterIndicator = document.querySelector('.filter-indicator');
    function moveIndicator(activeBtn) {
        if (!filterIndicator || !activeBtn) return;
        filterIndicator.style.width = `${activeBtn.offsetWidth}px`;
        filterIndicator.style.left = `${activeBtn.offsetLeft}px`;
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            moveIndicator(btn);
            
            const filter = btn.getAttribute('data-filter');
            const filtered = filter === 'all' 
                ? myEvents 
                : myEvents.filter(e => e.status === filter);
            
            renderEvents(filtered);
        });
    });

    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        moveIndicator(activeBtn);
    });

    // Profile Panel Logic
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

    // Search logic
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase();
            const filtered = myEvents.filter(e => 
                e.title.toLowerCase().includes(query) || 
                e.location.toLowerCase().includes(query)
            );
            renderEvents(filtered);
        });
    }

    // Global actions
    window.viewAnalytics = (id) => {
        window.location.href = `moderation.html?id=${id}`;
    };

    window.editEvent = (id) => {
        window.location.href = `create-event.html?id=${id}`;
    };

    window.deleteEvent = (id) => {
        const card = document.querySelector(`.event-card[data-id="${id}"]`);
        if (card && confirm('Ви впевнені, що хочете видалити цю подію?')) {
            card.style.transform = 'scale(0.8) translateY(20px)';
            card.style.opacity = '0';
            card.style.transition = '0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            
            setTimeout(() => {
                myEvents = myEvents.filter(e => e.id !== id);
                renderEvents(myEvents);
                updateStats();
            }, 400);
        }
    };

    // Initialize
    renderEvents(myEvents);
    updateStats();
    setTimeout(() => {
        const activeBtn = document.querySelector('.filter-btn.active');
        moveIndicator(activeBtn);
    }, 100);
});

// Styles for animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes cardEntrance {
        from { opacity: 0; transform: translateY(30px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
    .btn-analytics, .btn-edit { 
        padding: 8px; border-radius: 12px; border: none; font-weight: 600; font-size: 13px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.3s;
    }
    .btn-analytics { background: #F5F3FF; color: #8B5CF6; }
    .btn-analytics:hover { background: #8B5CF6; color: white; transform: translateY(-2px); }
    .btn-edit { background: #F1F5F9; color: #64748B; }
    .btn-edit:hover { background: #00AAFF; color: white; transform: translateY(-2px); }
`;
document.head.appendChild(styleSheet);
