// js/auth.js
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Обработчики для кнопок авторизации
        document.getElementById('login-btn')?.addEventListener('click', () => this.openModal('login'));
        document.getElementById('register-btn')?.addEventListener('click', () => this.openModal('register'));
        document.getElementById('demo-btn')?.addEventListener('click', () => this.demoMode());
        
        // Обработчики для модального окна
        document.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
        
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        // Обработчики для форм внутри модального окна
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Кнопка выхода
        document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    }

    openModal(mode = 'login') {
        const modal = document.getElementById('auth-modal');
        if (!modal) {
            console.error('Модальное окно не найдено!');
            return;
        }
        
        // Показываем нужную форму
        if (mode === 'login') {
            document.getElementById('login-form').style.display = 'block';
            document.getElementById('register-form').style.display = 'none';
            modal.querySelector('.modal-title').textContent = 'Вход в систему';
        } else {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            modal.querySelector('.modal-title').textContent = 'Регистрация';
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Запрещаем прокрутку страницы
    }

    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto'; // Возвращаем прокрутку
            
            // Очищаем формы
            document.getElementById('login-form')?.reset();
            document.getElementById('register-form')?.reset();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showError('Заполните все поля');
            return;
        }
        
        try {
            // Здесь будет запрос к Firebase или вашему бэкенду
            console.log('Вход с:', { email, password });
            
            // Имитация успешного входа
            this.currentUser = { email, name: email.split('@')[0] };
            this.updateUI();
            this.closeModal();
            this.showSuccess('Вход выполнен успешно!');
            
        } catch (error) {
            this.showError('Ошибка входа: ' + error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (!email || !password || !confirmPassword) {
            this.showError('Заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            this.showError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        try {
            // Здесь будет запрос к Firebase или вашему бэкенду
            console.log('Регистрация:', { email, password });
            
            // Имитация успешной регистрации
            this.currentUser = { email, name: email.split('@')[0] };
            this.updateUI();
            this.closeModal();
            this.showSuccess('Регистрация прошла успешно!');
            
        } catch (error) {
            this.showError('Ошибка регистрации: ' + error.message);
        }
    }

    demoMode() {
        // Режим демо без регистрации
        this.currentUser = { 
            email: 'demo@example.com', 
            name: 'Демо пользователь',
            isDemo: true 
        };
        this.updateUI();
        this.showSuccess('Демо режим активирован');
    }

    logout() {
        this.currentUser = null;
        this.updateUI();
        this.showSuccess('Вы вышли из системы');
    }

    updateUI() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const userInfo = document.getElementById('user-info');
        
        if (this.currentUser) {
            // Пользователь авторизован
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            
            if (userInfo) {
                userInfo.textContent = `Привет, ${this.currentUser.name}`;
                userInfo.style.display = 'block';
            }
        } else {
            // Пользователь не авторизован
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
        }
    }

    checkAuthState() {
        // Проверяем, есть ли сохраненная сессия
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
            } catch (e) {
                console.error('Ошибка загрузки пользователя:', e);
            }
        }
    }

    showError(message) {
        // Показываем сообщение об ошибке
        const errorDiv = document.getElementById('auth-error') || this.createMessageElement();
        errorDiv.textContent = message;
        errorDiv.className = 'alert alert-danger';
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        // Показываем успешное сообщение
        const successDiv = document.getElementById('auth-success') || this.createMessageElement();
        successDiv.textContent = message;
        successDiv.className = 'alert alert-success';
        successDiv.style.display = 'block';
        
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    createMessageElement() {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.right = '20px';
        div.style.zIndex = '1000';
        document.body.appendChild(div);
        return div;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
