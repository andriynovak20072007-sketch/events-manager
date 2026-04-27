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
        { id: 'user_event_1', title: 'Виставка ретро автомобілів', location: 'Київ, ВДНГ', date: '2026-05-10', status: 'pending', img: 'images/event-1.webp' }
    ];

    function renderEvents(eventsToRender) {
        if (!eventsGrid) return;
        
        if (eventsToRender.length === 0) {
            eventsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-calendar-xmark"></i>
                    <h3>Подій не знайдено</h3>
                    <p>Ви ще не створили жодної події або змініть параметри пошуку.</p>
                </div>
            `;
            return;
        }

        eventsGrid.innerHTML = eventsToRender.map(ev => `
            <div class="event-card" data-id="${ev.id}">
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
                        <button class="btn-edit" onclick="editEvent('${ev.id}')">
                            <i class="fa-solid fa-pen-to-square"></i> Редагувати
                        </button>
                        <button class="btn-delete" onclick="deleteEvent('${ev.id}')">
                            <i class="fa-solid fa-trash-can"></i> Видалити
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function animateValue(obj, start, end, duration) {
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

        animateValue(totalCountEl, 0, total, 1000);
        animateValue(approvedCountEl, 0, approved, 1200);
        animateValue(pendingCountEl, 0, pending, 1400);
    }

    const filterIndicator = document.querySelector('.filter-indicator');
    
    function moveIndicator(activeBtn) {
        if (!filterIndicator || !activeBtn) return;
        filterIndicator.style.width = `${activeBtn.offsetWidth}px`;
        filterIndicator.style.left = `${activeBtn.offsetLeft}px`;
    }

    // Filter logic
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

    // Handle window resize for indicator
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.filter-btn.active');
        moveIndicator(activeBtn);
    });

    // Initialize indicator position
    setTimeout(() => {
        const activeBtn = document.querySelector('.filter-btn.active');
        moveIndicator(activeBtn);
    }, 100);

    // Search logic
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        const filtered = myEvents.filter(e => 
            e.title.toLowerCase().includes(query) || 
            e.location.toLowerCase().includes(query)
        );
        renderEvents(filtered);
    });

    // Global actions
    window.editEvent = (id) => {
        window.location.href = `create-event.html?id=${id}`;
    };

    window.deleteEvent = (id) => {
        if (confirm('Ви впевнені, що хочете видалити цю подію?')) {
            myEvents = myEvents.filter(e => e.id !== id);
            renderEvents(myEvents);
            updateStats();
        }
    };

    // Initialize
    renderEvents(myEvents);
    updateStats();
});
