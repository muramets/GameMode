// ===== ИНСТРУМЕНТ ОЧИСТКИ СЕРВЕРНЫХ ДАННЫХ =====
// Используется для принудительной синхронизации эталонных данных

(function() {
    
    // Эталонные данные из основной версии (те же, что в compare-with-main.js)
    const MAIN_VERSION_DATA = {
        "innerfaces": [
            {"id": 1, "name": "Focus. Attentional control", "initialScore": 5.2, "currentScore": 7.45},
            {"id": 2, "name": "Energy. Cognitive stamina", "initialScore": 5.5, "currentScore": 5.20},
            {"id": 3, "name": "Engagement. Impulse", "initialScore": 5.9, "currentScore": 5.95},
            {"id": 4, "name": "Body Sync. Body-driven confidence", "initialScore": 5.9, "currentScore": 3.91},
            {"id": 5, "name": "Business Insight. Strategic understanding", "initialScore": 5.3, "currentScore": 6.40},
            {"id": 6, "name": "Execution Speed. Learn and apply fast", "initialScore": 6.5, "currentScore": 7.10},
            {"id": 7, "name": "Relationship. What lives between you", "initialScore": 6, "currentScore": 2.65},
            {"id": 8, "name": "Family. What matters most", "initialScore": 5.1, "currentScore": 5.55},
            {"id": 9, "name": "Close Community. Not the crowd - the circle", "initialScore": 5.2, "currentScore": 5.50},
            {"id": 10, "name": "Builder Circle. Same hunger, different tools.", "initialScore": 1, "currentScore": 1.00},
            {"id": 11, "name": "Art Contact. Inputs that shift your frame", "initialScore": 3.5, "currentScore": 3.80},
            {"id": 12, "name": "Entertainment. Have fun", "initialScore": 7, "currentScore": 7.10},
            {"id": 13, "name": "Discipline. Do what you said.", "initialScore": 6, "currentScore": 6.09},
            {"id": 14, "name": "YouTube Expertise. Know your niche.", "initialScore": 4, "currentScore": 4.00},
            {"id": 15, "name": "Entrepreneur Mode. Organize your hustle like a pro", "initialScore": 4, "currentScore": 4.20},
            {"id": 16, "name": "AI Music Prod.. From idea to music", "initialScore": 4, "currentScore": 4.00}
        ],
        "protocols": [
            {"id": 1, "name": "Warm Up. Turn the body on", "checkinCount": 38, "targets": [2, 4], "weight": 0.05},
            {"id": 2, "name": "Meditation. Engage with yourself", "checkinCount": 10, "targets": [1, 2, 3], "weight": 0.05},
            {"id": 3, "name": "Short Walk. Reset through motion", "checkinCount": 69, "targets": [4], "weight": 0.03},
            {"id": 4, "name": "Long Run. Reset through effort", "checkinCount": 17, "targets": [4], "weight": 0.1},
            {"id": 5, "name": "Sauna / Bath. Clear the chamber", "checkinCount": 6, "targets": [1, 2, 4], "weight": 0.05},
            {"id": 6, "name": "Clear your head. Cognitive Dump", "checkinCount": 4, "targets": [1, 2], "weight": 0.05},
            {"id": 7, "name": "Get in the zone. Context Immersion", "checkinCount": 1, "targets": [1, 2], "weight": 0.1},
            {"id": 8, "name": "One small step. Primitive Start", "checkinCount": 5, "targets": [2, 3], "weight": 0.1},
            {"id": 9, "name": "Reboot the map. Visual Restart", "checkinCount": 0, "targets": [1, 3], "weight": 0.1},
            {"id": 10, "name": "Lock In. Step into your next role", "checkinCount": 2, "targets": [3, 5, 6], "weight": 0.1},
            {"id": 11, "name": "Cut Smart. Know when enough is enough", "checkinCount": 2, "targets": [1, 2, 3], "weight": 0.1},
            {"id": 14, "name": "Vibe Coding. Think with tools", "checkinCount": 5, "targets": [5, 6], "weight": 0.05},
            {"id": 15, "name": "Music Production. Let the tool stretch you", "checkinCount": 3, "targets": [3, 5, 6], "weight": 0.1},
            {"id": 16, "name": "Show Up. Be there when it counts", "checkinCount": 8, "targets": [1, 2, 7], "weight": 0.2},
            {"id": 17, "name": "Family Call. Get out of your head", "checkinCount": 3, "targets": [8], "weight": 0.15},
            {"id": 18, "name": "Look Around. You're not solo", "checkinCount": 1, "targets": [9], "weight": 0.3},
            {"id": 19, "name": "Fuel Balance. Don't push the system", "checkinCount": 1, "targets": [1, 2, 4], "weight": 0.1},
            {"id": 20, "name": "Read. Draw from the source", "checkinCount": 11, "targets": [2, 3, 5], "weight": 0.05},
            {"id": 21, "name": "Sleep. Don't skip the reset", "checkinCount": 6, "targets": [1, 2, 4], "weight": 0.1},
            {"id": 22, "name": "Weed. Half out by design", "checkinCount": 19, "targets": [3, 4, 7], "weight": 0.1},
            {"id": 23, "name": "Alcohol. Something's off", "checkinCount": 23, "targets": [2, 4, 7], "weight": 0.15},
            {"id": 24, "name": "Overeating. >+500 kcal", "checkinCount": 15, "targets": [2, 4], "weight": 0.2},
            {"id": 25, "name": "Cultural Events. Step into other frames", "checkinCount": 1, "targets": [2, 11], "weight": 0.3},
            {"id": 27, "name": "Do nothing. Step back without guilt", "checkinCount": 4, "targets": [2], "weight": 0.25},
            {"id": 28, "name": "Swimming Pool", "checkinCount": 1, "targets": [4, 7, 12], "weight": 0.1},
            {"id": 29, "name": "Легкая тренька. Just to engage with this energy", "checkinCount": 9, "targets": [2, 3, 4], "weight": 0.05},
            {"id": 30, "name": "Water Polo", "checkinCount": 2, "targets": [4, 7], "weight": 0.15},
            {"id": 31, "name": "Dairy. Save you thoughts", "checkinCount": 4, "targets": [13], "weight": 0.03},
            {"id": 32, "name": "YouTube Research. 30 min.", "checkinCount": 1, "targets": [14], "weight": 0.1},
            {"id": 33, "name": "Entrepreneur Action. Act like a pro", "checkinCount": 3, "targets": [15], "weight": 0.1}
        ],
        "totalCheckins": 353,
        "deletedCheckins": 0
    };
    
    window.analyzeServerDataPollution = function() {
        console.log('🔍 ANALYZING SERVER DATA POLLUTION');
        console.log('==================================');
        
        if (!window.Storage?.currentUser) {
            console.error('❌ No authenticated user');
            return;
        }
        
        return new Promise(async (resolve, reject) => {
            try {
                // Получаем данные с сервера
                const token = await window.Storage.currentUser.getIdToken();
                const response = await fetch(`${window.BACKEND_URL}/api/user/data`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Server response: ${response.status}`);
                }
                
                const serverResponse = await response.json();
                const serverData = serverResponse.data || {};
                
                console.log('📊 SERVER VS MAIN VERSION COMPARISON:');
                console.log('=====================================');
                
                // Сравниваем протоколы
                const serverProtocols = serverData.protocols || [];
                const mainProtocols = MAIN_VERSION_DATA.protocols;
                
                console.log(`Server protocols: ${serverProtocols.length}`);
                console.log(`Main protocols: ${mainProtocols.length}`);
                
                // Анализируем чекины на сервере
                const serverHistory = serverData.history || [];
                const totalServerCheckins = serverHistory.filter(h => !h.deleted).length;
                
                console.log(`Server total checkins: ${totalServerCheckins}`);
                console.log(`Main total checkins: ${MAIN_VERSION_DATA.totalCheckins}`);
                console.log(`Difference: ${totalServerCheckins - MAIN_VERSION_DATA.totalCheckins}`);
                
                // Анализируем каждый протокол
                const protocolAnalysis = [];
                
                mainProtocols.forEach(mainProtocol => {
                    const serverProtocolCheckins = serverHistory.filter(h => 
                        h.protocolId === mainProtocol.id && !h.deleted
                    ).length;
                    
                    const difference = serverProtocolCheckins - mainProtocol.checkinCount;
                    
                    if (difference !== 0) {
                        console.log(`${mainProtocol.name}:`);
                        console.log(`  Main: ${mainProtocol.checkinCount} checkins`);
                        console.log(`  Server: ${serverProtocolCheckins} checkins`);
                        console.log(`  Difference: ${difference > 0 ? '+' : ''}${difference} ${Math.abs(difference) > 2 ? '⚠️ SIGNIFICANT' : ''}`);
                        
                        protocolAnalysis.push({
                            id: mainProtocol.id,
                            name: mainProtocol.name,
                            mainCount: mainProtocol.checkinCount,
                            serverCount: serverProtocolCheckins,
                            difference: difference,
                            isSignificant: Math.abs(difference) > 2
                        });
                    }
                });
                
                // Проверяем "лишние" протоколы на сервере
                const extraServerProtocols = [];
                serverProtocols.forEach(serverProtocol => {
                    const existsInMain = mainProtocols.find(p => p.id === serverProtocol.id);
                    if (!existsInMain) {
                        const checkinCount = serverHistory.filter(h => 
                            h.protocolId === serverProtocol.id && !h.deleted
                        ).length;
                        
                        if (checkinCount > 0) {
                            console.log(`🆕 EXTRA SERVER PROTOCOL: ${serverProtocol.name}`);
                            console.log(`  Server: ${checkinCount} checkins (not in main)`);
                            
                            extraServerProtocols.push({
                                id: serverProtocol.id,
                                name: serverProtocol.name,
                                checkinCount: checkinCount
                            });
                        }
                    }
                });
                
                // Анализ загрязнения данных
                const pollutionAnalysis = {
                    totalExtraCheckins: protocolAnalysis.reduce((sum, p) => sum + Math.max(0, p.difference), 0),
                    totalMissingCheckins: protocolAnalysis.reduce((sum, p) => sum + Math.max(0, -p.difference), 0),
                    significantDifferences: protocolAnalysis.filter(p => p.isSignificant),
                    extraProtocols: extraServerProtocols,
                    isPolluted: false
                };
                
                pollutionAnalysis.isPolluted = 
                    pollutionAnalysis.totalExtraCheckins > 0 || 
                    pollutionAnalysis.extraProtocols.length > 0;
                
                console.log('\n🚨 POLLUTION ANALYSIS:');
                console.log('======================');
                console.log(`Total extra checkins on server: ${pollutionAnalysis.totalExtraCheckins}`);
                console.log(`Total missing checkins on server: ${pollutionAnalysis.totalMissingCheckins}`);
                console.log(`Significant differences: ${pollutionAnalysis.significantDifferences.length}`);
                console.log(`Extra protocols: ${pollutionAnalysis.extraProtocols.length}`);
                console.log(`Server is polluted: ${pollutionAnalysis.isPolluted ? '🚨 YES' : '✅ NO'}`);
                
                if (pollutionAnalysis.isPolluted) {
                    console.log('\n💡 RECOMMENDATION:');
                    console.log('==================');
                    console.log('🔧 Server contains polluted data that differs from main version');
                    console.log('🚀 Run forceMainVersionSync() to clean server data');
                    console.log('⚠️ This will overwrite server data with main version data');
                }
                
                resolve({
                    serverData,
                    mainData: MAIN_VERSION_DATA,
                    analysis: pollutionAnalysis
                });
                
            } catch (error) {
                console.error('❌ Analysis failed:', error);
                reject(error);
            }
        });
    };
    
    window.forceMainVersionSync = function() {
        console.log('🚀 FORCING MAIN VERSION SYNC TO SERVER');
        console.log('======================================');
        console.log('⚠️ This will overwrite server data with main version data');
        
        const confirmation = confirm(
            'Are you sure you want to force sync main version data to server?\n\n' +
            'This will:\n' +
            '• Overwrite server data with main version data\n' +
            '• Remove any extra checkins not in main version\n' +
            '• This action cannot be undone\n\n' +
            'Continue?'
        );
        
        if (!confirmation) {
            console.log('❌ Sync cancelled by user');
            return;
        }
        
        return new Promise(async (resolve, reject) => {
            try {
                // Принудительно помечаем для синхронизации
                window.Storage.markForSync();
                
                // Выполняем синхронизацию
                await window.Storage.syncWithBackend();
                
                console.log('✅ FORCE SYNC COMPLETED');
                console.log('📊 Server data should now match main version');
                console.log('🔄 Test by opening app in new browser');
                
                resolve();
            } catch (error) {
                console.error('❌ Force sync failed:', error);
                reject(error);
            }
        });
    };
    
    window.testNewBrowserExperience = function() {
        console.log('🔍 TESTING NEW BROWSER EXPERIENCE');
        console.log('=================================');
        console.log('📋 Instructions:');
        console.log('1. Open app in new browser/incognito mode');
        console.log('2. Login with same credentials');
        console.log('3. Compare scores with main version');
        console.log('4. Check if pollution is fixed');
        
        console.log('\n🎯 Expected Results (Main Version):');
        MAIN_VERSION_DATA.innerfaces.forEach(innerface => {
            console.log(`  ${innerface.name}: ${innerface.currentScore.toFixed(2)}`);
        });
        
        console.log('\n💡 If scores still differ, server cleanup may be needed');
    };
    
    console.log('✅ Server cleanup tools loaded!');
    console.log('📞 Available functions:');
    console.log('  • analyzeServerDataPollution() - Check server data pollution');
    console.log('  • forceMainVersionSync() - Force sync main version to server');
    console.log('  • testNewBrowserExperience() - Guide for testing');
    
})(); 