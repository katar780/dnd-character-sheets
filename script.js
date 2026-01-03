// Firebase refs
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Элементы DOM
const raceSelect = document.getElementById('race');
const classSelect = document.getElementById('class');
const hairColor = document.getElementById('hair-color');
const eyeColor = document.getElementById('eye-color');
const strength = document.getElementById('strength');
const dexterity = document.getElementById('dexterity');
const intelligence = document.getElementById('intelligence');
const pointsLeft = document.getElementById('points-left');
const skills = document.querySelectorAll('input[type="checkbox"]');
const previewCanvas = document.getElementById('preview');
const ctx = previewCanvas.getContext('2d');

const saveLocalBtn = document.getElementById('save-local');
const saveCloudBtn = document.getElementById('save-cloud');
const exportPngBtn = document.getElementById('export-png');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');

// Аккаунты
auth.onAuthStateChanged(user => {
    if (user) {
        userInfo.textContent = `Привет, ${user.email}`;
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline';
        saveCloudBtn.style.display = 'inline';
    } else {
        userInfo.textContent = '';
        loginBtn.style.display = 'inline';
        registerBtn.style.display = 'inline';
        logoutBtn.style.display = 'none';
        saveCloudBtn.style.display = 'none';
    }
});
// === НОВАЯ ЛОГИКА АВТОРИЗАЦИИ С КРАСИВОЙ МОДАЛКОЙ ===

// Элементы модального окна
const modal = document.getElementById('auth-modal');
const modalTitle = document.getElementById('modal-title');
const authSubmit = document.getElementById('auth-submit');
const switchMode = document.getElementById('switch-mode'); // будем перехватывать клик по ссылке
const switchText = document.getElementById('switch-text');
const closeModal = document.getElementById('close-modal');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');

let isLogin = true; // true = вход, false = регистрация

// Функция открытия модалки
function openAuthModal(login = true) {
    isLogin = login;
    modalTitle.textContent = isLogin ? 'Войти' : 'Регистрация';
    authSubmit.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    switchText.innerHTML = isLogin 
        ? 'Нет аккаунта? <a href="#" id="switch-mode">Зарегистрироваться</a>'
        : 'Уже есть аккаунт? <a href="#" id="switch-mode">Войти</a>';
    
    // Очищаем поля
    authEmail.value = '';
    authPassword.value = '';
    
    modal.style.display = 'flex';
}

// Открытие по кнопкам в хедере
loginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(true);
});

registerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(false);
});

// Переключение между входом и регистрацией
document.body.addEventListener('click', (e) => {
    if (e.target.id === 'switch-mode') {
        e.preventDefault();
        openAuthModal(!isLogin);
    }
});

// Закрытие модалки
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Обработка отправки формы
authSubmit.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const password = authPassword.value;

    if (!email || !password) {
        alert('Пожалуйста, заполните email и пароль');
        return;
    }

    if (password.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }

    if (isLogin) {
        auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                modal.style.display = 'none';
            })
            .catch(err => alert('Ошибка входа: ' + err.message));
    } else {
        auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                modal.style.display = 'none';
            })
            .catch(err => alert('Ошибка регистрации: ' + err.message));
    }
});

// Кнопка выхода остаётся прежней
logoutBtn.addEventListener('click', () => {
    auth.signOut();
});
// Распределение характеристик
const stats = [strength, dexterity, intelligence];
stats.forEach(stat => {
    stat.addEventListener('input', updatePoints);
});

function updatePoints() {
    const total = stats.reduce((sum, s) => sum + parseInt(s.value || 0), 0);
    pointsLeft.textContent = 20 - total;
    if (total > 20) alert('Превышено 20 очков!');
}

// Визуализация на Canvas (простой 2D персонаж)
function drawPreview() {
    ctx.clearRect(0, 0, 300, 400);
    // Тело (прямоугольник)
    ctx.fillStyle = '#808080';
    ctx.fillRect(100, 150, 100, 200);
    // Голова
    ctx.beginPath();
    ctx.arc(150, 100, 50, 0, Math.PI * 2);
    ctx.fill();
    // Волосы
    ctx.fillStyle = hairColor.value;
    ctx.fillRect(120, 50, 60, 50);
    // Глаза
    ctx.fillStyle = eyeColor.value;
    ctx.beginPath();
    ctx.arc(130, 90, 5, 0, Math.PI * 2);
    ctx.arc(170, 90, 5, 0, Math.PI * 2);
    ctx.fill();
    // Раса/класс индикаторы (текст)
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Раса: ${raceSelect.value}`, 10, 20);
    ctx.fillText(`Класс: ${classSelect.value}`, 10, 40);
}

// Обновление превью при изменениях
[raceSelect, classSelect, hairColor, eyeColor, ...stats].forEach(el => el.addEventListener('change', drawPreview));
drawPreview(); // Инит

// Сохранение локально
saveLocalBtn.addEventListener('click', () => {
    const char = getCharacterData();
    localStorage.setItem('rpg_char', JSON.stringify(char));
    alert('Сохранено локально!');
});

// Сохранение в облако (Firestore)
saveCloudBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;
    const char = getCharacterData();
    db.collection('characters').doc(user.uid).set(char)
        .then(() => alert('Сохранено в облаке!'))
        .catch(err => alert(err.message));
});

// Экспорт PNG
exportPngBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'rpg_character.png';
    link.href = previewCanvas.toDataURL();
    link.click();
});

// Получить данные персонажа
function getCharacterData() {
    const selectedSkills = Array.from(skills).filter(s => s.checked).map(s => s.value);
    return {
        race: raceSelect.value,
        class: classSelect.value,
        hair: hairColor.value,
        eyes: eyeColor.value,
        strength: strength.value,
        dexterity: dexterity.value,
        intelligence: intelligence.value,
        skills: selectedSkills
    };
}

// Лимит на навыки (max 3)
skills.forEach(skill => {
    skill.addEventListener('change', () => {
        if (Array.from(skills).filter(s => s.checked).length > 3) {
            skill.checked = false;
            alert('Максимум 3 навыка!');
        }
    });
});
