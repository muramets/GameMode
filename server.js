const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: [
    'https://muramets.github.io',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:8086',
    'http://localhost:8087',
    'http://localhost:8088',
    'http://localhost:8089',
    'http://localhost:8090',
    'http://localhost:8091',
    'http://localhost:8092',
    'http://localhost:8093'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// MongoDB connection
let db;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rpg-therapy';

// Firebase Admin initialization
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    console.warn('Firebase service account not found - running without auth');
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Auth middleware
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (admin.apps.length > 0) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      };
    } else {
      // Fallback for development without Firebase
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        name: 'Development User'
      };
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Connect to MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Therapy Backend API', 
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/user/data',
      'POST /api/user/data',
      'GET /api/user/history',
      'POST /api/user/history',
      'DELETE /api/user/history/:id'
    ]
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

// Get user data
app.get('/api/user/data', authenticateToken, async (req, res) => {
  try {
    const userDoc = await db.collection('users').findOne({ 
      firebaseUid: req.user.uid 
    });

    if (!userDoc) {
      // User not found - return empty state
      return res.json({
        success: true,
        data: {
          protocols: [],
          skills: [],
          states: [],
          history: [],
          quickActions: [],
          protocolOrder: [],
          skillOrder: [],
          stateOrder: [],
          quickActionOrder: []
        }
      });
    }

    res.json({
      success: true,
      data: userDoc.userData || {
        protocols: [],
        skills: [],
        states: [],
        history: [],
        quickActions: [],
        protocolOrder: [],
        skillOrder: [],
        stateOrder: [],
        quickActionOrder: []
      }
    });
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Save user data
app.post('/api/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = req.body;
    
    await db.collection('users').findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { 
        $set: { 
          userData: userData,
          email: req.user.email,
          displayName: req.user.name,
          updatedAt: new Date()
        },
        $setOnInsert: { 
          createdAt: new Date() 
        }
      },
      { upsert: true }
    );

    res.json({ 
      success: true, 
      message: 'Data saved successfully' 
    });
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: 'Failed to save user data' });
  }
});

// Get user history (paginated)
app.get('/api/user/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;

    const userDoc = await db.collection('users').findOne({ 
      firebaseUid: req.user.uid 
    });

    if (!userDoc || !userDoc.userData || !userDoc.userData.history) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }

    const history = userDoc.userData.history || [];
    const totalCount = history.length;
    const paginatedHistory = history
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginatedHistory,
      total: totalCount
    });
  } catch (error) {
    console.error('Error getting user history:', error);
    res.status(500).json({ error: 'Failed to get user history' });
  }
});

// Add history entry
app.post('/api/user/history', authenticateToken, async (req, res) => {
  try {
    const historyEntry = {
      ...req.body,
      id: req.body.id || Date.now().toString(),
      timestamp: req.body.timestamp || new Date().toISOString()
    };

    await db.collection('users').updateOne(
      { firebaseUid: req.user.uid },
      { 
        $push: { 'userData.history': historyEntry },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ 
      success: true, 
      message: 'History entry added',
      data: historyEntry
    });
  } catch (error) {
    console.error('Error adding history entry:', error);
    res.status(500).json({ error: 'Failed to add history entry' });
  }
});

// Delete history entry
app.delete('/api/user/history/:id', authenticateToken, async (req, res) => {
  try {
    const historyId = req.params.id;

    await db.collection('users').updateOne(
      { firebaseUid: req.user.uid },
      { 
        $pull: { 'userData.history': { id: historyId } },
        $set: { updatedAt: new Date() }
      }
    );

    res.json({ 
      success: true, 
      message: 'History entry deleted' 
    });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API endpoints available at:`);
    console.log(`   GET  /api/user/data`);
    console.log(`   POST /api/user/data`);
    console.log(`   GET  /api/user/history`);
    console.log(`   POST /api/user/history`);
    console.log(`   DELETE /api/user/history/:id`);
  });
}

startServer().catch(console.error); 