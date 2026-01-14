# 🚀 RPG Therapy Multi-User Deployment Guide

Детальная пошаговая инструкция по развертыванию multi-user функциональности для RPG Therapy.

## 📋 Что нужно подготовить

### Аккаунты и сервисы (все бесплатные)
- [Firebase Console](https://console.firebase.google.com/) (Google аккаунт)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (бесплатный аккаунт)
- [Railway](https://railway.app/) для backend hosting (GitHub аккаунт)
- [GitHub](https://github.com/) для кода (если еще нет)

### Локальные инструменты
- Node.js (v16+)
- Git
- Текстовый редактор (VS Code рекомендуется)

## 🔥 Phase 1: Настройка Firebase (15 минут)

### 1.1 Создание Firebase проекта

1. **Откройте [Firebase Console](https://console.firebase.google.com/)**
2. **Нажмите "Create a project"**
3. **Введите название проекта**: `rpg-therapy` (или ваше название)
4. **Отключите Google Analytics** (не нужно для нашего проекта)
5. **Нажмите "Create project"**

### 1.2 Настройка Authentication

1. **В левом меню выберите "Authentication"**
2. **Нажмите "Get started"**
3. **Перейдите на вкладку "Sign-in method"**
4. **Включите "Email/Password"**:
   - Нажмите на "Email/Password"
   - Включите первый переключатель (Email/Password)
   - Нажмите "Save"

### 1.3 Получение конфигурации

1. **В левом меню нажмите на шестеренку ⚙️ рядом с "Project Overview"**
2. **Выберите "Project settings"**
3. **Прокрутите вниз до "Your apps"**
4. **Нажмите на иконку веба `</>`**
5. **Введите nickname**: `rpg-therapy-web`
6. **НЕ ставьте галочку "Firebase Hosting"**
7. **Нажмите "Register app"**
8. **Скопируйте объект firebaseConfig** (понадобится позже)

```javascript
// Пример конфигурации (ваша будет отличаться)
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "rpg-therapy-12345.firebaseapp.com",
  projectId: "rpg-therapy-12345",
  storageBucket: "rpg-therapy-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 1.4 Service Account Key для Backend

1. **В Project Settings прокрутите до "Service accounts"**
2. **Нажмите "Generate new private key"**
3. **Подтвердите и скачайте JSON файл**
4. **Сохраните файл как `serviceAccountKey.json`** (понадобится для backend)

## 🗄️ Phase 2: Настройка MongoDB Atlas (10 минут)

### 2.1 Создание кластера

1. **Откройте [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**
2. **Зарегистрируйтесь/войдите**
3. **Нажмите "Create" (создать кластер)**
4. **Выберите FREE tier (M0 Sandbox)**
5. **Выберите ближайший регион** (например, Europe - Ireland)
6. **Имя кластера**: `rpg-therapy-cluster`
7. **Нажмите "Create Cluster"** (займет 1-3 минуты)

### 2.2 Настройка доступа

1. **Когда кластер создастся, нажмите "Connect"**
2. **Добавьте IP адрес**:
   - Нажмите "Add IP Address"
   - Выберите "Allow access from anywhere" (0.0.0.0/0)
   - Нажмите "Confirm"
3. **Создайте пользователя базы данных**:
   - Username: `rpguser`
   - Password: `сгенерируйте сложный пароль`
   - Запишите пароль!
   - Нажмите "Create User"

### 2.3 Получение строки подключения

1. **Нажмите "Choose a connection method"**
2. **Выберите "Connect your application"**
3. **Driver: Node.js, Version: 4.1 or later**
4. **Скопируйте connection string**:

```
mongodb+srv://rpguser:<password>@rpg-therapy-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. **Замените `<password>` на ваш реальный пароль**

## 🛠️ Phase 3: Создание Backend (30 минут)

### 3.1 Создание структуры проекта

В терминале в папке вашего проекта:

```bash
# Создаем папку для backend
mkdir rpg-therapy-backend
cd rpg-therapy-backend

# Инициализируем npm проект
npm init -y

# Устанавливаем зависимости
npm install express cors dotenv mongoose firebase-admin
npm install -D nodemon
```

### 3.2 Создание файлов

#### 3.2.1 package.json (обновить scripts)

```json
{
  "name": "rpg-therapy-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^7.5.0",
    "firebase-admin": "^11.10.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

#### 3.2.2 .env файл

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FRONTEND_URL=http://localhost:8000
```

#### 3.2.3 .gitignore

```gitignore
node_modules/
.env
serviceAccountKey.json
.DS_Store
```

### 3.3 Основные файлы

#### 3.3.1 src/server.js

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Initialize Firebase Admin
try {
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api', require('./routes/api'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Therapy Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
```

#### 3.3.2 src/middleware/auth.js

```javascript
const admin = require('firebase-admin');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { authenticateToken };
```

#### 3.3.3 src/models/UserData.js

```javascript
const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  protocols: [{
    id: Number,
    name: String,
    description: String,
    icon: String,
    targets: [String],
    weight: Number,
    hover: String,
    category: String,
    createdAt: Date,
    updatedAt: Date
  }],
  innerfaces: [{
    id: Number,
    name: String,
    description: String,
    icon: String,
    score: Number,
    lastUpdated: Date,
    weight: Number,
    hover: String
  }],
  states: {
    type: Map,
    of: {
      value: Number,
      icon: String,
      name: String
    }
  },
  quickActions: [Number],
  orders: {
    protocols: [Number],
    innerfaces: [Number],
    quickActions: [Number]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserData', userDataSchema);
```

#### 3.3.4 src/models/History.js

```javascript
const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['protocol', 'innerface', 'drag_drop', 'manual']
  },
  action: String,
  targetId: mongoose.Schema.Types.Mixed,
  changes: mongoose.Schema.Types.Mixed,
  details: String,
  protocolName: String,
  protocolIcon: String
});

// Index for better query performance
historySchema.index({ uid: 1, timestamp: -1 });

module.exports = mongoose.model('History', historySchema);
```

#### 3.3.5 src/routes/api.js

```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserData = require('../models/UserData');
const History = require('../models/History');

// Get user data
router.get('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOne({ uid: req.user.uid });
    
    if (!userData) {
      // Return default data structure for new users
      const defaultData = {
        uid: req.user.uid,
        protocols: [],
        innerfaces: [],
        states: new Map(),
        quickActions: [],
        orders: {
          protocols: [],
          innerfaces: [],
          quickActions: []
        }
      };
      
      const newUserData = new UserData(defaultData);
      await newUserData.save();
      return res.json(newUserData);
    }
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save user data
router.post('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOneAndUpdate(
      { uid: req.user.uid },
      { 
        ...req.body, 
        uid: req.user.uid,
        updatedAt: new Date() 
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    res.json(userData);
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user history
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    
    const history = await History.find({ uid: req.user.uid })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add history entry
router.post('/user/history', authenticateToken, async (req, res) => {
  try {
    const historyEntry = new History({
      ...req.body,
      uid: req.user.uid
    });
    
    await historyEntry.save();
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete history entry
router.delete('/user/history/:historyId', authenticateToken, async (req, res) => {
  try {
    await History.findOneAndDelete({
      _id: req.params.historyId,
      uid: req.user.uid
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### 3.4 Тестирование backend локально

```bash
# В папке rpg-therapy-backend
# Скопируйте ваш serviceAccountKey.json в эту папку
# Обновите .env с вашими реальными данными

# Запуск в режиме разработки
npm run dev
```

Должно появиться:
```
✅ Firebase Admin initialized
✅ Connected to MongoDB  
🚀 Server running on port 5000
```

## 🌐 Phase 4: Deploy Backend на Railway (15 минут)

### 4.1 Подготовка к deploy

1. **Создайте git репозиторий** для backend:

```bash
# В папке rpg-therapy-backend
git init
git add .
git commit -m "Initial backend setup"

# Создайте репозиторий на GitHub и push
git remote add origin https://github.com/yourusername/rpg-therapy-backend.git
git push -u origin main
```

### 4.2 Deploy на Railway

1. **Откройте [Railway.app](https://railway.app/)**
2. **Войдите через GitHub**
3. **Нажмите "New Project"**
4. **Выберите "Deploy from GitHub repo"**
5. **Выберите ваш rpg-therapy-backend репозиторий**
6. **Railway автоматически определит что это Node.js проект**

### 4.3 Настройка переменных окружения

1. **В Railway dashboard откройте ваш проект**
2. **Перейдите в "Variables" tab**
3. **Добавьте переменные**:

```
MONGODB_URI=your_mongodb_connection_string
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FRONTEND_URL=https://yourusername.github.io/rpg-therapy
```

### 4.4 Загрузка Service Account Key

Поскольку serviceAccountKey.json содержит приватные данные, его нужно добавить как переменную окружения:

1. **Откройте ваш serviceAccountKey.json**
2. **Скопируйте весь JSON**
3. **В Railway Variables добавьте**:
   - Name: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: весь JSON контент

4. **Обновите server.js** для чтения из переменной:

```javascript
// В src/server.js замените инициализацию Firebase на:
try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // Production: read from environment variable
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // Development: read from file
    serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
}
```

### 4.5 Получение backend URL

1. **После deploy в Railway dashboard найдите "Deployments"**
2. **Скопируйте URL вашего сервера** (типа `https://rpg-therapy-backend-production.up.railway.app`)
3. **Протестируйте**: откройте URL в браузере, должен вернуться JSON с информацией о API

## 🎨 Phase 5: Модификация Frontend (45 минут)

### 5.1 Добавление Firebase SDK

В вашем основном проекте создайте файл `js/firebase-config.js`:

```javascript
// js/firebase-config.js
const firebaseConfig = {
  // Вставьте ваш config из Phase 1
  apiKey: "AIzaSyC...",
  authDomain: "rpg-therapy-12345.firebaseapp.com",
  projectId: "rpg-therapy-12345",
  storageBucket: "rpg-therapy-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Export для использования в других файлах
window.firebaseConfig = firebaseConfig;
```

### 5.2 Добавление Firebase библиотек

В `index.html` добавьте перед закрывающим `</body>`:

```html
<!-- Firebase SDKs -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js';
  import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js';
  
  // Инициализация Firebase
  const app = initializeApp(window.firebaseConfig);
  const auth = getAuth(app);
  
  // Глобальные переменные для использования в других скриптах
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseSignIn = signInWithEmailAndPassword;
  window.firebaseSignUp = createUserWithEmailAndPassword;
  window.firebaseSignOut = signOut;
  window.firebaseOnAuthStateChanged = onAuthStateChanged;
  window.firebaseUpdateProfile = updateProfile;
</script>

<script src="js/firebase-config.js"></script>
<script src="js/api-client.js"></script>
<script src="js/auth-controller.js"></script>
```

### 5.3 API клиент

Создайте `js/api-client.js`:

```javascript
// js/api-client.js
class APIClient {
  constructor() {
    // Измените на ваш Railway URL
    this.baseURL = 'https://your-app-name.up.railway.app/api';
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  async getUserData() {
    const token = await this.getAuthToken();
    return this.request('/user/data', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async saveUserData(data) {
    const token = await this.getAuthToken();
    return this.request('/user/data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  }
  
  async getHistory(limit = 100, skip = 0) {
    const token = await this.getAuthToken();
    return this.request(`/user/history?limit=${limit}&skip=${skip}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async addHistory(historyEntry) {
    const token = await this.getAuthToken();
    return this.request('/user/history', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(historyEntry)
    });
  }
  
  async deleteHistory(historyId) {
    const token = await this.getAuthToken();
    return this.request(`/user/history/${historyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async getAuthToken() {
    if (!window.firebaseAuth?.currentUser) {
      throw new Error('User not authenticated');
    }
    return await window.firebaseAuth.currentUser.getIdToken();
  }
}

// Глобальный экземпляр API клиента
window.apiClient = new APIClient();
```

### 5.4 Auth Controller

Создайте `js/auth-controller.js`:

```javascript
// js/auth-controller.js
class AuthController {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.initPromise = this.init();
  }
  
  async init() {
    return new Promise((resolve) => {
      window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          console.log('User logged in:', user.email);
          await this.loadUserData();
          this.showApp();
        } else {
          console.log('User logged out');
          this.showAuth();
        }
        
        if (!this.isInitialized) {
          this.isInitialized = true;
          resolve();
        }
      });
    });
  }
  
  async signIn(email, password) {
    try {
      const userCredential = await window.firebaseSignIn(window.firebaseAuth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this.parseFirebaseError(error);
    }
  }
  
  async signUp(name, email, password) {
    try {
      const userCredential = await window.firebaseSignUp(window.firebaseAuth, email, password);
      await window.firebaseUpdateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    } catch (error) {
      throw this.parseFirebaseError(error);
    }
  }
  
  async signOut() {
    try {
      await window.firebaseSignOut(window.firebaseAuth);
      Storage.clear(); // Очищаем локальные данные
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
  
  async loadUserData() {
    try {
      const userData = await window.apiClient.getUserData();
      
      // Синхронизируем данные с локальным storage
      if (userData && Object.keys(userData).length > 0) {
        Storage.syncFromServer(userData);
      } else {
        // Если на сервере нет данных, загружаем локальные
        await this.uploadLocalData();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Продолжаем работать с локальными данными
    }
  }
  
  async uploadLocalData() {
    try {
      const localData = Storage.getAllData();
      if (localData && Object.keys(localData).length > 0) {
        await window.apiClient.saveUserData(localData);
        console.log('Local data uploaded to server');
      }
    } catch (error) {
      console.error('Failed to upload local data:', error);
    }
  }
  
  showAuth() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
  }
  
  showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
  }
  
  parseFirebaseError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Пользователь не найден',
      'auth/wrong-password': 'Неверный пароль',
      'auth/email-already-in-use': 'Email уже используется',
      'auth/weak-password': 'Пароль слишком слабый',
      'auth/invalid-email': 'Неверный формат email'
    };
    
    return new Error(errorMessages[error.code] || error.message);
  }
}

// Инициализация
window.authController = new AuthController();
```

### 5.5 Модификация Storage

Обновите `js/storage.js`, добавив методы синхронизации:

```javascript
// В начало файла js/storage.js добавьте:
const Storage = {
  // ... existing code ...
  
  // Новые методы для синхронизации
  isOnline: true,
  syncEnabled: false,
  
  // Включить синхронизацию после авторизации
  enableSync() {
    this.syncEnabled = true;
  },
  
  // Отключить синхронизацию при выходе
  disableSync() {
    this.syncEnabled = false;
  },
  
  // Получить все данные для отправки на сервер
  getAllData() {
    return {
      protocols: this.getProtocols(),
      innerfaces: this.getInnerfaces(),
      states: this.getStates(),
      quickActions: this.getQuickActions(),
      orders: {
        protocols: this.getProtocolOrder(),
        innerfaces: this.getInnerfaceOrder(),
        quickActions: this.getQuickActionOrder()
      }
    };
  },
  
  // Синхронизация данных с сервера
  syncFromServer(serverData) {
    if (!serverData) return;
    
    try {
      if (serverData.protocols) {
        this.set(this.KEYS.PROTOCOLS, serverData.protocols);
      }
      if (serverData.innerfaces) {
        this.set(this.KEYS.INNERFACES, serverData.innerfaces);
      }
      if (serverData.states) {
        this.set(this.KEYS.STATES, serverData.states);
      }
      if (serverData.quickActions) {
        this.set(this.KEYS.QUICK_ACTIONS, serverData.quickActions);
      }
      if (serverData.orders) {
        if (serverData.orders.protocols) {
          this.set(this.KEYS.PROTOCOL_ORDER, serverData.orders.protocols);
        }
        if (serverData.orders.innerfaces) {
          this.set(this.KEYS.INNERFACE_ORDER, serverData.orders.innerfaces);
        }
        if (serverData.orders.quickActions) {
          this.set(this.KEYS.QUICK_ACTION_ORDER, serverData.orders.quickActions);
        }
      }
      
      console.log('Data synced from server');
    } catch (error) {
      console.error('Error syncing data from server:', error);
    }
  },
  
  // Отправка данных на сервер
  async syncToServer() {
    if (!this.syncEnabled || !this.isOnline) return;
    
    try {
      const allData = this.getAllData();
      await window.apiClient.saveUserData(allData);
      console.log('Data synced to server');
    } catch (error) {
      console.error('Error syncing to server:', error);
      // Продолжаем работать локально
    }
  },
  
  // Модифицированный set метод с автосинхронизацией
  async set(key, value) {
    try {
      const originalSet = localStorage.setItem.bind(localStorage);
      originalSet(key, JSON.stringify(value));
      
      // Автосинхронизация с задержкой
      if (this.syncEnabled) {
        clearTimeout(this.syncTimeout);
        this.syncTimeout = setTimeout(() => {
          this.syncToServer();
        }, 1000); // Синхронизация через 1 секунду
      }
      
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }
  
  // ... rest of existing Storage methods ...
};
```

### 5.6 Создание Auth UI

Добавьте в начало `index.html` (после `<body>`):

```html
<!-- Auth Container -->
<div id="authContainer" class="auth-container" style="display: none;">
  <div class="auth-content">
    <div class="auth-logo">
      <h1>🎮 RPG Therapy</h1>
      <p>Level up your life</p>
    </div>
    
    <!-- Login Form -->
    <div id="loginForm" class="auth-form">
      <h2>Sign In</h2>
      <form id="loginFormElement">
        <input type="email" id="loginEmail" placeholder="Email" required>
        <input type="password" id="loginPassword" placeholder="Password" required>
        <button type="submit">Sign In</button>
      </form>
      <p>Don't have an account? <a href="#" id="showRegister">Sign Up</a></p>
    </div>
    
    <!-- Register Form -->
    <div id="registerForm" class="auth-form" style="display: none;">
      <h2>Create Account</h2>
      <form id="registerFormElement">
        <input type="text" id="registerName" placeholder="Player Name" required>
        <input type="email" id="registerEmail" placeholder="Email" required>
        <input type="password" id="registerPassword" placeholder="Password" required>
        <button type="submit">Create Account</button>
      </form>
      <p>Already have an account? <a href="#" id="showLogin">Sign In</a></p>
    </div>
    
    <div id="authError" class="auth-error" style="display: none;"></div>
    <div id="authLoading" class="auth-loading" style="display: none;">Loading...</div>
  </div>
</div>

<!-- App Container -->
<div id="appContainer" class="app-container" style="display: none;">
  <!-- Ваш существующий контент приложения -->
  
```

### 5.7 CSS для Auth

Создайте `css/auth.css`:

```css
/* css/auth.css */
.auth-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--bg-color) 0%, var(--sub-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.auth-content {
  background: var(--sub-color);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.auth-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo h1 {
  color: var(--main-color);
  margin: 0;
  font-size: 2rem;
}

.auth-logo p {
  color: var(--text-color);
  margin: 0.5rem 0 0 0;
  opacity: 0.7;
}

.auth-form h2 {
  color: var(--main-color);
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-form input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid var(--sub-alt-color);
  border-radius: 0.5rem;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 1rem;
  box-sizing: border-box;
}

.auth-form input:focus {
  outline: none;
  border-color: var(--main-color);
  box-shadow: 0 0 0 2px rgba(var(--main-color-rgb), 0.2);
}

.auth-form button {
  width: 100%;
  padding: 0.75rem;
  background: var(--main-color);
  color: var(--bg-color);
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.auth-form button:hover {
  background: var(--main-color);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.auth-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.auth-form p {
  text-align: center;
  margin-top: 1rem;
  color: var(--text-color);
}

.auth-form a {
  color: var(--main-color);
  text-decoration: none;
}

.auth-form a:hover {
  text-decoration: underline;
}

.auth-error {
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  color: #ff6b6b;
  padding: 0.75rem;
  border-radius: 0.5rem;
  margin-top: 1rem;
  text-align: center;
}

.auth-loading {
  text-align: center;
  color: var(--main-color);
  margin-top: 1rem;
}

@media (max-width: 480px) {
  .auth-content {
    margin: 0.5rem;
    padding: 1.5rem;
  }
}
```

Добавьте в `index.html` в секцию `<head>`:

```html
<link rel="stylesheet" href="css/auth.css">
```

### 5.8 JavaScript для Auth UI

Добавьте в конец `js/app.js`:

```javascript
// Auth UI event handlers
document.addEventListener('DOMContentLoaded', function() {
  // Ждем инициализации auth controller
  window.authController.initPromise.then(() => {
    setupAuthUI();
  });
});

function setupAuthUI() {
  const loginForm = document.getElementById('loginFormElement');
  const registerForm = document.getElementById('registerFormElement');
  const showRegisterLink = document.getElementById('showRegister');
  const showLoginLink = document.getElementById('showLogin');
  const authError = document.getElementById('authError');
  const authLoading = document.getElementById('authLoading');
  
  // Switch between login and register
  showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    clearAuthError();
  });
  
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    clearAuthError();
  });
  
  // Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    showAuthLoading(true);
    clearAuthError();
    
    try {
      await window.authController.signIn(email, password);
      Storage.enableSync();
    } catch (error) {
      showAuthError(error.message);
    } finally {
      showAuthLoading(false);
    }
  });
  
  // Register form submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters');
      return;
    }
    
    showAuthLoading(true);
    clearAuthError();
    
    try {
      await window.authController.signUp(name, email, password);
      Storage.enableSync();
    } catch (error) {
      showAuthError(error.message);
    } finally {
      showAuthLoading(false);
    }
  });
  
  function showAuthError(message) {
    authError.textContent = message;
    authError.style.display = 'block';
  }
  
  function clearAuthError() {
    authError.style.display = 'none';
  }
  
  function showAuthLoading(show) {
    authLoading.style.display = show ? 'block' : 'none';
    
    // Disable form inputs
    const inputs = document.querySelectorAll('.auth-form input, .auth-form button');
    inputs.forEach(input => {
      input.disabled = show;
    });
  }
}

// Add logout functionality to existing app
function addLogoutButton() {
  const logoutBtn = document.createElement('button');
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
  logoutBtn.className = 'logout-btn';
  logoutBtn.onclick = () => {
    if (confirm('Are you sure you want to logout?')) {
      window.authController.signOut();
      Storage.disableSync();
    }
  };
  
  // Add to header or wherever appropriate
  const header = document.querySelector('header') || document.body;
  header.appendChild(logoutBtn);
}

// Call this after app initialization
if (window.authController && window.authController.currentUser) {
  addLogoutButton();
}
```

### 5.9 Обновление index.html

Оберните ваш существующий контент приложения в `appContainer`:

```html
<div id="appContainer" class="app-container" style="display: none;">
  <!-- Весь ваш существующий контент приложения -->
  <header>...</header>
  <main>...</main>
  <!-- etc -->
</div>
```

## 🧪 Phase 6: Тестирование (20 минут)

### 6.1 Локальное тестирование

```bash
# Запустите локальный сервер для frontend
python3 -m http.server 8000

# В другом терминале убедитесь что backend запущен
# Откройте http://localhost:8000
```

### 6.2 Что тестировать

1. **Регистрация**: 
   - Создайте тестовый аккаунт
   - Проверьте что данные сохраняются на сервер

2. **Вход/выход**:
   - Выйдите и войдите снова
   - Проверьте что данные загружаются

3. **Синхронизация**:
   - Создайте протокол/навык
   - Обновите страницу - данные должны остаться

4. **Cross-device** (если возможно):
   - Войдите с другого устройства/браузера
   - Проверьте синхронизацию данных

## 🚀 Phase 7: Production Deploy

### 7.1 Обновление API URL

В `js/api-client.js` замените baseURL на ваш Railway URL:

```javascript
this.baseURL = 'https://your-app-name.up.railway.app/api';
```

### 7.2 GitHub Pages deploy

```bash
# В папке с frontend
git add .
git commit -m "Add multi-user support"
git push origin main

# GitHub Pages автоматически обновится
```

### 7.3 Обновление CORS

В Railway обновите переменную:
```
FRONTEND_URL=https://yourusername.github.io/rpg-therapy
```

## ✅ Итоговая проверка

После завершения всех этапов у вас должно быть:

- ✅ Firebase проект с настроенной аутентификацией
- ✅ MongoDB Atlas кластер с данными пользователей
- ✅ Node.js backend развернутый на Railway
- ✅ Frontend с auth UI и синхронизацией
- ✅ Работающая cross-device синхронизация

## 🔧 Troubleshooting

### Проблемы с CORS
```javascript
// В backend src/server.js обновите CORS:
app.use(cors({
  origin: [
    'http://localhost:8000',
    'https://yourusername.github.io'
  ],
  credentials: true
}));
```

### Firebase ошибки
- Проверьте что Authentication включен
- Убедитесь что firebaseConfig правильный
- Проверьте что домен добавлен в Authorized domains

### Backend ошибки
- Проверьте Railway logs
- Убедитесь что все переменные окружения установлены
- Проверьте MongoDB connection string

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте browser console на ошибки
2. Проверьте Railway logs
3. Убедитесь что все URL правильные
4. Проверьте Network tab в DevTools

---

**Время выполнения**: ~2-3 часа
**Стоимость**: $0 (все в бесплатных планах)
**Результат**: Полноценная multi-user система! 🎉 