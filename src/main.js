import { AppController } from './controllers/AppController.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 GameMode v2.0 - Initializing...');
  
  // Check if running in a supported browser
  if (!checkBrowserSupport()) {
    showBrowserError();
    return;
  }
  
  // Initialize the app
  try {
    const app = new AppController();
    await app.initialize();
    
    // Make app globally available for debugging
    window.gameModeApp = app;
    
    console.log('✅ GameMode initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
    showInitError(error);
  }
});

function checkBrowserSupport() {
  // Check for required features
  const required = [
    'localStorage' in window,
    'fetch' in window,
    'Promise' in window,
    'Map' in window,
    'Set' in window
  ];
  
  return required.every(feature => feature);
}

function showBrowserError() {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <h1 style="color: #e74c3c;">Browser Not Supported</h1>
      <p style="color: #666; max-width: 500px; margin: 20px 0;">
        GameMode requires a modern browser with support for ES6+ features.
        Please update your browser or use a recent version of Chrome, Firefox, Safari, or Edge.
      </p>
    </div>
  `;
}

function showInitError(error) {
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
    ">
      <h1 style="color: #e74c3c;">Initialization Error</h1>
      <p style="color: #666; max-width: 500px; margin: 20px 0;">
        Failed to initialize GameMode. Please refresh the page to try again.
      </p>
      <details style="margin-top: 20px; max-width: 500px;">
        <summary style="cursor: pointer; color: #3498db;">Technical Details</summary>
        <pre style="
          background: #f4f4f4;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
          text-align: left;
          overflow-x: auto;
        ">${error.stack || error.message || error}</pre>
      </details>
    </div>
  `;
}