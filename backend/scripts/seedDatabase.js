const mongoose = require('mongoose');
const Topic = require('../models/Topic');

const seedTopics = [
  {
    name: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming including variables, functions, and control structures.',
    category: 'Programming',
    difficulty: 'Beginner',
    tags: ['javascript', 'programming', 'web development']
  },
  {
    name: 'React Hooks Deep Dive',
    description: 'Advanced concepts in React Hooks including custom hooks, useEffect patterns, and performance optimization.',
    category: 'Web Development',
    difficulty: 'Advanced',
    tags: ['react', 'hooks', 'frontend']
  },
  {
    name: 'Python Data Analysis',
    description: 'Introduction to data analysis using pandas, numpy, and matplotlib for beginners.',
    category: 'Data Science',
    difficulty: 'Intermediate',
    tags: ['python', 'pandas', 'data analysis']
  },
  {
    name: 'Machine Learning Basics',
    description: 'Fundamental concepts of machine learning including supervised and unsupervised learning.',
    category: 'AI/ML',
    difficulty: 'Beginner',
    tags: ['machine learning', 'ai', 'algorithms']
  },
  {
    name: 'System Design Principles',
    description: 'Learn how to design scalable systems, microservices architecture, and database design.',
    category: 'Programming',
    difficulty: 'Advanced',
    tags: ['system design', 'architecture', 'scalability']
  },
  {
    name: 'CSS Grid and Flexbox',
    description: 'Master modern CSS layout techniques with Grid and Flexbox for responsive design.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    tags: ['css', 'layout', 'responsive design']
  },
  {
    name: 'Node.js Backend Development',
    description: 'Build RESTful APIs with Node.js, Express, and MongoDB for modern web applications.',
    category: 'Web Development',
    difficulty: 'Intermediate',
    tags: ['nodejs', 'express', 'backend']
  },
  {
    name: 'Docker Containerization',
    description: 'Learn containerization with Docker, creating images, and orchestration basics.',
    category: 'DevOps',
    difficulty: 'Intermediate',
    tags: ['docker', 'containers', 'devops']
  },
  {
    name: 'English Conversation Practice',
    description: 'Practice speaking English with focus on daily conversations and pronunciation.',
    category: 'Language Learning',
    difficulty: 'Beginner',
    tags: ['english', 'conversation', 'speaking']
  },
  {
    name: 'UI/UX Design Principles',
    description: 'Fundamentals of user interface and user experience design for digital products.',
    category: 'Design',
    difficulty: 'Beginner',
    tags: ['ui', 'ux', 'design principles']
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing topics
    await Topic.deleteMany({});
    console.log('Cleared existing topics');

    // Insert seed topics
    const createdTopics = await Topic.insertMany(seedTopics);
    console.log(`Created ${createdTopics.length} topics`);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedTopics, seedDatabase };