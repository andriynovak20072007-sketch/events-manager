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

    // Profile Edit Elements
    const editProfileModal = document.getElementById('editProfileModal');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    
    const displayProfileHandle = document.getElementById('displayProfileHandle');
    const displayProfileDesc = document.getElementById('displayProfileDesc');
    const displayProfileAvatar = document.getElementById('displayProfileAvatar');
    
    const editProfileHandle = document.getElementById('editProfileHandle');
    const editProfileDesc = document.getElementById('editProfileDesc');
    const editAvatarPreview = document.getElementById('editAvatarPreview');
    const avatarUpload = document.getElementById('avatarUpload');

    // Handle Edit Profile button
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    if(editProfileBtn && editProfileModal) {
        editProfileBtn.addEventListener('click', () => {
            // Populate current values
            if (displayProfileHandle) editProfileHandle.value = displayProfileHandle.innerText;
            if (displayProfileDesc) editProfileDesc.value = displayProfileDesc.innerText;
            if (displayProfileAvatar) editAvatarPreview.src = displayProfileAvatar.src;
            
            editProfileModal.style.display = 'flex';
        });
    }

    if(closeProfileModal && editProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            editProfileModal.style.display = 'none';
        });
    }

    // Handle outside click to close modal
    if(editProfileModal) {
        window.addEventListener('click', (e) => {
            if (e.target === editProfileModal) {
                editProfileModal.style.display = 'none';
            }
        });
    }

    // Avatar upload preview
    if(avatarUpload && editAvatarPreview) {
        avatarUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editAvatarPreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Save profile changes with loading animation
    if(saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            // Add loading state
            saveProfileBtn.classList.add('loading');
            
            // Simulate network request
            setTimeout(() => {
                if (displayProfileHandle) displayProfileHandle.innerText = editProfileHandle.value;
                if (displayProfileDesc) displayProfileDesc.innerText = editProfileDesc.value;
                if (displayProfileAvatar) displayProfileAvatar.src = editAvatarPreview.src;
                
                saveProfileBtn.classList.remove('loading');
                
                // Add fade out animation to modal
                editProfileModal.style.animation = 'overlayFade 0.3s ease reverse forwards';
                editProfileModal.querySelector('.modal-content').style.animation = 'modalEntrance 0.3s ease reverse forwards';
                
                setTimeout(() => {
                    editProfileModal.style.display = 'none';
                    // Reset animations
                    editProfileModal.style.animation = '';
                    editProfileModal.querySelector('.modal-content').style.animation = '';
                }, 300);
                
                // Show premium success toast
                showToast('Профіль успішно оновлено! ✨', 'var(--primary-premium)');
            }, 800);
        });
    }

    // Helper for beautiful toasts
    function showToast(message, color = '#2854C5') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 40px; right: 40px;
            background: white; color: var(--text-premium); padding: 18px 30px;
            border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1);
            font-weight: 700; z-index: 10000; animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border-left: 6px solid ${color}; display: flex; align-items: center; gap: 15px;
        `;
        toast.innerHTML = `<span style="color: ${color}; font-size: 20px;"><i class="fa-solid fa-circle-check"></i></span> ${message}`;
        document.body.appendChild(toast);
        
        // Add keyframes dynamically if not present
        if(!document.getElementById('toastStyles')) {
            const style = document.createElement('style');
            style.id = 'toastStyles';
            style.innerHTML = `
                @keyframes toastSlideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes toastSlideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(120%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    // Enhance Event Action buttons
    const viewBtns = document.querySelectorAll('.view-btn');
    const editBtns = document.querySelectorAll('.edit-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    const learnMoreLinks = document.querySelectorAll('.learn-more');

    learnMoreLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Let the natural href="events.html" handle it, or force it here:
            showToast('Відкриваємо деталі події...', '#00AAFF');
        });
    });

    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Завантаження сторінки події...', '#4B7BEC');
            setTimeout(() => {
                window.location.href = 'events.html';
            }, 500);
        });
    });

    editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Перехід до редагування...', '#10B981');
            setTimeout(() => {
                // Pass edit=true parameter to tell create-event.js to pre-fill data
                window.location.href = 'create-event.html?edit=true';
            }, 500);
        });
    });

    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if(confirm('Ви впевнені, що хочете видалити цю подію? Вона зникне назавжди.')) {
                const eventItem = this.closest('.created-event-item');
                if(eventItem) {
                    eventItem.style.transform = 'scale(0.9) translateY(20px)';
                    eventItem.style.opacity = '0';
                    setTimeout(() => {
                        eventItem.remove();
                        showToast('Подію успішно видалено', '#E84118');
                    }, 400);
                }
            }
        });
    });

    // Logout enhancement
    const logoutBtn = document.querySelector('.logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if(confirm('Ви впевнені, що хочете вийти з акаунту?')) {
                logoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Виходимо...';
                setTimeout(() => window.location.href = 'index.html', 800);
            }
        });
    }
});
