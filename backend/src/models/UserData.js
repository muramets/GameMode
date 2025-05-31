const mongoose = require('mongoose');

const userDataSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true
  },
  protocols: [{
    id: Number,
    name: String,
    description: String,
    icon: String,
    targets: [String],
    weight: Number,
    hover: String,
    category: String,
    createdAt: Date,
    updatedAt: Date
  }],
  skills: [{
    id: Number,
    name: String,
    description: String,
    icon: String,
    score: Number,
    lastUpdated: Date,
    weight: Number,
    hover: String
  }],
  states: {
    type: Map,
    of: {
      value: Number,
      icon: String,
      name: String
    }
  },
  quickActions: [Number],
  orders: {
    protocols: [Number],
    skills: [Number],
    quickActions: [Number]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserData', userDataSchema); 