# Drag & Drop System

Документация по системе перетаскивания элементов в RPG Therapy.

## 📋 Обзор

Система drag & drop реализована с нуля и обеспечивает интуитивное управление:
- **Протоколами** в таблице protocols
- **Навыками** в таблице skills
- **Quick Actions** в dashboard
- **States** в dashboard

## 🛠️ Архитектура

### Основной файл
`js/dragdrop.js` - содержит объект `DragDrop` со всей логикой

### Основные компоненты

```javascript
const DragDrop = {
  draggedElement: null,
  draggedType: null,
  
  init() { ... },
  createDragImage(element) { ... },
  handleDragStart(e) { ... },
  handleDragOver(e) { ... },
  handleDrop(e) { ... }
}
```

## 🎨 Визуальные эффекты

### 1. Drag Image (Копия при перетаскивании)

**Проблемы и решения:**

#### Состояния и Quick Actions
- **Проблема**: Некоторые элементы создавали прямоугольные копии вместо оригинальной формы
- **Решение**: Сохранение критических CSS свойств при клонировании:
  ```javascript
  const computedStyle = window.getComputedStyle(element);
  clone.style.display = computedStyle.display;
  clone.style.width = computedStyle.width;
  clone.style.height = computedStyle.height;
  ```

#### Строки таблиц
- **Проблема**: Table rows создавали слишком большие копии из-за потери grid контекста
- **Решение**: Ограничение ширины для table rows:
  ```javascript
  if (element.classList.contains('protocol-row') || 
      element.classList.contains('skill-row')) {
    clone.style.width = Math.min(originalRect.width, 400) + 'px';
  }
  ```

#### Финальное решение
- **Убраны все border/glow эффекты** по запросу пользователя
- **Точное соответствие размеров** между оригиналом и копией
- **Сохранение layout свойств** для корректного отображения

### 2. Hover эффекты
- **Drop zones** подсвечиваются при наведении
- **Drag over** состояние для индикации возможности сброса
- **Visual feedback** для пользователя

## 🔧 Типы перетаскивания

### 1. Protocol Reordering
```javascript
// Перестановка протоколов в таблице
draggedType: 'protocol'
targetType: 'protocol-list'
```

### 2. Skill Reordering  
```javascript
// Перестановка навыков в таблице
draggedType: 'skill'
targetType: 'skill-list'
```

### 3. Quick Actions Management
```javascript
// Добавление/удаление Quick Actions
draggedType: 'protocol'
targetType: 'quick-actions'
```

### 4. States Management
```javascript
// Управление состояниями
draggedType: 'state'
targetType: 'states'
```

## 📱 Responsive поведение

### Desktop
- Полная функциональность drag & drop
- Визуальные эффекты при перетаскивании
- Hover состояния

### Mobile
- Touch events для мобильных устройств
- Адаптированные размеры drag images
- Упрощенные визуальные эффекты

## 🎯 Drop Zones

### Quick Actions Zone
```html
<div class="quick-protocols" data-drop-zone="quick-actions">
  <!-- Quick action buttons -->
</div>
```

### Protocols Table
```html
<div class="protocols-body" data-drop-zone="protocol-list">
  <!-- Protocol rows -->
</div>
```

### Skills Table
```html
<div class="skills-body" data-drop-zone="skill-list">
  <!-- Skill rows -->
</div>
```

### States Section
```html
<div class="user-states" data-drop-zone="states">
  <!-- State elements -->
</div>
```

## 🔄 Процесс Drag & Drop

### 1. Drag Start
```javascript
handleDragStart(e) {
  this.draggedElement = e.target;
  this.draggedType = this.getDraggedType(e.target);
  
  // Создание custom drag image
  const dragImage = this.createDragImage(e.target);
  e.dataTransfer.setDragImage(dragImage, 0, 0);
}
```

### 2. Drag Over
```javascript
handleDragOver(e) {
  e.preventDefault();
  
  // Определение валидной drop zone
  if (this.isValidDropTarget(e.target)) {
    e.dataTransfer.dropEffect = 'move';
  }
}
```

### 3. Drop
```javascript
handleDrop(e) {
  e.preventDefault();
  
  // Обработка в зависимости от типа
  switch(this.draggedType) {
    case 'protocol': this.handleProtocolDrop(e); break;
    case 'skill': this.handleSkillDrop(e); break;
    case 'state': this.handleStateDrop(e); break;
  }
}
```

## 📊 Data Transfer

### Storage Integration
Все изменения порядка автоматически сохраняются:

```javascript
// Сохранение нового порядка протоколов
Storage.setProtocolOrder(newOrder);

// Сохранение нового порядка навыков  
Storage.setSkillOrder(newOrder);

// Обновление Quick Actions
Storage.setQuickActions(updatedQuickActions);
```

### History Logging
Все drag & drop операции логируются в историю:

```javascript
// Пример записи в историю
Storage.addToHistory({
  type: 'reorder',
  action: 'protocol_reorder', 
  details: 'Protocols reordered via drag & drop'
});
```

## 🐛 Troubleshooting

### Частые проблемы

1. **Drag image неправильного размера**
   - Проверьте сохранение CSS свойств при клонировании
   - Убедитесь что используется `getBoundingClientRect()`

2. **Drop не работает**
   - Проверьте `e.preventDefault()` в `dragover` handler
   - Убедитесь что drop zone правильно настроена

3. **Hover эффекты не исчезают**
   - Добавьте cleanup в `dragend` event
   - Проверьте CSS transitions

### Debug Tips

```javascript
// Включение debug логов
DragDrop.debug = true;

// Проверка состояния
console.log('Dragged:', DragDrop.draggedElement);
console.log('Type:', DragDrop.draggedType);
```

## 🎨 CSS классы

### Состояния drag & drop
```css
.dragging { opacity: 0.5; }
.drag-over { background-color: var(--highlight-color); }
.drop-zone { border: 2px dashed var(--main-color); }
```

### Responsive поведение
```css
@media (max-width: 768px) {
  .draggable { cursor: grab; }
  .dragging { transform: scale(0.95); }
}
```

## 🔮 Будущие улучшения

- [ ] Анимации при drop
- [ ] Undo/redo для drag operations
- [ ] Multi-select drag
- [ ] Snap-to-grid для позиционирования
- [ ] Touch gestures для мобильных устройств

---

*Система drag & drop обеспечивает интуитивное управление всеми элементами интерфейса RPG Therapy.* 