/**
 * Notification Framework (Vue 3 + Glassmorphism) - FINAL PREMIUM VERSION
 */

const NotificationStore = {
  state: Vue.reactive({
    notifications: [
      { id: 1, type: 'events', title: 'Summer Fest', text: 'Ваш захід <b>"Summer Fest"</b> розпочнеться через 2 години!', time: 'Тільки що', unread: true, icon: 'fa-calendar-check', color: '#2854C5' },
      { id: 2, type: 'tickets', title: 'Океан Ельзи', text: 'Ви успішно придбали квиток на <b>Концерт Океан Ельзи</b>', time: '15 хв тому', unread: true, icon: 'fa-ticket', color: '#10B981' },
      { id: 3, type: 'system', title: '@rock_star', text: 'Користувач <b>@rock_star</b> додав ваш захід до обраного', time: '1 год тому', unread: false, icon: 'fa-star', color: '#F59E0B' }
    ],
    activeCategory: 'all',
    isOpen: false,
    toasts: []
  }),

  getters: {
    unreadCount() {
      return NotificationStore.state.notifications.filter(n => n.unread).length;
    },
    filteredNotifications() {
      const cat = NotificationStore.state.activeCategory;
      if (cat === 'all') return NotificationStore.state.notifications;
      return NotificationStore.state.notifications.filter(n => n.type === cat);
    }
  },

  actions: {
    toggleDropdown() {
      NotificationStore.state.isOpen = !NotificationStore.state.isOpen;
    },
    markAllRead() {
      NotificationStore.state.notifications.forEach(n => n.unread = false);
      NotificationStore.showToast('Всі сповіщення прочитано ✨', '#2854C5');
    },
    setCategory(cat) {
      NotificationStore.state.activeCategory = cat;
    },
    showToast(message, color = '#2854C5') {
      const id = Date.now();
      NotificationStore.state.toasts.push({ id, message, color });
      setTimeout(() => {
        NotificationStore.state.toasts = NotificationStore.state.toasts.filter(t => t.id !== id);
      }, 3500);
    }
  }
};

const NotificationComponent = {
  template: `
    <div class="vue-notification-root" v-click-outside="close">
      <div class="icon-btn" @click="toggle">
        <img src="images/Frame 39.png" alt="icon">
        <span v-if="unreadCount > 0" class="red-dot"></span>
      </div>
      
      <transition name="fade-slide">
        <div v-if="isOpen" class="notif-dropdown">
          <div class="notif-header">
            <h3>Сповіщення</h3>
            <button @click.stop="markAllRead" class="mark-all-read">Прочитати всі</button>
          </div>
          
          <div class="notif-categories">
            <button v-for="cat in categories" 
                    :key="cat.id"
                    :class="['notif-cat-btn', { active: activeCategory === cat.id }]"
                    @click.stop="setCategory(cat.id)">
              {{ cat.label }}
            </button>
          </div>

          <div class="notif-list">
            <div v-for="notif in filtered" 
                 :key="notif.id" 
                 :class="['notif-item', { unread: notif.unread }]"
                 @click.stop="notif.unread = false">
              <div class="notif-icon" :style="{ background: notif.color + '1A', color: notif.color }">
                <i :class="['fa-solid', notif.icon]"></i>
              </div>
              <div class="notif-content">
                <p v-html="notif.text"></p>
                <span>{{ notif.time }}</span>
              </div>
              <div v-if="notif.unread" class="unread-dot"></div>
            </div>
            <div v-if="filtered.length === 0" class="empty-state" style="padding: 60px 40px; text-align: center; color: #94A3B8;">
              <i class="fa-solid fa-bell-slash" style="font-size: 40px; opacity: 0.3; margin-bottom: 15px; display: block;"></i>
              <p style="font-weight: 600;">Немає сповіщень у цій категорії</p>
            </div>
          </div>
          
          <div class="notif-footer">
            <a href="#">Переглянути всі сповіщення</a>
          </div>
        </div>
      </transition>

      <!-- Global Toasts -->
      <teleport to="body">
        <div class="toast-container">
          <transition-group name="toast">
            <div v-for="toast in toasts" :key="toast.id" class="premium-toast" :style="{ borderLeftColor: toast.color }">
              <i class="fa-solid fa-circle-check" :style="{ color: toast.color }"></i>
              {{ toast.message }}
            </div>
          </transition-group>
        </div>
      </teleport>
    </div>
  `,
  setup() {
    const { state, getters, actions } = NotificationStore;
    const categories = [
      { id: 'all', label: 'Все' },
      { id: 'events', label: 'Заходи' },
      { id: 'tickets', label: 'Квитки' },
      { id: 'system', label: 'Система' }
    ];

    return {
      isOpen: Vue.toRef(state, 'isOpen'),
      activeCategory: Vue.toRef(state, 'activeCategory'),
      toasts: Vue.toRef(state, 'toasts'),
      unreadCount: Vue.computed(getters.unreadCount),
      filtered: Vue.computed(getters.filteredNotifications),
      categories,
      toggle: actions.toggleDropdown,
      close: () => state.isOpen = false,
      markAllRead: actions.markAllRead,
      setCategory: actions.setCategory
    };
  }
};

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value();
      }
    };
    document.addEventListener("click", el.clickOutsideEvent);
  },
  unmounted(el) {
    document.removeEventListener("click", el.clickOutsideEvent);
  },
};

document.addEventListener('DOMContentLoaded', () => {
    const app = Vue.createApp(NotificationComponent);
    app.directive('click-outside', vClickOutside);
    
    const mountPoint = document.querySelector('.notifications-wrapper');
    if (mountPoint) {
        mountPoint.innerHTML = '';
        app.mount(mountPoint);
    }
});

window.notify = NotificationStore.actions;
