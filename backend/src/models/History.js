const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['protocol', 'skill', 'drag_drop', 'manual']
  },
  action: String,
  targetId: mongoose.Schema.Types.Mixed,
  changes: mongoose.Schema.Types.Mixed,
  details: String,
  protocolName: String,
  protocolIcon: String
});

// Index for better query performance
historySchema.index({ uid: 1, timestamp: -1 });

module.exports = mongoose.model('History', historySchema); 