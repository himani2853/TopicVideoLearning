const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
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
    ]
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  sessionsCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster searching
topicSchema.index({ name: 'text', description: 'text', tags: 'text' });
topicSchema.index({ category: 1, difficulty: 1 });

module.exports = mongoose.model('Topic', topicSchema);