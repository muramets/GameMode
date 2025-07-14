// Функция для принудительного пересчета всей истории протоколов с текущими весами
function fixWeightMigration() {
    console.log('🔧 FIXING WEIGHT MIGRATION: Starting force recalculation...');
    
    // Используем новую функцию для принудительного пересчета
    const totalRecalculated = window.Storage.forceRecalculateAllProtocolHistory();
    
    console.log(`🎉 MIGRATION COMPLETE: ${totalRecalculated} protocols recalculated`);
    
    // Проверяем результат
    setTimeout(() => {
        console.log('🔍 TESTING RESULTS:');
        
        // Проверяем Relationship
        console.log('------- RELATIONSHIP CHECK -------');
        quickRelationshipCheck();
        console.log('---');
        debugRelationship();
        
        // Проверяем Body Sync
        console.log('------- BODY SYNC CHECK -------');
        debugBodySync();
        
        console.log('✅ Migration test complete!');
    }, 1000);
}

// Экспортируем функцию в глобальную область видимости
window.fixWeightMigration = fixWeightMigration;
console.log('💉 Weight migration fix loaded! Run: fixWeightMigration()');
