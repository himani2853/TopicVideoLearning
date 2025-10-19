const mongoose = require('mongoose');

const waitingPoolSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  socketId: {
    type: String,
    required: [true, 'Socket ID is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure user can only be in one waiting pool per topic
waitingPoolSchema.index({ user: 1, topic: 1 }, { unique: true });
waitingPoolSchema.index({ topic: 1, isActive: 1 });
waitingPoolSchema.index({ joinedAt: 1 });

module.exports = mongoose.model('WaitingPool', waitingPoolSchema);