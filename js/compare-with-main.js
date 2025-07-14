// ===== СРАВНЕНИЕ ЛОКАЛЬНОЙ ВЕРСИИ С ОСНОВНОЙ =====
// Вставьте эталонные данные из основной версии и запустите сравнение

(function() {
    // Эталонные данные из основной версии
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
        "deletedCheckins": 0,
        "timestamp": "2025-07-14T16:50:40.183Z"
    };

    window.compareWithMainVersion = function() {
        console.log('🔍 COMPARING LOCAL VERSION WITH MAIN VERSION');
        console.log('=============================================');
        
        if (!window.Storage?.currentUser) {
            console.error('❌ No authenticated user');
            return;
        }
        
        // Получаем локальные данные
        const protocols = window.Storage.getProtocols();
        const innerfaces = window.Storage.getInnerfaces();
        const history = window.Storage.getCheckins();
        
        const localData = {
            innerfaces: innerfaces.map(i => ({
                id: i.id,
                name: i.name,
                initialScore: i.initialScore,
                currentScore: window.Storage.calculateCurrentScore(i.id)
            })),
            protocols: protocols.map(p => ({
                id: p.id,
                name: p.name,
                checkinCount: history.filter(h => h.protocolId === p.id && !h.deleted).length,
                targets: p.targets || [],
                weight: p.weight || 0,
                weights: p.weights || {}
            })),
            totalCheckins: history.filter(h => !h.deleted).length,
            deletedCheckins: history.filter(h => h.deleted).length
        };
        
        console.log('📊 DATA OVERVIEW COMPARISON:');
        console.log('============================');
        console.log(`Total Checkins: Local ${localData.totalCheckins} vs Main ${MAIN_VERSION_DATA.totalCheckins} (diff: ${localData.totalCheckins - MAIN_VERSION_DATA.totalCheckins})`);
        console.log(`Deleted Checkins: Local ${localData.deletedCheckins} vs Main ${MAIN_VERSION_DATA.deletedCheckins} (diff: ${localData.deletedCheckins - MAIN_VERSION_DATA.deletedCheckins})`);
        
        // === INNERFACE SCORES COMPARISON ===
        console.log('\n🎯 INNERFACE SCORES COMPARISON:');
        console.log('===============================');
        
        let significantScoreDifferences = [];
        
        MAIN_VERSION_DATA.innerfaces.forEach(mainInnerface => {
            const localInnerface = localData.innerfaces.find(i => i.id === mainInnerface.id);
            if (localInnerface) {
                const scoreDiff = localInnerface.currentScore - mainInnerface.currentScore;
                const isSignificant = Math.abs(scoreDiff) > 0.05; // Более 0.05 считается значительным
                
                console.log(`${mainInnerface.name}:`);
                console.log(`  Main: ${mainInnerface.currentScore.toFixed(2)}`);
                console.log(`  Local: ${localInnerface.currentScore.toFixed(2)}`);
                console.log(`  Difference: ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)} ${isSignificant ? '⚠️ SIGNIFICANT' : '✅'}`);
                
                if (isSignificant) {
                    significantScoreDifferences.push({
                        name: mainInnerface.name,
                        mainScore: mainInnerface.currentScore,
                        localScore: localInnerface.currentScore,
                        difference: scoreDiff
                    });
                }
            }
        });
        
        // === PROTOCOL CHECKINS COMPARISON ===
        console.log('\n📋 PROTOCOL CHECKINS COMPARISON:');
        console.log('================================');
        
        let protocolDifferences = [];
        let extraProtocols = [];
        
        MAIN_VERSION_DATA.protocols.forEach(mainProtocol => {
            const localProtocol = localData.protocols.find(p => p.id === mainProtocol.id);
            if (localProtocol) {
                const checkinDiff = localProtocol.checkinCount - mainProtocol.checkinCount;
                if (checkinDiff !== 0) {
                    console.log(`${mainProtocol.name}:`);
                    console.log(`  Main: ${mainProtocol.checkinCount} checkins`);
                    console.log(`  Local: ${localProtocol.checkinCount} checkins`);
                    console.log(`  Difference: ${checkinDiff > 0 ? '+' : ''}${checkinDiff} ${Math.abs(checkinDiff) > 2 ? '⚠️ SIGNIFICANT' : ''}`);
                    
                    protocolDifferences.push({
                        id: mainProtocol.id,
                        name: mainProtocol.name,
                        mainCount: mainProtocol.checkinCount,
                        localCount: localProtocol.checkinCount,
                        difference: checkinDiff
                    });
                }
            }
        });
        
        // Проверяем протоколы, которые есть только в локальной версии
        localData.protocols.forEach(localProtocol => {
            const existsInMain = MAIN_VERSION_DATA.protocols.find(p => p.id === localProtocol.id);
            if (!existsInMain && localProtocol.checkinCount > 0) {
                console.log(`🆕 EXTRA PROTOCOL: ${localProtocol.name}`);
                console.log(`  Local: ${localProtocol.checkinCount} checkins (not in main)`);
                
                extraProtocols.push({
                    id: localProtocol.id,
                    name: localProtocol.name,
                    checkinCount: localProtocol.checkinCount
                });
            }
        });
        
        // === SUMMARY ANALYSIS ===
        console.log('\n📈 SUMMARY ANALYSIS:');
        console.log('====================');
        
        console.log(`\n🎯 SIGNIFICANT SCORE DIFFERENCES (${significantScoreDifferences.length}):`);
        significantScoreDifferences.forEach(diff => {
            console.log(`  ${diff.name}: ${diff.difference > 0 ? '+' : ''}${diff.difference.toFixed(2)} (Local higher than Main)`);
        });
        
        console.log(`\n📋 PROTOCOL DIFFERENCES (${protocolDifferences.length}):`);
        protocolDifferences.forEach(diff => {
            console.log(`  ${diff.name}: ${diff.difference > 0 ? '+' : ''}${diff.difference} checkins`);
        });
        
        console.log(`\n🆕 EXTRA PROTOCOLS (${extraProtocols.length}):`);
        extraProtocols.forEach(protocol => {
            console.log(`  ${protocol.name}: ${protocol.checkinCount} checkins`);
        });
        
        // === POTENTIAL CAUSES ===
        console.log('\n🔍 POTENTIAL CAUSES:');
        console.log('===================');
        
        if (localData.totalCheckins !== MAIN_VERSION_DATA.totalCheckins) {
            console.log(`⚠️ Total checkin count mismatch: Local has ${localData.totalCheckins - MAIN_VERSION_DATA.totalCheckins > 0 ? 'MORE' : 'FEWER'} checkins`);
        }
        
        if (localData.deletedCheckins > MAIN_VERSION_DATA.deletedCheckins) {
            console.log(`⚠️ Local has ${localData.deletedCheckins - MAIN_VERSION_DATA.deletedCheckins} more deleted checkins`);
        }
        
        if (extraProtocols.length > 0) {
            console.log(`⚠️ Local has ${extraProtocols.length} protocols with checkins that don't exist in main`);
        }
        
        if (significantScoreDifferences.length > 0) {
            const higherScores = significantScoreDifferences.filter(d => d.difference > 0);
            const lowerScores = significantScoreDifferences.filter(d => d.difference < 0);
            
            console.log(`⚠️ Local has ${higherScores.length} scores significantly HIGHER than main`);
            console.log(`⚠️ Local has ${lowerScores.length} scores significantly LOWER than main`);
        }
        
        // === SYNC CONFLICT DIAGNOSIS ===
        console.log('\n🚨 SYNC CONFLICT DIAGNOSIS:');
        console.log('===========================');
        
        const totalExtraCheckins = protocolDifferences.reduce((sum, diff) => sum + Math.max(0, diff.difference), 0);
        const totalMissingCheckins = protocolDifferences.reduce((sum, diff) => sum + Math.max(0, -diff.difference), 0);
        
        console.log(`📊 Extra checkins in local: ${totalExtraCheckins}`);
        console.log(`📊 Missing checkins in local: ${totalMissingCheckins}`);
        
        if (totalExtraCheckins > 0) {
            console.log('🔍 Local version has additional data that main version doesn\'t have');
            console.log('💡 This suggests local version is pushing extra data to server');
        }
        
        if (totalMissingCheckins > 0) {
            console.log('🔍 Local version is missing data that main version has');
            console.log('💡 This suggests sync is not pulling all data from server');
        }
        
        return {
            mainVersion: MAIN_VERSION_DATA,
            localVersion: localData,
            analysis: {
                significantScoreDifferences,
                protocolDifferences,
                extraProtocols,
                totalExtraCheckins,
                totalMissingCheckins
            }
        };
    };
    
    console.log('✅ Comparison function loaded!');
    console.log('📞 Call compareWithMainVersion() to compare with main version');
    console.log('🎯 This will show exactly what differs between local and main versions');
})(); 