export class ApiClient {
  constructor(baseUrl, authService) {
    this.baseUrl = baseUrl;
    this.authService = authService;
  }

  async request(endpoint, options = {}) {
    const token = await this.authService.getIdToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
      
    } catch (error) {
      console.error('API Request failed:', error);
      
      if (error.message.includes('Failed to fetch')) {
        return { success: false, error: 'network_error' };
      }
      
      return { success: false, error: error.message };
    }
  }

  async getUserData() {
    const result = await this.request('/user/data');
    return result.success ? result.data : null;
  }

  async saveUserData(data) {
    return await this.request('/user/data', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addHistoryEntry(entry) {
    return await this.request('/user/history', {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  }

  async deleteHistoryEntry(id) {
    return await this.request(`/user/history/${id}`, {
      method: 'DELETE'
    });
  }

  async updateProtocol(protocol) {
    return await this.request(`/user/protocols/${protocol.id}`, {
      method: 'PUT',
      body: JSON.stringify(protocol)
    });
  }

  async updateInnerface(innerface) {
    return await this.request(`/user/innerfaces/${innerface.id}`, {
      method: 'PUT',
      body: JSON.stringify(innerface)
    });
  }

  async updateState(state) {
    return await this.request(`/user/states/${state.id}`, {
      method: 'PUT',
      body: JSON.stringify(state)
    });
  }

  async testConnection() {
    try {
      const result = await this.request('/test');
      return result.success;
    } catch {
      return false;
    }
  }
}