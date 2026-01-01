// firebase-config.js - ПОЛУЧИТЕ ЭТИ ЗНАЧЕНИЯ ИЗ FIREBASE CONSOLE!

// ВАЖНО: Замените ВСЕ значения ниже на свои реальные из Firebase Console

const firebaseConfig = {
    // 1. apiKey - ДЛИННЫЙ ключ, начинается с "AIzaSy..."
    apiKey: "AIzaSyDEXAMPLE1234567890AbCdEfGhIjKlMnOpQ",
    
    // 2. authDomain - ваш-проект.firebaseapp.com
    authDomain: "your-project-name-12345.firebaseapp.com",
    
    // 3. projectId - ID проекта (без .firebaseapp.com)
    projectId: "your-project-name-12345",
    
    // 4. storageBucket - ваш-проект.appspot.com
    storageBucket: "your-project-name-12345.appspot.com",
    
    // 5. messagingSenderId - цифры, например "123456789012"
    messagingSenderId: "123456789012",
    
    // 6. appId - начинается с "1:", например "1:123456789012:web:abc123def456"
    appId: "1:123456789012:web:abc123def4567890abcdef"
};

// Проверяем, загружен ли Firebase
if (typeof firebase !== 'undefined') {
    // Инициализируем только если не инициализирован
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log("✅ Firebase инициализирован с конфигом:", firebaseConfig.projectId);
    } else {
        console.log("ℹ️ Firebase уже инициализирован");
    }
} else {
    console.error("❌ Firebase SDK не загружен!");
}

// Экспортируем для удобства
const auth = firebase.auth ? firebase.auth() : null;
const db = firebase.firestore ? firebase.firestore() : null;
