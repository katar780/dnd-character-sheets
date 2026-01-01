// js/storage.js

// Ключи для хранения данных
const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'userData',
    REMEMBER: 'rememberMe'
};

// Функция сохранения данных
function saveAuthData(userData, token, rememberMe = false) {
    if (rememberMe) {
        // Сохраняем в localStorage (надолго)
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.REMEMBER, 'true');
        
        // Очищаем sessionStorage
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
    } else {
        // Сохраняем в sessionStorage (только на сессию)
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
        
        // Очищаем localStorage
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    }
}

// Функция получения данных
function getAuthData() {
    // Проверяем, была ли выбрана опция "запомнить"
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true';
    
    let token, userData;
    
    if (rememberMe) {
        // Брать из localStorage
        token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        userData = localStorage.getItem(STORAGE_KEYS.USER);
    } else {
        // Брать из sessionStorage
        token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        userData = sessionStorage.getItem(STORAGE_KEYS.USER);
    }
    
    return {
        token: token,
        userData: userData ? JSON.parse(userData) : null,
        rememberMe: rememberMe
    };
}

// Проверка авторизации
function isAuthenticated() {
    const authData = getAuthData();
    return !!(authData.token && authData.userData);
}

// Получение данных пользователя
function getUser() {
    const authData = getAuthData();
    return authData.userData;
}

// Выход из системы
function logout() {
    // Очищаем оба хранилища
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER);
    
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    
    // Перенаправляем на главную
    window.location.href = 'index.html';
}

// Экспортируем функции (если используем модули)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        saveAuthData,
        getAuthData,
        isAuthenticated,
        getUser,
        logout
    };
}
