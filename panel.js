// js/panel.js
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Загружаем данные пользователя
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    // Отображаем данные
    if (userData) {
        // Имя для приветствия
        const displayName = userData.name || userData.username || 'Пользователь';
        document.getElementById('username').textContent = displayName;
        
        // Тип аккаунта
        const accountTypeElement = document.querySelector('#accountType span');
        accountTypeElement.textContent = userData.accountType;
        
        // Обновляем заголовок
        document.getElementById('greeting').textContent = `Привет, ${displayName}!`;
    }

    // Кнопка выхода
    document.getElementById('logoutBtn').addEventListener('click', function() {
        logout();
    });

    // Загружаем статистику (пример)
    loadUserStats();
});

// Функция загрузки статистики
function loadUserStats() {
    // Здесь будет запрос к API
    // Пока используем заглушку
    const stats = {
        characters: 0,
        level: 'Новичок'
    };
    
    document.getElementById('charCount').textContent = stats.characters;
    document.getElementById('userLevel').textContent = stats.level;
}
