// js/firebase-config.js

// ===== КОНФИГУРАЦИЯ FIREBASE =====
const firebaseConfig = {
    apiKey: "AIzaSyCF399qSKsQTGuQd87J0hp9JsnuDdDZe5I",
    authDomain: "dnd-character-sheets-b34d3.firebaseapp.com",
    projectId: "dnd-character-sheets-b34d3",
    storageBucket: "dnd-character-sheets-b34d3.firebasestorage.app",
    messagingSenderId: "789096168700",
    appId: "1:789096168700:web:35667b8558a3ac693f6b79"
};

// ===== ИНИЦИАЛИЗАЦИЯ =====
let firebaseApp, firebaseAuth, firebaseDb;

try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK не загружен. Проверьте подключение скриптов в HTML.');
    }
    
    // Инициализируем Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firebaseDb = firebase.firestore();
    
    // Настройки Firestore для разработки
    if (window.location.hostname === "localhost") {
        firebaseDb.settings({
            experimentalForceLongPolling: true,
            merge: true
        });
    }
    
    console.log('✅ Firebase успешно инициализирован');
    console.log('📁 Проект:', firebaseConfig.projectId);
    
} catch (error) {
    console.error('❌ Ошибка инициализации Firebase:', error);
    console.warn('⚠️ Работа в оффлайн режиме');
    
    // Создаем заглушки
    firebaseAuth = createMockAuth();
    firebaseDb = createMockFirestore();
}

// ===== ЭКСПОРТ ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ =====
window.firebaseApp = firebaseApp;
window.firebaseAuth = firebaseAuth;
window.firebaseDb = firebaseDb;

// ===== ЗАГЛУШКИ ДЛЯ ОФФЛАЙН РЕЖИМА =====
function createMockAuth() {
    console.log('🔧 Создан моковый Auth');
    
    return {
        currentUser: null,
        
        onAuthStateChanged(callback) {
            const user = JSON.parse(localStorage.getItem('campaign_user') || 'null');
            if (user) {
                this.currentUser = user;
                callback(user);
            } else {
                callback(null);
            }
            
            // Симуляция подписки
            return () => {};
        },
        
        signInWithEmailAndPassword(email, password) {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const users = JSON.parse(localStorage.getItem('campaign_users') || '{}');
                    
                    if (users[email] && users[email].password === password) {
                        const user = {
                            uid: 'mock_' + Date.now(),
                            email: email,
                            displayName: users[email].name,
                            role: users[email].role,
                            isMock: true
                        };
                        
                        this.currentUser = user;
                        localStorage.setItem('campaign_user', JSON.stringify(user));
                        resolve({ user });
                    } else {
                        reject(new Error('auth/user-not-found'));
                    }
                }, 500);
            });
        },
        
        createUserWithEmailAndPassword(email, password) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    const users = JSON.parse(localStorage.getItem('campaign_users') || '{}');
                    users[email] = {
                        email: email,
                        password: password,
                        name: email.split('@')[0],
                        createdAt: new Date().toISOString()
                    };
                    localStorage.setItem('campaign_users', JSON.stringify(users));
                    
                    const user = {
                        uid: 'mock_' + Date.now(),
                        email: email,
                        displayName: email.split('@')[0],
                        isMock: true
                    };
                    
                    this.currentUser = user;
                    localStorage.setItem('campaign_user', JSON.stringify(user));
                    resolve({ user });
                }, 500);
            });
        },
        
        signOut() {
            return new Promise((resolve) => {
                this.currentUser = null;
                localStorage.removeItem('campaign_user');
                resolve();
            });
        }
    };
}

function createMockFirestore() {
    console.log('🔧 Создан моковый Firestore');
    
    return {
        collection(collectionName) {
            return {
                doc(docId) {
                    return {
                        set(data, options = {}) {
                            const key = `mock_${collectionName}_${docId}`;
                            
                            if (options.merge) {
                                const existing = JSON.parse(localStorage.getItem(key) || '{}');
                                localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
                            } else {
                                localStorage.setItem(key, JSON.stringify(data));
                            }
                            
                            console.log('💾 Моковое сохранение:', collectionName, docId);
                            return Promise.resolve();
                        },
                        
                        get() {
                            const key = `mock_${collectionName}_${docId}`;
                            const data = localStorage.getItem(key);
                            
                            return Promise.resolve({
                                exists: !!data,
                                data: () => JSON.parse(data || '{}'),
                                id: docId
                            });
                        },
                        
                        update(data) {
                            const key = `mock_${collectionName}_${docId}`;
                            const existing = JSON.parse(localStorage.getItem(key) || '{}');
                            localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
                            
                            return Promise.resolve();
                        },
                        
                        delete() {
                            const key = `mock_${collectionName}_${docId}`;
                            localStorage.removeItem(key);
                            return Promise.resolve();
                        }
                    };
                },
                
                add(data) {
                    const docId = 'mock_' + Date.now();
                    const key = `mock_${collectionName}_${docId}`;
                    localStorage.setItem(key, JSON.stringify(data));
                    
                    return Promise.resolve({
                        id: docId
                    });
                },
                
                where(field, operator, value) {
                    return {
                        get() {
                            const prefix = `mock_${collectionName}_`;
                            const results = [];
                            
                            for (let i = 0; i < localStorage.length; i++) {
                                const key = localStorage.key(i);
                                if (key.startsWith(prefix)) {
                                    const data = JSON.parse(localStorage.getItem(key));
                                    const docId = key.replace(prefix, '');
                                    
                                    if (filterData(data, field, operator, value)) {
                                        results.push({
                                            id: docId,
                                            data: () => data
                                        });
                                    }
                                }
                            }
                            
                            return Promise.resolve({
                                docs: results,
                                empty: results.length === 0
                            });
                        }
                    };
                    
                    function filterData(data, field, operator, value) {
                        if (!(field in data)) return false;
                        
                        switch(operator) {
                            case '==': return data[field] == value;
                            case '!=': return data[field] != value;
                            case '>': return data[field] > value;
                            case '<': return data[field] < value;
                            case '>=': return data[field] >= value;
                            case '<=': return data[field] <= value;
                            default: return false;
                        }
                    }
                }
            };
        }
    };
}

// ===== УТИЛИТНЫЕ ФУНКЦИИ =====

/**
 * Получить текущего пользователя
 */
window.getCurrentUser = function() {
    if (window.firebaseAuth && window.firebaseAuth.currentUser) {
        return window.firebaseAuth.currentUser;
    }
    
    const savedUser = localStorage.getItem('campaign_user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        return user.isMock ? user : null;
    }
    
    return null;
};

/**
 * Проверить, является ли пользователь мастером
 */
window.isMaster = function() {
    const user = window.getCurrentUser();
    return user && (user.role === 'master' || user.role === 'both');
};

/**
 * Проверить, является ли пользователь игроком
 */
window.isPlayer = function() {
    const user = window.getCurrentUser();
    return user && (user.role === 'player' || user.role === 'both');
};

/**
 * Сохранить данные
 */
window.saveData = async function(collection, docId, data) {
    try {
        const user = window.getCurrentUser();
        
        if (!user) {
            throw new Error('Пользователь не авторизован');
        }
        
        const dataWithMeta = {
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: user.uid
        };
        
        if (window.firebaseDb && !user.isMock) {
            await window.firebaseDb.collection(collection).doc(docId).set(dataWithMeta, { merge: true });
            return { success: true, source: 'firebase' };
        } else {
            const key = `data_${collection}_${docId}`;
            localStorage.setItem(key, JSON.stringify(dataWithMeta));
            return { success: true, source: 'local' };
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Загрузить данные
 */
window.loadData = async function(collection, docId) {
    try {
        const user = window.getCurrentUser();
        
        if (window.firebaseDb && user && !user.isMock) {
            const doc = await window.firebaseDb.collection(collection).doc(docId).get();
            
            if (doc.exists) {
                return { success: true, data: doc.data(), source: 'firebase' };
            }
        }
        
        const key = `data_${collection}_${docId}`;
        const data = localStorage.getItem(key);
        
        if (data) {
            return { success: true, data: JSON.parse(data), source: 'local' };
        }
        
        return { success: false, error: 'Данные не найдены', source: 'none' };
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return { success: false, error: error.message, source: 'error' };
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ =====
document.addEventListener('DOMContentLoaded', function() {
    const user = window.getCurrentUser();
    
    if (user) {
        console.log('👤 Текущий пользователь:', user.email);
    }
    
    // Проверка состояния аутентификации
    if (window.firebaseAuth && window.firebaseAuth.onAuthStateChanged) {
        window.firebaseAuth.onAuthStateChanged(function(user) {
            if (user) {
                console.log('✅ Пользователь Firebase авторизован:', user.email);
                localStorage.setItem('campaign_user', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    role: localStorage.getItem(`user_role_${user.uid}`) || 'player'
                }));
            } else {
                console.log('👤 Пользователь Firebase не авторизован');
            }
        });
    }
});
