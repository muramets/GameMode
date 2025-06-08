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

console.log('🧪 CLEAR ALL DEBUG: Functions available:');
console.log('  - clearAllDebug.preClear() - Check state before clear');
console.log('  - clearAllDebug.postClear() - Check state after clear');
console.log('  - clearAllDebug.serverCheck() - Check server state');
console.log('  - clearAllDebug.fullTest() - Run full test sequence');
console.log('  - clearAllDebug.simulateNewDevice() - Clear localStorage and reload'); 