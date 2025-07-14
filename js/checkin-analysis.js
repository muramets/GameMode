// ===== АНАЛИЗ СТРУКТУРЫ ЧЕКИНОВ =====
// Для поиска причин различий в scores при одинаковом количестве чекинов

(function() {
    window.analyzeCheckinStructure = function() {
        console.log('🔍 ANALYZING CHECKIN STRUCTURE');
        console.log('==============================');
        
        if (!window.Storage?.currentUser) {
            console.error('❌ No authenticated user');
            return;
        }
        
        const protocols = window.Storage.getProtocols();
        const innerfaces = window.Storage.getInnerfaces();
        const history = window.Storage.getCheckins();
        
        console.log(`📊 Total checkins: ${history.length}`);
        console.log(`📊 Active checkins: ${history.filter(h => !h.deleted).length}`);
        console.log(`📊 Deleted checkins: ${history.filter(h => h.deleted).length}`);
        
        // Анализируем структуру чекинов
        console.log('\n🔍 CHECKIN STRUCTURE ANALYSIS:');
        console.log('==============================');
        
        const sampleCheckin = history.find(h => !h.deleted);
        if (sampleCheckin) {
            console.log('📋 Sample checkin structure:');
            console.log(sampleCheckin);
        }
        
        // Анализируем чекины по протоколам с проблемными scores
        const problematicInnerfaces = [
            { id: 2, name: 'Energy', expectedScore: 5.20 },
            { id: 3, name: 'Engagement', expectedScore: 5.95 },
            { id: 6, name: 'Execution Speed', expectedScore: 7.10 }
        ];
        
        problematicInnerfaces.forEach(innerface => {
            console.log(`\n🎯 ANALYZING ${innerface.name} (ID: ${innerface.id}):`);
            console.log('================================================');
            
            const currentScore = window.Storage.calculateCurrentScore(innerface.id);
            const scoreDiff = currentScore - innerface.expectedScore;
            
            console.log(`Expected score: ${innerface.expectedScore}`);
            console.log(`Current score: ${currentScore.toFixed(2)}`);
            console.log(`Difference: ${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)}`);
            
            // Находим все чекины, влияющие на этот innerface
            const affectingCheckins = history.filter(checkin => 
                checkin.type === 'protocol' && 
                checkin.changes && 
                checkin.changes[innerface.id] !== undefined &&
                !checkin.deleted
            );
            
            console.log(`Affecting checkins: ${affectingCheckins.length}`);
            
            let totalChange = 0;
            let suspiciousCheckins = [];
            
            affectingCheckins.forEach((checkin, index) => {
                const change = checkin.changes[innerface.id];
                totalChange += change;
                
                const protocol = protocols.find(p => p.id === checkin.protocolId);
                const protocolName = protocol?.name || 'Unknown';
                const expectedWeight = protocol?.weight || 0;
                
                // Проверяем, соответствует ли change ожидаемому весу
                const expectedChange = expectedWeight;
                const isPositive = change > 0;
                const expectedChangeWithSign = isPositive ? expectedChange : -expectedChange;
                
                if (Math.abs(change - expectedChangeWithSign) > 0.001 && Math.abs(change + expectedChangeWithSign) > 0.001) {
                    suspiciousCheckins.push({
                        index,
                        checkinId: checkin.id,
                        protocolName,
                        protocolId: checkin.protocolId,
                        change,
                        expectedWeight,
                        difference: change - expectedChangeWithSign
                    });
                }
                
                if (index < 10) { // Показываем первые 10 для примера
                    console.log(`  ${index + 1}. ${protocolName} (${checkin.protocolId}): ${change > 0 ? '+' : ''}${change.toFixed(3)}`);
                }
            });
            
            if (affectingCheckins.length > 10) {
                console.log(`  ... and ${affectingCheckins.length - 10} more`);
            }
            
            console.log(`Total change: ${totalChange.toFixed(3)}`);
            
            if (suspiciousCheckins.length > 0) {
                console.log(`\n⚠️ SUSPICIOUS CHECKINS (${suspiciousCheckins.length}):`);
                suspiciousCheckins.slice(0, 5).forEach(suspicious => {
                    console.log(`  ${suspicious.protocolName}: change=${suspicious.change}, expected=${suspicious.expectedWeight}, diff=${suspicious.difference.toFixed(3)}`);
                });
                
                if (suspiciousCheckins.length > 5) {
                    console.log(`  ... and ${suspiciousCheckins.length - 5} more suspicious checkins`);
                }
            }
        });
        
        // Анализируем веса протоколов
        console.log('\n⚖️ PROTOCOL WEIGHTS ANALYSIS:');
        console.log('=============================');
        
        const weightIssues = [];
        protocols.forEach(protocol => {
            const hasOldWeight = protocol.weight !== undefined;
            const hasNewWeights = protocol.weights && Object.keys(protocol.weights).length > 0;
            
            if (hasOldWeight && hasNewWeights) {
                // Проверяем консистентность
                const targets = protocol.targets || [];
                targets.forEach(targetId => {
                    const newWeight = protocol.weights[targetId];
                    if (newWeight !== undefined && Math.abs(newWeight - protocol.weight) > 0.001) {
                        weightIssues.push({
                            protocolId: protocol.id,
                            protocolName: protocol.name,
                            targetId,
                            oldWeight: protocol.weight,
                            newWeight: newWeight,
                            difference: newWeight - protocol.weight
                        });
                    }
                });
            }
            
            if (!hasOldWeight && !hasNewWeights) {
                console.log(`⚠️ Protocol ${protocol.id} (${protocol.name}) has no weights at all`);
            }
        });
        
        if (weightIssues.length > 0) {
            console.log(`\n⚠️ WEIGHT INCONSISTENCIES (${weightIssues.length}):`);
            weightIssues.forEach(issue => {
                console.log(`  ${issue.protocolName} target ${issue.targetId}: old=${issue.oldWeight}, new=${issue.newWeight}, diff=${issue.difference.toFixed(3)}`);
            });
        }
        
        // Рекомендации
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('===================');
        
        if (weightIssues.length > 0) {
            console.log('🔧 Weight inconsistencies detected - need weight migration');
        }
        
        console.log('🚀 After forceMainVersionSync(), run this analysis again');
        console.log('📊 Compare results to identify remaining issues');
        
        return {
            totalCheckins: history.length,
            activeCheckins: history.filter(h => !h.deleted).length,
            weightIssues,
            protocols: protocols.length,
            innerfaces: innerfaces.length
        };
    };
    
    window.quickScoreCheck = function() {
        console.log('🎯 QUICK SCORE CHECK');
        console.log('===================');
        
        const innerfaces = window.Storage.getInnerfaces();
        const expectedScores = {
            1: 7.45, // Focus
            2: 5.20, // Energy  
            3: 5.95, // Engagement
            4: 3.91, // Body Sync
            5: 6.40, // Business Insight
            6: 7.10, // Execution Speed
            7: 2.65  // Relationship
        };
        
        innerfaces.forEach(innerface => {
            const currentScore = window.Storage.calculateCurrentScore(innerface.id);
            const expectedScore = expectedScores[innerface.id];
            
            if (expectedScore !== undefined) {
                const diff = currentScore - expectedScore;
                const isCorrect = Math.abs(diff) < 0.05;
                
                console.log(`${innerface.name}: ${currentScore.toFixed(2)} (expected: ${expectedScore}) ${isCorrect ? '✅' : '❌ diff: ' + diff.toFixed(2)}`);
            }
        });
    };
    
    console.log('✅ Checkin analysis tools loaded!');
    console.log('📞 Available functions:');
    console.log('  • analyzeCheckinStructure() - Deep analysis of checkin data');
    console.log('  • quickScoreCheck() - Quick comparison with expected scores');
})(); 