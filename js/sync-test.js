// ===== sync-test.js - Тестирование синхронизации в реальном времени =====

// 🆕 НОВОЕ: Тестирование синхронизации весов протоколов
window.testProtocolWeightSync = async function() {
    console.log('🧪 TESTING PROTOCOL WEIGHT SYNC...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    try {
        // Получаем все протоколы
        const protocols = window.Storage.getProtocols();
        if (protocols.length === 0) {
            console.log('❌ No protocols found');
            return;
        }
        
        // Берем первый протокол
        const testProtocol = protocols[0];
        const originalWeight = testProtocol.weight;
        
        console.log('📊 Original protocol weight:', {
            id: testProtocol.id,
            name: testProtocol.name.split('. ')[0],
            weight: originalWeight
        });
        
        // Немного изменяем вес
        const newWeight = originalWeight + 0.1;
        console.log('📊 Changing weight to:', newWeight);
        
        // Обновляем протокол (это должно вызвать критическую синхронизацию)
        const updatedProtocol = await window.Storage.updateProtocolFull(testProtocol.id, {
            name: testProtocol.name.split('. ')[0],
            description: testProtocol.name.includes('. ') ? testProtocol.name.split('. ').slice(1).join('. ') : '',
            icon: testProtocol.icon,
            hover: testProtocol.hover || '',
            weight: newWeight,
            targets: testProtocol.targets || [],
            color: testProtocol.color,
            groupId: testProtocol.groupId
        });
        
        console.log('✅ Protocol weight updated locally');
        console.log('⏳ Critical sync should trigger automatically...');
        
        // Проверяем через 10 секунд
        setTimeout(async () => {
            const updatedProtocols = window.Storage.getProtocols();
            const finalProtocol = updatedProtocols.find(p => p.id === testProtocol.id);
            
            console.log('📊 Protocol weight after sync:', {
                id: finalProtocol.id,
                name: finalProtocol.name.split('. ')[0],
                weight: finalProtocol.weight,
                changed: finalProtocol.weight !== originalWeight
            });
            
            // Возвращаем исходный вес
            await window.Storage.updateProtocolFull(testProtocol.id, {
                name: finalProtocol.name.split('. ')[0],
                description: finalProtocol.name.includes('. ') ? finalProtocol.name.split('. ').slice(1).join('. ') : '',
                icon: finalProtocol.icon,
                hover: finalProtocol.hover || '',
                weight: originalWeight,
                targets: finalProtocol.targets || [],
                color: finalProtocol.color,
                groupId: finalProtocol.groupId
            });
            
            console.log('🔄 Restored original weight');
        }, 10000);
        
    } catch (error) {
        console.error('❌ Protocol weight sync test failed:', error);
    }
};

// 🆕 НОВОЕ: Тестирование cross-device синхронизации
window.testCrossDeviceSync = async function() {
    console.log('🧪 TESTING CROSS-DEVICE SYNC...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    try {
        const beforeSync = {
            protocols: window.Storage.getProtocols().length,
            innerfaces: window.Storage.getInnerfaces().length,
            states: window.Storage.getStates().length,
            history: window.Storage.getCheckins().length,
            quickActions: window.Storage.getQuickActions().length
        };
        
        console.log('📊 Before sync:', beforeSync);
        
        // Выполняем синхронизацию
        await window.Storage.syncWithBackend();
        
        const afterSync = {
            protocols: window.Storage.getProtocols().length,
            innerfaces: window.Storage.getInnerfaces().length,
            states: window.Storage.getStates().length,
            history: window.Storage.getCheckins().length,
            quickActions: window.Storage.getQuickActions().length
        };
        
        console.log('📊 After sync:', afterSync);
        
        // Показываем изменения
        Object.keys(beforeSync).forEach(key => {
            const diff = afterSync[key] - beforeSync[key];
            if (diff !== 0) {
                console.log(`📈 ${key}: ${diff > 0 ? '+' : ''}${diff}`);
            }
        });
        
        console.log('✅ Sync test completed');
        
    } catch (error) {
        console.error('❌ Sync test failed:', error);
    }
};

// 🆕 НОВОЕ: Мониторинг синхронизации в реальном времени
window.monitorSync = function() {
    console.log('📡 MONITORING SYNC ACTIVITY...');
    console.log('Use stopMonitorSync() to stop monitoring');
    
    if (window.syncMonitor) {
        console.log('Monitor already running');
        return;
    }
    
    let syncCount = 0;
    let lastSyncTime = Date.now();
    
    // Перехватываем вызовы syncWithBackend
    const originalSync = window.Storage.syncWithBackend;
    
    window.Storage.syncWithBackend = async function(...args) {
        syncCount++;
        const now = Date.now();
        const timeSinceLastSync = now - lastSyncTime;
        
        console.log(`🔄 SYNC ${syncCount}: Started (${timeSinceLastSync}ms since last)`);
        
        try {
            const result = await originalSync.apply(this, args);
            console.log(`✅ SYNC ${syncCount}: Completed successfully`);
            return result;
        } catch (error) {
            console.error(`❌ SYNC ${syncCount}: Failed:`, error);
            throw error;
        } finally {
            lastSyncTime = now;
        }
    };
    
    window.syncMonitor = originalSync;
    
    // Также мониторим критические синхронизации
    const originalCriticalSync = window.Storage.forceCriticalSync;
    if (originalCriticalSync) {
        window.Storage.forceCriticalSync = async function(...args) {
            console.log('🚨 CRITICAL SYNC: Started:', args);
            
            try {
                const result = await originalCriticalSync.apply(this, args);
                console.log('✅ CRITICAL SYNC: Completed successfully');
                return result;
            } catch (error) {
                console.error('❌ CRITICAL SYNC: Failed:', error);
                throw error;
            }
        };
        
        window.criticalSyncMonitor = originalCriticalSync;
    }
};

// 🆕 НОВОЕ: Остановка мониторинга
window.stopMonitorSync = function() {
    console.log('🛑 STOPPING SYNC MONITOR...');
    
    if (window.syncMonitor) {
        window.Storage.syncWithBackend = window.syncMonitor;
        window.syncMonitor = null;
        console.log('✅ Sync monitor stopped');
    }
    
    if (window.criticalSyncMonitor) {
        window.Storage.forceCriticalSync = window.criticalSyncMonitor;
        window.criticalSyncMonitor = null;
        console.log('✅ Critical sync monitor stopped');
    }
};

// 🆕 НОВОЕ: Проверка истории консистентности
window.checkHistoryConsistency = function() {
    console.log('🔍 CHECKING HISTORY CONSISTENCY...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    const protocols = window.Storage.getProtocols();
    const history = window.Storage.getCheckins();
    
    let inconsistencyCount = 0;
    let checkedCount = 0;
    
    history.forEach(checkin => {
        if (checkin.type === 'protocol') {
            checkedCount++;
            const protocol = protocols.find(p => p.id === checkin.protocolId);
            if (protocol && checkin.changes) {
                const expectedChange = checkin.action === '+' ? protocol.weight : -protocol.weight;
                const actualChanges = Object.values(checkin.changes);
                
                if (actualChanges.length > 0 && Math.abs(actualChanges[0] - expectedChange) > 0.001) {
                    inconsistencyCount++;
                    console.log(`❌ INCONSISTENCY ${inconsistencyCount}:`, {
                        checkinId: checkin.id,
                        protocolId: protocol.id,
                        protocolName: protocol.name.split('. ')[0],
                        expectedChange,
                        actualChange: actualChanges[0],
                        action: checkin.action,
                        difference: Math.abs(actualChanges[0] - expectedChange)
                    });
                }
            }
        }
    });
    
    console.log(`📊 CONSISTENCY CHECK RESULTS:`, {
        checkedCheckins: checkedCount,
        inconsistencies: inconsistencyCount,
        consistencyRate: inconsistencyCount === 0 ? '100%' : `${Math.round((checkedCount - inconsistencyCount) / checkedCount * 100)}%`
    });
    
    if (inconsistencyCount > 0) {
        console.log('🔄 Use window.Storage.validateHistoryConsistency() to fix inconsistencies');
    }
    
    return inconsistencyCount === 0;
};

// 🆕 НОВОЕ: Быстрый тест синхронизации
window.quickSyncTest = async function() {
    console.log('⚡ QUICK SYNC TEST: Testing protocol weight sync and history consistency...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    try {
        console.log('🔍 STEP 1: Checking current history consistency...');
        const isConsistentBefore = checkHistoryConsistency();
        
        console.log('🔄 STEP 2: Forcing sync to get latest data...');
        await window.Storage.syncWithBackend();
        
        setTimeout(() => {
            console.log('🔍 STEP 3: Checking history consistency after sync...');
            const isConsistentAfter = checkHistoryConsistency();
            
            console.log('📊 QUICK TEST RESULTS:', {
                beforeSync: isConsistentBefore ? '✅ Consistent' : '❌ Inconsistent',
                afterSync: isConsistentAfter ? '✅ Consistent' : '❌ Inconsistent',
                improved: !isConsistentBefore && isConsistentAfter,
                allGood: isConsistentAfter
            });
            
            if (isConsistentAfter) {
                console.log('🎉 SUCCESS: History is consistent across devices!');
            } else {
                console.log('⚠️ ISSUE: History still has inconsistencies. Run fixHistoryConsistency() to fix.');
            }
        }, 2000);
        
    } catch (error) {
        console.error('❌ Quick sync test failed:', error);
    }
};

// 🆕 НОВОЕ: Принудительное исправление истории
window.fixHistoryConsistency = async function() {
    console.log('🔧 FIXING HISTORY CONSISTENCY...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    try {
        // Принудительно пересчитываем всю историю
        window.Storage.recalculateAllProtocolHistory();
        
        // Отправляем исправленную историю на сервер
        setTimeout(async () => {
            console.log('📤 Sending fixed history to server...');
            await window.Storage.syncWithBackend();
            
            console.log('✅ History consistency fix completed!');
            console.log('🔄 Other devices will receive the corrected history on next sync.');
        }, 1000);
        
    } catch (error) {
        console.error('❌ Fix history consistency failed:', error);
    }
};

// 🆕 НОВОЕ: Остановка автоматической синхронизации
window.stopAutoSync = function() {
    console.log('🛑 STOPPING AUTOMATIC SYNC...');
    
    // Останавливаем периодическую синхронизацию
    if (window.syncIntervalId) {
        clearInterval(window.syncIntervalId);
        window.syncIntervalId = null;
        console.log('✅ Periodic sync stopped');
    }
    
    // Отключаем cross-tab синхронизацию
    if (window.Storage?.setupCrossTabSync) {
        // Удаляем обработчики событий storage
        window.removeEventListener('storage', window.Storage._boundStorageHandler);
        console.log('✅ Cross-tab sync stopped');
    }
    
    console.log('🔇 Auto-sync disabled. Use startAutoSync() to re-enable.');
};

// 🆕 НОВОЕ: Включение автоматической синхронизации
window.startAutoSync = function() {
    console.log('🔄 STARTING AUTOMATIC SYNC...');
    
    // Запускаем периодическую синхронизацию (из app.js)
    if (typeof window.setupPeriodicSync === 'function') {
        window.setupPeriodicSync();
        console.log('✅ Periodic sync started');
    }
    
    // Включаем cross-tab синхронизацию
    if (window.Storage?.setupCrossTabSync) {
        window.Storage.setupCrossTabSync();
        console.log('✅ Cross-tab sync started');
    }
    
    console.log('🔊 Auto-sync enabled');
};

console.log('🧪 SYNC TESTING FUNCTIONS LOADED:');
console.log('- stopAutoSync() - 🛑 Stop all automatic syncing');
console.log('- startAutoSync() - 🔊 Start automatic syncing');
console.log('- quickSyncTest() - ⚡ Quick test of sync and history consistency');
console.log('- fixHistoryConsistency() - 🔧 Fix history inconsistencies');
console.log('- testProtocolWeightSync() - Test protocol weight sync');
console.log('- testCrossDeviceSync() - Test cross-device sync');
console.log('- monitorSync() - Monitor sync activity');
console.log('- stopMonitorSync() - Stop monitoring');
console.log('- checkHistoryConsistency() - Check history consistency'); 