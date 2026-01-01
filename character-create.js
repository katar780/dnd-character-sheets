// character-create.js - СОЗДАНИЕ ПЕРСОНАЖА
console.log('character-create.js загружен');

let currentStep = 1;
const totalSteps = 4;
let characterData = {
    name: '',
    race: 'human',
    class: 'warrior',
    bio: '',
    appearance: {},
    stats: {},
    userId: ''
};

// Инициализация создания персонажа
function initCharacterCreation() {
    console.log('Инициализация создания персонажа');
    
    // Устанавливаем userId
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            characterData.userId = user.uid;
        }
    });
    
    // Настройка шагов
    setupSteps();
    
    // Настройка обработчиков формы
    setupFormHandlers();
    
    // Настройка предпросмотра
    setupPreview();
}

// Настройка шагов
function setupSteps() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Кнопка "Далее"
    nextBtn.addEventListener('click', function() {
        if (validateStep(currentStep)) {
            currentStep++;
            updateSteps();
        }
    });
    
    // Кнопка "Назад"
    prevBtn.addEventListener('click', function() {
        currentStep--;
        updateSteps();
    });
    
    // Кнопка "Создать"
    submitBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        await submitCharacter();
    });
    
    // Обновляем отображение шагов
    updateSteps();
}

// Валидация шага
function validateStep(step) {
    switch (step) {
        case 1:
            const name = document.getElementById('charName').value.trim();
            if (!name) {
                alert('Введите имя персонажа');
                return false;
            }
            if (name.length > 50) {
                alert('Имя не должно превышать 50 символов');
                return false;
            }
            characterData.name = name;
            characterData.race = document.getElementById('charRace').value;
            characterData.class = document.getElementById('charClass').value;
            characterData.bio = document.getElementById('charBio').value;
            return true;
            
        case 2:
            // Валидация внешности
            return true;
            
        case 3:
            // Валидация характеристик
            return true;
            
        default:
            return true;
    }
}

// Обновление отображения шагов
function updateSteps() {
    // Скрываем все шаги
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.getElementById('step' + i);
        const stepIndicator = document.querySelector(`.step[data-step="${i}"]`);
        
        if (stepElement) {
            stepElement.classList.remove('active');
        }
        
        if (stepIndicator) {
            stepIndicator.classList.remove('active');
        }
    }
    
    // Показываем текущий шаг
    const currentStepElement = document.getElementById('step' + currentStep);
    const currentIndicator = document.querySelector(`.step[data-step="${currentStep}"]`);
    
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    if (currentIndicator) {
        currentIndicator.classList.add('active');
    }
    
    // Обновляем прогресс
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }
    
    // Обновляем номер шага
    document.getElementById('currentStep').textContent = currentStep;
    
    // Обновляем кнопки
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentStep === 1;
    }
    
    if (nextBtn && submitBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }
}

// Настройка обработчиков формы
function setupFormHandlers() {
    // Обновление предпросмотра при изменении полей
    const formFields = ['charName', 'charRace', 'charClass', 'charBio'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updatePreview);
        }
    });
    
    // Сохранение черновика
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }
}

// Настройка предпросмотра
function setupPreview() {
    updatePreview();
}

// Обновление предпросмотра
function updatePreview() {
    const name = document.getElementById('charName').value.trim() || 'Имя персонажа';
    const race = document.getElementById('charRace').value;
    const charClass = document.getElementById('charClass').value;
    const bio = document.getElementById('charBio').value || 'Биография...';
    
    // Получаем названия расы и класса
    const raceNames = {
        human: 'Человек',
        elf: 'Эльф',
        dwarf: 'Гном',
        orc: 'Орк',
        custom: 'Другая'
    };
    
    const classNames = {
        warrior: 'Воин',
        mage: 'Маг',
        rogue: 'Разбойник',
        cleric: 'Жрец',
        custom: 'Другой'
    };
    
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewRaceClass').textContent = 
        `${raceNames[race] || race} • ${classNames[charClass] || charClass}`;
    document.getElementById('previewBio').textContent = 
        bio.length > 100 ? bio.substring(0, 100) + '...' : bio;
}

// Сохранение черновика
function saveDraft() {
    // Собираем данные
    characterData.name = document.getElementById('charName').value.trim();
    characterData.race = document.getElementById('charRace').value;
    characterData.class = document.getElementById('charClass').value;
    characterData.bio = document.getElementById('charBio').value;
    
    // Сохраняем в localStorage
    localStorage.setItem('characterDraft', JSON.stringify(characterData));
    
    alert('Черновик сохранен! Вы можете продолжить позже.');
}

// Отправка персонажа
async function submitCharacter() {
    try {
        // Собираем финальные данные
        characterData.name = document.getElementById('charName').value.trim();
        characterData.race = document.getElementById('charRace').value;
        characterData.class = document.getElementById('charClass').value;
        characterData.bio = document.getElementById('charBio').value;
        
        // Добавляем метаданные
        characterData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        characterData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        characterData.level = 1;
        characterData.xp = 0;
        
        // Проверяем, что имя заполнено
        if (!characterData.name) {
            alert('Введите имя персонажа');
            return;
        }
        
        // Показываем загрузку
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Создание...';
        submitBtn.disabled = true;
        
        // Сохраняем в Firestore
        const characterRef = await db.collection('characters').add(characterData);
        
        console.log('Персонаж создан с ID:', characterRef.id);
        
        // Обновляем пользователя (добавляем ID персонажа)
        await db.collection('users').doc(characterData.userId).update({
            characters: firebase.firestore.FieldValue.arrayUnion(characterRef.id)
        });
        
        // Очищаем черновик
        localStorage.removeItem('characterDraft');
        
        // Показываем успех
        alert('Персонаж успешно создан!');
        
        // Редирект на панель
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка создания персонажа:', error);
        alert('Ошибка создания персонажа: ' + error.message);
        
        // Восстанавливаем кнопку
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.textContent = '✅ Создать персонажа';
        submitBtn.disabled = false;
    }
}

// Загрузка черновика если есть
document.addEventListener('DOMContentLoaded', function() {
    const draft = localStorage.getItem('characterDraft');
    if (draft) {
        try {
            const draftData = JSON.parse(draft);
            
            // Заполняем поля из черновика
            if (document.getElementById('charName') && draftData.name) {
                document.getElementById('charName').value = draftData.name;
            }
            if (document.getElementById('charRace') && draftData.race) {
                document.getElementById('charRace').value = draftData.race;
            }
            if (document.getElementById('charClass') && draftData.class) {
                document.getElementById('charClass').value = draftData.class;
            }
            if (document.getElementById('charBio') && draftData.bio) {
                document.getElementById('charBio').value = draftData.bio;
            }
            
            // Обновляем предпросмотр
            updatePreview();
            
            console.log('Черновик загружен');
        } catch (error) {
            console.error('Ошибка загрузки черновика:', error);
        }
    }
});
