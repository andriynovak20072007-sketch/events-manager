const eventsData = {
    'fest1': {
        title: 'Фестиваль "Summer Fest"',
        city: 'Львів, Стадіон "Прайм"',
        date: '28 квітня, 18:00',
        image: 'images/fest1..png',
        price: 'Від 450 грн',
        regionId: 'Lviv' // Точно як id="Lviv" у вашому HTML
    },
    'fest2': {
       title: 'Фестиваль "Fest"',
        city: 'Київ, Стадіон "Прайм"',
        date: '30 травня, 19:00',
        image: 'images/fest2.png',
        price: 'Від 500 грн',
        regionId: 'kyiv' // Точно як id="kyiv" у вашому HTML
    },
    'fest3': {
        title: 'Музичний "Summer"',
        city: 'Одеса, Пляж "Аркадія"',
        date: '15 червня, 20:00',
        image: 'images/fest3.png',
        price: 'Від 300 грн',
        regionId: 'odesa' // Точно як id="odesa" у вашому HTML
    }
};

document.addEventListener("DOMContentLoaded", () => {
    //  Отримуємо ID події з посилання
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('event');
    //  Якщо така подія є в нашому списку — підставляємо дані
    if (eventId && eventsData[eventId]) {
        const data = eventsData[eventId];
        document.querySelector('.event-page-title').innerText = data.title;
        document.querySelector('.meta-row span').innerText = data.city; 
        document.querySelectorAll('.meta-row span')[1].innerText = data.date; 
        document.querySelector('.event-poster-img').src = data.image;
        document.querySelector('.buy-ticket-main-btn').innerText = `Придбати квиток | ${data.price}`;
    }
    // 3. Логіка "Читати далі" 
    const descriptionBlock = document.querySelector('.event-details-text');
    if (descriptionBlock) {
        const readMoreBtn = document.createElement('button');
        readMoreBtn.innerText = 'Читати далі';
        readMoreBtn.className = 'read-more-btn';
        
        descriptionBlock.parentNode.insertBefore(readMoreBtn, descriptionBlock.nextSibling);

        readMoreBtn.addEventListener('click', () => {
            descriptionBlock.classList.toggle('expanded');
            readMoreBtn.innerText = descriptionBlock.classList.contains('expanded') ? 'Згорнути' : 'Читати далі';
        });
    }
});

