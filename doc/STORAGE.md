# Storage System

Документация по системе хранения данных в RPG Therapy.

## 📋 Обзор

RPG Therapy использует **localStorage** браузера в качестве основной системы хранения. Все данные сохраняются локально и персистентны между сессиями.

## 🏗️ Архитектура

### Основной файл
`js/storage.js` - содержит объект `Storage` со всей логикой хранения

### Структура Storage объекта
```javascript
const Storage = {
  // Ключи для localStorage
  KEYS: {
    PROTOCOLS: 'rpg_protocols',
    SKILLS: 'rpg_skills', 
    QUICK_ACTIONS: 'rpg_quick_actions',
    QUICK_ACTION_ORDER: 'rpg_quick_action_order',
    SKILL_ORDER: 'rpg_skill_order',
    PROTOCOL_ORDER: 'rpg_protocol_order',
    USER_STATS: 'rpg_user_stats',
    HISTORY: 'rpg_history',
    USER_STATES: 'rpg_user_states'
  },
  
  // Базовые методы
  get(key) { /* ... */ },
  set(key, value) { /* ... */ },
  remove(key) { /* ... */ },
  clear() { /* ... */ }
};
```

## 🗂️ Структуры данных

### 1. Protocols (Протоколы)
```javascript
{
  id: 1,
  name: "Morning Routine",
  description: "Daily morning protocol",
  icon: "🌅",
  targets: ["energy", "focus"],
  weight: 1,
  hover: "Tooltip text",
  category: "daily"
}
```

**Методы:**
- `getProtocols()` - получить все протоколы
- `getProtocol(id)` - получить протокол по ID
- `updateProtocol(id, data)` - обновить протокол
- `deleteProtocol(id)` - удалить протокол

### 2. Skills (Навыки)
```javascript
{
  id: 101,
  name: "Discipline",
  description: "Self-control and consistency",
  icon: "🎯",
  score: 75,
  lastUpdated: "2024-01-15T10:30:00Z",
  weight: 1,
  hover: "Tooltip text"
}
```

**Методы:**
- `getSkills()` - получить все навыки
- `getSkill(id)` - получить навык по ID
- `updateSkillScore(id, newScore)` - обновить score навыка
- `updateSkill(id, data)` - обновить данные навыка

### 3. Quick Actions
```javascript
// Массив ID протоколов
[1, 2, 7, 8, 10]
```

**Методы:**
- `getQuickActions()` - получить Quick Actions
- `addToQuickActions(protocolId)` - добавить протокол
- `removeFromQuickActions(protocolId)` - удалить протокол
- `setQuickActions(protocolIds)` - установить новый список

### 4. User States (Состояния пользователя)
```javascript
{
  energy: { value: 85, icon: "⚡", name: "Energy" },
  focus: { value: 70, icon: "🎯", name: "Focus" },
  mood: { value: 90, icon: "😊", name: "Mood" },
  stress: { value: 30, icon: "😰", name: "Stress" }
}
```

**Методы:**
- `getUserStates()` - получить все состояния
- `updateUserState(stateId, value)` - обновить состояние
- `setUserStates(states)` - установить состояния

### 5. History (История)
```javascript
{
  id: "hist_1642234567890",
  timestamp: "2024-01-15T10:30:00Z",
  type: "protocol", // или "skill", "reorder"
  action: "check_in",
  targetId: 1,
  changes: [
    { skill: "energy", from: 70, to: 85 },
    { skill: "focus", from: 60, to: 75 }
  ],
  details: "Morning Routine completed"
}
```

**Методы:**
- `getHistory()` - получить всю историю
- `addToHistory(entry)` - добавить запись
- `removeFromHistory(id)` - удалить запись
- `clearHistory()` - очистить историю

### 6. Order Management (Управление порядком)
```javascript
// Порядок протоколов
[3, 1, 5, 2, 4]

// Порядок навыков  
[101, 103, 102, 105, 104]

// Порядок Quick Actions
[1, 7, 2, 10, 8]
```

**Методы:**
- `getProtocolOrder()` / `setProtocolOrder(order)`
- `getSkillOrder()` / `setSkillOrder(order)`
- `getQuickActionOrder()` / `setQuickActionOrder(order)`

## 💾 Persistence и синхронизация

### Автоматическое сохранение
Все изменения сохраняются немедленно:

```javascript
// Пример обновления навыка
updateSkillScore(skillId, newScore) {
  const skills = this.getSkills();
  const skill = skills.find(s => s.id == skillId);
  
  if (skill) {
    skill.score = newScore;
    skill.lastUpdated = new Date().toISOString();
    
    // Немедленное сохранение
    this.set(this.KEYS.SKILLS, skills);
    
    // Добавление в историю
    this.addToHistory({
      type: 'skill',
      action: 'score_update',
      targetId: skillId,
      changes: [{ skill: skill.name, to: newScore }]
    });
  }
}
```

### Error Handling
```javascript
set(key, value) {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Storage error:', error);
    // Fallback или уведомление пользователю
    return false;
  }
}
```

## 🔄 Initialization и Defaults

### Первичная инициализация
```javascript
init() {
  // Инициализация протоколов
  if (!this.get(this.KEYS.PROTOCOLS)) {
    this.set(this.KEYS.PROTOCOLS, defaultProtocols);
  }
  
  // Инициализация навыков
  if (!this.get(this.KEYS.SKILLS)) {
    this.set(this.KEYS.SKILLS, defaultSkills);
  }
  
  // Quick Actions по умолчанию
  if (!this.get(this.KEYS.QUICK_ACTIONS)) {
    this.set(this.KEYS.QUICK_ACTIONS, [1, 2, 7, 8, 10]);
  }
  
  // Состояния пользователя
  if (!this.get(this.KEYS.USER_STATES)) {
    this.set(this.KEYS.USER_STATES, defaultUserStates);
  }
}
```

### Проверка целостности данных
```javascript
validateData() {
  // Проверка протоколов
  const protocols = this.getProtocols();
  const validProtocols = protocols.filter(p => p.id && p.name);
  
  if (validProtocols.length !== protocols.length) {
    this.set(this.KEYS.PROTOCOLS, validProtocols);
  }
  
  // Аналогично для других типов данных
}
```

## 📊 Statistics и Analytics

### User Stats
```javascript
{
  totalSkills: 12,
  averageScore: 67.5,
  totalProtocols: 8,
  completedActions: 45,
  lastActivity: "2024-01-15T10:30:00Z"
}
```

### Вычисление статистики
```javascript
updateUserStats() {
  const skills = this.getSkills();
  const protocols = this.getProtocols();
  const history = this.getHistory();
  
  const stats = {
    totalSkills: skills.length,
    averageScore: skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length,
    totalProtocols: protocols.length,
    completedActions: history.filter(h => h.action === 'check_in').length,
    lastActivity: new Date().toISOString()
  };
  
  this.set(this.KEYS.USER_STATS, stats);
}
```

## 🔧 Utility методы

### Backup и Export
```javascript
exportData() {
  const data = {};
  Object.values(this.KEYS).forEach(key => {
    data[key] = this.get(key);
  });
  return JSON.stringify(data, null, 2);
}

importData(jsonData) {
  try {
    const data = JSON.parse(jsonData);
    Object.entries(data).forEach(([key, value]) => {
      if (Object.values(this.KEYS).includes(key)) {
        this.set(key, value);
      }
    });
    return true;
  } catch (error) {
    console.error('Import error:', error);
    return false;
  }
}
```

### Data Migration
```javascript
migrateData() {
  const version = this.get('data_version') || 1;
  
  if (version < 2) {
    // Миграция до версии 2
    this.migrateToV2();
    this.set('data_version', 2);
  }
  
  // Дополнительные миграции...
}
```

## 🔍 Debug и Development

### Storage Inspector
```javascript
inspect() {
  console.group('RPG Therapy Storage');
  Object.entries(this.KEYS).forEach(([name, key]) => {
    const data = this.get(key);
    console.log(`${name}:`, data);
  });
  console.groupEnd();
}
```

### Storage Usage
```javascript
getStorageUsage() {
  let totalSize = 0;
  Object.values(this.KEYS).forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      totalSize += data.length;
    }
  });
  
  return {
    total: totalSize,
    formatted: `${(totalSize / 1024).toFixed(2)} KB`
  };
}
```

## ⚠️ Ограничения и considerations

### LocalStorage Limits
- **Размер**: ~5-10MB в зависимости от браузера
- **Синхронизация**: Только локальное хранение
- **Приватность**: Данные остаются в браузере

### Backup Strategy
- Регулярный экспорт данных
- Cloud sync (будущая возможность)
- Import/Export функциональность

### Performance
- Минимальные операции с localStorage
- Кеширование часто используемых данных
- Batch операции где возможно

## 🛡️ Security

### Data Validation
```javascript
validateProtocol(protocol) {
  return protocol &&
         typeof protocol.id === 'number' &&
         typeof protocol.name === 'string' &&
         protocol.name.length > 0;
}
```

### Sanitization
```javascript
sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.trim().slice(0, 1000); // Лимит длины
  }
  return input;
}
```

## 🔧 Методы Quick Actions

### addToQuickActions(protocolId)
Добавляет протокол в Quick Actions.

> **✅ ИСПРАВЛЕНО (30.05.2025)**: Устранена рассинхронизация данных при добавлении.

```javascript
addToQuickActions(protocolId) {
  const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
  
  // Check if already in quick actions
  if (quickActions.includes(protocolId)) {
    return false;
  }
  
  // Add new one at the end
  quickActions.push(protocolId);
  
  // ✅ ИСПРАВЛЕНИЕ: Также обновляем массив порядка
  const quickActionOrder = this.getQuickActionOrder();
  quickActionOrder.push(protocolId);
  this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
  
  this.set(this.KEYS.QUICK_ACTIONS, quickActions);
  
  // ✅ ДОБАВЛЕНО: Логирование в историю
  const protocol = this.getProtocolById(protocolId);
  if (protocol) {
    const checkins = this.getCheckins();
    const checkin = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'quick_action',
      subType: 'added',
      protocolId: protocolId,
      protocolName: protocol.name,
      protocolIcon: protocol.icon || '📋'
    };
    checkins.push(checkin);
    this.set(this.KEYS.HISTORY, checkins);
  }
  
  return true;
}
```

**Ключевые исправления:**
- ✅ Синхронизация `QUICK_ACTIONS` и `QUICK_ACTION_ORDER` массивов
- ✅ Добавление логирования операций в историю
- ✅ Проверка существования протокола перед логированием

### removeFromQuickActions(protocolId)
Удаляет протокол из Quick Actions.

> **✅ ДОБАВЛЕНО (30.05.2025)**: Логирование операций удаления.

```javascript
removeFromQuickActions(protocolId) {
  const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
  
  // ✅ ДОБАВЛЕНО: Получаем информацию о протоколе до удаления
  const protocol = this.getProtocolById(protocolId);
  
  // Remove protocol from quick actions
  const updatedQuickActions = quickActions.filter(id => id !== protocolId);
  
  // Also remove from quick action order
  const quickActionOrder = this.getQuickActionOrder();
  const updatedOrder = quickActionOrder.filter(id => id !== protocolId);
  this.set(this.KEYS.QUICK_ACTION_ORDER, updatedOrder);
  
  // Save updated quick actions
  this.set(this.KEYS.QUICK_ACTIONS, updatedQuickActions);
  
  // ✅ ДОБАВЛЕНО: Логирование в историю
  if (protocol) {
    const checkins = this.getCheckins();
    const checkin = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type: 'quick_action',
      subType: 'removed',
      protocolId: protocolId,
      protocolName: protocol.name,
      protocolIcon: protocol.icon || '📋'
    };
    checkins.push(checkin);
    this.set(this.KEYS.HISTORY, checkins);
  }
}
```

## 🔄 Синхронизация данных

### Проблемы с рассинхронизацией (РЕШЕНО)

**Проблема**: UI рендеринг Quick Actions использует `getQuickActionsInOrder()`, который зависит от `QUICK_ACTION_ORDER` массива. Однако методы добавления/удаления обновляли только `QUICK_ACTIONS` массив.

**Решение**: Все операции теперь синхронно обновляют оба массива:
- `QUICK_ACTIONS` - содержит ID протоколов
- `QUICK_ACTION_ORDER` - определяет порядок отображения

## 📝 Структуры данных для Quick Actions

### История операций
```javascript
{
  "id": 1672531200000,
  "timestamp": "2025-05-30T17:00:00.000Z", 
  "type": "quick_action",
  "subType": "added" | "removed",
  "protocolId": "proto_123",
  "protocolName": "Morning Routine",
  "protocolIcon": "🌅"
}
```

## 💾 Persistence гарантии

Все операции Quick Actions теперь гарантируют:
1. ✅ **Немедленное сохранение** в localStorage
2. ✅ **Синхронизация массивов** QUICK_ACTIONS ↔ QUICK_ACTION_ORDER  
3. ✅ **Логирование операций** в истории
4. ✅ **Консистентность данных** между UI и хранилищем

---

*Система хранения RPG Therapy обеспечивает надежное и быстрое сохранение всех пользовательских данных.* 