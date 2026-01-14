# RPG Therapy - Полная документация приложения

## 🎮 Общая концепция

**RPG Therapy** - карманный психотерапевт в форме RPG игры "собери своего персонажа". 

Пользователь выполняет ежедневные **Protocols** (ритуалы) → прокачивает **Innerfaces** (навыки) → улучшает общие **States** (состояния). Среднее значение определенных наборов Innerfaces формирует текущую оценку состояния.

## 🔍 Функциональность поиска

Приложение включает продвинутую систему поиска, позволяющую быстро находить нужную информацию во всех разделах:

- **Protocols** - поиск по названию протокола и целевым навыкам
- **Innerfaces** - поиск по названию и описанию навыков  
- **History** - поиск по названиям протоколов, навыков, типу операций

**📚 Подробная документация:** [SEARCH_FUNCTIONALITY.md](./SEARCH_FUNCTIONALITY.md)

## ⚡ Quick Actions

Система быстрого доступа к часто используемым протоколам прямо с главной страницы Dashboard. Позволяет выполнять ежедневные ритуалы в один клик, устраняя "активационный барьер".

### Features:
- **Быстрый доступ**: До 5 протоколов на главной странице
- **Один клик**: Мгновенное выполнение check-in протокола  
- **Умное управление**: Простое добавление/удаление через модальные окна
- **Поиск протоколов**: Фильтрация доступных протоколов для добавления
- **Адаптивный дизайн**: 5 колонок на десктопе, 2 на мобильных

**📚 Подробная документация:** [QUICK_ACTIONS.md](./QUICK_ACTIONS.md)

---

## 📊 Сущности приложения

### 1. **Protocols** (Протоколы)

Ежедневные пользовательские "ритуалы", через которые прокачиваются Innerfaces.

#### Features:
- Вводятся пользователем вручную
- Имеют кнопку "Check In" - нажимается после совершения Protocol
- При чекине изменяют привязанные к ним Innerfaces согласно настройкам

#### Свойства Protocol:
- **Name**: название протокола
- **Hover**: описание при наведении
- **Action**: что делает чекин (`+` добавляет, `-` убавляет)
- **Weight**: на какое значение изменяются Innerfaces при чекине
- **Target 1, 2, 3**: до 3 Innerfaces, которые затрагиваются

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

### 2. **Innerfaces** (Навыки)

Отображают текущий уровень навыков персонажа. Protocols изменяют Innerfaces на свой weight в зависимости от action.

#### Features:
- **Initial Score**: Первоначальное значение вводится пользователем (если не указано - начинается с 0)
- **Current Score**: Initial Score + сумма всех чекинов Protocols
- **Цветовая индикация**: <2 🔴, 2-4 🟠, 4-6 🟡, 7-9 🟢, 10+ 💚
- **Дата последнего обновления**
- **История изменений**: список всех коммитов, влиявших на этот Innerface. Скрыт под кнопку, открывается всплывающим окном
- **Ручная корректировка**: при изменении Initial Score обнуляется история (пользователь должен подтвердить)

#### Полный список Innerfaces:

| Innerface | Hover | Initial Score | Current Score |
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

Средние значения комбинаций Innerfaces составляют States.

#### Features:
- **Выбор Innerfaces**: через чекбоксы можно настроить, какие Innerfaces влияют на State
- **Initial Score**: среднее значение Initial Scores выбранных Innerfaces
- **Current Score**: среднее значение Current Scores выбранных Innerfaces
- **Автоматический пересчет** при изменении любого входящего Innerface

#### Полный список States:

| State | Hover | Innerfaces Formula | Initial Score | Current Score |
|-------|--------|----------------|---------------|---------------|
| **🧠 Mental clarity. Cognitive Resource** | Capacity for clear thinking and intentional action. | Focus + Energy + Engagement | **5.53** | **7.03** |
| **🪝 Stick-to-itiveness. Still here** | Not chasing highs. Just not quitting. | Focus + Energy + Body Sync | **5.73** | **6.80** |
| **🔹 Physical Shape. Built presence** | Self-image built through movement and consistency. | Body Sync | **5.90** | **6.13** |
| **🚀 Builder Mode. Acting with ownership** | The mindset of making systems, not just tasks. | Business Insight + Execution Speed + Engagement | **5.72** | **6.77** |
| **🎼 Harmony. You're in the right place** | What you're doing matches where your mind wants to be. | Business Insight + Energy + Focus | **6.00** | **6.94** |
| **🌅 Peace** | The baseline that lets everything work. | All Innerfaces Average | **5.84** | **6.57** |

### 4. **Check-ins** (Чекины/Коммиты)

Фиксация выполнения Protocol. Каждый чекин изменяет связанные Innerfaces согласно настройкам Protocol.

#### Features:
- **Список с датой, названием, влиянием** на Innerfaces
- **Возможность удаления** отдельных чекинов
- **Независимая логика**: удаление одного чекина не ломает предыдущие подсчеты
- **Трассируемость**: от каждого Innerface можно посмотреть историю его изменений

---

## 🗄️ Техническая реализация

### Структура базы данных

#### Таблица `innerfaces`