const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Read MongoDB connection string from auth file
let MONGODB_URI;
try {
  const authFilePath = path.join(__dirname, '../../auth/auth_MongoDB_connection string.env');
  const authFileContent = fs.readFileSync(authFilePath, 'utf8');
  // Extract connection string from file (assuming it's stored as MONGODB_URI=...)
  const match = authFileContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    MONGODB_URI = match[1].trim();
  } else {
    // If no MONGODB_URI= prefix, use the entire file content as connection string
    MONGODB_URI = authFileContent.trim();
  }
  console.log('✅ MongoDB connection string loaded from auth file');
} catch (error) {
  console.error('❌ Error reading auth file:', error.message);
  console.log('Falling back to environment variable...');
  MONGODB_URI = process.env.MONGODB_URI;
}

// Firebase Admin initialization
const serviceAccount = require(path.join(__dirname, '../../firebase-service-account.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourapp.github.io'] 
    : ['http://localhost:3000', 'http://localhost:8000', 'http://127.0.0.1:8000']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.error('❌ No MongoDB connection string found!');
}

// Routes
app.use('/api', require('./routes/api'));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'RPG Therapy Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    mongodb: MONGODB_URI ? 'Connected' : 'Not configured'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}); 