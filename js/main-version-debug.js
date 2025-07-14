// ===== АВТОНОМНАЯ ДИАГНОСТИКА ОСНОВНОЙ ВЕРСИИ =====
// Скопируйте этот код и вставьте в консоль основной версии

(function() {
    window.debugMainVersion = function() {
        console.log('🔍 MAIN VERSION DIAGNOSTIC REPORT');
        console.log('=====================================');
        
        if (!window.Storage?.currentUser) {
            console.error('❌ No authenticated user');
            return;
        }
        
        // Получаем все данные
        const protocols = window.Storage.getProtocols();
        const innerfaces = window.Storage.getInnerfaces();
        const history = window.Storage.getCheckins();
        const states = window.Storage.getStates();
        
        console.log('📊 BASIC DATA OVERVIEW:');
        console.log(`  Protocols: ${protocols.length}`);
        console.log(`  Innerfaces: ${innerfaces.length}`);
        console.log(`  History: ${history.length}`);
        console.log(`  States: ${states.length}`);
        
        // === INNERFACE SCORES ===
        console.log('\n🎯 CURRENT INNERFACE SCORES:');
        console.log('============================');
        
        const innerfaceScores = {};
        innerfaces.forEach(innerface => {
            const currentScore = window.Storage.calculateCurrentScore(innerface.id);
            innerfaceScores[innerface.id] = currentScore;
            console.log(`${innerface.name}: ${currentScore.toFixed(2)} (initial: ${innerface.initialScore})`);
        });
        
        // === PROTOCOL ANALYSIS ===
        console.log('\n📋 PROTOCOL CHECKIN COUNTS:');
        console.log('============================');
        
        const protocolStats = {};
        protocols.forEach(protocol => {
            const protocolCheckins = history.filter(checkin => 
                checkin.type === 'protocol' && 
                checkin.protocolId === protocol.id && 
                !checkin.deleted
            );
            
            protocolStats[protocol.id] = {
                name: protocol.name,
                checkins: protocolCheckins.length,
                targets: protocol.targets || [],
                weight: protocol.weight || 0,
                weights: protocol.weights || {}
            };
            
            console.log(`Protocol ${protocol.id} (${protocol.name}): ${protocolCheckins.length} checkins`);
        });
        
        // === DETAILED INNERFACE CALCULATION ===
        console.log('\n🔍 DETAILED INNERFACE CALCULATIONS:');
        console.log('===================================');
        
        innerfaces.forEach(innerface => {
            console.log(`\n📊 ${innerface.name} (ID: ${innerface.id}):`);
            console.log(`  Initial Score: ${innerface.initialScore}`);
            
            // Найти все чекины, влияющие на этот innerface
            const affectingCheckins = history.filter(checkin => 
                checkin.type === 'protocol' && 
                checkin.changes && 
                checkin.changes[innerface.id] !== undefined &&
                !checkin.deleted
            );
            
            console.log(`  Affecting Checkins: ${affectingCheckins.length}`);
            
            let totalChange = 0;
            affectingCheckins.forEach((checkin, index) => {
                const change = checkin.changes[innerface.id];
                totalChange += change;
                
                const protocol = protocols.find(p => p.id === checkin.protocolId);
                console.log(`    ${index + 1}. ${protocol?.name || 'Unknown'} (${checkin.protocolId}): ${change > 0 ? '+' : ''}${change.toFixed(3)}`);
            });
            
            console.log(`  Total Change: ${totalChange.toFixed(3)}`);
            console.log(`  Calculated Score: ${(innerface.initialScore + totalChange).toFixed(2)}`);
            console.log(`  Storage.calculateCurrentScore(): ${window.Storage.calculateCurrentScore(innerface.id).toFixed(2)}`);
        });
        
        // === PROTOCOL WEIGHTS ANALYSIS ===
        console.log('\n⚖️ PROTOCOL WEIGHTS ANALYSIS:');
        console.log('=============================');
        
        protocols.forEach(protocol => {
            console.log(`\nProtocol ${protocol.id} (${protocol.name}):`);
            console.log(`  Targets: [${protocol.targets?.join(', ') || 'none'}]`);
            console.log(`  Old Weight: ${protocol.weight || 0}`);
            console.log(`  New Weights:`, protocol.weights || {});
            
            // Проверить консистентность весов
            if (protocol.targets && protocol.weights) {
                const inconsistentWeights = [];
                protocol.targets.forEach(targetId => {
                    const weightForTarget = protocol.weights[targetId];
                    if (weightForTarget !== protocol.weight) {
                        inconsistentWeights.push(`Target ${targetId}: ${weightForTarget} vs ${protocol.weight}`);
                    }
                });
                
                if (inconsistentWeights.length > 0) {
                    console.log(`  ⚠️ Weight Inconsistencies: ${inconsistentWeights.join(', ')}`);
                }
            }
        });
        
        // === RECENT ACTIVITY ===
        console.log('\n⏰ RECENT ACTIVITY (last 10 checkins):');
        console.log('=====================================');
        
        const recentCheckins = history
            .filter(checkin => !checkin.deleted)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
        
        recentCheckins.forEach((checkin, index) => {
            const protocol = protocols.find(p => p.id === checkin.protocolId);
            const date = new Date(checkin.timestamp).toLocaleDateString();
            console.log(`${index + 1}. ${date} - ${protocol?.name || 'Unknown'} (${checkin.protocolId})`);
        });
        
        // === SUMMARY DATA FOR COMPARISON ===
        console.log('\n📋 SUMMARY DATA FOR COMPARISON:');
        console.log('===============================');
        
        const summaryData = {
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
            deletedCheckins: history.filter(h => h.deleted).length,
            timestamp: new Date().toISOString()
        };
        
        console.log('📊 SUMMARY DATA:', summaryData);
        
        // === EXPORT FUNCTION ===
        console.log('\n💾 EXPORT MAIN VERSION DATA:');
        console.log('============================');
        console.log('Call exportMainVersionData() to get JSON for comparison');
        
        window.exportMainVersionData = function() {
            return JSON.stringify(summaryData, null, 2);
        };
        
        return summaryData;
    };
    
    // === COMPARISON FUNCTION ===
    window.compareWithMainVersion = function(mainVersionData) {
        console.log('🔍 COMPARING WITH MAIN VERSION DATA');
        console.log('===================================');
        
        const currentData = debugMainVersion();
        
        console.log('\n📊 INNERFACE SCORE COMPARISON:');
        console.log('==============================');
        
        mainVersionData.innerfaces.forEach(mainInnerface => {
            const currentInnerface = currentData.innerfaces.find(i => i.id === mainInnerface.id);
            if (currentInnerface) {
                const scoreDiff = currentInnerface.currentScore - mainInnerface.currentScore;
                console.log(`${mainInnerface.name}:`);
                console.log(`  Main: ${mainInnerface.currentScore.toFixed(2)}`);
                console.log(`  Current: ${currentInnerface.currentScore.toFixed(2)}`);
                console.log(`  Difference: ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)}`);
            }
        });
        
        console.log('\n📋 PROTOCOL CHECKIN COMPARISON:');
        console.log('===============================');
        
        mainVersionData.protocols.forEach(mainProtocol => {
            const currentProtocol = currentData.protocols.find(p => p.id === mainProtocol.id);
            if (currentProtocol) {
                const checkinDiff = currentProtocol.checkinCount - mainProtocol.checkinCount;
                if (checkinDiff !== 0) {
                    console.log(`${mainProtocol.name}:`);
                    console.log(`  Main: ${mainProtocol.checkinCount} checkins`);
                    console.log(`  Current: ${currentProtocol.checkinCount} checkins`);
                    console.log(`  Difference: ${checkinDiff > 0 ? '+' : ''}${checkinDiff}`);
                }
            }
        });
        
        return {
            mainVersion: mainVersionData,
            currentVersion: currentData
        };
    };
    
    console.log('✅ Main version debug functions loaded!');
    console.log('📞 Call debugMainVersion() to run diagnostics');
    console.log('📊 Call exportMainVersionData() to get JSON data');
})(); 