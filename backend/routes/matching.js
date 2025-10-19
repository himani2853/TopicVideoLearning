const express = require('express');
const { body, validationResult } = require('express-validator');
const WaitingPool = require('../models/WaitingPool');
const Session = require('../models/Session');
const Topic = require('../models/Topic');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Join waiting pool for a topic
router.post('/join', [
  body('topicId')
    .isMongoId()
    .withMessage('Invalid topic ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { topicId } = req.body;
    const userId = req.user._id;

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic || !topic.isActive) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Check if user is already in waiting pool for this topic
    const existingEntry = await WaitingPool.findOne({
      user: userId,
      topic: topicId,
      isActive: true
    });

    if (existingEntry) {
      return res.status(400).json({ message: 'Already in waiting pool for this topic' });
    }

    // Check if user has any active sessions
    const activeSession = await Session.findOne({
      $or: [{ user1: userId }, { user2: userId }],
      status: { $in: ['waiting', 'active'] }
    });

    if (activeSession) {
      return res.status(400).json({ message: 'Cannot join while in an active session' });
    }

    // Look for another user waiting for the same topic
    const waitingUser = await WaitingPool.findOne({
      topic: topicId,
      user: { $ne: userId },
      isActive: true
    }).populate('user', 'username email');

    if (waitingUser) {
      // Match found! Create a session
      const roomId = uuidv4();
      
      const session = new Session({
        topic: topicId,
        user1: waitingUser.user._id,
        user2: userId,
        roomId,
        status: 'active'
      });

      await session.save();

      // Remove both users from waiting pool
      await WaitingPool.deleteOne({ _id: waitingUser._id });

      // Populate session for response
      await session.populate([
        { path: 'topic', select: 'name description category' },
        { path: 'user1', select: 'username email' },
        { path: 'user2', select: 'username email' }
      ]);

      // Notify both users via socket
      const io = req.app.get('io');
      io.to(waitingUser.socketId).emit('matchFound', {
        session,
        partner: req.user
      });

      res.json({
        message: 'Match found!',
        matched: true,
        session,
        partner: waitingUser.user
      });

    } else {
      // No match found, add user to waiting pool
      const waitingEntry = new WaitingPool({
        user: userId,
        topic: topicId,
        socketId: req.body.socketId || 'temp-' + Date.now() // Socket ID should be provided by frontend
      });

      await waitingEntry.save();

      res.json({
        message: 'Added to waiting pool',
        matched: false,
        waitingPoolId: waitingEntry._id,
        topicName: topic.name
      });
    }

  } catch (error) {
    console.error('Matching join error:', error);
    res.status(500).json({ message: 'Server error during matching' });
  }
});

// Leave waiting pool
router.post('/leave', [
  body('topicId')
    .optional()
    .isMongoId()
    .withMessage('Invalid topic ID')
], async (req, res) => {
  try {
    const { topicId } = req.body;
    const userId = req.user._id;

    const query = { user: userId, isActive: true };
    if (topicId) {
      query.topic = topicId;
    }

    const result = await WaitingPool.deleteMany(query);

    res.json({
      message: 'Left waiting pool',
      removedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Leave waiting pool error:', error);
    res.status(500).json({ message: 'Server error leaving waiting pool' });
  }
});

// Get current waiting status
router.get('/status', async (req, res) => {
  try {
    const userId = req.user._id;

    // Check for waiting pool entries
    const waitingEntries = await WaitingPool.find({
      user: userId,
      isActive: true
    }).populate('topic', 'name category');

    // Check for active sessions
    const activeSession = await Session.findOne({
      $or: [{ user1: userId }, { user2: userId }],
      status: { $in: ['waiting', 'active'] }
    })
    .populate('topic', 'name category')
    .populate('user1', 'username')
    .populate('user2', 'username');

    res.json({
      isWaiting: waitingEntries.length > 0,
      waitingFor: waitingEntries,
      hasActiveSession: !!activeSession,
      activeSession
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ message: 'Server error checking status' });
  }
});

// Get waiting pool statistics for a topic
router.get('/stats/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;

    // Validate topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const waitingCount = await WaitingPool.countDocuments({
      topic: topicId,
      isActive: true
    });

    const recentSessions = await Session.countDocuments({
      topic: topicId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
    });

    res.json({
      topic: {
        id: topic._id,
        name: topic.name,
        category: topic.category
      },
      waitingCount,
      recentSessions24h: recentSessions,
      estimatedWaitTime: waitingCount > 0 ? Math.max(1, Math.ceil(waitingCount / 2)) * 2 : 1 // rough estimate in minutes
    });

  } catch (error) {
    console.error('Topic stats error:', error);
    res.status(500).json({ message: 'Server error fetching topic statistics' });
  }
});

// Cancel matching/session
router.post('/cancel', [
  body('sessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid session ID')
], async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (sessionId) {
      // Cancel specific session
      const session = await Session.findById(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const isParticipant = session.user1.equals(userId) || session.user2.equals(userId);
      if (!isParticipant) {
        return res.status(403).json({ message: 'Access denied to this session' });
      }

      if (session.status === 'completed' || session.status === 'cancelled') {
        return res.status(400).json({ message: 'Session already ended' });
      }

      session.status = 'cancelled';
      session.endTime = new Date();
      await session.save();

      // Notify other participant
      const io = req.app.get('io');
      io.to(session.roomId).emit('sessionCancelled', {
        sessionId: session._id,
        cancelledBy: userId
      });

      res.json({ message: 'Session cancelled' });

    } else {
      // Cancel all waiting pool entries
      await WaitingPool.deleteMany({ user: userId, isActive: true });
      res.json({ message: 'Removed from all waiting pools' });
    }

  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ message: 'Server error during cancellation' });
  }
});

module.exports = router;