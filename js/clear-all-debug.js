// 🔧 DEBUG: Global functions for Clear All testing
window.clearAllDebug = {
  // Pre-clear diagnostics
  preClear() {
    console.log('🔧 === CLEAR ALL PRE-STATE DEBUG ===');
    
    const preState = window.Storage.diagnosticClearAllState();
    
    // Show innerfaces scores before clear
    const innerfaces = window.Storage.getInnerfaces();
    console.log('💯 INNERFACES SCORES BEFORE CLEAR:');
    innerfaces.slice(0, 3).forEach(innerface => {
      const score = window.Storage.calculateCurrentScore(innerface.id);
      console.log(`  ${innerface.name}: ${score}`);
    });
    
    return preState;
  },

  // Post-clear diagnostics
  postClear() {
    console.log('🔧 === CLEAR ALL POST-STATE DEBUG ===');
    
    const postState = window.Storage.diagnosticClearAllState();
    
    // Show innerfaces scores after clear
    const innerfaces = window.Storage.getInnerfaces();
    console.log('💯 INNERFACES SCORES AFTER CLEAR:');
    innerfaces.slice(0, 3).forEach(innerface => {
      const score = window.Storage.calculateCurrentScore(innerface.id);
      console.log(`  ${innerface.name}: ${score}`);
    });
    
    return postState;
  },

  // Check server state
  async serverCheck() {
    console.log('🔧 === SERVER STATE CHECK ===');
    const serverData = await debugSync.checkServerData();
    
    if (serverData) {
      console.log('📊 SERVER HISTORY COUNT:', (serverData.history || []).length);
      console.log('📊 SERVER DELETED COUNT:', (serverData.deletedCheckins || []).length);
    }
    
    return serverData;
  },

  // Full test sequence
  async fullTest() {
    console.log('🧪 === FULL CLEAR ALL TEST SEQUENCE ===');
    
    console.log('1️⃣ Pre-clear state:');
    const preState = this.preClear();
    
    console.log('2️⃣ Server state before:');
    await this.serverCheck();
    
    console.log('3️⃣ Ready for Clear All action...');
    console.log('   👆 Now click "Clear All" button in UI');
    
    return { preState };
  },

  // Test localStorage clearing (simulate new device)
  simulateNewDevice() {
    console.log('📱 === SIMULATING NEW DEVICE ===');
    
    if (confirm('This will clear ALL localStorage and reload the page. Continue?')) {
      // Clear all localStorage
      localStorage.clear();
      console.log('🧹 localStorage cleared completely');
      
      // Reload page to simulate fresh login
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }
};

// 🔧 НОВОЕ: Исправление проблемы с исчезающими протоколами
function fixProtocolDeletionIssue() {
  console.log('🔧 FIXING PROTOCOL DELETION ISSUE...');
  
  // Проверяем текущие записи удаления
  const deletedProtocols = window.Storage.get('deletedProtocols') || [];
  console.log('🔍 Current deleted protocols:', deletedProtocols);
  
  // Удаляем проблемные ID (26 и другие часто используемые)
  const problematicIds = [26, 25, 27, 28, 29, 30];
  const result = window.Storage.removeFromDeletedProtocols(problematicIds);
  
  console.log('✅ PROTOCOL DELETION ISSUE FIXED:', result);
  
  // Показываем результат пользователю
  if (window.App && window.App.showToast) {
    window.App.showToast(`Fixed protocol deletion issue. Removed ${result.removed} problematic deletion records.`, 'success');
  }
  
  return result;
}

// 🔧 НОВОЕ: Отладка innerfaces в dropdown
function debugInnerfaceDropdown() {
  console.log('🔍 DEBUGGING INNERFACE DROPDOWN...');
  
  const innerfaces = window.Storage.getInnerfaces();
  console.log('📋 All innerfaces:', innerfaces);
  
  // Ищем "Close Community"
  const closeCommunity = innerfaces.find(i => i.name.includes('Close Community'));
  if (closeCommunity) {
    console.log('✅ Found "Close Community" innerface:', closeCommunity);
  } else {
    console.log('❌ "Close Community" innerface not found');
    
    // Ищем другие варианты
    const communityInnerfaces = innerfaces.filter(i => i.name.toLowerCase().includes('community'));
    console.log('🔍 Community-related innerfaces:', communityInnerfaces);
  }
  
  return { total: innerfaces.length, closeCommunity, allInnerfaces: innerfaces };
}

// 🔧 НОВОЕ: Полная очистка проблемных записей удаления
function clearProblematicDeletions() {
  console.log('🧹 CLEARING ALL PROBLEMATIC DELETION RECORDS...');
  
  // Очищаем все записи удаления
  const results = {
    protocols: window.Storage.clearDeletedProtocols(),
    innerfaces: window.Storage.clearDeletedInnerfaces(),
    states: window.Storage.clearDeletedStates(),
    checkins: window.Storage.clearDeletedCheckins()
  };
  
  console.log('✅ CLEARED ALL DELETION RECORDS:', results);
  
  // Принудительная синхронизация
  window.Storage.markForSync();
  
  if (window.App && window.App.showToast) {
    window.App.showToast('Cleared all deletion records. Problems should be fixed.', 'success');
  }
  
  return results;
}

console.log('🧪 CLEAR ALL DEBUG: Functions available:');
console.log('1. clearAllDataCompletely() - Full reset');
console.log('2. clearAllHistoryOnly() - Clear history only');
console.log('3. fixProtocolDeletionIssue() - Fix disappearing protocols');
console.log('4. debugInnerfaceDropdown() - Debug innerface dropdown');
console.log('5. clearProblematicDeletions() - Clear all deletion records');
console.log('6. window.Storage.cleanupOldDeletionRecords() - Clean old deletions');
console.log('7. window.Storage.removeFromDeletedProtocols([26, 27]) - Remove specific IDs');
console.log('💡 Use these functions in console to fix issues!'); 