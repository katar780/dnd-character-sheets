// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF399qSKsQTGuQd87JOhp9JsnuDdDZe5I",
  authDomain: "dnd-character-sheets-b34d3.firebaseapp.com",
  projectId: "dnd-character-sheets-b34d3",
  storageBucket: "dnd-character-sheets-b34d3.firebasestorage.app",
  messagingSenderId: "789096168700",
  appId: "1:789096168700:web:35657b8558a3ac693f6b79"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// ==== НЕ ИЗМЕНЯЙТЕ КОД НИЖЕ ====

// Инициализируем Firebase
firebase.initializeApp(firebaseConfig);

// Экспортируем нужные модули
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Для использования в других файлах
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;

console.log("✅ Firebase инициализирован успешно!");
