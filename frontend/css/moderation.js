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

        myChart = new Chart(ctx, {
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
        if (document.getElementById('stat-total-events')) {
            document.getElementById('stat-total-events').innerText = allEvents.length;
        }
        if (document.getElementById('stat-active-reports')) {
            document.getElementById('stat-active-reports').innerText = mockReports.length;
        }

        // Можна також імітувати випадкове оновлення графіка
        if (myChart) {
            myChart.data.datasets[0].data[6] = 450 + (Math.random() * 50);
            myChart.update();
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

    // --- ІНІЦІАЛІЗАЦІЯ ---
    async function init() {
        try {
            const res = await fetch('http://localhost:5000/api/events');
            if (res.ok) {
                const data = await res.json();
                allEvents = data.map(e => ({ ...e, status: e.status || 'pending' }));
            } else {
                allEvents = [...mockEvents];
            }
        } catch (e) {
            allEvents = [...mockEvents];
        }

        // Об'єднуємо реальні події та моки для гарантованого відображення
        const sourceEvents = allEvents.length > 0 ? allEvents : mockEvents;

        marketingData = sourceEvents.map(ev => ({
            title: ev.title || ev.event_name || 'Без назви',
            clicks: Math.floor(Math.random() * 500) + 20,
            unique: Math.floor(Math.random() * 150) + 10,
            conv: (Math.random() * 15 + 2).toFixed(1) + '%'
        }));

        updateDashboardStats();
        renderEventsTable(allEvents.length > 0 ? allEvents : mockEvents);

        // Якщо користувач вже на вкладці маркетингу, оновлюємо її
        const activeTab = document.querySelector('.tab-content.active');
        if (activeTab && activeTab.id === 'marketing-section') {
            renderMarketing();
        }

        initChart();
    }

    init();
});
