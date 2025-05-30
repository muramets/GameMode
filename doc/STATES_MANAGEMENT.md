# States Management - RPG Therapy

## Обзор

Система States (состояний) в RPG Therapy представляет собой высокоуровневые показатели жизни пользователя, которые рассчитываются на основе базовых навыков (Skills) и других состояний. States позволяют отслеживать комплексные аспекты развития личности.

## Структура State

Каждое состояние имеет следующие свойства:

```javascript
{
  id: "mental_clarity",
  name: "Mental clarity. Cognitive Resource",
  icon: "🧠",
  hover: "Capacity for clear thinking and intentional action.",
  skillIds: ["focus", "energy", "engagement"],
  stateIds: []
}
```

### Поля:
- **id**: Уникальный идентификатор состояния
- **name**: Полное название с описанием
- **icon**: Эмодзи для визуального представления
- **hover**: Подробное описание состояния
- **skillIds**: Массив ID навыков, влияющих на это состояние
- **stateIds**: Массив ID других состояний, влияющих на это состояние

## Система зависимостей

### Типы зависимостей

#### 1. Зависимости от Skills
- State может зависеть от одного или нескольких навыков
- Значение состояния = среднее арифметическое значений всех связанных навыков

#### 2. Зависимости от других States
- State может зависеть от других состояний
- Позволяет создавать иерархические системы состояний
- Защита от циклических зависимостей

### Расчет значения State

```javascript
calculateStateScore(stateId, visitedStates = new Set()) {
  // Предотвращение циклических зависимостей
  if (visitedStates.has(stateId)) {
    return 0;
  }
  visitedStates.add(stateId);

  let total = 0;
  let count = 0;

  // Вклад от skills
  if (state.skillIds && state.skillIds.length > 0) {
    state.skillIds.forEach(skillId => {
      total += this.calculateCurrentScore(skillId);
      count++;
    });
  }

  // Вклад от других states
  if (state.stateIds && state.stateIds.length > 0) {
    state.stateIds.forEach(dependentStateId => {
      total += this.calculateStateScore(dependentStateId, new Set(visitedStates));
      count++;
    });
  }

  return count > 0 ? total / count : 0;
}
```

## UI компоненты

### Dashboard - карточки состояний

#### Структура карточки
```html
<div class="state-card">
  <div class="state-header">
    <span class="state-icon">🧠</span>
    <span class="state-name">Mental clarity</span>
    <button class="state-settings-btn" onclick="Modals.editState('mental_clarity')">
      <i class="fas fa-cog"></i>
    </button>
  </div>
  <div class="state-hover">Capacity for clear thinking...</div>
  <div class="state-score score-4">6.87</div>
  <div class="state-bar">
    <div class="state-bar-fill" style="width: 68.7%; background-color: #98c379"></div>
  </div>
  <div class="state-details">
    <span>Skills: 3, States: 1</span>
    <span>69%</span>
  </div>
</div>
```

#### Особенности отображения
- **Кнопка настроек**: Появляется при наведении на карточку
- **Цветовая схема**: Та же, что у skills (0-2: красный, 2-4: оранжевый, и т.д.)
- **Детали**: Показывает количество skills и states в зависимостях

### Модальное окно редактирования

#### Основные поля
- **State Name**: Название состояния
- **Emoji**: Иконка состояния
- **Description**: Подробное описание (hover text)

#### Система зависимостей

##### Табы
- **Skills Tab**: Выбор навыков
- **States Tab**: Выбор других состояний

##### UI выбора зависимостей
```css
.dependency-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 250px;
  overflow-y: auto;
  padding: 0.5rem;
}

.dependency-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: var(--sub-alt-color);
  border-radius: 1.5rem;
  transition: all 0.125s;
  cursor: pointer;
  border: 1px solid transparent;
}

.dependency-item.selected {
  background-color: var(--main-color);
  color: var(--bg-color);
  border-color: var(--main-color);
}
```

##### Интерактивность
- **Кликабельные бейджи**: Вместо чекбоксов используются красивые округлые бейджи
- **Желтая подсветка**: Выбранные элементы подсвечиваются основным цветом
- **Плавные переходы**: Анимация при ховере и выборе

## JavaScript API

### Storage методы

#### Основные CRUD операции
```javascript
// Создание состояния
Storage.addState(stateData)

// Обновление состояния
Storage.updateState(stateId, stateData)

// Удаление состояния
Storage.deleteState(stateId)

// Получение состояния по ID
Storage.getStateById(stateId)

// Получение всех состояний
Storage.getStates()

// Расчет значения состояния
Storage.calculateStateScore(stateId)
```

#### Особенности реализации
- **Автоматическая генерация ID**: `state_1`, `state_2`, и т.д.
- **Очистка ссылок**: При удалении состояния автоматически удаляются ссылки на него из других состояний
- **Защита от циклов**: Предотвращение циклических зависимостей в расчетах

### Modal методы

#### Управление модальным окном
```javascript
// Открытие модального окна создания
Modals.openStateModal()

// Редактирование существующего состояния
Modals.editState(stateId)

// Переключение состояния зависимости
Modals.toggleDependencyItem(item)
```

#### Работа с зависимостями
```javascript
// Получение выбранных зависимостей
Modals.getSelectedDependencies(type) // 'skills' или 'states'

// Установка выбранных зависимостей (при редактировании)
Modals.setSelectedDependencies(skillIds, stateIds)

// Заполнение сетки зависимостей
Modals.populateStateDependencies()
```

## Предустановленные состояния

### Mental Clarity
- **Зависимости**: Focus, Energy, Engagement
- **Описание**: Capacity for clear thinking and intentional action

### Stick-to-itiveness
- **Зависимости**: Focus, Energy, Body Sync
- **Описание**: Not chasing highs. Just not quitting

### Physical Shape
- **Зависимости**: Body Sync
- **Описание**: Self-image built through movement and consistency

### Builder Mode
- **Зависимости**: Business Insight, Execution Speed, Engagement
- **Описание**: The mindset of making systems, not tasks

### Harmony
- **Зависимости**: Business Insight, Energy, Focus
- **Описание**: What you're doing matches where your mind wants to be

### Peace
- **Зависимости**: Все навыки
- **Описание**: The baseline that lets everything work

## Интеграция с системой

### Обновление после изменений
- **Dashboard**: Автоматическое обновление карточек состояний
- **User Stats**: Пересчет среднего прогресса в профиле пользователя
- **Уведомления**: Toast сообщения об успешных операциях

### Цветовая индикация
States используют ту же цветовую схему, что и Skills:
- **0-2**: #ca4754 (красный)
- **2-4**: #e6934a (оранжевый)  
- **4-6**: #e2b714 (желтый)
- **6-8**: #98c379 (зеленый)
- **8-10**: #7fb3d3 (синий)

### Responsive design
- **Mobile**: Сетка состояний переходит в одну колонку
- **Модальное окно**: Адаптируется под размер экрана
- **Бейджи зависимостей**: Автоматически переносятся на новые строки

## Лучшие практики

### Создание состояний
1. **Осмысленные названия**: Используйте понятные названия с кратким описанием
2. **Логичные зависимости**: Выбирайте навыки/состояния, которые действительно влияют на данное состояние
3. **Избегайте циклов**: Не создавайте взаимозависимости между состояниями

### Организация иерархии
1. **Базовые состояния**: Зависят только от навыков
2. **Составные состояния**: Могут зависеть от базовых состояний
3. **Глобальные состояния**: Как "Peace" - зависят от всего

States система предоставляет мощный инструмент для отслеживания комплексного личностного развития через агрегацию базовых навыков и создание иерархических зависимостей. 