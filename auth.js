// js/auth.js

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }
    
    setupEventListeners() {
        // Кнопки на главной
        document.getElementById('login-btn')?.addEventListener('click', () => this.openModal());
        document.getElementById('register-btn')?.addEventListener('click', () => this.openModal('register'));
        document.getElementById('demo-btn')?.addEventListener('click', () => this.demoMode());
        
        // Закрытие модального окна
        document.querySelector('.close-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('auth-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'auth-modal') this.closeModal();
        });
        
        // Переключение форм
        document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('register');
        });
        
        document.getElementById('switch-to-login')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showForm('login');
        });
        
        // Формы
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }
    
    checkAuthState() {
        const user = window.getCurrentUser();
        if (user) {
            this.currentUser = user;
            this.redirectToDashboard();
        }
    }
    
    openModal(formType = 'login') {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            this.showForm(formType);
            this.clearMessage();
        }
    }
    
    closeModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            document.getElementById('loginForm')?.reset();
            document.getElementById('registerForm')?.reset();
            this.clearMessage();
        }
    }
    
    showForm(formType) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (formType === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        this.showMessage('Вход...', 'success');
        
        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Получаем роль пользователя из Firestore
            let role = 'player';
            try {
                const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    role = userDoc.data().role || 'player';
                }
            } catch (error) {
                console.warn('Не удалось получить роль пользователя:', error);
            }
            
            // Сохраняем пользователя
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || email.split('@')[0],
                role: role
            };
            
            localStorage.setItem('campaign_user', JSON.stringify(this.currentUser));
            localStorage.setItem(`user_role_${user.uid}`, role);
            
            this.showMessage('Вход выполнен!', 'success');
            
            setTimeout(() => {
                this.closeModal();
                this.redirectToDashboard();
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            let message = 'Ошибка входа';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    message = 'Пользователь не найден';
                    break;
                case 'auth/wrong-password':
                    message = 'Неверный пароль';
                    break;
                case 'auth/invalid-email':
                    message = 'Неверный формат email';
                    break;
                case 'auth/too-many-requests':
                    message = 'Слишком много попыток';
                    break;
            }
            
            this.showMessage(message, 'error');
        }
    }
    
    async handleRegister() {
        const role = document.getElementById('user-type').value;
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        
        // Валидация
        if (!role || !name || !email || !password || !confirm) {
            this.showMessage('Заполните все поля', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showMessage('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showMessage('Пароли не совпадают', 'error');
            return;
        }
        
        this.showMessage('Регистрация...', 'success');
        
        try {
            // Создаем пользователя в Firebase Auth
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Обновляем имя
            await user.updateProfile({
                displayName: name
            });
            
            // Сохраняем в Firestore
            if (window.firebaseDb) {
                await window.firebaseDb.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: email,
                    displayName: name,
                    role: role,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    campaigns: [],
                    characters: []
                });
            }
            
            // Сохраняем локально
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: name,
                role: role
            };
            
            localStorage.setItem('campaign_user', JSON.stringify(this.currentUser));
            localStorage.setItem(`user_role_${user.uid}`, role);
            
            this.showMessage('Регистрация успешна!', 'success');
            
            setTimeout(() => {
                this.closeModal();
                this.redirectToDashboard();
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            let message = 'Ошибка регистрации';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    message = 'Email уже используется';
                    break;
                case 'auth/invalid-email':
                    message = 'Неверный формат email';
                    break;
                case 'auth/weak-password':
                    message = 'Пароль слишком слабый';
                    break;
            }
            
            this.showMessage(message, 'error');
        }
    }
    
    demoMode() {
        this.showMessage('Вход в демо-режим...', 'success');
        
        const demoUser = {
            uid: 'demo_' + Date.now(),
            email: 'demo@campaign-chronicle.local',
            displayName: 'Демо-пользователь',
            role: 'both',
            isDemo: true
        };
        
        this.currentUser = demoUser;
        localStorage.setItem('campaign_user', JSON.stringify(demoUser));
        
        setTimeout(() => {
            this.showMessage('Демо-режим активирован!', 'success');
            this.redirectToDashboard();
        }, 1000);
    }
    
    redirectToDashboard() {
        // Здесь будет перенаправление на dashboard.html
        console.log('Перенаправление на dashboard...');
        // window.location.href = 'pages/dashboard.html';
        
        // Временно показываем сообщение
        this.showMessage('Панель управления скоро откроется!', 'success');
        
        // Создаем временную панель
        this.createTempDashboard();
    }
    
    createTempDashboard() {
        const container = document.querySelector('.container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="dashboard-preview">
                <h2>Панель управления Campaign Chronicle</h2>
                <div class="user-info">
                    <p>👤 ${this.currentUser.displayName}</p>
                    <p>🎭 Роль: ${this.currentUser.role === 'master' ? 'Мастер' : 
                                  this.currentUser.role === 'player' ? 'Игрок' : 'Мастер + Игрок'}</p>
                </div>
                
                <div class="dashboard-grid">
                    <div class="dashboard-card">
                        <h3>📊 Мои кампании</h3>
                        <p>Создавайте и управляйте кампаниями</p>
                        <button class="btn btn-primary">Создать кампанию</button>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>👤 Мои персонажи</h3>
                        <p>Управляйте персонажами в разных системах</p>
                        <button class="btn btn-secondary">Добавить персонажа</button>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>🎯 Назначить опыт</h3>
                        <p>Мастера: начисляйте опыт игрокам</p>
                        <button class="btn btn-primary">Назначить XP</button>
                    </div>
                    
                    <div class="dashboard-card">
                        <h3>⏳ Управление даунтаймом</h3>
                        <p>Планируйте активности между сессиями</p>
                        <button class="btn btn-secondary">Добавить активность</button>
                    </div>
                </div>
                
                <div class="logout-section">
                    <button id="logout-btn" class="btn btn-ghost">Выйти</button>
                </div>
            </div>
        `;
        
        // Обработчик выхода
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            this.handleLogout();
        });
    }
    
    async handleLogout() {
        try {
            if (window.firebaseAuth && this.currentUser && !this.currentUser.isDemo) {
                await window.firebaseAuth.signOut();
            }
            
            this.currentUser = null;
            localStorage.removeItem('campaign_user');
            
            // Перезагружаем страницу
            window.location.reload();
            
        } catch (error) {
            console.error('Ошибка выхода:', error);
            this.showMessage('Ошибка при выходе', 'error');
        }
    }
    
    showMessage(text, type = 'success') {
        const messageElement = document.getElementById('auth-message');
        if (messageElement) {
            messageElement.textContent = text;
            messageElement.className = `message ${type}`;
        }
    }
    
    clearMessage() {
        const messageElement = document.getElementById('auth-message');
        if (messageElement) {
            messageElement.textContent = '';
            messageElement.className = 'message';
        }
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});
