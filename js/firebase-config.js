// js/firebase-config.js
// Firebase configuration for RPG Therapy
const firebaseConfig = {
  apiKey: "AIzaSyDqNW4CEGZkooU1C8pGNDNfC2wZA0CWerw",
  authDomain: "gamemode-ea510.firebaseapp.com",
  projectId: "gamemode-ea510",
  storageBucket: "gamemode-ea510.firebasestorage.app",
  messagingSenderId: "164733976473",
  appId: "1:164733976473:web:3a9476b37ea73d1f7b0b8a",
  measurementId: "G-0K3GTYXNQE"
};

// Backend URL (updated to match api-client.js)
const BACKEND_URL = 'https://rpg-therapy-backend-production.up.railway.app'; // Production Railway deploy

// Make available globally for non-module scripts
window.firebaseConfig = firebaseConfig;
window.BACKEND_URL = BACKEND_URL; 