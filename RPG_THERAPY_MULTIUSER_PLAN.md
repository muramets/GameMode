# RPG Therapy Multi-User Implementation Plan

## 📋 Текущее состояние приложения

### Архитектура
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: LocalStorage браузера 
- **Hosting**: GitHub Pages (статические файлы)
- **Data Structure**: JSON в localStorage
- **Mobile**: Частично адаптивный (есть responsive.css)

### Основные данные
- **Protocols** (протоколы развития)
- **Skills** (навыки с прогрессом 0-100%)
- **States** (текущие состояния: энергия, фокус, настроение)
- **History** (история всех действий)
- **Quick Actions** (быстрые действия на dashboard)

### Текущие ограничения
- Данные локальны для каждого браузера/устройства
- Нет синхронизации между устройствами
- Нет возможности делиться прогрессом
- Нет системы пользователей

## 🎯 Цели трансформации

1. **Multi-user поддержка** с регистрацией/авторизацией
2. **Cross-device синхронизация** данных
3. **Mobile access** с сохранением данных
4. **Облачное хранение** пользовательских данных
5. **Scalability** для привлечения пользователей

## 🏗️ Архитектура решения (по образцу Monkeytype)

### Backend Infrastructure

#### 1. Firebase Authentication
```javascript
// Аналогично monkeytype/frontend/src/ts/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "rpg-therapy.firebaseapp.com", 
  projectId: "rpg-therapy",
  // ...
};

export const app = initializeApp(firebaseConfig);
export const Auth = getAuth(app);
```

#### 2. Node.js Backend (Express.js)
```
backend/
├── src/
│   ├── controllers/
│   │   ├── user.js
│   │   ├── protocols.js  
│   │   ├── skills.js
│   │   └── history.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Protocol.js
│   │   └── Skill.js
│   ├── routes/
│   │   └── api.js
│   └── server.js
├── package.json
└── .env
```

#### 3. Database (MongoDB + Redis)
- **MongoDB**: Основные пользовательские данные
- **Redis**: Кэширование и сессии

### Database Schema

#### Users Collection
```javascript
{
  _id: ObjectId,
  uid: "firebase_uid", // Firebase UID
  name: "PlayerName",
  email: "player@example.com", 
  createdAt: ISODate,
  lastLogin: ISODate,
  preferences: {
    theme: "dark",
    language: "ru"
  }
}
```

#### UserData Collection  
```javascript
{
  _id: ObjectId,
  uid: "firebase_uid",
  protocols: [
    {
      id: 1,
      name: "Morning Routine",
      description: "Daily morning protocol", 
      icon: "🌅",
      targets: ["energy", "focus"],
      weight: 1,
      hover: "Tooltip text",
      category: "daily",
      createdAt: ISODate,
      updatedAt: ISODate
    }
  ],
  skills: [
    {
      id: 101,
      name: "Discipline", 
      description: "Self-control and consistency",
      icon: "🎯",
      score: 75,
      lastUpdated: ISODate,
      weight: 1,
      hover: "Tooltip text"
    }
  ],
  states: {
    energy: { value: 85, icon: "⚡", name: "Energy" },
    focus: { value: 70, icon: "🎯", name: "Focus" },
    mood: { value: 90, icon: "😊", name: "Mood" },
    stress: { value: 30, icon: "😰", name: "Stress" }
  },
  quickActions: [1, 2, 7, 8, 10],
  orders: {
    protocols: [3, 1, 5, 2, 4],
    skills: [101, 103, 102, 105, 104],
    quickActions: [1, 7, 2, 10, 8]
  },
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### History Collection
```javascript
{
  _id: ObjectId,
  uid: "firebase_uid",
  timestamp: ISODate,
  type: "protocol", // "skill", "drag_drop"
  action: "check_in",
  targetId: 1,
  changes: [
    { skill: "energy", from: 70, to: 85 },
    { skill: "focus", from: 60, to: 75 }
  ],
  details: "Morning Routine completed"
}
```

## 🔐 Authentication System

### Frontend Auth Controller (аналог monkeytype)
```javascript
// js/auth-controller.js
export class AuthController {
  
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(Auth, email, password);
      await this.loadUserData(userCredential.user);
      UI.showDashboard();
    } catch (error) {
      UI.showError(this.parseFirebaseError(error));
    }
  }
  
  async signUp(name, email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(Auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Создаем профиль пользователя в backend
      await this.createUserProfile(userCredential.user);
      await this.loadUserData(userCredential.user);
      
      UI.showDashboard();
    } catch (error) {
      UI.showError(this.parseFirebaseError(error));
    }
  }
  
  async loadUserData(user) {
    try {
      const token = await user.getIdToken();
      const userData = await API.getUserData(token);
      Storage.syncFromServer(userData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }
}
```

### Backend API Routes
```javascript
// backend/src/routes/api.js
router.get('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOne({ uid: req.user.uid });
    res.json(userData || getDefaultUserData());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOneAndUpdate(
      { uid: req.user.uid },
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 📱 Frontend Implementation

### 1. Login/Register UI
```html
<!-- login.html или интеграция в index.html -->
<div class="auth-container" id="authContainer">
  <div class="auth-form login-form" id="loginForm">
    <h2>RPG Therapy</h2>
    <form>
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Password" required>
      <button type="submit">Sign In</button>
    </form>
    <p>Don't have an account? <a href="#" id="showRegister">Sign Up</a></p>
  </div>
  
  <div class="auth-form register-form hidden" id="registerForm">
    <h2>Create Account</h2>
    <form>
      <input type="text" placeholder="Player Name" required>
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Password" required>
      <button type="submit">Create Account</button>
    </form>
    <p>Already have an account? <a href="#" id="showLogin">Sign In</a></p>
  </div>
</div>
```

### 2. Modified Storage System
```javascript
// js/storage.js - модифицированный
const Storage = {
  // Локальный режим (fallback)
  localMode: false,
  
  // API клиент для работы с сервером
  async syncToServer(data) {
    if (this.localMode || !Auth.currentUser) return;
    
    try {
      const token = await Auth.currentUser.getIdToken();
      await API.saveUserData(token, data);
    } catch (error) {
      console.error('Sync to server failed:', error);
      // Продолжаем работать локально
    }
  },
  
  async syncFromServer() {
    if (this.localMode || !Auth.currentUser) return;
    
    try {
      const token = await Auth.currentUser.getIdToken();
      const serverData = await API.getUserData(token);
      
      // Мерджим данные с локальными (в случае конфликтов)
      this.mergeData(serverData);
    } catch (error) {
      console.error('Sync from server failed:', error);
    }
  },
  
  // Модифицированный set для автосинка
  async set(key, value) {
    // Сохраняем локально
    localStorage.setItem(key, JSON.stringify(value));
    
    // Синкаем с сервером
    await this.syncToServer(this.getAllData());
  }
};
```

### 3. API Client
```javascript
// js/api.js
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async getUserData(token) {
    return this.request('/user/data', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async saveUserData(token, data) {
    return this.request('/user/data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  }
}

export const API = new APIClient('https://api.rpg-therapy.com');
```

## 🚀 Implementation Phases

### Phase 1: Backend Setup (2-3 недели)
1. **Настройка Firebase проекта**
   - Создание Firebase проекта
   - Настройка Authentication (Email/Password)
   - Генерация Service Account Key

2. **Backend разработка**
   - Express.js сервер с MongoDB
   - Firebase Admin SDK интеграция
   - API эндпоинты для CRUD операций
   - Middleware аутентификации

3. **Deployment**
   - Heroku/Railway/DigitalOcean для backend
   - MongoDB Atlas для базы данных
   - Redis Cloud для кэширования

### Phase 2: Frontend Auth (1-2 недели)
1. **Auth UI компоненты**
   - Страница логина/регистрации
   - Стили в стиле monkeytype
   - Валидация форм

2. **Auth Controller**
   - Firebase клиент интеграция
   - Обработка ошибок
   - Auto-login при перезагрузке

3. **Route Protection**
   - Редирект на login если не авторизован
   - Сохранение состояния аутентификации

### Phase 3: Data Sync (2-3 недели)
1. **Storage Migration**
   - Модификация storage.js
   - API client интеграция
   - Conflict resolution стратегия

2. **Real-time Sync**
   - Auto-sync при изменениях
   - Offline режим support
   - Error handling и retry logic

3. **Migration Tool**
   - Импорт локальных данных на сервер
   - Backup/restore функционал

### Phase 4: Mobile Optimization (1 неделя)
1. **Responsive Improvements**
   - Touch-friendly элементы
   - Mobile navigation
   - PWA манифест

2. **Performance**
   - Lazy loading
   - Caching стратегии
   - Минификация assets

### Phase 5: Production (1 неделя)
1. **Testing**
   - Auth flow тестирование
   - Cross-device sync тестирование
   - Performance тестирование

2. **Deploy**
   - GitHub Pages для frontend (или Netlify)
   - Production backend deploy
   - Domain setup

## 💰 Hosting Options

### GitHub Pages + Free Backend
- **Frontend**: GitHub Pages (бесплатно)
- **Backend**: Railway Free Tier (500 часов/месяц)
- **Database**: MongoDB Atlas Free (512MB)
- **Auth**: Firebase Free Plan (до 10k пользователей)

### Upgraded Option
- **Frontend**: Netlify Pro (~$19/мес)
- **Backend**: Railway Pro (~$5-20/мес) 
- **Database**: MongoDB Atlas Shared (~$9/мес)
- **CDN**: Cloudflare (бесплатно)

## 🔧 Configuration Files

### Frontend (.env)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=rpg-therapy.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rpg-therapy
VITE_API_BASE_URL=https://api.rpg-therapy.com
```

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

## 📊 Migration Strategy

### Для существующих пользователей
1. **Первый вход**: Автоматический импорт localStorage данных на сервер
2. **Backup**: Экспорт данных в JSON перед миграцией
3. **Fallback**: Возможность работы в offline режиме

### Data Integrity
- Валидация данных при импорте
- Версионирование схемы данных
- Rollback механизмы

## 🚀 Next Steps

1. **Immediate**: Создать Firebase проект и получить config
2. **Backend**: Настроить базовый Express.js сервер
3. **Auth**: Реализовать регистрацию/логин
4. **Testing**: Протестировать auth flow
5. **Data Sync**: Добавить синхронизацию данных
6. **Mobile**: Оптимизировать мобильную версию
7. **Production**: Deploy и тестирование

## 💡 Additional Features (Future)

- **Social Features**: Поделиться прогрессом с друзьями
- **Leaderboards**: Рейтинги по навыкам
- **Achievements**: Система достижений
- **Analytics**: Детальная аналитика прогресса
- **Export/Import**: Backup и перенос данных
- **Themes**: Кастомные темы приложения

---

**Готов к реализации!** 🚀 