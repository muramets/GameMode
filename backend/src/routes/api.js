const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserData = require('../models/UserData');
const History = require('../models/History');

// Get user data
router.get('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOne({ uid: req.user.uid });
    
    if (!userData) {
      // Return default data structure for new users
      const defaultData = {
        uid: req.user.uid,
        protocols: [],
        skills: [],
        states: new Map(),
        quickActions: [],
        orders: {
          protocols: [],
          skills: [],
          quickActions: []
        }
      };
      
      const newUserData = new UserData(defaultData);
      await newUserData.save();
      return res.json(newUserData);
    }
    
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save user data
router.post('/user/data', authenticateToken, async (req, res) => {
  try {
    const userData = await UserData.findOneAndUpdate(
      { uid: req.user.uid },
      { 
        ...req.body, 
        uid: req.user.uid,
        updatedAt: new Date() 
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    res.json(userData);
  } catch (error) {
    console.error('Error saving user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user history
router.get('/user/history', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const history = await History.find({ uid: req.user.uid })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add history entry
router.post('/user/history', authenticateToken, async (req, res) => {
  try {
    const historyEntry = new History({
      uid: req.user.uid,
      ...req.body
    });
    
    await historyEntry.save();
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user data (for testing/reset)
router.delete('/user/data', authenticateToken, async (req, res) => {
  try {
    await UserData.deleteOne({ uid: req.user.uid });
    await History.deleteMany({ uid: req.user.uid });
    
    res.json({ message: 'User data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 