# 🚂 RPG Therapy Backend

Backend API сервер для приложения RPG Therapy.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Установить зависимости
npm install

# Запустить сервер в режиме разработки
npm run dev

# Запустить production сервер
npm start
```

## 🌐 API Endpoints

### Основные эндпоинты

- `GET /` - Информация о сервере
- `GET /api/test` - Проверка работоспособности API

### Пользовательские данные

- `GET /api/user/data` - Получить данные пользователя
- `POST /api/user/data` - Сохранить данные пользователя

### История действий

- `GET /api/user/history?limit=100&skip=0` - Получить историю действий
- `POST /api/user/history` - Добавить запись в историю
- `DELETE /api/user/history/:id` - Удалить запись из истории

## 🔧 Настройка переменных окружения

### Railway (Production)

Установите следующие переменные в Railway Dashboard:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=3000
```

### Локальная разработка

Создайте файл `.env`:

```
MONGODB_URI=mongodb://localhost:27017/rpg-therapy
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
PORT=3000
```

## 🔐 Аутентификация

Все API эндпоинты (кроме `/` и `/api/test`) требуют Firebase JWT токен в заголовке:

```
Authorization: Bearer <firebase_jwt_token>
```

## 📊 Структура данных

### Пользовательские данные

```json
{
  "protocols": [],
  "skills": [],
  "states": [],
  "history": [],
  "quickActions": [],
  "protocolOrder": [],
  "skillOrder": [],
  "stateOrder": [],
  "quickActionOrder": []
}
```

### Запись в истории

```json
{
  "id": "string",
  "timestamp": "ISO_DATE_STRING",
  "type": "checkin|skill_update|protocol_create|...",
  "description": "string",
  "data": {}
}
```

## 🛠️ Технологии

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - База данных NoSQL
- **Firebase Admin SDK** - Аутентификация
- **CORS** - Cross-origin resource sharing

## 🚂 Деплой на Railway

1. Подключите GitHub репозиторий к Railway
2. Установите переменные окружения
3. Railway автоматически развернет сервер

## 🔗 Ссылки

- **Production API**: https://rpg-therapy-backend-production.up.railway.app
- **Frontend**: https://muramets.github.io/GameMode
- **Documentation**: ../doc/DEPLOYMENT_ARCHITECTURE.md 