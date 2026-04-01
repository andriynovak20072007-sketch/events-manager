// Event Data
const selectedEvents = [
  {
    id: 1,
    title: 'Фестиваль "Summer Fest"',
    location: 'Львів, Стадіон "Прайм"',
    date: '28 квітня, 18:00',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut non enim consequat natum risque quis blandit. Curabitur nec lorem arcu.',
    //imageUrl: 'https://images.unsplash.com/photo-1473396413399-6717ef7c4093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBvcmFuZ2UlMjBmaXJlfGVufDF8fHx8MTc3NDg5NTkyNnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'detailed',
    Image: '../images/event-1.webp'
  },
  {
    id: 2,
    title: 'Фестиваль "Fest"',
    location: 'Стадіон "Прайм"',
    date: '28 квітня',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut non enim consequat natum risque quis blandit. Curabitur nec lorem arcu.',
    imageUrl: 'https://images.unsplash.com/photo-1735748917428-be035e873f97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBibHVlJTIwbGlnaHRzfGVufDF8fHx8MTc3NDg5NTkyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'detailed'
  },
  {
    id: 3,
    title: 'Фестиваль "Summer Fest"',
    location: 'Львів, Стадіон "Прайм"',
    date: '28 квітня, 18:00',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut non enim consequat natum risque quis blandit. Curabitur nec lorem arcu.',
    imageUrl: 'https://images.unsplash.com/photo-1729867302128-1448c291cd41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjB3aGl0ZSUyMGxpZ2h0c3xlbnwxfHx8fDE3NzQ4OTU5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'detailed'
  },
  {
    id: 4,
    title: 'Фестиваль "Fest"',
    location: 'Стадіон "Прайм"',
    date: '28 квітня',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut non enim consequat natum risque quis blandit. Curabitur nec lorem arcu.',
    imageUrl: 'https://images.unsplash.com/photo-1473396413399-6717ef7c4093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBvcmFuZ2UlMjBmaXJlfGVufDF8fHx8MTc3NDg5NTkyNnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'detailed'
  }
];

const popularEvents = [
  {
    id: 5,
    title: 'Фестиваль "Summer Fest"',
    location: 'Львів, Стадіон "Рівень"',
    date: '28 квітня, 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1473396413399-6717ef7c4093?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBvcmFuZ2UlMjBmaXJlfGVufDF8fHx8MTc3NDg5NTkyNnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'simple'
  },
  {
    id: 6,
    title: 'Фестиваль "Fest"',
    location: 'Львів, Стадіон "Рівень"',
    date: '28 квітня, 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1735748917428-be035e873f97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBibHVlJTIwbGlnaHRzfGVufDF8fHx8MTc3NDg5NTkyN3ww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'simple'
  },
  {
    id: 7,
    title: 'Фестиваль "Summer"',
    location: 'Київ, Стадіон "Рівень"',
    date: '28 квітня, 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1729867302128-1448c291cd41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjB3aGl0ZSUyMGxpZ2h0c3xlbnwxfHx8fDE3NzQ4OTU5Mjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'simple'
  }
];

// SVG Icons
const icons = {
  mapPin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>`,
  
  calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>`,
  
  heart: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>`
};

// Create Event Card - Detailed Version
function createDetailedEventCard(event) {
  return `
    <div class="event-card">
      <div class="event-image-container">
        <img src="${event.imageUrl}" alt="${event.title}" class="event-image">
        <button class="favorite-btn" onclick="toggleFavorite(${event.id})">
          ${icons.heart}
        </button>
      </div>
      <div class="event-content">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-info">
          ${icons.mapPin}
          <span>${event.location}</span>
        </div>
        <div class="event-info">
          ${icons.calendar}
          <span>${event.date}</span>
        </div>
        <p class="event-description">${event.description}</p>
        <div class="event-actions">
          <button class="btn-primary" onclick="showDetails(${event.id})">Детальніше</button>
          <button class="btn-secondary" onclick="addToCalendar(${event.id})">Додати в календар</button>
        </div>
      </div>
    </div>
  `;
}

// Create Event Card - Simple Version
function createSimpleEventCard(event) {
  return `
    <div class="event-card">
      <div class="event-image-container">
        <img src="${event.imageUrl}" alt="${event.title}" class="event-image">
      </div>
      <div class="event-content">
        <h3 class="event-title">${event.title}</h3>
        <div class="event-info">
          ${icons.mapPin}
          <span>${event.location}</span>
        </div>
        <div class="event-info">
          ${icons.calendar}
          <span>${event.date}</span>
        </div>
        <button class="btn-link" onclick="showDetails(${event.id})">Дізнатися більше</button>
      </div>
    </div>
  `;
}

// Render Events
function renderEvents() {
  const selectedEventsContainer = document.getElementById('selectedEvents');
  const popularEventsContainer = document.getElementById('popularEvents');

  // Render Selected Events
  selectedEventsContainer.innerHTML = selectedEvents
    .map(event => createDetailedEventCard(event))
    .join('');

  // Render Popular Events
  popularEventsContainer.innerHTML = popularEvents
    .map(event => createSimpleEventCard(event))
    .join('');
}

// Event Handlers
function toggleFavorite(eventId) {
  console.log('Toggle favorite for event:', eventId);
  alert(`Подія ${eventId} додана до обраного!`);
}

function showDetails(eventId) {
  console.log('Show details for event:', eventId);
  alert(`Показати деталі події ${eventId}`);
}

function addToCalendar(eventId) {
  console.log('Add to calendar event:', eventId);
  alert(`Подія ${eventId} додана до календаря!`);
}

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
  renderEvents();
  
  // Add search functionality
  const searchInput = document.querySelector('.search-bar input');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      console.log('Search query:', e.target.value);
      // Add your search logic here
    });
  }
});
