# Документация RPG Therapy

Полный справочник по системе управления навыками и протоколами RPG Therapy.

## 📚 Навигация по документации

### 🏠 Основная информация
- [**README**](../README.md) - главная страница проекта с обзором и быстрым стартом

### 🏗️ Архитектура и структура
- [**ARCHITECTURE**](ARCHITECTURE.md) - общая архитектура системы и взаимодействие компонентов
- [**CSS_STRUCTURE**](CSS_STRUCTURE.md) - организация и структура стилей проекта

### ⚙️ Системы и функциональность
- [**STORAGE**](STORAGE.md) - система хранения данных (localStorage, структуры данных, persistence)
- [**DRAG_DROP**](DRAG_DROP.md) - система перетаскивания элементов (реализация, типы, debug)
- [**UI_COMPONENTS**](UI_COMPONENTS.md) - компоненты интерфейса (таблицы, модалы, кнопки, design system)

### 🎯 Страницы и функции
- [**DASHBOARD**](DASHBOARD.md) - главная страница, пользовательская статистика и состояния
- [**QUICK_ACTIONS**](QUICK_ACTIONS.md) - система быстрых действий (ОБНОВЛЕНО)
- [**STATES_MANAGEMENT**](STATES_MANAGEMENT.md) - управление состояниями пользователя
- [**SEARCH_FUNCTIONALITY**](SEARCH_FUNCTIONALITY.md) - поиск и фильтрация данных

### 📖 Справочники
- [**README_SKILL_IDS**](README_SKILL_IDS.md) - справочник ID навыков и их описания

### 📝 История изменений
- [**CHANGELOG**](CHANGELOG.md) - последние изменения и исправления

### 🛠️ Отладка и поддержка
- [**TROUBLESHOOTING**](TROUBLESHOOTING.md) - руководство по устранению неполадок и отладке системы

## 🔍 Быстрый поиск

### По компонентам
| Компонент | Документация |
|-----------|-------------|
| Tables | [UI_COMPONENTS](UI_COMPONENTS.md#table-components) |
| Modals | [UI_COMPONENTS](UI_COMPONENTS.md#modal-components) |
| Buttons | [UI_COMPONENTS](UI_COMPONENTS.md#button-components) |
| Forms | [SEARCH_FUNCTIONALITY](SEARCH_FUNCTIONALITY.md) |

### По функциональности
| Функция | Документация |
|---------|-------------|
| Drag & Drop | [DRAG_DROP](DRAG_DROP.md) |
| Quick Actions | [QUICK_ACTIONS](QUICK_ACTIONS.md) |
| Data Storage | [STORAGE](STORAGE.md) |
| User States | [STATES_MANAGEMENT](STATES_MANAGEMENT.md) |

### По технологиям
| Технология | Документация |
|------------|-------------|
| CSS | [CSS_STRUCTURE](CSS_STRUCTURE.md), [UI_COMPONENTS](UI_COMPONENTS.md#design-system) |
| JavaScript | [ARCHITECTURE](ARCHITECTURE.md#javascript), [STORAGE](STORAGE.md) |
| LocalStorage | [STORAGE](STORAGE.md#локальное-хранение) |
| Responsive | [UI_COMPONENTS](UI_COMPONENTS.md#responsive-design) |

## 🆕 Последние обновления

### Декабрь 2024
- ✅ Убрано ограничение Quick Actions до 5 элементов
- ✅ Исправлено удаление из Quick Actions  
- ✅ Добавлена кнопка check-in в таблицу протоколов
- ✅ Улучшена система drag & drop
- ✅ Обновлен responsive дизайн

Подробности в [CHANGELOG](CHANGELOG.md).

## 📋 Структура проекта

```
rpg-therapy/
├── README.md                 # Главная страница
├── index.html               # Основное приложение
├── doc/                     # Документация
│   ├── INDEX.md            # Этот файл
│   ├── ARCHITECTURE.md     # Архитектура
│   ├── STORAGE.md          # Хранение данных
│   ├── DRAG_DROP.md        # Drag & Drop
│   ├── UI_COMPONENTS.md    # UI компоненты
│   ├── QUICK_ACTIONS.md    # Quick Actions
│   ├── DASHBOARD.md        # Dashboard
│   ├── STATES_MANAGEMENT.md # States
│   ├── SEARCH_FUNCTIONALITY.md # Поиск
│   ├── CSS_STRUCTURE.md    # CSS структура
│   ├── README_SKILL_IDS.md # Справочник навыков
│   └── CHANGELOG.md        # История изменений
├── js/                      # JavaScript модули
│   ├── app.js              # Инициализация
│   ├── ui.js               # Интерфейс
│   ├── storage.js          # Хранение
│   ├── dragdrop.js         # Drag & Drop
│   ├── modals.js           # Модальные окна
│   └── data.js             # Данные по умолчанию
└── css/                     # Стили
    ├── base.css            # Базовые стили
    ├── layout.css          # Layout
    ├── tables.css          # Таблицы
    ├── dashboard.css       # Dashboard
    ├── modals.css          # Модалы
    ├── components.css      # Компоненты
    ├── navigation.css      # Навигация
    ├── header.css          # Шапка
    ├── toasts.css          # Уведомления
    └── responsive.css      # Адаптивность
```

## 🎯 Для разработчиков

### Начало работы
1. Прочитайте [README](../README.md) для общего понимания
2. Изучите [ARCHITECTURE](ARCHITECTURE.md) для понимания структуры
3. Ознакомьтесь с [STORAGE](STORAGE.md) для работы с данными

### Стилизация
1. Изучите [CSS_STRUCTURE](CSS_STRUCTURE.md)
2. Используйте [UI_COMPONENTS](UI_COMPONENTS.md) как reference

### Добавление функций
1. Следуйте паттернам из [ARCHITECTURE](ARCHITECTURE.md)
2. Обновляйте [CHANGELOG](CHANGELOG.md) при изменениях

## 🔧 Поддержка

При возникновении вопросов:
1. Проверьте соответствующую документацию
2. Изучите [CHANGELOG](CHANGELOG.md) на предмет известных проблем
3. Используйте debug функции из [DRAG_DROP](DRAG_DROP.md#troubleshooting)

---

*Документация регулярно обновляется в соответствии с развитием проекта RPG Therapy.* 