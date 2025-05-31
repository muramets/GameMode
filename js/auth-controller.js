// js/auth-controller.js
class AuthController {
  constructor() {
    this.currentUser = null;
    this.isInitialized = false;
    this.initPromise = null;
  }
  
  async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = new Promise((resolve) => {
      // Ждем когда Firebase SDK загрузится
      const checkFirebase = () => {
        if (window.firebaseAuth && window.firebaseOnAuthStateChanged) {
          window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
            this.currentUser = user;
            
            if (user) {
              console.log('User logged in:', user.email);
              await this.loadUserData();
              this.showApp();
            } else {
              console.log('User logged out');
              this.showAuth();
            }
            
            if (!this.isInitialized) {
              this.isInitialized = true;
              resolve();
            }
          });
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
    
    return this.initPromise;
  }
  
  async signIn(email, password) {
    try {
      const userCredential = await window.firebaseSignIn(window.firebaseAuth, email, password);
      return userCredential.user;
    } catch (error) {
      throw this.parseFirebaseError(error);
    }
  }
  
  async signUp(name, email, password) {
    try {
      const userCredential = await window.firebaseSignUp(window.firebaseAuth, email, password);
      await window.firebaseUpdateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    } catch (error) {
      throw this.parseFirebaseError(error);
    }
  }
  
  async signOut() {
    try {
      await window.firebaseSignOut(window.firebaseAuth);
      if (window.Storage) {
        Storage.disableSync();
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
  
  async loadUserData() {
    try {
      const userData = await window.apiClient.getUserData();
      
      // Синхронизируем данные с локальным storage
      if (userData && Object.keys(userData).length > 0) {
        if (window.Storage) {
          Storage.syncFromServer(userData);
        }
      } else {
        // Если на сервере нет данных, загружаем локальные
        await this.uploadLocalData();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Продолжаем работать с локальными данными
    }
  }
  
  async uploadLocalData() {
    try {
      if (window.Storage) {
        const localData = Storage.getAllData();
        if (localData && Object.keys(localData).length > 0) {
          await window.apiClient.saveUserData(localData);
          console.log('Local data uploaded to server');
        }
      }
    } catch (error) {
      console.error('Failed to upload local data:', error);
    }
  }
  
  showAuth() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
  
  showApp() {
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    
    // Включаем синхронизацию
    if (window.Storage) {
      Storage.enableSync();
    }
  }
  
  parseFirebaseError(error) {
    const errorMessages = {
      'auth/user-not-found': 'Player not found',
      'auth/wrong-password': 'Wrong password',
      'auth/email-already-in-use': 'Email already in use',
      'auth/weak-password': 'Password too weak',
      'auth/invalid-email': 'Invalid email format',
      'auth/invalid-credential': 'Invalid credentials'
    };
    
    return new Error(errorMessages[error.code] || error.message);
  }
}

// Глобальный экземпляр Auth Controller
window.authController = new AuthController(); 