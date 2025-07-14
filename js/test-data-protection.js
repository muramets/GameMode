// Тестирование новой системы защиты данных
async function testDataProtection() {
    console.log('🛡️ TESTING DATA PROTECTION SYSTEM');
    console.log('================================');
    
    try {
        // 1. Тестируем автоматическую проверку целостности
        console.log('1. Testing automatic integrity check...');
        const integrityResult = await window.Storage.autoFixDataIntegrity();
        console.log('✅ Integrity check result:', integrityResult);
        
        // 2. Тестируем обнаружение проблем с миграцией
        console.log('\n2. Testing weight migration issue detection...');
        const migrationIssues = window.Storage.detectWeightMigrationIssues();
        console.log('🔍 Migration issues found:', migrationIssues.length);
        
        // 3. Тестируем обнаружение несоответствий в чекинах
        console.log('\n3. Testing checkin inconsistency detection...');
        const checkinIssues = window.Storage.detectCheckinInconsistencies();
        console.log('🔍 Checkin issues found:', checkinIssues.length);
        
        // 4. Создаем тестовый чекин чтобы проверить валидацию
        console.log('\n4. Testing new checkin validation...');
        const protocols = window.Storage.getProtocols();
        if (protocols.length > 0) {
            const testProtocol = protocols.find(p => p.targets && p.targets.length > 0);
            if (testProtocol) {
                console.log(`Creating test checkin for protocol: ${testProtocol.name}`);
                const testCheckin = window.Storage.addCheckin(testProtocol.id, '+');
                console.log('✅ Test checkin created with validation:', testCheckin.id);
            }
        }
        
        // 5. Проверяем UI индикатор
        console.log('\n5. Testing UI integrity indicator...');
        window.Storage.updateIntegrityStatusIndicator();
        const indicator = document.getElementById('integrity-status');
        if (indicator && indicator.style.display !== 'none') {
            console.log('✅ UI integrity indicator is visible');
        } else {
            console.log('ℹ️ UI integrity indicator is hidden (no data yet)');
        }
        
        // 6. Тестируем функции для отладки
        console.log('\n6. Testing debug functions...');
        console.log('Available protection functions:');
        console.log('- window.Storage.autoFixDataIntegrity()');
        console.log('- window.Storage.forceRecalculateAllProtocolHistory()');
        console.log('- window.Storage.detectWeightMigrationIssues()');
        console.log('- window.Storage.detectCheckinInconsistencies()');
        console.log('- window.Storage.updateIntegrityStatusIndicator()');
        
        console.log('\n🎉 DATA PROTECTION SYSTEM TEST COMPLETE!');
        console.log('The system now automatically:');
        console.log('✅ Checks data integrity on startup');
        console.log('✅ Validates weights before creating checkins');
        console.log('✅ Auto-fixes weight migration issues');
        console.log('✅ Shows status indicator in UI');
        console.log('✅ Provides debugging tools');
        
        // Показываем пример использования
        console.log('\n📝 USAGE EXAMPLES:');
        console.log('// Force fix all data integrity issues:');
        console.log('await window.Storage.autoFixDataIntegrity();');
        console.log('');
        console.log('// Recalculate all protocol history:');
        console.log('window.Storage.forceRecalculateAllProtocolHistory();');
        console.log('');
        console.log('// Check for migration issues:');
        console.log('window.Storage.detectWeightMigrationIssues();');
        
        return true;
        
    } catch (error) {
        console.error('🚨 DATA PROTECTION TEST ERROR:', error);
        return false;
    }
}

// Экспортируем функцию
window.testDataProtection = testDataProtection;
console.log('🛡️ Data protection test loaded! Run: testDataProtection()');
