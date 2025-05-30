# 🎭 Theme System Documentation

## Overview

Система тем GameMode UI Kit основана на CSS переменных и позволяет быстро изменять внешний вид приложения. Вдохновлена богатой коллекцией тем Monkeytype.

## Color Variables

Каждая тема должна определить следующие CSS переменные:

### Основные цвета:
```css
:root {
  --bg-color: /* Основной фон страницы */
  --main-color: /* Акцентный цвет (кнопки, ссылки, курсор) */
  --caret-color: /* Цвет курсора (обычно = main-color) */
  --sub-color: /* Вторичный цвет (неактивные элементы) */
  --sub-alt-color: /* Альтернативный вторичный (фон карточек) */
  --text-color: /* Основной цвет текста */
}
```

### Цвета ошибок:
```css
:root {
  --error-color: /* Основной цвет ошибок */
  --error-extra-color: /* Дополнительный цвет ошибок */
  --colorful-error-color: /* Цветные ошибки */
  --colorful-error-extra-color: /* Дополнительные цветные ошибки */
}
```

## Available Themes

### 1. Base Theme (`base.css`)
**Описание:** Современная темная тема по умолчанию
**Цветовая схема:** 
- Фон: `#1a1a1a`
- Акцент: `#00e980` (яркий зеленый)
- Текст: `#ffffff`

### 2. Terminal Theme (`terminal.css`)
**Описание:** Классическая терминальная эстетика
**Цветовая схема:**
- Фон: `#191a1b`
- Акцент: `#79a617` (терминальный зеленый)
- Текст: `#e7eae0`

**Особенности:**
- Точечный фон для имитации старых мониторов
- Эффект scanlines
- Glow эффекты для терминального feel

### 3. Aurora Theme (`aurora.css`)
**Описание:** Анимированная тема северного сияния
**Цветовая схема:**
- Фон: `#011926`
- Акцент: `#00e980`
- Текст: `#ffffff`

**Особенности:**
- Анимированные цвета (cyan → green → teal)
- Автоматические анимации на hover/active состояниях
- Градиентный фон для атмосферы

## Creating Custom Themes

### Шаг 1: Создайте новый CSS файл
```bash
ui-kit/themes/my-theme.css
```

### Шаг 2: Определите цветовые переменные
```css
/* ui-kit/themes/my-theme.css */
:root {
  --bg-color: #your-bg;
  --main-color: #your-accent;
  --caret-color: #your-accent;
  --sub-color: #your-secondary;
  --sub-alt-color: #your-alt;
  --text-color: #your-text;
  --error-color: #your-error;
  --error-extra-color: #your-error-extra;
  --colorful-error-color: #your-error;
  --colorful-error-extra-color: #your-error-extra;
}
```

### Шаг 3: Добавьте специальные эффекты (опционально)
```css
/* Пример: специальные эффекты для темы */
body {
  /* Фоновые эффекты */
}

/* Анимации */
@keyframes my-animation {
  /* ... */
}

.my-special-class {
  animation: my-animation 2s infinite;
}
```

### Шаг 4: Подключите тему
```html
<link rel="stylesheet" href="ui-kit/themes/base.css">
<link rel="stylesheet" href="ui-kit/themes/my-theme.css">
```

## Theme Guidelines

### Color Contrast
- Обеспечьте достаточный контраст между текстом и фоном
- Минимум 4.5:1 для обычного текста
- Минимум 3:1 для крупного текста

### Accessibility
- Избегайте использования только цвета для передачи информации
- Тестируйте темы с различными типами цветовой слепоты

### Performance
- Используйте CSS переменные вместо дублирования цветов
- Минимизируйте количество анимаций для лучшей производительности

## Color Palette Examples

### Monochrome Themes
```css
/* Light Theme */
:root {
  --bg-color: #ffffff;
  --main-color: #000000;
  --text-color: #000000;
  --sub-color: #666666;
  --sub-alt-color: #f5f5f5;
}

/* Dark Theme */
:root {
  --bg-color: #000000;
  --main-color: #ffffff;
  --text-color: #ffffff;
  --sub-color: #666666;
  --sub-alt-color: #1a1a1a;
}
```

### Colorful Themes
```css
/* Blue Theme */
:root {
  --bg-color: #0f172a;
  --main-color: #3b82f6;
  --text-color: #f1f5f9;
  --sub-color: #64748b;
  --sub-alt-color: #1e293b;
}

/* Purple Theme */
:root {
  --bg-color: #1e1b4b;
  --main-color: #8b5cf6;
  --text-color: #f3f4f6;
  --sub-color: #6b7280;
  --sub-alt-color: #312e81;
}
```

## Dynamic Theme Switching

### JavaScript Implementation
```javascript
function setTheme(themeName) {
  // Remove existing theme
  const existingTheme = document.querySelector('link[data-theme]');
  if (existingTheme) {
    existingTheme.remove();
  }
  
  // Add new theme
  if (themeName !== 'base') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `ui-kit/themes/${themeName}.css`;
    link.setAttribute('data-theme', themeName);
    document.head.appendChild(link);
  }
}

// Theme persistence
localStorage.setItem('selectedTheme', themeName);
const savedTheme = localStorage.getItem('selectedTheme') || 'base';
setTheme(savedTheme);
```

### Theme Selector Component
```html
<select onchange="setTheme(this.value)">
  <option value="base">Base</option>
  <option value="terminal">Terminal</option>
  <option value="aurora">Aurora</option>
  <option value="custom">Custom</option>
</select>
```

## Advanced Features

### CSS Color Functions
Используйте современные CSS функции для динамического создания цветов:

```css
:root {
  /* Основные цвета */
  --primary-hue: 142;
  --primary-saturation: 100%;
  --primary-lightness: 45%;
  
  /* Генерируемые цвета */
  --main-color: hsl(var(--primary-hue), var(--primary-saturation), var(--primary-lightness));
  --main-color-light: hsl(var(--primary-hue), var(--primary-saturation), 65%);
  --main-color-dark: hsl(var(--primary-hue), var(--primary-saturation), 25%);
}
```

### Theme Prefers Color Scheme
```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Автоматическая темная тема */
  }
}

@media (prefers-color-scheme: light) {
  :root {
    /* Автоматическая светлая тема */
  }
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

1. **Naming Convention:** Используйте семантические имена переменных
2. **Fallbacks:** Всегда предоставляйте fallback цвета
3. **Testing:** Тестируйте темы на различных устройствах
4. **Documentation:** Документируйте особенности каждой темы
5. **Consistency:** Поддерживайте консистентность в цветовой схеме

## Resources

- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Monkeytype Themes Collection](https://github.com/monkeytypegame/monkeytype/tree/master/frontend/static/themes) 