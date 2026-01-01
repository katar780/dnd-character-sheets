// firebase-config.js - ЗАМЕНИТЕ НА СВОИ ЗНАЧЕНИЯ!
// Получите их здесь: Firebase Console → Project Settings → General → Your apps → Web app

const firebaseConfig = {
    apiKey: "AIzaSyABC123DEF456ghi789jkl", // ВАШ РЕАЛЬНЫЙ КЛЮЧ
    authDomain: "ваш-проект.firebaseapp.com",
    projectId: "ваш-проект",
    storageBucket: "ваш-проект.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Инициализация Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase инициализирован успешно");
} else {
    console.log("Firebase уже инициализирован");
}

// Экспортируем для использования в других файлах
const auth = firebase.auth();
const db = firebase.firestore();
