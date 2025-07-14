// Функция для диагностики проблемных протоколов
function diagnoseProtocolIssues() {
    console.log('🔍 DIAGNOSING PROTOCOL MIGRATION ISSUES');
    console.log('=====================================');
    
    const protocols = window.Storage.getProtocols();
    const innerfaces = window.Storage.getInnerfaces();
    
    const problematicProtocols = [];
    
    protocols.forEach(protocol => {
        console.log(`\n📋 Protocol ${protocol.id}: ${protocol.name}`);
        console.log(`   Weight: ${protocol.weight}`);
        console.log(`   Weights object: ${JSON.stringify(protocol.weights)}`);
        console.log(`   Targets: ${JSON.stringify(protocol.targets)}`);
        
        // Проверяем условия для миграции
        const needsMigration = protocol.weight !== undefined && 
                              (!protocol.weights || Object.keys(protocol.weights).length === 0);
        
        console.log(`   Needs migration: ${needsMigration}`);
        
        if (needsMigration) {
            const hasTargets = protocol.targets && protocol.targets.length > 0;
            console.log(`   Has targets: ${hasTargets}`);
            
            if (!hasTargets) {
                console.log(`   ❌ PROBLEM: Protocol has weight but no targets!`);
                problematicProtocols.push({
                    id: protocol.id,
                    name: protocol.name,
                    problem: 'no_targets',
                    weight: protocol.weight,
                    targets: protocol.targets
                });
            } else {
                console.log(`   ✅ Should be migratable`);
                
                // Проверяем валидность targets
                const invalidTargets = protocol.targets.filter(target => {
                    const innerface = innerfaces.find(i => i.id === target);
                    return !innerface;
                });
                
                if (invalidTargets.length > 0) {
                    console.log(`   ❌ PROBLEM: Invalid targets: ${JSON.stringify(invalidTargets)}`);
                    problematicProtocols.push({
                        id: protocol.id,
                        name: protocol.name,
                        problem: 'invalid_targets',
                        weight: protocol.weight,
                        targets: protocol.targets,
                        invalidTargets: invalidTargets
                    });
                } else {
                    problematicProtocols.push({
                        id: protocol.id,
                        name: protocol.name,
                        problem: 'migration_failed',
                        weight: protocol.weight,
                        targets: protocol.targets
                    });
                }
            }
        }
    });
    
    console.log('\n🚨 SUMMARY OF PROBLEMATIC PROTOCOLS:');
    console.log('===================================');
    
    if (problematicProtocols.length === 0) {
        console.log('✅ No problematic protocols found!');
    } else {
        problematicProtocols.forEach(p => {
            console.log(`\nProtocol ${p.id}: ${p.name}`);
            console.log(`  Problem: ${p.problem}`);
            console.log(`  Weight: ${p.weight}`);
            console.log(`  Targets: ${JSON.stringify(p.targets)}`);
            if (p.invalidTargets) {
                console.log(`  Invalid targets: ${JSON.stringify(p.invalidTargets)}`);
            }
        });
    }
    
    return problematicProtocols;
}

// Функция для ручного исправления конкретного протокола
function fixProtocolMigration(protocolId, action = 'auto') {
    console.log(`🔧 FIXING PROTOCOL ${protocolId}`);
    
    const protocols = window.Storage.getProtocols();
    const protocol = protocols.find(p => p.id === protocolId);
    
    if (!protocol) {
        console.log(`❌ Protocol ${protocolId} not found`);
        return false;
    }
    
    console.log(`📋 Protocol: ${protocol.name}`);
    console.log(`   Weight: ${protocol.weight}`);
    console.log(`   Weights: ${JSON.stringify(protocol.weights)}`);
    console.log(`   Targets: ${JSON.stringify(protocol.targets)}`);
    
    if (action === 'remove_weight') {
        // Удаляем weight если нет targets
        delete protocol.weight;
        console.log('✅ Removed weight from protocol with no targets');
    } else if (action === 'add_empty_targets') {
        // Добавляем пустые targets
        protocol.targets = [];
        console.log('✅ Added empty targets array');
    } else if (action === 'migrate_force') {
        // Принудительная миграция
        if (!protocol.weights) {
            protocol.weights = {};
        }
        if (protocol.targets && protocol.targets.length > 0) {
            protocol.targets.forEach(innerfaceId => {
                protocol.weights[innerfaceId] = protocol.weight;
            });
        }
        console.log('✅ Force migrated weight to weights object');
    }
    
    // Сохраняем изменения
    window.Storage.set('protocols', protocols);
    console.log('💾 Saved changes');
    
    return true;
}

// Функция для массового исправления всех проблем
function fixAllProtocolIssues() {
    console.log('�� FIXING ALL PROTOCOL ISSUES');
    console.log('=============================');
    
    const problematic = diagnoseProtocolIssues();
    let fixed = 0;
    
    problematic.forEach(p => {
        console.log(`\n🔧 Fixing Protocol ${p.id}: ${p.name}`);
        
        switch (p.problem) {
            case 'no_targets':
                console.log('   Strategy: Remove weight (protocol has no innerfaces to affect)');
                fixProtocolMigration(p.id, 'remove_weight');
                fixed++;
                break;
                
            case 'invalid_targets':
                console.log('   Strategy: Remove invalid targets and migrate valid ones');
                // TODO: implement cleaning invalid targets
                console.log('   ⚠️ Manual intervention needed for invalid targets');
                break;
                
            case 'migration_failed':
                console.log('   Strategy: Force migration');
                fixProtocolMigration(p.id, 'migrate_force');
                fixed++;
                break;
        }
    });
    
    console.log(`\n✅ Fixed ${fixed} of ${problematic.length} issues`);
    
    // Повторная диагностика
    console.log('\n🔍 Re-running diagnosis...');
    const remaining = diagnoseProtocolIssues();
    
    if (remaining.length === 0) {
        console.log('🎉 All issues resolved!');
    } else {
        console.log(`⚠️ ${remaining.length} issues still remain`);
    }
    
    return { fixed, remaining: remaining.length };
}

console.log('🔍 Protocol diagnosis functions loaded:');
console.log('- diagnoseProtocolIssues() - Find problematic protocols');
console.log('- fixProtocolMigration(id, action) - Fix specific protocol');
console.log('- fixAllProtocolIssues() - Fix all issues automatically');
