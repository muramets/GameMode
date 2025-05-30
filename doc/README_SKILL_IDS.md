# Система ID навыков в RPG Therapy

## Проблема и её решение

### Историческая проблема
Изначально в приложении была критическая проблема с типами ID навыков:
- **Навыки** имели строковые ID: `"focus"`, `"energy"`, `"body_sync"` и т.д.
- **Состояния** ссылались на навыки через массив `skillIds` со строковыми ID
- **Протоколы** ссылались на навыки через массив `targets` со строковыми ID  
- **Check-ins** создавали объекты `changes` с ключами-строками: `{"focus": 1.5, "energy": 0.8}`

В процессе разработки часть логики была переписана под числовые ID, что привело к **несоответствию типов**:
- Навыки получили числовые ID: `1, 2, 3...`
- Но состояния и check-ins остались со строковыми ссылками
- Функция `calculateCurrentScore()` не могла найти навыки по ID
- Дашборд показывал нули, навыки "исчезали"

### Решение: Система миграции
Создана функция `Storage.migrateSkillIds()` которая:
1. **Автоматически определяет** тип несоответствия
2. **Конвертирует все ID** в числовой формат
3. **Обновляет все связи** между сущностями
4. **Сохраняет историю** check-ins

## Как работает система ID сейчас

### 1. Основной принцип
- **Все ID навыков** должны быть **числовыми**: `1, 2, 3, 4, 5...`
- **Все ссылки** на навыки используют эти числовые ID
- **Поиск навыков** работает с fallback для совместимости

### 2. Структура данных

```javascript
// Навык
{
  id: 1,                    // ЧИСЛОВОЙ ID
  name: "Focus. Концентрация внимания",
  icon: "🎯",
  hover: "Способность сосредоточиться...",
  initialScore: 2.0
}

// Состояние
{
  id: "mindfulness",
  name: "Mindfulness. Осознанность",
  skillIds: [1, 2, 3]      // ЧИСЛОВЫЕ ссылки на навыки
}

// Протокол
{
  id: 1,
  name: "Morning Focus",
  targets: [1, 2]          // ЧИСЛОВЫЕ ссылки на навыки
}

// Check-in
{
  changes: {
    "1": 1.5,              // Ключи могут быть строками чисел
    "2": 0.8
  }
}
```

### 3. Поиск навыков - Storage.getSkillById()

```javascript
getSkillById(id) {
  const skills = this.getSkills();
  // FALLBACK: ищем и по строгому равенству И по нестрогому
  const skill = skills.find(s => s.id === id || s.id == id);
  return skill;
}
```

**Логика:**
- `s.id === id` - строгое сравнение (1 === 1)
- `s.id == id` - нестрогое сравнение (1 == "1")
- Это позволяет найти навык независимо от типа переданного ID

## Где используются ID навыков

### 1. Dashboard (Дашборд)
**Файл:** `js/ui.js` → `renderDashboard()`

```javascript
states.map(state => {
  const score = Storage.calculateStateScore(state.id);  // ← ЗДЕСЬ
})
```

**Логика:**
1. Берёт каждое состояние 
2. Вызывает `calculateStateScore(state.id)`
3. Функция перебирает `state.skillIds` (числовые ID)
4. Для каждого ID вызывает `calculateCurrentScore(skillId)`
5. Суммирует scores всех навыков и делит на количество

**Fallback:** Если навык не найден, возвращается score = 0

### 2. Skills Page (Страница навыков)
**Файл:** `js/ui.js` → `renderSkills()`

```javascript
skillsToShow.map((skill, index) => {
  const current = Storage.calculateCurrentScore(skill.id);  // ← ЗДЕСЬ
})
```

**Логика:**
1. Для каждого навыка вызывает `calculateCurrentScore(skill.id)`
2. Функция ищет все check-ins где есть `changes[skillId]`
3. Суммирует все изменения и прибавляет к `initialScore`

**Редактирование навыков:**
```javascript
onclick="Modals.editSkill('${skill.id}')"  // ← ID передается как строка
```

**Fallback в Modals.editSkill():**
```javascript
// Преобразование строки в число с fallback
const searchId = typeof skillId === 'string' ? parseInt(skillId) || skillId : skillId;
const skill = Storage.getSkillById(searchId);
```

### 3. Protocols Page (Страница протоколов)
**Файл:** `js/ui.js` → `renderProtocols()`

```javascript
const targetNames = protocol.targets.map(targetId => {
  const skill = skills.find(s => s.id === targetId);  // ← ЗДЕСЬ
  return skill ? skill.name.split('.')[0] : targetId;
});
```

**Логика:**
1. Для каждого протокола берёт массив `targets` (числовые ID)
2. Ищет навыки по этим ID
3. Отображает имена навыков как теги

**Fallback:** Если навык не найден, показывает сам ID

### 4. History Page (История)
**Файл:** `js/ui.js` → `renderHistory()`

```javascript
const changes = Object.entries(checkin.changes).map(([skillId, change]) => {
  const skill = skills.find(s => s.id == skillId);  // ← ЗДЕСЬ нестрогое сравнение!
})
```

**Логика:**
1. Перебирает `checkin.changes` объект
2. Ключи могут быть строками: `{"1": 1.5, "2": 0.8}`
3. Использует **нестрогое сравнение** `s.id == skillId`
4. Это позволяет найти навык с ID=1 по ключу "1"

**Fallback:** Если навык не найден, пропускает этот change

## Функция миграции

### Storage.migrateSkillIds()

**Автоматическое определение проблемы:**
```javascript
const skillsAreNumeric = skills.every(s => typeof s.id === 'number');
const statesHaveStringIds = states.some(s => s.skillIds.some(id => typeof id === 'string'));

if (skillsAreNumeric && statesHaveStringIds) {
  return this.fixStateSkillIds();  // Специальный fix
}
```

**Полная миграция:**
1. Создаёт маппинг старых ID → новых ID
2. Обновляет все навыки с новыми числовыми ID
3. Обновляет `protocol.targets`
4. Обновляет `state.skillIds` 
5. Обновляет `checkin.changes` ключи
6. Сохраняет новый порядок навыков

### Storage.fixStateSkillIds()

**Специальный fix когда навыки уже числовые:**
```javascript
const stringToNumberMapping = {
  "focus": 1,
  "energy": 2, 
  "engagement": 3,
  "body_sync": 4,
  "business_insight": 5,
  "execution_speed": 6,
  "relationship": 7,
  "family": 8,
  "community": 9
};
```

Исправляет только ссылки, используя хардкодированный маппинг.

## Drag & Drop и ID

### Протоколы
```javascript
// В HTML
data-protocol-id="${protocol.id}"

// В DragDrop
const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
const targetId = parseInt(row.dataset.protocolId);
```

**Явное преобразование** в числа через `parseInt()`

### Навыки  
```javascript
// В HTML
data-skill-id="${skill.id}"

// В DragDrop
const draggedId = e.dataTransfer.getData('text/plain');  // Остается строкой
const targetId = row.dataset.skillId;                   // Остается строкой
```

**Остаются строками**, но поиск работает благодаря fallback в `getSkillById()`

## Основные принципы

### 1. Всегда числовые ID для новых навыков
```javascript
// В Storage.addSkill()
const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
const newId = maxId + 1;  // Гарантированно число
```

### 2. Fallback везде где возможно
- `getSkillById()` - строгое И нестрогое сравнение
- `editSkill()` - парсинг строки с fallback
- History - нестрогое сравнение ключей

### 3. Миграция при обнаружении проблем
- Автоматическое определение типа проблемы
- Пошаговое исправление всех связей
- Сохранение исторических данных

### 4. Консистентность после миграции
После успешной миграции ВСЕ ID должны быть числовыми, и система работает без fallback-ов.

---

## Troubleshooting

**Если дашборд показывает нули:**
1. Открыть консоль браузера
2. Перейти в Settings → Migrate Skill IDs
3. Запустить миграцию

**Если навыки не находятся:**
- Проверить тип ID в консоли: `Storage.getSkills().map(s => ({id: s.id, type: typeof s.id}))`
- Проверить состояния: `Storage.getStates().map(s => s.skillIds)`

**Если редактирование не работает:**
- ID передается как строка в HTML атрибутах
- `Modals.editSkill()` автоматически преобразует в нужный тип 