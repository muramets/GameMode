// ===== АВТОНОМНАЯ ДИАГНОСТИКА для основной версии =====
// Скопируйте этот код и вставьте в консоль основной версии

(function() {
    // Автономная функция для диагностики Relationship
    window.debugRelationshipStandalone = function() {
        console.log('🔍 STANDALONE DEBUG: Relationship innerface (for main version)');
        
        if (!window.Storage?.currentUser) {
            console.error('❌ No authenticated user');
            return;
        }
        
        // Найти Relationship innerface
        const innerfaces = window.Storage.getInnerfaces();
        const relationshipMatches = innerfaces.filter(innerface => 
            innerface.name.toLowerCase().includes('relationship')
        );
        
        if (relationshipMatches.length === 0) {
            console.error('❌ Relationship innerface not found');
            return;
        }
        
        const innerface = relationshipMatches[0];
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
            checkin.changes[innerface.id] !== undefined
        );
        
        console.log(`📋 CHECKINS AFFECTING RELATIONSHIP: ${innerfaceCheckins.length}`);
        
        let totalChange = 0;
        innerfaceCheckins.forEach((checkin, index) => {
            const change = checkin.changes[innerface.id];
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
        const storageCalculatedScore = window.Storage.calculateCurrentScore(innerface.id);
        
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
            p.targets && p.targets.includes(innerface.id)
        );
        
        console.log(`🎯 PROTOCOLS TARGETING RELATIONSHIP: ${targetingProtocols.length}`);
        targetingProtocols.forEach(protocol => {
            console.log(`- Protocol ${protocol.id}: ${protocol.name.split('. ')[0]} (weight: ${protocol.weight})`);
        });
        
        return {
            innerface,
            innerfaceCheckins,
            totalChange,
            calculatedScore,
            storageCalculatedScore,
            targetingProtocols,
            version: 'MAIN_VERSION'
        };
    };
    
    // Автономная функция для проверки всех innerfaces
    window.checkAllInnerfaceScoresStandalone = function() {
        console.log('🔍 STANDALONE CHECK: All innerface scores (for main version)');
        
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
        
        console.log(`📊 SUMMARY (MAIN VERSION):`, {
            totalInnerfaces: innerfaces.length,
            zeroScores: results.filter(r => r.isZero).length,
            potentialProblems: problemInnerfaces.length,
            version: 'MAIN_VERSION'
        });
        
        if (problemInnerfaces.length > 0) {
            console.log('🚨 PROBLEM INNERFACES IN MAIN VERSION:');
            problemInnerfaces.forEach(p => {
                console.log(`- ${p.name} (ID: ${p.id}): ${p.currentScore} (should be > 0)`);
            });
        }
        
        return results;
    };
    
    console.log('✅ STANDALONE DEBUG FUNCTIONS LOADED:');
    console.log('- debugRelationshipStandalone() - Debug Relationship in main version');
    console.log('- checkAllInnerfaceScoresStandalone() - Check all scores in main version');
})(); 