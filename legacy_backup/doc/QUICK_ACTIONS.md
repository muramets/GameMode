# Quick Actions System

> **🚨 ИСПРАВЛЕН КРИТИЧЕСКИЙ БАГ (30.05.2025)**: Добавление Quick Actions теперь работает корректно.

> **Обновлено**: Удалено ограничение на 5 элементов. Теперь поддерживается неограниченное количество Quick Actions с автоматическим переносом на новые строки.

Документация по системе Quick Actions в RPG Therapy.

## 🚨 Недавнее исправление бага

### Проблема
- При нажатии кнопки добавления протокола в Quick Actions показывался toast об успешном добавлении
- Однако элемент не появлялся в секции Quick Actions на Dashboard
- Отсутствовало логирование операций в истории

### Корневая причина
**Рассинхронизация данных**: Метод `addToQuickActions()` обновлял только массив `QUICK_ACTIONS`, но не синхронизировал массив `QUICK_ACTION_ORDER`. При этом UI рендеринг использует `getQuickActionsInOrder()`, который зависит от порядка элементов.

### Исправления
1. **storage.js**: Исправлен `addToQuickActions()` - теперь обновляет оба массива
2. **storage.js**: Добавлено логирование операций в `addToQuickActions()` и `removeFromQuickActions()` 
3. **ui.js**: Добавлена поддержка отображения `quick_action` записей в истории
4. **app.js**: Добавлена поддержка поиска по `quick_action` операциям

## 📋 Обзор

Quick Actions обеспечивают быстрый доступ к часто используемым протоколам прямо с Dashboard. Система была обновлена для поддержки **неограниченного количества** протоколов с максимум **5 элементов в ряду**.

### Ключевые обновления
- ✅ **Убрано ограничение до 5 элементов**
- ✅ **Автоматический перенос на новые строки** (5 элементов в ряду)
- ✅ **Исправлена система удаления** из Quick Actions
- ✅ **Обновлены CSS стили** для flex-wrap layout

## 🎯 Функциональность

### Основные возможности
- ⚡ Быстрое выполнение протоколов одним кликом
- ➕ Добавление протоколов через модальное окно
- 🗑️ Удаление протоколов (кнопка появляется при hover)
- 🔍 Поиск протоколов при добавлении
- 📱 Responsive дизайн для всех устройств

## 🏗️ Архитектура

### CSS Layout - ОБНОВЛЕНО
```css
/* Новый flex-based layout */
.quick-protocols {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  max-width: 1000px;
}

.quick-protocol {
  background-color: var(--sub-alt-color);
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.2, 0.0, 0.2, 1);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
  outline: none;
  min-height: 80px;
  position: relative;
  font-family: 'Roboto Mono', monospace;
  
  /* 5 элементов в ряду с учетом gaps */
  flex: 0 0 calc(20% - 0.6rem);
  box-sizing: border-box;
}
```

### Responsive Design - ОБНОВЛЕНО
```css
/* Мобильные устройства */
@media (max-width: 768px) {
  .quick-protocols {
    gap: 0.5rem;
  }
  
  .quick-protocol {
    flex: 0 0 calc(50% - 0.25rem); /* 2 элемента в ряду на мобильных */
  }
}

/* Очень маленькие экраны */
@media (max-width: 480px) {
  .quick-protocols {
    gap: 0.5rem;
  }
  
  .quick-protocol {
    flex: 0 0 100%; /* Один элемент в ряду */
    min-height: 60px;
    padding: 0.5rem;
    gap: 0.5rem;
  }
}
```

## 🛠️ JavaScript Implementation

### Storage Methods - ОБНОВЛЕНО
```javascript
// Удалено ограничение до 5 элементов
addToQuickActions(protocolId) {
  const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
  
  // Проверка на дубликаты
  if (quickActions.includes(protocolId)) {
    return false;
  }
  
  // Добавляем в конец (без лимита)
  quickActions.push(protocolId);
  
  this.set(this.KEYS.QUICK_ACTIONS, quickActions);
  return true;
},

// Исправлено удаление из Quick Actions
removeFromQuickActions(protocolId) {
  const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
  
  // Удаляем протокол из quick actions
  const updatedQuickActions = quickActions.filter(id => id !== protocolId);
  
  // ИСПРАВЛЕНИЕ: Также удаляем из quick action order
  const quickActionOrder = this.getQuickActionOrder();
  const updatedOrder = quickActionOrder.filter(id => id !== protocolId);
  this.set(this.KEYS.QUICK_ACTION_ORDER, updatedOrder);
  
  // Сохраняем обновленные quick actions
  this.set(this.KEYS.QUICK_ACTIONS, updatedQuickActions);
  
  return true;
}
```

## 🎨 UI Components

### Drag & Drop Support
Quick Actions поддерживают drag & drop для реорганизации порядка:

```javascript
// Поддержка drag & drop в DragDrop системе
handleQuickActionDrop(e) {
  const targetIndex = this.getDropIndex(e.target);
  const draggedId = this.draggedElement.dataset.protocolId;
  
  // Обновляем порядок Quick Actions
  const currentOrder = Storage.getQuickActionOrder();
  const newOrder = this.reorderArray(currentOrder, draggedId, targetIndex);
  
  Storage.setQuickActionOrder(newOrder);
  UI.renderDashboard();
}
```

### Visual Feedback
```css
.quick-protocol:hover {
  background-color: var(--sub-color);
  transform: translateY(-1px);
}

.quick-protocol:active {
  transform: translateY(0);
}

/* Кнопка удаления появляется при hover */
.quick-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  visibility: hidden;
  transition: all 0.125s;
}

.quick-protocol:hover .quick-remove {
  opacity: 1;
  visibility: visible;
}
```

## 📱 Responsive Behavior

### Desktop (1200px+)
- **5 элементов в ряду**
- Полные размеры кнопок (calc(20% - 0.6rem))
- Все hover эффекты активны

### Tablet (768px - 1199px)
- **5 элементов в ряду** (остается прежним)
- Стандартные размеры кнопок
- Touch-friendly размеры

### Mobile (481px - 767px)
- **2 элемента в ряду**
- Уменьшенные gaps (0.5rem)
- Увеличенные touch targets

### Ultra Mobile (≤480px)
- **1 элемент в ряду**
- Минимальная высота 60px
- Уменьшенные paddings

## 🔄 User Flow

### Добавление протокола
1. Клик на кнопку "+" в секции Quick Actions
2. Открывается модал с доступными протоколами
3. Поиск протокола (опционально)
4. Клик по протоколу добавляет его в Quick Actions
5. **Без ограничений по количеству**
6. Автоматический перенос на новую строку после 5-го элемента

### Удаление протокола - ИСПРАВЛЕНО
1. Hover над кнопкой протокола
2. Появляется кнопка удаления (🗑️)
3. Клик удаляет из Quick Actions
4. **Исправлено**: Также удаляется из Quick Action Order
5. UI автоматически обновляется

### Выполнение протокола
1. Клик по кнопке протокола
2. Выполняется check-in
3. Обновляются связанные навыки
4. Показывается toast уведомление

## 🎯 Layout Examples

### 6 элементов
```
[Protocol 1] [Protocol 2] [Protocol 3] [Protocol 4] [Protocol 5]
[Protocol 6]
```

### 8 элементов
```
[Protocol 1] [Protocol 2] [Protocol 3] [Protocol 4] [Protocol 5]
[Protocol 6] [Protocol 7] [Protocol 8]
```

### 12 элементов
```
[Protocol 1] [Protocol 2] [Protocol 3] [Protocol 4] [Protocol 5]
[Protocol 6] [Protocol 7] [Protocol 8] [Protocol 9] [Protocol 10]
[Protocol 11] [Protocol 12]
```

## ⚡ Performance

### Optimization
- **CSS Flexbox** для эффективного layout
- **Event delegation** для кнопок удаления
- **Minimal DOM updates** при добавлении/удалении
- **Cached protocol data** для быстрого рендера

### Memory Usage
- Хранение только ID протоколов (не полных объектов)
- Lazy loading деталей протоколов
- Эффективное управление event listeners

## 🐛 Bug Fixes

### Исправленные проблемы
1. ✅ **Quick Actions deletion**: Теперь корректно удаляется из обоих массивов
2. ✅ **Layout overflow**: Flex-wrap предотвращает переполнение
3. ✅ **Responsive design**: Корректная адаптация для всех устройств
4. ✅ **Remove button visibility**: Правильные hover состояния

## 🔮 Future Enhancements

### Планируемые улучшения
- [ ] Drag & drop reordering между Quick Actions
- [ ] Группировка по категориям
- [ ] Пользовательские иконки для протоколов
- [ ] Keyboard shortcuts для Quick Actions
- [ ] Статистика использования Quick Actions

## 🛡️ Data Validation

### Storage Validation
```javascript
validateQuickActions() {
  const quickActions = this.getQuickActions();
  const protocols = this.getProtocols();
  const validProtocolIds = protocols.map(p => p.id);
  
  // Фильтрация несуществующих протоколов
  const validQuickActions = quickActions.filter(id => 
    validProtocolIds.includes(id)
  );
  
  if (validQuickActions.length !== quickActions.length) {
    this.setQuickActions(validQuickActions);
  }
}
```

---

**Система Quick Actions теперь поддерживает неограниченное количество протоколов с интуитивным layout и исправленным функционалом удаления.** 