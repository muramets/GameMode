# 🔧 RPG Therapy v1.0 - Troubleshooting Guide

*Решение проблем облачной мульти-пользовательской системы*

---

## 📋 Содержание

1. [🔐 Аутентификация](#аутентификация)
2. [☁️ Синхронизация данных](#синхронизация-данных)
3. [📱 Проблемы интерфейса](#проблемы-интерфейса)
4. [🌐 Сетевые проблемы](#сетевые-проблемы)
5. [💾 Проблемы с данными](#проблемы-с-данными)
6. [📊 Производительность](#производительность)
7. [🔧 Инструменты диагностики](#инструменты-диагностики)
8. [📞 Получение помощи](#получение-помощи)

---

## 🔐 Аутентификация {#аутентификация}

### ❌ **Проблема**: Не могу войти через Google

#### 🧐 **Симптомы:**
- Кнопка "Sign in with Google" не реагирует
- Появляется ошибка "Popup blocked"
- Firebase ошибка при аутентификации

#### ✅ **Решения:**

**1. Проверьте блокировщики всплывающих окон**
```javascript
// Диагностика в консоли браузера
console.log('Popup blocked:', window.opener === null);
```
- **Действие**: Разрешите всплывающие окна для `muramets.github.io`
- **Chrome**: Настройки → Конфиденциальность → Всплывающие окна
- **Firefox**: Настройки → Приватность → Блокировка содержимого

**2. Очистите кэш и cookies**
- Нажмите `Ctrl+Shift+Del` (Windows) или `Cmd+Shift+Del` (Mac)
- Выберите "Cookies и другие данные сайтов"
- Укажите временной диапазон "Все время"

**3. Проверьте JavaScript**
```javascript
// В консоли браузера
console.log('Firebase initialized:', !!window.firebase);
console.log('Auth available:', !!window.firebase?.auth);
```
- **Действие**: Убедитесь, что JavaScript включен в браузере

**4. Используйте поддерживаемый браузер**
- ✅ **Рекомендуется**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- ❌ **Не поддерживается**: Internet Explorer, устаревшие браузеры

### ❌ **Проблема**: Токен истек, требуется перелогин

#### 🧐 **Симптомы:**
- Внезапное перенаправление на экран входа
- Ошибки API: "401 Unauthorized"
- Данные не синхронизируются

#### ✅ **Решения:**

**1. Автоматическое обновление токена**
```javascript
// Проверка в консоли
firebase.auth().currentUser?.getIdToken(true)
  .then(token => console.log('Token refreshed:', !!token))
  .catch(err => console.error('Token refresh failed:', err));
```

**2. Ручной перелогин**
- Нажмите "Sign out" в правом верхнем углу
- Войдите заново через Google OAuth
- Данные автоматически синхронизируются

---

## ☁️ Синхронизация данных {#синхронизация-данных}

### ❌ **Проблема**: Данные не синхронизируются между устройствами

#### 🧐 **Симптомы:**
- Изменения на одном устройстве не появляются на другом
- Показывается старая версия данных
- Индикатор "🔄 Syncing..." не исчезает

#### ✅ **Решения:**

**1. Проверьте интернет-соединение**
```javascript
// Диагностика в консоли
console.log('Online status:', navigator.onLine);
console.log('Last sync:', localStorage.getItem('lastSyncTime'));
```

**2. Принудительная синхронизация**
- Обновите страницу (`F5` или `Ctrl+R`)
- Данные должны загрузиться из облака при входе

**3. Проверьте статус API**
```javascript
// Тест API доступности
fetch('https://rpg-therapy-backend-production.up.railway.app/api/test')
  .then(response => response.json())
  .then(data => console.log('API Status:', data))
  .catch(err => console.error('API Error:', err));
```

**4. Конфликт данных**
- При конфликте приоритет у облачных данных
- Локальные изменения будут перезаписаны
- **Резервное копирование**: Экспортируйте данные перед синхронизацией

### ❌ **Проблема**: Потерялись локальные данные после входа

#### 🧐 **Симптомы:**
- Показываются только начальные данные
- Исчезли ранее созданные навыки/протоколы
- История действий пуста

#### ✅ **Решения:**

**1. Проверьте миграцию legacy данных**
```javascript
// В консоли браузера
const legacySkills = localStorage.getItem('skills');
const legacyProtocols = localStorage.getItem('protocols');
console.log('Legacy data exists:', {
  skills: !!legacySkills,
  protocols: !!legacyProtocols
});
```

**2. Ручная миграция данных**
- Выйдите из аккаунта
- Экспортируйте локальные данные (если есть опция)
- Войдите обратно - система попытается мигрировать данные

**3. Восстановление из резервной копии**
- Если у вас есть экспорт данных, используйте функцию импорта
- Обратитесь в поддержку с деталями проблемы

---

## 📱 Проблемы интерфейса {#проблемы-интерфейса}

### ❌ **Проблема**: Quick Actions не добавляются

#### 🧐 **Симптомы:**
- Нажатие кнопки "Add to Quick Actions" показывает успех
- Элемент не появляется в Quick Actions панели
- Toast сообщение показывается, но изменений нет

#### ✅ **Решения:**

**1. Проверьте лимиты**
- v1.0 не имеет лимитов на количество Quick Actions
- Убедитесь, что протокол существует

**2. Принудительное обновление UI**
```javascript
// В консоли браузера
UI.renderDashboard();
```

**3. Очистите кэш протоколов**
- Обновите страницу полностью (`Ctrl+F5`)
- Попробуйте добавить протокол снова

### ❌ **Проблема**: Drag & Drop не работает

#### 🧐 **Симптомы:**
- Элементы не перетаскиваются
- Нет визуального feedback при drag
- Порядок не сохраняется

#### ✅ **Решения:**

**1. Проверьте поддержку HTML5 Drag & Drop**
```javascript
// В консоли
console.log('Drag support:', 'draggable' in document.createElement('div'));
```

**2. Отключите блокировщики скриптов**
- Некоторые расширения блокируют drag & drop события
- Попробуйте в режиме инкогнито

**3. Проверьте сенсорные устройства**
- На мобильных устройствах используйте длительное нажатие
- На планшетах может потребоваться стилус

### ❌ **Проблема**: Таблицы отображаются некорректно

#### 🧐 **Симптомы:**
- Заголовки смещены относительно данных
- Столбцы перекрываются
- На мобильных устройствах таблица выходит за экран

#### ✅ **Решения:**

**1. Проверьте CSS Grid поддержку**
```javascript
// В консоли
console.log('CSS Grid support:', CSS.supports('display', 'grid'));
```

**2. Отключите CSS расширения**
- Некоторые расширения изменяют CSS
- Попробуйте в режиме инкогнито

**3. Обновите браузер**
- Убедитесь, что используете современную версию браузера
- CSS Grid требует относительно новые браузеры

---

## 🌐 Сетевые проблемы {#сетевые-проблемы}

### ❌ **Проблема**: CORS ошибки в консоли

#### 🧐 **Симптомы:**
- Ошибки вида "CORS policy blocked"
- API запросы не выполняются
- Network tab показывает статус 0

#### ✅ **Решения:**

**1. Проверьте домен**
- Приложение должно открываться через `muramets.github.io/GameMode`
- Не используйте прямые IP адреса или localhost в production

**2. Проверьте HTTPS**
- Убедитесь, что URL начинается с `https://`
- Mixed content (HTTP + HTTPS) блокируется браузерами

### ❌ **Проблема**: Медленная загрузка приложения

#### 🧐 **Симптомы:**
- Приложение долго загружается
- White screen в течение долгого времени
- Тайм-ауты при загрузке

#### ✅ **Решения:**

**1. Проверьте Network tab**
```javascript
// В консоли
performance.getEntriesByType('navigation')[0].loadEventEnd
```

**2. Очистите кэш браузера**
- Принудительное обновление: `Ctrl+Shift+R`
- Удалите кэш через Developer Tools

**3. Проверьте CDN**
- GitHub Pages может иметь задержки в некоторых регионах
- Попробуйте с другим интернет-соединением

---

## 💾 Проблемы с данными {#проблемы-с-данными}

### ❌ **Проблема**: Данные дублируются

#### 🧐 **Симптомы:**
- Одинаковые навыки/протоколы появляются несколько раз
- History показывает дублированные записи
- ID конфликты

#### ✅ **Решения:**

**1. Проверьте данные в консоли**
```javascript
// В консоли браузера
const skills = Storage.getSkills();
const duplicates = skills.filter((skill, index, array) => 
  array.findIndex(s => s.id === skill.id) !== index
);
console.log('Duplicated skills:', duplicates);
```

**2. Очистите локальные данные**
```javascript
// ВНИМАНИЕ: Это удалит все локальные данные
Object.keys(localStorage)
  .filter(key => key.includes('_'))
  .forEach(key => localStorage.removeItem(key));
```

**3. Пересинхронизация**
- Выйдите из аккаунта
- Очистите локальные данные
- Войдите снова - данные загрузятся из облака

### ❌ **Проблема**: Отрицательные значения навыков

#### 🧐 **Симптомы:**
- Прогресс-бары показывают отрицательные значения
- Некорректные цвета индикаторов
- Математические ошибки в расчетах

#### ✅ **Решения:**

**1. Проверьте расчеты**
```javascript
// В консоли
const skillId = 1; // замените на проблемный ID
const score = Storage.calculateCurrentScore(skillId);
console.log('Current score:', score);
```

**2. Исправьте данные**
```javascript
// Принудительно установить минимум 0
const skills = Storage.getSkills();
skills.forEach(skill => {
  const currentScore = Storage.calculateCurrentScore(skill.id);
  if (currentScore < 0) {
    console.log(`Fixing negative score for skill ${skill.id}:`, currentScore);
  }
});
```

---

## 📊 Производительность {#производительность}

### ❌ **Проблема**: Приложение работает медленно

#### 🧐 **Симптомы:**
- Долгий отклик при нажатии кнопок
- Зависания при scroll
- Высокое потребление памяти

#### ✅ **Решения:**

**1. Профилирование в Dev Tools**
- Откройте Developer Tools → Performance
- Запишите сессию работы с приложением
- Найдите узкие места

**2. Проверьте объем данных**
```javascript
// В консоли
const dataSize = Object.keys(localStorage)
  .filter(key => key.includes('_'))
  .reduce((total, key) => {
    return total + localStorage.getItem(key).length;
  }, 0);
console.log('Total data size:', (dataSize / 1024).toFixed(2), 'KB');
```

**3. Очистите историю**
- Если история очень большая, это может замедлять работу
- Рассмотрите возможность архивирования старых записей

### ❌ **Проблема**: Высокое потребление памяти

#### 🧐 **Симптомы:**
- Браузер предупреждает о нехватке памяти
- Другие вкладки закрываются
- Система работает медленно

#### ✅ **Решения:**

**1. Проверьте утечки памяти**
```javascript
// В консоли
console.log('EventListeners count:', 
  getEventListeners(document).length || 'Unknown'
);
```

**2. Обновите страницу**
- Простая перезагрузка часто решает проблему
- Используйте `Ctrl+F5` для полной перезагрузки

---

## 🔧 Инструменты диагностики {#инструменты-диагностики}

### 🛠️ **Консольные команды для диагностики**

**Проверка состояния системы:**
```javascript
// Скопируйте в консоль браузера
console.group('🔍 RPG Therapy System Diagnostics');
console.log('🌐 Online:', navigator.onLine);
console.log('🔐 User authenticated:', !!firebase.auth().currentUser);
console.log('📱 User Agent:', navigator.userAgent);
console.log('💾 LocalStorage available:', typeof Storage !== 'undefined');
console.log('🔄 Last sync:', localStorage.getItem('lastSyncTime'));
console.groupEnd();
```

**Проверка данных:**
```javascript
console.group('📊 Data Diagnostics');
const user = firebase.auth().currentUser;
if (user) {
  console.log('👤 User UID:', user.uid);
  console.log('📧 Email:', user.email);
  
  const userKey = (key) => `${user.uid}_${key}`;
  console.log('🎯 Skills:', !!localStorage.getItem(userKey('skills')));
  console.log('📋 Protocols:', !!localStorage.getItem(userKey('protocols')));
  console.log('📊 History:', !!localStorage.getItem(userKey('history')));
} else {
  console.log('❌ No authenticated user');
}
console.groupEnd();
```

**Проверка API:**
```javascript
async function testAPI() {
  console.group('🚂 API Diagnostics');
  try {
    const response = await fetch('https://rpg-therapy-backend-production.up.railway.app/api/test');
    const data = await response.json();
    console.log('✅ API Status:', response.status);
    console.log('📡 Response:', data);
  } catch (error) {
    console.error('❌ API Error:', error);
  }
  console.groupEnd();
}
testAPI();
```

### 📱 **Инспектор мобильных устройств**

**Для мобильной отладки:**
1. Подключите устройство к компьютеру
2. Включите USB отладку
3. Chrome → chrome://inspect → Remote targets
4. Найдите RPG Therapy и нажмите "Inspect"

### 🌐 **Сетевая диагностика**

**Проверка CORS и API:**
```javascript
async function networkDiagnostics() {
  console.group('🌐 Network Diagnostics');
  
  // Test CORS
  try {
    await fetch('https://rpg-therapy-backend-production.up.railway.app/api/test', {
      method: 'GET',
      mode: 'cors'
    });
    console.log('✅ CORS: Working');
  } catch (error) {
    console.error('❌ CORS: Failed', error);
  }
  
  // Test with auth
  const user = firebase.auth().currentUser;
  if (user) {
    try {
      const token = await user.getIdToken();
      const response = await fetch('https://rpg-therapy-backend-production.up.railway.app/api/user/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('✅ Authenticated API:', response.status);
    } catch (error) {
      console.error('❌ Authenticated API: Failed', error);
    }
  }
  
  console.groupEnd();
}
networkDiagnostics();
```

---

## 📞 Получение помощи {#получение-помощи}

### 🆘 **Когда обращаться в поддержку**

- ✅ После попытки всех решений из этого гайда
- ✅ При критических ошибках, блокирующих работу
- ✅ При потере важных данных
- ✅ При подозрении на проблемы безопасности

### 📧 **Как сообщить о проблеме**

**Включите в сообщение:**
1. **Описание проблемы** - что именно не работает
2. **Шаги для воспроизведения** - как получить ошибку
3. **Ожидаемое поведение** - что должно происходить
4. **Фактическое поведение** - что происходит на самом деле
5. **Скриншоты/видео** - визуальные доказательства
6. **Техническая информация**:
   ```javascript
   // Выполните в консоли и приложите результат
   console.log({
     userAgent: navigator.userAgent,
     url: window.location.href,
     timestamp: new Date().toISOString(),
     user: firebase.auth().currentUser?.uid || 'anonymous'
   });
   ```

### 🔗 **Контакты**

- **GitHub Issues**: [github.com/muramets/GameMode/issues](https://github.com/muramets/GameMode/issues)
- **Email**: Через профиль GitHub автора проекта

### 📚 **Дополнительные ресурсы**

- [Архитектура системы](ARCHITECTURE.md) - техническая документация
- [База данных](DATABASE_GUIDE.md) - структура данных и веб-интерфейсы
- [Система хранения](STORAGE.md) - как работает синхронизация
- [Changelog](CHANGELOG.md) - история изменений и известные проблемы

---

## 🔄 **Общие рекомендации по предотвращению проблем**

### ✅ **Лучшие практики:**

1. **Регулярно обновляйте браузер** - используйте последние версии
2. **Периодически очищайте кэш** - раз в неделю для стабильной работы
3. **Не блокируйте JavaScript** - приложение полностью зависит от JS
4. **Используйте стабильное интернет-соединение** - особенно при синхронизации
5. **Регулярно входите в аккаунт** - для обновления токенов аутентификации

### 🚨 **Чего избегать:**

1. **Не открывайте много вкладок** с приложением одновременно
2. **Не редактируйте localStorage** вручную - может привести к повреждению данных
3. **Не используйте VPN** без необходимости - может влиять на синхронизацию
4. **Не выключайте устройство** во время синхронизации данных

---

**🎯 Помните**: Большинство проблем решается простой перезагрузкой страницы или выходом/входом в аккаунт. Если проблема критическая, не стесняйтесь обращаться в поддержку!

---

## 🔧 **Known Issues & Potential Bugs** {#known-issues}

### ⚠️ **Проблема**: Существующие пользователи могут видеть чужие данные (Legacy Cloud Data)

#### 🧐 **Симптомы:**
- Новые пользователи видят чистый интерфейс ✅
- Существующие пользователи могут видеть дефолтные/чужие данные
- Данные появляются после входа в систему

#### 💡 **Причина:**
- **До фикса v1.0**: все пользователи загружали одни и те же INITIAL_DATA из облака
- **После фикса v1.0**: новые пользователи защищены, но старые данные остались в MongoDB
- В облачной базе могут быть "загрязненные" профили пользователей

#### 🔍 **Диагностика:**
```javascript
// В консоли браузера проверьте:
console.log('Current user:', window.Storage.currentUser?.email);
console.log('Protocols:', window.Storage.getProtocols().length);
console.log('Skills:', window.Storage.getSkills().length);

// Для проблемного пользователя:
// - protocols.length > 0 (хотя пользователь ничего не создавал)
// - skills.length > 0 (содержат дефолтные навыки)
```

#### ✅ **Решения:**

**1. Очистка профиля пользователя (Рекомендуется)**
- Выйти из аккаунта
- Очистить localStorage: `localStorage.clear()` в консоли
- Войти заново
- Данные должны быть пустыми

**2. Ручная очистка для администратора**
```javascript
// ТОЛЬКО для администратора - удаление проблемных данных
// В MongoDB Atlas удалить документы пользователей с "загрязненными" данными
// Пользователи получат чистые профили при следующем входе
```

**3. Временное решение для пользователя**
- Создать новый Google аккаунт
- Зарегистрироваться заново
- Получить чистый интерфейс

#### 🛡️ **Профилактика:**
- ✅ **Исправлено для новых пользователей** (commit 91a60c2)
- ✅ **Изоляция данных по пользователям** работает корректно
- ✅ **Только dev.muramets@gmail.com** загружает дефолтные данные

#### 📋 **Статус:**
- **Статус**: Known Issue для legacy пользователей
- **Приоритет**: Low (не влияет на новых пользователей)
- **Временное решение**: Очистка localStorage
- **Постоянное решение**: Cleaning legacy cloud data (планируется)

---

*📝 Последнее обновление: Июнь 2024*  
*🔧 Версия фикса: v1.0 (commit 91a60c2)*