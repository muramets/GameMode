import { EXPORT_CONFIG, APP_VERSION } from '../config/constants.js';
import { Protocol } from '../models/Protocol.js';
import { Innerface } from '../models/Innerface.js';
import { State } from '../models/State.js';
import { HistoryEntry } from '../models/HistoryEntry.js';

export class ExportImportService {
  constructor(dataService) {
    this.dataService = dataService;
  }

  exportData() {
    const data = this.dataService.getAllData();
    
    const exportData = {
      version: EXPORT_CONFIG.FILE_VERSION,
      appVersion: APP_VERSION,
      exportDate: new Date().toISOString(),
      data: {
        protocols: data.protocols,
        innerfaces: data.innerfaces,
        states: data.states,
        history: data.history,
        quickActions: data.quickActions,
        orders: {
          protocols: data.protocolOrder,
          innerfaces: data.innerfaceOrder,
          states: data.stateOrder,
          quickActions: data.quickActionOrder
        }
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gamemode_export_${new Date().toISOString().split('T')[0]}${EXPORT_CONFIG.FILE_EXTENSION}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return true;
  }

  async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importData = JSON.parse(e.target.result);
          
          // Validate import data
          const validation = this.validateImportData(importData);
          if (!validation.isValid) {
            reject(new Error(`Invalid import file: ${validation.errors.join(', ')}`));
            return;
          }
          
          // Ask user for import options
          const options = await this.getImportOptions();
          if (!options) {
            reject(new Error('Import cancelled'));
            return;
          }
          
          // Process import based on options
          const result = await this.processImport(importData.data, options);
          resolve(result);
          
        } catch (error) {
          reject(new Error(`Failed to parse import file: ${error.message}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  validateImportData(data) {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Invalid file format');
      return { isValid: false, errors };
    }
    
    if (!data.version) {
      errors.push('Missing version information');
    }
    
    if (!data.data || typeof data.data !== 'object') {
      errors.push('Missing or invalid data section');
    } else {
      // Validate each data type
      if (data.data.protocols && !this.validateProtocols(data.data.protocols)) {
        errors.push('Invalid protocols data');
      }
      
      if (data.data.innerfaces && !this.validateInnerfaces(data.data.innerfaces)) {
        errors.push('Invalid innerfaces data');
      }
      
      if (data.data.states && !this.validateStates(data.data.states)) {
        errors.push('Invalid states data');
      }
      
      if (data.data.history && !this.validateHistory(data.data.history)) {
        errors.push('Invalid history data');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateProtocols(protocols) {
    if (!Array.isArray(protocols)) return false;
    
    return protocols.every(p => {
      const protocol = new Protocol(p);
      return protocol.validate().isValid;
    });
  }

  validateInnerfaces(innerfaces) {
    if (!Array.isArray(innerfaces)) return false;
    
    return innerfaces.every(i => {
      const innerface = new Innerface(i);
      return innerface.validate().isValid;
    });
  }

  validateStates(states) {
    if (!Array.isArray(states)) return false;
    
    return states.every(s => {
      const state = new State(s);
      return state.validate().isValid;
    });
  }

  validateHistory(history) {
    if (!Array.isArray(history)) return false;
    
    return history.every(h => {
      const entry = new HistoryEntry(h);
      return entry.validate().isValid;
    });
  }

  async getImportOptions() {
    // This should show a modal to the user
    // For now, return default options
    return {
      replaceExisting: false,
      mergeHistory: true,
      importProtocols: true,
      importInnerfaces: true,
      importStates: true,
      importHistory: true,
      importQuickActions: true
    };
  }

  async processImport(data, options) {
    const results = {
      imported: {
        protocols: 0,
        innerfaces: 0,
        states: 0,
        history: 0,
        quickActions: 0
      },
      errors: []
    };
    
    try {
      if (options.replaceExisting) {
        // Clear existing data first
        await this.dataService.clearAll();
      }
      
      // Import protocols
      if (options.importProtocols && data.protocols) {
        for (const protocol of data.protocols) {
          try {
            await this.dataService.addProtocol(new Protocol(protocol));
            results.imported.protocols++;
          } catch (error) {
            results.errors.push(`Protocol ${protocol.name}: ${error.message}`);
          }
        }
      }
      
      // Import innerfaces
      if (options.importInnerfaces && data.innerfaces) {
        for (const innerface of data.innerfaces) {
          try {
            await this.dataService.addInnerface(new Innerface(innerface));
            results.imported.innerfaces++;
          } catch (error) {
            results.errors.push(`Innerface ${innerface.name}: ${error.message}`);
          }
        }
      }
      
      // Import states
      if (options.importStates && data.states) {
        for (const state of data.states) {
          try {
            await this.dataService.addState(new State(state));
            results.imported.states++;
          } catch (error) {
            results.errors.push(`State ${state.name}: ${error.message}`);
          }
        }
      }
      
      // Import history
      if (options.importHistory && data.history) {
        const historyToImport = options.mergeHistory ? data.history : data.history.slice(-100);
        for (const entry of historyToImport) {
          try {
            await this.dataService.addHistoryEntry(new HistoryEntry(entry));
            results.imported.history++;
          } catch (error) {
            results.errors.push(`History entry: ${error.message}`);
          }
        }
      }
      
      // Import quick actions
      if (options.importQuickActions && data.quickActions) {
        await this.dataService.setQuickActions(data.quickActions);
        results.imported.quickActions = data.quickActions.length;
      }
      
      // Import orders if available
      if (data.orders) {
        if (data.orders.protocols) await this.dataService.setProtocolOrder(data.orders.protocols);
        if (data.orders.innerfaces) await this.dataService.setInnerfaceOrder(data.orders.innerfaces);
        if (data.orders.states) await this.dataService.setStateOrder(data.orders.states);
        if (data.orders.quickActions) await this.dataService.setQuickActionOrder(data.orders.quickActions);
      }
      
    } catch (error) {
      results.errors.push(`Import error: ${error.message}`);
    }
    
    return results;
  }
}