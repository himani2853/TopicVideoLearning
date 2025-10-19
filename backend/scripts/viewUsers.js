const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

const viewAllUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/topic-video-learning');
    console.log('📊 Connected to MongoDB');

    // Fetch all users
    const users = await User.find({}, {
      username: 1,
      email: 1,
      role: 1,
      isActive: 1,
      emailVerified: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    console.log('\n📧 All Registered Users:');
    console.log('=' .repeat(70));
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.isActive ? 'Active ✅' : 'Inactive ❌'}`);
      console.log(`   Email Verified: ${user.emailVerified ? 'Yes ✅' : 'No ❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('-'.repeat(50));
    });

    console.log(`\n📈 Total Users: ${users.length}`);

    // Group by email domain
    const domains = {};
    users.forEach(user => {
      const domain = user.email.split('@')[1];
      domains[domain] = (domains[domain] || 0) + 1;
    });

    console.log('\n🌐 Users by Email Domain:');
    Object.entries(domains).forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} user(s)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

// Run the script
viewAllUsers();