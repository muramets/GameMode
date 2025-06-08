# 🤖 RPG Therapy v1.0 - Refactoring Tips for AI Agent Compatibility

*Максимально AI-дружественная архитектура*

---

## 🎯 Цели рефакторинга {#цели-рефакторинга}

### 🤖 AI Agent Compatibility

**Основные принципы для AI-совместимости:**

1. **Предсказуемая структура** - AI агент должен легко понимать организацию кода
2. **Декларативная документация** - четкое описание интерфейсов и схем данных  
3. **Консистентные паттерны** - одинаковые подходы во всех модулях
4. **Самодокументируемый код** - имена переменных и функций говорят сами за себя
5. **Типизированные интерфейсы** - четкие контракты между компонентами

---

## 📊 Структурированные данные

### 1. **TypeScript Conversion** (Приоритет: ВЫСОКИЙ)

**Текущая проблема:**
```javascript
// Неопределенная структура
function addInnerface(innerface) {
  // Что именно в innerface? Какие поля обязательны?
}
```

**AI-дружественное решение:**
```typescript
interface Innerface {
  readonly id: InnerfaceId;
  name: string;
  icon: EmojiString;
  hover: string;
  initialScore: ScoreValue; // 0-10
  order?: number;
  createdAt: ISOString;
  updatedAt: ISOString;
}

type InnerfaceId = number | string;
type ScoreValue = number; // 0 <= value <= 10
type EmojiString = string; // Single emoji character
type ISOString = string; // ISO 8601 date string

function addInnerface(innerface: Omit<Innerface, 'id' | 'createdAt' | 'updatedAt'>): InnerfaceId {
  // AI агент точно знает, что принимает и возвращает функция
}
```

### 2. **Data Schema Documentation**

**Создать TypeScript definition файлы:**

```typescript
// types/entities.ts
export interface Protocol {
  readonly id: ProtocolId;
  name: string;
  icon: EmojiString;
  hover: string;
  action: '+' | '-';
  weight: Weight; // 0-1
  targets: readonly InnerfaceId[]; // 1-3 elements
  isQuickAction?: boolean;
  order?: number;
  createdAt: ISOString;
  updatedAt: ISOString;
}

export interface HistoryEntry {
  readonly id: TimestampId;
  readonly type: 'protocol' | 'drag_drop' | 'quick_action';
  readonly timestamp: ISOString;
  readonly userId: UserId;
  
  // Union type for different entry types
  readonly data: ProtocolHistoryData | DragDropHistoryData | QuickActionHistoryData;
}

type ProtocolHistoryData = {
  protocolId: ProtocolId;
  protocolName: string;
  action: '+' | '-';
  changes: Record<InnerfaceId, number>;
};
```

---

## 🏗️ Архитектурные улучшения

### 1. **Domain-Driven Design** (Приоритет: ВЫСОКИЙ)

**Текущая структура:**
```
js/
├── app.js        // Все смешано
├── storage.js    // Все смешано 
├── ui.js         // Все смешано
```

**AI-дружественная структура:**
```
src/
├── domains/
│   ├── innerfaces/
│   │   ├── InnerfaceEntity.ts
│   │   ├── InnerfaceRepository.ts
│   │   ├── InnerfaceService.ts
│   │   └── InnerfaceController.ts
│   ├── protocols/
│   │   ├── ProtocolEntity.ts
│   │   ├── ProtocolRepository.ts
│   │   ├── ProtocolService.ts
│   │   └── ProtocolController.ts
│   └── history/
│       ├── HistoryEntity.ts
│       ├── HistoryRepository.ts
│       └── HistoryService.ts
├── infrastructure/
│   ├── storage/
│   │   ├── LocalStorageAdapter.ts
│   │   ├── CloudStorageAdapter.ts
│   │   └── HybridStorage.ts
│   ├── api/
│   │   ├── ApiClient.ts
│   │   └── AuthService.ts
│   └── ui/
│       ├── ComponentRenderer.ts
│       └── EventManager.ts
└── shared/
    ├── types/
    ├── utils/
    └── constants/
```

### 2. **Repository Pattern**

```typescript
// Четкий интерфейс для AI агента
interface InnerfaceRepository {
  findById(id: InnerfaceId): Promise<Innerface | null>;
  findAll(): Promise<readonly Innerface[]>;
  save(innerface: Innerface): Promise<void>;
  delete(id: InnerfaceId): Promise<void>;
}

class HybridInnerfaceRepository implements InnerfaceRepository {
  constructor(
    private localAdapter: LocalStorageAdapter,
    private cloudAdapter: CloudStorageAdapter
  ) {}
  
  async findById(id: InnerfaceId): Promise<Innerface | null> {
    // Сначала локально, затем облако
    return await this.localAdapter.findInnerface(id) 
      ?? await this.cloudAdapter.findInnerface(id);
  }
}
```

### 3. **Command Pattern для Actions**

```typescript
interface Command<T = void> {
  readonly type: string;
  execute(): Promise<T>;
  undo(): Promise<void>;
}

class AddInnerfaceCommand implements Command<InnerfaceId> {
  constructor(
    private innerfaceData: Omit<Innerface, 'id' | 'createdAt' | 'updatedAt'>,
    private repository: InnerfaceRepository
  ) {}
  
  async execute(): Promise<InnerfaceId> {
    const innerface: Innerface = {
      ...this.innerfaceData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await this.repository.save(innerface);
    return innerface.id;
  }
  
  async undo(): Promise<void> {
    // Implement undo logic
  }
}
```

---

## 🔄 API и взаимодействие

### 1. **GraphQL API** (Приоритет: СРЕДНИЙ)

**Вместо REST эндпоинтов:**
```javascript
// Неопределенные REST endpoints
GET /api/user/data     // Что именно возвращает?
POST /api/user/data    // Какие поля принимает?
```

**AI-дружественный GraphQL:**
```graphql
type Query {
  user: User!
  innerfaces: [Innerface!]!
  protocols: [Protocol!]!
  history(limit: Int = 100, offset: Int = 0): [HistoryEntry!]!
}

type Mutation {
  addInnerface(input: AddInnerfaceInput!): AddInnerfacePayload!
  executeProtocol(protocolId: ID!, action: ActionType!): ExecuteProtocolPayload!
}

input AddInnerfaceInput {
  name: String!
  icon: String!
  hover: String!
  initialScore: Float!
}

type AddInnerfacePayload {
  innerface: Innerface!
  errors: [Error!]!
}
```

### 2. **Event-Driven Architecture**

```typescript
// Четкие события для AI агента
type DomainEvent = 
  | InnerfaceAddedEvent
  | ProtocolExecutedEvent
  | DataSyncedEvent;

interface InnerfaceAddedEvent {
  readonly type: 'INNERFACE_ADDED';
  readonly payload: {
    readonly innerfaceId: InnerfaceId;
    readonly innerface: Innerface;
    readonly timestamp: ISOString;
  };
}

class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  
  emit<T extends DomainEvent>(event: T): void {
    const handlers = this.handlers.get(event.type) ?? [];
    handlers.forEach(handler => handler(event));
  }
  
  on<T extends DomainEvent>(
    eventType: T['type'], 
    handler: (event: T) => void
  ): void {
    // Subscribe to events
  }
}
```

---

## 🧠 AI-дружественные паттерны

### 1. **Pure Functions везде**

**Избегать:**
```javascript
// Сайд-эффекты и мутации
function updateInnerface(innerfaceId) {
  const innerfaces = getInnerfaces(); // Глобальное состояние
  const innerface = innerfaces.find(s => s.id === innerfaceId);
  innerface.score += 1; // Мутация
  saveInnerfaces(innerfaces); // Сайд-эффект
}
```

**AI-дружественное решение:**
```typescript
// Чистые функции
function calculateNewScore(
  currentScore: number, 
  change: number
): number {
  return Math.max(0, Math.min(10, currentScore + change));
}

function updateInnerface(
  innerface: Innerface, 
  updates: Partial<Pick<Innerface, 'name' | 'icon' | 'hover'>>
): Innerface {
  return {
    ...innerface,
    ...updates,
    updatedAt: new Date().toISOString()
  };
}
```

### 2. **Immutable Data Structures**

```typescript
import { List, Record } from 'immutable';

const InnerfaceRecord = Record({
  id: '',
  name: '',
  icon: '',
  hover: '',
  initialScore: 0,
  order: 0,
  createdAt: '',
  updatedAt: ''
});

type InnerfaceState = List<InnerfaceRecord>;

// AI может легко предсказать результат
function addInnerfaceToState(
  state: InnerfaceState, 
  innerface: Innerface
): InnerfaceState {
  return state.push(new InnerfaceRecord(innerface));
}
```

### 3. **Functional State Management**

```typescript
// Redux-подобная архитектура
interface AppState {
  readonly innerfaces: readonly Innerface[];
  readonly protocols: readonly Protocol[];
  readonly history: readonly HistoryEntry[];
  readonly ui: UIState;
}

type Action = 
  | { type: 'INNERFACE_ADDED'; payload: Innerface }
  | { type: 'PROTOCOL_EXECUTED'; payload: { protocolId: ProtocolId; action: ActionType } };

function innerfacesReducer(
  state: readonly Innerface[] = [], 
  action: Action
): readonly Innerface[] {
  switch (action.type) {
    case 'INNERFACE_ADDED':
      return [...state, action.payload];
    default:
      return state;
  }
}
```

---

## 📝 Документация кода

### 1. **JSDoc с TypeScript annotations**

```typescript
/**
 * Executes a protocol and updates related innerfaces
 * 
 * @param protocolId - Unique identifier of the protocol to execute
 * @param action - Whether to apply positive ('+') or negative ('-') effect
 * @param timestamp - When the protocol was executed (defaults to now)
 * 
 * @returns Promise resolving to the history entry created
 * 
 * @throws {ProtocolNotFoundError} When protocol with given ID doesn't exist
 * @throws {InvalidActionError} When action is not '+' or '-'
 * 
 * @example
 * ```typescript
 * const entry = await executeProtocol('morning-routine', '+');
 * console.log(`Protocol executed at ${entry.timestamp}`);
 * ```
 */
async function executeProtocol(
  protocolId: ProtocolId,
  action: ActionType,
  timestamp: ISOString = new Date().toISOString()
): Promise<HistoryEntry> {
  // Implementation
}
```

### 2. **README-driven Development**

**Для каждого модуля создать README.md:**

```markdown
# Innerfaces Domain

## Overview
Manages user innerfaces - the core progression system of RPG Therapy.

## Entities
- `Innerface` - Individual innerface with progression tracking
- `InnerfaceCalculator` - Pure functions for score calculations

## Use Cases
- Add new innerface
- Update innerface progress
- Calculate current innerface level
- Reorder innerfaces

## API
See `InnerfaceService.ts` for public interface.

## Data Flow
```
User Action → InnerfaceController → InnerfaceService → InnerfaceRepository → Storage
```
```

---

## 🛠️ Инструменты разработки

### 1. **Linting и Formatting**

```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 2. **Build System**

```typescript
// vite.config.ts - для AI-дружественной сборки
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      output: {
        preserveModules: true, // Сохраняет структуру модулей
        exports: 'named'
      }
    }
  }
});
```

### 3. **Testing Strategy**

```typescript
// Predictable testing for AI agents
describe('InnerfaceService', () => {
  describe('addInnerface', () => {
    it('should create innerface with generated ID and timestamps', async () => {
      // Given
      const innerfaceData = {
        name: 'Test Innerface',
        icon: '🎯',
        hover: 'Test hover',
        initialScore: 5
      };
      
      // When
      const innerfaceId = await innerfaceService.addInnerface(innerfaceData);
      
      // Then
      const innerface = await innerfaceRepository.findById(innerfaceId);
      expect(innerface).toMatchObject({
        ...innerfaceData,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });
});
```

---

## 🚀 План поэтапного рефакторинга

### 📅 Phase 1: Foundation (2 недели)
1. ✅ Настроить TypeScript
2. ✅ Создать базовые типы и интерфейсы
3. ✅ Конвертировать storage.js → Storage.ts
4. ✅ Добавить линтинг и форматирование

### 📅 Phase 2: Domain Separation (3 недели)
1. 🔄 Выделить домены (Innerfaces, Protocols, History)
2. 🔄 Реализовать Repository pattern
3. 🔄 Создать Service layer
4. 🔄 Добавить Command pattern для операций

### 📅 Phase 3: API Enhancement (2 недели)
1. 🆕 Рассмотреть GraphQL вместо REST
2. 🆕 Реализовать Event-driven architecture
3. 🆕 Добавить real-time sync
4. 🆕 Улучшить error handling

### 📅 Phase 4: UI Refactoring (2 недели)
1. 🆕 Компонентная архитектура
2. 🆕 State management (Redux/Zustand)
3. 🆕 React/Vue конверсия (опционально)
4. 🆕 Component library

### 📅 Phase 5: Advanced Features (1 неделя)
1. 🆕 Undo/Redo system
2. 🆕 Offline-first architecture
3. 🆕 Progressive Web App
4. 🆕 Advanced analytics

---

## 🎯 Метрики успеха рефакторинга

### 🤖 **AI Agent Compatibility Score**
- ✅ **Type Coverage**: 100% TypeScript покрытие
- ✅ **Documentation**: JSDoc для всех публичных API
- ✅ **Predictability**: Отсутствие глобальных мутаций
- ✅ **Testability**: 90%+ test coverage
- ✅ **Modularity**: Single Responsibility принцип

### 📊 **Code Quality Metrics**
- **Cyclomatic Complexity**: < 10 для всех функций
- **Function Length**: < 20 строк
- **File Size**: < 200 строк
- **Dependencies**: Минимальные circular dependencies

### 🚀 **Performance Metrics**
- **Bundle Size**: < 500KB gzipped
- **Time to Interactive**: < 2 секунды
- **Memory Usage**: < 50MB heap
- **API Response**: < 200ms average

---

## 💡 Заключение

Рефакторинг RPG Therapy для максимальной AI-совместимости включает:

1. **🎯 Строгая типизация** - TypeScript везде
2. **📊 Предсказуемые структуры** - Domain-driven design
3. **🔄 Функциональный подход** - Pure functions, immutability
4. **📝 Исчерпывающая документация** - JSDoc, README, схемы
5. **🧪 Тестируемость** - Высокое покрытие тестами

Результат: AI агент сможет легко понимать, модифицировать и расширять кодовую базу, а разработчики получат более maintainable и scalable архитектуру.

---

*📝 Refactoring Tips обновлены: Июнь 2024*  
*🤖 Версия: 1.0*  
*🎯 AI-first architecture ready*