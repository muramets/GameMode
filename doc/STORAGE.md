# 💾 RPG Therapy v1.0 - Система хранения данных

*Гибридная архитектура: LocalStorage + Cloud Sync*

---

## 📋 Обзор системы

RPG Therapy v1.0 использует **гибридную систему хранения**, которая сочетает локальную производительность с облачной надежностью:

- 🚀 **LocalStorage** - для мгновенного отклика интерфейса
- ☁️ **MongoDB Atlas** - для персистентного облачного хранения
- 🔄 **Background Sync** - для синхронизации между устройствами
- 👤 **Multi-user Support** - изоляция данных по пользователям

## 🏗️ Архитектура хранения v1.0

### 📊 Схема данных

```
👤 User Authentication (Firebase)
    ↓ JWT Token
💾 Local Storage (Browser)           ☁️ Cloud Storage (MongoDB)
    ├── User A Data                      ├── User A Document
    ├── User B Data                      ├── User B Document  
    └── Offline Cache                    └── Backup & Sync
```

### 🧩 Основные компоненты

#### 1. 📁 **Storage Manager** (`js/storage.js`)

**Класс Storage с гибридной логикой:**
```javascript
class Storage {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = new Set();
    this.currentUser = null;        // Firebase user
    this.lastSyncTime = null;
  }
  
  // Пользователь-специфичные ключи
  getUserKey(key) {
    return this.currentUser ? `${this.currentUser.uid}_${key}` : key;
  }
}
```

#### 2. 🔑 **User Data Isolation**

**Каждый пользователь имеет изолированное хранилище:**
```javascript
// Пример ключей для пользователя abc123
"abc123_protocols"     // Протоколы пользователя
"abc123_innerfaces"        // Навыки пользователя  
"abc123_history"       // История пользователя
"abc123_quickActions"  // Quick Actions пользователя
```

## 🗂️ Структуры данных v1.0

### 1. 📋 **Protocols (Протоколы)**

```javascript
interface Protocol {
  id: number | string;          // Уникальный идентификатор
  name: string;                 // "Название действия"
  icon: string;                 // Эмодзи иконка
  hover: string;                // Описание при наведении
  action: '+' | '-';            // Положительное/отрицательное действие
  weight: number;               // Сила воздействия (0-1)
  targets: InnerfaceId[];           // ID целевых навыков (1-3)
  order?: number;               // Порядок отображения
  isQuickAction?: boolean;      // Входит ли в Quick Actions
  createdAt?: ISOString;        // Дата создания
}
```

**Методы управления:**
```javascript
// Локальные операции (мгновенные)
getProtocols()                    // Получить все протоколы
addProtocol(protocolData)         // Добавить новый протокол
updateProtocolFull(id, data)      // Обновить протокол
deleteProtocol(id)                // Удалить протокол

// Синхронизация (асинхронная)
syncWithBackend()                 // Отправить изменения в облако
```

### 2. 🎯 **Innerfaces (Навыки)**

```javascript
interface Innerface {
  id: number | string;          // Уникальный идентификатор
  name: string;                 // "Название. Описание"
  icon: string;                 // Эмодзи иконка
  hover: string;                // Подсказка при наведении
  initialScore: number;         // Начальный балл (0-10)
  order?: number;               // Порядок отображения
  createdAt?: ISOString;        // Дата создания
  // currentScore вычисляется динамически на основе истории
}
```

**Методы управления:**
```javascript
// Основные операции
getInnerfaces()                       // Получить все навыки
getInnerfaceById(id)                  // Получить навык по ID
addInnerface(innerfaceData)               // Добавить новый навык
updateInnerfaceFull(id, data)         // Обновить навык
deleteInnerface(id)                   // Удалить навык

// Вычисления
calculateCurrentScore(innerfaceId)    // Текущий уровень навыка
getInnerfaceHistory(innerfaceId)          // История изменений навыка
```

### 3. 🎭 **States (Состояния)**

```javascript
interface State {
  id: number | string;          // Уникальный идентификатор
  name: string;                 // "Название состояния/роли"
  icon: string;                 // Эмодзи иконка
  innerfaceIds: InnerfaceId[];          // Навыки, входящие в состояние
  stateIds: StateId[];          // Зависимые состояния (рекурсия)
  order?: number;               // Порядок отображения
  level?: number;               // Вычисляемый уровень состояния
}
```

**Методы управления:**
```javascript
getStates()                       // Получить все состояния
addState(stateData)               // Добавить новое состояние
updateState(id, data)             // Обновить состояние
calculateStateScore(stateId)      // Вычислить уровень состояния
```

### 4. 📊 **History (История действий)**

```javascript
interface HistoryEntry {
  id: string;                   // Timestamp-based ID
  type: 'protocol' | 'drag_drop' | 'quick_action';
  timestamp: ISOString;         // Время действия
  
  // Для протоколов
  protocolId?: ProtocolId;
  protocolName?: string;
  action?: '+' | '-';
  changes?: Record<InnerfaceId, number>;
  
  // Для drag & drop
  subType?: 'innerface' | 'protocol' | 'state';
  itemId?: number;
  itemName?: string;
  fromPosition?: number;
  toPosition?: number;
}
```

**Методы управления:**
```javascript
getCheckins()                     // Получить всю историю
addCheckin(protocolId, action)    // Добавить выполнение протокола
addDragDropOperation(...)         // Добавить операцию перестановки
deleteCheckin(id)                 // Удалить запись истории
clearAllCheckins()                // Очистить всю историю
```

### 5. ⚡ **Quick Actions**

```javascript
interface QuickActionsData {
  quickActions: ProtocolId[];           // ID протоколов в Quick Actions
  quickActionOrder: ProtocolId[];       // Порядок отображения
}
```

**Методы управления:**
```javascript
getQuickActions()                 // Получить Quick Actions
addToQuickActions(protocolId)     // Добавить протокол
removeFromQuickActions(id)        // Удалить протокол
setQuickActionOrder(order)        // Установить порядок
getQuickActionsInOrder()          // Получить в правильном порядке
```

## 🔄 Гибридная синхронизация

### 🚀 Optimistic Updates

**Принцип работы:**
1. Пользователь выполняет действие
2. Изменение **мгновенно** применяется локально
3. UI **немедленно** обновляется
4. Данные **асинхронно** отправляются в облако
5. При ошибке показывается уведомление

```javascript
// Пример: выполнение протокола
addCheckin(protocolId, action = '+') {
  // 1. Мгновенное локальное обновление
  const checkin = this.createCheckinEntry(protocolId, action);
  this.saveLocally(checkin);
  
  // 2. UI обновляется немедленно
  UI.updateInnerfaceBars();
  
  // 3. Фоновая синхронизация
  this.scheduleCloudSync(checkin);
}
```

### ☁️ Cloud Sync Architecture

**Стратегии синхронизации:**

#### 1. **Auto Sync** (автоматическая)
```javascript
async syncWithBackend() {
  if (!this.isOnline || !this.currentUser) return;
  
  try {
    // Отправляем все локальные данные
    const userData = this.getAllUserData();
    await apiClient.saveUserData(userData);
    
    this.lastSyncTime = Date.now();
    this.clearPendingSync();
  } catch (error) {
    this.scheduleRetry();
  }
}
```

#### 2. **Load from Cloud** (при входе)
```javascript
async loadFromCloud() {
  try {
    const cloudData = await apiClient.getUserData();
    
    if (cloudData.success) {
      // Мержим с локальными данными
      this.mergeCloudData(cloudData.data);
    }
  } catch (error) {
    // Работаем с локальными данными
    console.warn('Cloud sync failed, using local data');
  }
}
```

#### 3. **Conflict Resolution** (разрешение конфликтов)
```javascript
mergeCloudData(cloudData) {
  // Простая стратегия: облачные данные имеют приоритет
  // при условии, что они новее локальных
  
  if (cloudData.lastUpdated > this.getLocalLastUpdated()) {
    this.replaceLocalData(cloudData);
  } else {
    // Локальные данные новее - синхронизируем в облако
    this.syncWithBackend();
  }
}
```

## 🔐 Безопасность данных

### 👤 User Data Isolation

**Изоляция по пользователям:**
```javascript
// Каждый пользователь имеет свое пространство имен
setUser(user) {
  this.currentUser = user;
  // Все ключи теперь будут с префиксом user.uid
}

get(key) {
  const userKey = this.getUserKey(key);  // uid_key
  return JSON.parse(localStorage.getItem(userKey));
}
```

### 🔄 Legacy Data Migration

**Миграция старых данных при первом входе:**
```javascript
checkAndMigrateLegacyData() {
  const legacyKeys = ['protocols', 'innerfaces', 'history'];
  
  legacyKeys.forEach(key => {
    const legacyData = localStorage.getItem(key);
    const currentData = this.get(key);
    
    if (legacyData && !currentData) {
      // Мигрируем старые данные в новую структуру
      this.set(key, JSON.parse(legacyData));
    }
  });
}
```

### 🛡️ Data Validation

**Валидация данных перед сохранением:**
```javascript
validateProtocol(protocol) {
  const required = ['id', 'name', 'targets', 'action'];
  const missing = required.filter(field => !protocol[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Дополнительные проверки
  if (protocol.targets.length === 0 || protocol.targets.length > 3) {
    throw new Error('Protocol must have 1-3 target innerfaces');
  }
}
```

## 📊 Performance Optimizations

### 🚀 Lazy Loading

**Загрузка данных по требованию:**
```javascript
getInnerfacesInOrder() {
  if (this._cachedInnerfacesOrder) {
    return this._cachedInnerfacesOrder;
  }
  
  // Вычисляем и кэшируем
  this._cachedInnerfacesOrder = this.calculateInnerfacesOrder();
  return this._cachedInnerfacesOrder;
}
```

### 💾 Caching Strategy

**Кэширование вычислений:**
```javascript
calculateCurrentScore(innerfaceId) {
  const cacheKey = `score_${innerfaceId}_${this.getHistoryVersion()}`;
  
  if (this._scoreCache[cacheKey]) {
    return this._scoreCache[cacheKey];
  }
  
  const score = this.computeScore(innerfaceId);
  this._scoreCache[cacheKey] = score;
  return score;
}
```

### 🔄 Debounced Sync

**Избегание частых запросов к API:**
```javascript
scheduleCloudSync() {
  clearTimeout(this.syncTimeout);
  
  this.syncTimeout = setTimeout(() => {
    this.syncWithBackend();
  }, 2000); // Синхронизация через 2 секунды после последнего изменения
}
```

## 🛠️ API Integration

### 📡 Cloud API Methods

**Интеграция с APIClient:**
```javascript
async syncWithBackend() {
  const userData = {
    innerfaces: this.getInnerfaces(),
    protocols: this.getProtocols(),
    states: this.getStates(),
    checkins: this.getCheckins()
  };
  
  return await apiClient.saveUserData(userData);
}

async loadFromBackend() {
  const response = await apiClient.getUserData();
  
  if (response.success) {
    this.setInnerfaces(response.data.innerfaces);
    this.setProtocols(response.data.protocols);
    this.setStates(response.data.states);
    this.setCheckins(response.data.checkins);
  }
}
```

### 🔄 Offline Support

**Работа без интернета:**
```javascript
handleOnlineStatus() {
  window.addEventListener('online', () => {
    this.isOnline = true;
    this.syncPendingChanges();
  });
  
  window.addEventListener('offline', () => {
    this.isOnline = false;
    // Показать индикатор оффлайн режима
    UI.showOfflineIndicator();
  });
}
```

## 📋 Примеры использования

### 🎯 Создание нового навыка

```javascript
// 1. Создание данных навыка
const newInnerface = {
  name: "Новый навык. Описание навыка",
  icon: "🎯",
  hover: "Подсказка при наведении",
  initialScore: 5
};

// 2. Добавление в систему
const innerfaceId = Storage.addInnerface(newInnerface);

// 3. Автоматическая синхронизация (фоновая)
// Storage автоматически вызовет syncWithBackend()

// 4. Обновление UI
UI.renderInnerfaces();
```

### 📋 Выполнение протокола

```javascript
// 1. Пользователь нажимает кнопку протокола
const protocolId = 1;
const action = '+';

// 2. Обработка check-in
Storage.addCheckin(protocolId, action);

// 3. Мгновенное обновление интерфейса
UI.updateInnerfaceBars();
UI.renderHistory();

// 4. Фоновая синхронизация с облаком
```

### 🔄 Переключение пользователей

```javascript
// 1. Пользователь выходит
Storage.setUser(null);

// 2. Новый пользователь входит
const newUser = { uid: 'user123', email: 'user@example.com' };
Storage.setUser(newUser);

// 3. Проверка на legacy данные
Storage.checkAndMigrateLegacyData();

// 4. Загрузка данных пользователя
await Storage.loadFromBackend();

// 5. Обновление интерфейса
UI.renderAll();
```

## 🔮 Будущие улучшения

### 📈 Планируемые оптимизации v1.1+

1. **Delta Sync** - синхронизация только изменений
2. **Compression** - сжатие данных при передаче
3. **Background Sync** - Service Worker для оффлайн синхронизации
4. **Real-time Updates** - WebSocket для мгновенных обновлений
5. **Intelligent Caching** - умное кэширование на основе паттернов использования

---

## 📋 Заключение

Система хранения RPG Therapy v1.0 обеспечивает:

✅ **Высокую производительность** - мгновенный отклик интерфейса  
✅ **Надежность** - облачное резервирование данных  
✅ **Масштабируемость** - поддержка множества пользователей  
✅ **Гибкость** - работа онлайн и оффлайн  
✅ **Безопасность** - изоляция данных по пользователям  

Гибридная архитектура сочетает лучшее из локального и облачного хранения, обеспечивая отличный пользовательский опыт при максимальной надежности данных.

---

*📝 Документация обновлена: Июнь 2024*  
*💾 Версия системы хранения: 1.0*  
*☁️ Гибридная LocalStorage + Cloud архитектура* 