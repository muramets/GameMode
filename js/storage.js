// ===== storage.js - Local Storage Management =====

class Storage {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingSync = new Set();
    this.lastSyncTime = null;
    this.currentUser = null;
    
    // 🔧 ИСПРАВЛЕНИЕ: Флаг блокировки синхронизации во время Clear All
    this.clearAllInProgress = false;
    
    // 🔧 НОВОЕ: Защита от множественных параллельных синхронизаций
    this.syncInProgress = false;
    
    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      // 🔧 КРИТИЧНО: Не запускаем синхронизацию во время Clear All
      if (!this.clearAllInProgress) {
      this.syncPendingChanges();
      } else {
        console.log('🚫 AUTO-SYNC BLOCKED: Clear All in progress, deferring online sync');
      }
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  // Set current user for data scoping
  setUser(user) {
    const wasUserChange = this.currentUser && user && this.currentUser.uid !== user.uid;
    this.currentUser = user;
    this.lastSyncTime = null; // Reset sync time when user changes
    
    // 🔧 НОВОЕ: Более надежное определение первого входа
    if (user) {
      const firstTimeKey = `first_login_${user.uid}`;
      
      // 🔧 ИСПРАВЛЕНИЕ: Проверяем флаг только один раз и сохраняем результат
      if (this.isFirstTimeLogin === undefined) {
        const isFirstTimeByFlag = !localStorage.getItem(firstTimeKey);
        
        // 🔧 КРИТИЧНО: Дополнительная проверка - есть ли у пользователя РЕАЛЬНЫЕ данные
        // Проверяем ключевые пользовательские данные (не default)
        const userDataKeys = [
          'history', 'protocolOrder', 'skillOrder', 'stateOrder', 'quickActionOrder'
        ];
        
        let hasRealUserData = false;
        userDataKeys.forEach(key => {
          const userKey = `${user.uid}_${key}`;
          const data = localStorage.getItem(userKey);
          if (data && data !== 'null' && data !== '[]') {
            try {
              const parsed = JSON.parse(data);
              if (Array.isArray(parsed) && parsed.length > 0) {
                hasRealUserData = true;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        });
        
        // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: В инкогнито ВСЕГДА нет данных, поэтому это ВСЕГДА первый вход
        // Добавляем проверку что localStorage действительно работает
        const isIncognitoMode = !hasRealUserData && isFirstTimeByFlag;
        
        // 🔧 ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Тестируем localStorage
        let localStorageWorks = false;
        try {
          const testKey = `test_${Date.now()}`;
          localStorage.setItem(testKey, 'test');
          localStorageWorks = localStorage.getItem(testKey) === 'test';
          localStorage.removeItem(testKey);
        } catch (e) {
          localStorageWorks = false;
        }
        
        // 🔧 ИСПРАВЛЕНИЕ: Пользователь считается новым если:
        // 1. Нет флага первого входа И
        // 2. Нет реальных пользовательских данных И 
        // 3. localStorage работает (чтобы исключить ошибки)
        const isReallyFirstTime = isFirstTimeByFlag && !hasRealUserData && localStorageWorks;
        
        // 🔧 УСИЛЕННОЕ ЛОГИРОВАНИЕ для отладки
        console.log('🔍 FIRST TIME DETECTION DETAILS:', {
          userEmail: user.email,
          isFirstTimeByFlag,
          hasRealUserData,
          localStorageWorks,
          isIncognitoMode,
          isReallyFirstTime,
          localStorageSize: Object.keys(localStorage).length,
          userKeys: userDataKeys.map(key => ({
            key,
            userKey: `${user.uid}_${key}`,
            hasData: !!localStorage.getItem(`${user.uid}_${key}`),
            dataSize: localStorage.getItem(`${user.uid}_${key}`)?.length || 0
          }))
        });
        
        if (isReallyFirstTime) {
          console.log('🆕 FIRST TIME LOGIN DETECTED for user:', user.email);
          console.log('🔄 Will use SERVER-FIRST strategy for all data');
          console.log('🔍 Detection details:', {
            flagExists: !isFirstTimeByFlag,
            hasUserData: hasRealUserData,
            localStorageWorks,
            decision: 'FIRST_TIME'
          });
          localStorage.setItem(firstTimeKey, Date.now().toString());
          this.isFirstTimeLogin = true;
        } else {
          console.log('🔄 RETURNING USER DETECTED for user:', user.email);
          console.log('🔄 Will use CLIENT-FIRST strategy for quick actions');
          console.log('🔍 Detection details:', {
            flagExists: !isFirstTimeByFlag,
            hasUserData: hasRealUserData,
            localStorageWorks,
            decision: 'RETURNING_USER'
          });
          this.isFirstTimeLogin = false;
        }
      } else {
        // Уже определили статус пользователя, не меняем его
        console.log('🔄 USER STATUS ALREADY DETERMINED:', this.isFirstTimeLogin ? 'FIRST_TIME' : 'RETURNING_USER');
      }
    }
    
    // Check for legacy data on first user set or user change
    if (wasUserChange || !this.hasBeenInitialized()) {
      this.checkAndMigrateLegacyData();
    }
  }
  
  // Check if user has been initialized (has any data)
  hasBeenInitialized() {
    return this.get(this.KEYS.PROTOCOLS) !== null || 
           this.get(this.KEYS.SKILLS) !== null || 
           this.get(this.KEYS.STATES) !== null;
  }
  
  // Check for legacy data and migrate if needed (one-time operation per user)
  checkAndMigrateLegacyData() {
    if (!this.currentUser) return;
    
    // Only migrate legacy data for the original user
    if (this.currentUser.email !== 'muramets007@gmail.com') {
      return;
    }
    
    // Check if this user has a legacy migration marker
    const legacyMigrationKey = `legacy_migrated_${this.currentUser.uid}`;
    const hasBeenMigrated = localStorage.getItem(legacyMigrationKey);
    
    if (hasBeenMigrated) return; // Already migrated
    
    // Check for legacy data (data without user prefix)
    const allLegacyKeys = [
      this.KEYS.PROTOCOLS, this.KEYS.SKILLS, this.KEYS.STATES, this.KEYS.HISTORY,
      this.KEYS.QUICK_ACTIONS, this.KEYS.QUICK_ACTION_ORDER, 
      this.KEYS.PROTOCOL_ORDER, this.KEYS.SKILL_ORDER, this.KEYS.STATE_ORDER,
      this.KEYS.SKILL_MIGRATION
    ];
    let foundLegacyData = false;
    
    allLegacyKeys.forEach(key => {
      const legacyData = localStorage.getItem(key); // without user prefix
      const currentData = this.get(key); // with user prefix
      
      // Check if we should migrate
      let shouldMigrate = false;
      
      if (legacyData && !currentData) {
        shouldMigrate = true;
      } else if (legacyData && currentData) {
        // Check if current data is just default/empty
        try {
          const parsedLegacy = JSON.parse(legacyData);
          const parsedCurrent = currentData;
          
          if (Array.isArray(parsedLegacy) && Array.isArray(parsedCurrent)) {
            // For main data arrays, check if current is empty or matches INITIAL_DATA
            if (parsedCurrent.length === 0 && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.PROTOCOLS && this.isDefaultProtocols(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.SKILLS && this.isDefaultSkills(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            } else if (key === this.KEYS.STATES && this.isDefaultStates(parsedCurrent) && parsedLegacy.length > 0) {
              shouldMigrate = true;
            }
          }
        } catch (e) {
          console.warn(`Error comparing data for ${key}:`, e);
        }
      }
      
      if (shouldMigrate) {
        try {
          const parsedData = JSON.parse(legacyData);
          
          // For arrays, check if they have content
          if (Array.isArray(parsedData)) {
            if (parsedData.length > 0) {
              console.log(`Migrating legacy ${key} data for user ${this.currentUser.uid}`);
              this.set(key, parsedData);
              foundLegacyData = true;
            }
          } else if (parsedData !== null && parsedData !== undefined) {
            // For non-arrays (booleans, etc.)
            console.log(`Migrating legacy ${key} data for user ${this.currentUser.uid}`);
            this.set(key, parsedData);
            foundLegacyData = true;
          }
        } catch (e) {
          console.warn(`Failed to migrate legacy ${key}:`, e);
        }
      }
    });
    
    // Mark as migrated to prevent future attempts
    localStorage.setItem(legacyMigrationKey, 'true');
    
    if (foundLegacyData) {
      console.log(`Legacy data migration completed for user ${this.currentUser.uid}`);
    }
  }
  
  // Get user-specific key
  getUserKey(key) {
    if (!this.currentUser) {
      console.warn('🚨 CRITICAL: getUserKey called without authenticated user for key:', key);
      console.trace('📍 Stack trace for getUserKey without user:');
      // Don't fallback to non-user key to prevent data leakage
      throw new Error(`Cannot access user data before authentication: ${key}`);
    }
    const userKey = `${this.currentUser.uid}_${key}`;
    // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные
    // console.log('🔑 STORAGE KEY:', {
    //   originalKey: key,
    //   userKey,
    //   userId: this.currentUser.uid,
    //   userEmail: this.currentUser.email
    // });
    return userKey;
  }

  // Keys
  KEYS = {
    PROTOCOLS: 'protocols',
    SKILLS: 'skills',
    STATES: 'states',
    HISTORY: 'history',
    QUICK_ACTIONS: 'quickActions',
    QUICK_ACTION_ORDER: 'quickActionOrder',
    PROTOCOL_ORDER: 'protocolOrder',
    SKILL_ORDER: 'skillOrder',
    STATE_ORDER: 'stateOrder',
    SKILL_MIGRATION: 'skillMigration'
  };

  // Initialize app data
  init() {
    console.log('🔧 STORAGE INIT:', {
      user: this.currentUser?.email,
      userId: this.currentUser?.uid
    });
    
    if (this.currentUser) {
      this.checkAndMigrateLegacyData();
    }
    
    // 🧹 НОВОЕ: Очистка undefined значений при запуске
    this.cleanupDeletedArrays();
    
    // 🔧 НОВОЕ: Проверяем Quick Actions при инициализации
    if (this.currentUser) {
      const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
      const quickActionOrder = this.get(this.KEYS.QUICK_ACTION_ORDER) || [];
      console.log('🚀 INIT QUICK ACTIONS CHECK:', {
        quickActionsCount: quickActions.length,
        quickActionOrderCount: quickActionOrder.length,
        quickActionsData: quickActions,
        quickActionOrderData: quickActionOrder
      });
    }
    
    // Initialize each key separately if it doesn't exist
    if (!this.get(this.KEYS.PROTOCOLS)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.PROTOCOLS, isDevUser ? INITIAL_DATA.protocols : []);
    } else {
      // Check if existing data is just empty
      const existingProtocols = this.get(this.KEYS.PROTOCOLS);
      if (Array.isArray(existingProtocols) && existingProtocols.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.PROTOCOLS, INITIAL_DATA.protocols);
        }
        // Other users keep empty arrays - sync will load their server data
      }
      // If user has custom data (length > 0), keep it as is
    }
    
    if (!this.get(this.KEYS.SKILLS)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.SKILLS, isDevUser ? INITIAL_DATA.skills : []);
    } else {
      const existingSkills = this.get(this.KEYS.SKILLS);
      if (Array.isArray(existingSkills) && existingSkills.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.SKILLS, INITIAL_DATA.skills);
        }
        // Other users keep empty arrays - sync will load their server data
      }
    }
    
    if (!this.get(this.KEYS.STATES)) {
      // Only load default data for the original developer, others start with empty arrays
      const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
      this.set(this.KEYS.STATES, isDevUser ? INITIAL_DATA.states : []);
    } else {
      const existingStates = this.get(this.KEYS.STATES);
      if (Array.isArray(existingStates) && existingStates.length === 0) {
        // For dev user only, load defaults if they have empty data
        const isDevUser = this.currentUser && this.currentUser.email === 'muramets007@gmail.com';
        if (isDevUser) {
          this.set(this.KEYS.STATES, INITIAL_DATA.states);
        }
        // Other users keep empty arrays - sync will load their server data
      }
    }
    
    if (!this.get(this.KEYS.HISTORY)) {
      this.set(this.KEYS.HISTORY, []);
    }
    
    if (!this.get(this.KEYS.QUICK_ACTIONS)) {
      // 🔧 ИСПРАВЛЕНИЕ: Не создаем default Quick Actions для новых пользователей
      // Пусть сначала загрузятся данные с сервера
      if (this.isFirstTimeLogin === true) {
        console.log('🆕 First time user: Skipping default Quick Actions creation, will load from server');
        this.set(this.KEYS.QUICK_ACTIONS, []);
        this.set(this.KEYS.QUICK_ACTION_ORDER, []);
      } else {
      // Set default quick actions only if user has existing protocols
      const existingProtocols = this.get(this.KEYS.PROTOCOLS);
      if (existingProtocols && existingProtocols.length > 0) {
        // Use first 5 available protocol IDs as defaults
        const defaultQuickActions = existingProtocols.slice(0, 5).map(p => p.id);
          console.log('🔄 Returning user: Creating default Quick Actions:', defaultQuickActions);
        this.set(this.KEYS.QUICK_ACTIONS, defaultQuickActions);
        this.set(this.KEYS.QUICK_ACTION_ORDER, defaultQuickActions);
      } else {
        // For users without protocols, set empty quick actions
        this.set(this.KEYS.QUICK_ACTIONS, []);
        this.set(this.KEYS.QUICK_ACTION_ORDER, []);
        }
      }
    }
    
    // Initialize quick action order if missing
    if (!this.get(this.KEYS.QUICK_ACTION_ORDER)) {
      const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
      this.set(this.KEYS.QUICK_ACTION_ORDER, quickActions);
    }
    
    // Initialize other order keys if missing
    if (!this.get(this.KEYS.PROTOCOL_ORDER)) {
      this.set(this.KEYS.PROTOCOL_ORDER, []);
    }
    
    if (!this.get(this.KEYS.SKILL_ORDER)) {
      this.set(this.KEYS.SKILL_ORDER, []);
    }
    
    if (!this.get(this.KEYS.STATE_ORDER)) {
      this.set(this.KEYS.STATE_ORDER, []);
    }
    
    if (!this.get(this.KEYS.SKILL_MIGRATION)) {
      this.set(this.KEYS.SKILL_MIGRATION, false);
    }
  }

  // Get data from localStorage
  get(key) {
    try {
      const userKey = this.getUserKey(key);
      const data = localStorage.getItem(userKey);
      const parsed = data ? JSON.parse(data) : null;
      // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные
      // console.log('📥 STORAGE GET:', {
      //   key,
      //   userKey,
      //   hasData: !!data,
      //   dataLength: Array.isArray(parsed) ? parsed.length : typeof parsed,
      //   userId: this.currentUser?.uid,
      //   userEmail: this.currentUser?.email
      // });
      return parsed;
    } catch (e) {
      console.error('❌ Error reading from localStorage:', {
        key,
        error: e.message,
        userId: this.currentUser?.uid
      });
      return null;
    }
  }

  // Set data to localStorage
  set(key, value) {
    try {
      const userKey = this.getUserKey(key);
      localStorage.setItem(userKey, JSON.stringify(value));
      // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные
      // console.log('📤 STORAGE SET:', {
      //   key,
      //   userKey,
      //   valueType: typeof value,
      //   valueLength: Array.isArray(value) ? value.length : typeof value,
      //   userId: this.currentUser?.uid,
      //   userEmail: this.currentUser?.email
      // });
      return true;
    } catch (e) {
      console.error('❌ Error writing to localStorage:', {
        key,
        error: e.message,
        userId: this.currentUser?.uid
      });
      return false;
    }
  }

  // Get all protocols
  getProtocols() {
    try {
      const protocols = this.get(this.KEYS.PROTOCOLS);
      return Array.isArray(protocols) ? protocols : [];
    } catch (error) {
      console.warn('Error getting protocols:', error);
      return [];
    }
  }

  // Get all skills
  getSkills() {
    try {
      const skills = this.get(this.KEYS.SKILLS);
      return Array.isArray(skills) ? skills : [];
    } catch (error) {
      console.warn('Error getting skills:', error);
      return [];
    }
  }

  // Get skill by ID
  getSkillById(id) {
    try {
      const skills = this.getSkills();
      // Find skill by exact ID match, considering both string and number IDs
      const skill = skills.find(s => s.id === id || s.id == id);
      return skill;
    } catch (error) {
      console.warn('Error getting skill by ID:', error);
      return null;
    }
  }

  // Update skill
  updateSkill(id, updates) {
    const skills = this.getSkills();
    const index = skills.findIndex(s => s.id === id);
    if (index !== -1) {
      skills[index] = { ...skills[index], ...updates };
      this.set(this.KEYS.SKILLS, skills);
      return true;
    }
    return false;
  }

  // Get all states
  getStates() {
    try {
      const states = this.get(this.KEYS.STATES);
      return Array.isArray(states) ? states : [];
    } catch (error) {
      console.warn('Error getting states:', error);
      return [];
    }
  }

  // Get all checkins
  getCheckins() {
    try {
      const checkins = this.get(this.KEYS.HISTORY);
      const checkinsArray = Array.isArray(checkins) ? checkins : [];
      
      // 🔧 ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Фильтруем удаленные чекины 
      // Это предотвращает показ чекинов, которые были удалены но восстановлены синхронизацией
      const deletedCheckins = this.get('deletedCheckins') || [];
      const deletedIds = new Set();
      
      // Создаем множество ID удаленных чекинов для быстрого поиска
      deletedCheckins.forEach(item => {
        const id = typeof item === 'object' ? item.id : item;
        if (id !== undefined && id !== null) {
          deletedIds.add(id.toString()); // Приводим к строке для универсального сравнения
        }
      });
      
      // Фильтруем удаленные чекины
      const filteredCheckins = checkinsArray.filter(checkin => {
        const checkinId = checkin.id?.toString();
        const isDeleted = deletedIds.has(checkinId);
        
        if (isDeleted) {
          console.log('🚫 FILTERING OUT DELETED CHECKIN:', {
            checkinId: checkin.id,
            timestamp: checkin.timestamp,
            type: checkin.type
          });
        }
        
        return !isDeleted;
      });
      
      // 🔧 CONSISTENT SORTING: Always return newest-first (by timestamp descending)
      return filteredCheckins.sort((a, b) => {
        const timestampA = new Date(a.timestamp).getTime();
        const timestampB = new Date(b.timestamp).getTime();
        return timestampB - timestampA; // Newest first (descending order)
      });
    } catch (error) {
      console.warn('Error getting checkins:', error);
      return [];
    }
  }

  // Add checkin
  addCheckin(protocolId, action = '+') {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === protocolId);
    if (!protocol) return false;

    const checkinId = Date.now();
    
    // 🔧 ДЕДУПЛИКАЦИЯ: Проверяем есть ли уже недавний чекин для этого протокола
    const existingCheckins = this.getCheckins();
    const recentThreshold = 1000; // 1 секунда
    const recentCheckin = existingCheckins.find(c => 
      c.type === 'protocol' && 
      c.protocolId === protocolId && 
      c.action === action &&
      (checkinId - c.id) < recentThreshold
    );
    
    if (recentCheckin) {
      console.log('🚫 DUPLICATE CHECKIN BLOCKED:', {
        protocolId,
        action,
        recentCheckinId: recentCheckin.id,
        timeDiff: checkinId - recentCheckin.id
      });
      return recentCheckin; // Возвращаем существующий чекин
    }

    const checkin = {
      id: checkinId,
      type: 'protocol',
      protocolId: protocolId,
      protocolName: protocol.name,
      protocolIcon: protocol.icon,
      timestamp: new Date().toISOString(),
      action: action, // Save the original action ('+' or '-')
      changes: {}
    };

    // Calculate skill changes only if protocol has targets
    if (protocol.targets && protocol.targets.length > 0) {
      const changeValue = action === '+' ? protocol.weight : -protocol.weight;
      
      protocol.targets.forEach(skillId => {
        checkin.changes[skillId] = changeValue;
      });
    }

    // Save checkin
    const checkins = this.getCheckins();
    checkins.push(checkin);
    this.set(this.KEYS.HISTORY, checkins);

    return checkin;
  }

  // Recalculate protocol history when targets change
  recalculateProtocolHistory(protocolId, oldTargets, newTargets) {
    console.log('🔄 RECALCULATING PROTOCOL HISTORY:', {
      protocolId,
      oldTargets: oldTargets || [],
      newTargets: newTargets || [],
      timestamp: new Date().toISOString()
    });
    
    // 🔧 КРИТИЧНО: Блокируем пересчет протоколов во время Clear All
    // Это предотвращает бесконечные циклы синхронизации после Clear All
    if (this.clearAllInProgress) {
      console.log('🚫 PROTOCOL RECALCULATION BLOCKED: Clear All operation in progress');
      console.log('🚫 Preventing protocol recalculation during Clear All to avoid sync loops');
      return false;
    }
    
    // 🔧 УМНАЯ ПРОВЕРКА: Блокируем только если это РЕАЛЬНО последствие Clear All
    // НЕ блокируем легитимные обновления протоколов
    const deletedCheckins = this.get('deletedCheckins') || [];
    const currentHistory = this.getCheckins();
    
    // Проверяем на РЕАЛЬНЫЙ Clear All: пустая история И недавние флаги удаления
    const hasEmptyHistory = currentHistory.length === 0;
    const hasRecentClearAll = this.lastSyncTime && (Date.now() - new Date(this.lastSyncTime).getTime()) < (5 * 60 * 1000); // 5 минут
    
    const isRealClearAllAftermath = hasEmptyHistory && deletedCheckins.length > 0 && hasRecentClearAll;
    
    if (isRealClearAllAftermath) {
      console.log('🚫 PROTOCOL RECALCULATION BLOCKED: Real Clear All aftermath detected', {
        protocolId,
        historyLength: currentHistory.length,
        deletedFlagsCount: deletedCheckins.length,
        lastSyncTime: this.lastSyncTime,
        reason: 'Empty history + recent deletion flags'
      });
      console.log('🚫 Preventing protocol recalculation after Clear All to avoid sync loops');
      return false;
    }
    
    // ✅ НЕ блокируем если есть история (легитимное обновление протокола)
    if (currentHistory.length > 0) {
      console.log('✅ PROTOCOL RECALCULATION ALLOWED: History exists, this is a legitimate protocol update', {
        protocolId,
        historyLength: currentHistory.length,
        deletedFlagsCount: deletedCheckins.length
      });
    }
    
    const checkins = this.getCheckins();
    const protocol = this.getProtocolById(protocolId);
    if (!protocol) {
      console.warn('❌ Protocol not found for recalculation:', protocolId);
      return false;
    }

    let hasChanges = false;
    let affectedCheckins = 0;

    checkins.forEach(checkin => {
      if (checkin.type === 'protocol' && checkin.protocolId === protocolId) {
        // Use the saved action if available, otherwise try to determine from changes
        let originalAction = '+'; // default
        
        if (checkin.action) {
          // Use the explicitly saved action (new format)
          originalAction = checkin.action;
        } else if (checkin.changes && Object.keys(checkin.changes).length > 0) {
          // Fallback: try to determine action from existing changes (legacy format)
          const firstChange = Object.values(checkin.changes)[0];
          originalAction = firstChange >= 0 ? '+' : '-';
        }
        
        // Get the current weight for this protocol
        const changeValue = originalAction === '+' ? protocol.weight : -protocol.weight;
        
        let checkinChanged = false;
        
        // Remove old target effects
        if (oldTargets && oldTargets.length > 0) {
          oldTargets.forEach(skillId => {
            if (checkin.changes[skillId] !== undefined) {
              console.log(`📋 Removing old target effect for skill ${skillId} from checkin ${checkin.id}`);
              delete checkin.changes[skillId];
              hasChanges = true;
              checkinChanged = true;
            }
          });
        }

        // Add new target effects with the current protocol weight
        if (newTargets && newTargets.length > 0) {
          newTargets.forEach(skillId => {
            console.log(`📋 Adding new target effect for skill ${skillId} to checkin ${checkin.id}: ${changeValue}`);
            checkin.changes[skillId] = changeValue;
            hasChanges = true;
            checkinChanged = true;
          });
        }
        
        if (checkinChanged) {
          affectedCheckins++;
        }
      }
    });

    if (hasChanges) {
      this.set(this.KEYS.HISTORY, checkins);
      console.log(`✅ RECALCULATION COMPLETE: Updated ${affectedCheckins} checkins for protocol ${protocolId}`);
      
      // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ПЕРЕСЧЕТА ИСТОРИИ
      // 🔧 НО ТОЛЬКО ЕСЛИ НЕ ВЫПОЛНЯЕТСЯ Clear All
      if (!this.clearAllInProgress && !isRealClearAllAftermath) {
        // 🔧 НОВОЕ: Проверяем не идет ли уже синхронизация
        if (!this.syncInProgress) {
          console.log('🚀 SCHEDULING BACKGROUND SYNC: Protocol history recalculation completed');
          // Небольшая задержка чтобы избежать конфликтов с другими синхронизациями
          setTimeout(() => {
            if (!this.syncInProgress) { // Двойная проверка
              this.syncWithBackend().catch(error => {
                console.warn('⚠️ Background sync after recalculation failed:', error);
              });
            }
          }, 500);
        } else {
          console.log('🚫 BACKGROUND SYNC SKIPPED: Another sync already in progress');
        }
      } else {
        console.log('🚫 SYNC BLOCKED: Clear All protection preventing sync after protocol recalculation');
      }
    } else {
      console.log(`ℹ️ RECALCULATION SKIPPED: No changes needed for protocol ${protocolId}`);
    }

    return hasChanges;
  }

  // Add drag & drop operation to history
  addDragDropOperation(type, itemId, itemName, itemIcon, oldOrder, newOrder) {
    const oldPosition = oldOrder.indexOf(itemId) + 1;
    const newPosition = newOrder.indexOf(itemId) + 1;
    
    const operationId = Date.now();
    
    // 🔧 ДЕДУПЛИКАЦИЯ: Проверяем есть ли уже недавняя drag & drop операция
    const existingOperations = this.getCheckins();
    const recentThreshold = 2000; // 2 секунды для drag & drop
    const recentOperation = existingOperations.find(op => 
      op.type === 'drag_drop' && 
      op.subType === type &&
      op.itemId === itemId &&
      (operationId - op.id) < recentThreshold
    );
    
    if (recentOperation) {
      console.log('🚫 DUPLICATE DRAG DROP BLOCKED:', {
        type,
        itemId,
        recentOperationId: recentOperation.id,
        timeDiff: operationId - recentOperation.id
      });
      return recentOperation; // Возвращаем существующую операцию
    }
    
    const operation = {
      id: operationId,
      type: 'drag_drop',
      subType: type, // 'protocol' or 'skill'
      itemId: itemId,
      itemName: itemName,
      itemIcon: itemIcon,
      timestamp: new Date().toISOString(),
      oldPosition: oldPosition,
      newPosition: newPosition,
      oldOrder: oldOrder,
      newOrder: newOrder,
      changes: {}
    };

    const checkins = this.getCheckins();
    checkins.push(operation);
    this.set(this.KEYS.HISTORY, checkins);

    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ DRAG & DROP
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after drag & drop failed:', error);
    });

    return operation;
  }

  // Delete checkin
  deleteCheckin(checkinId) {
    const checkins = this.getCheckins();
    const checkin = checkins.find(c => c.id === checkinId);
    
    // If it's a drag & drop operation, revert the specific change
    if (checkin && checkin.type === 'drag_drop') {
      if (checkin.subType === 'protocol') {
        const currentOrder = [...this.getProtocolOrder()];
        
        // Find where the item is now
        const currentIndex = currentOrder.indexOf(checkin.itemId);
        if (currentIndex !== -1) {
          // Remove the item from current position
          currentOrder.splice(currentIndex, 1);
          
          // Calculate where to put it back
          // We need to find the correct position considering other items may have moved
          let targetPosition = checkin.oldPosition - 1; // Convert to 0-based index
          
          // Count how many items that were originally before the target position are still there
          let actualPosition = 0;
          for (let i = 0; i < checkin.oldOrder.length && actualPosition < targetPosition; i++) {
            const originalItemId = checkin.oldOrder[i];
            if (originalItemId !== checkin.itemId && currentOrder.includes(originalItemId)) {
              const currentPos = currentOrder.indexOf(originalItemId);
              if (currentPos >= actualPosition) {
                actualPosition++;
              }
            }
          }
          
          // Insert at the calculated position
          currentOrder.splice(Math.min(actualPosition, currentOrder.length), 0, checkin.itemId);
          this.setProtocolOrder(currentOrder);
        }
      } else if (checkin.subType === 'skill') {
        const currentOrder = [...this.getSkillOrder()];
        
        // Find where the item is now
        const currentIndex = currentOrder.indexOf(checkin.itemId);
        if (currentIndex !== -1) {
          // Remove the item from current position
          currentOrder.splice(currentIndex, 1);
          
          // Calculate where to put it back
          let targetPosition = checkin.oldPosition - 1; // Convert to 0-based index
          
          // Count how many items that were originally before the target position are still there
          let actualPosition = 0;
          for (let i = 0; i < checkin.oldOrder.length && actualPosition < targetPosition; i++) {
            const originalItemId = checkin.oldOrder[i];
            if (originalItemId !== checkin.itemId && currentOrder.includes(originalItemId)) {
              const currentPos = currentOrder.indexOf(originalItemId);
              if (currentPos >= actualPosition) {
                actualPosition++;
              }
            }
          }
          
          // Insert at the calculated position
          currentOrder.splice(Math.min(actualPosition, currentOrder.length), 0, checkin.itemId);
          this.setSkillOrder(currentOrder);
        }
      }
    }
    
    // 🔧 НОВОЕ: Timestamp-based удаление для cross-device синхронизации
    const deletionTimestamp = Date.now();
    const deletedCheckins = this.get('deletedCheckins') || [];
    
    // Обновляем или добавляем запись об удалении с timestamp
    const existingDeletionIndex = deletedCheckins.findIndex(item => 
      (typeof item === 'object' ? item.id : item) === checkinId
    );
    
    if (existingDeletionIndex !== -1) {
      // Обновляем существующую запись
      deletedCheckins[existingDeletionIndex] = {
        id: checkinId,
        deletedAt: deletionTimestamp,
        type: checkin?.type || 'unknown'
      };
    } else {
      // Добавляем новую запись
      deletedCheckins.push({
        id: checkinId,
        deletedAt: deletionTimestamp,
        type: checkin?.type || 'unknown'
      });
    }
    
    this.set('deletedCheckins', deletedCheckins);
    
    console.log(`🗑️ CHECKIN DELETION with TIMESTAMP:`, {
      checkinId,
      deletedAt: deletionTimestamp,
      deletedAtISO: new Date(deletionTimestamp).toISOString(),
      checkinType: checkin?.type,
      deletedCheckinsCount: deletedCheckins.length
    });
    
    const filtered = checkins.filter(c => c.id !== checkinId);
    this.set(this.KEYS.HISTORY, filtered);
    
    // 🚀 АКТИВНАЯ АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ после удаления чекина  
    // Это гарантирует что удаление немедленно отправляется на сервер
    if (!this.syncInProgress) {
      console.log('🚀 AUTO-SYNC: Starting immediate sync after checkin deletion');
      this.syncWithBackend().catch(error => {
        console.warn('⚠️ Auto-sync after checkin deletion failed:', error);
        // Fallback: mark for sync if immediate sync fails
        this.markForSync();
      });
    } else {
      console.log('🚫 SYNC IN PROGRESS: Marking checkin deletion for sync');
      this.markForSync();
    }
    
    return true;
  }

  // Clear all checkins
  async clearAllCheckins() {
    console.log('🗑️ CLEAR ALL CHECKINS: Starting complete history cleanup...');
    
    // 🔧 БЛОКИРОВКА СИНХРОНИЗАЦИИ во время Clear All
    this.clearAllInProgress = true;
    console.log('🚫 SYNC LOCK: Blocking all synchronization during Clear All');
    
    const userEmail = this.currentUser?.email || 'unknown';
    const checkins = this.getCheckins();
    
    console.log('📊 CLEAR ALL STATS:', {
      totalCheckinsToDelete: checkins.length,
      checkinIds: checkins.slice(0, 5).map(c => c.id),
      userEmail,
      timestamp: new Date().toISOString()
    });

    // 🔧 УПРОЩЕНИЕ: Просто очищаем историю - никаких флагов удаления
    // Логика: что не хранится - то не отображается
    this.set(this.KEYS.HISTORY, []);
    console.log('✅ History cleared locally');
    
    console.log('🖥️ UPDATING UI immediately after clear...');
    
    // Force clear app history cache and refresh immediately
    if (window.App) {
      window.App.filteredHistory = [];
    }
    console.log('📄 UI updated immediately after clear');
    
    // Update stats
    if (window.UI && window.UI.updateUserStats) {
      window.UI.updateUserStats();
    }
    console.log('📊 Stats updated after clear');
    
    // 🔧 ПРОСТАЯ ОТПРАВКА ПУСТОЙ ИСТОРИИ НА СЕРВЕР
    console.log('🚀 CLEARING SERVER HISTORY: Uploading empty history');
    try {
      const forceUploadData = {
        protocols: this.get(this.KEYS.PROTOCOLS) || [],
        skills: this.get(this.KEYS.SKILLS) || [],
        states: this.get(this.KEYS.STATES) || [],
        history: [], // 🚨 ПРИНУДИТЕЛЬНО ПУСТАЯ ИСТОРИЯ
        quickActions: this.get(this.KEYS.QUICK_ACTIONS) || [],
        quickActionOrder: this.get(this.KEYS.QUICK_ACTION_ORDER) || [],
        protocolOrder: this.get(this.KEYS.PROTOCOL_ORDER) || [],
        skillOrder: this.get(this.KEYS.SKILL_ORDER) || [],
        stateOrder: this.get(this.KEYS.STATE_ORDER) || []
      };
      
      const token = await this.currentUser.getIdToken();
      const timestamp = Date.now();
      const clearServerUrl = `${BACKEND_URL}/api/sync?_clear_all=true&_t=${timestamp}&_cb=${Math.random()}`;
      
      console.log('🌐 FORCE CLEAR SERVER REQUEST:', {
        url: clearServerUrl,
        emptyHistoryLength: forceUploadData.history.length
      });
      
      const serverClearResponse = await fetch(clearServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(forceUploadData)
      });
      
      if (serverClearResponse.ok) {
        const clearResult = await serverClearResponse.json();
        console.log('✅ SERVER HISTORY CLEARED SUCCESSFULLY:', clearResult);
        console.log('🎯 All devices will now receive empty history');
      } else {
        const errorText = await serverClearResponse.text();
        console.error('❌ FAILED TO CLEAR SERVER HISTORY:', serverClearResponse.status, errorText);
      }
    } catch (error) {
      console.error('❌ ERROR CLEARING SERVER HISTORY:', error);
    }
    
    console.log('🔄 CLEAR ALL COMPLETE');
    
    // 🔧 РАЗБЛОКИРОВКА СИНХРОНИЗАЦИИ
    this.clearAllInProgress = false;
    console.log('✅ SYNC LOCK RELEASED: Re-enabling synchronization');
    
    console.log('🎯 CLEAR ALL COMPLETE: All history cleared');
    
    // Update UI one more time to ensure clean state
    if (window.App) {
      window.App.filteredHistory = [];
      if (window.App.currentPage === 'history') {
        window.App.renderPage('history');
      }
    }
  }

  // Clear the list of deleted checkins (for debugging)
  clearDeletedCheckins() {
    this.set('deletedCheckins', []);
    console.log('🗑️ Deleted checkins list cleared');
  }

  // Clear the list of deleted protocols (for debugging)
  clearDeletedProtocols() {
    this.set('deletedProtocols', []);
    console.log('🗑️ Deleted protocols list cleared');
  }

  // Calculate current skill score
  calculateCurrentScore(skillId) {
    const skill = this.getSkillById(skillId);
    if (!skill) return 0;

    const checkins = this.getCheckins();
    let totalChange = 0;

    checkins.forEach((checkin, index) => {
      if (checkin.changes && checkin.type === 'protocol') {
        // Check if this checkin affects our skill
        if (checkin.changes[skillId] !== undefined) {
          totalChange += checkin.changes[skillId];
        }
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  }

  // Calculate state score
  calculateStateScore(stateId, visitedStates = new Set()) {
    const states = this.getStates();
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    // Prevent circular dependencies
    if (visitedStates.has(stateId)) {
      console.warn(`Circular dependency detected for state: ${stateId}`);
      return 0;
    }
    visitedStates.add(stateId);

    let total = 0;
    let count = 0;

    // Calculate contribution from skills
    if (state.skillIds && state.skillIds.length > 0) {
      state.skillIds.forEach(skillId => {
        total += this.calculateCurrentScore(skillId);
        count++;
      });
    }

    // Calculate contribution from other states
    if (state.stateIds && state.stateIds.length > 0) {
      state.stateIds.forEach(dependentStateId => {
        total += this.calculateStateScore(dependentStateId, new Set(visitedStates));
        count++;
      });
    }

    return count > 0 ? total / count : 0;
  }

  // Calculate skill score at specific date
  calculateCurrentScoreAtDate(skillId, targetDate) {
    const skill = this.getSkillById(skillId);
    if (!skill) return 0;

    const checkins = this.getCheckins();
    let totalChange = 0;

    // Get target date as Date object for proper comparison
    const targetDateObj = new Date(targetDate);

    checkins.forEach((checkin, index) => {
      if (checkin.changes && checkin.type === 'protocol') {
        // Check if this checkin affects our skill and happened BEFORE target date (target date = start of current day)
        const checkinDate = new Date(checkin.timestamp);
        
        // 🔧 ИСПРАВЛЕНИЕ: Используем < для чекинов до целевого дня (целевой день = начало текущего дня)
        // Теперь "yesterday" включает все чекины до начала текущего дня
        if (checkinDate < targetDateObj && checkin.changes[skillId] !== undefined) {
          totalChange += checkin.changes[skillId];
        }
      }
    });

    return Math.max(0, skill.initialScore + totalChange);
  }

  // Calculate state score at specific date
  calculateStateScoreAtDate(stateId, targetDate, visitedStates = new Set()) {
    const states = this.getStates();
    const state = states.find(s => s.id === stateId);
    if (!state) return 0;

    // Prevent circular dependencies
    if (visitedStates.has(stateId)) {
      console.warn(`Circular dependency detected for state: ${stateId}`);
      return 0;
    }
    visitedStates.add(stateId);

    let total = 0;
    let count = 0;

    // Calculate contribution from skills
    if (state.skillIds && state.skillIds.length > 0) {
      state.skillIds.forEach(skillId => {
        total += this.calculateCurrentScoreAtDate(skillId, targetDate);
        count++;
      });
    }

    // Calculate contribution from other states
    if (state.stateIds && state.stateIds.length > 0) {
      state.stateIds.forEach(dependentStateId => {
        total += this.calculateStateScoreAtDate(dependentStateId, targetDate, new Set(visitedStates));
        count++;
      });
    }

    return count > 0 ? total / count : 0;
  }

  // Get skill history
  getSkillHistory(skillId) {
    const checkins = this.getCheckins();
    return checkins.filter(c => c.changes[skillId] !== undefined);
  }

  // Get last update date for skill
  getSkillLastUpdate(skillId) {
    const history = this.getSkillHistory(skillId);
    if (history.length === 0) return null;
    
    return history[history.length - 1].timestamp;
  }

  // Export data
  exportData() {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      protocols: this.getProtocols(),
      skills: this.getSkills(),
      states: this.getStates(),
      checkins: this.getCheckins(),
      settings: this.get(this.KEYS.SETTINGS)
    };
    return data;
  }

  // Import data
  importData(data) {
    try {
      if (data.version !== '1.0') {
        throw new Error('Incompatible version');
      }
      
      this.set(this.KEYS.PROTOCOLS, data.protocols || []);
      this.set(this.KEYS.SKILLS, data.skills || []);
      this.set(this.KEYS.STATES, data.states || []);
      this.set(this.KEYS.HISTORY, data.checkins || []);
      this.set(this.KEYS.SETTINGS, data.settings || {});
      
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // Reset to initial data
  reset() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(this.getUserKey(key));
    });
    this.init();
    return true;
  }

  // Protocol Order Management
  getProtocolOrder() {
    return this.get(this.KEYS.PROTOCOL_ORDER) || [];
  }

  setProtocolOrder(order) {
    this.set(this.KEYS.PROTOCOL_ORDER, order);
    console.log('🔄 PROTOCOL ORDER SAVED:', {
      order,
      saved: true,
      keyUsed: this.KEYS.PROTOCOL_ORDER,
      verification: this.get(this.KEYS.PROTOCOL_ORDER)
    });
    
    // 🔧 НОВОЕ: Сохраняем timestamp изменения для cross-device синхронизации
    const orderTimestamp = Date.now();
    this.set('protocolOrder_timestamp', orderTimestamp);
    console.log('⏰ PROTOCOL ORDER TIMESTAMP SAVED:', orderTimestamp);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ при изменении порядка protocols
    if (!this.syncInProgress) {
      this.syncWithBackend().catch(error => {
        console.warn('⚠️ Background sync after protocol order change failed:', error);
      });
    } else {
      this.markForSync();
    }
  }

  getProtocolsInOrder() {
    const protocols = this.getProtocols();
    const customOrder = this.getProtocolOrder();
    
    if (customOrder.length === 0) {
      return protocols;
    }
    
    // Sort by custom order, then by original order for new items
    const ordered = [];
    const used = new Set();
    
    // Add items in custom order
    customOrder.forEach(id => {
      // Convert ID to number for comparison
      const targetId = typeof id === 'string' ? parseInt(id) : id;
      const protocol = protocols.find(p => p.id === targetId);
      if (protocol) {
        ordered.push(protocol);
        used.add(protocol.id);
      }
    });
    
    // Add any new items not in custom order
    protocols.forEach(protocol => {
      if (!used.has(protocol.id)) {
        ordered.push(protocol);
      }
    });
    
    return ordered;
  }

  // Skill Order Management
  getSkillOrder() {
    return this.get(this.KEYS.SKILL_ORDER) || [];
  }

  setSkillOrder(order) {
    this.set(this.KEYS.SKILL_ORDER, order);
    console.log('🔄 SKILL ORDER SAVED:', {
      order,
      saved: true,
      keyUsed: this.KEYS.SKILL_ORDER,
      verification: this.get(this.KEYS.SKILL_ORDER)
    });
    
    // 🔧 НОВОЕ: Сохраняем timestamp изменения для cross-device синхронизации
    const orderTimestamp = Date.now();
    this.set('skillOrder_timestamp', orderTimestamp);
    console.log('⏰ SKILL ORDER TIMESTAMP SAVED:', orderTimestamp);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ при изменении порядка skills
    if (!this.syncInProgress) {
      this.syncWithBackend().catch(error => {
        console.warn('⚠️ Background sync after skill order change failed:', error);
      });
    } else {
      this.markForSync();
    }
  }

  getSkillsInOrder() {
    const skills = this.getSkills();
    const customOrder = this.getSkillOrder();
    
    if (customOrder.length === 0) {
      return skills;
    }
    
    // Sort by custom order, then by original order for new items
    const ordered = [];
    const used = new Set();
    
    // Add items in custom order
    customOrder.forEach(id => {
      // Find skill by exact ID match (no conversion)
      const skill = skills.find(s => s.id === id);
      if (skill) {
        ordered.push(skill);
        used.add(skill.id);
      }
    });
    
    // Add any new items not in custom order
    skills.forEach(skill => {
      if (!used.has(skill.id)) {
        ordered.push(skill);
      }
    });
    
    return ordered;
  }

  // Add new skill
  addSkill(skillData) {
    const skills = this.getSkills();
    
    // Generate new ID - only consider numeric IDs for max calculation
    const numericIds = skills.map(s => s.id).filter(id => typeof id === 'number');
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    const newId = maxId + 1;
    
    // Create new skill object
    const newSkill = {
      id: newId,
      name: skillData.name + (skillData.description ? '. ' + skillData.description : ''),
      icon: skillData.icon,
      hover: skillData.hover || '',
      initialScore: skillData.initialScore,
      // 🔧 НОВОЕ: Добавляем timestamp создания для timestamp-based удалений
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    // Add to skills array
    skills.push(newSkill);
    this.set(this.KEYS.SKILLS, skills);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill creation failed:', error);
    });
    
    return newSkill;
  }

  // Update skill completely
  updateSkillFull(skillId, skillData) {
    const skills = this.getSkills();
    const index = skills.findIndex(s => s.id === skillId);
    
    if (index === -1) return false;
    
    // Update skill object
    skills[index] = {
      id: skillId,
      name: skillData.name + (skillData.description ? '. ' + skillData.description : ''),
      icon: skillData.icon,
      hover: skillData.hover || '',
      initialScore: skillData.initialScore,
      // 🔧 НОВОЕ: Сохраняем существующий createdAt и обновляем lastModified
      createdAt: skills[index].createdAt || Date.now(),
      lastModified: Date.now()
    };
    
    this.set(this.KEYS.SKILLS, skills);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill update failed:', error);
    });
    
    return skills[index];
  }

  // Delete skill
  deleteSkill(skillId) {
    const skills = this.getSkills();
    const skillToDelete = skills.find(s => s.id === skillId);
    const filteredSkills = skills.filter(s => s.id !== skillId);
    
    if (filteredSkills.length === skills.length) {
      return false; // Skill not found
    }
    
    // 🔧 НОВОЕ: Timestamp-based удаление для cross-device синхронизации
    const deletionTimestamp = Date.now();
    const deletedSkills = this.get('deletedSkills') || [];
    
    // Обновляем или добавляем запись об удалении с timestamp
    const existingDeletionIndex = deletedSkills.findIndex(item => 
      (typeof item === 'object' ? item.id : item) === skillId
    );
    
    if (existingDeletionIndex !== -1) {
      // Обновляем существующую запись
      deletedSkills[existingDeletionIndex] = {
        id: skillId,
        deletedAt: deletionTimestamp,
        name: skillToDelete?.name || 'Unknown Skill'
      };
    } else {
      // Добавляем новую запись
      deletedSkills.push({
        id: skillId,
        deletedAt: deletionTimestamp,
        name: skillToDelete?.name || 'Unknown Skill'
      });
    }
    
    this.set('deletedSkills', deletedSkills);
    
    console.log(`🗑️ SKILL DELETION with TIMESTAMP:`, {
      skillId,
      deletedAt: deletionTimestamp,
      deletedAtISO: new Date(deletionTimestamp).toISOString(),
      skillName: skillToDelete?.name,
      deletedSkillsCount: deletedSkills.length
    });
    
    // Remove from skills
    this.set(this.KEYS.SKILLS, filteredSkills);
    
    // Remove from custom order
    const customOrder = this.getSkillOrder();
    const filteredOrder = customOrder.filter(id => id !== skillId);
    this.setSkillOrder(filteredOrder);
    
    // Note: We're not removing checkins/history related to this skill
    // This preserves historical data integrity
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ НАВЫКА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after skill deletion failed:', error);
    });
    
    return true;
  }

  // Protocol CRUD operations
  
  // Add new protocol
  addProtocol(protocolData) {
    const protocols = this.getProtocols();
    
    // Generate new ID
    const newId = protocols.length > 0 ? Math.max(...protocols.map(p => p.id)) + 1 : 1;
    
    // Create protocol object
    const newProtocol = {
      id: newId,
      name: protocolData.name + (protocolData.description ? '. ' + protocolData.description : ''),
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      weight: protocolData.weight,
      targets: protocolData.targets || [],
      // 🔧 НОВОЕ: Добавляем timestamp создания для timestamp-based удалений
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    // Add to protocols array
    protocols.push(newProtocol);
    this.set(this.KEYS.PROTOCOLS, protocols);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ ПРОТОКОЛА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol creation failed:', error);
    });
    
    return newProtocol;
  }

  // Get protocol by ID
  getProtocolById(id) {
    const protocols = this.getProtocols();
    const protocol = protocols.find(p => p.id === id || p.id == id);
    return protocol;
  }

  // Update protocol completely
  updateProtocolFull(protocolId, protocolData) {
    const protocols = this.getProtocols();
    const index = protocols.findIndex(p => p.id === protocolId);
    
    if (index === -1) return false;
    
    // Store old values for comparison
    const oldProtocol = protocols[index];
    const oldTargets = oldProtocol.targets || [];
    const newTargets = protocolData.targets || [];
    
    // Update protocol object
    protocols[index] = {
      id: protocolId,
      name: protocolData.name + (protocolData.description ? '. ' + protocolData.description : ''),
      icon: protocolData.icon,
      hover: protocolData.hover || '',
      weight: protocolData.weight,
      targets: newTargets,
      // 🔧 НОВОЕ: Обновляем timestamp изменения
      createdAt: oldProtocol.createdAt || Date.now(),
      lastModified: Date.now()
    };
    
    this.set(this.KEYS.PROTOCOLS, protocols);
    
    
    // Check if targets changed or weight changed and recalculate history if needed
    const targetsChanged = !this.arraysEqual(oldTargets, newTargets);
    const weightChanged = oldProtocol.weight !== protocolData.weight;
    
    let wasRecalculated = false;
    if (targetsChanged || weightChanged) {
      wasRecalculated = this.recalculateProtocolHistory(protocolId, oldTargets, newTargets);
      if (wasRecalculated && window.App) {
        if (targetsChanged && weightChanged) {
          window.App.showToast('Protocol targets and weight updated retroactively', 'info');
        } else if (targetsChanged) {
          window.App.showToast('Protocol targets updated retroactively', 'info');
        } else {
          window.App.showToast('Protocol weight updated retroactively', 'info');
        }
      }
    }

    // 🚀 КРИТИЧНО: АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ ПРОТОКОЛА
    // Особенно важно когда произошел пересчет истории!
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol update failed:', error);
    });
    
    return protocols[index];
  }

  // Helper function to compare arrays
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }

  // Delete protocol
  deleteProtocol(protocolId) {
    const protocols = this.getProtocols();
    const protocolToDelete = protocols.find(p => p.id === protocolId);
    const filteredProtocols = protocols.filter(p => p.id !== protocolId);
    
    if (filteredProtocols.length === protocols.length) {
      return false; // Protocol not found
    }
    
    // 🔧 НОВОЕ: Timestamp-based удаление для cross-device синхронизации
    const deletionTimestamp = Date.now();
    const deletedProtocols = this.get('deletedProtocols') || [];
    
    // Обновляем или добавляем запись об удалении с timestamp
    const existingDeletionIndex = deletedProtocols.findIndex(item => 
      (typeof item === 'object' ? item.id : item) === protocolId
    );
    
    if (existingDeletionIndex !== -1) {
      // Обновляем существующую запись
      deletedProtocols[existingDeletionIndex] = {
        id: protocolId,
        deletedAt: deletionTimestamp,
        name: protocolToDelete?.name || 'Unknown Protocol'
      };
    } else {
      // Добавляем новую запись
      deletedProtocols.push({
        id: protocolId,
        deletedAt: deletionTimestamp,
        name: protocolToDelete?.name || 'Unknown Protocol'
      });
    }
    
    this.set('deletedProtocols', deletedProtocols);
    
    console.log(`🗑️ PROTOCOL DELETION with TIMESTAMP:`, {
      protocolId,
      deletedAt: deletionTimestamp,
      deletedAtISO: new Date(deletionTimestamp).toISOString(),
      protocolName: protocolToDelete?.name,
      deletedProtocolsCount: deletedProtocols.length
    });
    
    // Remove from protocols
    this.set(this.KEYS.PROTOCOLS, filteredProtocols);
    
    // Remove from custom order
    const customOrder = this.getProtocolOrder();
    const filteredOrder = customOrder.filter(id => id !== protocolId);
    this.setProtocolOrder(filteredOrder);
    
    // Remove all related checkins
    const checkins = this.getCheckins();
    const filteredCheckins = checkins.filter(c => {
      if (c.type === 'protocol' && c.protocolId === protocolId) {
        return false;
      }
      return true;
    });
    this.set(this.KEYS.HISTORY, filteredCheckins);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ ПРОТОКОЛА
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after protocol deletion failed:', error);
    });
    
    return true;
  }

  // States Management
  addState(stateData) {
    const states = this.getStates();
    
    // Generate new ID
    const maxId = states.length > 0 ? Math.max(...states.map(s => parseInt(s.id.split('_').pop()) || 0)) : 0;
    const newId = `state_${maxId + 1}`;
    
    const newState = {
      id: newId,
      name: stateData.name,
      subtext: stateData.subtext || '',
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || [],
      // 🔧 НОВОЕ: Добавляем timestamp создания для timestamp-based удалений
      createdAt: Date.now(),
      lastModified: Date.now()
    };
    
    states.push(newState);
    this.set(this.KEYS.STATES, states);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ СОЗДАНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state creation failed:', error);
    });
    
    return newState;
  }

  updateState(stateId, stateData) {
    const states = this.getStates();
    const index = states.findIndex(s => s.id === stateId);
    
    if (index === -1) return false;
    
    states[index] = {
      ...states[index],
      name: stateData.name,
      subtext: stateData.subtext || '',
      icon: stateData.icon,
      hover: stateData.hover,
      skillIds: stateData.skillIds || [],
      stateIds: stateData.stateIds || [],
      // 🔧 НОВОЕ: Обновляем timestamp изменения
      lastModified: Date.now()
    };
    
    this.set(this.KEYS.STATES, states);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ОБНОВЛЕНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state update failed:', error);
    });
    
    return states[index];
  }

  deleteState(stateId) {
    const states = this.getStates();
    const stateToDelete = states.find(s => s.id === stateId);
    const filteredStates = states.filter(s => s.id !== stateId);
    
    if (filteredStates.length === states.length) {
      return false; // State not found
    }
    
    // 🔧 НОВОЕ: Timestamp-based удаление для cross-device синхронизации
    const deletionTimestamp = Date.now();
    const deletedStates = this.get('deletedStates') || [];
    
    // Обновляем или добавляем запись об удалении с timestamp
    const existingDeletionIndex = deletedStates.findIndex(item => 
      (typeof item === 'object' ? item.id : item) === stateId
    );
    
    if (existingDeletionIndex !== -1) {
      // Обновляем существующую запись
      deletedStates[existingDeletionIndex] = {
        id: stateId,
        deletedAt: deletionTimestamp,
        name: stateToDelete?.name || 'Unknown State'
      };
    } else {
      // Добавляем новую запись
      deletedStates.push({
        id: stateId,
        deletedAt: deletionTimestamp,
        name: stateToDelete?.name || 'Unknown State'
      });
    }
    
    this.set('deletedStates', deletedStates);
    
    console.log(`🗑️ STATE DELETION with TIMESTAMP:`, {
      stateId,
      deletedAt: deletionTimestamp,
      deletedAtISO: new Date(deletionTimestamp).toISOString(),
      stateName: stateToDelete?.name,
      deletedStatesCount: deletedStates.length
    });
    
    // Remove references to this state from other states
    filteredStates.forEach(state => {
      if (state.stateIds && state.stateIds.includes(stateId)) {
        state.stateIds = state.stateIds.filter(id => id !== stateId);
      }
    });
    
    this.set(this.KEYS.STATES, filteredStates);
    
    // 🔧 Also remove from state order array
    const stateOrder = this.getStateOrder();
    const updatedStateOrder = stateOrder.filter(id => id !== stateId);
    this.setStateOrder(updatedStateOrder);
    
    console.log('🗑️ STATE DELETION:', {
      deletedStateId: stateId,
      remainingStates: filteredStates.length,
      oldStateOrder: stateOrder,
      newStateOrder: updatedStateOrder
    });
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ СОСТОЯНИЯ
    this.syncWithBackend().catch(error => {
      console.warn('⚠️ Background sync after state deletion failed:', error);
    });
    
    return true;
  }

  getStateById(stateId) {
    const states = this.getStates();
    return states.find(s => s.id === stateId);
  }

  // Quick Actions Management
  getQuickActions() {
    // Return the array of protocol IDs (not objects!)
    return this.get(this.KEYS.QUICK_ACTIONS) || [];
  }

  // New method to get Quick Actions as protocol objects (for UI display)
  getQuickActionProtocols() {
    const quickActionIds = this.getQuickActions();
    const protocols = this.getProtocols();
    
    // Return protocols that are in quick actions, in the correct order
    return quickActionIds.map(id => {
      return protocols.find(p => p.id === id);
    }).filter(Boolean);
  }

  addToQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    
    // Check if already in quick actions
    if (quickActions.includes(protocolId)) {
      return false;
    }
    
    // Add new one at the end
    quickActions.push(protocolId);
    
    // Also update the order array
    const quickActionOrder = this.getQuickActionOrder();
    quickActionOrder.push(protocolId);
    this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
    
    this.set(this.KEYS.QUICK_ACTIONS, quickActions);
    
    // Add to history log  
    const protocol = this.getProtocolById(protocolId);
    if (protocol) {
      const checkins = this.getCheckins();
      const checkin = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'quick_action',
        subType: 'added',
        protocolId: protocolId,
        protocolName: protocol.name,
        protocolIcon: protocol.icon
      };
      checkins.push(checkin);
      this.set(this.KEYS.HISTORY, checkins);
    }
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ ДОБАВЛЕНИЯ В QUICK ACTIONS
    if (!this.syncInProgress) {
      console.log('🚀 SCHEDULING BACKGROUND SYNC: Quick action added');
      setTimeout(() => {
        if (!this.syncInProgress) {
          this.syncWithBackend().catch(error => {
            console.warn('⚠️ Background sync after quick action addition failed:', error);
          });
        }
      }, 300);
    } else {
      console.log('🚫 BACKGROUND SYNC SKIPPED: Another sync already in progress (quick action add)');
    }
    
    return true;
  }

  removeFromQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    
    // Get protocol info for logging before removal
    const protocol = this.getProtocolById(protocolId);
    
    // 🐞 DEBUG: Логируем состояние до удаления
    console.log('🐞 DEBUG REMOVING QUICK ACTION:', {
      protocolId,
      protocolName: protocol?.name,
      beforeRemoval: {
        quickActionsCount: quickActions.length,
        quickActionsData: quickActions
      },
      userEmail: this.currentUser?.email
    });
    
    // 🔧 НОВОЕ: Timestamp-based удаление для cross-device синхронизации
    const deletionTimestamp = Date.now();
    const deletedQuickActions = this.get("deletedQuickActions") || [];
    
    // Обновляем или добавляем запись об удалении с timestamp
    const existingDeletionIndex = deletedQuickActions.findIndex(item => 
      (typeof item === 'object' ? item.id : item) === protocolId
    );
    
    if (existingDeletionIndex !== -1) {
      // Обновляем существующую запись
      deletedQuickActions[existingDeletionIndex] = {
        id: protocolId,
        deletedAt: deletionTimestamp,
        name: protocol?.name || 'Unknown Protocol'
      };
    } else {
      // Добавляем новую запись
      deletedQuickActions.push({
        id: protocolId,
        deletedAt: deletionTimestamp,
        name: protocol?.name || 'Unknown Protocol'
      });
    }
    
    this.set("deletedQuickActions", deletedQuickActions);
    
    console.log(`🗑️ QUICK ACTION DELETION with TIMESTAMP:`, {
      protocolId,
      deletedAt: deletionTimestamp,
      deletedAtISO: new Date(deletionTimestamp).toISOString(),
      protocolName: protocol?.name,
      deletedQuickActionsCount: deletedQuickActions.length
    });
    
    console.log('🚫 REMOVING FROM QUICK ACTIONS:', {
      protocolId,
      reason: 'user_removal'
    });
    
    // Remove protocol from quick actions
    const updatedQuickActions = quickActions.filter(id => id !== protocolId);
    
    // Also remove from quick action order
    const quickActionOrder = this.getQuickActionOrder();
    const updatedOrder = quickActionOrder.filter(id => id !== protocolId);
    this.set(this.KEYS.QUICK_ACTION_ORDER, updatedOrder);
    
    // Save updated quick actions
    this.set(this.KEYS.QUICK_ACTIONS, updatedQuickActions);
    
    // 🐞 DEBUG: Логируем состояние после удаления
    console.log('🐞 DEBUG AFTER QUICK ACTION REMOVAL:', {
      protocolId,
      afterRemoval: {
        quickActionsCount: updatedQuickActions.length,
        quickActionsData: updatedQuickActions,
        quickActionOrderCount: updatedOrder.length,
        quickActionOrderData: updatedOrder
      },
      changesMade: {
        removedFromQuickActions: quickActions.length - updatedQuickActions.length,
        removedFromOrder: quickActionOrder.length - updatedOrder.length
      }
    });
    
    // Add to history log
    if (protocol) {
      const checkins = this.getCheckins();
      const checkin = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'quick_action',
        subType: 'removed',
        protocolId: protocolId,
        protocolName: protocol.name,
        protocolIcon: protocol.icon
      };
      checkins.push(checkin);
      this.set(this.KEYS.HISTORY, checkins);
    }
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ ПОСЛЕ УДАЛЕНИЯ ИЗ QUICK ACTIONS
    if (!this.syncInProgress) {
      console.log('🚀 SCHEDULING BACKGROUND SYNC: Quick action removed');
      setTimeout(() => {
        if (!this.syncInProgress) {
          this.syncWithBackend().catch(error => {
            console.warn('⚠️ Background sync after quick action removal failed:', error);
          });
        }
      }, 300);
    } else {
      console.log('🚫 BACKGROUND SYNC SKIPPED: Another sync already in progress (quick action remove)');
    }
    
    return true;
  }

  isInQuickActions(protocolId) {
    const quickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    return quickActions.includes(protocolId);
  }

  setQuickActions(protocolIds) {
    this.set(this.KEYS.QUICK_ACTIONS, protocolIds);
    return true;
  }

  // States Order Management
  getStateOrder() {
    return this.get(this.KEYS.STATE_ORDER) || [];
  }

  setStateOrder(stateOrder) {
    this.set(this.KEYS.STATE_ORDER, stateOrder);
    console.log('🔄 STATE ORDER SAVED:', {
      stateOrder,
      saved: true,
      keyUsed: this.KEYS.STATE_ORDER,
      verification: this.get(this.KEYS.STATE_ORDER)
    });
    
    // 🔧 НОВОЕ: Сохраняем timestamp изменения для cross-device синхронизации
    const orderTimestamp = Date.now();
    this.set('stateOrder_timestamp', orderTimestamp);
    console.log('⏰ STATE ORDER TIMESTAMP SAVED:', orderTimestamp);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ при изменении порядка states
    this.markForSync();
  }

  getStatesInOrder() {
    const states = this.getStates();
    const customOrder = this.getStateOrder();
    
    if (customOrder.length === 0) {
      // Return original order if no custom order is set
      return states;
    }
    
    // Create a map for quick lookup
    const stateMap = new Map(states.map(s => [s.id, s]));
    
    // Start with states in custom order
    const orderedStates = customOrder
      .map(id => stateMap.get(id))
      .filter(Boolean);
    
    // Add any states not in custom order at the end
    const statesInOrder = new Set(customOrder);
    const remainingStates = states.filter(s => !statesInOrder.has(s.id));
    
    return [...orderedStates, ...remainingStates];
  }

  // Quick Actions Order Management
  getQuickActionOrder() {
    return this.get(this.KEYS.QUICK_ACTION_ORDER) || [];
  }

  setQuickActionOrder(quickActionOrder) {
    this.set(this.KEYS.QUICK_ACTION_ORDER, quickActionOrder);
    // Also update the main quick actions array to match the order
    this.set(this.KEYS.QUICK_ACTIONS, quickActionOrder);
    console.log('🔄 QUICK ACTION ORDER SAVED:', {
      quickActionOrder,
      saved: true,
      keyUsed: this.KEYS.QUICK_ACTION_ORDER,
      verification: this.get(this.KEYS.QUICK_ACTION_ORDER),
      quickActionsUpdated: this.get(this.KEYS.QUICK_ACTIONS)
    });
    
    // 🔧 НОВОЕ: Сохраняем timestamp изменения для cross-device синхронизации
    const orderTimestamp = Date.now();
    this.set('quickActionOrder_timestamp', orderTimestamp);
    console.log('⏰ QUICK ACTION ORDER TIMESTAMP SAVED:', orderTimestamp);
    
    // 🚀 АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ при изменении Quick Actions
    this.markForSync();
  }

  getQuickActionsInOrder() {
    const quickActionIds = this.getQuickActions(); // Now returns IDs, not objects
    const customOrder = this.getQuickActionOrder();
    const protocols = this.getProtocols();
    
    // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные (повторяются десятки раз)
    // console.log('🔍 getQuickActionsInOrder DEBUG:', {
    //   quickActionIds,
    //   customOrder,
    //   protocols: protocols.length,
    //   quickActionKey: 'quickActions',
    //   quickActionOrderKey: 'quickActionOrder',
    //   // 🔧 ДОПОЛНИТЕЛЬНАЯ ОТЛАДКА для проблемы с пустыми Quick Actions
    //   rawQuickActions: this.get(this.KEYS.QUICK_ACTIONS),
    //   rawQuickActionOrder: this.get(this.KEYS.QUICK_ACTION_ORDER),
    //   // 🔧 ПОЛНАЯ ОТЛАДКА ключей localStorage
    //   keyMappings: {
    //     QUICK_ACTIONS: this.KEYS.QUICK_ACTIONS,
    //     QUICK_ACTION_ORDER: this.KEYS.QUICK_ACTION_ORDER
    //   },
    //   getQuickActionsMethod: this.getQuickActions(),
    //   getQuickActionOrderMethod: this.getQuickActionOrder()
    // });
    
    // If no quick actions, return empty
    if (!quickActionIds || quickActionIds.length === 0) {
      // console.log('🚨 getQuickActionsInOrder: No quickActionIds found');
      return [];
    }
    
    // Use custom order if available, otherwise use the quickActionIds order
    const orderToUse = customOrder && customOrder.length > 0 ? customOrder : quickActionIds;
    
    const result = [];
    for (const protocolId of orderToUse) {
      const protocol = protocols.find(p => p.id == protocolId);
      // 🔇 ОТКЛЮЧАЮ ШУМНЫЙ ЛОГ - повторяется 80+ раз
      // console.log(`🔍 Looking for protocol ${protocolId}: ${protocol ? 'Found: ' + protocol.name : 'Not found'}`);
      
      if (protocol) {
        result.push(protocol);
      }
    }
    
    // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные
    // console.log('🔍 getQuickActionsInOrder RESULT:', {
    //   orderToUse,
    //   foundProtocols: result.length,
    //   result: result.map(p => ({id: p.id, name: p.name}))
    // });
    
    return result;
  }

  // Helper method to map server keys to localStorage constants
  getKeyConstant(serverKey) {
    const keyMap = {
      'quickActions': 'QUICK_ACTIONS',
      'quickActionOrder': 'QUICK_ACTION_ORDER',
      'protocolOrder': 'PROTOCOL_ORDER',
      'skillOrder': 'SKILL_ORDER',
      'stateOrder': 'STATE_ORDER',
      'protocols': 'PROTOCOLS',
      'skills': 'SKILLS',
      'states': 'STATES',
      'history': 'HISTORY',
      'deletedCheckins': 'deletedCheckins', // Special case - not in KEYS object
      'deletedProtocols': 'deletedProtocols', // Special case - not in KEYS object
      'deletedSkills': 'deletedSkills', // Special case - not in KEYS object
      'deletedStates': 'deletedStates', // Special case - not in KEYS object
      'deletedQuickActions': 'deletedQuickActions', // Special case - not in KEYS object
      // 🔧 НОВОЕ: timestamp ключи для order массивов
      'protocolOrder_timestamp': 'protocolOrder_timestamp',
      'skillOrder_timestamp': 'skillOrder_timestamp', 
      'stateOrder_timestamp': 'stateOrder_timestamp',
      'quickActionOrder_timestamp': 'quickActionOrder_timestamp'
    };
    
    const mappedKey = keyMap[serverKey];
    if (mappedKey) {
      // For deletedCheckins, deletedProtocols, deletedSkills, deletedStates, deletedQuickActions, and timestamp keys, return the key directly (not through KEYS)
      if (serverKey === 'deletedCheckins' || serverKey === 'deletedProtocols' || serverKey === 'deletedSkills' || serverKey === 'deletedStates' || serverKey === 'deletedQuickActions' || serverKey.includes('_timestamp')) {
        return serverKey;
      }
      // For other keys, use KEYS object
      return this.KEYS[mappedKey];
    }
    
    
    console.error(`🚨 getKeyConstant: No mapping found for server key '${serverKey}'`);
    return null;
  }

  // Sync with Firebase backend
  async syncWithBackend() {
    // 🔧 КРИТИЧНО: Блокируем синхронизацию во время Clear All
    if (this.clearAllInProgress) {
      console.log('🚫 SYNC BLOCKED: Clear All operation in progress, skipping sync');
      return;
    }
    
    // 🔧 НОВОЕ: Защита от множественных параллельных синхронизаций
    if (this.syncInProgress) {
      console.log('🚫 SYNC BLOCKED: Another sync already in progress, skipping duplicate sync');
      return;
    }
    
    if (!this.isOnline || !this.currentUser) {
      console.log('🚫 SYNC SKIPPED:', {
        isOnline: this.isOnline,
        hasUser: !!this.currentUser,
        userEmail: this.currentUser?.email
      });
      return;
    }
    
    // 🔧 УСТАНАВЛИВАЕМ ФЛАГ СИНХРОНИЗАЦИИ
    this.syncInProgress = true;
    
    console.log('🔄 SYNC STARTED:', {
      user: this.currentUser.email,
      userId: this.currentUser.uid,
      backendUrl: BACKEND_URL
    });
    
    try {
      const userData = {
        protocols: this.get(this.KEYS.PROTOCOLS),
        skills: this.get(this.KEYS.SKILLS),
        states: this.get(this.KEYS.STATES),
        history: this.get(this.KEYS.HISTORY),
        quickActions: this.get(this.KEYS.QUICK_ACTIONS),
        quickActionOrder: this.get(this.KEYS.QUICK_ACTION_ORDER),
        protocolOrder: this.get(this.KEYS.PROTOCOL_ORDER),
        skillOrder: this.get(this.KEYS.SKILL_ORDER),
        stateOrder: this.get(this.KEYS.STATE_ORDER),
        deletedCheckins: this.get('deletedCheckins') || [],
        deletedProtocols: this.get('deletedProtocols') || [],
        deletedSkills: this.get('deletedSkills') || [],
        deletedStates: this.get('deletedStates') || [],
        deletedQuickActions: this.get('deletedQuickActions') || [],
        // 🔧 НОВОЕ: отправляем timestamp'ы order массивов для умной синхронизации
        protocolOrder_timestamp: this.get('protocolOrder_timestamp') || 0,
        skillOrder_timestamp: this.get('skillOrder_timestamp') || 0,
        stateOrder_timestamp: this.get('stateOrder_timestamp') || 0,
        quickActionOrder_timestamp: this.get('quickActionOrder_timestamp') || 0
      };
      
      // 🐞 DEBUG: Логируем отправляемые данные Quick Actions
      console.log('🐞 DEBUG SENDING TO SERVER:', {
        quickActionsCount: userData.quickActions?.length || 0,
        quickActionsData: userData.quickActions,
        quickActionOrderCount: userData.quickActionOrder?.length || 0,
        quickActionOrderData: userData.quickActionOrder,
        historyCount: userData.history?.length || 0,
        userEmail: this.currentUser?.email,
        lastSyncTime: this.lastSyncTime
      });
      
      // 🔇 ЛОГИ ОТКЛЮЧЕНЫ - слишком шумные (повторяются при каждой синхронизации)
      // console.log('📤 SYNC DATA TO SEND:', {
      //   protocolsCount: userData.protocols?.length || 0,
      //   skillsCount: userData.skills?.length || 0,
      //   statesCount: userData.states?.length || 0,
      //   historyCount: userData.history?.length || 0,
      //   quickActionsCount: userData.quickActions?.length || 0,
      //   deletedCheckinsCount: userData.deletedCheckins?.length || 0,
      //   userData: userData
      // });
      
      const token = await this.currentUser.getIdToken();
      // 🔇 ОТКЛЮЧАЮ ШУМНЫЙ ЛОГ AUTH TOKEN
      // console.log('🔑 AUTH TOKEN OBTAINED:', {
      //   tokenLength: token?.length || 0,
      //   tokenStart: token?.substring(0, 20) + '...'
      // });
      
      // Add aggressive cache busting with timestamp
      const timestamp = Date.now();
      const syncUrl = `${BACKEND_URL}/api/sync?_t=${timestamp}&_cb=${Math.random()}`;
      console.log('🌐 SYNC REQUEST:', {
        url: syncUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
        }
      });
      
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
        },
        body: JSON.stringify(userData)
      });
      
      console.log('📡 SYNC RESPONSE:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const serverData = await response.json();
        console.log('📥 SYNC RESPONSE DATA:', serverData);
        
        // 🐞 DEBUG: Подробные логи для получаемых с сервера данных
        console.log('🐞 DEBUG RECEIVED FROM SERVER:', {
          quickActionsCount: serverData.data?.quickActions?.length || 0,
          quickActionsData: serverData.data?.quickActions,
          quickActionOrderCount: serverData.data?.quickActionOrder?.length || 0,
          quickActionOrderData: serverData.data?.quickActionOrder,
          historyCount: serverData.data?.history?.length || 0,
          protocolsCount: serverData.data?.protocols?.length || 0,
          userEmail: this.currentUser?.email,
          serverResponse: serverData
        });
        
        this.lastSyncTime = new Date().toISOString();
        
        // Update local data with server data using true merge strategy
        if (serverData.data) {
          let mergeResults = {};
          let hasUpdates = false;
          
          Object.keys(serverData.data).forEach(key => {
            if (serverData.data[key]) {
              const currentData = this.get(this.getKeyConstant(key));
              const serverArray = serverData.data[key];
              const localArray = currentData || [];
              
              const hasLocalData = Array.isArray(localArray) && localArray.length > 0;
              const hasServerData = Array.isArray(serverArray) && serverArray.length > 0;
              
              let mergedData = [];
              let mergeAction = '';
              let skipFurtherProcessing = false; // 🔧 ФЛАГ для пропуска дальнейшей обработки
              
              // 🔧 КРИТИЧНО: РАННЯЯ ЗАЩИТА ОТ CLEAR ALL для истории
              // Проверяем в самом начале обработки истории - до любых других операций
              if (key === 'history') {
                // 🔧 ИСПРАВЛЕНИЕ: Умная защита от Clear All с учетом времени
                // НО НЕ применяем защиту для первого входа пользователя
                const isLocalHistoryEmpty = !hasLocalData;
                const hasServerHistory = hasServerData;
                const isFirstTimeUser = this.isFirstTimeLogin === true;
                
                if (isLocalHistoryEmpty && hasServerHistory) {
                  if (isFirstTimeUser) {
                    console.log('🆕 FIRST TIME USER: Loading all server history without Clear All protection');
                    console.log('📥 First time: accepting all server history items:', serverArray.length);
                    
                    // Для первого входа просто принимаем всю серверную историю
                    this.set(this.getKeyConstant(key), [...serverArray]);
                    
                    mergeResults[key] = { 
                      action: 'first_time_server_load', 
                      localCount: localArray.length, 
                      serverCount: serverArray.length,
                      mergedCount: serverArray.length
                    };
                    
                    console.log(`🔄 SYNC MERGE ${key}:`, {
                      localItems: localArray.length,
                      serverItems: serverArray.length,
                      mergedItems: serverArray.length,
                      action: 'first_time_server_load'
                    });
                    
                    hasUpdates = serverArray.length > 0;
                    skipFurtherProcessing = true; // 🔧 УСТАНАВЛИВАЕМ ФЛАГ для else ветки
                    
                    // Пропускаем дальнейшую обработку для этого ключа
                    return;
                  } else {
                    // 🔧 КРИТИЧНО: Дополнительная проверка - применяем Clear All Protection только если есть признаки РЕАЛЬНОГО Clear All
                    const deletedCheckins = this.get('deletedCheckins') || [];
                    const hasDeletedFlags = deletedCheckins.length > 0;
                    const hasRecentClearAll = this.lastSyncTime && (Date.now() - new Date(this.lastSyncTime).getTime()) < (10 * 60 * 1000); // 10 минут
                    
                    // Применяем защиту только если есть флаги удаления ИЛИ недавняя синхронизация
                    if (hasDeletedFlags || hasRecentClearAll) {
                      console.log('🚫 CLEAR ALL PROTECTION: Detected real Clear All operation', {
                        hasDeletedFlags,
                        hasRecentClearAll,
                        deletedCount: deletedCheckins.length,
                        lastSync: this.lastSyncTime
                      });
                      
                      // Получаем время последнего локального элемента перед Clear All
                      // Если истории нет локально, используем время последней синхронизации как границу
                      const clearAllTimestamp = this.lastSyncTime ? new Date(this.lastSyncTime).getTime() : Date.now() - (24 * 60 * 60 * 1000); // 24 часа назад как fallback
                      
                      console.log('📊 Clear All protection: analyzing server items', {
                        localItems: localArray.length,
                        serverItems: serverArray.length,
                        clearAllTimestamp: new Date(clearAllTimestamp).toISOString(),
                        lastSync: this.lastSyncTime
                      });
                      
                      // Разделяем серверные элементы на старые (до Clear All) и новые (после Clear All)
                      const newServerItems = [];
                      const oldServerItems = [];
                      
                      serverArray.forEach(item => {
                        if (item && item.timestamp) {
                          const itemTimestamp = new Date(item.timestamp).getTime();
                          if (itemTimestamp > clearAllTimestamp) {
                            newServerItems.push(item);
                            console.log(`📋 NEW server item ${item.id}: ${item.type} (${new Date(item.timestamp).toISOString()})`);
                          } else {
                            oldServerItems.push(item);
                            console.log(`📋 OLD server item ${item.id}: ${item.type} (${new Date(item.timestamp).toISOString()}) - BLOCKED`);
                          }
                        } else {
                          // Элементы без timestamp считаем старыми
                          oldServerItems.push(item);
                          console.log(`📋 OLD server item ${item.id}: no timestamp - BLOCKED`);
                        }
                      });
                      
                      // Результат: только новые элементы с сервера
                      const protectedResult = [...newServerItems];
                      
                      // Сохраняем результат
                      this.set(this.getKeyConstant(key), protectedResult);
                      
                      mergeResults[key] = { 
                        action: 'smart_clear_all_protection', 
                        localCount: localArray.length, 
                        serverCount: serverArray.length,
                        mergedCount: protectedResult.length,
                        blockedItems: oldServerItems.length,
                        allowedItems: newServerItems.length
                      };
                      
                      console.log(`🔄 SYNC MERGE ${key}:`, {
                        localItems: localArray.length,
                        serverItems: serverArray.length,
                        mergedItems: protectedResult.length,
                        action: 'smart_clear_all_protection',
                        blockedOldItems: oldServerItems.length,
                        allowedNewItems: newServerItems.length
                      });
                      
                      // Если есть старые элементы на сервере, помечаем для синхронизации чтобы их очистить
                      if (oldServerItems.length > 0) {
                        this.markForSync();
                        console.log('🚀 MARKING FOR SYNC: Will clean old items from server');
                      }
                      
                      hasUpdates = newServerItems.length > 0;
                      
                      // Пропускаем дальнейшую обработку для этого ключа
                      return;
                    } else {
                      console.log('🆕 NO CLEAR ALL DETECTED: Treating as new session, loading all server history');
                      console.log('📥 New session: accepting all server history items:', serverArray.length);
                      
                      // Для новых сессий без признаков Clear All просто принимаем всю серверную историю
                      this.set(this.getKeyConstant(key), [...serverArray]);
                      
                      mergeResults[key] = { 
                        action: 'new_session_server_load', 
                        localCount: localArray.length, 
                        serverCount: serverArray.length,
                        mergedCount: serverArray.length
                      };
                      
                      console.log(`🔄 SYNC MERGE ${key}:`, {
                        localItems: localArray.length,
                        serverItems: serverArray.length,
                        mergedItems: serverArray.length,
                        action: 'new_session_server_load'
                      });
                      
                      hasUpdates = serverArray.length > 0;
                      
                      // Пропускаем дальнейшую обработку для этого ключа
                      return;
                    }
                  }
                }
              }
              
              // 🔧 ПРОВЕРКА ФЛАГА: Пропускаем дальнейшую обработку если установлен флаг
              if (skipFurtherProcessing) {
                console.log(`🔄 SKIPPING FURTHER PROCESSING for ${key} due to special handling`);
                return; // Пропускаем остальную логику merge для этого ключа
              }
              
              // Определяем стратегию мержа в зависимости от типа данных
              const isHistory = key === 'history';
              
              if (!hasLocalData && !hasServerData) {
                mergedData = [];
                mergeAction = 'both_empty';
              } else if (!hasLocalData && hasServerData) {
                mergedData = [...serverArray];
                mergeAction = 'loaded_from_server';
                hasUpdates = true;
              } else if (hasLocalData && !hasServerData) {
                mergedData = [...localArray];
                mergeAction = 'keeping_local_will_upload';
                // Mark for upload since server doesn't have our data
                this.markForSync();
              } else {
                // Оба массива содержат данные - выполняем умную стратегию
                if (isHistory) {
                    console.log('🔄 USING SIMPLE MERGE STRATEGY FOR HISTORY (local + new server)');
                    
                    // Простой merge: локальные остаются, серверные добавляются если их нет локально
                    const mergedMap = new Map();
                    
                    // Добавляем локальные элементы
                    localArray.forEach(item => {
                        if (item && item.id !== undefined) {
                            console.log(`📋 History item ${item.id}: adding local version`);
                            mergedMap.set(item.id, { ...item, source: 'local' });
                        }
                    });
                    
                    // Добавляем серверные элементы которых нет локально
                    serverArray.forEach(item => {
                        if (item && item.id !== undefined && !mergedMap.has(item.id)) {
                            console.log(`📋 History item ${item.id}: server-only item, adding`);
                            mergedMap.set(item.id, { ...item, source: 'server' });
                        }
                    });
                    
                    // Преобразуем map в массив
                    mergedData = Array.from(mergedMap.values()).map(item => {
                        const { source, ...itemWithoutSource } = item;
                        return itemWithoutSource;
                    });
                } else if (key === 'protocols') {
                    console.log('🔄 USING SMART CLIENT-FIRST FOR PROTOCOLS (respecting deletions + adding new server items)');
                    
                    // 🔧 ИСПРАВЛЕНИЕ: Используем client-first с добавлением новых серверных элементов
                    // Это уважает локальные удаления пользователя, но добавляет новые протоколы с сервера
                    
                    // Начинаем с локальных протоколов (уважаем удаления пользователя)
                    mergedData = [...localArray];
                    
                    // 🔧 ДЕДУПЛИКАЦИЯ локальных данных
                    mergedData = mergedData.filter((item, index, self) => 
                        index === self.findIndex(t => t.id === item.id)
                    );
                    
                    console.log(`🔄 STARTING WITH ${localArray.length} LOCAL PROTOCOLS (user's current selection)`);
                    
                    // 🔧 КРИТИЧНО: Предотвращаем бесконечный цикл с помощью Set для отслеживания обработанных протоколов
                    const processedProtocolIds = new Set();
                    let addedFromServer = 0;
                    
                    // Добавляем ТОЛЬКО новые протоколы с сервера (которых нет локально)
                    for (const serverItem of serverArray) {
                        // 🔧 КРИТИЧНО: Пропускаем уже обработанные протоколы
                        if (processedProtocolIds.has(serverItem.id)) {
                            console.log(`🔄 Protocol ${serverItem.id} already processed, skipping duplicate`);
                            continue;
                        }
                        processedProtocolIds.add(serverItem.id);
                        
                        const localItem = mergedData.find(m => m.id === serverItem.id);
                        if (!localItem) {
                            // 🔧 НОВОЕ: Проверяем не был ли этот протокол удален пользователем (timestamp-based)
                            const deletedProtocols = this.get('deletedProtocols') || [];
                            const isDeleted = deletedProtocols.some(deletionRecord => {
                                const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
                                return deletionId == serverItem.id || deletionId === serverItem.id;
                            });
                            
                            if (isDeleted) {
                                console.log(`🗑️ Protocol ${serverItem.id} was deleted by user, not restoring from server`);
                                continue; // Пропускаем удаленный протокол
                            }
                            
                            console.log(`📋 Protocol ${serverItem.id} found only on server, adding as new protocol`);
                            mergedData.push(serverItem);
                            hasUpdates = true;
                            addedFromServer++;
                        } else {
                            // Протокол существует локально - проверяем изменения (server-first для изменений)
                            const localTargets = localItem.targets || [];
                            const serverTargets = serverItem.targets || [];
                            const targetsChanged = !this.arraysEqual(localTargets, serverTargets);
                            const localWeight = localItem.weight || 0;
                            const serverWeight = serverItem.weight || 0;
                            const weightChanged = Math.abs(localWeight - serverWeight) > 0.001;
                            
                            if (targetsChanged || weightChanged) {
                                console.log(`🔄 Protocol ${serverItem.id} differs from local, updating with server version:`, {
                                    localTargets,
                                    serverTargets,
                                    targetsChanged,
                                    localWeight,
                                    serverWeight,
                                    weightChanged
                                });
                                
                                // Обновляем локальную версию серверными данными
                                const index = mergedData.findIndex(m => m.id === serverItem.id);
                                if (index !== -1) {
                                    const oldTargets = [...localTargets];
                                    const newTargets = [...serverTargets];
                                    mergedData[index] = { ...serverItem };
                                    
                                    // Запускаем пересчет истории
                                    setTimeout(() => {
                                        console.log(`⏰ EXECUTING SMART RECALCULATION for protocol ${serverItem.id}`);
                                        const recalcResult = this.recalculateProtocolHistory(serverItem.id, oldTargets, newTargets);
                                        if (recalcResult && window.App && window.App.showToast && !this._hasShownRecalcToast) {
                                          window.App.showToast('История ретроспективно пересчиталась', 'success');
                                          this._hasShownRecalcToast = true;
                                          setTimeout(() => {
                                            this._hasShownRecalcToast = false;
                                          }, 30000);
                                        }
                                    }, 100);
                                    hasUpdates = true;
                                }
                            } else {
                                console.log(`📋 Protocol ${serverItem.id} matches local version, keeping as is`);
                            }
                        }
                    }
                    
                    console.log(`✅ PROTOCOL MERGE COMPLETE: ${localArray.length} local + ${addedFromServer} new from server = ${mergedData.length} total`);
                    
                    // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ
                    mergedData = mergedData.filter((item, index, self) => 
                        index === self.findIndex(t => t.id === item.id)
                    );
                    
                    // 🔧 НОВОЕ: Применяем timestamp-based удаления для cross-device синхронизации
                    const deletedProtocols = this.get('deletedProtocols') || [];
                    if (deletedProtocols.length > 0) {
                        console.log('🗑️ APPLYING TIMESTAMP-BASED PROTOCOL DELETIONS...');
                        mergedData = this.applyTimestampBasedDeletions(mergedData, deletedProtocols, 'protocols');
                        if (mergedData.length < localArray.length) {
                            hasUpdates = true;
                            console.log('📤 PROTOCOL DELETIONS APPLIED: Marking for sync to update server');
                        }
                    }
                    
                    // 🚀 ВАЖНО: Если у нас меньше протоколов чем на сервере, отправляем наши данные
                    // Это информирует сервер об удалениях пользователя
                    if (mergedData.length < serverArray.length) {
                        console.log(`🚀 USER DELETIONS DETECTED: Local has ${mergedData.length}, server has ${serverArray.length}. Marking for sync to inform server of deletions.`);
                        this.markForSync();
                    }
                } else if (key === 'skills') {
                    console.log('🔄 USING SMART CLIENT-FIRST FOR SKILLS (respecting deletions + adding new server items)');
                    
                    // 🔧 ИСПРАВЛЕНИЕ: Используем client-first с добавлением новых серверных элементов
                    // Это уважает локальные удаления пользователя, но добавляет новые навыки с сервера
                    
                    // Начинаем с локальных навыков (уважаем удаления пользователя)
                    mergedData = [...localArray];
                    
                    // 🔧 ДЕДУПЛИКАЦИЯ локальных данных
                    mergedData = mergedData.filter((item, index, self) => 
                        index === self.findIndex(t => t.id === item.id)
                    );
                    
                    console.log(`🔄 STARTING WITH ${localArray.length} LOCAL SKILLS (user's current selection)`);
                    
                    // 🔧 КРИТИЧНО: Предотвращаем бесконечный цикл с помощью Set для отслеживания обработанных навыков
                    const processedSkillIds = new Set();
                    let addedFromServer = 0;
                    
                    for (const serverItem of serverArray) {
                        // 🔧 КРИТИЧНО: Пропускаем уже обработанные навыки
                        if (processedSkillIds.has(serverItem.id)) {
                            console.log(`🔄 Skill ${serverItem.id} already processed, skipping duplicate`);
                            continue;
                        }
                        processedSkillIds.add(serverItem.id);
                        
                        const localItem = mergedData.find(m => m.id === serverItem.id);
                        if (!localItem) {
                            // 🔧 НОВОЕ: Проверяем не был ли этот навык удален пользователем (timestamp-based)
                            const deletedSkills = this.get('deletedSkills') || [];
                            const isDeleted = deletedSkills.some(deletionRecord => {
                                const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
                                return deletionId == serverItem.id || deletionId === serverItem.id;
                            });
                            
                            if (isDeleted) {
                                console.log(`🗑️ Skill ${serverItem.id} was deleted by user, not restoring from server`);
                                continue; // Пропускаем удаленный навык
                            }
                            
                            console.log(`📋 Skill ${serverItem.id} found only on server, adding as new skill`);
                            mergedData.push(serverItem);
                            hasUpdates = true;
                            addedFromServer++;
                        } else {
                            // Навык существует локально - используем локальную версию (client-first для изменений)
                            console.log(`📋 Skill ${serverItem.id} exists in both, keeping local version (client-first)`);
                        }
                    }
                    
                    console.log(`✅ SKILL MERGE COMPLETE: ${localArray.length} local + ${addedFromServer} new from server = ${mergedData.length} total`);
                    
                    // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ
                    mergedData = mergedData.filter((item, index, self) => 
                        index === self.findIndex(t => t.id === item.id)
                    );
                    
                    // 🚀 ВАЖНО: Если у нас меньше навыков чем на сервере, отправляем наши данные
                    // Это информирует сервер об удалениях пользователя
                    if (mergedData.length < serverArray.length) {
                        console.log(`🚀 USER SKILL DELETIONS DETECTED: Local has ${mergedData.length}, server has ${serverArray.length}. Marking for sync to inform server of deletions.`);
                        this.markForSync();
                    }
                } else if (key === 'quickActions' || key === 'quickActionOrder') {
                    console.log(`🔄 USING RELIABLE FIRST-TIME DETECTION FOR ${key.toUpperCase()}`);
                    
                    // 🔧 НАДЕЖНОЕ ОПРЕДЕЛЕНИЕ: Используем простой флаг первого входа
                    const isFirstTime = this.isFirstTimeLogin === true;
                    
                    // 🐞 DEBUG: Подробные логи для отладки
                    console.log(`🐞 DEBUG ${key.toUpperCase()} SYNC:`, {
                      isFirstTime,
                      isFirstTimeLogin: this.isFirstTimeLogin,
                      localArrayLength: localArray.length,
                      serverArrayLength: serverArray.length,
                      lastSyncTime: this.lastSyncTime,
                      userEmail: this.currentUser?.email,
                      strategy: isFirstTime ? 'SERVER_FIRST' : 'CLIENT_FIRST',
                      localData: localArray,
                      serverData: serverArray
                    });
                    
                    if (isFirstTime) {
                        console.log(`🆕 FIRST TIME LOGIN for ${key}: Using server-first approach`);
                        console.log(`🐞 DEBUG: Server has ${serverArray.length} items:`, serverArray);
                        
                        // 🔧 ИСПРАВЛЕНИЕ: Для states учитываем deletedStates даже при first-time login
                        if (key === 'states') {
                            const deletedStates = this.get('deletedStates') || [];
                            console.log(`🔍 CHECKING DELETED STATES for first-time user:`, deletedStates);
                            
                            if (deletedStates.length > 0) {
                                // 🔧 ИСПРАВЛЕНИЕ: Применяем timestamp-based удаления для states при first-time login
                                console.log(`🗑️ FIRST TIME STATE FILTERING: Applying timestamp-based deletions`);
                                const filteredServerStates = this.applyTimestampBasedDeletions(serverArray, deletedStates, 'states');
                                console.log(`🗑️ FIRST TIME STATE FILTERING: Filtered out ${serverArray.length - filteredServerStates.length} deleted states`);
                                console.log(`📥 FIRST TIME: Loading ${filteredServerStates.length} states from server (${serverArray.length - filteredServerStates.length} deleted)`);
                                
                                mergedData = [...filteredServerStates];
                            } else {
                                // Нет удаленных states, загружаем все
                                mergedData = [...serverArray];
                                console.log(`📥 FIRST TIME: Loading ${serverArray.length} states from server (no deletions)`);
                            }
                        } else if (key === 'protocols') {
                            // 🔧 НОВОЕ: Применяем timestamp-based удаления даже для first-time users
                            const deletedProtocols = this.get('deletedProtocols') || [];
                            console.log(`🔍 CHECKING DELETED PROTOCOLS for first-time user:`, deletedProtocols);
                            
                            if (deletedProtocols.length > 0) {
                                console.log(`🗑️ FIRST TIME PROTOCOL FILTERING: Applying timestamp-based deletions`);
                                const filteredServerProtocols = this.applyTimestampBasedDeletions(serverArray, deletedProtocols, 'protocols');
                                console.log(`📥 FIRST TIME: Loading ${filteredServerProtocols.length} protocols from server (${serverArray.length - filteredServerProtocols.length} deleted)`);
                                mergedData = [...filteredServerProtocols];
                            } else {
                                // Нет удаленных protocols, загружаем все
                                mergedData = [...serverArray];
                                console.log(`📥 FIRST TIME: Loading ${serverArray.length} protocols from server (no deletions)`);
                            }
                        } else if (key === 'skills') {
                            // 🔧 НОВОЕ: Применяем timestamp-based удаления для skills при first-time login
                            const deletedSkills = this.get('deletedSkills') || [];
                            console.log(`🔍 CHECKING DELETED SKILLS for first-time user:`, deletedSkills);
                            
                            if (deletedSkills.length > 0) {
                                console.log(`🗑️ FIRST TIME SKILL FILTERING: Applying timestamp-based deletions`);
                                const filteredServerSkills = this.applyTimestampBasedDeletions(serverArray, deletedSkills, 'skills');
                                console.log(`📥 FIRST TIME: Loading ${filteredServerSkills.length} skills from server (${serverArray.length - filteredServerSkills.length} deleted)`);
                                mergedData = [...filteredServerSkills];
                            } else {
                                // Нет удаленных skills, загружаем все
                                mergedData = [...serverArray];
                                console.log(`📥 FIRST TIME: Loading ${serverArray.length} skills from server (no deletions)`);
                            }
                        } else {
                            // Для других типов данных - стандартное поведение
                            mergedData = [...serverArray];
                            console.log(`📥 FIRST TIME: Loading ${serverArray.length} ${key} items from server`);
                        }
                        
                        console.log(`🐞 DEBUG: Final merged data for first time:`, mergedData);
                        
                        // Если получили данные с сервера, это обновление
                        if (mergedData.length > 0) {
                            hasUpdates = true;
                        }
                        
                    } else {
                        console.log(`🔄 RETURNING USER for ${key}: Using client-first approach (respecting local changes)`);
                        console.log(`🐞 DEBUG: Local has ${localArray.length} items:`, localArray);
                        console.log(`🐞 DEBUG: Server has ${serverArray.length} items:`, serverArray);
                        
                        // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Умная обработка пустого сервера
                        // Если сервер пустой, а локально есть данные - это может быть удаление на другом устройстве
                        const serverIsEmpty = !hasServerData || serverArray.length === 0;
                        const localHasData = hasLocalData && localArray.length > 0;
                        const possibleServerDeletion = serverIsEmpty && localHasData && this.lastSyncTime;
                        
                        if (possibleServerDeletion) {
                            console.log(`🗑️ SERVER DELETION DETECTED for ${key}: Server is empty but local has data`);
                            console.log(`🗑️ This likely means items were deleted on another device`);
                            console.log(`🔄 Applying server state (empty) to respect deletions`);
                            
                            // Применяем серверное состояние (пустой массив)
                            mergedData = [];
                            hasUpdates = true;
                            
                            console.log(`✅ ${key} cleared to match server deletion`);
                        } else {
                            // Обычная client-first стратегия для returning users
                            mergedData = [...localArray];
                            
                            // 🔧 ИСПРАВЛЕНИЕ: Дедупликация для массивов ID  
                            if (Array.isArray(mergedData) && mergedData.length > 0) {
                                mergedData = [...new Set(mergedData)]; // Удаляем дубли ID
                            }
                            
                            // Добавляем только новые серверные элементы которых нет локально
                            for (const serverItem of serverArray) {
                              if (!mergedData.includes(serverItem)) {
                                console.log(`📋 ${key} item ${serverItem} found only on server, adding to local`);
                                mergedData.push(serverItem);
                                hasUpdates = true;
                              }
                            }
                            
                            // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ 
                            if (Array.isArray(mergedData)) {
                                mergedData = [...new Set(mergedData)];
                            }
                            
                            console.log(`🐞 DEBUG: Final merged data for returning user:`, mergedData);
                        }
                        
                        // 🔧 ИСПРАВЛЕНИЕ: Для returning users НЕ отмечаем для синхронизации если данные совпадают
                        // Это предотвращает перезапись серверных данных локальными
                        const hasLocalChanges = !this.arraysEqual(localArray, serverArray);
                        
                        if (hasLocalChanges && !possibleServerDeletion) {
                          console.log(`🚀 CLIENT-FIRST: Found local changes in ${key}, marking for sync`);
                          this.markForSync();
                        } else {
                          console.log(`📥 CLIENT-FIRST: No local ${key} changes or server deletion handled, NOT marking for sync`);
                        }
                    }
                } else {
                    console.log('🔄 USING SMART MERGE STRATEGY FOR DATA');
                    
                    // 🔧 СПЕЦИАЛЬНАЯ ОБРАБОТКА для STATES - используем надежное определение первого входа как у quickActions
                    if (key === 'states') {
                        console.log(`🔄 USING RELIABLE FIRST-TIME DETECTION FOR ${key.toUpperCase()}`);
                        
                        // 🔧 КРИТИЧНО: Очищаем deletedStates от undefined значений ПЕРЕД использованием
                        let deletedStates = this.get('deletedStates') || [];
                        const originalDeletedStatesLength = deletedStates.length;
                        deletedStates = deletedStates.filter(item => item !== undefined && item !== null && item !== '');
                        
                        if (deletedStates.length !== originalDeletedStatesLength) {
                            console.log(`🔧 CLEANED undefined items from deletedStates:`, {
                                before: originalDeletedStatesLength,
                                after: deletedStates.length,
                                filtered: originalDeletedStatesLength - deletedStates.length
                            });
                            // Сохраняем очищенный массив
                            this.set('deletedStates', deletedStates);
                        }
                        
                        // 🔧 НАДЕЖНОЕ ОПРЕДЕЛЕНИЕ: Используем простой флаг первого входа
                        const isFirstTime = this.isFirstTimeLogin === true;
                        
                        // 🐞 DEBUG: Подробные логи для отладки
                        console.log(`🐞 DEBUG ${key.toUpperCase()} SYNC:`, {
                          isFirstTime,
                          isFirstTimeLogin: this.isFirstTimeLogin,
                          localArrayLength: localArray.length,
                          serverArrayLength: serverArray.length,
                          lastSyncTime: this.lastSyncTime,
                          userEmail: this.currentUser?.email,
                          strategy: isFirstTime ? 'SERVER_FIRST' : 'CLIENT_FIRST',
                          localData: localArray,
                          serverData: serverArray,
                          deletedStatesCount: deletedStates.length
                        });

                        if (isFirstTime) {
                            console.log(`🆕 FIRST TIME LOGIN for ${key}: Using server-first approach`);
                            console.log(`🐞 DEBUG: Server has ${serverArray.length} items:`, serverArray);
                            
                            // Для первого входа используем server-first подход
                            mergedData = [...serverArray];
                            
                            console.log(`📥 FIRST TIME: Loading ${serverArray.length} ${key} items from server`);
                            console.log(`🐞 DEBUG: Final merged data for first time:`, mergedData);
                            
                            // Если получили данные с сервера, это обновление
                            if (serverArray.length > 0) {
                                hasUpdates = true;
                            }
                            
                        } else {
                            console.log(`🔄 RETURNING USER for ${key}: Using client-first approach (respecting local changes)`);
                            console.log(`🐞 DEBUG: Local has ${localArray.length} items:`, localArray);
                            console.log(`🐞 DEBUG: Server has ${serverArray.length} items:`, serverArray);
                            
                            // 🔧 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Умная обработка пустого сервера
                            // Если сервер пустой, а локально есть данные - это может быть удаление на другом устройстве
                            const serverIsEmpty = !hasServerData || serverArray.length === 0;
                            const localHasData = hasLocalData && localArray.length > 0;
                            const possibleServerDeletion = serverIsEmpty && localHasData && this.lastSyncTime;
                            
                            if (possibleServerDeletion) {
                                console.log(`🗑️ SERVER DELETION DETECTED for ${key}: Server is empty but local has data`);
                                console.log(`🗑️ This likely means items were deleted on another device`);
                                console.log(`🔄 Applying server state (empty) to respect deletions`);
                                
                                // Применяем серверное состояние (пустой массив)
                                mergedData = [];
                                hasUpdates = true;
                                
                                console.log(`✅ ${key} cleared to match server deletion`);
                            } else {
                                // Обычная client-first стратегия для returning users
                                mergedData = [...localArray];
                                
                                // 🔧 ИСПРАВЛЕНИЕ: Дедупликация для массивов объектов
                                if (Array.isArray(mergedData) && mergedData.length > 0) {
                                    mergedData = mergedData.filter((item, index, self) => 
                                        item && index === self.findIndex(t => t && t.id === item.id)
                                    );
                                }
                                
                                // Добавляем только новые серверные элементы которых нет локально
                                for (const serverItem of serverArray) {
                                    if (!serverItem || !serverItem.id) continue; // Пропускаем invalid элементы
                                    
                                    // 🔧 ИСПРАВЛЕНО: Используем очищенный массив deletedStates
                                    const isDeleted = deletedStates.some(deletionRecord => {
                                        const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
                                        return deletionId == serverItem.id || deletionId === serverItem.id;
                                    });
                                    
                                    if (isDeleted) {
                                        console.log(`🗑️ State ${serverItem.id} was deleted by user, not restoring from server`);
                                        continue; // Пропускаем удаленный state
                                    }
                                    
                                    const localItem = mergedData.find(m => m && m.id === serverItem.id);
                                    if (!localItem) {
                                        console.log(`📋 ${key} item ${serverItem.id} found only on server, adding to local`);
                                        mergedData.push(serverItem);
                                        hasUpdates = true;
                                    } else {
                                        console.log(`📋 ${key} item ${serverItem.id} exists in both local and server, keeping local version`);
                                    }
                                }
                                
                                // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ 
                                if (Array.isArray(mergedData)) {
                                    mergedData = mergedData.filter((item, index, self) => 
                                        item && index === self.findIndex(t => t && t.id === item.id)
                                    );
                                }
                                
                                console.log(`🐞 DEBUG: Final merged data for returning user:`, mergedData);
                            }
                            
                            // 🔧 ИСПРАВЛЕНИЕ: Для returning users НЕ отмечаем для синхронизации если данные совпадают
                            // Это предотвращает перезапись серверных данных локальными
                            const hasLocalChanges = !this.arraysEqual(localArray, serverArray);
                            
                            if (hasLocalChanges && !possibleServerDeletion) {
                              console.log(`🚀 CLIENT-FIRST: Found local changes in ${key}, marking for sync`);
                              this.markForSync();
                            } else {
                              console.log(`📥 CLIENT-FIRST: No local ${key} changes or server deletion handled, NOT marking for sync`);
                            }
                        }
                    } else if (key.includes('Order')) {
                        console.log(`🔄 DEFERRING ORDER ARRAY VALIDATION: ${key} (will process after data update)`);
                        
                        // Временно сохраняем локальные данные, обработаем после обновления всех данных
                        mergedData = [...localArray];
                        
                    } else {
                    // Для всех остальных данных - умная стратегия:
                    // 1. Локальные элементы остаются (если есть конфликт)
                    // 2. Серверные элементы добавляются (если их нет локально)
                    
                    // Сначала добавляем все локальные элементы
                    mergedData = [...localArray];
                    
                    // 🔧 ИСПРАВЛЕНИЕ: Фильтрация undefined элементов для deletedCheckins
                    if (key === 'deletedCheckins') {
                        mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        console.log(`🔧 FILTERED undefined items from local ${key}:`, {
                            before: localArray.length,
                            after: mergedData.length,
                            filtered: localArray.length - mergedData.length
                        });
                    }
                    
                    // 🔧 НОВОЕ: Фильтрация undefined элементов для deletedProtocols
                    if (key === 'deletedProtocols') {
                        mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        console.log(`🔧 FILTERED undefined items from local ${key}:`, {
                            before: localArray.length,
                            after: mergedData.length,
                            filtered: localArray.length - mergedData.length
                        });
                    }
                    
                    // 🔧 НОВОЕ: Фильтрация undefined элементов для deletedSkills
                    if (key === 'deletedSkills') {
                        mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        console.log(`🔧 FILTERED undefined items from local ${key}:`, {
                            before: localArray.length,
                            after: mergedData.length,
                            filtered: localArray.length - mergedData.length
                        });
                    }
                    
                    // 🔧 НОВОЕ: Фильтрация undefined элементов для deletedStates
                    if (key === 'deletedStates') {
                        mergedData = mergedData.filter(item => item !== undefined && item !== null && item !== '');
                        console.log(`🔧 FILTERED undefined items from local ${key}:`, {
                            before: localArray.length,
                            after: mergedData.length,
                            filtered: localArray.length - mergedData.length
                        });
                    }
                    
                    // Затем добавляем серверные элементы, которых нет локально
                    for (const item of serverArray) {
                        // 🔧 ИСПРАВЛЕНИЕ: Пропускаем undefined элементы
                        if (item === undefined || item === null) {
                            console.log(`🚫 Skipping undefined/null item in ${key}`);
                            continue;
                        }
                        
                        const existsLocally = mergedData.find(m => m && m.id === item.id);
                        if (existsLocally) {
                            console.log(`📋 ${key} item ${item.id} exists in both local and server, keeping local version`);
                        } else {
                            console.log(`📋 ${key} item ${item.id} found only on server, adding to local`);
                            mergedData.push(item);
                                hasUpdates = true;
                            }
                        }
                        
                        // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ и фильтрация
                        if (key === 'deletedCheckins') {
                            mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        } else if (key === 'deletedProtocols') {
                            mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        } else if (key === 'deletedSkills') {
                            mergedData = mergedData.filter(item => item !== undefined && item !== null);
                        } else if (key === 'deletedStates') {
                            // Убираем дублирующую фильтрацию - уже сделана выше
                            console.log(`📝 STATES: Skipping duplicate filtering (already done)`);
                        } else if (mergedData.length > 0 && mergedData[0] && typeof mergedData[0] === 'object' && mergedData[0].id) {
                            // Дедупликация для объектов с ID
                            mergedData = mergedData.filter((item, index, self) => 
                                item && index === self.findIndex(t => t && t.id === item.id)
                            );
                        }
                        }
                    }
                }
                
                // Определяем действие мержа для статистики
                const originalLocalCount = localArray.length;
                const originalServerCount = serverArray.length;
                const mergedCount = mergedData.length;
                
                if (mergedCount > originalLocalCount) {
                  mergeAction = `merged_gained_${mergedCount - originalLocalCount}_items`;
                  hasUpdates = true;
                } else if (mergedCount === originalLocalCount) {
                  mergeAction = 'no_new_items_found';
                } else {
                  mergeAction = `merged_deduplicated_${originalLocalCount - mergedCount}_items`;
                  hasUpdates = true;
                }
                
                // If merged data differs from server, mark for sync
              // 🚨 КРИТИЧНО: НЕ отправляем данные при server-first стратегии
              // если мы просто получили больше данных с сервера
              if (key === 'protocols' || key === 'skills' || key === 'quickActions' || key === 'quickActionOrder' || key === 'states') {
                // Для server-first стратегии отправляем данные ТОЛЬКО если есть 
                // новые локальные элементы которых нет на сервере
                if (key === 'quickActions' || key === 'quickActionOrder') {
                  // Для quickActions используем специальную логику - сравниваем массивы
                  const hasLocalChanges = !this.arraysEqual(localArray, serverArray);
                  if (hasLocalChanges) {
                    console.log(`🚀 SERVER-FIRST: Found local changes in ${key}, marking for sync`);
                    this.markForSync();
                  } else {
                    console.log(`📥 SERVER-FIRST: No new local ${key} changes, NOT marking for sync`);
                  }
                } else if (key === 'states') {
                  // Для states используем специальную логику - sync уже вызван внутри блока обработки states
                  console.log(`📥 SERVER-FIRST: States sync handling completed above`);
                } else {
                  // Для protocols используем client-first логику - sync уже выполнен в блоке выше
                  // Для skills проверяем новые элементы по ID
                  if (key === 'protocols') {
                    console.log(`📥 CLIENT-FIRST: Protocols sync handling completed above (respects deletions)`);
                  } else {
                    // Для skills проверяем новые элементы по ID
                    const hasNewLocalItems = localArray.some(localItem => 
                      !serverArray.find(serverItem => serverItem.id === localItem.id)
                    );
                    
                    // 🔧 ИСПРАВЛЕНИЕ: Для server-first стратегии НЕ отмечаем для синхронизации
                    // если сервер содержит больше данных чем локально (это восстановление, не загрузка)
                    const isRestorationScenario = serverArray.length > localArray.length;
                    
                    if (hasNewLocalItems) {
                      console.log(`🚀 SERVER-FIRST: Found new local ${key}, marking for sync`);
                      this.markForSync();
                    } else if (isRestorationScenario) {
                      console.log(`📥 SERVER-FIRST: Server has more ${key} than local (${serverArray.length} vs ${localArray.length}), NOT marking for sync (server restoration)`);
                    } else {
                      console.log(`📥 SERVER-FIRST: No new local ${key}, NOT marking for sync (preventing server data overwrite)`);
                    }
                  }
                }
              } else {
                // 🔧 КРИТИЧНО: Для истории НЕ помечаем для синхронизации если активна защита от Clear All
                if (key === 'history') {
                  const deletedCheckins = this.get('deletedCheckins') || [];
                  const needsClearAllProtection = this.clearAllInProgress || 
                    (localArray.length === 0 && deletedCheckins.length > 0) ||
                    (deletedCheckins.length > 0 && deletedCheckins.length >= localArray.length);
                  
                  if (needsClearAllProtection) {
                    if (serverArray.length > 0) {
                      console.log('🚀 CLEAR ALL SYNC: Server still has history items (', serverArray.length, '), marking for sync to enforce deletion');
                      this.markForSync();
                    } else {
                      console.log('✅ CLEAR ALL SYNC: Server history already empty, no additional sync marking needed');
                    }
                  } else {
                    // Стандартная проверка изменений для истории
                if (!this.arraysEqual(mergedData, serverArray)) {
                      console.log('📤 MARKING HISTORY FOR SYNC: Normal changes detected');
                  this.markForSync();
                    }
                  }
                } else {
                  // Для остальных типов данных используем старую логику
                  if (!this.arraysEqual(mergedData, serverArray)) {
                    this.markForSync();
                  }
                }
              }
              
              mergeResults[key] = { 
                action: mergeAction, 
                localCount: localArray.length, 
                serverCount: serverArray.length,
                mergedCount: mergedData.length
              };
              
              console.log(`🔄 SYNC MERGE ${key}:`, {
                localItems: localArray.length,
                serverItems: serverArray.length,
                mergedItems: mergedData.length,
                action: mergeAction
              });
              
              // Save merged data
              this.set(this.getKeyConstant(key), mergedData);
              
              // 🚀 КРИТИЧНО: Пересчет истории для обновленных протоколов
              if (key === 'protocols' && hasUpdates) {
                this.checkAndRecalculateProtocolHistory(localArray, mergedData);
              }

              // 🔄 КРИТИЧНО: После синхронизации протоколов проверяем, нужна ли дополнительная проверка истории
              // СТАРАЯ ЛОГИКА ЗАКОММЕНТИРОВАНА - теперь проверка выполняется ПОСЛЕ всех данных
              // чтобы избежать бесконечного цикла с server-first merge для истории
              if (false && key === 'protocols') {
                console.log('🔍 POST-SYNC PROTOCOL HISTORY VALIDATION starting...');
                const protocolsToCheck = mergedData.filter(protocol => protocol.targets && protocol.targets.length > 0);
                
                for (const protocol of protocolsToCheck) {
                  const protocolCheckins = this.getCheckins().filter(c => c.type === 'protocol' && c.protocolId === protocol.id);
                  const missingEffectsCheckins = protocolCheckins.filter(checkin => {
                    if (!checkin.changes) return true; // No changes at all
                    
                    // Check if all targets are present in changes
                    const hasAllTargets = protocol.targets.every(targetId => 
                      checkin.changes.hasOwnProperty(targetId)
                    );
                    return !hasAllTargets;
                  });
                  
                  if (missingEffectsCheckins.length > 0) {
                    console.log(`🚨 FOUND ${missingEffectsCheckins.length} CHECKINS MISSING TARGET EFFECTS for protocol ${protocol.id}`);
                    console.log(`📊 Protocol targets:`, protocol.targets);
                    console.log(`📋 Checkins to fix:`, missingEffectsCheckins.map(c => c.id));
                    
                    // Запускаем пересчет истории
                    const recalculated = this.recalculateProtocolHistory(protocol.id, [], protocol.targets);
                    if (recalculated) {
                      console.log(`✅ POST-SYNC RECALCULATION completed for protocol ${protocol.id}`);
                      
                      // 🔄 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ UI после пересчета
                      console.log('🖥️ Triggering UI refresh after post-sync recalculation...');
                      if (window.App && window.App.renderPage) {
                        window.App.renderPage(window.App.currentPage);
                        console.log('📄 UI refreshed after post-sync recalculation');
                      }
                      
                      // Показываем уведомление
                      if (window.App && window.App.showToast && !this._hasShownRecalcToast) {
                        window.App.showToast('История ретроспективно пересчиталась', 'success');
                        this._hasShownRecalcToast = true;
                        // Сбрасываем флаг через 30 секунд
                        setTimeout(() => {
                          this._hasShownRecalcToast = false;
                        }, 30000);
                      }
                    }
                  } else {
                    console.log(`✅ Protocol ${protocol.id} history is consistent`);
                  }
                }
                console.log('🏁 POST-SYNC PROTOCOL HISTORY VALIDATION completed');
              }
            }
          });
          
          // Log merge summary
          console.log('📊 MERGE RESULTS:', mergeResults);
          
          // 🔧 УПРОЩЕНИЕ: Убираем логику очистки флагов удаления - больше не нужна
          console.log('✅ SYNC MERGE COMPLETE: All data merged successfully');
          
          // 🔄 КРИТИЧНО: Обработка Order массивов ПОСЛЕ обновления всех данных
          console.log('🔧 PROCESSING DEFERRED ORDER ARRAYS...');
          
          // 🔧 ИСПРАВЛЕНИЕ: Исключаем timestamp поля из обработки order массивов
          const orderArraysToProcess = Object.keys(serverData.data).filter(key => 
            key.includes('Order') && !key.includes('_timestamp')
          );
          orderArraysToProcess.forEach(key => {
            const serverArray = serverData.data[key];
            
            // 🔧 ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА: Проверяем что serverArray является массивом
            if (!Array.isArray(serverArray)) {
              console.log(`🚫 SKIPPING ${key}: not an array (${typeof serverArray})`);
              return;
            }
            
            // 🔧 ИСПРАВЛЕНИЕ: Получаем АКТУАЛЬНЫЕ локальные данные из localStorage
            // а не используем userData который может содержать устаревшие данные
            const localStorageKey = this.getKeyConstant(key);
            
            // 🔄 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Используем this.get() вместо прямого localStorage.getItem()
            // Это обеспечивает правильную работу с пользовательскими ключами
            let localArray = [];
            if (localStorageKey) {
                const rawLocalData = this.get(key); // 🔧 ИСПРАВЛЕНИЕ: Используем key вместо localStorageKey
                if (rawLocalData && Array.isArray(rawLocalData)) {
                    localArray = rawLocalData;
                    console.log(`🔍 ${key} found in storage:`, localArray.length, 'items');
                } else {
                    console.log(`🔍 ${key} not found or invalid format in storage`);
                    localArray = [];
                }
            }
            
            console.log(`🔧 VALIDATING ORDER ARRAY: ${key}`);
            
            
            // Получаем актуальные данные для валидации (ПОСЛЕ обновления)
            let validIds = [];
            if (key === 'stateOrder') {
                const currentStates = this.getStates();
                validIds = currentStates.map(s => s.id);
            } else if (key === 'protocolOrder') {
                const currentProtocols = this.getProtocols();
                validIds = currentProtocols.map(p => p.id);
            } else if (key === 'skillOrder') {
                const currentSkills = this.getSkills();
                validIds = currentSkills.map(s => s.id);
            } else if (key === 'quickActionOrder') {
                const currentQuickActions = this.getQuickActions();
                validIds = currentQuickActions;
            }
            
            console.log(`🔍 VALIDATION ${key}:`, {
                validIds,
                localOrder: localArray,
                serverOrder: serverArray
            });
            
            // Фильтруем только валидные ID'шники из локального и серверного массива
            const validLocalIds = localArray.filter(id => validIds.includes(id));
            const validServerIds = serverArray.filter(id => validIds.includes(id));
            
            console.log(`🔍 FILTERED ${key}:`, {
                validLocal: validLocalIds,
                validServer: validServerIds,
                invalidLocalCount: localArray.length - validLocalIds.length,
                invalidServerCount: serverArray.length - validServerIds.length
            });
            
            // 🔄 ИСПРАВЛЕНИЕ: Если локальный порядок пустой, используем серверный порядок полностью
            let orderMergedData;
            if (validLocalIds.length === 0 && validServerIds.length > 0) {
                // 🔧 УМНАЯ TIMESTAMP-BASED СИНХРОНИЗАЦИЯ
                const localTimestamp = this.get(`${key}_timestamp`) || 0;
                const serverTimestamp = serverData[`${key}_timestamp`] || 0;
                
                console.log(`⏰ TIMESTAMP COMPARISON for ${key}:`, {
                    localTimestamp,
                    serverTimestamp,
                    localIsNewer: localTimestamp > serverTimestamp,
                    serverIsNewer: serverTimestamp > localTimestamp,
                    timeDifference: Math.abs(localTimestamp - serverTimestamp)
                });
                
                if (serverTimestamp > localTimestamp) {
                    console.log(`📥 ${key}: Using SERVER order (timestamp ${serverTimestamp} > ${localTimestamp})`);
                    orderMergedData = [...validServerIds];
                } else {
                    console.log(`💾 ${key}: Using LOCAL order (timestamp ${localTimestamp} >= ${serverTimestamp})`);
                    // Получаем актуальные локальные данные
                    const currentLocalOrder = this.get(key) || [];
                    const validCurrentOrder = currentLocalOrder.filter(id => validIds.includes(id));
                    orderMergedData = validCurrentOrder.length > 0 ? validCurrentOrder : [...validServerIds];
                }
            } else {
                // 🔧 УМНАЯ TIMESTAMP-BASED ЛОГИКА для случая когда есть и локальные и серверные данные
                const localTimestamp = this.get(`${key}_timestamp`) || 0;
                const serverTimestamp = serverData[`${key}_timestamp`] || 0;
                
                console.log(`⏰ SMART MERGE TIMESTAMP COMPARISON for ${key}:`, {
                    localTimestamp,
                    serverTimestamp,
                    localIsNewer: localTimestamp > serverTimestamp,
                    serverIsNewer: serverTimestamp > localTimestamp,
                    timeDifference: Math.abs(localTimestamp - serverTimestamp)
                });
                
                // 🔧 ДОПОЛНИТЕЛЬНОЕ ЛОГИРОВАНИЕ для отладки timestamp'ов  
                console.log(`🔍 DETAILED TIMESTAMP DEBUG for ${key} (SMART MERGE):`, {
                    key,
                    localTimestamp: {
                        value: localTimestamp,
                        type: typeof localTimestamp,
                        isValid: Number.isInteger(localTimestamp) && localTimestamp > 0,
                        dateString: localTimestamp > 0 ? new Date(localTimestamp).toISOString() : 'invalid'
                    },
                    serverTimestamp: {
                        value: serverTimestamp,
                        type: typeof serverTimestamp,
                        isValid: Number.isInteger(serverTimestamp) && serverTimestamp > 0,
                        dateString: serverTimestamp > 0 ? new Date(serverTimestamp).toISOString() : 'invalid'
                    },
                    validLocalIds: validLocalIds.length,
                    validServerIds: validServerIds.length,
                    serverDataKey: `${key}_timestamp`,
                    comparisonResult: localTimestamp > serverTimestamp ? 'LOCAL_NEWER' : 
                                    serverTimestamp > localTimestamp ? 'SERVER_NEWER' : 'EQUAL'
                });
                
                // 🔧 ДОПОЛНИТЕЛЬНОЕ ЛОГИРОВАНИЕ для отладки timestamp'ов (EMPTY LOCAL)
                console.log(`🔍 DETAILED TIMESTAMP DEBUG for ${key} (EMPTY LOCAL):`, {
                    key,
                    localTimestamp: {
                        value: localTimestamp,
                        type: typeof localTimestamp,
                        isValid: Number.isInteger(localTimestamp) && localTimestamp > 0,
                        dateString: localTimestamp > 0 ? new Date(localTimestamp).toISOString() : 'invalid'
                    },
                    serverTimestamp: {
                        value: serverTimestamp,
                        type: typeof serverTimestamp,
                        isValid: Number.isInteger(serverTimestamp) && serverTimestamp > 0,
                        dateString: serverTimestamp > 0 ? new Date(serverTimestamp).toISOString() : 'invalid'
                    },
                    validLocalIds: validLocalIds.length,
                    validServerIds: validServerIds.length,
                    serverDataKey: `${key}_timestamp`,
                    serverDataAllKeys: Object.keys(serverData).filter(k => k.includes('timestamp')),
                    comparisonResult: localTimestamp > serverTimestamp ? 'LOCAL_NEWER' : 
                                    serverTimestamp > localTimestamp ? 'SERVER_NEWER' : 'EQUAL'
                });
                
                if (serverTimestamp > localTimestamp) {
                    // Серверный порядок новее - используем его как основу
                    console.log(`📥 ${key}: SMART MERGE - Using SERVER order as base (newer timestamp)`);
                    orderMergedData = [...validServerIds];
                    
                    // Добавляем недостающие локальные элементы в конец
                    for (const localId of validLocalIds) {
                        if (!orderMergedData.includes(localId)) {
                            console.log(`📋 ${key} ID ${localId} found only locally, adding to server-based order`);
                            orderMergedData.push(localId);
                        } else {
                            console.log(`📋 ${key} ID ${localId} exists in both, keeping server position (newer timestamp)`);
                        }
                    }
                } else {
                    // Локальный порядок новее или равен - используем его как основу
                    console.log(`💾 ${key}: SMART MERGE - Using LOCAL order as base (newer/equal timestamp)`);
                    orderMergedData = [...validLocalIds];
                    
                    // Добавляем недостающие серверные элементы в конец
                    for (const serverId of validServerIds) {
                        if (!orderMergedData.includes(serverId)) {
                            console.log(`📋 ${key} ID ${serverId} found only on server, adding to local-based order`);
                            orderMergedData.push(serverId);
                        } else {
                            console.log(`📋 ${key} ID ${serverId} exists in both, keeping local position (newer/equal timestamp)`);
                        }
                    }
                }
            }
            
            console.log(`✅ ${key} VALIDATION COMPLETE:`, {
                finalOrder: orderMergedData,
                allValidIds: orderMergedData.every(id => validIds.includes(id))
            });
            
            // 🔧 ФИНАЛЬНАЯ ДЕДУПЛИКАЦИЯ для order массивов
            orderMergedData = [...new Set(orderMergedData)];
            
            // Обновляем статистику мержа для order массивов
            const originalLocalCount = localArray.length;
            const originalServerCount = serverArray.length;
            const mergedCount = orderMergedData.length;
            
            let orderMergeAction;
            if (mergedCount > originalLocalCount) {
              orderMergeAction = `merged_gained_${mergedCount - originalLocalCount}_items`;
            } else if (mergedCount === originalLocalCount) {
              orderMergeAction = 'no_new_items_found';
            } else {
              orderMergeAction = `merged_deduplicated_${originalLocalCount - mergedCount}_items`;
            }
            
            // Обновляем результаты мержа
            mergeResults[key] = { 
              action: orderMergeAction, 
              localCount: originalLocalCount, 
              serverCount: originalServerCount,
              mergedCount: orderMergedData.length
            };
            
            console.log(`🔄 DEFERRED SYNC MERGE ${key}:`, {
              localItems: originalLocalCount,
              serverItems: originalServerCount,
              mergedItems: orderMergedData.length,
              action: orderMergeAction
            });
            
            // Сохраняем обновленный order массив
            this.set(key, orderMergedData);
            
            // Помечаем для синхронизации если нужно
            if (!this.arraysEqual(orderMergedData, serverArray)) {
              this.markForSync();
            }
          });
          
          console.log('✅ DEFERRED ORDER ARRAYS PROCESSING COMPLETE');
          
          // 🔍 POST-SYNC PROTOCOL HISTORY VALIDATION starting (after all data synced)...
          const protocolsData = mergeResults.protocols?.mergedData || this.getProtocols();
          const protocolsToCheck = protocolsData.filter(protocol => protocol.targets && protocol.targets.length > 0);
          
          for (const protocol of protocolsToCheck) {
            const protocolCheckins = this.getCheckins().filter(c => c.type === 'protocol' && c.protocolId === protocol.id);
            const missingEffectsCheckins = protocolCheckins.filter(checkin => {
              if (!checkin.changes) return true; // No changes at all
              
              // Check if all targets are present in changes
              const hasAllTargets = protocol.targets.every(targetId => 
                checkin.changes.hasOwnProperty(targetId)
              );
              return !hasAllTargets;
            });
            
            if (missingEffectsCheckins.length > 0) {
              console.log(`🚨 FOUND ${missingEffectsCheckins.length} CHECKINS MISSING TARGET EFFECTS for protocol ${protocol.id}`);
              console.log(`📊 Protocol targets:`, protocol.targets);
              console.log(`📋 Checkins to fix:`, missingEffectsCheckins.map(c => c.id));
              
              // Запускаем пересчет истории
              const recalculated = this.recalculateProtocolHistory(protocol.id, [], protocol.targets);
              if (recalculated) {
                console.log(`✅ POST-SYNC RECALCULATION completed for protocol ${protocol.id}`);
                
                // 🔄 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ UI после пересчета
                console.log('🖥️ Triggering UI refresh after post-sync recalculation...');
                if (window.App && window.App.renderPage) {
                  window.App.renderPage(window.App.currentPage);
                  console.log('📄 UI refreshed after post-sync recalculation');
                }
                
                // Показываем уведомление
                if (window.App && window.App.showToast && !this._hasShownRecalcToast) {
                  window.App.showToast('История ретроспективно пересчиталась', 'success');
                  this._hasShownRecalcToast = true;
                  // Сбрасываем флаг через 30 секунд
                  setTimeout(() => {
                    this._hasShownRecalcToast = false;
                  }, 30000);
                }
              }
            } else {
              console.log(`✅ Protocol ${protocol.id} history is consistent`);
            }
          }
          console.log('🏁 POST-SYNC PROTOCOL HISTORY VALIDATION completed');

          // 🔍 АВТОМАТИЧЕСКАЯ ПРОВЕРКА ЦЕЛОСТНОСТИ ДАННЫХ
          await this.performDataIntegrityCheck();
          
          // Show user-friendly notification about merge results
          if (hasUpdates && window.App) {
            const deletedCheckinsCountForToast = (this.get('deletedCheckins') || []).length;
            const updates = Object.entries(mergeResults)
              .filter(([key, result]) => {
                // 🔧 ИСКЛЮЧАЕМ DELETION МАССИВЫ: Не показываем тосты для deletion records
                if (key.startsWith('deleted')) return false;
                
                // Exclude technical order arrays and empty gains from notifications
                if (key.includes('Order')) return false;
                if (key === 'quickActions' && result.action.includes('gained') && result.mergedCount - Math.min(result.localCount, result.serverCount) === 0) return false;
                if (key === 'quickActions' && result.action === 'no_new_items_found') return false;

                // 🛡️ Suppress history toast when Clear All deletion is active to avoid confusing user
                if (key === 'history' && deletedCheckinsCountForToast > 0) return false;

                // 🛡️ NEW: Suppress misleading history restoration toasts on fresh devices/incognito
                // When a user logs in from a fresh device, they shouldn't see "restored X items" 
                // if they intentionally cleared history on another device
                if (key === 'history' && (result.action.includes('gained') || result.action.includes('loaded'))) {
                  console.log('🚫 SUPPRESSING HISTORY RESTORATION TOAST: Preventing misleading notification about restored history');
                  return false;
                }

                return result.action.includes('gained') || result.action.includes('loaded');
              })
              .map(([key, result]) => `${key}: +${result.mergedCount - Math.min(result.localCount, result.serverCount)} items`);
            
            if (updates.length > 0) {
              window.App.showToast(`Sync: ${updates.join(', ')}`, 'success');
            }
          }
        }
        
        console.log('✅ SYNC COMPLETED SUCCESSFULLY');
        
        // 🔧 СБРАСЫВАЕМ ФЛАГ СИНХРОНИЗАЦИИ
        this.syncInProgress = false;
        
        // Do NOT clear deleted checkins list anymore
        // (we need to keep track of deletions permanently until they're processed by server)
        // this.set('deletedCheckins', []);
        
        // Update UI after successful sync
        if (window.App && window.App.renderPage) {
          console.log('🖥️ Refreshing UI after sync...');
          
          // Force update user stats first (important for dashboard)
          if (window.UI && window.UI.updateUserStats) {
            console.log('📊 Updating user stats after sync...');
            window.UI.updateUserStats();
          }
          
          // 🚀 ВАЖНО: Обновляем Quick Actions панель после синхронизации
          if (window.UI && window.UI.renderQuickProtocols) {
            console.log('⚡ Updating Quick Actions panel after sync...');
            window.UI.renderQuickProtocols();
          }
          
          // Use the correct renderPage method to refresh current view
          const currentPage = window.App.currentPage;
          console.log('Current page:', currentPage);
          
          if (currentPage) {
            window.App.renderPage(currentPage);
            console.log(`📄 ${currentPage} page refreshed via renderPage`);
            
            // Additional update for dashboard page to ensure stats are current
            if (currentPage === 'history') {
              setTimeout(() => {
                window.App.renderPage('history');
                console.log('📄 History page refreshed via renderPage');
              }, 100);
            } else if (currentPage === 'dashboard') {
              setTimeout(() => {
                window.App.renderPage('dashboard');
                console.log('📄 Dashboard page refreshed via renderPage');
                if (window.UI && window.UI.updateUserStats) {
                window.UI.updateUserStats();
                console.log('📊 Dashboard stats double-checked after sync');
                }
              }, 100);
            }
          } else {
            // Fallback to dashboard if no current page
            window.App.renderPage('dashboard');
            console.log('📄 Dashboard page rendered as fallback');
          }
        } else {
          // Last resort fallback
          console.log('🔄 App.renderPage not available, reloading page...');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('❌ SYNC FAILED - Server Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          user: this.currentUser?.email,
          isNewUser: !this.lastSyncTime
        });
        
        // Special handling for 500 errors with new users
        if (response.status === 500 && !this.lastSyncTime) {
          console.log('🆕 This might be a new user - server may need to initialize user data');
          console.log('📝 Server error details:', errorData);
          console.log('🔄 Trying to send minimal initial data...');
          
          // Try sending minimal data for new user initialization
          try {
            const minimalData = {
              protocols: [],
              skills: [],
              states: [],
              history: [],
              quickActions: [],
              quickActionOrder: [],
              protocolOrder: [],
              skillOrder: [],
              stateOrder: []
            };
            
            const retryResponse = await fetch(`${BACKEND_URL}/api/sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              },
              body: JSON.stringify(minimalData)
            });
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log('✅ Minimal data initialization successful:', retryData);
              return retryData;
            } else {
              const retryErrorText = await retryResponse.text();
              let retryErrorData;
              try {
                retryErrorData = JSON.parse(retryErrorText);
              } catch {
                retryErrorData = { error: retryErrorText };
              }
              console.log('❌ Failed to initialize new user:', retryErrorData);
            }
          } catch (initError) {
            console.error('❌ Error during new user initialization:', initError);
          }
        }
        
        throw new Error(`Server responded with ${response.status}: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error('❌ SYNC FAILED - Network/Code Error:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // 🔧 СБРАСЫВАЕМ ФЛАГ СИНХРОНИЗАЦИИ при ошибке
      this.syncInProgress = false;
      
      this.markForSync();
      throw error;
    }
  }

  // Mark data for sync when online
  markForSync() {
    this.pendingSync.add(Date.now());
  }

  // Force upload local data to server (used when local data is more complete)
  async forceUploadToServer() {
    if (!this.isOnline || !this.currentUser) {
      console.log('🚫 FORCE UPLOAD SKIPPED: offline or no user');
      return false;
    }
    
    console.log('🚀 FORCE UPLOAD: Sending local data to server...');
    
    try {
      const localData = {
        protocols: this.get(this.KEYS.PROTOCOLS) || [],
        skills: this.get(this.KEYS.SKILLS) || [],
        states: this.get(this.KEYS.STATES) || [],
        history: this.get(this.KEYS.HISTORY) || [],
        quickActions: this.get(this.KEYS.QUICK_ACTIONS) || [],
        quickActionOrder: this.get(this.KEYS.QUICK_ACTION_ORDER) || [],
        protocolOrder: this.get(this.KEYS.PROTOCOL_ORDER) || [],
        skillOrder: this.get(this.KEYS.SKILL_ORDER) || [],
        stateOrder: this.get(this.KEYS.STATE_ORDER) || []
      };
      
      console.log('📤 FORCE UPLOAD DATA:', {
        protocols: localData.protocols.length,
        skills: localData.skills.length,
        states: localData.states.length,
        history: localData.history.length,
        quickActions: localData.quickActions.length,
        quickActionOrder: localData.quickActionOrder.length,
        protocolOrder: localData.protocolOrder.length,
        skillOrder: localData.skillOrder.length,
        stateOrder: localData.stateOrder.length
      });
      
      const token = await this.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(localData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ FORCE UPLOAD SUCCESSFUL:', result);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ FORCE UPLOAD FAILED:', response.status, response.statusText, errorText);
        return false;
      }
    } catch (error) {
      console.error('❌ FORCE UPLOAD ERROR:', error);
      return false;
    }
  }

  // Sync pending changes when coming online
  async syncPendingChanges() {
    if (this.pendingSync.size > 0) {
      // Try to upload local data first if we have pending changes
      const uploadSuccess = await this.forceUploadToServer();
      if (uploadSuccess) {
        this.pendingSync.clear();
        console.log('✅ Pending changes uploaded to server');
      } else {
        console.warn('⚠️ Failed to upload pending changes, will retry later');
      }
    }
  }

  // Helper methods to check if data is default
  isDefaultProtocols(protocols) {
    if (!Array.isArray(protocols)) return false;
    return protocols.length === INITIAL_DATA.protocols.length && 
           protocols.every((p, i) => p.id === INITIAL_DATA.protocols[i].id);
  }

  isDefaultSkills(skills) {
    if (!Array.isArray(skills)) return false;
    return skills.length === INITIAL_DATA.skills.length && 
           skills.every((s, i) => s.id === INITIAL_DATA.skills[i].id);
  }

  isDefaultStates(states) {
    if (!Array.isArray(states)) return false;
    return states.length === INITIAL_DATA.states.length && 
           states.every((s, i) => s.id === INITIAL_DATA.states[i].id);
  }

  // Intelligently merge two data arrays, combining unique items from both sources
  mergeDataArrays(localArray, serverArray, dataType) {
    console.log(`🔀 MERGING ${dataType}:`, {
      local: localArray.length,
      server: serverArray.length,
      dataTypeCheck: dataType === 'history',
      dataTypeValue: dataType,
      dataTypeType: typeof dataType
    });
    
    // Create a map to track unique items by ID
    const mergedMap = new Map();
    
    // For history, we need special handling since items might be updated (recalculated)
    if (dataType === 'history') {
      console.log('🔄 USING LOCAL-FIRST STRATEGY FOR HISTORY (preserving recalculations)');
      
      // 🔧 КРИТИЧЕСКАЯ ЗАЩИТА ОТ CLEAR ALL
      // Проверяем если локальная история пуста но есть флаги удаления - это Clear All
      const deletedCheckins = this.get('deletedCheckins') || [];
      console.log('🚫 DELETED CHECKINS LIST:', { count: deletedCheckins.length, sample: deletedCheckins.slice(0, 5) });
      
      console.log('🔍 CLEAR ALL DETECTION CHECK:', {
        localHistoryLength: localArray.length,
        deletedCheckinsLength: deletedCheckins.length,
        condition: localArray.length === 0 && deletedCheckins.length > 0,
        timestamp: new Date().toISOString()
      });
      
      if (localArray.length === 0 && deletedCheckins.length > 0) {
        console.log('🚫 CLEAR ALL DETECTED: Local history is empty but deletion flags exist');
        console.log('🚫 BLOCKING ALL SERVER HISTORY RESTORATION after Clear All');
        console.log(`🚫 Ignoring ${serverArray.length} server items due to Clear All operation`);
        
        // Полностью блокируем восстановление - возвращаем структурированный результат
        console.log('✅ CLEAR ALL PROTECTION: History remains empty as intended. Returning structured empty merge result.');
        // If server had items, this is an update. If server also was empty, no real update from this merge.
        const updatesExist = serverArray.length > 0;
        return { mergedArray: [], hasUpdates: updatesExist, action: 'clear_all_protected_empty_history' };
      }
      
      console.log('📊 NORMAL HISTORY MERGE: Proceeding with regular merge logic');
      
      // Add all local items first for history (they have latest recalculated data)
      localArray.forEach(item => {
        if (item && item.id !== undefined) {
          mergedMap.set(item.id, { ...item, source: 'local' });
        }
      });
      
      // Only add server items that don't exist locally
      let addedFromServer = 0;
      serverArray.forEach(item => {
        if (item && item.id !== undefined) {
          // Skip if this item was intentionally deleted by user
          if (deletedCheckins.includes(item.id)) {
            console.log(`📋 History item ${item.id}: was deleted by user, not restoring from server`);
            return;
          }
          
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, { ...item, source: 'server' });
            addedFromServer++;
          } else {
            // For history, prefer local version (it has latest recalculated data)
            console.log(`📋 History item ${item.id} exists in both, keeping local version (has recalculations)`);
          }
        }
      });
      
      console.log(`🔄 HISTORY MERGE STRATEGY: Local-first merge, added ${addedFromServer} server-only items`);
    } else {
      console.log('🔄 USING LOCAL-FIRST STRATEGY FOR NON-HISTORY DATA');
      // For other data types, use the original local-first strategy
      // Add all local items first (preserving local version in case of conflicts)
      localArray.forEach(item => {
        if (item && item.id !== undefined) {
          mergedMap.set(item.id, { ...item, source: 'local' });
        }
      });
      
      // Add server items, but only if they don't exist locally
      let addedFromServer = 0;
      let duplicatesSkipped = 0;
      
      serverArray.forEach(item => {
        if (item && item.id !== undefined) {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, { ...item, source: 'server' });
            addedFromServer++;
          } else {
            duplicatesSkipped++;
            // Item exists in both - keeping local version for non-history data
            console.log(`📋 ${dataType} item ${item.id} exists in both local and server, keeping local version`);
          }
        }
      });
    }
    
    // Convert map back to array and remove source tracking
    const mergedArrayResult = Array.from(mergedMap.values()).map(item => { // Renamed to avoid conflict
      const { source, ...itemWithoutSource } = item;
      return itemWithoutSource;
    });
    
    // Sort by ID for consistency (if items have numeric IDs)
    if (mergedArrayResult.length > 0 && typeof mergedArrayResult[0].id === 'number') { // Use renamed variable
      mergedArrayResult.sort((a, b) => a.id - b.id); // Use renamed variable
    }
    
    console.log(`✅ MERGE ${dataType} COMPLETE:`, {
      localItems: localArray.length,
      serverItems: serverArray.length,
      mergedItems: mergedArrayResult.length, // Use renamed variable
      strategy: dataType === 'history' ? 'local-first' : 'local-first',
      netGain: mergedArrayResult.length - localArray.length // Use renamed variable
    });
    
    // Determine if there were actual updates based on comparison with original localArray
    // This is a simple check; more sophisticated checks might compare content if needed.
    const hasUpdates = localArray.length !== mergedArrayResult.length || 
                       !localArray.every((localItem, index) => mergedArrayResult[index] && localItem.id === mergedArrayResult[index].id); // Basic check

    return { mergedArray: mergedArrayResult, hasUpdates, action: `merged_items_${mergedArrayResult.length}` }; // Return object structure
  }

  // Check and recalculate protocol history after merging
  checkAndRecalculateProtocolHistory(localArray, mergedData) {
    console.log('🔄 Checking protocols for history recalculation after sync...');
    
    // 🔧 КРИТИЧНО: Блокируем пересчет протоколов во время Clear All
    // Это предотвращает бесконечные циклы синхронизации после Clear All
    if (this.clearAllInProgress) {
      console.log('🚫 PROTOCOL RECALCULATION BLOCKED: Clear All operation in progress');
      console.log('🚫 Preventing protocol recalculation sync loops during Clear All');
      return;
    }
    
    // 🔧 УМНАЯ ПРОВЕРКА: Блокируем только если это РЕАЛЬНО последствие Clear All
    // НЕ блокируем легитимные обновления протоколов
    const deletedCheckins = this.get('deletedCheckins') || [];
    const currentHistory = this.getCheckins();
    
    // Проверяем на РЕАЛЬНЫЙ Clear All: пустая история И недавние флаги удаления
    const hasEmptyHistory = currentHistory.length === 0;
    const hasRecentClearAll = this.lastSyncTime && (Date.now() - new Date(this.lastSyncTime).getTime()) < (5 * 60 * 1000); // 5 минут
    
    const isRealClearAllAftermath = hasEmptyHistory && deletedCheckins.length > 0 && hasRecentClearAll;
    
    if (isRealClearAllAftermath) {
      console.log('🚫 PROTOCOL BATCH RECALCULATION BLOCKED: Real Clear All aftermath detected', {
        historyLength: currentHistory.length,
        deletedFlagsCount: deletedCheckins.length,
        lastSyncTime: this.lastSyncTime,
        reason: 'Empty history + recent deletion flags'
      });
      console.log('🚫 Preventing batch protocol recalculation after Clear All to avoid sync loops');
      return;
    }
    
    // ✅ НЕ блокируем если есть история (легитимные обновления протоколов)
    if (currentHistory.length > 0) {
      console.log('✅ PROTOCOL BATCH RECALCULATION ALLOWED: History exists, these are legitimate protocol updates', {
        historyLength: currentHistory.length,
        deletedFlagsCount: deletedCheckins.length,
        protocolsToCheck: mergedData.length
      });
    }
    
    // Create maps for easier lookup
    const localProtocolsMap = new Map(localArray.map(p => [p.id, p]));
    const mergedProtocolsMap = new Map(mergedData.map(p => [p.id, p]));
    
    let totalRecalculated = 0;
    
    // Check each merged protocol to see if targets changed
    mergedData.forEach(mergedProtocol => {
      const localProtocol = localProtocolsMap.get(mergedProtocol.id);
      
      // If this is a new protocol from server, or targets/weight changed
      if (!localProtocol || 
          !this.arraysEqual(localProtocol.targets || [], mergedProtocol.targets || []) ||
          localProtocol.weight !== mergedProtocol.weight) {
        
        const oldTargets = localProtocol ? (localProtocol.targets || []) : [];
        const newTargets = mergedProtocol.targets || [];
        
        console.log(`🔄 Recalculating history for protocol ${mergedProtocol.id}:`, {
          oldTargets,
          newTargets,
          reason: !localProtocol ? 'new_from_server' : 'targets_or_weight_changed'
        });
        
        const wasRecalculated = this.recalculateProtocolHistory(mergedProtocol.id, oldTargets, newTargets);
        if (wasRecalculated) {
          totalRecalculated++;
        }
      }
    });
    
    if (totalRecalculated > 0) {
      console.log(`✅ Recalculated history for ${totalRecalculated} protocols after sync`);
      if (window.App) {
        window.App.showToast(`Updated ${totalRecalculated} protocol(s) retroactively`, 'info');
      }
    }
  }

  // Perform data integrity check
  async performDataIntegrityCheck() {
    try {
      console.log('🔍 INTEGRITY CHECK: Starting automatic data integrity verification...');
      
      if (!this.currentUser) {
        console.log('🔍 INTEGRITY CHECK: No authenticated user, skipping');
        return false;
      }
      
      let hasIssues = false;
      
      // Get server data for comparison
      const token = await this.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/sync?_integrity_check=true&_t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          protocols: [],
          skills: [],
          states: [],
          history: [],
          quickActions: [],
          quickActionOrder: [],
          protocolOrder: [],
          skillOrder: [],
          stateOrder: [],
          deletedCheckins: [],
          deletedProtocols: [],
          deletedSkills: []
        })
      });
      
      if (!response.ok) {
        console.warn('🔍 INTEGRITY CHECK: Failed to fetch server data for comparison');
        return false;
      }
      
      const serverResponse = await response.json();
      const serverData = serverResponse.data || {};
      
      // Get current local data
      const localProtocols = this.getProtocols();
      const localSkills = this.getSkills();
      const localStates = this.getStates();
      const deletedProtocols = this.get('deletedProtocols') || [];
      const deletedSkills = this.get('deletedSkills') || [];
      const deletedStates = this.get('deletedStates') || [];
      
      console.log('🔍 INTEGRITY CHECK: Server data comparison:', {
        localProtocolsCount: localProtocols.length,
        serverProtocolsCount: (serverData.protocols || []).length,
        localSkillsCount: localSkills.length,
        serverSkillsCount: (serverData.skills || []).length,
        localStatesCount: localStates.length,
        serverStatesCount: (serverData.states || []).length,
        deletedProtocolsCount: deletedProtocols.length,
        deletedSkillsCount: deletedSkills.length,
        deletedStatesCount: deletedStates.length
      });
      
      // Check for missing protocols (not in deleted list)
      const localProtocolIds = new Set(localProtocols.map(p => p.id));
      const missingProtocols = (serverData.protocols || []).filter(serverProtocol => {
        // Проверяем что протокол не существует локально
        if (localProtocolIds.has(serverProtocol.id)) return false;
        
        // 🔧 ИСПРАВЛЕНИЕ: Правильная проверка deletion records в timestamp-based формате
        const isDeleted = deletedProtocols.some(deletionRecord => {
          const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
          return deletionId == serverProtocol.id || deletionId === serverProtocol.id;
        });
        
        return !isDeleted;
      });
      
      if (missingProtocols.length > 0) {
        console.log('🚨 INTEGRITY CHECK: Found missing protocols on local device (respecting deletions):', missingProtocols.map(p => p.id));
        
        // 🔧 FIX: Add missing protocols to existing array, not replace
        const updatedProtocols = [...localProtocols, ...missingProtocols];
        this.set(this.KEYS.PROTOCOLS, updatedProtocols);
        hasIssues = true;
      }
      
      // Check for missing skills (not in deleted list)
      const localSkillIds = new Set(localSkills.map(s => s.id));
      const missingSkills = (serverData.skills || []).filter(serverSkill => {
        // Проверяем что навык не существует локально
        if (localSkillIds.has(serverSkill.id)) return false;
        
        // 🔧 ИСПРАВЛЕНИЕ: Правильная проверка deletion records в timestamp-based формате
        const isDeleted = deletedSkills.some(deletionRecord => {
          const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
          return deletionId == serverSkill.id || deletionId === serverSkill.id;
        });
        
        return !isDeleted;
      });
      
      if (missingSkills.length > 0) {
        console.log('🚨 INTEGRITY CHECK: Found missing skills on local device (respecting deletions):', missingSkills.map(s => s.id));
        
        // 🔧 FIX: Add missing skills to existing array, not replace
        const updatedSkills = [...localSkills, ...missingSkills];
        this.set(this.KEYS.SKILLS, updatedSkills);
        hasIssues = true;
      }
      
      // Check for missing states (not in deleted list)
      const localStateIds = new Set(localStates.map(s => s.id));
      const missingStates = (serverData.states || []).filter(serverState => {
        // Проверяем что состояние не существует локально
        if (localStateIds.has(serverState.id)) return false;
        
        // 🔧 ИСПРАВЛЕНИЕ: Правильная проверка deletion records в timestamp-based формате
        const isDeleted = deletedStates.some(deletionRecord => {
          const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
          return deletionId == serverState.id || deletionId === serverState.id;
        });
        
        return !isDeleted;
      });
      
      if (missingStates.length > 0) {
        console.log('🚨 INTEGRITY CHECK: Found missing states on local device (respecting deletions):', missingStates.map(s => s.id));
        
        // 🔧 FIX: Add missing states to existing array, not replace
        const updatedStates = [...localStates, ...missingStates];
        this.set(this.KEYS.STATES, updatedStates);
        hasIssues = true;
      }
      
      if (hasIssues) {
        console.log('🔧 INTEGRITY CHECK: Fixed data discrepancies (respecting user deletions):', [
          `protocols: +${missingProtocols.length}`,
          `skills: +${missingSkills.length}`,
          `states: +${missingStates.length}`
        ]);
        
        // Refresh UI
        if (typeof UI !== 'undefined' && UI.renderPage) {
          const currentPage = window.App?.currentPage || 'dashboard';
          UI.renderPage(currentPage);
          console.log('🖥️ UI refreshed after integrity check fixes');
          
          // Update Quick Actions panel if affected
          if (typeof UI.updateQuickActionsPanel === 'function') {
            UI.updateQuickActionsPanel();
            console.log('⚡ Updating Quick Actions panel after integrity check...');
          }
        }
      } else {
        console.log('✅ INTEGRITY CHECK: All data is consistent (deletions respected)');
      }
      
      return hasIssues;
      
    } catch (error) {
      console.error('❌ INTEGRITY CHECK FAILED:', error);
      return false;
    }
  }

  // Clear the list of deleted skills (for debugging)
  clearDeletedSkills() {
    this.set('deletedSkills', []);
    console.log('🗑️ Deleted skills list cleared');
  }

  // Debug function to clear undefined elements from deletedCheckins
  clearDeletedCheckins() {
    console.log('🧹 CLEANING DELETED CHECKINS: Removing undefined elements...');
    
    const currentDeleted = this.get('deletedCheckins') || [];
    const before = currentDeleted.length;
    
    // Filter out undefined, null, and empty string elements
    const cleaned = currentDeleted.filter(item => 
      item !== undefined && 
      item !== null && 
      item !== '' && 
      typeof item !== 'undefined'
    );
    
    const after = cleaned.length;
    const removed = before - after;
    
    this.set('deletedCheckins', cleaned);
    
    console.log('🧹 DELETED CHECKINS CLEANUP COMPLETE:', {
      before,
      after,
      removed,
      sample: cleaned.slice(0, 5)
    });
    
    return {
      before,
      after,
      removed
    };
  }

  // Clear deleted states list (for debugging and fixing sync issues)
  clearDeletedStates() {
    console.log('🧹 CLEARING DELETED STATES LIST...');
    const deletedStates = this.get('deletedStates') || [];
    console.log('🔍 Before clearing:', deletedStates);
    this.set('deletedStates', []);
    console.log('✅ Deleted states list cleared');
    return { cleared: true, previousCount: deletedStates.length };
  }

  // Clean undefined values from deletedStates (for fixing sync issues)
  cleanDeletedStates() {
    console.log('🧹 CLEANING UNDEFINED VALUES FROM DELETED STATES...');
    const deletedStates = this.get('deletedStates') || [];
    const originalLength = deletedStates.length;
    const cleanedStates = deletedStates.filter(item => item !== undefined && item !== null && item !== '');
    
    console.log('🔍 Cleaning results:', {
      before: originalLength,
      after: cleanedStates.length,
      filtered: originalLength - cleanedStates.length,
      cleanedStates: cleanedStates
    });
    
    this.set('deletedStates', cleanedStates);
    console.log('✅ Deleted states cleaned');
    return { 
      cleaned: true, 
      filteredCount: originalLength - cleanedStates.length,
      finalCount: cleanedStates.length 
    };
  }

  // ===== CLEANUP METHODS =====
  
  // 🔧 КРИТИЧНО: Очистка undefined значений из deleted массивов
  cleanupDeletedArrays() {
    console.log('🧹 CLEANUP: Starting deleted arrays cleanup...');
    
    const deletedKeys = [
      'deletedCheckins',
      'deletedProtocols', 
      'deletedSkills',
      'deletedStates',
      'deletedQuickActions'
    ];
    
    let totalCleaned = 0;
    
    deletedKeys.forEach(key => {
      const array = this.get(key) || [];
      const before = array.length;
      
      // 🔧 УСИЛЕННАЯ ФИЛЬТРАЦИЯ: Убираем undefined, null, '', и любые не-примитивные значения
      const cleaned = array.filter(item => {
        return item !== undefined && 
               item !== null && 
               item !== '' &&
               typeof item !== 'undefined' &&
               (typeof item === 'string' || typeof item === 'number') &&
               String(item).trim() !== '';
      });
      
      const after = cleaned.length;
      const removedCount = before - after;
      
      if (removedCount > 0) {
        this.set(key, cleaned);
        console.log(`🧹 CLEANED ${key}: removed ${removedCount} undefined/null items (${before} → ${after})`);
        totalCleaned += removedCount;
        
        // 🔧 ПРИНУДИТЕЛЬНАЯ СИНХРОНИЗАЦИЯ для каждого очищенного массива
        console.log(`🚀 FORCING SYNC for cleaned ${key}`);
      } else {
        console.log(`✅ ${key}: no cleanup needed (${before} items)`);
      }
    });
    
    if (totalCleaned > 0) {
      console.log(`🧹 CLEANUP COMPLETE: Removed ${totalCleaned} undefined/null items total`);
      // Синхронизируем очищенные данные
      this.markForSync();
    } else {
      console.log('🧹 CLEANUP: No undefined values found');
    }
  }
  
  // 🔧 НОВОЕ: Отладочная функция для диагностики Quick Actions
  async debugQuickActionsSync() {
    console.log('🔍 QUICK ACTIONS DEBUG: Starting comprehensive check...');
    
    // Локальные данные
    const localQuickActions = this.get(this.KEYS.QUICK_ACTIONS) || [];
    const localQuickActionOrder = this.get(this.KEYS.QUICK_ACTION_ORDER) || [];
    
    console.log('📱 LOCAL QUICK ACTIONS:', {
      quickActionsCount: localQuickActions.length,
      quickActionOrderCount: localQuickActionOrder.length,
      quickActionsData: localQuickActions,
      quickActionOrderData: localQuickActionOrder,
      localStorage: {
        quickActions: localStorage.getItem(this.KEYS.QUICK_ACTIONS),
        quickActionOrder: localStorage.getItem(this.KEYS.QUICK_ACTION_ORDER)
      }
    });
    
    // Проверяем сервер
    if (!this.isOnline || !this.currentUser) {
      console.log('🚫 Cannot check server: offline or no user');
      return;
    }
    
    try {
      const token = await this.currentUser.getIdToken();
      const response = await fetch(`${BACKEND_URL}/api/sync?_t=${Date.now()}&_cb=${Math.random()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify({
          quickActions: localQuickActions,
          quickActionOrder: localQuickActionOrder
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌐 SERVER QUICK ACTIONS:', {
          serverQuickActionsCount: data.data.quickActions?.length || 0,
          serverQuickActionOrderCount: data.data.quickActionOrder?.length || 0,
          serverQuickActionsData: data.data.quickActions || [],
          serverQuickActionOrderData: data.data.quickActionOrder || [],
          fullServerResponse: data
        });
        
        // Сравнение
        const localCount = localQuickActions.length;
        const serverCount = data.data.quickActions?.length || 0;
        
        if (localCount !== serverCount) {
          console.log('⚠️ QUICK ACTIONS MISMATCH:', {
            local: localCount,
            server: serverCount,
            difference: localCount - serverCount,
            possibleCause: localCount > serverCount ? 'Server not saving local changes' : 'Server has data not synced locally'
          });
        } else {
          console.log('✅ QUICK ACTIONS COUNT MATCH');
        }
      } else {
        console.error('🚨 Server request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('🚨 Quick Actions debug failed:', error);
    }
  }

  // 🔧 НОВОЕ: Обработка timestamp-based удалений для cross-device синхронизации
  applyTimestampBasedDeletions(localArray, deletedArray, dataType) {
    if (!Array.isArray(localArray) || !Array.isArray(deletedArray)) {
      return localArray;
    }
    
    console.log(`🗑️ APPLYING TIMESTAMP DELETIONS for ${dataType}:`, {
      localCount: localArray.length,
      deletedRecordsCount: deletedArray.length,
      deletedRecords: deletedArray
    });
    
    let filteredArray = [...localArray];
    let deletedCount = 0;
    
    deletedArray.forEach(deletionRecord => {
      // 🔧 ОБРАТНАЯ СОВМЕСТИМОСТЬ: Поддерживаем как старый формат (простой ID), так и новый (объект с timestamp)
      const deletionId = typeof deletionRecord === 'object' ? deletionRecord.id : deletionRecord;
      const deletionTimestamp = typeof deletionRecord === 'object' ? deletionRecord.deletedAt : 0;
      
      // Ищем элемент в локальном массиве
      const itemIndex = filteredArray.findIndex(item => {
        // 🔧 УНИВЕРСАЛЬНОЕ СРАВНЕНИЕ ID (поддержка string/number)
        return item.id == deletionId || item.id === deletionId;
      });
      
      if (itemIndex !== -1) {
        const localItem = filteredArray[itemIndex];
        
        // 🔧 УМНОЕ ПОЛУЧЕНИЕ TIMESTAMP ЭЛЕМЕНТА
        let itemTimestamp = this.getItemTimestamp(localItem, dataType);
        
        console.log(`🔍 DELETION CHECK for ${dataType} ID ${deletionId}:`, {
          deletionRecord: typeof deletionRecord === 'object' ? {
            id: deletionRecord.id,
            deletedAt: deletionRecord.deletedAt,
            deletedAtISO: new Date(deletionRecord.deletedAt || 0).toISOString(),
            name: deletionRecord.name
          } : `Simple ID: ${deletionRecord}`,
          itemTimestamp: {
            value: itemTimestamp,
            iso: itemTimestamp > 0 ? new Date(itemTimestamp).toISOString() : 'no timestamp',
            source: this.getTimestampSource(localItem, dataType)
          },
          comparison: {
            deletionIsNewer: deletionTimestamp > itemTimestamp,
            shouldDelete: deletionTimestamp >= itemTimestamp,
            timeDifference: Math.abs(deletionTimestamp - itemTimestamp)
          },
          itemName: localItem.name || 'Unknown'
        });
        
        // 🔧 ЛОГИКА УДАЛЕНИЯ:
        // 1. Если старый формат (deletionTimestamp = 0) - удаляем всегда (обратная совместимость)
        // 2. Если новый формат - удаляем только если timestamp удаления >= timestamp элемента
        const shouldDelete = deletionTimestamp === 0 || deletionTimestamp >= itemTimestamp;
        
        if (shouldDelete) {
          const reason = deletionTimestamp === 0 ? 'legacy deletion (no timestamp)' : 
                        `deletion timestamp ${new Date(deletionTimestamp).toISOString()} >= item timestamp ${new Date(itemTimestamp).toISOString()}`;
          
          console.log(`🗑️ CROSS-DEVICE DELETION: Removing ${dataType} ID ${deletionId} - ${reason}`);
          filteredArray.splice(itemIndex, 1);
          deletedCount++;
        } else {
          console.log(`⏭️ SKIPPING DELETION: ${dataType} ID ${deletionId} was modified after deletion (item: ${new Date(itemTimestamp).toISOString()} > deletion: ${new Date(deletionTimestamp).toISOString()})`);
        }
      } else {
        console.log(`👻 DELETION RECORD: ${dataType} ID ${deletionId} not found locally (already deleted or never existed)`);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ TIMESTAMP DELETIONS APPLIED for ${dataType}:`, {
        removedCount: deletedCount,
        remainingCount: filteredArray.length,
        originalCount: localArray.length
      });
    } else {
      console.log(`🔄 NO DELETIONS APPLIED for ${dataType}: All items up to date or protected by timestamps`);
    }
    
    return filteredArray;
  }
  
  // 🔧 НОВОЕ: Получение timestamp элемента для сравнения с timestamp удаления
  getItemTimestamp(item, dataType) {
    if (!item) return 0;
    
    // 🔧 ПРИОРИТЕТНЫЙ ПОРЯДОК ПОИСКА TIMESTAMP:
    // 1. lastModified (явно установленный timestamp изменения)
    // 2. updatedAt (стандартное поле обновления)
    // 3. createdAt (timestamp создания)
    // 4. id если это timestamp (для history записей)
    // 5. 0 (элемент без timestamp - всегда удаляется)
    
    // Явные timestamp поля
    if (item.lastModified && typeof item.lastModified === 'number') {
      return item.lastModified;
    }
    
    if (item.updatedAt) {
      const timestamp = typeof item.updatedAt === 'string' ? 
                       new Date(item.updatedAt).getTime() : item.updatedAt;
      if (!isNaN(timestamp)) return timestamp;
    }
    
    if (item.createdAt) {
      const timestamp = typeof item.createdAt === 'string' ? 
                       new Date(item.createdAt).getTime() : item.createdAt;
      if (!isNaN(timestamp)) return timestamp;
    }
    
    // 🔧 СПЕЦИАЛЬНАЯ ЛОГИКА для History записей - ID это timestamp
    if (dataType === 'history' && typeof item.id === 'number' && item.id > 1000000000000) {
      return item.id;
    }
    
    // 🔧 СПЕЦИАЛЬНАЯ ЛОГИКА для Quick Actions - используем addedAt если есть
    if (dataType === 'quickActions' && item.addedAt) {
      const timestamp = typeof item.addedAt === 'string' ? 
                       new Date(item.addedAt).getTime() : item.addedAt;
      if (!isNaN(timestamp)) return timestamp;
    }
    
    // 🔧 FALLBACK: Если нет timestamp - элемент считается "старым" (timestamp = 0)
    // Это означает что любое удаление с timestamp удалит такой элемент
    return 0;
  }
  
  // 🔧 НОВОЕ: Определение источника timestamp для логирования
  getTimestampSource(item, dataType) {
    if (!item) return 'no item';
    
    if (item.lastModified && typeof item.lastModified === 'number') {
      return 'lastModified';
    }
    
    if (item.updatedAt) {
      return 'updatedAt';
    }
    
    if (item.createdAt) {
      return 'createdAt';
    }
    
    if (dataType === 'history' && typeof item.id === 'number' && item.id > 1000000000000) {
      return 'id (timestamp)';
    }
    
    if (dataType === 'quickActions' && item.addedAt) {
      return 'addedAt';
    }
    
    return 'no timestamp (legacy)';
  }
}

// Create global instance
window.Storage = new Storage();

