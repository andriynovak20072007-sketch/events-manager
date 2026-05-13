document.addEventListener('DOMContentLoaded', () => {
  // 1. Image Upload Preview
  const imageUploadInput = document.getElementById('event-image');
  const imageUploadWrapper = document.querySelector('.image-upload-wrapper');
  const imagePlaceholder = document.querySelector('.image-placeholder');

  if (imageUploadInput) {
    imageUploadInput.addEventListener('change', function(e) {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        
        // Ensure it's an image
        if (!file.type.match('image.*')) {
          alert('Будь ласка, оберіть фото');
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          // Set background
          imageUploadWrapper.style.backgroundImage = `url('${e.target.result}')`;
          imageUploadWrapper.style.backgroundSize = 'cover';
          imageUploadWrapper.style.backgroundPosition = 'center';
          imageUploadWrapper.style.borderStyle = 'solid';
          
          // Hide placeholder text/icon
          imagePlaceholder.style.opacity = '0';
          
          // Slight style adjustment
          imageUploadWrapper.classList.add('has-image');
        }
        reader.readAsDataURL(file);
      }
    });
  }

  // Map Initialization Variables
  let locationMap = null;
  let locationMarker = null;

  // 2. Pill Buttons Logic (Expand details)
  const pillBtns = document.querySelectorAll('.pill-btn');
  pillBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      if (targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          // Toggle visibility
          if (targetElement.style.display === 'none' || targetElement.classList.contains('hidden')) {
            targetElement.style.display = 'block';
            targetElement.classList.remove('hidden');
            
            // Mark button as active (darker color to indicate it's open)
            this.style.backgroundColor = '#00AAFF';
            this.style.color = 'white';
            this.style.borderColor = '#00AAFF';
            const icon = this.querySelector('i');
            if (icon) icon.style.color = 'white';

            // Init map if it's the location group
            if (targetId === 'location-group' && !locationMap) {
              setTimeout(() => {
                locationMap = L.map('location-map').setView([48.3794, 31.1656], 5); // Ukraine center
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(locationMap);

                locationMap.on('click', async function(e) {
                  const lat = e.latlng.lat;
                  const lng = e.latlng.lng;
                  if (locationMarker) {
                    locationMarker.setLatLng(e.latlng);
                  } else {
                    locationMarker = L.marker(e.latlng).addTo(locationMap);
                  }
                  
                  // Reverse geocoding
                  try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=uk`);
                    const data = await response.json();
                    if(data && data.display_name) {
                      const locInput = document.getElementById('event-location');
                      const displayName = data.display_name.split(',').slice(0, 3).join(',');
                      if(locInput) locInput.value = displayName;
                    }
                  } catch(err) { console.error(err); }
                });
              }, 100);
            }
          } else {
            targetElement.style.display = 'none';
            targetElement.classList.add('hidden');
            
            // Revert button
            this.style.backgroundColor = '';
            this.style.color = '';
            this.style.borderColor = '';
            const icon = this.querySelector('i');
            if (icon) icon.style.color = '';
          }
        }
      }
    });
  });

  // 3. Main Form Submit
  const createForm = document.querySelector('.create-event-form');
  const submitBtn = document.querySelector('.large-blue');
  /*
  ТАСК 64: Інтеграція email-сповіщень із подіями
  ПАТЕРН: Facade
  Одна функція приховує всю логіку створення email-нагадування.
  */
  async function createEmailReminderForEvent(eventId) {
    const response = await fetch('http://localhost:5000/api/notifications/reminders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_id: eventId,
        user_id: 1,
        type: '1h',
        channel: 'email'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || 'Не вдалося створити email-нагадування');
    }

    return response.json();
  }
  
  if (createForm) {
      createForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Simple validation check
      const eventName = document.querySelector('input[placeholder="Назва події"]');
      if (!eventName || !eventName.value.trim()) {
        alert('Будь ласка, вкажіть назву події');
        return;
      }

      // Change button state to simulate loading
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Відправляємо...';
      submitBtn.style.opacity = '0.8';
      submitBtn.disabled = true;

      
      setTimeout(async () => {
        try {
        const isEditMode = new URLSearchParams(window.location.search).get('id');
        
       /*
      ТАСК 63: Інтеграція календаря з подіям
      Подія відправляється в API, зберігається в БД,
      а календар потім отримує її через /api/events.
      */
      const eventTitle = document.getElementById('event-title').value.trim();
      const eventDescription = document.getElementById('event-description')?.value.trim() || 'Опис події відсутній';
      const eventLocationValue = document.getElementById('event-location')?.value.trim() || '';

      const startDateTime = document.getElementById('event-date-time')?.value;
      const endDateTime = document.getElementById('event-end-date-time')?.value;

      if (!startDateTime) {
        alert('Вкажіть дату та час початку події');
        submitBtn.innerHTML = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
        return;
      }

      if (!endDateTime) {
        alert('Вкажіть дату та час завершення події');
        submitBtn.innerHTML = originalText;
        submitBtn.style.opacity = '1';
        submitBtn.disabled = false;
        return;
      }

      const eventDay = startDateTime.split('T')[0];
      const startTime = startDateTime.split('T')[1];
      const endTime = endDateTime.split('T')[1];

      const visibility = document.querySelector('input[name="eventVisibility"]:checked')?.value || 'public';

      const categoryValue = document.getElementById('event-category')?.value;

      const categoryMap = {
        concert: 1,
        festival: 2,
        education: 3,
        sport: 4
      };
      
      const eventPayload = {
        title: eventTitle,
        description: eventDescription,
        event_day: eventDay,
        start_time: startTime,
        end_time: endTime,
        latitude: null,
        longitude: null,
        category_id: categoryMap[categoryValue] || null,
        creator_id: 1,
        region: eventLocationValue,
        is_private: visibility === 'private',
        price: Number(document.getElementById('ticket-price')?.value || 0),
        currency: 'UAH'
      };

      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Не вдалося створити подію');
      }

      const createdEvent = await response.json();
      /*
      ТАСК 64: Інтеграція email-сповіщень із подіями
      Після створення події автоматично створюється email-нагадування
      */
      try {
        await createEmailReminderForEvent(createdEvent.event_id);
        console.log('Email-нагадування успішно створено');
      } catch (emailError) {
        /*
        ТАСК 64: Обробка помилок відправки email
        Якщо нагадування не створилось, подія все одно залишається створеною,
        але користувач отримує повідомлення про помилку email.
        */
        console.error('Помилка email-нагадування:', emailError);
        alert('Подію створено, але email-нагадування не вдалося налаштувати');
      }
      console.log('Подію створено в БД:', createdEvent);

        submitBtn.innerHTML = isEditMode ? '<i class="fa-solid fa-check"></i> Зміни збережено!' : '<i class="fa-solid fa-check"></i> Успішно відправлено!';
        submitBtn.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
        submitBtn.style.boxShadow = '0 4px 14px 0 rgba(16, 185, 129, 0.39)';
        submitBtn.style.opacity = '1';
        
        // Reset form after a few seconds
        setTimeout(() => {
          createForm.reset();
          imageUploadWrapper.style.backgroundImage = 'none';
          imagePlaceholder.style.opacity = '1';
          imageUploadWrapper.style.borderStyle = '';
          
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.style.boxShadow = '';
          submitBtn.disabled = false;
          
          // Hide all dynamic sections and revert pills
          document.querySelectorAll('.dynamic-group').forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
          });
          pillBtns.forEach(btn => {
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            const icon = btn.querySelector('i');
            if (icon) icon.style.color = '';
          });
          
          alert(isEditMode ? 'Зміни до події успішно збережено!' : 'Подію успішно надіслано на модерацію!');
        }, 2000);
        } catch (error) {
          console.error('Помилка створення події:', error);

          alert(error.message || 'Сталася помилка при створенні події');

          submitBtn.innerHTML = originalText;
          submitBtn.style.opacity = '1';
          submitBtn.disabled = false;
        }
      }, 1500);
    });
  }

  // 4. Location Autocomplete (Nominatim API)
  const locationInput = document.getElementById('event-location');
  const suggestionsList = document.getElementById('location-suggestions');
  let debounceTimer;

  if (locationInput && suggestionsList) {
    locationInput.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      const query = this.value.trim();
      
      if (query.length < 3) {
        suggestionsList.style.display = 'none';
        suggestionsList.innerHTML = '';
        return;
      }

      // Show small loading indicator in input if wanted, or just fetch
      debounceTimer = setTimeout(async () => {
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=ua&limit=5&q=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          suggestionsList.innerHTML = '';
          
          if (data && data.length > 0) {
            data.forEach(place => {
              const li = document.createElement('li');
              // Format place name slightly prettier
              const displayName = place.display_name.split(',').slice(0, 3).join(',');
              li.textContent = displayName;
              li.addEventListener('click', () => {
                locationInput.value = displayName;
                suggestionsList.style.display = 'none';
                
                if (locationMap && place.lat && place.lon) {
                  const latlng = [place.lat, place.lon];
                  locationMap.setView(latlng, 13);
                  if (locationMarker) {
                    locationMarker.setLatLng(latlng);
                  } else {
                    locationMarker = L.marker(latlng).addTo(locationMap);
                  }
                }
              });
              suggestionsList.appendChild(li);
            });
            suggestionsList.style.display = 'block';
          } else {
            suggestionsList.style.display = 'none';
          }
        } catch (error) {
          console.error("Помилка автозаповнення:", error);
        }
      }, 500); // 500ms debounce
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!locationInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.style.display = 'none';
      }
    });
  }

  // 5. Invitations (Email Tags)
  const inviteInput = document.getElementById('invite-input');
  const emailTagsContainer = document.getElementById('email-tags');

  if (inviteInput && emailTagsContainer) {
    inviteInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
        e.preventDefault();
        const email = this.value.trim().replace(',', '');
        
        if (email && email.includes('@')) { // Basic email validation
          const tag = document.createElement('div');
          tag.className = 'email-tag';
          tag.innerHTML = `${email} <i class="fa-solid fa-xmark"></i>`;
          
          tag.querySelector('i').addEventListener('click', () => {
            tag.remove();
          });
          
          emailTagsContainer.appendChild(tag);
          this.value = '';
        }
      }
    });
  }

  // 6. Tickets Builder
  const ticketName = document.getElementById('ticket-name');
  const ticketPrice = document.getElementById('ticket-price');
  const addTicketBtn = document.getElementById('add-ticket-btn');
  const ticketsList = document.getElementById('tickets-list');

  if (addTicketBtn && ticketName && ticketPrice && ticketsList) {
    addTicketBtn.addEventListener('click', function() {
      const name = ticketName.value.trim();
      const price = ticketPrice.value.trim();
      
      if (name && price !== '') {
        const ticketItem = document.createElement('div');
        ticketItem.className = 'ticket-item';
        
        ticketItem.innerHTML = `
          <div class="ticket-info">
            <strong>${name}</strong>
            <span>${price} ₴</span>
          </div>
          <button type="button" class="delete-ticket-btn"><i class="fa-regular fa-trash-can"></i></button>
        `;
        
        ticketItem.querySelector('.delete-ticket-btn').addEventListener('click', () => {
          ticketItem.remove();
        });
        
        ticketsList.appendChild(ticketItem);
        
        // Reset inputs
        ticketName.value = '';
        ticketPrice.value = '';
        ticketName.focus();
      }
    });
    
    // Allow pressing enter on price to add
    ticketPrice.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTicketBtn.click();
      }
    });
  } // <-- THIS WAS MISSING!

  // 8. Event Gallery Logic
  const galleryInput = document.getElementById('gallery-images');
  const galleryPreview = document.getElementById('gallery-preview');
  let selectedGalleryFiles = [];
  
  if (galleryInput && galleryPreview) {
    galleryInput.addEventListener('change', function() {
      if (this.files) {
        Array.from(this.files).forEach(file => {
          if (file.type.match('image.*')) {
            selectedGalleryFiles.push(file);
            
            const reader = new FileReader();
            reader.onload = function(e) {
              const thumb = document.createElement('div');
              thumb.className = 'gallery-thumb';
              thumb.style.backgroundImage = `url('${e.target.result}')`;
              
              const removeBtn = document.createElement('div');
              removeBtn.className = 'gallery-thumb-remove';
              removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
              removeBtn.onclick = () => {
                thumb.remove();
                selectedGalleryFiles = selectedGalleryFiles.filter(f => f !== file);
              };
              
              thumb.appendChild(removeBtn);
              galleryPreview.appendChild(thumb);
            };
            reader.readAsDataURL(file);
          }
        });
        // Reset so same file can be chosen again
        this.value = '';
      }
    });
  }

  // ==========================================
  // 9. EDIT EVENT MODE LOGIC
  // ==========================================
  const urlParams = new URLSearchParams(window.location.search);
  const editEventId = urlParams.get('id');

  if (editEventId) {
    // 9.1 Set Page Titles to Edit Mode
    const pageTitle = document.getElementById('page-main-title');
    if (pageTitle) pageTitle.textContent = 'Редагувати подію';
    
    const submitEventBtn = document.getElementById('submit-event-btn');
    if (submitEventBtn) submitEventBtn.innerHTML = 'Зберегти зміни <i class="fa-solid fa-arrow-right"></i>';

    const submitWrapper = document.querySelector('.submit-wrapper');
    if (submitWrapper && !document.getElementById('delete-event-btn')) {
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.id = 'delete-event-btn';
      deleteBtn.className = 'large-blue';
      deleteBtn.style.background = '#EF4444';
      deleteBtn.style.boxShadow = '0 4px 14px 0 rgba(239, 68, 68, 0.39)';
      deleteBtn.style.marginLeft = '15px';
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Видалити подію';
      deleteBtn.onclick = function() {
        if(confirm('Ви впевнені, що хочете видалити цю подію?')) {
          // Remove from localStorage
          const isEditMode = new URLSearchParams(window.location.search).get('id');
          if (isEditMode) {
              const events = JSON.parse(localStorage.getItem('myEvents') || '[]');
              const filteredEvents = events.filter(e => e.id !== isEditMode);
              localStorage.setItem('myEvents', JSON.stringify(filteredEvents));
          }
          alert('Подію успішно видалено!');
          window.location.href = 'index.html';
        }
      };
      submitWrapper.appendChild(deleteBtn);
      submitWrapper.style.display = 'flex';
    }

    // 9.2 Mock Data (Simulate fetching from DB)
    const mockEventData = {
      fest1: {
          id: "fest1",
          title: "Фестиваль \"Summer Fest\"",
          description: "Найкращий літній фестиваль з живою музикою та розвагами для всієї родини! Чекаємо всіх.",
          coverImage: "images/fest1.png",
          gallery: ["images/event-1.webp", "images/event-3.jpg"],
          date: "2026-04-28",
          time: "18:00",
          city: "Львів, Стадіон \"Прайм\"",
          lat: 49.8500,
          lng: 24.0300,
          category: "Музика / Фестиваль",
          emails: ["vip@example.com", "press@summerfest.ua"],
          tickets: [
            { name: "Стандарт", price: 500 },
            { name: "VIP", price: 1500 }
          ]
      },
      codex1: {
          id: "codex1",
          title: "ІТ Конференція \"CodeX\"",
          description: "Наймасштабніша подія для розробників. Доповіді, нетворкінг, воркшопи.",
          coverImage: "images/codeX.png",
          gallery: [],
          date: "2026-05-15",
          time: "10:00",
          city: "Київ, КВЦ Парковий",
          lat: 50.4501,
          lng: 30.5234,
          category: "Освіта / Бізнес",
          emails: ["info@codex.com.ua"],
          tickets: [
            { name: "Онлайн", price: 300 },
            { name: "Офлайн", price: 1200 }
          ]
      }
    };

    const currentMock = mockEventData[editEventId];

    // If ID matches our mock (or just load it for demo purposes)
    if (currentMock) {
      setTimeout(() => {
        // structural text
        const titleInput = document.getElementById('event-title');
        const descInput = document.getElementById('event-description');
        if (titleInput) titleInput.value = currentMock.title;
        if (descInput) descInput.value = currentMock.description;

        // Image background
        if (imageUploadWrapper && currentMock.coverImage) {
            imageUploadWrapper.style.backgroundImage = `url('${currentMock.coverImage}')`;
            imageUploadWrapper.style.backgroundSize = 'cover';
            imageUploadWrapper.style.backgroundPosition = 'center';
            imageUploadWrapper.style.borderStyle = 'solid';
            if (imagePlaceholder) imagePlaceholder.style.opacity = '0';
            imageUploadWrapper.classList.add('has-image');
        }

        // Open Date/Location/Tickets etc tabs using data-targets
        const groupsToOpen = ['date-group', 'location-group', 'category-group'];
        pillBtns.forEach(btn => {
           if (groupsToOpen.includes(btn.getAttribute('data-target'))) {
             btn.click(); // Programmatically open details blocks
           }
        });

        // Date and Time
        const dateInput = document.querySelector('input[type="date"]');
        const timeInput = document.querySelector('input[type="time"]');
        if (dateInput) dateInput.value = currentMock.date;
        if (timeInput) timeInput.value = currentMock.time;

        // Location text
        const locInput = document.getElementById('event-location');
        if (locInput) locInput.value = currentMock.city;

        // Note: Map click automatically rendered
        if (locationMap) {
            const hLatLng = [currentMock.lat, currentMock.lng];
            locationMap.setView(hLatLng, 14);
            setTimeout(() => {
                 locationMap.invalidateSize(); // Fix map render issue inside hidden div
                 if (!locationMarker) {
                     locationMarker = L.marker(hLatLng).addTo(locationMap);
                 } else {
                     locationMarker.setLatLng(hLatLng);
                 }
            }, 300);
        }

        // Invitations
        if (emailTagsContainer && currentMock.emails) {
            currentMock.emails.forEach(email => {
                const tag = document.createElement('div');
                tag.className = 'email-tag';
                tag.innerHTML = `${email} <i class="fa-solid fa-xmark"></i>`;
                tag.querySelector('i').addEventListener('click', () => tag.remove());
                emailTagsContainer.appendChild(tag);
            });
        }

        // Tickets
        if (ticketsList && currentMock.tickets) {
            currentMock.tickets.forEach(ticket => {
                const ticketItem = document.createElement('div');
                ticketItem.className = 'ticket-item';
                ticketItem.innerHTML = `
                  <div class="ticket-info">
                    <strong>${ticket.name}</strong>
                    <span>${ticket.price} ₴</span>
                  </div>
                  <button type="button" class="delete-ticket-btn"><i class="fa-regular fa-trash-can"></i></button>
                `;
                ticketItem.querySelector('.delete-ticket-btn').addEventListener('click', () => ticketItem.remove());
                ticketsList.appendChild(ticketItem);
            });
        }

        // Gallery
        if (galleryPreview && currentMock.gallery) {
            currentMock.gallery.forEach(img => {
                const thumb = document.createElement('div');
                thumb.className = 'gallery-thumb';
                thumb.style.backgroundImage = `url('${img}')`;
                const removeBtn = document.createElement('div');
                removeBtn.className = 'gallery-thumb-remove';
                removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                removeBtn.onclick = () => thumb.remove();
                thumb.appendChild(removeBtn);
                galleryPreview.appendChild(thumb);
            });
        }
      }, 500); // Slight delay for UI elements to be attached
    }
  }
  // ==========================================
  // 10. DESIGN CONSTRUCTOR LOGIC (PRO FEATURE)
  // ==========================================
  const colorPicker = document.getElementById('button-color-picker');
  const colorValue = document.getElementById('color-value');
  const themeBtns = document.querySelectorAll('.theme-btn');
  const bannerInput = document.getElementById('event-banner');
  const bannerUploadBox = document.getElementById('banner-upload-area');
  const lockOverlays = document.querySelectorAll('.lock-overlay');

  // Check user role (Simulation - in real app would check session/token)
  const userRole = localStorage.getItem('userRole') || 'free'; // 'free' or 'pro'
  if (userRole !== 'pro') {
    lockOverlays.forEach(overlay => {
      overlay.style.display = 'flex';
      overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Цей функціонал доступний лише для користувачів з тарифом PRO. Перейдіть на сторінку тарифів, щоб оновити аккаунт.');
        window.location.href = 'pricing.html';
      });
    });
  }

  // Color Picker
  if (colorPicker && colorValue) {
    colorPicker.addEventListener('input', (e) => {
      colorValue.textContent = e.target.value.toUpperCase();
    });
  }

  // Theme Toggle
  if (themeBtns) {
    themeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        if (userRole !== 'pro') return;
        themeBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  // Banner Upload Preview
  if (bannerInput && bannerUploadBox) {
    bannerUploadBox.addEventListener('click', () => {
      if (userRole === 'pro') bannerInput.click();
    });

    bannerInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          bannerUploadBox.style.backgroundImage = `url('${e.target.result}')`;
          bannerUploadBox.style.backgroundSize = 'cover';
          bannerUploadBox.style.backgroundPosition = 'center';
          bannerUploadBox.style.borderStyle = 'solid';
          bannerUploadBox.querySelector('i').style.display = 'none';
          bannerUploadBox.querySelector('span').style.display = 'none';
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }

  // Update submit logic to include design data
  const originalSubmitHandler = createForm.onsubmit;
  createForm.addEventListener('submit', function(e) {
    // Collect design data
    const designData = {
      buttonColor: colorPicker.value,
      theme: document.querySelector('.theme-btn.active').getAttribute('data-theme'),
      hasCustomBanner: !!bannerInput.files.length
    };
    console.log('Design Data:', designData);
    // Design data would be sent to server here
  });
});
