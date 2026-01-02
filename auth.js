// js/auth.js

// Элементы DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginFormContainer = document.getElementById('login-form');
const registerFormContainer = document.getElementById('register-form');
const authMessage = document.getElementById('auth-message');
const guestLoginBtn = document.getElementById('guest-login-btn');

// Проверяем режим из URL (login или register)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

// При загрузке показываем нужную форму
if (mode === 'register') {
    showRegisterForm();
} else {
    showLoginForm();
}

// Переключение между формами
document.getElementById('switch-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
});

document.getElementById('switch-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
});

function showLoginForm() {
    loginFormContainer.style.display = 'block';
    registerFormContainer.style.display = 'none';
    window.history.replaceState({}, '', 'auth.html?mode=login');
}

function showRegisterForm() {
    loginFormContainer.style.display = 'none';
    registerFormContainer.style.display = 'block';
    window.history.replaceState({}, '', 'auth.html?mode=register');
}

// Функция показа сообщений
function showMessage(text, type = 'error') {
    authMessage.textContent = text;
    authMessage.className = `message ${type}`;
    authMessage.classList.remove('hidden');
    
    // Автоматически скрываем успешные сообщения
    if (type === 'success') {
        setTimeout(() => {
            authMessage.classList.add('hidden');
        }, 3000);
    }
}

// Вход
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            showMessage('Вход...', 'success');
            
            // Пробуем войти через Firebase
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Получаем данные пользователя из Firestore
            const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                // Сохраняем в localStorage для быстрого доступа
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: userDoc.data().name,
                    isGuest: false
                }));
                
                showMessage('Вход успешен! Перенаправляем...', 'success');
                
                // Перенаправляем в личный кабинет
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                // Создаем запись пользователя если её нет
                await window.firebaseDb.collection('users').doc(user.uid).set({
                    email: user.email,
                    name: user.email.split('@')[0], // Имя из email
                    createdAt: new Date(),
                    characters: []
                });
                
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    name: user.email.split('@')[0],
                    isGuest: false
                }));
                
                showMessage('Профиль создан! Перенаправляем...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            }
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            
            // Пользовательские сообщения об ошибках
            let errorMessage = 'Ошибка входа';
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Пользователь не найден';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Неверный пароль';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Неверный формат email';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Слишком много попыток. Попробуйте позже';
                    break;
            }
            
            showMessage(errorMessage, 'error');
        }
    });
}

// Регистрация
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;
        
        // Проверка паролей
        if (password !== confirmPassword) {
            showMessage('Пароли не совпадают', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Пароль должен быть не менее 6 символов', 'error');
            return;
        }
        
        try {
            showMessage('Создание аккаунта...', 'success');
            
            // Создаем пользователя в Firebase Auth
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Создаем запись в Firestore
            await window.firebaseDb.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                createdAt: new Date(),
                lastLogin: new Date(),
                characters: [],
                settings: {
                    theme: 'dark',
                    notifications: true
                }
            });
            
            // Сохраняем в localStorage
            localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                name: name,
                isGuest: false
            }));
            
            showMessage('Аккаунт создан! Перенаправляем...', 'success');
            
            // Перенаправляем в личный кабинет
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            
            let errorMessage = 'Ошибка регистрации';
            switch(error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Этот email уже используется';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Неверный формат email';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Пароль слишком слабый';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Регистрация отключена';
                    break;
            }
            
            showMessage(errorMessage, 'error');
        }
    });
}

// Гостевой вход
if (guestLoginBtn) {
    guestLoginBtn.addEventListener('click', () => {
        // Создаем гостевой профиль
        const guestId = 'guest_' + Date.now();
        const guestUser = {
            uid: guestId,
            email: 'guest@local',
            name: 'Гость',
            isGuest: true,
            createdAt: new Date()
        };
        
        // Сохраняем в localStorage
        localStorage.setItem('currentUser', JSON.stringify(guestUser));
        
        // Создаем локальную базу для гостя
        const guestData = {
            characters: [],
            settings: { theme: 'dark' }
        };
        localStorage.setItem('guest_data_' + guestId, JSON.stringify(guestData));
        
        showMessage('Гостевой режим активирован', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    });
}

// Проверяем авторизацию при загрузке
window.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (currentUser && !currentUser.isGuest) {
        // Если пользователь уже авторизован, перенаправляем
        window.location.href = 'dashboard.html';
    }
});
