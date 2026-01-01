// Обертка для совместимости со старым кодом

let authSystem = null;

// Инициализация системы авторизации
function initAuthSystem() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log('Используем Firebase авторизацию');
        authSystem = {
            // Регистрация
            register: async function(userData) {
                if (!firebaseAuth) {
                    console.error('FirebaseAuth не инициализирован');
                    return { success: false, message: 'Система авторизации не готова' };
                }
                
                const result = await firebaseAuth.register(userData);
                
                if (result.success) {
                    // Ждем загрузки данных пользователя
                    await new Promise(resolve => {
                        const handler = () => {
                            window.removeEventListener('userDataLoaded', handler);
                            resolve();
                        };
                        window.addEventListener('userDataLoaded', handler);
                        setTimeout(resolve, 2000);
                    });
                }
                
                return result;
            },
            
            // Вход
            login: async function(identifier, password) {
                if (!firebaseAuth) {
                    console.error('FirebaseAuth не инициализирован');
                    return { success: false, message: 'Система авторизации не готова' };
                }
                
                const result = await firebaseAuth.loginWithIdentifier(identifier, password);
                
                if (result.success) {
                    // Ждем загрузки данных пользователя
                    await new Promise(resolve => {
                        const handler = () => {
                            window.removeEventListener('userDataLoaded', handler);
                            resolve();
                        };
                        window.addEventListener('userDataLoaded', handler);
                        setTimeout(resolve, 2000);
                    });
                }
                
                return result;
            },
            
            // Выход
            logout: async function() {
                if (firebaseAuth) {
                    return await firebaseAuth.logout();
                }
                return { success: true, message: 'Выход выполнен' };
            },
            
            // Текущий пользователь
            getCurrentUser: function() {
                const userData = localStorage.getItem('firebase_user_data');
                return userData ? JSON.parse(userData) : null;
            },
            
            // Проверка авторизации
            isAuthenticated: function() {
                return this.getCurrentUser() !== null;
            },
            
            // Проверка ГМа
            isGM: function() {
                const user = this.getCurrentUser();
                return user && (user.userType === 'gm' || user.userType === 'both');
            },
            
            // Получение персонажей
            getUserCharacters: async function() {
                if (firebaseAuth) {
                    return await firebaseAuth.getUserCharacters();
                }
                return [];
            },
            
            // Создание персонажа
            createCharacter: async function(characterData) {
                if (firebaseAuth) {
                    return await firebaseAuth.createCharacter(characterData);
                }
                return { success: false, message: 'Система не готова' };
            }
        };
    } else {
        console.log('Firebase недоступен, используем LocalStorage fallback');
        authSystem = new LocalStorageAuthSystem();
    }
}

// Fallback система на LocalStorage (на случай проблем с Firebase)
class LocalStorageAuthSystem {
    constructor() {
        this.usersKey = 'dnd_users_fallback';
        this.currentUserKey = 'dnd_current_user_fallback';
        this.init();
    }
    
    init() {
        if (!localStorage.getItem(this.usersKey)) {
            this.createDefaultUsers();
        }
    }
    
    createDefaultUsers() {
        const defaultUsers = [
            {
                id: 1,
                username: 'Master',
                email: 'master@dnd.com',
                password: 'master123',
                userType: 'gm',
                characters: []
            }
        ];
        localStorage.setItem(this.usersKey, JSON.stringify(defaultUsers));
    }
    
    register(userData) {
        const users = this.getUsers();
        
        if (users.find(u => u.username === userData.username)) {
            return { success: false, message: 'Имя пользователя уже занято' };
        }
        
        const newUser = {
            id: Date.now(),
            ...userData,
            characters: []
        };
        
        users.push(newUser);
        localStorage.setItem(this.usersKey, JSON.stringify(users));
        
        // Автоматический вход
        const { password, ...userWithoutPassword } = newUser;
        localStorage.setItem(this.currentUserKey, JSON.stringify(userWithoutPassword));
        
        return { success: true, user: userWithoutPassword };
    }
    
    login(identifier, password) {
        const users = this.getUsers();
        const user = users.find(u => 
            u.username === identifier || u.email === identifier
        );
        
        if (!user || user.password !== password) {
            return { success: false, message: 'Неверные данные' };
        }
        
        const { password: _, ...userWithoutPassword } = user;
        localStorage.setItem(this.currentUserKey, JSON.stringify(userWithoutPassword));
        
        return { success: true, user: userWithoutPassword };
    }
    
    logout() {
        localStorage.removeItem(this.currentUserKey);
        return { success: true, message: 'Выход выполнен' };
    }
    
    getCurrentUser() {
        const userJson = localStorage.getItem(this.currentUserKey);
        return userJson ? JSON.parse(userJson) : null;
    }
    
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }
    
    isGM() {
        const user = this.getCurrentUser();
        return user && (user.userType === 'gm' || user.userType === 'both');
    }
    
    getUsers() {
        return JSON.parse(localStorage.getItem(this.usersKey) || '[]');
    }
    
    async getUserCharacters() {
        const user = this.getCurrentUser();
        return user?.characters || [];
    }
    
    async createCharacter(characterData) {
        const user = this.getCurrentUser();
        if (!user) return { success: false, message: 'Не авторизован' };
        
        const character = {
            id: Date.now(),
            ...characterData,
            userId: user.id
        };
        
        user.characters = user.characters || [];
        user.characters.push(character);
        
        // Обновляем пользователя
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
            users[index].characters = user.characters;
            localStorage.setItem(this.usersKey, JSON.stringify(users));
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        }
        
        return { success: true, character: character };
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Ждем загрузки Firebase
    setTimeout(() => {
        initAuthSystem();
        console.log('Система авторизации инициализирована:', authSystem ? 'Готово' : 'Ошибка');
    }, 1000);
});

// Экспортируем для использования в других файлах
const auth = {
    register: async (userData) => {
        if (!authSystem) initAuthSystem();
        return await authSystem.register(userData);
    },
    login: async (identifier, password) => {
        if (!authSystem) initAuthSystem();
        return await authSystem.login(identifier, password);
    },
    logout: async () => {
        if (!authSystem) initAuthSystem();
        return await authSystem.logout();
    },
    getCurrentUser: () => {
        if (!authSystem) initAuthSystem();
        return authSystem.getCurrentUser();
    },
    isAuthenticated: () => {
        if (!authSystem) initAuthSystem();
        return authSystem.isAuthenticated();
    },
    isGM: () => {
        if (!authSystem) initAuthSystem();
        return authSystem.isGM();
    },
    getUserCharacters: async () => {
        if (!authSystem) initAuthSystem();
        return await authSystem.getUserCharacters();
    },
    createCharacter: async (characterData) => {
        if (!authSystem) initAuthSystem();
        return await authSystem.createCharacter(characterData);
    }
};

// Обработчики форм (оставляем старые для совместимости)
document.addEventListener('DOMContentLoaded', function() {
    // Форма регистрации
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userData = {
                username: document.getElementById('username').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                userType: document.getElementById('userType')?.value || 'player'
            };
            
            const errors = validateRegistration(userData);
            if (Object.keys(errors).length > 0) {
                showErrors(errors);
                return;
            }
            
            const result = await auth.register(userData);
            
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
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const identifier = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            const result = await auth.login(identifier, password);
            
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
});

// Вспомогательные функции (оставляем старые)
function validateRegistration(userData) {
    const errors = {};
    
    if (!userData.username || userData.username.length < 3) {
        errors.username = 'Имя должно быть не менее 3 символов';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        errors.email = 'Введите корректный email';
    }
    
    if (!userData.password || userData.password.length < 6) {
        errors.password = 'Пароль должен быть не менее 6 символов';
    }
    
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword && userData.password !== confirmPassword.value) {
        errors.confirmPassword = 'Пароли не совпадают';
    }
    
    const terms = document.getElementById('terms');
    if (terms && !terms.checked) {
        errors.terms = 'Необходимо согласиться с правилами';
    }
    
    return errors;
}

function showErrors(errors) {
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
    
    for (const [field, message] of Object.entries(errors)) {
        const errorElement = document.getElementById(field + 'Error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
}

function showMessage(text, type = 'info') {
    const oldMessage = document.querySelector('.message');
    if (oldMessage) oldMessage.remove();
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.textContent = text;
    message.style.cssText = 'padding: 1rem; margin: 1rem 0; border-radius: 5px;';
    
    if (type === 'success') {
        message.style.background = 'rgba(46, 204, 113, 0.2)';
        message.style.border = '1px solid #2ecc71';
        message.style.color = '#2ecc71';
    } else if (type === 'error') {
        message.style.background = 'rgba(255, 71, 87, 0.2)';
        message.style.border = '1px solid #ff4757';
        message.style.color = '#ff4757';
    }
    
    const form = document.querySelector('form');
    if (form) {
        form.prepend(message);
    } else {
        document.body.insertBefore(message, document.body.firstChild);
    }
    
    if (type !== 'error') {
        setTimeout(() => message.remove(), 5000);
    }
}
// Функция проверки, вошел ли пользователь
function isAuthenticated() {
    const token = localStorage.getItem('authToken'); // или sessionStorage
    const user = localStorage.getItem('userData');
    return token && user; // true если есть токен и данные
}

// Проверять при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('/panel')) {
        if (!isAuthenticated()) {
            window.location.href = '/login.html'; // или login
        }
    }
});
function handleLoginSuccess(userData, token) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // ПЕРЕНАПРАВИТЬ на страницу создания персонажа
    window.location.href = '/create-character.html';
}
// js/auth.js
function handleLoginSuccess(userData) {
    // Сохраняем токен и данные пользователя
    localStorage.setItem('authToken', userData.token);
    localStorage.setItem('userData', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name || userData.username,
        accountType: userData.accountType || 'Обычный'
    }));
    
    // Перенаправляем в панель управления
    window.location.href = 'panel.html';
}

// Функция проверки авторизации
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('userData');
    return token && user;
}

// Функция выхода
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = 'index.html';
}
