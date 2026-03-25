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