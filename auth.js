// Система авторизации (LocalStorage)

class AuthSystem {
    constructor() {
        this.usersKey = 'dnd_users';
        this.currentUserKey = 'dnd_current_user';
        this.init();
    }

    // Инициализация
    init() {
        // Если нет пользователей в хранилище, создаем тестовых
        if (!localStorage.getItem(this.usersKey)) {
            this.createDefaultUsers();
        }
        
        // Проверяем, авторизован ли пользователь
        this.checkAuthStatus();
    }

    // Создание тестовых пользователей
    createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'master',
                email: 'master@example.com',
                password: 'master123', // В реальном приложении пароли нужно хэшировать!
                userType: 'gm',
                createdAt: new Date().toISOString(),
                characters: []
            },
            {
                id: 2,
                username: 'player1',
                email: 'player1@example.com',
                password: 'player123',
                userType: 'player',
                createdAt: new Date().toISOString(),
                characters: []
            }
        ];
        
        localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
        console.log('Созданы тестовые пользователи:', defaultUsers);
    }

    // Регистрация нового пользователя
    register(userData) {
        const users = this.getUsers();
        
        // Проверка уникальности username и email
        if (users.find(u => u.username === userData.username)) {
            return { success: false, message: 'Имя пользователя уже занято' };
        }
        
        if (users.find(u => u.email === userData.email)) {
            return { success: false, message: 'Email уже используется' };
        }
        
        // Создаем нового пользователя
        const newUser = {
            id: Date.now(), // Простой ID на основе времени
            username: userData.username,
            email: userData.email,
            password: userData.password, // ВНИМАНИЕ: в реальном приложении нужно хэшировать!
            userType: userData.userType || 'player',
            createdAt: new Date().toISOString(),
            characters: [],
            campaigns: []
        };
        
        users.push(newUser);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
        
        // Автоматически входим после регистрации
        this.login(userData.username, userData.password);
        
        return { 
            success: true, 
            message: 'Регистрация успешна!',
            user: newUser 
        };
    }

    // Вход в систему
    login(identifier, password) {
        const users = this.getUsers();
        
        // Ищем пользователя по username или email
        const user = users.find(u => 
            u.username === identifier || u.email === identifier
        );
        
        if (!user) {
            return { success: false, message: 'Пользователь не найден' };
        }
        
        if (user.password !== password) {
            return { success: false, message: 'Неверный пароль' };
        }
        
        // Сохраняем текущего пользователя (без пароля!)
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem(this.currentUserKey, JSON.stringify(userWithoutPassword));
        
        return { 
            success: true, 
            message: 'Вход выполнен успешно',
            user: userWithoutPassword 
        };
    }

    // Выход из системы
    logout() {
        localStorage.removeItem(this.currentUserKey);
        return { success: true, message: 'Выход выполнен' };
    }

    // Получение текущего пользователя
    getCurrentUser() {
        const userJson = localStorage.getItem(this.currentUserKey);
        return userJson ? JSON.parse(userJson) : null;
    }

    // Проверка авторизации
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    // Проверка, является ли пользователь ГМом
    isGM() {
        const user = this.getCurrentUser();
        return user && (user.userType === 'gm' || user.userType === 'both');
    }

    // Получение всех пользователей
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    }

    // Сохранение пользователя
    saveUser(user) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        
        if (index !== -1) {
            users[index] = user;
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            
            // Обновляем текущего пользователя, если это он
            const current = this.getCurrentUser();
            if (current && current.id === user.id) {
                const { password, ...userWithoutPassword } = user;
                localStorage.setItem(this.currentUserKey, JSON.stringify(userWithoutPassword));
            }
        }
    }

    // Добавление персонажа пользователю
    addCharacterToUser(character) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        user.characters = user.characters || [];
        user.characters.push(character);
        
        // Обновляем пользователя в хранилище
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
            users[userIndex].characters = user.characters;
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        }
        
        return true;
    }
    
    // Проверка статуса авторизации и обновление интерфейса
    checkAuthStatus() {
        const user = this.getCurrentUser();
        this.updateUI(user);
        return user;
    }
    
    // Обновление интерфейса в зависимости от авторизации
    updateUI(user) {
        // Находим все элементы для обновления
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(element => {
            const authType = element.getAttribute('data-auth');
            
            switch(authType) {
                case 'show-if-auth':
                    element.style.display = user ? 'block' : 'none';
                    break;
                case 'show-if-not-auth':
                    element.style.display = user ? 'none' : 'block';
                    break;
                case 'username':
                    if (user && element.textContent.includes('{username}')) {
                        element.textContent = element.textContent.replace('{username}', user.username);
                    }
                    break;
                case 'user-type':
                    if (user) {
                        const types = {
                            'player': '🎮 Игрок',
                            'gm': '🎭 Мастер',
                            'both': '⚔️ Игрок и Мастер'
                        };
                        element.textContent = types[user.userType] || user.userType;
                    }
                    break;
            }
        });
    }
}

// Создаем глобальный экземпляр системы авторизации
const auth = new AuthSystem();

// Обработчики форм
document.addEventListener('DOMContentLoaded', function() {
    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Собираем данные
            const userData = {
                username: document.getElementById('username').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                userType: document.getElementById('userType').value
            };
            
            // Валидация
            const errors = validateRegistration(userData);
            if (Object.keys(errors).length > 0) {
                showErrors(errors);
                return;
            }
            
            // Регистрация
            const result = auth.register(userData);
            
            if (result.success) {
                showMessage('Регистрация успешна! Перенаправляем...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, 'error');
            }
        });
    }
    
    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const identifier = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            const result = auth.login(identifier, password);
            
            if (result.success) {
                showMessage('Вход выполнен! Перенаправляем...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                showMessage(result.message, 'error');
            }
        });
    }
    
    // Проверяем авторизацию при загрузке страницы
    auth.checkAuthStatus();
});

// Валидация регистрации
function validateRegistration(userData) {
    const errors = {};
    
    // Username
    if (!userData.username || userData.username.length < 3) {
        errors.username = 'Имя должно быть не менее 3 символов';
    }
    
    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        errors.email = 'Введите корректный email';
    }
    
    // Password
    if (!userData.password || userData.password.length < 6) {
        errors.password = 'Пароль должен быть не менее 6 символов';
    }
    
    // Confirm password
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword && userData.password !== confirmPassword.value) {
        errors.confirmPassword = 'Пароли не совпадают';
    }
    
    // Terms
    const terms = document.getElementById('terms');
    if (terms && !terms.checked) {
        errors.terms = 'Необходимо согласиться с правилами';
    }
    
    return errors;
}

// Показать ошибки
function showErrors(errors) {
    // Очищаем все ошибки
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    
    // Показываем новые ошибки
    for (const [field, message] of Object.entries(errors)) {
        const errorElement = document.getElementById(field + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
}

// Показать сообщение
function showMessage(text, type = 'info') {
    // Удаляем старые сообщения
    const oldMessage = document.querySelector('.message');
    if (oldMessage) oldMessage.remove();
    
    // Создаем новое сообщение
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    
    // Вставляем в форму
    const form = document.querySelector('form');
    if (form) {
        form.prepend(message);
        
        // Автоматически скрываем через 5 секунд
        if (type !== 'error') {
            setTimeout(() => message.remove(), 5000);
        }
    }
}

// Выход из системы
function logout() {
    auth.logout();
    showMessage('Выход выполнен', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Экспортируем для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthSystem, auth };
}
