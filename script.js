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

loginBtn.addEventListener('click', () => {
    const email = prompt('Email:');
    const password = prompt('Пароль:');
    auth.signInWithEmailAndPassword(email, password).catch(err => alert(err.message));
});

registerBtn.addEventListener('click', () => {
    const email = prompt('Email:');
    const password = prompt('Пароль:');
    auth.createUserWithEmailAndPassword(email, password).catch(err => alert(err.message));
});

logoutBtn.addEventListener('click', () => auth.signOut());

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
