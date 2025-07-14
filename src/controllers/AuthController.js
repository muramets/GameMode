export class AuthController {
  constructor(appController) {
    this.app = appController;
    this.isInitializing = false;
  }

  async initialize() {
    // Wait for Firebase to be available
    await this.waitForFirebase();
    
    // Setup auth state listener
    window.firebaseAuth.onAuthStateChanged((user) => this.handleAuthStateChange(user));
    
    // Setup auth UI event listeners
    this.setupAuthUI();
  }

  waitForFirebase() {
    return new Promise((resolve) => {
      const checkFirebase = () => {
        if (window.firebaseAuth && window.Auth) {
          resolve();
        } else {
          setTimeout(checkFirebase, 100);
        }
      };
      checkFirebase();
    });
  }

  handleAuthStateChange(user) {
    if (this.isInitializing) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    if (user) {
      console.log('User authenticated:', user.email);
      this.isInitializing = true;
      
      this.app.onUserAuthenticated(user).finally(() => {
        this.isInitializing = false;
      });
    } else {
      console.log('User signed out');
      this.isInitializing = false;
      this.app.onUserSignedOut();
    }
  }

  setupAuthUI() {
    // Login form
    const loginForm = document.getElementById('loginFormElement');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    
    // Register form
    const registerForm = document.getElementById('registerFormElement');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }
    
    // Switch between login/register
    const showRegister = document.getElementById('showRegister');
    if (showRegister) {
      showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.showRegisterForm();
      });
    }
    
    const showLogin = document.getElementById('showLogin');
    if (showLogin) {
      showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginForm();
      });
    }
    
    // Google sign in button
    const googleSignIn = document.getElementById('googleSignIn');
    if (googleSignIn) {
      googleSignIn.addEventListener('click', () => this.handleGoogleSignIn());
    }
    
    // Sign out button
    const signOutBtn = document.getElementById('signOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => this.handleSignOut());
    }
    
    // Email validation
    this.setupEmailValidation();
  }

  setupEmailValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      const tooltip = document.getElementById(input.id + 'Tooltip');
      
      input.addEventListener('invalid', (e) => {
        e.preventDefault();
        if (tooltip) {
          tooltip.style.display = 'block';
        }
      });
      
      input.addEventListener('input', () => {
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      });
    });
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      await window.Auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      this.showAuthError(error);
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
      const result = await window.Auth.createUserWithEmailAndPassword(email, password);
      
      // Update display name
      if (result.user && name) {
        await result.user.updateProfile({ displayName: name });
      }
    } catch (error) {
      this.showAuthError(error);
    }
  }

  async handleGoogleSignIn() {
    try {
      await window.Auth.signInWithPopup(new window.firebase.auth.GoogleAuthProvider());
    } catch (error) {
      this.showAuthError(error);
    }
  }

  async handleSignOut() {
    try {
      await window.firebaseAuth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  showLoginForm() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('registerForm').classList.add('hidden');
  }

  showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
  }

  showAuthError(error) {
    let message = 'Authentication failed';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Email/password accounts are not enabled';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak (minimum 6 characters)';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Invalid password';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked. Please allow popups for this site';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign in was cancelled';
        break;
      default:
        message = error.message || 'Authentication failed';
    }
    
    this.app.showToast(message, 'error');
  }
}