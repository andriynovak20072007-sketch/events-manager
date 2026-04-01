const eventsData = {
    'fest1': {
        title: 'Фестиваль "Summer Fest"',
        city: 'Львів, Стадіон "Прайм"',
        date: '28 квітня, 18:00',
        image: 'images/fest1..png',
        price: 'Від 450 грн'
    },
    'fest2': {
       title: 'Фестиваль "Fest"',
        city: 'Київ, Стадіон "Прайм"',
        date: '30 травня, 19:00',
        image: 'images/fest2.png',
        price: 'Від 500 грн'
    },
    'fest3': {
        title: 'Музичний "Summer"',
        city: 'Одеса, Пляж "Аркадія"',
        date: '15 червня, 20:00',
        image: 'images/fest3.png',
        price: 'Від 300 грн'
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Отримуємо ID події з посилання
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    
    // 2. Якщо така подія є в нашому списку — підставляємо дані
    if (eventId && eventsData[eventId]) {
        const data = eventsData[eventId];
        document.querySelector('.event-page-title').innerText = data.title;
        document.querySelector('.meta-row span').innerText = data.city; // Місто
        document.querySelectorAll('.meta-row span')[1].innerText = data.date; // Дата
        document.querySelector('.event-poster-img').src = data.image;
        document.querySelector('.buy-ticket-main-btn').innerText = `Придбати квиток | ${data.price}`;
    }

    // 3. Логіка "Читати далі" (ТУТ ЇЇ ПРАВИЛЬНЕ МІСЦЕ)
    const descriptionBlock = document.querySelector('.event-details-text');
    if (descriptionBlock) {
        // Створюємо кнопку "Читати далі"
        const readMoreBtn = document.createElement('button');
        readMoreBtn.innerText = 'Читати далі';
        readMoreBtn.className = 'read-more-btn';
        
        // Додаємо кнопку ПІСЛЯ блоку з текстом
        descriptionBlock.parentNode.insertBefore(readMoreBtn, descriptionBlock.nextSibling);

        readMoreBtn.addEventListener('click', () => {
            descriptionBlock.classList.toggle('expanded');
            readMoreBtn.innerText = descriptionBlock.classList.contains('expanded') ? 'Згорнути' : 'Читати далі';
        });
    }
});

// Отримуємо елементи пошуку зі сторінки
const searchInput = document.getElementById('title-search-input');
const searchMessage = document.getElementById('search-message');


/*
 Обробка помилок і порожнього результату (за назвою)
 Обробка null/порожнього результату (пошук)
*/
function showSearchMessage(text, isError = false) {
  if (!searchMessage) return;

  searchMessage.textContent = text;
  searchMessage.style.display = 'block';
  searchMessage.style.color = isError ? 'red' : '#333';
}


//Очищає повідомлення перед новим пошуком
function clearSearchMessage() {
  if (!searchMessage) return;

  searchMessage.textContent = '';
  searchMessage.style.display = 'none';
}


/*
Обробка null/порожнього результату (пошук)
Обробка помилок і порожнього результату (за назвою)
*/
function handleSearchResults(events) {

  // Якщо API повернув null або undefined
  if (events == null) {
    showSearchMessage('Подій не знайдено');
    return;
  }

  // Якщо API повернув не масив (помилка формату)
  if (!Array.isArray(events)) {
    showSearchMessage('Неправильний формат даних пошуку', true);
    return;
  }

  // Якщо масив пустий
  if (events.length === 0) {
    showSearchMessage('Подій не знайдено');
    return;
  }

  // Якщо все ок — прибираємо повідомлення
  clearSearchMessage();

  // відображення списку подій
  console.log('Знайдені події:', events);
}


// якщо сталася помилка запиту (fetch, сервер, мережа)
function handleSearchError() {
  showSearchMessage('Сталася помилка під час пошуку', true);
}


/*
- викликає API
- отримує дані
- передає їх у handleSearchResults
- при помилці викликає handleSearchError
*/
async function searchByTitle(title) {
  try {
    clearSearchMessage();

    const response = await fetch(`/events?title=${encodeURIComponent(title)}`);

    // Якщо сервер повернув помилку
    if (!response.ok) {
      throw new Error('Помилка запиту');
    }

    const data = await response.json();

    // Якщо API повернув null
    if (data == null) {
      handleSearchResults(null);
      return;
    }

    handleSearchResults(data);

  } catch (error) {
    console.error('Search error:', error);
    handleSearchError();
  }
}


/*
- якщо поле пусте → показує повідомлення
- якщо є текст → запускає пошук
*/
if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const value = searchInput.value.trim();

      if (value === '') {
        showSearchMessage('Введіть назву події');
        return;
      }

      searchByTitle(value);
    }
  });
}