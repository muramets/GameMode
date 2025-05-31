// js/api-client.js
class APIClient {
  constructor() {
    // Используем локальный backend для разработки
    this.baseURL = 'http://localhost:5001/api';
  }
  
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }
  
  async getUserData() {
    const token = await this.getAuthToken();
    return this.request('/user/data', {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async saveUserData(data) {
    const token = await this.getAuthToken();
    return this.request('/user/data', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
  }
  
  async getHistory(limit = 100, skip = 0) {
    const token = await this.getAuthToken();
    return this.request(`/user/history?limit=${limit}&skip=${skip}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async addHistory(historyEntry) {
    const token = await this.getAuthToken();
    return this.request('/user/history', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(historyEntry)
    });
  }
  
  async deleteHistory(historyId) {
    const token = await this.getAuthToken();
    return this.request(`/user/history/${historyId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  }
  
  async getAuthToken() {
    if (!window.firebaseAuth?.currentUser) {
      throw new Error('User not authenticated');
    }
    return await window.firebaseAuth.currentUser.getIdToken();
  }
}

// Глобальный экземпляр API клиента
window.apiClient = new APIClient(); 