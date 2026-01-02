// js/firebase-config.js

// ===== ВАШИ РЕАЛЬНЫЕ ДАННЫЕ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyCF399qSKsQTGuQd87J0hp9JsnuDdDZe5I",
    authDomain: "dnd-character-sheets-b34d3.firebaseapp.com",
    projectId: "dnd-character-sheets-b34d3",
    storageBucket: "dnd-character-sheets-b34d3.firebasestorage.app",
    messagingSenderId: "789096168700",
    appId: "1:789096168700:web:35667b8558a3ac693f6b79"
};

// ===== ПРОВЕРКА ЗАГРУЗКИ FIREBASE SDK =====
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK не загружен! Проверьте:');
    console.error('1. Подключение к интернету');
    console.error('2. Что скрипты Firebase загружаются в HTML');
    console.error('3. Блокировку рекламы/скриптов');
    
    // Создаем заглушки для оффлайн режима
    window.firebaseAuth = createMockAuth();
    window.firebaseDb = createMockDb();
    
    console.warn('⚠️ Используется локальный режим (данные сохраняются только в этом браузере)');
} else {
    // ===== ИНИЦИАЛИЗАЦИЯ FIREBASE =====
    try {
        // Инициализируем Firebase
        const app = firebase.initializeApp(firebaseConfig);
        
        // Получаем нужные сервисы
        const auth = firebase.auth();
        const db = firebase.firestore();
        const firestore = firebase.firestore;
        
        // Настраиваем Firestore
        if (window.location.hostname === "localhost") {
            // Режим разработки
            db.settings({
                experimentalForceLongPolling: true
            });
        }
        
        // Экспортируем для использования
        window.firebaseAuth = auth;
        window.firebaseDb = db;
        window.firestore = firestore;
        
        console.log('✅ Firebase успешно инициализирован!');
        console.log('📁 Проект:', firebaseConfig.projectId);
        
        // Проверяем подключение
        testFirebaseConnection();
        
    } catch (error) {
        console.error('❌ Ошибка инициализации Firebase:', error);
        
        // Используем заглушки при ошибке
        window.firebaseAuth = createMockAuth();
        window.firebaseDb = createMockDb();
    }
}

// ===== ФУНКЦИИ ДЛЯ ЗАГЛУШЕК =====

function createMockAuth() {
    console.log('🎮 Создан моковый Auth для оффлайн режима');
    
    return {
        currentUser: null,
        
        onAuthStateChanged(callback) {
            // Проверяем localStorage
            const user = JSON.parse(localStorage.getItem('astralum_user') || 'null');
            if (user) {
                this.currentUser = user;
            }
            
            // Вызываем callback сразу
            callback(this.currentUser);
            
            // Возвращаем функцию отписки
            return () => {};
        },
        
        signInWithEmailAndPassword(email, password) {
            console.log('🔐 Моковый вход:', email);
            
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    // Проверяем существующего пользователя
                    const users = JSON.parse(localStorage.getItem('astralum_users') || '{}');
                    
                    if (users[email] && users[email].password === password) {
                        const user = {
                            uid: 'mock_' + Date.now(),
                            email: email,
                            displayName: users[email].name || email.split('@')[0],
                            isMock: true
                        };
                        
                        this.currentUser = user;
                        localStorage.setItem('astralum_user', JSON.stringify(user));
                        
                        resolve({ user });
                    } else {
                        reject(new Error('auth/user-not-found'));
                    }
                }, 500);
            });
        },
        
        createUserWithEmailAndPassword(email, password) {
            console.log('📝 Моковая регистрация:', email);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    // Сохраняем в моковую базу
                    const users = JSON.parse(localStorage.getItem('astralum_users') || '{}');
                    users[email] = {
                        email: email,
                        password: password,
                        name: email.split('@')[0],
                        createdAt: new Date().toISOString()
                    };
                    localStorage.setItem('astralum_users', JSON.stringify(users));
                    
                    const user = {
                        uid: 'mock_' + Date.now(),
                        email: email,
                        displayName: email.split('@')[0],
                        isMock: true
                    };
                    
                    this.currentUser = user;
                    localStorage.setItem('astralum_user', JSON.stringify(user));
                    
                    resolve({ user });
                }, 500);
            });
        },
        
        signOut() {
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.currentUser = null;
                    localStorage.removeItem('astralum_user');
                    resolve();
                }, 300);
            });
        }
    };
}

function createMockDb() {
    console.log('💾 Создан моковый Firestore для оффлайн режима');
    
    return {
        collection(name) {
            return {
                doc(id) {
                    return {
                        set(data, options = {}) {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    const key = `mock_${name}_${id}`;
                                    
                                    if (options.merge) {
                                        // Объединяем с существующими данными
                                        const existing = JSON.parse(localStorage.getItem(key) || '{}');
                                        localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
                                    } else {
                                        localStorage.setItem(key, JSON.stringify(data));
                                    }
                                    
                                    console.log('💾 Моковое сохранение:', name, id, data);
                                    resolve();
                                }, 300);
                            });
                        },
                        
                        get() {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    const key = `mock_${name}_${id}`;
                                    const data = localStorage.getItem(key);
                                    
                                    resolve({
                                        exists: !!data,
                                        data: () => JSON.parse(data || '{}'),
                                        id: id
                                    });
                                }, 200);
                            });
                        },
                        
                        update(data) {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    const key = `mock_${name}_${id}`;
                                    const existing = JSON.parse(localStorage.getItem(key) || '{}');
                                    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
                                    
                                    console.log('🔄 Моковое обновление:', name, id, data);
                                    resolve();
                                }, 300);
                            });
                        },
                        
                        delete() {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    const key = `mock_${name}_${id}`;
                                    localStorage.removeItem(key);
                                    resolve();
                                }, 200);
                            });
                        }
                    };
                },
                
                add(data) {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const id = 'mock_' + Date.now() + Math.random().toString(36).substr(2, 9);
                            const key = `mock_${name}_${id}`;
                            localStorage.setItem(key, JSON.stringify(data));
                            
                            console.log('➕ Моковое добавление:', name, id);
                            resolve({ id: id });
                        }, 300);
                    });
                },
                
                where(field, operator, value) {
                    return {
                        get() {
                            return new Promise((resolve) => {
                                setTimeout(() => {
                                    // Фильтрация моковых данных (упрощенная)
                                    const prefix = `mock_${name}_`;
                                    const results = [];
                                    
                                    for (let i = 0; i < localStorage.length; i++) {
                                        const key = localStorage.key(i);
                                        if (key.startsWith(prefix)) {
                                            const data = JSON.parse(localStorage.getItem(key));
                                            if (this.filterData(data, field, operator, value)) {
                                                results.push({
                                                    id: key.replace(prefix, ''),
                                                    data: () => data
                                                });
                                            }
                                        }
                                    }
                                    
                                    resolve({
                                        docs: results,
                                        empty: results.length === 0
                                    });
                                }, 400);
                            });
                        },
                        
                        filterData(data, field, operator, value) {
                            // Простая фильтрация
                            if (!(field in data)) return false;
                            
                            switch(operator) {
                                case '==': return data[field] === value;
                                case '!=': return data[field] !== value;
                                case '>': return data[field] > value;
                                case '<': return data[field] < value;
                                case '>=': return data[field] >= value;
                                case '<=': return data[field] <= value;
                                case 'array-contains': return Array.isArray(data[field]) && data[field].includes(value);
                                default: return false;
                            }
                        }
                    };
                }
            };
        }
    };
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

async function testFirebaseConnection() {
    try {
        // Проверяем подключение к Firestore
        await window.firebaseDb.collection('connection_test').doc('test').set({
            test: true,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('📡 Связь с Firestore установлена');
        
        // Удаляем тестовый документ
        await window.firebaseDb.collection('connection_test').doc('test').delete();
        
    } catch (error) {
        console.warn('⚠️ Firestore недоступен:', error.message);
        console.info('ℹ️ Используется локальное хранилище');
    }
}

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ИСПОЛЬЗОВАНИЯ =====

/**
 * Сохраняет данные в Firebase или локально
 */
window.saveToChronicle = async (collection, docId, data) => {
    try {
        const user = window.getCurrentUser();
        
        // Добавляем метаданные
        const dataWithMeta = {
            ...data,
            updatedAt: new Date().toISOString(),
            ownerId: user?.uid || 'guest'
        };
        
        if (window.firebaseDb && user && !user.isMock) {
            // Сохраняем в Firebase
            await window.firebaseDb.collection(collection).doc(docId).set(dataWithMeta, { merge: true });
            console.log('☁️ Сохранено в облако:', collection, docId);
            return { success: true, source: 'firebase' };
        } else {
            // Сохраняем локально
            const key = `chronicle_${collection}_${docId}`;
            localStorage.setItem(key, JSON.stringify(dataWithMeta));
            console.log('💾 Сохранено локально:', collection, docId);
            return { success: true, source: 'local' };
        }
    } catch (error) {
        console.error('❌ Ошибка сохранения:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Загружает данные из Firebase или локально
 */
window.loadFromChronicle = async (collection, docId) => {
    try {
        const user = window.getCurrentUser();
        
        if (window.firebaseDb && user && !user.isMock) {
            // Загружаем из Firebase
            const doc = await window.firebaseDb.collection(collection).doc(docId).get();
            
            if (doc.exists) {
                console.log('☁️ Загружено из облака:', collection, docId);
                return { data: doc.data(), source: 'firebase' };
            }
        }
        
        // Загружаем локально
        const key = `chronicle_${collection}_${docId}`;
        const data = localStorage.getItem(key);
        
        if (data) {
            console.log('💾 Загружено локально:', collection, docId);
            return { data: JSON.parse(data), source: 'local' };
        }
        
        return { data: null, source: 'none' };
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        return { data: null, source: 'error', error: error.message };
    }
};

/**
 * Получает текущего пользователя
 */
window.getCurrentUser = () => {
    // Сначала проверяем Firebase
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        return window.firebaseAuth.currentUser;
    }
    
    // Затем проверяем localStorage
    const savedUser = localStorage.getItem('astralum_user');
    if (savedUser) {
        return JSON.parse(savedUser);
    }
    
    return null;
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
        
        // Обновляем страницу для очистки состояния
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('❌ Ошибка выхода:', error);
        return false;
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', () => {
    const user = window.getCurrentUser();
    
    if (user) {
        console.log('📖 Добро пожаловать, летописец', user.email || user.displayName || 'Гость');
    } else {
        console.log('🏰 Добро пожаловать в Хроники Астралума');
    }
    
    // Проверяем состояние Firebase
    if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
        window.firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('👤 Firebase: пользователь авторизован', user.email);
            } else {
                console.log('👤 Firebase: пользователь не авторизован');
            }
        });
    }
});
