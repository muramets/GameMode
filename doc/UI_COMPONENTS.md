# UI Components

Документация по компонентам пользовательского интерфейса RPG Therapy.

## 📋 Обзор компонентов

RPG Therapy использует модульную архитектуру UI с компонентами:

- **Tables** - Таблицы протоколов, навыков и истории
- **Dashboard** - Главная страница с Quick Actions и States
- **Modals** - Модальные окна для редактирования
- **Navigation** - Навигация между секциями
- **Forms** - Формы создания/редактирования

## 🏗️ Структура компонентов

### CSS Модули
```
css/
├── base.css          # Базовые стили и переменные
├── layout.css        # Общий layout
├── header.css        # Шапка сайта
├── navigation.css    # Навигация
├── dashboard.css     # Dashboard компоненты
├── tables.css        # Таблицы
├── modals.css        # Модальные окна
├── components.css    # Общие компоненты
├── toasts.css        # Уведомления
└── responsive.css    # Адаптивность
```

## 🎨 Design System

### Цветовая схема
```css
:root {
  /* Основные цвета */
  --bg-color: #1a1a1a;           /* Фон */
  --sub-bg-color: #2a2a2a;       /* Вторичный фон */
  --text-color: #e0e0e0;         /* Основной текст */
  --sub-color: #888;             /* Вторичный текст */
  --main-color: #4a9eff;         /* Акцентный цвет */
  --sub-alt-color: #333;         /* Альтернативный фон */
  
  /* Системные цвета */
  --success-color: #4ade80;      /* Успех */
  --warning-color: #fbbf24;      /* Предупреждение */  
  --error-color: #f87171;        /* Ошибка */
}
```

### Типографика
```css
/* Основной шрифт */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Моноширинный шрифт для кода/данных */
font-family: 'Roboto Mono', 'Consolas', monospace;

/* Размеры */
--text-xs: 0.75rem;   /* 12px */
--text-sm: 0.875rem;  /* 14px */
--text-base: 1rem;    /* 16px */
--text-lg: 1.125rem;  /* 18px */
--text-xl: 1.25rem;   /* 20px */
```

### Spacing System
```css
/* Отступы */
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 0.75rem;   /* 12px */
--spacing-lg: 1rem;      /* 16px */
--spacing-xl: 1.5rem;    /* 24px */
--spacing-2xl: 2rem;     /* 32px */
```

## 📊 Table Components

### Protocol Table
```html
<div class="protocols-table">
  <div class="protocols-header">
    <div class="protocol-cell">#</div>
    <div class="protocol-cell">protocol</div>
    <div class="protocol-cell">targets</div>
    <div class="protocol-cell">weight</div>
    <div class="protocol-cell">action</div>
  </div>
  <div class="protocols-body">
    <!-- Строки протоколов -->
  </div>
</div>
```

**Особенности:**
- Grid layout: `60px 300px 1fr 80px 100px`
- Hover кнопка check-in
- Drag & drop поддержка
- Responsive адаптация

### Skills Table
```html
<div class="skills-table">
  <div class="skills-header">
    <div class="skill-cell">#</div>
    <div class="skill-cell">skill</div>
    <div class="skill-cell">score</div>
    <div class="skill-cell">progress</div>
    <div class="skill-cell">last updated</div>
  </div>
  <div class="skills-body">
    <!-- Строки навыков -->
  </div>
</div>
```

**Особенности:**
- Progress bars с цветовым кодированием
- Tooltips при hover
- Настройки навыков
- История изменений

### History Table
```html
<div class="history-table">
  <div class="history-header">
    <div class="history-cell">date</div>
    <div class="history-cell">type</div>
    <div class="history-cell">action</div>
    <div class="history-cell">changes</div>
    <div class="history-cell">actions</div>
  </div>
  <div class="history-body">
    <!-- Строки истории -->
  </div>
</div>
```

**Особенности:**
- Кнопка удаления при hover
- Цветовое кодирование изменений
- Временные метки
- Типы действий

## 🎛️ Dashboard Components

### Quick Actions
```html
<div class="quick-protocols">
  <button class="quick-protocol" data-protocol-id="1">
    <span class="protocol-icon">🎯</span>
    <div class="protocol-info">
      <div class="protocol-name">Protocol Name</div>
      <div class="protocol-desc">Description</div>
    </div>
    <button class="quick-remove">×</button>
  </button>
</div>
```

**CSS:**
```css
.quick-protocols {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  max-width: 1000px;
}

.quick-protocol {
  flex: 0 0 calc(20% - 0.6rem); /* 5 элементов в ряду */
  min-height: 80px;
  /* ... остальные стили */
}
```

### User States
```html
<div class="user-states">
  <div class="state-item" data-state-id="energy">
    <span class="state-icon">⚡</span>
    <span class="state-name">Energy</span>
    <span class="state-value">85%</span>
  </div>
</div>
```

## 🪟 Modal Components

### Base Modal Structure
```html
<div class="modal" id="modal-name">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Modal Title</h2>
      <button class="modal-close">&times;</button>
    </div>
    <div class="modal-body">
      <!-- Modal content -->
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary">Save</button>
      <button class="btn btn-secondary">Cancel</button>
    </div>
  </div>
</div>
```

### Modal Types
- **Edit Protocol Modal** - редактирование протоколов
- **Edit Skill Modal** - редактирование навыков
- **Confirmation Modal** - подтверждение действий
- **Info Modal** - отображение информации

## 🔘 Button Components

### Primary Buttons
```css
.btn-primary {
  background-color: var(--main-color);
  color: var(--bg-color);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: opacity 0.125s;
}
```

### Icon Buttons
```css
.icon-btn {
  background: transparent;
  border: none;
  color: var(--sub-color);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.125s;
}
```

### Hover Buttons
```css
.hover-btn {
  opacity: 0;
  visibility: hidden;
  transition: all 0.125s;
}

.parent:hover .hover-btn {
  opacity: 1;
  visibility: visible;
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 480px) { /* ... */ }

/* Tablet */
@media (max-width: 768px) { /* ... */ }

/* Desktop */
@media (min-width: 769px) { /* ... */ }
```

### Mobile Adaptations
- Уменьшенные размеры кнопок
- Упрощенные таблицы
- Touch-friendly элементы
- Измененный grid для Quick Actions

## 🎭 Animation & Transitions

### Hover Effects
```css
.interactive:hover {
  transform: translateY(-1px);
  transition: transform 0.125s ease;
}
```

### Loading States
```css
.loading {
  opacity: 0.6;
  pointer-events: none;
  cursor: wait;
}
```

### Fade Transitions
```css
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## 🛠️ Component Guidelines

### 1. Naming Convention
- BEM методология для CSS классов
- Semantic HTML элементы
- Consistent naming patterns

### 2. Accessibility
- ARIA labels где необходимо
- Keyboard navigation support
- Color contrast compliance
- Screen reader friendly

### 3. Performance
- CSS-only animations where possible
- Minimal DOM manipulations
- Efficient event delegation
- Optimized CSS selectors

## 🔧 JavaScript Integration

### Component Initialization
```javascript
// UI компоненты инициализируются в ui.js
const UI = {
  renderDashboard() { /* ... */ },
  renderProtocols() { /* ... */ },
  renderSkills() { /* ... */ },
  renderHistory() { /* ... */ }
};
```

### Event Handling
```javascript
// Delegation для динамических элементов
document.addEventListener('click', (e) => {
  if (e.target.matches('.btn-action')) {
    handleAction(e);
  }
});
```

## 🎨 Theming

### CSS Custom Properties
Все цвета и размеры используют CSS переменные для легкой настройки темы.

### Dark Theme
Приложение использует темную тему по умолчанию для комфортной работы.

---

*UI компоненты RPG Therapy спроектированы для максимальной функциональности и пользовательского опыта.* 