# Troubleshooting Guide

Руководство по устранению неполадок и отладке RPG Therapy.

## 🚨 Известные проблемы и решения

### Quick Actions не добавляются (РЕШЕНО ✅)

**Симптомы:**
- Показывается toast "Добавлено в Quick Actions"
- Элемент не появляется в секции Quick Actions
- Нет записей в истории о добавлении

**Причина:** Рассинхронизация между `QUICK_ACTIONS` и `QUICK_ACTION_ORDER` массивами.

**Решение:** ✅ Исправлено в версии от 30.05.2025

**Как проверить исправление:**
```javascript
// В консоли браузера
console.log('Quick Actions:', Storage.get('rpg_quick_actions'));
console.log('Quick Action Order:', Storage.get('rpg_quick_action_order'));
// Массивы должны содержать одинаковые ID (в том же порядке)
```

---

## 🟢 Resolved Issues

### ✅ Protocols Table Header Misalignment (FIXED: 2025-05-30)
**Симптомы:**
- Заголовки таблицы протоколов смещены 
- Заголовок "weight" появляется над столбцом действий
- Заголовок "actions" переносится на новую строку

**Корневая причина:**
CSS конфликт селекторов между основной таблицей и модальным окном. В `css/modals.css` общий селектор `.protocols-header` переопределял настройки основной таблицы, задавая 4 столбца вместо 5.

**Диагностика:**
```css
/* Проблемный код в css/modals.css: */
.protocols-header {
  grid-template-columns: 60px 300px 200px 80px; /* 4 столбца */
}

/* Правильный код в css/tables.css: */
.protocols-header {
  grid-template-columns: 60px 300px 200px 80px 100px; /* 5 столбцов */
}
```

**Решение:**
```css
/* Исправление в css/modals.css: */
.quick-action-protocols-table .protocols-header {
  grid-template-columns: 60px 300px 200px 80px; /* Только для модального окна */
}
```

**Методика диагностики:**
1. Добавлены временные debug borders для визуализации grid
2. Обнаружен конфликт специфичности CSS селекторов
3. Изолированы стили модального окна от основной таблицы

**Статус:** ✅ **РЕШЕНО** - Заголовки теперь правильно выровнены

---

## 🔍 Общие методы отладки

### 1. Проверка localStorage

```javascript
// Просмотр всех данных RPG Therapy
Object.keys(localStorage)
  .filter(key => key.startsWith('rpg_'))
  .forEach(key => {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  });
```

### 2. Очистка данных (ОСТОРОЖНО!)

```javascript
// Полная очистка всех данных RPG Therapy
Object.keys(localStorage)
  .filter(key => key.startsWith('rpg_'))
  .forEach(key => localStorage.removeItem(key));

// Перезагрузить страницу после очистки
location.reload();
```

### 3. Проверка синхронизации Quick Actions

```javascript
// Функция для проверки консистентности
function checkQuickActionsSync() {
  const actions = Storage.get('rpg_quick_actions') || [];
  const order = Storage.get('rpg_quick_action_order') || [];
  
  const actionsSet = new Set(actions);
  const orderSet = new Set(order);
  
  const onlyInActions = actions.filter(id => !orderSet.has(id));
  const onlyInOrder = order.filter(id => !actionsSet.has(id));
  
  console.log('✅ Синхронизация Quick Actions:');
  console.log('Actions:', actions);
  console.log('Order:', order);
  console.log('Только в actions:', onlyInActions);
  console.log('Только в order:', onlyInOrder);
  
  if (onlyInActions.length === 0 && onlyInOrder.length === 0) {
    console.log('✅ Данные синхронизированы');
  } else {
    console.log('❌ Обнаружена рассинхронизация!');
  }
}

checkQuickActionsSync();
```

---

## 🐛 Debug утилиты

### Storage Debug Helper

```javascript
// Добавить в консоль для отладки Storage
window.StorageDebug = {
  
  // Показать все данные
  showAll() {
    Object.values(Storage.KEYS).forEach(key => {
      console.log(key, Storage.get(key));
    });
  },
  
  // Проверить Quick Actions
  checkQuickActions() {
    const actions = Storage.getQuickActions();
    const order = Storage.getQuickActionOrder();
    const inOrder = Storage.getQuickActionsInOrder();
    
    console.group('🔍 Quick Actions Debug');
    console.log('Actions:', actions);
    console.log('Order:', order);
    console.log('In Order:', inOrder);
    console.log('Synced:', JSON.stringify(actions.sort()) === JSON.stringify(order.sort()));
    console.groupEnd();
  },
  
  // Показать последние записи истории
  showRecentHistory(count = 10) {
    const history = Storage.getCheckins().slice(-count);
    console.table(history);
  },
  
  // Исправить рассинхронизацию Quick Actions
  fixQuickActionsSync() {
    const actions = Storage.getQuickActions();
    Storage.set(Storage.KEYS.QUICK_ACTION_ORDER, [...actions]);
    console.log('✅ Quick Actions синхронизированы');
    UI.renderDashboard(); // Обновить UI
  }
};
```

---

## 🚨 Критические проверки

### При подозрении на потерю данных

1. **Проверка существования данных:**
```javascript
['rpg_protocols', 'rpg_skills', 'rpg_quick_actions', 'rpg_history']
  .forEach(key => {
    const data = localStorage.getItem(key);
    console.log(key, data ? 'EXISTS' : 'MISSING', data?.length);
  });
```