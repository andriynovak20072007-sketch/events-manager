document.addEventListener("DOMContentLoaded", async () => {
    // --- ЕЛЕМЕНТИ DOM ---
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const adminEventsBody = document.getElementById('adminEventsBody');
    const adminCategoriesBody = document.getElementById('adminCategoriesBody');
    const adminUsersBody = document.getElementById('adminUsersBody');
    const adminReportsBody = document.getElementById('adminReportsBody');
    const adminLogsBody = document.getElementById('adminLogsBody');
    const statusFilter = document.getElementById('statusFilter');
    const adminSearchInput = document.getElementById('adminSearchInput');
    const modeModeration = document.getElementById('mode-moderation');
    const modeAnalytics = document.getElementById('mode-analytics');
    const eventPickerContainer = document.getElementById('event-picker-container');
    const eventPicker = document.getElementById('event-picker');
    const userStatusToggle = document.getElementById('user-status-toggle');

    // --- СТАН (STATE) ---
    let allEvents = [];
    let allCategories = [
        { id: 1, name: 'Концерти', count: 45 },
        { id: 2, name: 'Фестивалі', count: 12 },
        { id: 3, name: 'Виставки', count: 8 },
        { id: 4, name: 'Освіта', count: 24 }
    ];
    let allLogs = [
        { time: '14:20', user: 'admin_max', action: 'Схвалено подію', target: 'Summer Fest' },
        { time: '13:05', user: 'system', action: 'Нова реєстрація', target: 'User #542' },
        { time: '11:40', user: 'admin_max', action: 'Заблоковано користувача', target: 'SpamBot_99' }
    ];

    // --- MOCK DATA ---
    const mockEvents = [
        { event_id: 'fest1', title: 'Фестиваль "Summer Fest"', user_name: 'andrii_n', created_at: '2026-04-20', status: 'approved', image: 'images/fest1..png' },
        { event_id: 'fest2', title: 'Фестиваль "Fest"', user_name: 'maria_k', created_at: '2026-04-21', status: 'approved', image: 'images/fest2.png' },
        { event_id: 'fest3', title: 'Музичний "Summer"', user_name: 'andrii_n', created_at: '2026-04-22', status: 'pending', image: 'images/fest3.png' },
        { event_id: 'lecture1', title: 'ІТ Конференція "CodeX"', user_name: 'admin_max', created_at: '2026-04-23', status: 'approved', image: 'images/event-1.webp' },
        { event_id: 'lecture2', title: 'Майстер-клас "UX Story"', user_name: 'lena_art', created_at: '2026-04-24', status: 'pending', image: 'images/event-2.jpg' },
        { event_id: 'lecture3', title: 'Лекція "Наука в ІТ"', user_name: 'alex_p', created_at: '2026-04-25', status: 'approved', image: 'images/event-3.jpg' },
        { event_id: 'concert1', title: 'Концерт "Нічний Джем"', user_name: 'maria_k', created_at: '2026-04-25', status: 'approved', image: 'images/event-1.webp' },
        { event_id: 'concert2', title: 'Рок-фестиваль "City Beat"', user_name: 'andrii_n', created_at: '2026-04-26', status: 'pending', image: 'images/event-2.jpg' },
        { event_id: 'concert3', title: 'Jazz Night "Odessa Vibes"', user_name: 'alex_p', created_at: '2026-04-26', status: 'approved', image: 'images/event-3.jpg' },
        { event_id: 'sport1', title: 'Матч "Динамо" - "Шахтар"', user_name: 'admin_max', created_at: '2026-04-27', status: 'approved', image: 'images/event-1.webp' },
        { event_id: 'sport2', title: 'Біг по парку "Lviv Run"', user_name: 'lena_art', created_at: '2026-04-27', status: 'pending', image: 'images/event-2.jpg' },
        { event_id: 'sport3', title: 'Велокрос у Харкові', user_name: 'maria_k', created_at: '2026-04-27', status: 'approved', image: 'images/event-3.jpg' }
    ];

    const mockUsers = [
        { id: 1, name: 'Андрій Новак', email: 'andriy@example.com', role: 'Менеджер', status: 'active' },
        { id: 2, name: 'Марія Коваль', email: 'maria@example.com', role: 'Користувач', status: 'active' },
        { id: 3, name: 'Олександр Петренко', email: 'alex@example.com', role: 'Користувач', status: 'banned' }
    ];

    const mockReports = [
        { id: 101, object: 'Summer Music Fest', reason: 'Нецензурна лексика', reporter: 'user123', date: '2026-04-26' },
        { id: 102, object: 'Tech Conference 2026', reason: 'Спам', reporter: 'bot_hunter', date: '2026-04-27' }
    ];

    const adminMarketingBody = document.getElementById('adminMarketingBody');

    // --- СТАН (STATE) ---
    let marketingData = [
        { title: 'Summer Music Fest', clicks: 840, unique: 620, conv: '12.5%' },
        { title: 'Tech Conference 2026', clicks: 310, unique: 280, conv: '8.2%' },
        { title: 'Art Exhibition', clicks: 100, unique: 95, conv: '4.1%' }
    ];
    
    // --- Chart Instances (to destroy before re-render) ---
    let salesChartInstance = null;
    let trafficChartInstance = null;
    let dashboardChartInstance = null;

    // --- ЛОГІКА ТАБІВ ---
    function switchTab(tabId) {
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-tab') === tabId) link.classList.add('active');
        });

        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${tabId}-section`) content.classList.add('active');
        });

        if (tabId === 'events') renderEventsTable(allEvents);
        if (tabId === 'categories') renderCategories();
        if (tabId === 'users') renderUsers();
        if (tabId === 'reports') renderReports();
        if (tabId === 'logs') renderLogs();
        if (tabId === 'marketing') renderMarketing();
        if (tabId === 'dashboard') updateDashboardStats();
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.getAttribute('data-tab'));
        });
    });


    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            const label = card.querySelector('.stat-label').innerText.toLowerCase();
            if (label.includes('подій')) switchTab('events');
            if (label.includes('користувачі')) switchTab('users');
            if (label.includes('скарги')) switchTab('reports');
            if (label.includes('переходи')) switchTab('marketing');
        });
    });

    // --- ФУНКЦІЇ РЕНДЕРУ ---

    function renderMarketing() {
        if (!adminMarketingBody) return;
        adminMarketingBody.innerHTML = marketingData.map(item => `
            <tr>
                <td><strong>${item.title}</strong></td>
                <td><span style="font-weight: 700; color: var(--blue-dark);">${item.clicks}</span></td>
                <td>${item.unique}</td>
                <td><span class="status-badge status-approved">${item.conv}</span></td>
            </tr>
        `).join('');
    }

    function renderEventsTable(events) {
        if (!adminEventsBody) return;
        adminEventsBody.innerHTML = events.map(ev => `
            <tr>
                <td>
                    <div class="event-info-cell">
                        <img src="${ev.image || 'images/fest1..png'}" class="event-thumb">
                        <div>
                            <div class="event-title-small">${ev.title}</div>
                            <div class="event-id-small">ID: ${ev.event_id}</div>
                        </div>
                    </div>
                </td>
                <td><strong>${ev.user_name}</strong></td>
                <td>${ev.created_at}</td>
                <td><span class="status-badge status-${ev.status}">${ev.status === 'approved' ? 'Схвалено' : 'На розгляді'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-approve" onclick="handleEventAction(${ev.event_id}, 'approve')"><i class="fa-solid fa-check"></i></button>
                        <button class="btn-action btn-reject" onclick="handleEventAction(${ev.event_id}, 'reject')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderCategories() {
        if (!adminCategoriesBody) return;
        adminCategoriesBody.innerHTML = allCategories.map(cat => `
            <tr>
                <td>#${cat.id}</td>
                <td><strong>${cat.name}</strong></td>
                <td>${cat.count} подій</td>
                <td>
                    <button class="btn-action btn-reject" onclick="handleCategoryAction(${cat.id}, 'delete')"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderUsers(filteredUsers) {
        const body = document.getElementById('adminUsersBody');
        if (!body) return;
        body.innerHTML = '';

        const usersToRender = filteredUsers || mockUsers;

        usersToRender.forEach(user => {
            const isBanned = user.status === 'banned';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="status-badge status-${isBanned ? 'rejected' : 'approved'}">${isBanned ? 'Забанений' : 'Активний'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action ${isBanned ? 'btn-approve' : 'btn-reject'}" 
                                onclick="handleUserAction(${user.id}, '${isBanned ? 'unban' : 'ban'}')" 
                                title="${isBanned ? 'Розблокувати' : 'Заблокувати'}">
                            <i class="fa-solid ${isBanned ? 'fa-user-check' : 'fa-ban'}"></i>
                        </button>
                    </div>
                </td>
            `;
            body.appendChild(tr);
        });
    }

    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', () => {
            const query = userSearchInput.value.toLowerCase();
            const filtered = mockUsers.filter(u =>
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            );
            renderUsers(filtered);
        });
    }

    function renderReports() {
        if (!adminReportsBody) return;
        adminReportsBody.innerHTML = mockReports.map(rep => `
            <tr>
                <td>${rep.object}</td>
                <td>${rep.reason}</td>
                <td>@${rep.reporter}</td>
                <td>${rep.date}</td>
                <td>
                    <button class="btn-action btn-approve" onclick="handleReport(${rep.id})"><i class="fa-solid fa-check"></i></button>
                </td>
            </tr>
        `).join('');
    }

    function renderLogs() {
        if (!adminLogsBody) return;
        adminLogsBody.innerHTML = allLogs.map(log => `
            <tr>
                <td style="color: #64748B;">${log.time}</td>
                <td><strong>${log.user}</strong></td>
                <td>${log.action}</td>
                <td style="font-weight: 600;">${log.target}</td>
            </tr>
        `).join('');
    }

    let myChart = null;

    function initChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;

        if (dashboardChartInstance) dashboardChartInstance.destroy();

        dashboardChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
                datasets: [{
                    label: 'Відвідувачі',
                    data: [120, 190, 150, 280, 220, 310, 450],
                    borderColor: '#2854C5',
                    backgroundColor: 'rgba(40, 84, 197, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Переходи на квитки',
                    data: [20, 45, 30, 80, 55, 90, 110],
                    borderColor: '#00AAFF',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function updateDashboardStats() {
        // Only update if we are in Moderation mode
        if (modeModeration && !modeModeration.classList.contains('active')) return;

        if (document.getElementById('stat-total-events')) {
            document.getElementById('stat-total-events').innerText = allEvents.length;
        }
        if (document.getElementById('stat-active-reports')) {
            document.getElementById('stat-active-reports').innerText = mockReports.length;
        }

        if (dashboardChartInstance) {
            dashboardChartInstance.data.datasets[0].data[6] = 450 + (Math.random() * 50);
            dashboardChartInstance.update();
        }
    }

    // --- ДІЇ (ACTIONS) ---

    window.handleEventAction = (id, action) => {
        const ev = allEvents.find(e => e.event_id === id);
        if (ev && action === 'approve') {
            ev.status = 'approved';
            addLog('admin_max', 'Схвалено подію', ev.title);
            showToast(`Подію "${ev.title}" схвалено!`);
        } else if (ev && action === 'reject') {
            allEvents = allEvents.filter(e => e.event_id !== id);
            addLog('admin_max', 'Видалено подію', ev.title);
            showToast('Подію видалено', 'red');
        }
        renderEventsTable(allEvents);
        updateDashboardStats();
    };

    window.handleUserAction = (id, action) => {
        const user = mockUsers.find(u => u.id === id);
        if (!user) return;

        if (action === 'ban') {
            if (confirm(`Заблокувати користувача ${user.name}?`)) {
                user.status = 'banned';
                addLog('admin_max', 'Заблоковано користувача', user.name);
                showToast(`Користувача ${user.name} заблоковано`, 'red');
            }
        } else {
            user.status = 'active';
            addLog('admin_max', 'Розблоковано користувача', user.name);
            showToast(`Користувача ${user.name} розблоковано`);
        }
        renderUsers();
    };

    window.handleReport = (id) => {
        const index = mockReports.findIndex(r => r.id === id);
        if (index === -1) return;

        const rep = mockReports[index];
        addLog('admin_max', 'Вирішено скаргу', rep.object);
        mockReports.splice(index, 1);
        renderReports();
        updateDashboardStats();
        showToast('Скаргу позначено як вирішену');
    };

    window.handleCategoryAction = (id, action) => {
        if (action === 'delete') {
            const cat = allCategories.find(c => c.id === id);
            if (confirm(`Видалити категорію "${cat ? cat.name : id}"?`)) {
                allCategories = allCategories.filter(c => c.id !== id);
                addLog('admin_max', 'Видалено категорію', cat ? cat.name : id);
                renderCategories();
                showToast('Категорію видалено', 'red');
            }
        }
    };

    function addLog(user, action, target) {
        const now = new Date();
        const time = `${now.getHours()}:${now.getMinutes()}`;
        allLogs.unshift({ time, user, action, target });
    }

    // --- КАТЕГОРІЇ (MODAL) ---
    const catModal = document.getElementById('categoryModal');
    const addCatBtn = document.getElementById('addCategoryBtn');
    const closeCatModal = document.getElementById('closeCatModal');
    const saveCatBtn = document.getElementById('saveCatBtn');

    if (addCatBtn) {
        addCatBtn.onclick = () => catModal.style.display = 'flex';
    }
    if (closeCatModal) {
        closeCatModal.onclick = () => catModal.style.display = 'none';
    }

    if (saveCatBtn) {
        saveCatBtn.onclick = () => {
            const name = document.getElementById('newCatName').value;
            if (name) {
                const newId = allCategories.length + 1;
                allCategories.push({ id: newId, name, count: 0 });
                renderCategories();
                catModal.style.display = 'none';
                document.getElementById('newCatName').value = '';
                showToast('Категорію додано!');
            }
        };
    }

    // --- НАЛАШТУВАННЯ ---
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.onclick = () => {
            showToast('Налаштування системи успішно збережено!');
            addLog('admin_max', 'Оновлено налаштування', 'Загальні конфігурації');
        };
    }

    const sendAnnounceBtn = document.getElementById('sendAnnounceBtn');
    if (sendAnnounceBtn) {
        sendAnnounceBtn.onclick = () => {
            const text = document.getElementById('globalAnnounceText').value;
            if (text) {
                showToast('Оголошення опубліковано для всіх користувачів!');
                document.getElementById('globalAnnounceText').value = '';
                addLog('admin_max', 'Надіслано оголошення', text.substring(0, 20) + '...');
            }
        };
    }

    // --- ФІЛЬТРАЦІЯ ---
    function filterEvents() {
        if (!statusFilter || !adminSearchInput) return allEvents;

        const statusValue = statusFilter.value;
        const searchValue = adminSearchInput.value.toLowerCase();

        const source = allEvents.length > 0 ? allEvents : mockEvents;

        const filtered = source.filter(ev => {
            const matchesStatus = statusValue === 'all' || ev.status === statusValue;
            const matchesSearch = ev.title.toLowerCase().includes(searchValue) ||
                (ev.user_name && ev.user_name.toLowerCase().includes(searchValue)) ||
                String(ev.event_id).includes(searchValue);
            return matchesStatus && matchesSearch;
        });

        renderEventsTable(filtered);
    }

    if (statusFilter) statusFilter.addEventListener('change', filterEvents);
    if (adminSearchInput) adminSearchInput.addEventListener('input', filterEvents);

    // --- TOAST ---
    function showToast(text, color = 'var(--blue-dark)') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px;
            background: white; color: ${color}; padding: 15px 25px;
            border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            font-weight: 700; z-index: 10000; animation: slideIn 0.3s ease-out;
            border-left: 5px solid ${color};
        `;
        toast.innerText = text;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // --- ВИХІД ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm('Ви впевнені, що хочете вийти з адмін-панелі?')) {
                showToast('Вихід з системи...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            }
        };
    }

    // --- СТАТУС КОРИСТУВАЧА (ДЛЯ ТЕСТУ) ---
    function updateStatusUI() {
        const role = localStorage.getItem('userRole') || 'free';
        const isPro = role === 'pro_plus' || role === 'pro';
        if (userStatusToggle) {
            userStatusToggle.innerText = isPro ? 'PRO+' : 'FREE';
            userStatusToggle.className = `user-status-badge ${isPro ? 'pro-plus' : 'free'}`;
        }
    }

    if (userStatusToggle) {
        userStatusToggle.onclick = () => {
            const currentRole = localStorage.getItem('userRole') || 'free';
            const newRole = currentRole === 'pro_plus' ? 'free' : 'pro_plus';
            localStorage.setItem('userRole', newRole);
            updateStatusUI();
            showToast(`Статус змінено на: ${newRole.toUpperCase()}`);
            
            // Reload analytics if in analytics mode
            if (modeAnalytics && modeAnalytics.classList.contains('active') && eventPicker && eventPicker.value) {
                loadEventAnalytics(eventPicker.value);
            }
        };
    }
    updateStatusUI();

    // --- ІНІЦІАЛІЗАЦІЯ ---
    async function init() {
        // --- MODE SWITCHING ---
        if (modeModeration) {
            modeModeration.onclick = () => {
                modeModeration.classList.add('active');
                modeAnalytics.classList.remove('active');
                eventPickerContainer.classList.add('hidden');
                document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                document.querySelectorAll('.event-only').forEach(el => el.classList.add('hidden'));
                document.querySelector('.header-left h2').innerText = 'Адмін-панель';
                switchTab('dashboard');
            };
        }

        if (modeAnalytics) {
            modeAnalytics.onclick = async () => {
                modeAnalytics.classList.add('active');
                modeModeration.classList.remove('active');
                eventPickerContainer.classList.remove('hidden');
                document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('.event-only').forEach(el => el.classList.remove('hidden'));
                document.querySelector('.header-left h2').innerText = 'Аналітика події';
                
                // Load events for picker
                await loadEventsForPicker();
                
                // Auto-select first event if exists
                if (eventPicker && eventPicker.options.length > 1) {
                    eventPicker.selectedIndex = 1;
                    loadEventAnalytics(eventPicker.value);
                }
                
                switchTab('dashboard');
            };
        }

        if (eventPicker) {
            eventPicker.onchange = (e) => {
                const eventId = e.target.value;
                if (eventId) {
                    loadEventAnalytics(eventId);
                }
            };
        }

        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (eventId) {
            // If ID in URL, auto-switch to analytics mode
            if (modeAnalytics) modeAnalytics.click();
            // Wait for picker to load then select
            setTimeout(() => {
                if (eventPicker) {
                    eventPicker.value = eventId;
                    loadEventAnalytics(eventId);
                }
            }, 500);
        } else {
            // DEFAULT: Moderation Mode
            updateDashboardStats();
            initChart();
        }

        // Load all events for moderation table regardless
        try {
            const res = await fetch('http://localhost:5000/events');
            if (res.ok) {
                const data = await res.json();
                allEvents = data.map(e => ({ ...e, status: e.status || 'pending' }));
            } else {
                allEvents = [...mockEvents];
            }
        } catch (e) {
            allEvents = [...mockEvents];
        }
        renderEventsTable(allEvents);
    }

    async function loadEventsForPicker() {
        if (!eventPicker) return;
        eventPicker.innerHTML = '<option value="">Оберіть подію...</option>';
        
        // In real app, fetch events where current user is organizer
        // For now, let's use allEvents or mock
        const source = allEvents.length > 0 ? allEvents : mockEvents;
        source.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.event_id || ev.id;
            opt.innerText = ev.title || ev.event_name;
            eventPicker.appendChild(opt);
        });
    }

    async function loadEventAnalytics(eventId) {
        const userRole = localStorage.getItem('userRole') || 'free';
        
        // --- Consistent Dummy Data per Event ---
        const seed = String(eventId).length + (parseInt(String(eventId).replace(/\D/g, '')) || 0);
        const getSeedRandom = (offset) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const dummyStats = {
            views: Math.floor(getSeedRandom(1) * 2000) + 500,
            tickets: Math.floor(getSeedRandom(2) * 100) + 10,
            revenue: Math.floor(getSeedRandom(3) * 50000) + 5000
        };

        try {
            let stats = dummyStats;
            
            // Only try fetch if eventId is a number
            if (!isNaN(eventId)) {
                const res = await fetch(`http://localhost:5000/api/analytics/${eventId}/summary`);
                if (res.ok) {
                    const realStats = await res.json();
                    // If we have real views, use them, otherwise stick to dummy for demo
                    if (realStats.views > 0) stats = realStats;
                }
            }
            
            // Update Stats Cards
            document.getElementById('stat-total-events').innerText = stats.views.toLocaleString();
            document.querySelectorAll('.stat-label')[0].innerText = 'Перегляди сторінки';
            
            const cards = document.querySelectorAll('.stat-card');
            if (cards[1]) {
                cards[1].querySelector('.stat-label').innerText = 'Продані квитки';
                cards[1].querySelector('.stat-value').innerText = stats.tickets;
                cards[1].querySelector('.stat-icon').style.background = '#E0F2FE';
                cards[1].querySelector('.stat-icon').style.color = '#0369A1';
                cards[1].querySelector('.stat-icon').innerHTML = '<i class="fa-solid fa-ticket"></i>';
                cards[1].style.display = 'flex';
            }
            if (cards[2]) {
                cards[2].querySelector('.stat-label').innerText = 'Загальний дохід';
                cards[2].querySelector('.stat-value').innerText = `₴${stats.revenue.toLocaleString()}`;
                cards[2].querySelector('.stat-icon').style.background = '#DCFCE7';
                cards[2].querySelector('.stat-icon').style.color = '#15803D';
                cards[2].querySelector('.stat-icon').innerHTML = '<i class="fa-solid fa-money-bill-trend-up"></i>';
                cards[2].style.display = 'flex';
            }
            if (cards[3]) {
                cards[3].querySelector('.stat-label').innerText = 'Конверсія';
                const conv = stats.views > 0 ? ((stats.tickets / stats.views) * 100).toFixed(1) : 0;
                cards[3].querySelector('.stat-value').innerText = `${conv}%`;
                cards[3].style.display = 'flex';
            }

            // Update Dashboard Chart for Event
            if (dashboardChartInstance) {
                dashboardChartInstance.data.datasets[0].label = 'Перегляди';
                dashboardChartInstance.data.datasets[0].data = [
                    Math.floor(getSeedRandom(4) * 500),
                    Math.floor(getSeedRandom(5) * 600),
                    Math.floor(getSeedRandom(6) * 450),
                    Math.floor(getSeedRandom(7) * 800),
                    Math.floor(getSeedRandom(8) * 700),
                    Math.floor(getSeedRandom(9) * 900),
                    stats.views % 1000
                ];
                dashboardChartInstance.data.datasets[1].label = 'Квитки';
                dashboardChartInstance.data.datasets[1].data = [
                    Math.floor(getSeedRandom(10) * 50),
                    Math.floor(getSeedRandom(11) * 40),
                    Math.floor(getSeedRandom(12) * 60),
                    Math.floor(getSeedRandom(13) * 30),
                    Math.floor(getSeedRandom(14) * 70),
                    Math.floor(getSeedRandom(15) * 55),
                    stats.tickets
                ];
                dashboardChartInstance.update();
            }

            // Handle Pro+ Detailed Data
            const isPro = userRole === 'pro_plus' || userRole === 'pro';
            if (isPro) {
                document.getElementById('sales-lock').classList.add('hidden');
                document.getElementById('traffic-lock').classList.add('hidden');
                loadEventDetailedData(eventId);
            } else {
                document.getElementById('sales-lock').classList.remove('hidden');
                document.getElementById('traffic-lock').classList.remove('hidden');
                renderMockEventCharts();
            }
        } catch (e) {
            console.error('Error loading analytics:', e);
            // Fallback UI already updated with dummyStats
        }
    }

    async function loadEventDetailedData(eventId) {
        try {
            let data = null;
            
            if (!isNaN(eventId)) {
                const res = await fetch(`http://localhost:5000/api/analytics/${eventId}/detailed?user_id=${localStorage.getItem('userId') || 1}`);
                if (res.ok) data = await res.json();
            }

            // Fallback for demo if no real data
            if (!data || !data.daily_sales || data.daily_sales.length === 0) {
                data = {
                    daily_sales: [
                        { date: '2026-05-01', amount: 1200 },
                        { date: '2026-05-02', amount: 800 },
                        { date: '2026-05-03', amount: 2400 },
                        { date: '2026-05-04', amount: 1500 },
                        { date: '2026-05-05', amount: 3200 }
                    ],
                    utm_stats: [
                        { utm_source: 'Google', count: 450 },
                        { utm_source: 'Facebook', count: 320 },
                        { utm_source: 'Instagram', count: 280 },
                        { utm_source: 'Direct', count: 150 }
                    ]
                };
            }
            
            // Render Sales Chart
            const salesCtx = document.getElementById('eventSalesChart').getContext('2d');
            if (salesChartInstance) salesChartInstance.destroy();

            salesChartInstance = new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: data.daily_sales.map(d => new Date(d.date).toLocaleDateString()),
                    datasets: [{
                        label: 'Дохід (₴)',
                        data: data.daily_sales.map(d => d.amount),
                        borderColor: '#00AAFF',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(0, 170, 255, 0.1)'
                    }]
                },
                options: { scales: { y: { beginAtZero: true } } }
            });

            // Render Traffic Chart
            const trafficCtx = document.getElementById('eventTrafficChart').getContext('2d');
            if (trafficChartInstance) trafficChartInstance.destroy();

            trafficChartInstance = new Chart(trafficCtx, {
                type: 'doughnut',
                data: {
                    labels: data.utm_stats.map(s => s.utm_source),
                    datasets: [{
                        data: data.utm_stats.map(s => s.count),
                        backgroundColor: ['#00AAFF', '#10B981', '#F59E0B', '#8B5CF6']
                    }]
                }
            });

            // Render UTM Table
            const tbody = document.getElementById('event-utm-tbody');
            tbody.innerHTML = data.utm_stats.map(s => `
                <tr>
                    <td><strong>${s.utm_source}</strong></td>
                    <td>${s.count}</td>
                    <td>${(Math.random() * 10 + 2).toFixed(1)}%</td>
                </tr>
            `).join('');

        } catch (e) { console.error(e); }
    }

    function renderMockEventCharts() {
        // Mock data for blurred charts
        const salesCtx = document.getElementById('eventSalesChart').getContext('2d');
        new Chart(salesCtx, { type: 'line', data: { labels: ['1','2','3'], datasets: [{ data: [10, 20, 15], borderColor: '#ccc' }] } });
    }

    init();
});
