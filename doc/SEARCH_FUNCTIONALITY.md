# Search Functionality - RPG Therapy

## Обзор

RPG Therapy приложение включает функциональность поиска на трех основных страницах: Protocols, Skills и History. Каждая страница имеет свои особенности поиска и фильтрации данных.

## Общие принципы поиска

### Реализация
- **Поиск в реальном времени**: Результаты обновляются при каждом изменении поискового запроса
- **Нечувствительность к регистру**: Все поиски работают в lowercase
- **Множественные критерии**: Поиск осуществляется по нескольким полям одновременно
- **Автоматический сброс пагинации**: При фильтрации возврат к первой странице

### Техническая архитектура
```javascript
// Общая структура методов поиска
filterItems(query) {
  const allItems = Storage.getItemsInOrder();
  
  if (!query.trim()) {
    this.filteredItems = allItems;
  } else {
    const searchTerm = query.toLowerCase();
    this.filteredItems = allItems.filter(item => {
      // Множественные критерии поиска
    });
  }
  
  // Сброс пагинации и перерисовка
  this.itemsPage = 1;
  UI.renderItems();
}
```

## 1. Protocols Search

### Поисковые критерии
1. **Название протокола** (`protocol.name`)
2. **Связанные навыки** (`protocol.targets`) - поиск по названиям навыков

### Техническая реализация
```javascript
filterProtocols(query) {
  const allProtocols = Storage.getProtocolsInOrder();
  const skills = Storage.getSkills();
  
  if (!query.trim()) {
    this.filteredProtocols = allProtocols;
  } else {
    const searchTerm = query.toLowerCase();
    this.filteredProtocols = allProtocols.filter(protocol => {
      // Поиск в названии протокола
      if (protocol.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Поиск в связанных навыках
      const targetNames = protocol.targets.map(targetId => {
        const skill = skills.find(s => s.id === targetId);
        return skill ? skill.name.toLowerCase() : targetId;
      });
      
      return targetNames.some(name => name.includes(searchTerm));
    });
  }
  
  this.protocolsPage = 1;
  UI.renderProtocols();
  this.setupTooltips();
}
```

### Примеры поиска
- `"morning"` - найдет протоколы с "Morning" в названии
- `"social"` - найдет протоколы, влияющие на навыки социального типа
- `"confidence"` - найдет протоколы по названию или связанным навыкам

## 2. Skills Search

### Поисковые критерии
1. **Название навыка** (`skill.name`)
2. **Описание навыка** (`skill.hover`) - детальное описание

### Техническая реализация
```javascript
filterSkills(query) {
  const allSkills = Storage.getSkillsInOrder();
  
  if (!query.trim()) {
    this.filteredSkills = allSkills;
  } else {
    const searchTerm = query.toLowerCase();
    this.filteredSkills = allSkills.filter(skill => {
      // Поиск в названии навыка
      if (skill.name.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Поиск в описании навыка
      const description = skill.hover ? skill.hover.toLowerCase() : '';
      return description.includes(searchTerm);
    });
  }
  
  this.skillsPage = 1;
  UI.renderSkills();
  this.setupTooltips();
}
```

### Примеры поиска
- `"communication"` - найдет навыки по названию или описанию
- `"anxiety"` - найдет навыки связанные с тревожностью
- `"physical"` - найдет физические навыки

## 3. History Search

### Поисковые критерии
1. **Название протокола** (`checkin.protocolName`)
2. **Название элемента** (`checkin.itemName`) для drag & drop операций
3. **Тип операции** (для drag & drop: "reordered protocol", "reordered skill")
4. **Затронутые навыки** (`checkin.changes`) - названия измененных навыков

### Техническая реализация
```javascript
filterHistory(query) {
  const allHistory = Storage.getCheckins().reverse();
  const skills = Storage.getSkills();
  
  if (!query.trim()) {
    this.filteredHistory = allHistory;
  } else {
    const searchTerm = query.toLowerCase();
    this.filteredHistory = allHistory.filter(checkin => {
      // Поиск по названию протокола
      if (checkin.protocolName && checkin.protocolName.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Поиск по названию элемента (drag & drop)
      if (checkin.itemName && checkin.itemName.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Поиск по типу операции
      if (checkin.type === 'drag_drop') {
        const actionText = checkin.subType === 'protocol' ? 'reordered protocol' : 'reordered skill';
        if (actionText.includes(searchTerm)) {
          return true;
        }
      }
      
      // Поиск в затронутых навыках
      if (checkin.changes) {
        const affectedSkills = Object.keys(checkin.changes).map(skillId => {
          const skill = skills.find(s => s.id == skillId);
          return skill ? skill.name.toLowerCase() : '';
        });
        
        if (affectedSkills.some(skillName => skillName.includes(searchTerm))) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  UI.renderHistory();
}
```

### Особенности History Search

#### Проблема инициализации (ИСПРАВЛЕНО)
**Проблема**: Метод `renderHistory()` некорректно инициализировал `filteredHistory`, сбрасывая результаты поиска.

**Решение**: Добавлена проверка активности поиска:
```javascript
renderHistory() {
  // Инициализация только если нет активного поиска
  const historySearchInput = document.getElementById('history-search');
  const hasSearchQuery = historySearchInput && historySearchInput.value.trim() !== '';
  
  if (App.filteredHistory.length === 0 && !hasSearchQuery) {
    App.filteredHistory = Storage.getCheckins().reverse();
  }
  
  // ... rest of the method
}
```

#### Умные сообщения
- **Нет записей**: "No check-ins yet. Start with a protocol!"
- **Поиск без результатов**: "No check-ins found matching your search."

### Примеры поиска
- `"warm up"` - найдет check-ins протокола "Warm up"
- `"reordered"` - найдет все операции перестановки
- `"social"` - найдет check-ins, затрагивающие социальные навыки
- `"protocol"` - найдет операции с протоколами

## Event Listeners Setup

### Инициализация поиска
```javascript
setupEventListeners() {
  // Protocol search
  const searchInput = document.getElementById('protocol-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      this.filterProtocols(e.target.value);
    });
  }

  // Skill search
  const skillSearchInput = document.getElementById('skill-search');
  if (skillSearchInput) {
    skillSearchInput.addEventListener('input', (e) => {
      this.filterSkills(e.target.value);
    });
  }

  // History search
  const historySearchInput = document.getElementById('history-search');
  if (historySearchInput) {
    historySearchInput.addEventListener('input', (e) => {
      this.filterHistory(e.target.value);
    });
  }
}
```

## Состояние поиска

### Переменные состояния
```javascript
const App = {
  filteredProtocols: [],  // Отфильтрованные протоколы
  filteredSkills: [],     // Отфильтрованные навыки
  filteredHistory: [],    // Отфильтрованная история
  // ...
};
```

### Сброс состояния
- **При переходе между страницами**: Фильтры сохраняются
- **При очистке поиска**: Показываются все элементы
- **При удалении элементов**: История сбрасывается автоматически

## Производительность

### Оптимизации
1. **Ленивая инициализация**: Фильтры инициализируются только при необходимости
2. **Сброс пагинации**: Автоматический возврат к первой странице
3. **Перерисовка**: Минимальная перерисовка только изменившихся элементов

### Ограничения
- Поиск работает только по загруженным данным (без серверного поиска)
- Максимум 30 элементов на страницу для производительности
- История показывается в обратном хронологическом порядке

## Будущие улучшения

### Потенциальные функции
1. **Regex поиск**: Поддержка регулярных выражений
2. **Фильтры по дате**: Для истории check-ins
3. **Сохранение поисковых запросов**: В localStorage
4. **Автодополнение**: Предложения на основе существующих данных
5. **Расширенные фильтры**: По типу операции, диапазону дат, значениям скоров

### Технические улучшения
1. **Debouncing**: Задержка поиска для снижения нагрузки
2. **Highlighting**: Подсветка найденного текста
3. **Горячие клавиши**: Ctrl+F для фокуса на поиске
4. **История поиска**: Недавние поисковые запросы 