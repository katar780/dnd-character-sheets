// Firebase система авторизации и данных

class FirebaseAuthSystem {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.currentUser = null;
        this.init();
    }

    // Инициализация
    init() {
        // Слушаем изменения состояния авторизации
        this.auth.onAuthStateChanged((user) => {
            console.log('Состояние авторизации изменено:', user);
            this.currentUser = user;
            this.updateUI(user);
            
            if (user) {
                // Загружаем дополнительные данные пользователя
                this.loadUserData(user.uid);
            }
        });
    }

    // Регистрация нового пользователя
    async register(userData) {
        try {
            console.log('Регистрация через Firebase:', userData);
            
            // Создаем пользователя в Firebase Authentication
            const userCredential = await this.auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            
            // Сохраняем дополнительные данные в Firestore
            await this.db.collection('users').doc(user.uid).set({
                username: userData.username,
                email: userData.email,
                userType: userData.userType || 'player',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                characters: [],
                campaigns: []
            });
            
            console.log('Пользователь зарегистрирован:', user.uid);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            let message = 'Ошибка регистрации';
            
            if (error.code === 'auth/email-already-in-use') {
                message = 'Email уже используется';
            } else if (error.code === 'auth/weak-password') {
                message = 'Пароль слишком слабый (минимум 6 символов)';
            }
            
            return { success: false, message: message };
        }
    }

    // Вход в систему
    async login(email, password) {
        try {
            console.log('Вход через Firebase:', email);
            
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Успешный вход:', user.uid);
            return { success: true, user: user };
            
        } catch (error) {
            console.error('Ошибка входа:', error);
            let message = 'Ошибка входа';
            
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                message = 'Неверный email или пароль';
            } else if (error.code === 'auth/too-many-requests') {
                message = 'Слишком много попыток. Попробуйте позже';
            }
            
            return { success: false, message: message };
        }
    }

    // Вход по имени пользователя или email
    async loginWithIdentifier(identifier, password) {
        // Сначала пробуем как email
        if (identifier.includes('@')) {
            return await this.login(identifier, password);
        }
        
        // Если не email, ищем пользователя по username
        try {
            const usersSnapshot = await this.db.collection('users')
                .where('username', '==', identifier)
                .limit(1)
                .get();
            
            if (usersSnapshot.empty) {
                return { success: false, message: 'Пользователь не найден' };
            }
            
            const userDoc = usersSnapshot.docs[0];
            const userData = userDoc.data();
            
            // Входим по email из данных пользователя
            return await this.login(userData.email, password);
            
        } catch (error) {
            console.error('Ошибка поиска пользователя:', error);
            return { success: false, message: 'Ошибка входа' };
        }
    }

    // Выход из системы
    async logout() {
        try {
            await this.auth.signOut();
            console.log('Выход выполнен');
            return { success: true, message: 'Выход выполнен' };
        } catch (error) {
            console.error('Ошибка выхода:', error);
            return { success: false, message: 'Ошибка выхода' };
        }
    }

    // Получение данных пользователя
    async getUserData(uid = null) {
        try {
            const userId = uid || (this.currentUser ? this.currentUser.uid : null);
            if (!userId) return null;
            
            const userDoc = await this.db.collection('users').doc(userId).get();
            
            if (userDoc.exists) {
                const data = userDoc.data();
                return {
                    uid: userId,
                    email: this.currentUser?.email,
                    ...data
                };
            }
            
            return null;
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            return null;
        }
    }

    // Загрузка данных пользователя
    async loadUserData(uid) {
        const userData = await this.getUserData(uid);
        
        if (userData) {
            // Сохраняем в localStorage для быстрого доступа
            localStorage.setItem('firebase_user_data', JSON.stringify(userData));
            
            // Обновляем UI
            this.updateUI(userData);
            
            // Отправляем событие
            window.dispatchEvent(new CustomEvent('userDataLoaded', { 
                detail: userData 
            }));
        }
        
        return userData;
    }

    // Создание персонажа
    async createCharacter(characterData) {
        try {
            if (!this.currentUser) {
                return { success: false, message: 'Пользователь не авторизован' };
            }
            
            const character = {
                ...characterData,
                id: Date.now().toString(),
                userId: this.currentUser.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Сохраняем в Firestore
            await this.db.collection('characters').add(character);
            
            // Обновляем список персонажей пользователя
            await this.db.collection('users').doc(this.currentUser.uid).update({
                characters: firebase.firestore.FieldValue.arrayUnion(character.id)
            });
            
            console.log('Персонаж создан:', character.id);
            return { success: true, character: character };
            
        } catch (error) {
            console.error('Ошибка создания персонажа:', error);
            return { success: false, message: 'Ошибка создания персонажа' };
        }
    }

    // Получение персонажей пользователя
    async getUserCharacters() {
        try {
            if (!this.currentUser) return [];
            
            const charactersSnapshot = await this.db.collection('characters')
                .where('userId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();
            
            return charactersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Ошибка получения персонажей:', error);
            return [];
        }
    }

    // Получение всех пользователей (для ГМа)
    async getAllUsers() {
        try {
            const usersSnapshot = await this.db.collection('users').get();
            
            return usersSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            
        } catch (error) {
            console.error('Ошибка получения пользователей:', error);
            return [];
        }
    }

    // Обновление UI в зависимости от авторизации
    updateUI(user) {
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(element => {
            const authType = element.getAttribute('data-auth');
            
            switch(authType) {
                case 'show-if-auth':
                    element.style.display = user ? 'block' : 'none';
                    break;
                case 'show-if-not-auth':
                    element.style.display = user ? 'none' : 'block';
                    break;
                case 'username':
                    if (user && element.textContent.includes('{username}')) {
                        const username = user.username || user.email?.split('@')[0] || 'Пользователь';
                        element.textContent = element.textContent.replace('{username}', username);
                    }
                    break;
                case 'user-type':
                    if (user && user.userType) {
                        const types = {
                            'player': '🎮 Игрок',
                            'gm': '🎭 Мастер',
                            'both': '⚔️ Игрок и Мастер'
                        };
                        element.textContent = types[user.userType] || user.userType;
                    }
                    break;
            }
        });
    }

    // Проверка, является ли пользователь ГМом
    isGM(userData = null) {
        const user = userData || JSON.parse(localStorage.getItem('firebase_user_data') || '{}');
        return user && (user.userType === 'gm' || user.userType === 'both');
    }
}

// Глобальный экземпляр
let firebaseAuth = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    if (typeof firebase !== 'undefined') {
        firebaseAuth = new FirebaseAuthSystem();
        console.log('FirebaseAuthSystem инициализирован');
        
        // Проверяем, авторизован ли пользователь
        setTimeout(() => {
            if (firebaseAuth.currentUser) {
                console.log('Пользователь уже авторизован:', firebaseAuth.currentUser.uid);
            }
        }, 1000);
    } else {
        console.error('Firebase не загружен!');
    }
});
