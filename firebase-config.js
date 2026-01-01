// firebase-config.js
// ВАЖНО: Замените эти значения на свои из Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAqR3YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef1234567890"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Экспортируем сервисы
const auth = firebase.auth();
const db = firebase.firestore();

// Проверяем, что Firebase загружен
console.log("Firebase инициализирован");
