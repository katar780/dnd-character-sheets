// Твой Firebase config (из скриншота)
const firebaseConfig = {
    apiKey: "AIzaSyCF399qSkS0TGuQD87JOhp9JsnuDdZeSI",
    authDomain: "dnd-character-sheets-b34d3.firebaseapp.com",
    projectId: "dnd-character-sheets-b34d3",
    storageBucket: "dnd-character-sheets-b34d3.appspot.com",
    messagingSenderId: "78996168700",
    appId: "1:78996168700:web:35657b8558a3ac693f6b79"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Элементы
const landing = document.getElementById('landing');
const dashboard = document.getElementById('dashboard');
const userEmail = document.getElementById('user-email');

const modal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authSubmit = document.getElementById('auth-submit');
const switchText = document.getElementById('switch-text');
const closeModal = document.getElementById('close-modal');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');

const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

let isLogin = true;

// Проверка состояния авторизации
auth.onAuthStateChanged(user => {
    if (user) {
        landing.style.display = 'none';
        dashboard.style.display = 'block';
        userEmail.textContent = user.email;
    } else {
        landing.style.display = 'block';
        dashboard.style.display = 'none';
    }
});

// Открытие модалки
function openModal(login = true) {
    isLogin = login;
    modalTitle.textContent = isLogin ? 'Войти' : 'Регистрация';
    authSubmit.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    switchText.innerHTML = isLogin 
        ? 'Нет аккаунта? <a href="#" id="switch-mode">Зарегистрироваться</a>'
        : 'Есть аккаунт? <a href="#" id="switch-mode">Войти</a>';
    authEmail.value = '';
    authPassword.value = '';
    modal.style.display = 'flex';
}

loginBtn.onclick = () => openModal(true);
registerBtn.onclick = () => openModal(false);

// Переключение режимов
document.body.addEventListener('click', e => {
    if (e.target.id === 'switch-mode') {
        e.preventDefault();
        openModal(!isLogin);
    }
});

// Закрытие модалки
closeModal.onclick = () => modal.style.display = 'none';
window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

// Авторизация
authSubmit.onclick = () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) return alert('Заполните email и пароль');
    if (password.length < 6) return alert('Пароль должен быть минимум 6 символов');

    const promise = isLogin 
        ? auth.signInWithEmailAndPassword(email, password)
        : auth.createUserWithEmailAndPassword(email, password);

    promise
        .then(() => modal.style.display = 'none')
        .catch(err => alert('Ошибка: ' + err.message));
};

// Выход
logoutBtn.onclick = () => auth.signOut();
