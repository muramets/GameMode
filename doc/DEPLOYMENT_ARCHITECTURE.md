# 🚀 Деплой и Архитектура RPG Therapy - Полное Руководство

*Версия: 1.0 | Дата: Июнь 2024*

---

## 📋 Содержание

1. [🎯 Что мы построили (простыми словами)](#что-мы-построили)
2. [🏗️ Архитектура системы](#архитектура-системы)  
3. [🔐 Безопасность и ключи](#безопасность-и-ключи)
4. [🌐 Сервисы и интеграции](#сервисы-и-интеграции)
5. [📦 Структура репозиториев](#структура-репозиториев)
6. [⚙️ Технические детали](#технические-детали)
7. [🔄 Процесс деплоя](#процесс-деплоя)
8. [📊 Сравнение с Monkeytype](#сравнение-с-monkeytype)
9. [🛠️ Troubleshooting](#troubleshooting)

---

## 🎯 Что мы построили (простыми словами) {#что-мы-построили}

### До деплоя:
- ✅ **Локальное приложение** - работало только на вашем компьютере
- ✅ **Данные в браузере** - все сохранялось локально
- ❌ **Нет синхронизации** - нельзя было использовать с разных устройств
- ❌ **Нет резервных копий** - данные могли потеряться

### После деплоя:
- 🌍 **Глобальный доступ** - работает с любого устройства в мире
- 👤 **Личные аккаунты** - каждый пользователь имеет свой профиль
- ☁️ **Облачная синхронизация** - данные автоматически сохраняются в облаке
- 🔒 **Безопасность** - доступ только авторизованным пользователям
- 📱 **Кроссплатформенность** - работает на телефонах, планшетах, компьютерах

### Простыми словами, как это работает:

1. **Вы заходите на сайт** → `https://muramets.github.io/GameMode`
2. **Входите через Google** → Firebase проверяет, что это действительно вы
3. **Ваши данные загружаются** → Сервер достает ваш личный профиль из облачной базы
4. **Вы работаете с приложением** → Все изменения автоматически сохраняются
5. **Заходите с другого устройства** → Видите те же данные

---

## 🏗️ Архитектура системы {#архитектура-системы}

### Схема системы:

```
[Пользователь] 
    ↓ вход через Google
[GitHub Pages] ← HTML/CSS/JS файлы
    ↓ API запросы
[Railway Backend] ← Node.js сервер
    ↓ проверка токенов
[Firebase Auth] ← аутентификация Google
    ↓ сохранение данных  
[MongoDB Atlas] ← облачная база данных
```

### Компоненты:

#### 🎭 **Frontend (Интерфейс)**
- **Где живет**: GitHub Pages
- **Адрес**: `https://muramets.github.io/GameMode`
- **Что делает**: Показывает интерфейс, обрабатывает нажатия кнопок
- **Технологии**: HTML, CSS, JavaScript

#### 🚀 **Backend (Сервер)**
- **Где живет**: Railway Cloud
- **Адрес**: `https://rpg-therapy-backend-production.up.railway.app`
- **Что делает**: Обрабатывает запросы, проверяет права доступа
- **Технологии**: Node.js, Express

#### 🔐 **Аутентификация**
- **Где живет**: Firebase (Google Cloud)
- **Что делает**: Проверяет личность пользователей через Google аккаунты
- **Проект**: `gamemode-ea510`

#### 💾 **База данных**
- **Где живет**: MongoDB Atlas (облако MongoDB)
- **Что делает**: Хранит все пользовательские данные
- **Кластер**: `Cluster0.cteroau.mongodb.net`

---

## 🔐 Безопасность и ключи {#безопасность-и-ключи}

### 🗂️ Где хранятся секретные ключи:

#### Локально (для разработки):
```
📁 /Users/muramets/Documents/#rpg-therapy-secrets/
├── 🔑 auth_MongoDB_connection string.env
└── 🔑 GameMode Firebase Admin SDK.json
```

#### В продакшене (Railway):
- **MongoDB URI** → переменная окружения `MONGODB_URI`
- **Firebase Config** → переменная окружения `FIREBASE_SERVICE_ACCOUNT`

### 🛡️ Уровни безопасности:

1. **Аутентификация Google** → Только владельцы Google аккаунтов
2. **Firebase токены** → Каждый запрос проверяется на подлинность
3. **CORS защита** → Сервер принимает запросы только с разрешенных доменов
4. **Environment variables** → Секретные ключи не видны в коде
5. **HTTPS везде** → Весь трафик зашифрован

### ⚠️ Критически важно:
- **НЕ ДОБАВЛЯТЬ** файлы из папки `#rpg-therapy-secrets/` в Git
- **НЕ ПУБЛИКОВАТЬ** содержимое .env файлов
- **НЕ ДЕЛИТЬСЯ** Firebase Admin SDK ключами

---

## 🌐 Сервисы и интеграции {#сервисы-и-интеграции}

### 1. 🐙 **GitHub Pages**
- **Назначение**: Хостинг фронтенда
- **Стоимость**: Бесплатно
- **Возможности**: Автодеплой при пуше в main ветку
- **URL**: `https://muramets.github.io/GameMode`

### 2. 🚂 **Railway**
- **Назначение**: Хостинг бэкенда
- **Стоимость**: $5/месяц (Starter план)
- **Возможности**: Автодеплой из Git, переменные окружения, логи
- **URL**: `https://rpg-therapy-backend-production.up.railway.app`

### 3. 🔥 **Firebase Authentication**
- **Назначение**: Аутентификация пользователей
- **Стоимость**: Бесплатно (Spark план)
- **Возможности**: Google OAuth, управление пользователями
- **Проект**: `gamemode-ea510`

### 4. 🍃 **MongoDB Atlas**
- **Назначение**: Облачная база данных
- **Стоимость**: Бесплатно (M0 кластер)
- **Возможности**: 512MB хранилища, автобэкапы
- **Кластер**: `Cluster0`

### Почему выбраны именно эти сервисы:

- **GitHub Pages**: Бесплатный, надежный, интегрирован с Git
- **Railway**: Простой деплой, хорошие цены, отличная документация  
- **Firebase**: Стандарт индустрии для auth, интеграция с Google
- **MongoDB Atlas**: Популярная NoSQL база, щедрый бесплатный план

---

## 📦 Структура репозиториев {#структура-репозиториев}

### Почему два репозитория?

Мы выбрали **архитектуру с разделенными репозиториями** по следующим причинам:

#### 🎯 **Основной репозиторий** - `muramets/GameMode`
```
📁 GameMode/
├── 📄 index.html           ← Главная страница
├── 📁 css/                 ← Стили
├── 📁 js/                  ← JavaScript логика
├── 📁 doc/                 ← Документация
└── 📄 README.md            ← Описание проекта
```

#### ⚙️ **Backend репозиторий** - `muramets/rpg-therapy-backend`
```
📁 rpg-therapy-backend/
├── 📄 server.js            ← Основной сервер
├── 📄 package.json         ← Зависимости Node.js
├── 📁 routes/              ← API маршруты (если добавятся)
└── 📄 README.md            ← Инструкции по backend
```

#### Преимущества разделения:

✅ **Независимый деплой** - можно обновлять фронт и бэк отдельно
✅ **Разные технологии** - статические файлы на GitHub, Node.js на Railway
✅ **Безопасность** - секретные ключи только в backend репозитории
✅ **Производительность** - фронтенд на CDN, бэкенд на сервере
✅ **Масштабируемость** - легко добавить больше backend сервисов

#### Недостатки:
❌ **Сложность** - нужно следить за двумя репозиториями
❌ **Синхронизация** - изменения API требуют обновления обеих частей

---

## ⚙️ Технические детали {#технические-детали}

### 🔄 Поток данных:

1. **Пользователь логинится**:
   ```javascript
   // Frontend: js/auth.js
   signInWithPopup(auth, googleProvider)
   → Firebase возвращает токен
   → Сохраняем токен в localStorage
   ```

2. **Запрос к API**:
   ```javascript
   // Frontend: js/api-client.js
   const token = await user.getIdToken();
   fetch(backend_url, {
     headers: { Authorization: `Bearer ${token}` }
   })
   ```

3. **Проверка на сервере**:
   ```javascript
   // Backend: server.js
   const decodedToken = await admin.auth().verifyIdToken(token);
   const userId = decodedToken.uid;
   ```

4. **Работа с базой**:
   ```javascript
   // Backend: MongoDB запросы
   const userData = await User.findOne({ firebaseUid: userId });
   ```

### 🌐 CORS настройки:

```javascript
app.use(cors({
  origin: [
    'http://localhost:8000',           // Локальная разработка
    'https://muramets.github.io',      // GitHub Pages base
    'https://muramets.github.io/GameMode' // Конкретный проект
  ],
  credentials: true
}));
```

### 📊 Схема базы данных:

```javascript
// Пользователь
{
  _id: ObjectId,
  firebaseUid: "строка из Firebase",
  email: "user@gmail.com",
  displayName: "Имя пользователя",
  userData: {
    // Весь JSON с данными пользователя
    skills: [...],
    protocols: [...],
    states: [...],
    checkins: [...]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 🔧 Environment Variables (Railway):

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://rpg-therapy-user:***@cluster0.cteroau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"gamemode-ea510",...}
```

---

## 🔄 Процесс деплоя {#процесс-деплоя}

### 📋 Что было сделано пошагово:

#### Phase 1: 🔥 Firebase Setup
1. Создали Firebase проект `gamemode-ea510`
2. Настроили Google Authentication
3. Получили конфигурацию для фронтенда
4. Создали Service Account для бэкенда

#### Phase 2: 💾 MongoDB Atlas Setup  
1. Создали бесплатный кластер M0
2. Настроили пользователя `rpg-therapy-user`
3. Получили connection string
4. Настроили IP whitelist (0.0.0.0/0 для продакшена)

#### Phase 3: ⚙️ Backend Development
1. Создали Node.js приложение с Express
2. Настроили MongoDB подключение через Mongoose
3. Добавили Firebase Admin SDK
4. Настроили CORS для фронтенда
5. Создали API endpoints для пользовательских данных

#### Phase 4: 🚂 Railway Deployment
1. Создали отдельный репозиторий для бэкенда
2. Подключили к Railway
3. Настроили environment variables
4. Запустили в продакшене

#### Phase 5: 🌐 Frontend Updates
1. Обновили API клиент на production URL
2. Интегрировали Firebase Auth
3. Добавили синхронизацию с бэкендом

#### Phase 6: 🐙 GitHub Pages Deploy
1. Закоммитили все изменения в main
2. Включили GitHub Pages
3. Проверили работу с production бэкендом

### 🎯 Команды для деплоя:

#### Frontend (GitHub Pages):
```bash
git add .
git commit -m "Deploy updates"
git push origin main
# GitHub Pages автоматически обновится
```

#### Backend (Railway):
```bash
cd rpg-therapy-backend/
git add .
git commit -m "Backend updates"  
git push origin main
# Railway автоматически пересоберет и задеплоит
```

---

## 📊 Сравнение с Monkeytype {#сравнение-с-monkeytype}

### 🐒 Monkeytype архитектура:

**Monkeytype** - популярный сервис для тренировки скорости печати.

#### Их подход:
- **Frontend**: Статические файлы на CDN/GitHub Pages
- **Backend**: Node.js API на отдельном сервере  
- **База данных**: MongoDB для пользовательских данных
- **Аутентификация**: Собственная система + социальные сети
- **Репозитории**: Один основной репозиторий с фронтом и бэком

#### Структура Monkeytype:
```
📁 monkeytype/
├── 📁 frontend/        ← React приложение
├── 📁 backend/         ← Node.js API
├── 📁 shared/          ← Общие типы/утилиты
└── 📁 docs/           ← Документация
```

### 🎮 RPG Therapy vs Monkeytype:

| Аспект | RPG Therapy | Monkeytype | Почему так выбрали |
|--------|-------------|------------|-------------------|
| **Репозитории** | 2 отдельных | 1 монорепо | Проще деплой разных частей |
| **Фронтенд** | Vanilla JS | React | Меньше сложности для MVP |
| **Хостинг фронта** | GitHub Pages | Cloudflare/Vercel | Бесплатно и просто |
| **Хостинг бэка** | Railway | Собственные серверы | Проще настройки |
| **Аутентификация** | Firebase Auth | Собственная + OAuth | Готовое решение от Google |
| **База данных** | MongoDB Atlas | MongoDB (самохостинг) | Managed сервис = меньше проблем |

### 🤔 Почему мы выбрали другой подход:

#### ✅ **Наши преимущества**:
- **Быстрый старт** - Firebase Auth из коробки
- **Низкие затраты** - все на бесплатных/дешевых планах
- **Простота** - меньше движущихся частей
- **Надежность** - используем проверенные сервисы

#### ❌ **Наши ограничения**:
- **Vendor lock-in** - зависимость от Firebase/Railway
- **Меньше контроля** - нельзя тонко настроить инфраструктуру
- **Масштабирование** - может потребовать переархитектуры

### 📈 Когда стоит мигрировать на Monkeytype-подобную архитектуру:

- 🎯 **1000+ активных пользователей** в день
- 💰 **Доходы позволяют** содержать DevOps инженера
- 🚀 **Нужны специфичные** оптимизации производительности
- 🔧 **Команда из 3+ разработчиков**

---

## 🛠️ Troubleshooting {#troubleshooting}

### 🚨 Частые проблемы и решения:

#### 1. 🔐 "User not authenticated" ошибка
**Проблема**: Пользователь не может войти
**Причины**:
- Firebase конфигурация неправильная
- Домен не добавлен в Authorized domains
- Токен истек

**Решение**:
```javascript
// Проверить в консоли браузера
console.log('Firebase user:', firebaseAuth.currentUser);
console.log('Token valid:', await firebaseAuth.currentUser?.getIdToken());
```

#### 2. 🌐 CORS ошибки
**Проблема**: `Access-Control-Allow-Origin` ошибка
**Причины**:
- Новый домен не добавлен в CORS
- Backend не обновлен

**Решение**:
1. Добавить домен в `server.js`:
```javascript
origin: [
  'https://your-new-domain.com'
]
```
2. Передеплоить бэкенд

#### 3. 💾 Данные не синхронизируются
**Проблема**: Изменения не сохраняются в облаке
**Причины**:
- Backend недоступен
- MongoDB соединение разорвано
- API endpoint изменился

**Решение**:
1. Проверить статус backend: `https://rpg-therapy-backend-production.up.railway.app/`
2. Проверить логи в Railway dashboard
3. Проверить MongoDB Atlas connectivity

#### 4. 🔄 GitHub Pages не обновляется
**Проблема**: Сайт показывает старую версию
**Причины**:
- GitHub Actions еще работает
- Кэш браузера
- GitHub Pages отключен

**Решение**:
1. Проверить Actions tab в GitHub
2. Очистить кэш: Ctrl+F5 (Windows) или Cmd+Shift+R (Mac)
3. Проверить Settings → Pages

### 📞 Как получить помощь:

1. **Логи Railway**: Dashboard → Deployments → View Logs
2. **Firebase консоль**: console.firebase.google.com
3. **MongoDB Atlas**: cloud.mongodb.com
4. **GitHub Actions**: Repository → Actions tab

### 🧰 Полезные команды для диагностики:

```bash
# Проверить статус бэкенда
curl https://rpg-therapy-backend-production.up.railway.app/

# Проверить API
curl https://rpg-therapy-backend-production.up.railway.app/api/test

# Локальный запуск для отладки
cd rpg-therapy-backend/
npm install
npm start
```

---

## 🎉 Заключение

Мы успешно развернули **полноценную облачную систему** с многопользовательским доступом:

- 🌍 **Глобальная доступность** через GitHub Pages
- 🔐 **Безопасная аутентификация** через Google
- ☁️ **Облачное хранение** в MongoDB Atlas
- 🚀 **Масштабируемый бэкенд** на Railway
- 💰 **Минимальные затраты** - почти все бесплатно

Система готова к использованию и может легко масштабироваться по мере роста пользовательской базы.

---

*📝 Документация создана: Июнь 2024*  
*✨ Автор: RPG Therapy Team*  
*🔄 Версия: 1.0* 