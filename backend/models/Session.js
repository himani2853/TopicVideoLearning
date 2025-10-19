const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic is required']
  },
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User1 is required']
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User2 is required']
  },
  roomId: {
    type: String,
    required: [true, 'Room ID is required'],
    unique: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  feedback: {
    user1Rating: {
      type: Number,
      min: 1,
      max: 5
    },
    user1Comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    user2Rating: {
      type: Number,
      min: 1,
      max: 5
    },
    user2Comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    }
  },
  connectionDetails: {
    agoraChannel: String,
    agoraToken: String,
    agoraUid1: Number,
    agoraUid2: Number
  }
}, {
  timestamps: true
});

// Calculate duration before saving
sessionSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // minutes
  }
  next();
});

// Index for faster querying
sessionSchema.index({ user1: 1, user2: 1 });
sessionSchema.index({ topic: 1, status: 1 });
sessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Session', sessionSchema);