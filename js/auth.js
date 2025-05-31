// ===== auth.js - Firebase Authentication =====

class Auth {
    constructor() {
        this.currentUser = null;
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Wait for DOM to be ready
        document.addEventListener('DOMContentLoaded', () => {
            this.setupFormHandlers();
        });
    }
    
    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Register form  
        const registerForm = document.getElementById('registerFormElement');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
        
        // Form switching
        const showRegisterLink = document.getElementById('showRegister');
        const showLoginLink = document.getElementById('showLogin');
        
        if (showRegisterLink) {
            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToRegister();
            });
        }
        
        if (showLoginLink) {
            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        this.showLoading('signing in...');
        this.hideError();
        
        try {
            const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            console.log('✅ Login successful:', userCredential.user.email);
            
            this.hideLoading();
            // Auth state listener will handle the UI transition
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.hideLoading();
            this.showError(this.getErrorMessage(error.code));
        }
    }
    
    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }
        
        this.showLoading('creating account...');
        this.hideError();
        
        try {
            const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            
            // Update display name
            await userCredential.user.updateProfile({
                displayName: name
            });
            
            console.log('✅ Registration successful:', userCredential.user.email);
            
            this.hideLoading();
            // Auth state listener will handle the UI transition
            
        } catch (error) {
            console.error('❌ Registration failed:', error);
            this.hideLoading();
            this.showError(this.getErrorMessage(error.code));
        }
    }
    
    async logout() {
        try {
            await window.firebaseAuth.signOut();
            console.log('✅ Logout successful');
        } catch (error) {
            console.error('❌ Logout failed:', error);
        }
    }
    
    switchToRegister() {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        this.hideError();
        this.clearForms();
    }
    
    switchToLogin() {
        document.getElementById('registerForm').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        this.hideError();
        this.clearForms();
    }
    
    clearForms() {
        // Clear login form
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Clear register form
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
    }
    
    showLoading(message) {
        const loading = document.getElementById('authLoading');
        if (loading) {
            loading.textContent = message;
            loading.classList.remove('hidden');
        }
    }
    
    hideLoading() {
        const loading = document.getElementById('authLoading');
        if (loading) {
            loading.classList.add('hidden');
        }
    }
    
    showError(message) {
        const error = document.getElementById('authError');
        if (error) {
            error.textContent = message;
            error.classList.remove('hidden');
        }
    }
    
    hideError() {
        const error = document.getElementById('authError');
        if (error) {
            error.classList.add('hidden');
        }
    }
    
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'Email already registered',
            'auth/weak-password': 'Password too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/network-request-failed': 'Network error. Check connection.',
            'auth/too-many-requests': 'Too many attempts. Try again later.',
            'auth/user-disabled': 'Account has been disabled',
            'auth/invalid-credential': 'Invalid login credentials'
        };
        
        return errorMessages[errorCode] || 'Authentication failed. Please try again.';
    }
}

// Initialize Auth when script loads
window.Auth = new Auth(); 