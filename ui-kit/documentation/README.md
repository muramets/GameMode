# 🎨 GameMode UI Kit
*Inspired by Monkeytype's minimalistic design philosophy*

## 📋 Overview

Этот UI Kit основан на исследовании репозитория [Monkeytype](https://github.com/monkeytypegame/monkeytype) - одного из самых красивых и функциональных typing-тестов с минималистичным дизайном.

## 🎯 Design Philosophy

**Минимализм с функциональностью:**
- Чистый, незагроможденный интерфейс
- Фокус на типографике и читаемости
- Плавные анимации и переходы
- Система тем для персонализации
- Отзывчивый дизайн для всех устройств

## 🎨 Color System

### Основные цветовые переменные:
```css
:root {
  --bg-color: /* Основной фон */
  --main-color: /* Акцентный цвет (курсор, активные элементы) */
  --caret-color: /* Цвет курсора */
  --sub-color: /* Вторичный цвет (неактивные элементы) */
  --sub-alt-color: /* Альтернативный вторичный цвет */
  --text-color: /* Основной цвет текста */
  --error-color: /* Цвет ошибок */
  --error-extra-color: /* Дополнительный цвет ошибок */
  --colorful-error-color: /* Цветные ошибки */
  --colorful-error-extra-color: /* Дополнительные цветные ошибки */
}
```

## 🔤 Typography System

### Основной шрифт стека:
```css
--font: "Roboto Mono", "Vazirmatn", monospace;
```

### Поддерживаемые шрифты:
- **Roboto Mono** (основной моноширинный)
- Source Code Pro
- JetBrains Mono
- Fira Code
- IBM Plex Mono
- Cascadia Mono
- Hack
- И многие другие...

## 🧩 Component System

### 1. Buttons
- Стандартные кнопки
- Текстовые кнопки
- Активные состояния
- Hover эффекты

### 2. Inputs
- Поля ввода
- Focus состояния
- Валидация

### 3. Navigation
- Заголовок
- Меню навигации
- Breadcrumbs

### 4. Tables & Lists
- Адаптивные таблицы
- Полосатые строки
- Сортировка

### 5. Modals & Popups
- Модальные окна
- Всплывающие подсказки
- Notifications

## 🎭 Theme System

### Структура темы:
Каждая тема определяет полный набор CSS переменных для создания уникального внешнего вида.

### Примеры тем:
- **Terminal** - зеленый текст на темном фоне
- **Aurora** - анимированные цвета северного сияния
- **Minimalist** - чистый черно-белый дизайн

## 🏗️ Architecture

### Layout System (Content Grid):
```css
.content-grid {
  --padding-inline: 2rem;
  --content-max-width: 1536px;
  /* Grid system для responsive дизайна */
}
```

### CSS Organization:
- `/themes/` - Файлы тем (.css)
- `/fonts/` - Шрифты и типографика
- `/components/` - Переиспользуемые компоненты
- `/documentation/` - Документация и примеры

## 🎪 Animations & Effects

### Стандартные переходы:
```css
transition: color 0.125s, opacity 0.125s, background 0.125s;
```

### Keyframe анимации:
- Плавные переходы цветов
- Эффекты loading
- Hover анимации

## 🛠️ Usage Guidelines

### 1. Начало работы:
1. Подключите базовые CSS переменные
2. Выберите тему или создайте свою
3. Используйте компоненты из библиотеки

### 2. Кастомизация:
- Переопределите CSS переменные для быстрой настройки
- Создайте собственные темы
- Добавьте новые компоненты

### 3. Responsiveness:
- Используйте content-grid систему
- Адаптируйте компоненты для мобильных устройств

## 📁 File Structure

```
ui-kit/
├── documentation/
│   ├── README.md (этот файл)
│   ├── components.md
│   ├── themes.md
│   └── typography.md
├── themes/
│   ├── base.css
│   ├── terminal.css
│   ├── aurora.css
│   └── [other-themes].css
├── fonts/
│   ├── fonts.scss
│   └── roboto-mono/
├── components/
│   ├── buttons.css
│   ├── inputs.css
│   ├── navigation.css
│   ├── tables.css
│   └── modals.css
└── examples/
    ├── demo.html
    └── showcase.html
```

## 🔗 References

- [Monkeytype Repository](https://github.com/monkeytypegame/monkeytype)
- [Monkeytype Website](https://monkeytype.com)
- CSS Grid Guide by Kevin Powell

---

*Этот UI Kit создан для экспериментов и обучения, вдохновлен открытым исходным кодом Monkeytype под лицензией GPL-3.0* 