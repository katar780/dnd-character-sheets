// Логика панели управления
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    const user = auth.getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Заполняем информацию о пользователе
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileUserType').value = user.userType || 'player';
    
    // Загружаем персонажей пользователя
    loadUserCharacters();
    
    // Обновляем статистику
    updateStats();
    
    // Настройка навигации
    setupDashboardNavigation();
    
    // Настройка формы профиля
    setupProfileForm();
});

// Загрузка персонажей пользователя
function loadUserCharacters() {
    const user = auth.getCurrentUser();
    const charactersList = document.getElementById('charactersList');
    
    if (!user || !user.characters || user.characters.length === 0) {
        charactersList.innerHTML = `
            <div class="empty-state">
                <p>У вас пока нет персонажей</p>
                <button onclick="showSection('create-character')">
                    ✨ Создать первого персонажа
                </button>
            </div>
        `;
        return;
    }
    
    let html = '';
    user.characters.forEach((character, index) => {
        const modifier = (score) => Math.floor((score - 10) / 2);
        
        html += `
            <div class="character-card">
                <h3>${character.name || 'Безымянный'}</h3>
                <div class="race-class">
                    ${character.race || 'Неизвестная раса'} • Уровень ${character.level || 1}
                </div>
                
                <div class="character-stats">
                    <div class="stat-item">
                        <span class="stat-value">${character.stats?.strength || 10}</span>
                        <span class="stat-label">Сила (${modifier(character.stats?.strength || 10) >= 0 ? '+' : ''}${modifier(character.stats?.strength || 10)})</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${character.stats?.dexterity || 10}</span>
                        <span class="stat-label">Ловкость (${modifier(character.stats?.dexterity || 10) >= 0 ? '+' : ''}${modifier(character.stats?.dexterity || 10)})</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${character.stats?.constitution || 10}</span>
                        <span class="stat-label">Тело (${modifier(character.stats?.constitution || 10) >= 0 ? '+' : ''}${modifier(character.stats?.constitution || 10)})</span>
                    </div>
                </div>
                
                <div class="character-actions">
                    <button onclick="editCharacter(${index})">✏️ Редактировать</button>
                    <button onclick="deleteCharacter(${index})" class="danger">🗑️ Удалить</button>
                </div>
            </div>
        `;
    });
    
    charactersList.innerHTML = html;
}

// Обновление статистики
function updateStats() {
    const user = auth.getCurrentUser();
    if (user && user.characters) {
        document.getElementById('charactersCount').textContent = user.characters.length;
    }
}

// Настройка навигации dashboard
function setupDashboardNavigation() {
    const menuLinks = document.querySelectorAll('.dashboard-menu a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            
            // Обновляем активные элементы меню
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем выбранную секцию
            showSection(targetId);
        });
    });
    
    // Обработка iframe (форма создания персонажа)
    const iframe = document.querySelector('.character-creator-frame');
    if (iframe) {
        iframe.onload = function() {
            // Когда персонаж создан в iframe, обновляем список
            try {
                iframe.contentWindow.addEventListener('characterCreated', function() {
                    loadUserCharacters();
                    updateStats();
                    showSection('characters');
                });
            } catch(e) {
                // Cross-origin ограничения
                console.log('Не удалось настроить связь с iframe');
            }
        };
    }
}

// Показать секцию
function showSection(sectionId) {
    // Скрываем все секции
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Обновляем меню
    document.querySelectorAll('.dashboard-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Настройка формы профиля
function setupProfileForm() {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;
    
    profileForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const user = auth.getCurrentUser();
        if (!user) return;
        
        const newEmail = document.getElementById('profileEmail').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        let hasChanges = false;
        
        // Обновляем email, если изменился
        if (newEmail && newEmail !== user.email) {
            user.email = newEmail;
            hasChanges = true;
        }
        
        // Смена пароля
        if (currentPassword && newPassword) {
            if (newPassword !== confirmPassword) {
                alert('Новые пароли не совпадают!');
                return;
            }
            
            // В реальном приложении здесь должна быть проверка текущего пароля
            // и хэширование нового пароля
            user.password = newPassword; // ВНИМАНИЕ: нужно хэшировать!
            hasChanges = true;
            
            // Очищаем поля паролей
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        }
        
        // Сохраняем изменения
        if (hasChanges) {
            auth.saveUser(user);
            alert('Изменения сохранены!');
        } else {
            alert('Нет изменений для сохранения');
        }
    });
}

// Редактирование персонажа
function editCharacter(index) {
    const user = auth.getCurrentUser();
    if (!user || !user.characters[index]) return;
    
    const character = user.characters[index];
    alert(`Редактирование персонажа: ${character.name}\n\nЭтот функционал будет добавлен в следующем обновлении.`);
    // В будущем здесь будет открытие формы редактирования
}

// Удаление персонажа
function deleteCharacter(index) {
    if (!confirm('Вы уверены, что хотите удалить этого персонажа?')) {
        return;
    }
    
    const user = auth.getCurrentUser();
    if (!user || !user.characters) return;
    
    user.characters.splice(index, 1);
    auth.saveUser(user);
    
    loadUserCharacters();
    updateStats();
    alert('Персонаж удален');
}

// Событие создания персонажа (вызывается из character-create.html)
window.addEventListener('characterCreated', function(e) {
    if (e.detail && e.detail.character) {
        loadUserCharacters();
        updateStats();
        showSection('characters');
    }
});
