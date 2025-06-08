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

// 🎨 НОВОЕ: Debug функции для проверки цветов
function debugProtocolColors() {
  console.log('🎨 PROTOCOL COLORS DEBUG REPORT:');
  
  const protocols = window.Storage.getProtocols();
  
  console.log(`📊 Total protocols: ${protocols.length}`);
  
  const protocolsWithColors = protocols.filter(p => p.color);
  const protocolsWithoutColors = protocols.filter(p => !p.color);
  
  console.log(`🎨 Protocols with colors: ${protocolsWithColors.length}`);
  console.log(`⚪ Protocols without colors: ${protocolsWithoutColors.length}`);
  
  console.log('\n🎨 PROTOCOLS WITH COLORS:');
  protocolsWithColors.forEach(protocol => {
    console.log(`  ${protocol.id}: ${protocol.name.split('. ')[0]} - ${protocol.color} (${protocol.icon})`);
  });
  
  console.log('\n⚪ PROTOCOLS WITHOUT COLORS:');
  protocolsWithoutColors.forEach(protocol => {
    console.log(`  ${protocol.id}: ${protocol.name.split('. ')[0]} - no color (${protocol.icon})`);
  });
  
  // Test renderIcon function
  console.log('\n🧪 TESTING RENDER ICON FUNCTION:');
  protocolsWithColors.slice(0, 3).forEach(protocol => {
    const result = window.UI.renderIcon(protocol.icon, protocol.color);
    console.log(`  Protocol ${protocol.id} (${protocol.icon}) with color ${protocol.color}:`);
    console.log(`  Result: ${result}`);
  });
  
  return {
    total: protocols.length,
    withColors: protocolsWithColors.length,
    withoutColors: protocolsWithoutColors.length,
    protocolsWithColors,
    protocolsWithoutColors
  };
}

function debugInnerfaceColors() {
  console.log('🎨 INNERFACE COLORS DEBUG REPORT:');
  
  const innerfaces = window.Storage.getInnerfaces();
  
  console.log(`📊 Total innerfaces: ${innerfaces.length}`);
  
  const innerfacesWithColors = innerfaces.filter(i => i.color);
  const innerfacesWithoutColors = innerfaces.filter(i => !i.color);
  
  console.log(`🎨 Innerfaces with colors: ${innerfacesWithColors.length}`);
  console.log(`⚪ Innerfaces without colors: ${innerfacesWithoutColors.length}`);
  
  console.log('\n🎨 INNERFACES WITH COLORS:');
  innerfacesWithColors.forEach(innerface => {
    console.log(`  ${innerface.id}: ${innerface.name.split('. ')[0]} - ${innerface.color} (${innerface.icon})`);
  });
  
  console.log('\n⚪ INNERFACES WITHOUT COLORS:');
  innerfacesWithoutColors.forEach(innerface => {
    console.log(`  ${innerface.id}: ${innerface.name.split('. ')[0]} - no color (${innerface.icon})`);
  });
  
  return {
    total: innerfaces.length,
    withColors: innerfacesWithColors.length,
    withoutColors: innerfacesWithoutColors.length,
    innerfacesWithColors,
    innerfacesWithoutColors
  };
}

function testColorRendering() {
  console.log('🧪 TESTING COLOR RENDERING:');
  
  const testColors = ['#ca4754', '#e6934a', '#e2b714', '#98c379', '#7fb3d3'];
  const testEmojis = ['🌀', '📦', '🎧', '🔁', '❤️'];
  
  testEmojis.forEach((emoji, index) => {
    const color = testColors[index];
    const result = window.UI.renderIcon(emoji, color);
    console.log(`🎨 Test ${index + 1}: ${emoji} with color ${color}`);
    console.log(`   Result: ${result}`);
    console.log(`   Is FontAwesome: ${window.UI.emojiToFontAwesome(emoji).startsWith('fas ')}`);
  });
}

function forceRefreshProtocols() {
  console.log('🔄 FORCING PROTOCOL REFRESH...');
  
  if (window.UI && window.UI.renderProtocols) {
    window.UI.renderProtocols();
    console.log('✅ Protocols refreshed');
  } else {
    console.error('❌ UI.renderProtocols not available');
  }
  
  if (window.App && window.App.currentPage === 'protocols') {
    window.App.renderPage('protocols');
    console.log('✅ Protocols page re-rendered');
  }
}

console.log('🧪 CLEAR ALL DEBUG: Functions available:');
console.log('1. clearAllDataCompletely() - Full reset');
console.log('2. clearAllHistoryOnly() - Clear history only');
console.log('3. fixProtocolDeletionIssue() - Fix disappearing protocols');
console.log('4. debugInnerfaceDropdown() - Debug innerface dropdown');
console.log('5. clearProblematicDeletions() - Clear all deletion records');
console.log('6. window.Storage.cleanupOldDeletionRecords() - Clean old deletions');
console.log('7. window.Storage.removeFromDeletedProtocols([26, 27]) - Remove specific IDs');
console.log('🧪 COLOR DEBUG: Functions available:');
console.log('1. debugProtocolColors() - Check protocol color data');
console.log('2. debugInnerfaceColors() - Check innerface color data');
console.log('3. testColorRendering() - Test color rendering with sample data');
console.log('4. forceRefreshProtocols() - Force refresh protocol display');
console.log('💡 Use these functions in console to fix issues and debug color issues!');

// 🔧 DEBUG CONTROL FUNCTIONS
function enableDebugUI() {
  window.DEBUG_UI = true;
  console.log('✅ UI Debug logging ENABLED');
  console.log('🔧 Restart any operations to see debug output');
}

function disableDebugUI() {
  window.DEBUG_UI = false;
  console.log('❌ UI Debug logging DISABLED');
}

function enableDebugModals() {
  window.DEBUG_MODALS = true;
  console.log('✅ Modals Debug logging ENABLED');
  console.log('🔧 Open any modal to see debug output');
}

function disableDebugModals() {
  window.DEBUG_MODALS = false;
  console.log('❌ Modals Debug logging DISABLED');
}

function enableAllDebug() {
  window.DEBUG_UI = true;
  window.DEBUG_MODALS = true;
  console.log('✅ ALL Debug logging ENABLED');
  console.log('🔧 Restart operations to see debug output');
}

function disableAllDebug() {
  window.DEBUG_UI = false;
  window.DEBUG_MODALS = false;
  console.log('❌ ALL Debug logging DISABLED');
}

// 🌐 ГЛОБАЛЬНЫЙ ЭКСПОРТ: Делаем все debug функции доступными в консоли
window.enableDebugUI = enableDebugUI;
window.disableDebugUI = disableDebugUI;
window.enableDebugModals = enableDebugModals;
window.disableDebugModals = disableDebugModals;
window.enableAllDebug = enableAllDebug;
window.disableAllDebug = disableAllDebug;
window.fixProtocolDeletionIssue = fixProtocolDeletionIssue;
window.debugInnerfaceDropdown = debugInnerfaceDropdown;
window.clearProblematicDeletions = clearProblematicDeletions;
window.debugProtocolColors = debugProtocolColors;
window.debugInnerfaceColors = debugInnerfaceColors;
window.testColorRendering = testColorRendering;
window.forceRefreshProtocols = forceRefreshProtocols;

console.log('🔧 DEBUG CONTROL: Functions available:');
console.log('- enableDebugUI() / disableDebugUI() - UI debug logs');
console.log('- enableDebugModals() / disableDebugModals() - Modal debug logs');
console.log('- enableAllDebug() / disableAllDebug() - All debug logs'); 
console.log('🎨 COLOR DEBUG: All functions now globally available in console!');
console.log('💡 Try: disableAllDebug() or debugProtocolColors()'); 