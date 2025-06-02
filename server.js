require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;
const isProduction = process.env.NODE_ENV === 'production';

console.log('🚀 Starting RPG Therapy Backend...');
console.log('🌍 Environment:', isProduction ? 'Production' : 'Development');

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8000', 
    'http://127.0.0.1:8000',
    'https://muramets.github.io', // GitHub Pages base
    'https://muramets.github.io/GameMode' // GitHub Pages for GameMode repository
  ],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// 🔍 Debug: Check environment and files
let mongoConnectionString = '';
let firebaseConfig = null;

if (isProduction) {
  // Production: Read from environment variables
  console.log('📱 Production mode: Reading from environment variables');
  
  mongoConnectionString = process.env.MONGODB_URI;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('🔥 Firebase config loaded from env var');
    } catch (error) {
      console.error('❌ Error parsing Firebase config from env:', error.message);
    }
  }
  
} else {
  // Development: Read from local files
  console.log('🛠️ Development mode: Reading from local files');
  
  const MONGODB_PATH = '/Users/muramets/Documents/#rpg-therapy-secrets/auth_MongoDB_connection string.env';
  const FIREBASE_PATH = '/Users/muramets/Documents/#rpg-therapy-secrets/GameMode Firebase Admin SDK.json';
  
  console.log('📁 Checking secret files...');
  console.log('MongoDB path:', MONGODB_PATH);
  console.log('Firebase path:', FIREBASE_PATH);
  
  // Check if files exist
  if (fs.existsSync(MONGODB_PATH)) {
    console.log('✅ MongoDB connection file found');
    try {
      mongoConnectionString = fs.readFileSync(MONGODB_PATH, 'utf8').trim();
      console.log('📱 MongoDB connection string loaded (length:', mongoConnectionString.length, ')');
    } catch (error) {
      console.error('❌ Error reading MongoDB connection file:', error.message);
    }
  } else {
    console.log('❌ MongoDB connection file NOT found');
  }
  
  if (fs.existsSync(FIREBASE_PATH)) {
    console.log('✅ Firebase Admin SDK file found');
    try {
      const firebaseData = fs.readFileSync(FIREBASE_PATH, 'utf8');
      firebaseConfig = JSON.parse(firebaseData);
      console.log('🔥 Firebase Admin SDK loaded');
      console.log('🔥 Project ID:', firebaseConfig.project_id);
    } catch (error) {
      console.error('❌ Error reading Firebase Admin SDK file:', error.message);
    }
  } else {
    console.log('❌ Firebase Admin SDK file NOT found');
  }
}

// Initialize Firebase Admin
if (firebaseConfig) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
      projectId: firebaseConfig.project_id
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
  }
} else {
  console.log('⚠️ Skipping Firebase Admin initialization - no config found');
}

// Connect to MongoDB
if (mongoConnectionString) {
  console.log('📱 Attempting MongoDB connection...');
  mongoose.connect(mongoConnectionString)
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
      console.log('📊 Database name:', mongoose.connection.name);
    })
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
    });
} else {
  console.log('⚠️ No MongoDB connection string found');
}

// MongoDB Schema
const UserDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: String,
  data: {
    protocols: Array,
    skills: Array,
    states: Array,
    history: Array,
    quickActions: Array
  },
  lastUpdated: { type: Date, default: Date.now }
});

const UserData = mongoose.model('UserData', UserDataSchema);

// Authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    message: 'RPG Therapy Backend API',
    status: 'running',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    debug: {
      mongoConnected: mongoose.connection.readyState === 1,
      firebaseInitialized: !!firebaseConfig,
      port: PORT
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Therapy Backend API',
    status: 'running',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    debug: {
      mongoConnected: mongoose.connection.readyState === 1,
      firebaseInitialized: !!firebaseConfig,
      port: PORT
    }
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API Test successful',
    environment: isProduction ? 'production' : 'development',
    mongodb: {
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.name || 'not connected'
    },
    firebase: {
      initialized: !!firebaseConfig,
      projectId: firebaseConfig?.project_id || 'not initialized'
    }
  });
});

// Sync endpoint
app.post('/api/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { protocols, skills, states, history, quickActions } = req.body;
    
    console.log('🔄 SYNC REQUEST:', { userId, email: req.user.email });
    
    // Find or create user data
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({
        userId,
        email: req.user.email,
        data: { protocols, skills, states, history, quickActions }
      });
      console.log('📝 Creating new user data');
    } else {
      userData.data = { protocols, skills, states, history, quickActions };
      userData.lastUpdated = new Date();
      console.log('📝 Updating existing user data');
    }
    
    await userData.save();
    
    res.json({
      success: true,
      message: 'Data synced successfully',
      data: userData.data,
      lastUpdated: userData.lastUpdated
    });
    
    console.log('✅ SYNC COMPLETED for user:', req.user.email);
    
  } catch (error) {
    console.error('❌ SYNC ERROR:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Get user data
app.get('/api/user/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userData = await UserData.findOne({ userId });
    
    if (!userData) {
      return res.json({ data: null });
    }
    
    res.json({
      success: true,
      data: userData.data,
      lastUpdated: userData.lastUpdated
    });
    
  } catch (error) {
    console.error('❌ GET USER DATA ERROR:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Save user data
app.post('/api/user/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const data = req.body;
    
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({
        userId,
        email: req.user.email,
        data
      });
    } else {
      userData.data = data;
      userData.lastUpdated = new Date();
    }
    
    await userData.save();
    
    res.json({
      success: true,
      message: 'Data saved successfully',
      lastUpdated: userData.lastUpdated
    });
    
  } catch (error) {
    console.error('❌ SAVE USER DATA ERROR:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Get user history
app.get('/api/user/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 100, skip = 0 } = req.query;
    
    const userData = await UserData.findOne({ userId });
    
    if (!userData || !userData.data.history) {
      return res.json({ history: [] });
    }
    
    const history = userData.data.history
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));
    
    res.json({
      success: true,
      history,
      total: userData.data.history.length
    });
    
  } catch (error) {
    console.error('❌ GET HISTORY ERROR:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

// Add history entry
app.post('/api/user/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const historyEntry = req.body;
    
    let userData = await UserData.findOne({ userId });
    
    if (!userData) {
      userData = new UserData({
        userId,
        email: req.user.email,
        data: { history: [historyEntry] }
      });
    } else {
      if (!userData.data.history) {
        userData.data.history = [];
      }
      userData.data.history.push(historyEntry);
      userData.lastUpdated = new Date();
    }
    
    await userData.save();
    
    res.json({
      success: true,
      message: 'History entry added',
      entryId: historyEntry.id
    });
    
  } catch (error) {
    console.error('❌ ADD HISTORY ERROR:', error);
    res.status(500).json({ error: 'Failed to add history entry' });
  }
});

// Delete history entry
app.delete('/api/user/history/:historyId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { historyId } = req.params;
    
    const userData = await UserData.findOne({ userId });
    
    if (!userData || !userData.data.history) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    userData.data.history = userData.data.history.filter(h => h.id !== historyId);
    userData.lastUpdated = new Date();
    
    await userData.save();
    
    res.json({
      success: true,
      message: 'History entry deleted'
    });
    
  } catch (error) {
    console.error('❌ DELETE HISTORY ERROR:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at: http://localhost:${PORT}`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🏥 Health endpoint: http://localhost:${PORT}/health`);
  console.log(`🔄 Sync endpoint: http://localhost:${PORT}/api/sync`);
});