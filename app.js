// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    console.log('📜 Хроники Астралума загружаются...');
    
    // ===== ПЕРЕМЕННЫЕ =====
    const elements = {
        // Кнопки
        startBtn: document.getElementById('start-btn'),
        demoBtn: document.getElementById('demo-btn'),
        scribeBtn: document.getElementById('scribe-btn'),
        beginChronicleBtn: document.getElementById('begin-chronicle'),
        viewTomesBtn: document.getElementById('view-tomes'),
        joinChroniclesBtn: document.getElementById('join-chronicles'),
        
        // Модальное окно
        authModal: document.getElementById('scribe-modal'),
        closeModal: document.querySelector('.close-modal'),
        
        // Формы
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        loginScroll: document.getElementById('login-scroll'),
        registerScroll: document.getElementById('register-scroll'),
        
        // Переключатели форм
        switchToRegister: document.getElementById('switch-to-register'),
        switchToLogin: document.getElementById('switch-to-login'),
        
        // Поля форм
        loginEmail: document.getElementById('login-email'),
        loginPassword: document.getElementById('login-password'),
        registerName: document.getElementById('register-name'),
        registerEmail: document.getElementById('register-email'),
        registerPassword: document.getElementById('register-password'),
        registerConfirm: document.getElementById('register-confirm'),
        
        // Гость
        guestAccess: document.getElementById('guest-access'),
        
        // Сообщения
        scribeMessage: document.getElementById('scribe-message'),
        
        // Навигация
        navLinks: document.querySelectorAll('.nav-link')
    };
    
    // ===== ИНИЦИАЛИЗАЦИЯ =====
    initApp();
    
    // ===== ФУНКЦИИ =====
    
    function initApp() {
        // Проверяем авторизацию
        checkAuthentication();
        
        // Назначаем обработчики событий
        setupEventListeners();
        
        // Анимации
        startAnimations();
    }
    
    function checkAuthentication() {
        const user = window.getCurrentUser();
        if (user) {
            updateUIForLoggedInUser(user);
        }
    }
    
    function updateUIForLoggedInUser(user) {
        // Обновляем кнопку летописца
        if (elements.scribeBtn) {
            elements.scribeBtn.innerHTML = `
                <span class="nav-icon">👑</span> 
                ${user.displayName || user.email.split('@')[0]}
            `;
            elements.scribeBtn.classList.add('logged-in');
        }
    }
    
    function setupEventListeners() {
        // Кнопка "Стать Летописцем"
        if (elements.scribeBtn) {
            elements.scribeBtn.addEventListener('click', () => {
                const user = window.getCurrentUser();
                if (user) {
                    // Пользователь уже авторизован
                    showMessage('Вы уже в Ордене Летописцев!', 'success');
                    // Можно перенаправить в личный кабинет
                    // window.location.href = 'chronicles.html';
                } else {
                    openScribeModal();
                }
            });
        }
        
        // Кнопка "Начать Хронику"
        if (elements.beginChronicleBtn) {
            elements.beginChronicleBtn.addEventListener('click', () => {
                const user = window.getCurrentUser();
                if (!user) {
                    openScribeModal();
                    showMessage('Сначала станьте Летописцем!', 'error');
                } else {
                    // Начать создание хроники
                    startNewChronicle();
                }
            });
        }
        
        // Кнопка "Узреть Тома"
        if (elements.viewTomesBtn) {
            elements.viewTomesBtn.addEventListener('click', () => {
                showMessage('Архивы томов скоро будут доступны...', 'success');
            });
        }
        
        // Кнопка "Вступить в Орден"
        if (elements.joinChroniclesBtn) {
            elements.joinChroniclesBtn.addEventListener('click', openScribeModal);
        }
        
        // Кнопка "Попробовать демо" (гостевой доступ)
        if (elements.demoBtn) {
            elements.demoBtn.addEventListener('click', enterAsGuest);
        }
        
        // Кнопка "Начать приключение"
        if (elements.startBtn) {
            elements.startBtn.addEventListener('click', openScribeModal);
        }
        
        // Закрытие модального окна
        if (elements.closeModal) {
            elements.closeModal.addEventListener('click', closeScribeModal);
        }
        
        // Закрытие по клику вне окна
        if (elements.authModal) {
            elements.authModal.addEventListener('click', (e) => {
                if (e.target === elements.authModal) {
                    closeScribeModal();
                }
            });
        }
        
        // Переключение между формами
        if (elements.switchToRegister) {
            elements.switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                showRegisterForm();
            });
        }
        
        if (elements.switchToLogin) {
            elements.switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginForm();
            });
        }
        
        // Гостевой доступ
        if (elements.guestAccess) {
            elements.guestAccess.addEventListener('click', enterAsGuest);
        }
        
        // Форма входа
        if (elements.loginForm) {
            elements.loginForm.addEventListener('submit', handleLogin);
        }
        
        // Форма регистрации
        if (elements.registerForm) {
            elements.registerForm.addEventListener('submit', handleRegister);
        }
        
        // Навигация по страницам
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (!link.classList.contains('nav-button')) {
                    e.preventDefault();
                    const target = link.getAttribute('href');
                    if (target && target.startsWith('#')) {
                        smoothScroll(target);
                    }
                }
            });
        });
    }
    
    function openScribeModal() {
        if (elements.authModal) {
            elements.authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Показываем форму входа по умолчанию
            showLoginForm();
            
            // Очищаем сообщения
            clearMessage();
        }
    }
    
    function closeScribeModal() {
        if (elements.authModal) {
            elements.authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Очищаем формы
            if (elements.loginForm) elements.loginForm.reset();
            if (elements.registerForm) elements.registerForm.reset();
            clearMessage();
        }
    }
    
    function showLoginForm() {
        if (elements.loginScroll && elements.registerScroll) {
            elements.loginScroll.style.display = 'block';
            elements.registerScroll.style.display = 'none';
        }
    }
    
    function showRegisterForm() {
        if (elements.loginScroll && elements.registerScroll) {
            elements.loginScroll.style.display = 'none';
            elements.registerScroll.style.display = 'block';
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        const email = elements.loginEmail.value.trim();
        const password = elements.loginPassword.value;
        
        if (!email || !password) {
            showMessage('Заполните все поля!', 'error');
            return;
        }
        
        showMessage('Открываем архивы...', 'success');
        
        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Сохраняем имя пользователя если есть
            if (elements.registerName && elements.registerName.value) {
                await user.updateProfile({
                    displayName: elements.registerName.value
                });
            }
            
            showMessage('Архивы открыты! Добро пожаловать!', 'success');
            
            // Обновляем UI
            updateUIForLoggedInUser(user);
            
            // Закрываем модальное окно через 2 секунды
            setTimeout(() => {
                closeScribeModal();
                showMessage('Вы вошли в Хроники Астралума!', 'success');
            }, 1500);
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            let message = 'Ошибка входа';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    message = 'Летописец не найден в архивах';
                    break;
                case 'auth/wrong-password':
                    message = 'Неверное тайное слово';
                    break;
                case 'auth/invalid-email':
                    message = 'Свиток призыва имеет неверную форму';
                    break;
                case 'auth/too-many-requests':
                    message = 'Слишком много попыток. Подождите немного';
                    break;
                case 'auth/network-request-failed':
                    message = 'Проблемы с магией связи. Проверьте интернет';
                    break;
            }
            
            showMessage(message, 'error');
        }
    }
    
    async function handleRegister(e) {
        e.preventDefault();
        
        const name = elements.registerName.value.trim();
        const email = elements.registerEmail.value.trim();
        const password = elements.registerPassword.value;
        const confirm = elements.registerConfirm.value;
        
        // Валидация
        if (!name || !email || !password || !confirm) {
            showMessage('Заполните все поля летописи!', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Тайное слово должно быть не короче 6 рун', 'error');
            return;
        }
        
        if (password !== confirm) {
            showMessage('Тайные слова не совпадают', 'error');
            return;
        }
        
        showMessage('Создаём печать летописца...', 'success');
        
        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Обновляем имя пользователя
            await user.updateProfile({
                displayName: name
            });
            
            // Создаем запись в Firestore
            try {
                await window.firebaseDb.collection('scribes').doc(user.uid).set({
                    name: name,
                    email: email,
                    joined: new Date().toISOString(),
                    chronicles: [],
                    rank: 'Новичок'
                });
            } catch (dbError) {
                console.warn('Не удалось сохранить в Firestore:', dbError);
            }
            
            showMessage('Печать создана! Добро пожаловать в Орден!', 'success');
            
            // Обновляем UI
            updateUIForLoggedInUser(user);
            
            // Закрываем модальное окно через 2 секунды
            setTimeout(() => {
                closeScribeModal();
                showMessage(`${name}, вы теперь Летописец Астралума!`, 'success');
            }, 2000);
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            let message = 'Ошибка создания печати';
            
            switch(error.code) {
                case 'auth/email-already-in-use':
                    message = 'Этот свиток призыва уже используется';
                    break;
                case 'auth/invalid-email':
                    message = 'Свиток призыва имеет неверную форму';
                    break;
                case 'auth/weak-password':
                    message = 'Тайное слово слишком слабое';
                    break;
                case 'auth/operation-not-allowed':
                    message = 'Регистрация новых летописцев временно закрыта';
                    break;
                case 'auth/network-request-failed':
                    message = 'Проблемы с магией связи. Проверьте интернет';
                    break;
            }
            
            showMessage(message, 'error');
        }
    }
    
    function enterAsGuest() {
        showMessage('Входим как паломник...', 'success');
        
        // Создаем гостевого пользователя
        const guestUser = {
            uid: 'guest_' + Date.now(),
            email: 'pilgrim@astralum.local',
            displayName: 'Паломник',
            isGuest: true
        };
        
        localStorage.setItem('astralum_user', JSON.stringify(guestUser));
        
        // Обновляем UI
        updateUIForLoggedInUser(guestUser);
        
        setTimeout(() => {
            closeScribeModal();
            showMessage('Добро пожаловать, путник! Ваши записи будут храниться только в этом храме (браузере).', 'success');
        }, 1500);
    }
    
    function startNewChronicle() {
        // Создаем новую хронику (персонажа)
        const chronicleId = 'chronicle_' + Date.now();
        const chronicleData = {
            id: chronicleId,
            name: 'Новая Хроника',
            created: new Date().toISOString(),
            type: 'Персонаж',
            level: 1,
            xp: 0,
            gold: 100
        };
        
        window.saveToArchive('chronicles', chronicleId, chronicleData)
            .then(success => {
                if (success) {
                    showMessage('Хроника создана! Скоро откроется редактор...', 'success');
                    // Можно перенаправить на страницу редактора
                    // window.location.href = `chronicle-editor.html?id=${chronicleId}`;
                } else {
                    showMessage('Не удалось создать хронику', 'error');
                }
            });
    }
    
    function showMessage(text, type = 'success') {
        if (!elements.scribeMessage) return;
        
        elements.scribeMessage.textContent = text;
        elements.scribeMessage.className = `scribe-message ${type}`;
        elements.scribeMessage.style.display = 'block';
        
        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            elements.scribeMessage.style.display = 'none';
        }, 5000);
    }
    
    function clearMessage() {
        if (elements.scribeMessage) {
            elements.scribeMessage.style.display = 'none';
            elements.scribeMessage.textContent = '';
        }
    }
    
    function smoothScroll(target) {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    function startAnimations() {
        // Анимация появления элементов
        const animatedElements = document.querySelectorAll('.scroll-card, .feature-badge');
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 100 + (index * 100));
        });
    }
    
    // ===== ГОТОВО =====
    console.log('🏰 Хроники Астралума готовы!');
});
