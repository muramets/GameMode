# 🎮 RPG Therapy v1.0

*Облачная система геймификации личного развития с RPG-механиками*

---

## 🌟 О проекте

**RPG Therapy** - это революционное веб-приложение, которое превращает процесс личного развития в увлекательную RPG-игру. Система использует облачную архитектуру для обеспечения доступности ваших данных с любого устройства в мире.

### 🎯 Ключевые особенности

- 🎮 **RPG-механики**: прогресс навыков, уровни, опыт как в играх
- 🖱️ **Drag & Drop**: интуитивное управление элементами
- 📋 **Протоколы**: структурированные планы действий для развития
- 🎭 **Состояния**: отслеживание ролей и жизненных аспектов
- 📊 **Статистика**: детальная аналитика прогресса
- ☁️ **Облачная синхронизация**: доступ с любого устройства
- 🔐 **Безопасность**: Google OAuth и защищенное хранение данных

## 🚀 Быстрый старт

### 🌐 Онлайн-версия (рекомендуется)

Просто откройте **[https://muramets.github.io/GameMode](https://muramets.github.io/GameMode)** в браузере:

1. Нажмите **"Sign in with Google"**
2. Разрешите доступ к аккаунту Google
3. Начните создавать свои навыки и протоколы!

### 💻 Локальная разработка

```bash
# Клонировать репозиторий
git clone https://github.com/muramets/GameMode.git
cd GameMode

# Запустить локальный сервер
python3 -m http.server 8000

# Открыть в браузере
open http://localhost:8000
```

## 🏗️ Архитектура v1.0

### ☁️ Облачная экосистема

```
🌐 Frontend: GitHub Pages
    ↓ HTTPS/OAuth
🔐 Authentication: Firebase Google OAuth
    ↓ JWT Tokens
🚂 Backend API: Railway (Node.js/Express)
    ↓ Encrypted Connection
💾 Database: MongoDB Atlas (Cloud)
```

### 🔧 Технический стек

#### Frontend
- **Хостинг**: GitHub Pages (`muramets.github.io/GameMode`)
- **Технологии**: Vanilla JavaScript, HTML5, CSS3
- **Архитектура**: Модульная система с разделением слоев
- **UI**: Responsive дизайн, темная тема, drag & drop

#### Backend
- **Платформа**: Railway (`rpg-therapy-backend-production.up.railway.app`)
- **API**: Node.js + Express.js
- **Аутентификация**: Firebase Admin SDK
- **CORS**: Настроен для GitHub Pages

#### База данных
- **Сервис**: MongoDB Atlas (Cloud)
- **Структура**: Документы пользователей с полными данными
- **Резервные копии**: Автоматические (Atlas)
- **Безопасность**: Шифрование, IP-фильтрация

#### Безопасность
- **Аутентификация**: Google OAuth через Firebase
- **Авторизация**: JWT токены с проверкой на бэкенде
- **Передача данных**: HTTPS везде
- **Доступ к данным**: Только собственные данные пользователя

## 📱 Основные функции

### 🏠 Dashboard
- **Quick Actions**: быстрый доступ к ключевым протоколам
- **User Stats**: общая статистика и прогресс
- **States Overview**: текущие жизненные состояния

### 🎯 Навыки (Innerfaces)
- Создание и управление личными навыками
- Система уровней и опыта (0-10 баллов)
- Визуальные прогресс-бары с цветовой индикацией
- История изменений каждого навыка
- Drag & drop для изменения приоритетов

### 📋 Протоколы (Protocols)
- Структурированные планы действий
- Связь с 1-3 целевыми навыками
- Check-in система для выполнения
- Добавление в Quick Actions
- Фильтрация и поиск

### 🎭 Состояния (States)
- Группировка навыков по жизненным аспектам
- Автоматический расчет уровня состояния
- Отслеживание ролей (например, "Профессионал", "Родитель")

### 📊 История и аналитика
- Полное логирование всех действий
- Возможность отмены операций
- Фильтрация по времени, типу, протоколам
- Детальная статистика прогресса

## 📚 Документация

### 🚀 Деплоймент и архитектура
- [**Архитектура деплоймента**](doc/DEPLOYMENT_ARCHITECTURE.md) - полная схема облачной инфраструктуры
- [**База данных**](doc/DATABASE_GUIDE.md) - структура данных и веб-интерфейсы управления

### 💻 Разработка
- [**Архитектура кода**](doc/ARCHITECTURE.md) - структура JavaScript модулей
- [**Рефакторинг для AI**](doc/REFACTORING_TIPS.md) - улучшения для работы с AI агентами
- [**CSS структура**](doc/CSS_STRUCTURE.md) - организация стилей

### 🎮 Функциональность
- [**Dashboard**](doc/DASHBOARD.md) - главная страница и Quick Actions
- [**Управление состояниями**](doc/STATES_MANAGEMENT.md) - система ролей и состояний
- [**Поиск и фильтрация**](doc/SEARCH_FUNCTIONALITY.md) - продвинутые фильтры
- [**Drag & Drop**](doc/DRAG_DROP.md) - система перетаскивания

### 🛠️ Справочная информация
- [**UI компоненты**](doc/UI_COMPONENTS.md) - элементы интерфейса
- [**Система хранения**](doc/STORAGE.md) - LocalStorage + Cloud sync
- [**Troubleshooting**](doc/TROUBLESHOOTING.md) - решение проблем

## 🔐 Безопасность и приватность

### 🛡️ Многоуровневая защита
1. **Google OAuth** - только владельцы Google аккаунтов
2. **JWT токены** - проверка на каждом API запросе
3. **HTTPS everywhere** - шифрование всех соединений
4. **Изоляция данных** - пользователи видят только свои данные
5. **IP фильтрация** - база доступна только с Railway серверов

### 🔒 Что хранится
- Ваши навыки и их текущие уровни
- Созданные вами протоколы
- История выполненных действий
- Настройки интерфейса

### ❌ Что НЕ хранится
- Пароли (используется Google OAuth)
- Личная информация кроме email и имени
- Данные других пользователей
- История браузера или поведения

## 🌍 Глобальная доступность

### 📱 Мульти-платформенность
- ✅ **Desktop**: Chrome, Firefox, Safari, Edge
- ✅ **Mobile**: iOS Safari, Android Chrome
- ✅ **Tablet**: iPad, Android планшеты
- ✅ **Везде**: любое устройство с интернетом

### 🌐 Международная поддержка
- 🌍 **CDN**: быстрая загрузка из любой точки мира
- 🔄 **Синхронизация**: данные доступны на всех устройствах
- 💾 **Оффлайн**: базовая работа без интернета (LocalStorage)

## 🚀 Производительность

### ⚡ Скорость работы
- **Загрузка приложения**: 200-500ms
- **Синхронизация данных**: 100-300ms
- **Отклик интерфейса**: < 50ms
- **Размер приложения**: ~500KB (оптимизировано)

### 📊 Масштабируемость
- **Пользователи**: до 20,000 на бесплатном плане MongoDB
- **Данные на пользователя**: ~25KB в среднем
- **История действий**: неограниченно (с автоочисткой)

## 🎮 RPG-механики

### 📈 Система прогресса
- **Навыки**: 0-10 баллов с визуальными индикаторами
- **Цветовая схема**: от красного (низкий) до зеленого (высокий)
- **Опыт**: накапливается за выполнение протоколов
- **Уровни**: автоматический расчет на основе опыта

### 🏆 Геймификация
- **Протоколы как квесты**: структурированные задания
- **States как классы**: роли и аспекты жизни
- **История как достижения**: отслеживание всех побед
- **Quick Actions как заклинания**: быстрые действия

## 📊 Мониторинг и аналитика

### 🔍 Веб-интерфейсы для администрирования
- **MongoDB Atlas**: просмотр и управление данными пользователей
- **Firebase Console**: управление аутентификацией
- **Railway Dashboard**: мониторинг API и логи сервера
- **GitHub Actions**: автоматический деплоймент

### 📈 Доступная статистика
- Общее количество пользователей
- Активность по дням/неделям
- Популярные протоколы и навыки
- Производительность API

## 🔄 История версий

### 🎉 v1.0 (Июнь 2024) - Облачный релиз
- ☁️ Полная миграция в облако
- 🔐 Мульти-пользовательская система
- 🌐 Глобальная доступность
- 📱 Оптимизация для мобильных устройств
- 📊 Продвинутая аналитика

### 📝 Предыдущие версии
- v0.9: Локальная версия с LocalStorage
- v0.8: Добавлена система состояний
- v0.7: Реализован drag & drop
- v0.6: Создана система протоколов

Полная история изменений: [CHANGELOG.md](doc/CHANGELOG.md)

## 🤝 Разработка и вклад

### 🛠️ Для разработчиков
- **Архитектура**: Модульная система с четким разделением слоев
- **Стиль кода**: ESLint + Prettier
- **Тестирование**: Unit тесты для core функций
- **Документация**: Подробные JSDoc комментарии

### 🤖 AI-совместимость
Проект специально структурирован для удобной работы с AI агентами:
- Четкие интерфейсы и типизация
- Самодокументирующийся код
- Минимальные зависимости между модулями
- Подробная документация

См. [REFACTORING_TIPS.md](doc/REFACTORING_TIPS.md) для деталей.

## 📞 Поддержка

### 🆘 Если что-то не работает
1. Проверьте [Troubleshooting Guide](doc/TROUBLESHOOTING.md)
2. Убедитесь, что включен JavaScript в браузере
3. Проверьте интернет-соединение для синхронизации
4. Попробуйте перелогиниться через Google

### 🐛 Сообщить об ошибке
- GitHub Issues: [github.com/muramets/GameMode/issues](https://github.com/muramets/GameMode/issues)
- Email: через профиль GitHub

## 🌟 Будущее проекта

### 🎯 Планируемые улучшения
- 📊 Расширенная аналитика и графики
- 🏆 Система достижений и бейджей
- 👥 Социальные функции (по желанию пользователей)
- 📱 PWA поддержка для установки как приложение
- 🌍 Мультиязычность

### 🚀 Техническое развитие
- TypeScript миграция для лучшей типизации
- GraphQL API для более эффективных запросов
- Real-time обновления через WebSockets
- Advanced caching для лучшей производительности

---

## 🎮 Начните свое приключение

**Превратите личное развитие в увлекательную игру!**

👉 **[Открыть RPG Therapy](https://muramets.github.io/GameMode)** 👈

*Войдите через Google и начните создавать свою RPG-версию жизни уже сегодня!*

---

*📝 README обновлен: Июнь 2024*  
*🚀 Версия: 1.0*  
*🌟 Сделано с ❤️ для личного развития* 