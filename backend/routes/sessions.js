const express = require('express');
const { body, validationResult } = require('express-validator');
const Session = require('../models/Session');
const User = require('../models/User');
const Topic = require('../models/Topic');

const router = express.Router();

// Get user's session history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await Session.find({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ]
    })
    .populate('topic', 'name category')
    .populate('user1', 'username')
    .populate('user2', 'username')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Session.countDocuments({
      $or: [
        { user1: req.user._id },
        { user2: req.user._id }
      ]
    });

    res.json({
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    console.error('Session history fetch error:', error);
    res.status(500).json({ message: 'Server error fetching session history' });
  }
});

// Get session by ID
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('topic', 'name description category')
      .populate('user1', 'username email')
      .populate('user2', 'username email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is participant
    const isParticipant = session.user1._id.equals(req.user._id) || 
                         session.user2._id.equals(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this session' });
    }

    res.json({ session });

  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ message: 'Server error fetching session' });
  }
});

// End session
router.patch('/:id/end', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is participant
    const isParticipant = session.user1.equals(req.user._id) || 
                         session.user2.equals(req.user._id);

    if (!isParticipant) {
      return res.status(403).json({ message: 'Access denied to this session' });
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(400).json({ message: 'Session already ended' });
    }

    session.status = 'completed';
    session.endTime = new Date();
    await session.save();

    // Update user session counts
    await Promise.all([
      User.findByIdAndUpdate(session.user1, { $inc: { sessionsCompleted: 1 } }),
      User.findByIdAndUpdate(session.user2, { $inc: { sessionsCompleted: 1 } })
    ]);

    // Update topic session count
    await Topic.findByIdAndUpdate(session.topic, { $inc: { sessionsCount: 1 } });

    // Notify other user via socket
    const io = req.app.get('io');
    io.to(session.roomId).emit('sessionEnded', {
      sessionId: session._id,
      endedBy: req.user._id
    });

    res.json({
      message: 'Session ended successfully',
      session
    });

  } catch (error) {
    console.error('Session end error:', error);
    res.status(500).json({ message: 'Server error ending session' });
  }
});

// Submit feedback for session
router.post('/:id/feedback', [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { rating, comment } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if user is participant
    const isUser1 = session.user1.equals(req.user._id);
    const isUser2 = session.user2.equals(req.user._id);

    if (!isUser1 && !isUser2) {
      return res.status(403).json({ message: 'Access denied to this session' });
    }

    // Check if session is completed
    if (session.status !== 'completed') {
      return res.status(400).json({ message: 'Can only provide feedback for completed sessions' });
    }

    // Update feedback
    if (isUser1) {
      if (session.feedback.user1Rating) {
        return res.status(400).json({ message: 'Feedback already submitted' });
      }
      session.feedback.user1Rating = rating;
      session.feedback.user1Comment = comment;
    } else {
      if (session.feedback.user2Rating) {
        return res.status(400).json({ message: 'Feedback already submitted' });
      }
      session.feedback.user2Rating = rating;
      session.feedback.user2Comment = comment;
    }

    await session.save();

    // Update topic average rating if both users have provided feedback
    if (session.feedback.user1Rating && session.feedback.user2Rating) {
      const avgSessionRating = (session.feedback.user1Rating + session.feedback.user2Rating) / 2;
      
      const topic = await Topic.findById(session.topic);
      if (topic) {
        const totalRating = (topic.averageRating * (topic.sessionsCount - 1)) + avgSessionRating;
        topic.averageRating = totalRating / topic.sessionsCount;
        await topic.save();
      }
    }

    res.json({
      message: 'Feedback submitted successfully',
      feedback: session.feedback
    });

  } catch (error) {
    console.error('Feedback submission error:', error);
    res.status(500).json({ message: 'Server error submitting feedback' });
  }
});

// Get session statistics for user
router.get('/stats/overview', async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalSessions, completedSessions, avgRating] = await Promise.all([
      Session.countDocuments({
        $or: [{ user1: userId }, { user2: userId }]
      }),
      Session.countDocuments({
        $or: [{ user1: userId }, { user2: userId }],
        status: 'completed'
      }),
      Session.aggregate([
        {
          $match: {
            $or: [{ user1: userId }, { user2: userId }],
            status: 'completed'
          }
        },
        {
          $project: {
            userRating: {
              $cond: {
                if: { $eq: ['$user1', userId] },
                then: '$feedback.user2Rating',
                else: '$feedback.user1Rating'
              }
            }
          }
        },
        {
          $match: { userRating: { $exists: true, $ne: null } }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$userRating' }
          }
        }
      ])
    ]);

    const topTopics = await Session.aggregate([
      {
        $match: {
          $or: [{ user1: userId }, { user2: userId }],
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$topic',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'topics',
          localField: '_id',
          foreignField: '_id',
          as: 'topic'
        }
      },
      {
        $unwind: '$topic'
      },
      {
        $project: {
          name: '$topic.name',
          category: '$topic.category',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      stats: {
        totalSessions,
        completedSessions,
        averageRating: avgRating.length > 0 ? avgRating[0].avgRating : 0,
        topTopics
      }
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

module.exports = router;