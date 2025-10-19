const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Topic = require('../models/Topic');
const Session = require('../models/Session');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all topics with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  query('search').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.difficulty) {
      query.difficulty = req.query.difficulty;
    }

    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Execute query with pagination
    const [topics, total] = await Promise.all([
      Topic.find(query)
        .sort({ sessionsCount: -1, averageRating: -1 })
        .skip(skip)
        .limit(limit),
      Topic.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      topics,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Topics fetch error:', error);
    res.status(500).json({ message: 'Server error fetching topics' });
  }
});

// Get topic by ID
router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    
    if (!topic || !topic.isActive) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Get recent sessions count for this topic
    const recentSessionsCount = await Session.countDocuments({
      topic: req.params.id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24 hours
    });

    res.json({
      topic,
      recentActivity: {
        sessionsLast24h: recentSessionsCount
      }
    });

  } catch (error) {
    console.error('Topic fetch error:', error);
    res.status(500).json({ message: 'Server error fetching topic' });
  }
});

// Create new topic (Admin/Mentor only)
router.post('/', authenticate, authorize('mentor'), [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Topic name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .isIn([
      'Programming',
      'Data Science',
      'Web Development',
      'Mobile Development',
      'DevOps',
      'AI/ML',
      'Cybersecurity',
      'Design',
      'Business',
      'Language Learning',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid difficulty level'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { name, description, category, difficulty, tags } = req.body;

    // Check if topic already exists
    const existingTopic = await Topic.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingTopic) {
      return res.status(409).json({ message: 'Topic already exists' });
    }

    const topic = new Topic({
      name,
      description,
      category,
      difficulty: difficulty || 'Beginner',
      tags: tags || []
    });

    await topic.save();

    res.status(201).json({
      message: 'Topic created successfully',
      topic
    });

  } catch (error) {
    console.error('Topic creation error:', error);
    res.status(500).json({ message: 'Server error creating topic' });
  }
});

// Update topic (Admin/Mentor only)
router.put('/:id', authenticate, authorize('mentor'), [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Topic name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('category')
    .optional()
    .isIn([
      'Programming',
      'Data Science',
      'Web Development',
      'Mobile Development',
      'DevOps',
      'AI/ML',
      'Cybersecurity',
      'Design',
      'Business',
      'Language Learning',
      'Other'
    ])
    .withMessage('Invalid category'),
  body('difficulty')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid difficulty level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const topic = await Topic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json({
      message: 'Topic updated successfully',
      topic
    });

  } catch (error) {
    console.error('Topic update error:', error);
    res.status(500).json({ message: 'Server error updating topic' });
  }
});

// Get topic categories
router.get('/meta/categories', (req, res) => {
  const categories = [
    'Programming',
    'Data Science',
    'Web Development',
    'Mobile Development',
    'DevOps',
    'AI/ML',
    'Cybersecurity',
    'Design',
    'Business',
    'Language Learning',
    'Other'
  ];

  res.json({ categories });
});

// Get popular topics
router.get('/meta/popular', async (req, res) => {
  try {
    const popularTopics = await Topic.find({ isActive: true })
      .sort({ sessionsCount: -1, averageRating: -1 })
      .limit(10)
      .select('name category sessionsCount averageRating');

    res.json({ popularTopics });
  } catch (error) {
    console.error('Popular topics fetch error:', error);
    res.status(500).json({ message: 'Server error fetching popular topics' });
  }
});

module.exports = router;