# RPG Therapy - Полная документация приложения

## 🎮 Общая концепция

**RPG Therapy** - карманный психотерапевт в форме RPG игры "собери своего персонажа". 

Пользователь выполняет ежедневные **Protocols** (ритуалы) → прокачивает **Skills** (навыки) → улучшает общие **States** (состояния). Среднее значение определенных наборов Skills формирует текущую оценку состояния.

---

## 📊 Сущности приложения

### 1. **Protocols** (Протоколы)

Ежедневные пользовательские "ритуалы", через которые прокачиваются Skills.

#### Features:
- Вводятся пользователем вручную
- Имеют кнопку "Check In" - нажимается после совершения Protocol
- При чекине изменяют привязанные к ним Skills согласно настройкам

#### Свойства Protocol:
- **Name**: название протокола
- **Hover**: описание при наведении
- **Action**: что делает чекин (`+` добавляет, `-` убавляет)
- **Weight**: на какое значение изменяются Skills при чекине
- **Target 1, 2, 3**: до 3 Skills, которые затрагиваются

#### Полный список Protocols:

| Protocol | Hover | Action | Weight | Target 1 | Target 2 | Target 3 |
|----------|--------|--------|--------|----------|----------|----------|
| **🧍‍♂️ Warm Up. Turn the body on** | Wake the system. | **+** | **0.05** | 🏃🏻‍♂️ Body Sync | 🔋 Energy | |
| **🧘‍♂️ Meditation. Engage with yourself** | Build presence through attention. | **+** | **0.05** | 🧘🏻 Focus | 🔋 Energy | ⚡ Engagement |
| **🚶‍♂️ Short Walk. Reset through motion** | 20-minute walk to ground the mind and release tension. | **+** | **0.03** | 🏃🏻‍♂️ Body Sync | | |
| **👟 Long Run. Reset through effort** | 60-minute run to rebuild clarity and trust in the body. | **+** | **0.1** | 🏃🏻‍♂️ Body Sync | | |
| **🧖‍♂️ Sauna / Bath. Clear the chamber** | | **+** | **0.05** | 🔋 Energy | 🧘🏻 Focus | 🏃🏻‍♂️ Body Sync |
| **🌀 Clear your head. Cognitive Dump** | Open a blank screen → write whatever's in your head. No filter. Just let it pour for 3-5 minutes. | **+** | **0.05** | 🧘🏻 Focus | 🔋 Energy | |
| **🎧 Get in the zone. Context Immersion** | 1. Play an audio cue that links to past focus.<br/>2. Open an old project/file/idea where you were locked in - just for 5 minutes.<br/>3. Don't work. Just look.<br/>📍 Make the entry light: one small clear step → a sense of progress → you're warming up. | **+** | **0.1** | 🧘🏻 Focus | 🔋 Energy | |
| **📦 One small step. Primitive Start** | 1. Pick a task you don't want to touch.<br/>2. Do the dumbest possible move: start a file, write one line, make one search.<br/>3. Don't think - just make contact.<br/>📍 Take the tiniest action to reduce activation cost. | **+** | **0.1** | 🔋 Energy | ⚡ Engagement | |
| **🔁 Reboot the map. Visual Restart** | 1. Open a big whiteboard (FigJam, Miro).<br/>2. Drop this in the center: What's blocking me?<br/>3. Map out arrows, blocks, "if only...", "to get...", feelings, fragments, images. | **+** | **0.1** | 🧘🏻 Focus | ⚡ Engagement | |
| **🎯 Lock In. Step into your next role** | Not forever. Just try it like it's real. | **+** | **0.1** | 📊 Business Insight | 🚄 Execution Speed | ⚡ Engagement |
| **✋ Cut Smart. Know when enough is enough** | Energy's limited. Spend it where it pays. | **+** | **0.1** | 🔋 Energy | 🧘🏻 Focus | ⚡ Engagement |
| **🎯 Audience Targeting. Know who it's for** | Clarify the person behind the view - before you press upload. | **+** | **0.1** | 📊 Business Insight | | |
| **🧾 Music Rights Knowledge. Know what's allowed** | Don't guess the game. Learn how it's played. | **+** | **0.1** | 📊 Business Insight | | |
| **🤖 AI for Coding. Think with tools** | Use AI to code faster, test faster, think faster. | **+** | **0.05** | 🚄 Execution Speed | 📊 Business Insight | |
| **🎛 AI Music Production. Let the tool stretch you** | Less manual. More mental. You shape, it builds. | **+** | **0.1** | 📊 Business Insight | ⚡ Engagement | 🚄 Execution Speed |
| **❤️ Show Up. Be there when it counts** | Not perfect - just present, consistent, real. | **+** | **0.1** | ❤️ Relationship | 🔋 Energy | 🧘🏻 Focus |
| **📞 Family Call. Get out of your head** | They remind you who you are outside the grind. | **+** | **0.15** | 👨‍👩‍👧‍👦 Family | | |
| **🌐 Look Around. You're not solo** | Some people just remind you you're real. | **+** | **0.3** | 🧩 Community | | |
| **🥗 Fuel Balance. Don't push the system** | Stay light, stay sharp. | **+** | **0.1** | 🏃🏻‍♂️ Body Sync | 🔋 Energy | 🧘🏻 Focus |
| **📖 Read. Draw from the source** | You don't have to make it up. It's already there. | **+** | **0.15** | ⚡ Engagement | 🔋 Energy | 📊 Business Insight |
| **🛏 Sleep. Don't skip the reset** | The work lands better when you're not fried. | **+** | **0.1** | 🔋 Energy | 🧘🏻 Focus | 🏃🏻‍♂️ Body Sync |
| **💨 Weed. Half out by design** | You step off. Not to fall apart - just to float for a while. | **-** | **0.2** | 🏃🏻‍♂️ Body Sync | 🚄 Execution Speed | ❤️ Relationship |
| **🥃 Alcohol. Something's off** | Slows your game. | **-** | **0.25** | 🏃🏻‍♂️ Body Sync | ❤️ Relationship | 🔋 Energy |

### 2. **Skills** (Навыки)

Отображают текущий уровень навыков персонажа. Protocols изменяют Skills на свой weight в зависимости от action.

#### Features:
- **Initial Score**: Первоначальное значение вводится пользователем (если не указано - начинается с 0)
- **Current Score**: Initial Score + сумма всех чекинов Protocols
- **Цветовая индикация**: <2 🔴, 2-4 🟠, 4-6 🟡, 7-9 🟢, 10+ 💚
- **Дата последнего обновления**
- **История изменений**: список всех коммитов, влиявших на этот Skill. Скрыт под кнопку, открывается всплывающим окном
- **Ручная корректировка**: при изменении Initial Score обнуляется история (пользователь должен подтвердить)

#### Полный список Skills:

| Skill | Hover | Initial Score | Current Score |
|-------|--------|---------------|---------------|
| **🧘🏻 Focus. Attentional control** | Ability to sustain attention and think deeply. | **5.20** | **6.45** |
| **🔋 Energy. Cognitive stamina** | Mental fuel to start and stay engaged. | **5.50** | **7.30** |
| **⚡ Engagement. Impulse** | It pulls you forward - without force. | **5.90** | **7.35** |
| **🏃🏻‍♂️ Body Sync. Body-driven confidence** | When the body leads, the mind follows. | **5.90** | **6.13** |
| **📊 Business Insight. Strategic understanding** | The mental model of how things work and where value flows. | **5.30** | **6.55** |
| **🚄 Execution Speed. Learn and apply fast** | Respond to change with flexible execution. | **6.50** | **6.85** |
| **❤️ Relationship. What lives between you** | | **6.00** | **5.80** |
| **👨‍👩‍👧‍👦 Family. What matters most** | The one bond that doesn't care who you are at work. | **6.30** | **6.10** |
| **🧩 Community. Not the crowd - the circle** | Other minds run deep too. Find them. | **5.20** | **5.50** |

### 3. **States** (Состояния)

Средние значения комбинаций Skills составляют States.

#### Features:
- **Выбор Skills**: через чекбоксы можно настроить, какие Skills влияют на State
- **Initial Score**: среднее значение Initial Scores выбранных Skills
- **Current Score**: среднее значение Current Scores выбранных Skills
- **Автоматический пересчет** при изменении любого входящего Skill

#### Полный список States:

| State | Hover | Skills Formula | Initial Score | Current Score |
|-------|--------|----------------|---------------|---------------|
| **🧠 Mental clarity. Cognitive Resource** | Capacity for clear thinking and intentional action. | Focus + Energy + Engagement | **5.53** | **7.03** |
| **🪝 Stick-to-itiveness. Still here** | Not chasing highs. Just not quitting. | Focus + Energy + Body Sync | **5.73** | **6.80** |
| **🔹 Physical Shape. Built presence** | Self-image built through movement and consistency. | Body Sync | **5.90** | **6.13** |
| **🚀 Builder Mode. Acting with ownership** | The mindset of making systems, not just tasks. | Business Insight + Execution Speed + Engagement | **5.72** | **6.77** |
| **🎼 Harmony. You're in the right place** | What you're doing matches where your mind wants to be. | Business Insight + Energy + Focus | **6.00** | **6.94** |
| **🌅 Peace** | The baseline that lets everything work. | All Skills Average | **5.84** | **6.57** |

### 4. **Check-ins** (Чекины/Коммиты)

Фиксация выполнения Protocol. Каждый чекин изменяет связанные Skills согласно настройкам Protocol.

#### Features:
- **Список с датой, названием, влиянием** на Skills
- **Возможность удаления** отдельных чекинов
- **Независимая логика**: удаление одного чекина не ломает предыдущие подсчеты
- **Трассируемость**: от каждого Skill можно посмотреть историю его изменений

---

## 🗄️ Техническая реализация

### Структура базы данных

#### Таблица `skills`
```sql
CREATE TABLE skills (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    hover_description TEXT,
    initial_score DECIMAL(4,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Таблица `protocols`
```sql
CREATE TABLE protocols (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    icon VARCHAR(10),
    hover_description TEXT,
    action ENUM('+', '-') NOT NULL,
    weight DECIMAL(4,2) NOT NULL,
    target_skill_1 INTEGER,
    target_skill_2 INTEGER,
    target_skill_3 INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (target_skill_1) REFERENCES skills(id),
    FOREIGN KEY (target_skill_2) REFERENCES skills(id),
    FOREIGN KEY (target_skill_3) REFERENCES skills(id)
);
```

#### Таблица `states`
```sql
CREATE TABLE states (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(10),
    hover_description TEXT,
    skill_ids JSON, -- массив ID skills
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Таблица `checkins` (ключевая!)
```sql
CREATE TABLE checkins (
    id INTEGER PRIMARY KEY,
    protocol_id INTEGER NOT NULL,
    skill_changes JSON NOT NULL, -- {"skill_id": change_value}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (protocol_id) REFERENCES protocols(id)
);
```

### Логика расчетов

#### Current Score для Skills:
```javascript
function calculateCurrentSkillScore(skillId) {
    const skill = getSkill(skillId);
    const checkins = getCheckinsBySkillId(skillId);
    
    let totalChange = 0;
    checkins.forEach(checkin => {
        const changes = JSON.parse(checkin.skill_changes);
        totalChange += changes[skillId] || 0;
    });
    
    return skill.initial_score + totalChange;
}
```

#### Current Score для States:
```javascript
function calculateCurrentStateScore(stateId) {
    const state = getState(stateId);
    const skillIds = JSON.parse(state.skill_ids);
    
    let totalScore = 0;
    skillIds.forEach(skillId => {
        totalScore += calculateCurrentSkillScore(skillId);
    });
    
    return totalScore / skillIds.length;
}
```

#### Создание чекина:
```javascript
function createCheckin(protocolId) {
    const protocol = getProtocol(protocolId);
    const skillChanges = {};
    
    // Собираем все изменения для этого протокола
    if (protocol.target_skill_1) {
        const change = protocol.action === '+' ? protocol.weight : -protocol.weight;
        skillChanges[protocol.target_skill_1] = change;
    }
    if (protocol.target_skill_2) {
        const change = protocol.action === '+' ? protocol.weight : -protocol.weight;
        skillChanges[protocol.target_skill_2] = change;
    }
    if (protocol.target_skill_3) {
        const change = protocol.action === '+' ? protocol.weight : -protocol.weight;
        skillChanges[protocol.target_skill_3] = change;
    }
    
    // Создаем запись
    createCheckin({
        protocol_id: protocolId,
        skill_changes: JSON.stringify(skillChanges),
        created_at: new Date()
    });
    
    // Обновляем дату последнего изменения для затронутых Skills
    Object.keys(skillChanges).forEach(skillId => {
        updateSkillTimestamp(skillId);
    });
}
```

#### Удаление чекина:
```javascript
function deleteCheckin(checkinId) {
    const checkin = getCheckin(checkinId);
    const skillChanges = JSON.parse(checkin.skill_changes);
    
    // Удаляем запись
    deleteCheckinRecord(checkinId);
    
    // Обновляем timestamp для затронутых Skills
    Object.keys(skillChanges).forEach(skillId => {
        updateSkillTimestamp(skillId);
    });
    
    // Current Scores пересчитаются автоматически при следующем запросе
}
```

---

## 🎨 UI/UX Спецификация

### Дизайн в стиле таблиц данных:
- **Монопространный шрифт** (Roboto Mono, Fira Code)
- **Темная тема** с акцентами
- **Табличная структура** с четким выравниванием
- **Цветовая кодировка** уровней Skills/States
- **Hover эффекты** с дополнительной информацией

### Цветовая схема Skills:
- **<2.0**: `#ca4754` (красный)
- **2.0-3.9**: `#e6934a` (оранжевый)  
- **4.0-5.9**: `#e2b714` (желтый)
- **6.0-7.9**: `#98c379` (зеленый)
- **8.0-10.0**: `#7fb3d3` (ярко-зеленый)

### Экраны приложения:

#### 1. **Главный дашборд**
- Таблица текущих States с Current Scores
- Быстрый доступ к основным Protocols
- Индикаторы состояния Skills

#### 2. **Protocols страница**
- Таблица всех Protocols с кнопками "Check In"
- Фильтры по категориям
- История последних чекинов

#### 3. **Skills страница**  
- Таблица всех Skills с Initial/Current Scores
- Цветовая индикация уровней
- Доступ к истории изменений каждого Skill

#### 4. **History страница**
- Полная история всех чекинов
- Фильтры по датам, Protocols, Skills
- Возможность удаления чекинов

#### 5. **Settings страница**
- Редактирование Initial Scores для Skills
- Настройка формул для States
- Управление Protocols

---

## 🔄 Пользовательские сценарии

### Новый пользователь:
1. Устанавливает приложение с предзаполненными Protocols и Skills
2. Устанавливает Initial Scores для Skills (опционально)
3. Начинает делать чекины Protocols
4. Наблюдает изменения Current Scores

### Ежедневное использование:
1. Открывает приложение
2. Выбирает выполненные Protocols
3. Нажимает "Check In" для каждого
4. Видит обновленные Skills и States

### Анализ прогресса:
1. Переходит на страницу Skills
2. Смотрит динамику Current Scores
3. Переходит в History конкретного Skill
4. Анализирует, какие Protocols дают наибольший эффект

### Корректировка системы:
1. Добавляет новые Protocols
2. Корректирует Initial Scores (с подтверждением сброса истории)
3. Настраивает новые States с кастомными формулами
4. Удаляет ошибочные чекины

---

## 🚀 MVP Roadmap

### Phase 1: Core (Обязательно)
- [ ] Базовая структура БД
- [ ] CRUD для Skills (просмотр, редактирование Initial Scores)
- [ ] Отображение предзаполненных Protocols
- [ ] Система чекинов
- [ ] Расчет Current Scores для Skills
- [ ] Базовые States с фиксированными формулами

### Phase 2: History & Management 
- [ ] История чекинов
- [ ] Удаление чекинов
- [ ] Детальная история для каждого Skill
- [ ] CRUD для Protocols
- [ ] Настройка формул States

### Phase 3: Enhanced UX
- [ ] Графики прогресса Skills
- [ ] Экспорт/импорт данных
- [ ] Уведомления о регулярности Protocols
- [ ] Статистика (средние изменения, эффективность Protocols)

### Phase 4: Advanced
- [ ] Кастомные Skills
- [ ] Кастомные States
- [ ] Синхронизация между устройствами
- [ ] Sharing прогресса
- [ ] AI рекомендации по Protocols

---

*Система построена для превращения саморазвития в увлекательную RPG с четкими метриками прогресса и полным контролем над данными.*
