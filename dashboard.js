// dashboard.js - ЛОГИКА ПАНЕЛИ УПРАВЛЕНИЯ
console.log('dashboard.js загружен');

let currentUser = null;
let userData = null;

// Инициализация панели
async function initDashboard() {
    console.log('Инициализация панели...');
    
    // Проверяем авторизацию
    firebase.auth().onAuthStateChanged(async function(user) {
        if (!user) {
            // Не авторизован - редирект на логин
            console.log('Не авторизован, редирект на login.html');
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = user;
        console.log('Пользователь:', user.email, 'UID:', user.uid);
        
        // Загружаем данные пользователя из Firestore
        await loadUserData();
        
        // Обновляем UI
        updateUserInfo();
        loadUserStats();
        loadCharacters();
        
        // Настраиваем обработчики
        setupEventListeners();
    });
}

// Загрузка данных пользователя из Firestore
async function loadUserData() {
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log('Данные пользователя загружены:', userData);
        } else {
            console.log('Документ пользователя не найден, создаем...');
            // Создаем документ если его нет
            userData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || currentUser.email.split('@')[0],
                accountType: 'basic',
                level: 1,
                xp: 0,
                characters: [],
                createdAt: new Date()
            };
            
            await db.collection('users').doc(currentUser.uid).set(userData);
        }
        
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        // Используем базовые данные
        userData = {
            displayName: currentUser.displayName || currentUser.email.split('@')[0],
            accountType: 'basic',
            level: 1,
            xp: 0,
            characters: []
        };
    }
}

// Обновление информации о пользователе в UI
function updateUserInfo() {
    // Имя пользователя
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = userData.displayName || currentUser.displayName || currentUser.email;
    }
    
    // Email
    const userEmailElement = document.getElementById('userEmail');
    if (userEmailElement) {
        userEmailElement.textContent = currentUser.email;
    }
    
    // Уровень
    const userLevelElement = document.getElementById('userLevel');
    if (userLevelElement) {
        userLevelElement.textContent = `Уровень: ${userData.level || 1}`;
    }
    
    // ID пользователя
    const userIdElement = document.getElementById('userId');
    if (userIdElement) {
        userIdElement.textContent = currentUser.uid.substring(0, 8) + '...';
    }
    
    // Приветственное сообщение
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        const hour = new Date().getHours();
        let greeting = 'Добрый день';
        
        if (hour < 6) greeting = 'Доброй ночи';
        else if (hour < 12) greeting = 'Доброе утро';
        else if (hour < 18) greeting = 'Добрый день';
        else greeting = 'Добрый вечер';
        
        welcomeMessage.textContent = `${greeting}, ${userData.displayName || 'Искатель приключений'}!`;
    }
    
    // Аватар
    const userAvatar = document.getElementById('userAvatar');
    if (userAvatar && currentUser.photoURL) {
        userAvatar.innerHTML = `<img src="${currentUser.photoURL}" alt="Аватар" style="width:100%;height:100%;border-radius:50%;">`;
    } else if (userAvatar) {
        // Используем первую букву имени
        const name = userData.displayName || currentUser.email;
        const firstLetter = name.charAt(0).toUpperCase();
        userAvatar.textContent = firstLetter;
        userAvatar.style.background = getRandomGradient();
    }
}

// Загрузка статистики
async function loadUserStats() {
    try {
        // Количество персонажей
        const charactersCount = userData.characters ? userData.characters.length : 0;
        
        // Обновляем UI
        document.getElementById('totalCharacters').textContent = charactersCount;
        document.getElementById('charCountBadge').textContent = charactersCount;
        
        document.getElementById('userLevelNumber').textContent = userData.level || 1;
        document.getElementById('userXP').textContent = `${userData.xp || 0}/100`;
        
        // Дней в системе
        if (userData.createdAt) {
            const createdDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
            const daysInSystem = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
            document.getElementById('daysInSystem').textContent = `${daysInSystem} дн.`;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

// Загрузка персонажей
async function loadCharacters() {
    const charactersList = document.getElementById('charactersList');
    if (!charactersList) return;
    
    try {
        // Получаем персонажей пользователя
        const charactersSnapshot = await db.collection('characters')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        if (charactersSnapshot.empty) {
            charactersList.innerHTML = `
                <div class="empty-state">
                    <p>У вас еще нет персонажей</p>
                    <a href="character-create.html" class="btn btn-primary">
                        Создать первого персонажа
                    </a>
                </div>
            `;
            return;
        }
        
        let html = '<div class="characters-grid">';
        
        charactersSnapshot.forEach(doc => {
            const char = doc.data();
            html += `
                <div class="character-card">
                    <div class="character-avatar">${getClassEmoji(char.class)}</div>
                    <div class="character-info">
                        <h4>${char.name}</h4>
                        <p>${char.race} • ${char.class}</p>
                        <p class="character-level">Уровень ${char.level || 1}</p>
                    </div>
                    <div class="character-actions">
                        <button class="btn-small" onclick="viewCharacter('${doc.id}')">👁️</button>
                        <button class="btn-small" onclick="editCharacter('${doc.id}')">✏️</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        charactersList.innerHTML = html;
        
    } catch (error) {
        console.error('Ошибка загрузки персонажей:', error);
        charactersList.innerHTML = `
            <div class="error-state">
                <p>Ошибка загрузки персонажей</p>
                <button onclick="loadCharacters()" class="btn btn-secondary">Повторить</button>
            </div>
        `;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Кнопка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Кнопка обновления
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Ссы
