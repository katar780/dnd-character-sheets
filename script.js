// script.js - ОБЩИЕ ФУНКЦИИ
console.log('script.js загружен');

// Глобальные переменные
let db; // Будет инициализировано из firebase-config.js

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    // Проверяем, что Firebase загружен
    if (typeof firebase !== 'undefined') {
        db = firebase.firestore();
        console.log('Firestore инициализирован');
    }
    
    // Инициализация общих элементов
    initCommonElements();
});

// Инициализация общих элементов
function initCommonElements() {
    // Кнопки навигации
    const navButtons = document.querySelectorAll('[data-nav]');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-nav');
            window.location.href = target;
        });
    });
    
    // Кнопки назад
    const backButtons = document.querySelectorAll('.back-button');
    backButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    });
    
    // Модальные окна
    initModals();
    
    // Уведомления
    initNotifications();
}

// Инициализация модальных окон
function initModals() {
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close');
    
    // Открытие модальных окон
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Закрытие модальных окон
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Закрытие по клику вне модального окна
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.style.display === 'flex') {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            });
        }
    });
}

// Инициализация уведомлений
function initNotifications() {
    window.showNotification = function(message, type = 'info', duration = 3000) {
        // Создаем элемент уведомления
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Добавляем в документ
        document.body.appendChild(notification);
        
        // Показываем с анимацией
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });
        
        // Автоматическое закрытие
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(notification);
            }, duration);
        }
    };
    
    function hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// Форматирование даты
function formatDate(date) {
    if (!date) return 'Нет даты';
    
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Форматирование числа
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Проверка email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Генератор случайных ID
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Дебаунс функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Копирование в буфер обмена
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Скопировано в буфер обмена', 'success');
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
        showNotification('Ошибка копирования', 'error');
    });
}

// Проверка мобильного устройства
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Экспорт функций в глобальную область видимости
if (typeof window !== 'undefined') {
    window.formatDate = formatDate;
    window.formatNumber = formatNumber;
    window.isValidEmail = isValidEmail;
    window.generateId = generateId;
    window.copyToClipboard = copyToClipboard;
    window.isMobile = isMobile;
}
