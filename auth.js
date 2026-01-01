// auth.js - ЛОГИКА АВТОРИЗАЦИИ
console.log('auth.js загружен');

// Проверка состояния авторизации
function checkAuthState() {
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Статус авторизации:', user ? 'Вошёл: ' + user.email : 'Не авторизован');
    });
}

// Инициализация входа
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const showPassword = document.getElementById('showPassword');
    const rememberMe = document.getElementById('rememberMe');
    
    if (!loginForm) {
        console.error('Форма входа не найдена');
        return;
    }
    
    // Показать/скрыть пароль
    if (showPassword) {
        showPassword.addEventListener('change', function() {
            const passwordField = document.getElementById('password');
            passwordField.type = this.checked ? 'text' : 'password';
        });
    }
    
    // Обработка отправки формы
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // Валидация
        if (!email || !password) {
            showMessage('Заполните все поля', 'error', messageDiv);
            return;
        }
        
        // Показываем загрузку
        submitText.textContent = 'Вход...';
        loadingSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        try {
            // Вход через Firebase
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Успешный вход:', user.email);
            
            // Сохраняем в localStorage если "Запомнить меня"
            if (rememberMe && rememberMe.checked) {
                localStorage.setItem('userRemembered', 'true');
                localStorage.setItem('userEmail', email);
            } else {
                localStorage.removeItem('userRemembered');
                localStorage.removeItem('userEmail');
            }
            
            // Проверяем, есть ли displayName
            if (!user.displayName) {
                // Запрашиваем имя пользователя если его нет
                const username = prompt('Введите ваше имя для отображения:') || email.split('@')[0];
                await user.updateProfile({
                    displayName: username
                });
            }
            
            // Сохраняем данные пользователя в Firestore
            await saveUserData(user);
            
            // Редирект
            showMessage('Вход успешен! Перенаправление...', 'success', messageDiv);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            
            let errorMessage = 'Ошибка входа';
            switch (error.code) {
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
                default:
                    errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error', messageDiv);
            
            // Восстанавливаем кнопку
            submitText.textContent = 'Войти';
            loadingSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
    
    // Социальные логины
    const googleLoginBtn = document.getElementById('googleLogin');
    const githubLoginBtn = document.getElementById('githubLogin');
    
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', signInWithGoogle);
    }
    
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', signInWithGitHub);
    }
    
    // Восстановление пароля
    const forgotPassword = document.getElementById('forgotPassword');
    if (forgotPassword) {
        forgotPassword.addEventListener('click', function(e) {
            e.preventDefault();
            const email = prompt('Введите ваш email для восстановления пароля:');
            if (email) {
                firebase.auth().sendPasswordResetEmail(email)
                    .then(() => {
                        alert('Инструкции по восстановлению отправлены на ' + email);
                    })
                    .catch(error => {
                        alert('Ошибка: ' + error.message);
                    });
            }
        });
    }
    
    // Автозаполнение если был чекбокс "запомнить"
    if (localStorage.getItem('userRemembered') === 'true') {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail && document.getElementById('email')) {
            document.getElementById('email').value = savedEmail;
            if (rememberMe) rememberMe.checked = true;
        }
    }
}

// Инициализация регистрации
function initRegister() {
    const registerForm = document.getElementById('registerForm');
    const messageDiv = document.getElementById('message');
    
    if (!registerForm) {
        console.error('Форма регистрации не найдена');
        return;
    }
    
    // Валидация пароля
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    const matchDiv = document.getElementById('passwordMatch');
    
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = checkPasswordStrength(password);
            
            // Обновляем индикатор
            if (strengthBar) {
                strengthBar.style.width = strength.percent + '%';
                strengthBar.style.background = strength.color;
            }
            
            if (strengthText) {
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            }
            
            // Проверяем совпадение паролей
            checkPasswordMatch();
        });
    }
    
    if (confirmInput) {
        confirmInput.addEventListener('input', checkPasswordMatch);
    }
    
    function checkPasswordMatch() {
        const password = passwordInput ? passwordInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';
        
        if (!matchDiv) return;
        
        if (!password && !confirm) {
            matchDiv.textContent = '';
            matchDiv.className = 'password-match';
            return;
        }
        
        if (confirm && password !== confirm) {
            matchDiv.textContent = 'Пароли не совпадают';
            matchDiv.className = 'password-match error';
        } else if (confirm && password === confirm) {
            matchDiv.textContent = 'Пароли совпадают';
            matchDiv.className = 'password-match success';
        } else {
            matchDiv.textContent = '';
            matchDiv.className = 'password-match';
        }
    }
    
    function checkPasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        const levels = [
            { percent: 20, color: '#ff4444', text: 'Слабый' },
            { percent: 40, color: '#ff9900', text: 'Нормальный' },
            { percent: 60, color: '#ffcc00', text: 'Хороший' },
            { percent: 80, color: '#99cc00', text: 'Сильный' },
            { percent: 100, color: '#00c851', text: 'Очень сильный' }
        ];
        
        return levels[Math.min(score, levels.length - 1)];
    }
    
    // Обработка отправки формы регистрации
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const submitText = document.getElementById('submitText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        // Валидация
        if (!username || !email || !password || !confirmPassword) {
            showMessage('Заполните все поля', 'error', messageDiv);
            return;
        }
        
        if (password !== confirmPassword) {
            showMessage('Пароли не совпадают', 'error', messageDiv);
            return;
        }
        
        if (password.length < 6) {
            showMessage('Пароль должен быть минимум 6 символов', 'error', messageDiv);
            return;
        }
        
        if (!terms) {
            showMessage('Необходимо согласие с условиями', 'error', messageDiv);
            return;
        }
        
        // Показываем загрузку
        submitText.textContent = 'Регистрация...';
        loadingSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;
        
        try {
            // Создаем пользователя в Firebase
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Пользователь создан:', user.uid);
            
            // Обновляем профиль с именем
            await user.updateProfile({
                displayName: username
            });
            
            // Сохраняем дополнительные данные в Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                username: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                accountType: 'basic',
                level: 1,
                xp: 0,
                characters: []
            });
            
            showMessage('Регистрация успешна! Перенаправление...', 'success', messageDiv);
            
            // Автоматический вход и редирект
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            
            let errorMessage = 'Ошибка регистрации';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email уже используется';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Неверный формат email';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Пароль слишком слабый';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            showMessage(errorMessage, 'error', messageDiv);
            
            // Восстанавливаем кнопку
            submitText.textContent = 'Зарегистрироваться';
            loadingSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

// Вход через Google
async function signInWithGoogle() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        // Сохраняем данные в Firestore
        await saveUserData(user);
        
        // Редирект
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Ошибка входа через Google:', error);
        alert('Ошибка входа через Google: ' + error.message);
    }
}

// Вход через GitHub
async function signInWithGitHub() {
    try {
        const provider = new firebase.auth.GithubAuthProvider();
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        // Сохраняем данные в Firestore
        await saveUserData(user);
        
        // Редирект
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Ошибка входа через GitHub:', error);
        alert('Ошибка входа через GitHub: ' + error.message);
    }
}

// Сохранение данных пользователя в Firestore
async function saveUserData(user) {
    try {
        const userRef = db.collection('users').doc(user.uid);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            // Создаем новую запись
            await userRef.set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                accountType: 'basic',
                level: 1,
                xp: 0,
                characters: [],
                provider: user.providerData[0]?.providerId || 'email'
            });
            console.log('Новый пользователь сохранен в Firestore');
        } else {
            // Обновляем lastLogin
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('Данные пользователя обновлены');
        }
        
    } catch (error) {
        console.error('Ошибка сохранения данных пользователя:', error);
    }
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        firebase.auth().signOut().then(() => {
            // Очищаем localStorage если нужно
            localStorage.removeItem('userRemembered');
            window.location.href = 'index.html';
        }).catch(error => {
            console.error('Ошибка выхода:', error);
            alert('Ошибка при выходе: ' + error.message);
        });
    }
}

// Показать сообщение
function showMessage(text, type, element) {
    if (!element) return;
    
    element.textContent = text;
    element.className = 'message ' + type;
    element.style.display = 'block';
    
    // Автоматически скрывать success сообщения
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}

// Обновление статуса на главной
function updateAuthStatus() {
    const authStatus = document.getElementById('authStatus');
    if (!authStatus) return;
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            authStatus.innerHTML = `
                <p>Вы вошли как: <strong>${user.displayName || user.email}</strong></p>
                <div style="margin-top: 10px;">
                    <a href="dashboard.html" class="btn btn-primary" style="padding: 8px 16px;">Перейти в панель</a>
                    <button onclick="logout()" class="btn btn-outline" style="padding: 8px 16px;">Выйти</button>
                </div>
            `;
        } else {
            authStatus.innerHTML = `
                <p>Вы не авторизованы</p>
                <div style="margin-top: 10px;">
                    <a href="login.html" class="btn btn-primary" style="padding: 8px 16px;">Войти</a>
                    <a href="register.html" class="btn btn-outline" style="padding: 8px 16px;">Регистрация</a>
                </div>
            `;
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена, инициализация auth.js');
    
    // Проверяем, загружен ли Firebase
    if (typeof firebase === 'undefined') {
        console.error('Firebase не загружен!');
        return;
    }
    
    // Автопроверка состояния
    checkAuthState();
});
