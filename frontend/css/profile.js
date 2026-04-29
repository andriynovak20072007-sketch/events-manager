// profile.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Handle heart button toggles
    const heartBtns = document.querySelectorAll('.heart-btn');
    heartBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent jump to top if inside an anchor
            const icon = this.querySelector('i');
            
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                icon.classList.remove('fa-solid');
                icon.classList.add('fa-regular');
                icon.style.color = 'white';
            } else {
                this.classList.add('active');
                icon.classList.remove('fa-regular');
                icon.classList.add('fa-solid');
                icon.style.color = '#E64949'; // Red color for liked
            }
        });
    });

    // Handle Edit Profile button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if(editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            alert('Функція редагування профілю буде доступна незабаром.');
        });
    }

    // Handle Event Action buttons
    const viewBtn = document.querySelector('.view-btn');
    const editBtn = document.querySelector('.edit-btn');
    const deleteBtn = document.querySelector('.delete-btn');

    if(viewBtn) {
        viewBtn.addEventListener('click', () => {
            window.location.href = '#'; // Redirect to event page in real app
            alert('Перехід до сторінки події...');
        });
    }

    if(editBtn) {
        editBtn.addEventListener('click', () => {
            window.location.href = 'create-event.html'; // Example redirect
        });
    }

    if(deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if(confirm('Ви впевнені, що хочете видалити цю подію?')) {
                const eventItem = deleteBtn.closest('.created-event-item');
                if(eventItem) {
                    eventItem.style.opacity = '0';
                    setTimeout(() => eventItem.remove(), 300);
                }
            }
        });
    }

    // Handle Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Ви впевнені, що хочете вийти з акаунту?')) {
                window.location.href = 'index.html';
            }
        });
    }
});
