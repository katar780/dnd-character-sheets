// js/firebase-config.js

// ===== ВАШИ РЕАЛЬНЫЕ ДАННЫЕ ИЗ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyCF399qSKsQTGuQd87J0hp9JsnuDdDZe5I",
    authDomain: "dnd-character-sheets-b34d3.firebaseapp.com",
    projectId: "dnd-character-sheets-b34d3",
    storageBucket: "dnd-character-sheets-b34d3.firebasestorage.app",
    messagingSenderId: "789096168700",  // Убрал лишний слэш
    appId: "1:789096168700:web:35667b8558a3ac693f6b79"
};

// ===== ИНИЦИАЛИЗАЦИЯ FIREBASE =====
try {
    // Проверяем, что Firebase SDK загружен
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK не загружен. Проверьте подключение к интернету.');
    }
    
    // Инициализируем Firebase
    const app = firebase.initializeApp(firebaseConfig);
    
    // Получаем нужные модули
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Настраиваем Firestore на русскую локаль
    db.settings({
        ignoreUndefinedProperties: true
    });
    
    // Экспортируем для использования в других файлах
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    
    console.log('✅ Firebase успешно инициализирован!');
    console.log('📁 Проект:', firebaseConfig.projectId);
    
    // Проверяем подключение к Firestore
    db.collection('test').doc('connection').set({
        test: 'ok',
        timestamp: new Date()
    }, { merge: true })
    .then(() => console.log('📡 Связь с Firestore установлена'))
    .catch(err => console.warn('⚠️ Firestore недоступен:', err.message));
    
    // Слушаем изменения авторизации
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Пользователь авторизован:', user.email);
            localStorage.setItem('astralum_user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            }));
        } else {
            console.log('👤 Пользователь не авторизован');
            localStorage.removeItem('astralum_user');
        }
    });
    
} catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error.message);
    
    // Создаем заглушки для режима разработки
    window.firebaseAuth = {
        currentUser: null,
        
        onAuthStateChanged: (callback) => {
            const user = JSON.parse(localStorage.getItem('astralum_user') || 'null');
            callback(user ? { uid: 'local_user', email: user.email } : null);
            return () => {};
        },
        
        signInWithEmailAndPassword: (email, password) => {
            console.log('🔐 Локальный вход:', email);
            const user = {
                uid: 'local_' + Date.now(),
                email: email,
                displayName: email.split('@')[0]
            };
            localStorage.setItem('astralum_user', JSON.stringify(user));
            return Promise.resolve({ user });
        },
        
        createUserWithEmailAndPassword: (email, password) => {
            console.log('📝 Локальная регистрация:', email);
            const user = {
                uid: 'local_' + Date.now(),
                email: email,
                displayName: email.split('@')[0]
            };
            localStorage.setItem('astralum_user', JSON.stringify(user));
            return Promise.resolve({ user });
        },
        
        signOut: () => {
            localStorage.removeItem('astralum_user');
            return Promise.resolve();
        }
    };
    
    window.firebaseDb = {
        collection: (name) => ({
            doc: (id) => ({
                set: (data) => {
                    console.log('💾 Локальное сохранение:', name, id, data);
                    const key = `local_${name}_${id}`;
                    localStorage.setItem(key, JSON.stringify(data));
                    return Promise.resolve();
                },
                get: () => {
                    const key = `local_${name}_${id}`;
                    const data = localStorage.getItem(key);
                    return Promise.resolve({
                        exists: !!data,
                        data: () => JSON.parse(data || '{}')
                    });
                }
            })
        })
    };
    
    console.warn('⚠️ Используется локальное хранилище');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Проверяет, есть ли авторизованный пользователь
 */
window.checkAuth = () => {
    const user = JSON.parse(localStorage.getItem('astralum_user') || 'null');
    return user ? user : null;
};

/**
 * Получает текущего пользователя
 */
window.getCurrentUser = () => {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        return window.firebaseAuth.currentUser;
    }
    return window.checkAuth();
};

/**
 * Сохраняет данные в Firestore или локально
 */
window.saveToArchive = async (collection, docId, data) => {
    try {
        const user = window.getCurrentUser();
        const finalData = {
            ...data,
            updatedAt: new Date().toISOString(),
            ownerId: user?.uid || 'guest'
        };
        
        if (window.firebaseDb && user?.uid?.startsWith('local_') === false) {
            // Сохраняем в Firestore
            await window.firebaseDb
                .collection(collection)
                .doc(docId)
                .set(finalData, { merge: true });
            console.log('☁️ Сохранено в облако:', collection, docId);
        } else {
            // Сохраняем локально
            const key = `astralum_${collection}_${docId}`;
            localStorage.setItem(key, JSON.stringify(finalData));
            console.log('💾 Сохранено локально:', collection, docId);
        }
        return true;
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        return false;
    }
};

/**
 * Загружает данные из Firestore или локально
 */
window.loadFromArchive = async (collection, docId) => {
    try {
        const user = window.getCurrentUser();
        
        if (window.firebaseDb && user?.uid?.startsWith('local_') === false) {
            // Загружаем из Firestore
            const doc = await window.firebaseDb
                .collection(collection)
                .doc(docId)
                .get();
                
            if (doc.exists) {
                console.log('☁️ Загружено из облака:', collection, docId);
                return doc.data();
            }
        }
        
        // Загружаем локально
        const key = `astralum_${collection}_${docId}`;
        const data = localStorage.getItem(key);
        if (data) {
            console.log('💾 Загружено локально:', collection, docId);
            return JSON.parse(data);
        }
        
        return null;
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        return null;
    }
};

/**
 * Выход из системы
 */
window.logoutFromChronicles = async () => {
    try {
        if (window.firebaseAuth && window.firebaseAuth.signOut) {
            await window.firebaseAuth.signOut();
        }
        localStorage.removeItem('astralum_user');
        console.log('👋 Выход выполнен');
        return true;
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        return false;
    }
};

// Автоматическая проверка при загрузке
document.addEventListener('DOMContentLoaded', () => {
    const user = window.checkAuth();
    if (user) {
        console.log('📖 Добро пожаловать, летописец', user.email);
    }
});
