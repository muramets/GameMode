# 🏗️ RPG Therapy v1.0 - Архитектура приложения

*Облачная мульти-пользовательская система*

---

## 🌟 Общее описание

RPG Therapy v1.0 - это полноценная облачная система геймификации личного развития, развернутая в продакшн-среде. Приложение трансформировалось из локальной версии в глобально доступную мульти-пользовательскую платформу с современной облачной архитектурой.

## ☁️ Облачная архитектура v1.0

### 🌐 Схема деплоймента

```
👤 Пользователи (любое устройство)
    ↓ HTTPS
🌐 GitHub Pages (Frontend Hosting)
    ↓ OAuth Flow
🔐 Firebase Auth (Google Authentication)
    ↓ JWT Tokens
🚂 Railway (Backend API)
    ↓ Encrypted Connection  
💾 MongoDB Atlas (Cloud Database)
```

### 🏛️ Компоненты системы

#### 1. 🌐 **Frontend Layer** - GitHub Pages
**URL**: `https://muramets.github.io/GameMode`

**Ответственность:**
- Статический хостинг HTML/CSS/JS файлов
- CDN для быстрой доставки контента
- SSL/TLS сертификаты (автоматически)
- Глобальная доступность

**Технологии:**
- Vanilla JavaScript ES6+
- CSS3 с CSS Grid/Flexbox
- HTML5 Semantic Markup
- Progressive Web App готовность

#### 2. 🔐 **Authentication Layer** - Firebase Auth
**Project**: `gamemode-ea510`

**Ответственность:**
- Google OAuth интеграция
- JWT токены генерация/валидация
- Управление сессиями пользователей
- Безопасность аутентификации

**Особенности:**
- Автоматическое обновление токенов
- Мульти-девайс поддержка
- Защита от CSRF атак
- Интеграция с Firebase Admin SDK

#### 3. 🚂 **Backend Layer** - Railway
**URL**: `https://rpg-therapy-backend-production.up.railway.app`

**Ответственность:**
- REST API для CRUD операций
- Валидация JWT токенов
- Бизнес-логика приложения
- Интеграция с MongoDB

**Архитектура API:**
```javascript
// Основные эндпоинты
GET    /api/user/data     // Получить все данные пользователя
POST   /api/user/data     // Сохранить данные пользователя
GET    /api/user/history  // Получить историю действий
POST   /api/user/history  // Добавить запись в историю
DELETE /api/user/history/:id // Удалить запись истории
GET    /api/test          // Health check
```

#### 4. 💾 **Database Layer** - MongoDB Atlas
**Cluster**: `gamemode-ea510`

**Ответственность:**
- Персистентное хранение данных пользователей
- Автоматические бэкапы
- Масштабирование и репликация
- Безопасность данных

**Структура коллекций:**
```javascript
// Коллекция: users
{
  _id: ObjectId,
  firebaseUid: String,    // Связь с Firebase Auth
  email: String,
  displayName: String,
  createdAt: Date,
  updatedAt: Date,
  userData: {             // Все данные приложения
    innerfaces: [...],
    protocols: [...],
    states: [...],
    checkins: [...]
  }
}
```

## 📱 Клиентская архитектура

### 🧩 Модульная система

```
js/
├── app.js              // 🚀 Главная точка входа + Auth
├── storage.js          // 💾 Гибридное хранение (Local + Cloud)
├── ui.js              // 🎨 Рендеринг интерфейса
├── modals.js          // 🖼️ Модальные окна
├── dragdrop.js        // 🖱️ Drag & Drop система
├── api-client.js      // 📡 HTTP клиент для API
├── firebase-auth.js   // 🔐 Firebase интеграция
└── data.js           // 📊 Начальные данные
```

### 🔄 Поток данных в v1.0

#### Инициализация приложения:
```javascript
1. DOM Ready → app.js загружается
2. Firebase Auth инициализируется
3. Показывается экран аутентификации
4. Пользователь входит через Google OAuth
5. Firebase возвращает JWT токен
6. Storage.init() инициализирует локальное хранение
7. syncUserData() загружает данные из облака
8. UI рендерится с актуальными данными
```

#### Выполнение действия (check-in):
```javascript
1. Пользователь нажимает кнопку протокола
2. app.checkin() обрабатывает событие
3. Storage.addCheckin() обновляет локальные данные
4. UI немедленно обновляется (optimistic update)
5. apiClient.saveUserData() отправляет данные в облако
6. При ошибке - показывается уведомление + retry логика
```

## 🛡️ Архитектура безопасности

### 🔐 Многоуровневая защита

#### 1. **Authentication Flow**
```
Google OAuth → Firebase Auth → JWT Token → Backend Validation
```

#### 2. **Authorization Model**
- Каждый пользователь видит только свои данные
- JWT токены содержат Firebase UID
- Backend проверяет токен на каждом запросе
- MongoDB запросы фильтруются по firebaseUid

#### 3. **Network Security**
- HTTPS везде (принудительно)
- CORS настроен только для github.io
- MongoDB доступна только с Railway IP
- Нет прямого доступа к базе из интернета

#### 4. **Data Security**
- Шифрование данных в покое (MongoDB Atlas)
- Шифрование в передаче (HTTPS/TLS)
- Автоматические бэкапы с шифрованием
- Ротация ключей (Firebase/MongoDB)

## 💾 Гибридная система хранения

### 🔄 LocalStorage + Cloud Sync

**Принцип работы:**
1. **Optimistic Updates**: изменения сначала применяются локально
2. **Background Sync**: данные асинхронно синхронизируются с облаком
3. **Conflict Resolution**: при конфликтах приоритет у облачных данных
4. **Offline Mode**: приложение работает даже без интернета

**Структура синхронизации:**
```javascript
class Storage {
  // Локальное хранение (быстрое)
  setLocal(key, value) {
    localStorage.setItem(this.getUserKey(key), JSON.stringify(value));
  }
  
  // Облачная синхронизация (надежная)
  async syncWithCloud() {
    try {
      const localData = this.getAllUserData();
      await apiClient.saveUserData(localData);
      this.markAsSynced();
    } catch (error) {
      this.scheduleRetry();
    }
  }
}
```

## 🎮 Бизнес-логика

### 📊 Основные сущности (Domain Model)

#### 1. **Innerfaces (Навыки)**
```javascript
interface Innerface {
  id: InnerfaceId;
  name: string;           // "Название. Описание"
  icon: string;           // Эмодзи иконка
  hover: string;          // Подсказка
  initialScore: number;   // Начальный балл (0-10)
  // currentScore вычисляется динамически
}
```

#### 2. **Protocols (Протоколы)**
```javascript
interface Protocol {
  id: ProtocolId;
  name: string;           // "Название действия"
  icon: string;           // Эмодзи
  hover: string;          // Описание
  action: '+' | '-';      // Положительное/отрицательное
  weight: number;         // Влияние (0-1)
  targets: InnerfaceId[];     // Целевые навыки (1-3)
}
```

#### 3. **States (Состояния)**
```javascript
interface State {
  id: StateId;
  name: string;           // "Название роли/состояния"
  icon: string;           // Эмодзи
  innerfaceIds: InnerfaceId[];    // Навыки в составе состояния
  stateIds: StateId[];    // Зависимые состояния
  // level вычисляется как среднее от связанных навыков
}
```

#### 4. **History Events (События)**
```javascript
interface HistoryEntry {
  id: string;             // timestamp-based ID
  type: 'protocol' | 'drag_drop' | 'quick_action';
  timestamp: ISOString;
  protocolId?: ProtocolId;
  changes?: Record<InnerfaceId, number>;
  // Дополнительные поля в зависимости от типа
}
```

### 🧮 Система расчетов

#### Расчет текущего уровня навыка:
```javascript
calculateCurrentScore(innerfaceId) {
  const innerface = this.getInnerfaceById(innerfaceId);
  const history = this.getCheckins();
  
  const totalChange = history
    .filter(entry => entry.changes && entry.changes[innerfaceId])
    .reduce((sum, entry) => sum + entry.changes[innerfaceId], 0);
    
  return Math.max(0, innerface.initialScore + totalChange);
}
```

#### Расчет уровня состояния:
```javascript
calculateStateScore(stateId) {
  const state = this.getStateById(stateId);
  
  // Рекурсивный расчет для вложенных состояний
  const innerfaceScores = state.innerfaceIds.map(id => this.calculateCurrentScore(id));
  const stateScores = state.stateIds.map(id => this.calculateStateScore(id));
  
  const allScores = [...innerfaceScores, ...stateScores];
  return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
}
```

## 🔄 API Architecture

### 📡 RESTful Design

**Базовый URL**: `https://rpg-therapy-backend-production.up.railway.app/api`

#### Authentication Middleware:
```javascript
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}
```

#### Data Model на сервере:
```javascript
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  userData: {
    innerfaces: [innerfaceSchema],
    protocols: [protocolSchema],
    states: [stateSchema],
    checkins: [checkinSchema]
  }
}, { timestamps: true });
```

## 🎨 UI Architecture

### 📱 Responsive Design System

**Брейкпоинты:**
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

**Компонентная структура:**
```css
/* Основные компоненты */
.nav-container { /* Навигация */ }
.page-container { /* Контейнеры страниц */ }
.card { /* Карточки элементов */ }
.modal { /* Модальные окна */ }
.progress-bar { /* Прогресс-бары */ }
```

### 🖱️ Drag & Drop System

**Архитектура перетаскивания:**
```javascript
class DragDropSystem {
  setupProtocols() {
    // Настройка drag & drop для протоколов
  }
  
  setupInnerfaces() {
    // Настройка для навыков
  }
  
  setupQuickActions() {
    // Настройка для Quick Actions
  }
  
  // Единая логика обработки
  handleDrop(sourceId, targetPosition, type) {
    // Обновление порядка + история операции
  }
}
```

## 📊 Performance & Scalability

### ⚡ Производительность клиента

**Оптимизации:**
- Lazy loading для больших списков
- Debounced поиск (300ms)
- Optimistic updates для UI
- Мемоизация вычислений навыков
- Виртуализация для больших историй

### 🌐 Масштабируемость системы

**Текущие лимиты:**
- MongoDB Atlas Free: 512MB (≈20,000 пользователей)
- Railway: $5/месяц для production
- Firebase Auth: 10,000 активных пользователей/месяц (бесплатно)
- GitHub Pages: неограниченная доставка контента

**Планы масштабирования:**
1. **Горизонтальное**: Railway автомасштабирование
2. **Вертикальное**: MongoDB Atlas обновление тарифа
3. **Кэширование**: Redis для популярных запросов
4. **CDN**: Cloudflare для глобальной доставки

## 🛠️ Development Workflow

### 🔄 CI/CD Pipeline

```
📝 Code Push → GitHub
    ↓
🔍 GitHub Actions → Tests & Linting
    ↓
🚀 Auto Deploy → GitHub Pages (Frontend)
    ↓
🔗 Webhook → Railway (Backend)
    ↓
✅ Production Live
```

### 📁 Модульная разработка

**Принципы:**
- Single Responsibility Principle
- Dependency Injection
- Event-driven Architecture
- Clean Code practices

**Файловая структура:**
```
rpg-therapy/
├── index.html              // Единая точка входа
├── css/                    // Стили
│   └── style.css
├── js/                     // JavaScript модули
│   ├── app.js             // Main app controller
│   ├── storage.js         // Data management
│   ├── ui.js              // UI rendering
│   ├── api-client.js      // HTTP client
│   └── ...
├── doc/                   // Документация
└── firebase-config.js     // Firebase настройки
```

## 🔮 Future Architecture Improvements

### 🎯 Планируемые улучшения v1.1+

#### 1. **TypeScript Migration**
- Строгая типизация для лучшего DX
- Автодополнение и ошибки на этапе разработки
- Легкий рефакторинг больших кодовых баз

#### 2. **State Management**
- Redux/Zustand для предсказуемого состояния
- Time-travel debugging
- Undo/Redo из коробки

#### 3. **Real-time Features**
- WebSocket подключения
- Live collaboration (опционально)
- Push уведомления

#### 4. **Advanced Caching**
- Service Worker для оффлайн-режима
- Intelligent prefetching
- Background sync

#### 5. **Micro-frontend Architecture**
- Независимые модули для навыков/протоколов/состояний
- Отдельные deployment пайплайны
- A/B тестирование функций

---

## 📋 Заключение

RPG Therapy v1.0 представляет собой современную облачную архитектуру, которая:

✅ **Масштабируется** - готова к росту пользователей  
✅ **Надежна** - многоуровневые резервные копии  
✅ **Безопасна** - enterprise-level защита данных  
✅ **Быстра** - оптимизирована для производительности  
✅ **Доступна** - работает на всех устройствах  
✅ **Maintainable** - чистая модульная архитектура  

Система готова к продуктивному использованию и дальнейшему развитию.

---

*📝 Документация обновлена: Июнь 2024*  
*🏗️ Архитектура версии: 1.0*  
*☁️ Облачная мульти-пользовательская система* 