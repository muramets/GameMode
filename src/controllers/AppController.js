import { LocalStorageService } from '../services/storage/LocalStorageService.js';
import { SyncService } from '../services/sync/SyncService.js';
import { ApiClient } from '../services/api/ApiClient.js';
import { DataService } from '../services/DataService.js';
import { ExportImportService } from '../services/ExportImportService.js';
import { AuthController } from './AuthController.js';
import { DashboardView } from '../views/DashboardView.js';
import { ProtocolsView } from '../views/ProtocolsView.js';
import { InnerfacesView } from '../views/InnerfacesView.js';
import { StatesView } from '../views/StatesView.js';
import { HistoryView } from '../views/HistoryView.js';
import { Protocol } from '../models/Protocol.js';
import { HistoryEntry } from '../models/HistoryEntry.js';
import { UI_CONFIG } from '../config/constants.js';

export class AppController {
  constructor() {
    this.currentUser = null;
    this.currentPage = 'dashboard';
    this.views = {};
    this.services = {};
    this.initialized = false;
  }

  async initialize() {
    // Initialize services
    this.services.localStorage = new LocalStorageService();
    this.services.apiClient = new ApiClient(
      'https://rpg-therapy-backend-production.up.railway.app/api',
      { getIdToken: () => window.firebaseAuth?.currentUser?.getIdToken() }
    );
    this.services.sync = new SyncService(
      this.services.localStorage,
      this.services.apiClient
    );
    this.services.data = new DataService(
      this.services.localStorage,
      this.services.sync
    );
    this.services.exportImport = new ExportImportService(this.services.data);
    
    // Initialize auth controller
    this.authController = new AuthController(this);
    
    // Initialize views
    this.views.dashboard = new DashboardView(this);
    this.views.protocols = new ProtocolsView(this);
    this.views.innerfaces = new InnerfacesView(this);
    this.views.states = new StatesView(this);
    this.views.history = new HistoryView(this);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize auth
    await this.authController.initialize();
    
    this.initialized = true;
  }

  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-navigate]')) {
        e.preventDefault();
        const page = e.target.closest('[data-navigate]').dataset.navigate;
        this.navigateTo(page);
      }
    });
    
    // Protocol check-ins
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-protocol-id]')) {
        const protocolId = parseInt(e.target.closest('[data-protocol-id]').dataset.protocolId);
        this.handleProtocolCheckin(protocolId);
      }
    });
    
    // Export/Import
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="export"]')) {
        this.handleExport();
      }
      if (e.target.closest('[data-action="import"]')) {
        this.handleImport();
      }
    });
  }

  async onUserAuthenticated(user) {
    this.currentUser = user;
    
    // Set user in services
    this.services.localStorage.setUser(user);
    
    // Initialize data with defaults if needed
    const initialData = await import('../config/initialData.js');
    await this.services.data.initialize(initialData.INITIAL_DATA);
    
    // Start sync
    await this.services.sync.syncWithServer();
    this.services.sync.startPeriodicSync();
    
    // Show app
    this.showApp();
  }

  onUserSignedOut() {
    this.currentUser = null;
    this.services.sync.stopPeriodicSync();
    this.hideApp();
  }

  showApp() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'block';
    
    // Update username
    const usernameEl = document.getElementById('username');
    if (usernameEl) {
      usernameEl.textContent = this.currentUser.displayName || this.currentUser.email || 'Player';
    }
    
    // Navigate to dashboard
    this.navigateTo('dashboard');
  }

  hideApp() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
  }

  navigateTo(page) {
    this.currentPage = page;
    
    // Update navigation
    document.querySelectorAll('[data-navigate]').forEach(el => {
      el.classList.toggle('active', el.dataset.navigate === page);
    });
    
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show current page
    const pageContainer = document.getElementById(`${page}Page`);
    if (pageContainer) {
      pageContainer.style.display = 'block';
    }
    
    // Render view
    if (this.views[page]) {
      this.views[page].render();
    }
  }

  async handleProtocolCheckin(protocolId) {
    const protocol = this.services.data.getProtocolById(protocolId);
    if (!protocol) return;
    
    // Calculate changes
    const changes = {};
    const impact = protocol.action === '+' ? protocol.weight : -protocol.weight;
    
    protocol.targets.forEach(innerfaceId => {
      changes[innerfaceId] = impact;
    });
    
    // Create history entry
    const entry = new HistoryEntry({
      type: 'protocol',
      protocolId: protocol.id,
      protocolName: protocol.name,
      changes
    });
    
    // Add to history
    await this.services.data.addHistoryEntry(entry);
    
    // Update UI
    this.updateAllViews();
    
    // Show toast
    this.showToast(`✓ ${protocol.name} recorded`);
  }

  async handleExport() {
    try {
      this.services.exportImport.exportData();
      this.showToast('✓ Data exported successfully');
    } catch (error) {
      this.showToast('✗ Export failed: ' + error.message, 'error');
    }
  }

  async handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.gamemode.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const result = await this.services.exportImport.importData(file);
        
        let message = '✓ Import completed:\n';
        Object.entries(result.imported).forEach(([key, count]) => {
          if (count > 0) {
            message += `${key}: ${count}\n`;
          }
        });
        
        if (result.errors.length > 0) {
          message += `\nErrors: ${result.errors.length}`;
        }
        
        this.showToast(message);
        this.updateAllViews();
        
      } catch (error) {
        this.showToast('✗ Import failed: ' + error.message, 'error');
      }
    };
    
    input.click();
  }

  updateAllViews() {
    Object.values(this.views).forEach(view => {
      if (view.update) {
        view.update();
      }
    });
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toastContainer') || document.body;
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, UI_CONFIG.TOAST_DURATION);
  }

  // Utility methods for views
  getDataService() {
    return this.services.data;
  }

  getSyncService() {
    return this.services.sync;
  }

  getExportImportService() {
    return this.services.exportImport;
  }
}