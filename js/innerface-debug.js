// ===== innerface-debug.js - Диагностика innerfaces =====

// 🔍 ДИАГНОСТИКА: Подробный анализ расчета innerface score
window.debugInnerfaceScore = function(innerfaceId) {
    console.log(`🔍 DEBUGGING INNERFACE SCORE for ID: ${innerfaceId}`);
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    // Получаем innerface
    const innerface = window.Storage.getInnerfaceById(innerfaceId);
    if (!innerface) {
        console.error(`❌ Innerface ${innerfaceId} not found`);
        return;
    }
    
    console.log(`📊 INNERFACE INFO:`, {
        id: innerface.id,
        name: innerface.name,
        initialScore: innerface.initialScore,
        color: innerface.color
    });
    
    // Получаем всю историю для этого innerface
    const allCheckins = window.Storage.getCheckins();
    const innerfaceCheckins = allCheckins.filter(checkin => 
        checkin.type === 'protocol' && 
        checkin.changes && 
        checkin.changes[innerfaceId] !== undefined
    );
    
    console.log(`📋 CHECKINS AFFECTING THIS INNERFACE: ${innerfaceCheckins.length}`);
    
    let totalChange = 0;
    innerfaceCheckins.forEach((checkin, index) => {
        const change = checkin.changes[innerfaceId];
        totalChange += change;
        
        console.log(`${index + 1}. Checkin ${checkin.id}:`, {
            protocolId: checkin.protocolId,
            protocolName: checkin.protocolName,
            action: checkin.action,
            change: change,
            totalSoFar: totalChange,
            timestamp: new Date(checkin.timestamp).toLocaleString()
        });
    });
    
    const calculatedScore = innerface.initialScore + totalChange;
    const storageCalculatedScore = window.Storage.calculateCurrentScore(innerfaceId);
    
    console.log(`📊 SCORE CALCULATION:`, {
        initialScore: innerface.initialScore,
        totalChange: totalChange,
        calculatedScore: calculatedScore,
        storageCalculatedScore: storageCalculatedScore,
        match: Math.abs(calculatedScore - storageCalculatedScore) < 0.001
    });
    
    // Проверяем протоколы которые должны влиять на этот innerface
    const protocols = window.Storage.getProtocols();
    const targetingProtocols = protocols.filter(p => 
        p.targets && p.targets.includes(innerfaceId)
    );
    
    console.log(`🎯 PROTOCOLS TARGETING THIS INNERFACE: ${targetingProtocols.length}`);
    targetingProtocols.forEach(protocol => {
        console.log(`- Protocol ${protocol.id}: ${protocol.name.split('. ')[0]} (weight: ${protocol.weight})`);
    });
    
    return {
        innerface,
        innerfaceCheckins,
        totalChange,
        calculatedScore,
        storageCalculatedScore,
        targetingProtocols
    };
};

// 🔍 ДИАГНОСТИКА: Проверка всех innerfaces
window.checkAllInnerfaceScores = function() {
    console.log('🔍 CHECKING ALL INNERFACE SCORES...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    const innerfaces = window.Storage.getInnerfaces();
    const results = [];
    
    innerfaces.forEach(innerface => {
        const currentScore = window.Storage.calculateCurrentScore(innerface.id);
        const isZero = Math.abs(currentScore) < 0.001;
        
        results.push({
            id: innerface.id,
            name: innerface.name,
            initialScore: innerface.initialScore,
            currentScore: currentScore,
            isZero: isZero,
            problem: isZero && innerface.initialScore > 0
        });
        
        if (isZero) {
            console.log(`⚠️ ZERO SCORE: ${innerface.name} (ID: ${innerface.id}) shows 0 but initial is ${innerface.initialScore}`);
        }
    });
    
    const problemInnerfaces = results.filter(r => r.problem);
    
    console.log(`📊 SUMMARY:`, {
        totalInnerfaces: innerfaces.length,
        zeroScores: results.filter(r => r.isZero).length,
        potentialProblems: problemInnerfaces.length
    });
    
    if (problemInnerfaces.length > 0) {
        console.log('🚨 PROBLEM INNERFACES:');
        problemInnerfaces.forEach(p => {
            console.log(`- ${p.name} (ID: ${p.id}): ${p.currentScore} (should be > 0)`);
        });
        
        console.log('\n🔧 To debug specific innerface: debugInnerfaceScore(ID)');
    }
    
    return results;
};

// 🔍 ДИАГНОСТИКА: Поиск innerface по имени
window.findInnerface = function(searchTerm) {
    console.log(`🔍 SEARCHING FOR INNERFACE: "${searchTerm}"`);
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    const innerfaces = window.Storage.getInnerfaces();
    const matches = innerfaces.filter(innerface => 
        innerface.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    console.log(`📋 FOUND ${matches.length} MATCHES:`);
    matches.forEach(match => {
        const currentScore = window.Storage.calculateCurrentScore(match.id);
        console.log(`- ID: ${match.id}, Name: "${match.name}", Score: ${currentScore}`);
    });
    
    return matches;
};

// 🔍 ДИАГНОСТИКА: Сравнение весов протоколов
window.compareProtocolWeights = async function() {
    console.log('🔍 COMPARING PROTOCOL WEIGHTS WITH SERVER...');
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    try {
        // Синхронизируемся с сервером
        await window.Storage.syncWithBackend();
        
        const localProtocols = window.Storage.getProtocols();
        console.log(`📋 LOCAL PROTOCOLS: ${localProtocols.length}`);
        
        // Показываем веса всех протоколов
        localProtocols.forEach(protocol => {
            console.log(`Protocol ${protocol.id}: "${protocol.name.split('. ')[0]}" - Weight: ${protocol.weight}, Targets: [${(protocol.targets || []).join(', ')}]`);
        });
        
        return localProtocols;
        
    } catch (error) {
        console.error('❌ Failed to compare protocol weights:', error);
    }
};

// 🔍 ДИАГНОСТИКА: Проверка истории для конкретного протокола
window.debugProtocolHistory = function(protocolId) {
    console.log(`🔍 DEBUGGING PROTOCOL HISTORY for ID: ${protocolId}`);
    
    if (!window.Storage?.currentUser) {
        console.error('❌ No authenticated user');
        return;
    }
    
    const protocol = window.Storage.getProtocolById(protocolId);
    if (!protocol) {
        console.error(`❌ Protocol ${protocolId} not found`);
        return;
    }
    
    console.log(`📊 PROTOCOL INFO:`, {
        id: protocol.id,
        name: protocol.name,
        weight: protocol.weight,
        targets: protocol.targets
    });
    
    const allCheckins = window.Storage.getCheckins();
    const protocolCheckins = allCheckins.filter(checkin => 
        checkin.type === 'protocol' && checkin.protocolId === protocolId
    );
    
    console.log(`📋 CHECKINS FOR THIS PROTOCOL: ${protocolCheckins.length}`);
    
    protocolCheckins.forEach((checkin, index) => {
        console.log(`${index + 1}. Checkin ${checkin.id}:`, {
            action: checkin.action,
            changes: checkin.changes,
            timestamp: new Date(checkin.timestamp).toLocaleString(),
            targetsInChanges: Object.keys(checkin.changes || {}),
            expectedTargets: protocol.targets
        });
        
        // Проверяем совпадают ли targets в checkin с текущими targets протокола
        const checkinTargets = Object.keys(checkin.changes || {}).map(t => parseInt(t));
        const currentTargets = protocol.targets || [];
        const targetsMatch = checkinTargets.length === currentTargets.length && 
                           checkinTargets.every(t => currentTargets.includes(t));
        
        if (!targetsMatch) {
            console.log(`⚠️ TARGETS MISMATCH in checkin ${checkin.id}:`, {
                checkinTargets,
                currentTargets,
                needsRecalculation: true
            });
        }
    });
    
    return {
        protocol,
        protocolCheckins
    };
};

// 🚀 БЫСТРЫЕ КОМАНДЫ для часто проверяемых innerfaces
window.debugRelationship = function() {
    console.log('🔍 QUICK DEBUG: Relationship innerface');
    const matches = findInnerface('relationship');
    if (matches.length > 0) {
        return debugInnerfaceScore(matches[0].id);
    } else {
        console.log('❌ Relationship innerface not found');
    }
};

window.debugBodySync = function() {
    console.log('🔍 QUICK DEBUG: Body Sync innerface');
    const matches = findInnerface('body');
    if (matches.length > 0) {
        return debugInnerfaceScore(matches[0].id);
    } else {
        console.log('❌ Body Sync innerface not found');
    }
};

// 🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ: Принудительный пересчет для проблемных innerfaces
window.fixZeroInnerfaces = async function() {
    console.log('🔧 FIXING ZERO INNERFACES...');
    
    const results = checkAllInnerfaceScores();
    const problemInnerfaces = results.filter(r => r.problem);
    
    if (problemInnerfaces.length === 0) {
        console.log('✅ No zero innerface problems found');
        return;
    }
    
    console.log(`🔧 Found ${problemInnerfaces.length} innerfaces with zero scores, investigating...`);
    
    // Проверяем есть ли чекины в истории для этих innerfaces
    const allCheckins = window.Storage.getCheckins();
    
    problemInnerfaces.forEach(innerface => {
        const relatedCheckins = allCheckins.filter(checkin => 
            checkin.type === 'protocol' && 
            checkin.changes && 
            checkin.changes[innerface.id] !== undefined
        );
        
        console.log(`📋 ${innerface.name}: ${relatedCheckins.length} related checkins`);
        
        if (relatedCheckins.length > 0) {
            console.log(`🔧 ${innerface.name} has history but shows zero - likely sync issue`);
        } else {
            console.log(`ℹ️ ${innerface.name} has no history - zero score is correct`);
        }
    });
    
    // Пересчитываем всю историю
    console.log('🔄 Recalculating all protocol history...');
    window.Storage.recalculateAllProtocolHistory();
    
    // Синхронизируем с сервером
    setTimeout(async () => {
        console.log('📤 Syncing with server...');
        await window.Storage.syncWithBackend();
        
        console.log('✅ Fix completed. Check innerfaces again with checkAllInnerfaceScores()');
    }, 2000);
};

// Функция для детального сравнения чекинов
function compareCheckinsWithMainVersion() {
    console.log('🔍 COMPARING CHECKINS WITH MAIN VERSION...');
    
    const innerface = window.Storage.getInnerfaces().find(i => i.name.includes('Relationship'));
    if (!innerface) {
        console.log('❌ Relationship innerface not found');
        return;
    }
    
    console.log('📊 INNERFACE INFO:', innerface);
    
    // Получаем все чекины, включая удаленные
    const allCheckins = window.Storage.getCheckins();
    console.log('📋 TOTAL CHECKINS IN STORAGE:', allCheckins.length);
    
    // Фильтруем чекины для Relationship
    const relationshipCheckins = allCheckins.filter(checkin => {
        if (checkin.type === 'protocol') {
            const protocol = window.Storage.getProtocols().find(p => p.id === checkin.protocolId);
            return protocol && protocol.targets && protocol.targets.includes(innerface.id);
        }
        return false;
    });
    
    console.log('📋 RELATIONSHIP CHECKINS BEFORE FILTERING:', relationshipCheckins.length);
    
    // Проверяем, какие чекины помечены как удаленные
    const deletedCheckins = relationshipCheckins.filter(checkin => checkin.deleted);
    console.log('🗑️ DELETED CHECKINS:', deletedCheckins.length);
    
    if (deletedCheckins.length > 0) {
        console.log('🗑️ DELETED CHECKINS DETAILS:');
        deletedCheckins.forEach((checkin, index) => {
            console.log(`${index + 1}. ${checkin.checkinId} - ${checkin.timestamp} - ${checkin.deleted ? 'DELETED' : 'ACTIVE'}`);
        });
    }
    
    // Активные чекины
    const activeCheckins = relationshipCheckins.filter(checkin => !checkin.deleted);
    console.log('✅ ACTIVE CHECKINS:', activeCheckins.length);
    
    // Рассчитываем totalChange для активных чекинов
    let totalChange = 0;
    activeCheckins.forEach(checkin => {
        const protocol = window.Storage.getProtocols().find(p => p.id === checkin.protocolId);
        if (protocol && protocol.targets && protocol.targets.includes(innerface.id)) {
            const weight = (protocol.weights && protocol.weights[innerface.id]) || 0;
            const change = checkin.action === '+' ? weight : -weight;
            totalChange += change;
            console.log(`Checkin ${checkin.checkinId}: Protocol ${protocol.name} (${protocol.id}) - Weight: ${weight}, Action: ${checkin.action}, Change: ${change}`);
        }
    });
    
    console.log('📊 CALCULATIONS:');
    console.log('- Initial Score:', innerface.initialScore);
    console.log('- Total Change (active only):', totalChange);
    console.log('- Calculated Score:', innerface.initialScore + totalChange);
    console.log('- Storage Calculated Score:', window.Storage.calculateCurrentScore(innerface.id));
    
    // Проверим, есть ли чекины с проблемными ID
    const problemCheckins = activeCheckins.filter(checkin => 
        checkin.checkinId === 1752495666320 || checkin.checkinId === 1752497760845
    );
    
    if (problemCheckins.length > 0) {
        console.log('⚠️ PROBLEM CHECKINS FOUND (should be deleted but not filtered):');
        problemCheckins.forEach(checkin => {
            console.log('- ID:', checkin.checkinId, 'Deleted:', checkin.deleted);
        });
    }
    
    return {
        innerface,
        totalCheckins: allCheckins.length,
        relationshipCheckins: relationshipCheckins.length,
        deletedCheckins: deletedCheckins.length,
        activeCheckins: activeCheckins.length,
        totalChange,
        calculatedScore: innerface.initialScore + totalChange,
        storageScore: window.Storage.calculateCurrentScore(innerface.id)
    };
}

// Функция для проверки весов протоколов
function checkProtocolWeightsForRelationship() {
    console.log('🔍 CHECKING PROTOCOL WEIGHTS FOR RELATIONSHIP...');
    
    const innerface = window.Storage.getInnerfaces().find(i => i.name.includes('Relationship'));
    if (!innerface) {
        console.log('❌ Relationship innerface not found');
        return;
    }
    
    const protocols = window.Storage.getProtocols();
    const relationshipProtocols = protocols.filter(p => p.targets && p.targets.includes(innerface.id));
    
    console.log('📋 PROTOCOLS TARGETING RELATIONSHIP:', relationshipProtocols.length);
    
    relationshipProtocols.forEach(protocol => {
        const weight = (protocol.weights && protocol.weights[innerface.id]) || 0;
        console.log(`- Protocol ${protocol.id}: "${protocol.name}" - Weight: ${weight}`);
        
        if (!protocol.weights) {
            console.log('  ⚠️ NO WEIGHTS OBJECT!');
        } else if (!protocol.weights[innerface.id]) {
            console.log(`  ⚠️ NO WEIGHT FOR INNERFACE ${innerface.id}!`);
        }
    });
    
    return relationshipProtocols;
}

// Функция для восстановления весов протоколов
function fixProtocolWeights() {
    console.log('🔧 FIXING PROTOCOL WEIGHTS...');
    
    // Веса из основной версии
    const correctWeights = {
        16: { 7: 0.2 },   // Show Up -> Relationship
        22: { 7: 0.1 },   // Weed -> Relationship  
        23: { 7: 0.15 },  // Alcohol -> Relationship
        28: { 7: 0.1 },   // Swimming Pool -> Relationship
        30: { 7: 0.15 }   // Water Polo -> Relationship
    };
    
    const protocols = window.Storage.getProtocols();
    let fixedCount = 0;
    
    protocols.forEach(protocol => {
        if (correctWeights[protocol.id]) {
            if (!protocol.weights) {
                protocol.weights = {};
            }
            
            // Восстанавливаем веса
            Object.assign(protocol.weights, correctWeights[protocol.id]);
            fixedCount++;
            
            console.log(`✅ Fixed Protocol ${protocol.id}: "${protocol.name}" - Weight: ${protocol.weights[7]}`);
        }
    });
    
    // Сохраняем изменения
    window.Storage.saveProtocols(protocols);
    
    console.log(`🎯 FIXED ${fixedCount} PROTOCOLS`);
    console.log('🔄 Now running sync to update server...');
    
    // Принудительная синхронизация
    if (window.forceCriticalSync) {
        window.forceCriticalSync();
    }
    
    // Пересчитываем историю
    console.log('📊 Recalculating Relationship history...');
    const relationshipId = 7;
    if (window.Storage.recalculateProtocolHistory) {
        window.Storage.recalculateProtocolHistory(relationshipId);
    }
    
    console.log('✅ Protocol weights fixed! Try debugRelationship() now.');
}

// Функция для диагностики синхронизации протоколов
function debugProtocolSync() {
    console.log('🔍 DEBUGGING PROTOCOL SYNCHRONIZATION...');
    
    // Проверяем локальные данные
    const localProtocols = window.Storage.getProtocols();
    console.log('📱 LOCAL PROTOCOLS:', localProtocols.length);
    
    // Проверяем веса в локальных протоколах
    const relationshipTargetingProtocols = localProtocols.filter(p => p.targets && p.targets.includes(7));
    console.log('📋 LOCAL PROTOCOLS TARGETING RELATIONSHIP:', relationshipTargetingProtocols.length);
    
    relationshipTargetingProtocols.forEach(protocol => {
        console.log(`- Protocol ${protocol.id}: "${protocol.name}"`);
        console.log(`  - Targets: ${protocol.targets}`);
        console.log(`  - Weights: ${protocol.weights ? JSON.stringify(protocol.weights) : 'MISSING'}`);
        console.log(`  - Last Modified: ${protocol.lastModified || 'NO TIMESTAMP'}`);
    });
    
    // Проверяем данные на сервере
    console.log('🌐 CHECKING SERVER DATA...');
    
    // Принудительно синхронизируем с сервером, чтобы получить актуальные данные
    console.log('🔄 STARTING SYNC TO GET SERVER DATA...');
    
    return window.Storage.syncWithBackend()
        .then(() => {
            console.log('✅ SYNC COMPLETED, CHECKING RESULTS...');
            
            // Получаем обновленные локальные данные после синхронизации
            const updatedLocalProtocols = window.Storage.getProtocols();
            const updatedRelationshipProtocols = updatedLocalProtocols.filter(p => p.targets && p.targets.includes(7));
            
            console.log('📊 AFTER SYNC - LOCAL PROTOCOLS TARGETING RELATIONSHIP:', updatedRelationshipProtocols.length);
            
            updatedRelationshipProtocols.forEach(protocol => {
                console.log(`- Protocol ${protocol.id}: "${protocol.name}"`);
                console.log(`  - Targets: ${protocol.targets}`);
                console.log(`  - Weights: ${protocol.weights ? JSON.stringify(protocol.weights) : 'MISSING'}`);
                console.log(`  - Last Modified: ${protocol.lastModified || 'NO TIMESTAMP'}`);
            });
            
            // Проверяем, есть ли улучшения
            const hasWeights = updatedRelationshipProtocols.some(p => p.weights && p.weights[7]);
            
            if (hasWeights) {
                console.log('🎉 SUCCESS! Some protocols now have weights!');
                
                // Проверяем Relationship innerface
                const relationshipScore = window.Storage.calculateCurrentScore(7);
                console.log(`🎯 Relationship score after sync: ${relationshipScore}`);
                
                if (relationshipScore > 0) {
                    console.log('🎉 EXCELLENT! Relationship innerface is now working correctly!');
                } else {
                    console.log('⚠️ Weights found but Relationship score still 0');
                }
            } else {
                console.log('❌ NO WEIGHTS FOUND after sync - server may not have correct data');
            }
            
            return {
                localProtocols: relationshipTargetingProtocols,
                updatedProtocols: updatedRelationshipProtocols,
                hasWeights: hasWeights
            };
        })
        .catch(error => {
            console.log('❌ ERROR DURING SYNC:', error);
            return {
                localProtocols: relationshipTargetingProtocols,
                updatedProtocols: [],
                hasWeights: false,
                error: error.message
            };
        });
}

// Функция для принудительной синхронизации с полным перезапуском
function forceSyncFromServer() {
    console.log('🔄 FORCING FULL SYNC FROM SERVER...');
    
    if (window.Storage.forceSyncFromServer) {
        return window.Storage.forceSyncFromServer()
            .then(() => {
                console.log('✅ FORCE SYNC COMPLETED, CHECKING RESULTS...');
                
                // Проверяем результаты после принудительной синхронизации
                setTimeout(() => {
                    const updatedProtocols = window.Storage.getProtocols();
                    const updatedRelationshipProtocols = updatedProtocols.filter(p => p.targets && p.targets.includes(7));
                    
                    console.log('📊 AFTER FORCE SYNC:');
                    updatedRelationshipProtocols.forEach(protocol => {
                        const weight = (protocol.weights && protocol.weights[7]) || 0;
                        console.log(`- Protocol ${protocol.id}: Weight ${weight}`);
                    });
                    
                    // Проверяем Relationship innerface
                    const relationshipScore = window.Storage.calculateCurrentScore(7);
                    console.log(`🎯 Relationship score after force sync: ${relationshipScore}`);
                    
                    if (relationshipScore > 0) {
                        console.log('🎉 SUCCESS! Relationship innerface is now working correctly!');
                    } else {
                        console.log('❌ STILL BROKEN after force sync');
                    }
                }, 1000);
            })
            .catch(error => {
                console.log('❌ ERROR DURING FORCE SYNC:', error);
            });
    } else {
        console.log('❌ forceSyncFromServer method not available');
    }
}

// Функция для принудительной синхронизации с сервером
function testProtocolSyncFix() {
    console.log('🔧 TESTING PROTOCOL SYNC FIX...');
    
    // Принудительная синхронизация с сервером
    return window.Storage.syncWithBackend()
        .then(() => {
            console.log('✅ SYNC COMPLETED, CHECKING RESULTS...');
            
            // Проверяем результаты после синхронизации
            setTimeout(() => {
                const updatedProtocols = window.Storage.getProtocols();
                const updatedRelationshipProtocols = updatedProtocols.filter(p => p.targets && p.targets.includes(7));
                
                console.log('📊 AFTER SYNC:');
                updatedRelationshipProtocols.forEach(protocol => {
                    const weight = (protocol.weights && protocol.weights[7]) || 0;
                    console.log(`- Protocol ${protocol.id}: Weight ${weight}`);
                });
                
                // Проверяем Relationship innerface
                const relationshipScore = window.Storage.calculateCurrentScore(7);
                console.log(`🎯 Relationship score after sync: ${relationshipScore}`);
                
                if (relationshipScore > 0) {
                    console.log('🎉 SUCCESS! Relationship innerface is now working correctly!');
                } else {
                    console.log('❌ STILL BROKEN after sync - server may not have correct data');
                }
            }, 1000);
        })
        .catch(error => {
            console.log('❌ ERROR DURING SYNC:', error);
        });
}

// Быстрая проверка состояния Relationship innerface
function quickRelationshipCheck() {
    console.log('⚡ QUICK RELATIONSHIP CHECK...');
    
    const innerface = window.Storage.getInnerfaces().find(i => i.name.includes('Relationship'));
    if (!innerface) {
        console.log('❌ Relationship innerface not found');
        return;
    }
    
    const protocols = window.Storage.getProtocols();
    const relationshipProtocols = protocols.filter(p => p.targets && p.targets.includes(7));
    
    console.log(`📊 Relationship Protocols: ${relationshipProtocols.length}`);
    
    let hasWeights = false;
    relationshipProtocols.forEach(protocol => {
        const weight = (protocol.weights && protocol.weights[7]) || 0;
        console.log(`- ${protocol.name}: Weight ${weight}`);
        if (weight > 0) hasWeights = true;
    });
    
    const score = window.Storage.calculateCurrentScore(7);
    console.log(`🎯 Relationship Score: ${score}`);
    
    if (score > 0) {
        console.log('✅ Relationship innerface is working!');
    } else if (hasWeights) {
        console.log('⚠️ Has weights but score is 0 (may be correct if negative)');
    } else {
        console.log('❌ No weights found - sync issue!');
    }
    
    return { innerface, protocols: relationshipProtocols, score, hasWeights };
}

console.log('🔍 INNERFACE DEBUG FUNCTIONS LOADED:');
console.log('');
console.log('📋 QUICK COMMANDS:');
console.log('- debugRelationship() - Debug Relationship innerface');
console.log('- debugBodySync() - Debug Body Sync innerface');
console.log('- fixZeroInnerfaces() - Fix innerfaces showing zero');
console.log('- compareCheckinsWithMainVersion() - Compare checkins with main version');
console.log('- checkProtocolWeightsForRelationship() - Check protocol weights for Relationship');
console.log('- fixProtocolWeights() - Fix protocol weights based on main version');
console.log('- debugProtocolSync() - Debug protocol synchronization');
console.log('- testProtocolSyncFix() - Test protocol sync fix');
console.log('- forceSyncFromServer() - Force sync from server (full restart)');
console.log('- quickRelationshipCheck() - Quick check of Relationship innerface state');
console.log('');
console.log('🔧 DETAILED COMMANDS:');
console.log('- findInnerface("name") - Find innerface by name');
console.log('- debugInnerfaceScore(ID) - Debug specific innerface score');
console.log('- checkAllInnerfaceScores() - Check all innerface scores');
console.log('- compareProtocolWeights() - Compare protocol weights');
console.log('- debugProtocolHistory(ID) - Debug protocol history'); 

// Добавляем функции в window объект для доступа из консоли
window.debugRelationship = debugRelationship;
window.debugBodySync = debugBodySync;
window.fixZeroInnerfaces = fixZeroInnerfaces;
window.compareCheckinsWithMainVersion = compareCheckinsWithMainVersion;
window.checkProtocolWeightsForRelationship = checkProtocolWeightsForRelationship;
window.fixProtocolWeights = fixProtocolWeights;
window.debugProtocolSync = debugProtocolSync;
window.testProtocolSyncFix = testProtocolSyncFix;
window.forceSyncFromServer = forceSyncFromServer;
window.quickRelationshipCheck = quickRelationshipCheck;
window.findInnerface = findInnerface;
window.debugInnerfaceScore = debugInnerfaceScore;
window.checkAllInnerfaceScores = checkAllInnerfaceScores;
window.compareProtocolWeights = compareProtocolWeights;
window.debugProtocolHistory = debugProtocolHistory; 