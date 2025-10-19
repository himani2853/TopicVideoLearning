# Database Schema & Relationships

## 🗄️ Database Overview

The Topic Video Learning Platform uses **MongoDB** as its primary database, leveraging Mongoose ODM for schema definition, validation, and relationship management.

**Database Name**: `topic_video_learning`

**Collections**: 4 main collections with defined relationships

## 📊 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│      Users      │       │     Topics      │
│─────────────────│       │─────────────────│
│ _id (ObjectId)  │       │ _id (ObjectId)  │
│ username        │       │ name            │
│ email           │       │ description     │
│ password        │   ┌───│ category        │
│ role            │   │   │ difficulty      │
│ profileStats    │   │   │ tags[]          │
│ preferences     │   │   │ stats           │
│ createdAt       │   │   │ createdAt       │
│ updatedAt       │   │   │ updatedAt       │
└─────────────────┘   │   └─────────────────┘
          │           │            │
          │           │            │
          ▼           ▼            ▼
┌─────────────────┐   │   ┌─────────────────┐
│  WaitingPool    │   │   │    Sessions     │
│─────────────────│   │   │─────────────────│
│ _id (ObjectId)  │   │   │ _id (ObjectId)  │
│ topicId ────────┼───┘   │ topicId ────────┼───┐
│ userId ─────────┼───────│ participants[]  │   │
│ role            │       │ status          │   │
│ joinedAt        │       │ startTime       │   │
│ estimatedWait   │       │ endTime         │   │
│ position        │       │ duration        │   │
│ status          │       │ rating          │   │
└─────────────────┘       │ roomId          │   │
                         │ messages[]      │   │
                         │ createdAt       │   │
                         │ updatedAt       │   │
                         └─────────────────┘   │
                                   │           │
                                   └───────────┘
```

## 📋 Collection Schemas

### **Users Collection**

**Purpose**: Store user accounts, authentication data, and profile information

```javascript
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Excludes password from queries by default
  },
  
  role: {
    type: String,
    enum: {
      values: ['learner', 'mentor'],
      message: 'Role must be either learner or mentor'
    },
    required: [true, 'Role is required'],
    default: 'learner'
  },
  
  profileStats: {
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalHours: { type: Number, default: 0, min: 0 }
  },
  
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: { type: Boolean, default: true },
    availableHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    }
  },
  
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  emailVerified: { type: Boolean, default: false }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes**:
```javascript
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profileStats.averageRating': -1 });
UserSchema.index({ lastLogin: -1 });
```

**Pre-save Middleware**:
```javascript
// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Update lastLogin on authentication
UserSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('password')) {
    this.lastLogin = new Date();
  }
  next();
});
```

**Instance Methods**:
```javascript
// Compare password for authentication
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update profile statistics
UserSchema.methods.updateStats = function(sessionData) {
  this.profileStats.totalSessions += 1;
  if (sessionData.completed) {
    this.profileStats.completedSessions += 1;
    this.profileStats.totalHours += sessionData.duration / 60;
  }
  if (sessionData.rating) {
    const totalRatings = this.profileStats.totalSessions;
    const currentAvg = this.profileStats.averageRating;
    this.profileStats.averageRating = 
      ((currentAvg * (totalRatings - 1)) + sessionData.rating) / totalRatings;
  }
};
```

### **Topics Collection**

**Purpose**: Store learning topics with metadata and statistics

```javascript
const TopicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Topic name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Topic description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Programming', 'Data Science', 'Machine Learning',
        'Web Development', 'Mobile Development', 'DevOps',
        'Cybersecurity', 'UI/UX Design', 'Database',
        'Cloud Computing', 'Blockchain', 'Game Development'
      ],
      message: 'Please select a valid category'
    }
  },
  
  difficulty: {
    type: String,
    enum: {
      values: ['Beginner', 'Intermediate', 'Advanced'],
      message: 'Difficulty must be Beginner, Intermediate, or Advanced'
    },
    required: [true, 'Difficulty level is required']
  },
  
  estimatedDuration: {
    type: Number, // Duration in minutes
    required: [true, 'Estimated duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes']
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [20, 'Each tag cannot exceed 20 characters']
  }],
  
  prerequisites: [{
    type: String,
    maxlength: [100, 'Each prerequisite cannot exceed 100 characters']
  }],
  
  learningObjectives: [{
    type: String,
    maxlength: [200, 'Each objective cannot exceed 200 characters']
  }],
  
  stats: {
    totalSessions: { type: Number, default: 0, min: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    currentWaiting: { type: Number, default: 0, min: 0 },
    totalCompletions: { type: Number, default: 0, min: 0 }
  },
  
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
```

**Indexes**:
```javascript
TopicSchema.index({ name: 'text', description: 'text', tags: 'text' });
TopicSchema.index({ category: 1, difficulty: 1 });
TopicSchema.index({ 'stats.averageRating': -1 });
TopicSchema.index({ 'stats.totalSessions': -1 });
TopicSchema.index({ isActive: 1 });
TopicSchema.index({ createdAt: -1 });
```

**Virtual Properties**:
```javascript
// Calculate popularity score
TopicSchema.virtual('popularityScore').get(function() {
  const sessionWeight = this.stats.totalSessions * 0.6;
  const ratingWeight = this.stats.averageRating * 0.4;
  return sessionWeight + ratingWeight;
});

// Get current waiting statistics
TopicSchema.virtual('waitingStats').get(function() {
  return {
    total: this.stats.currentWaiting,
    estimatedWait: Math.ceil(this.stats.currentWaiting / 2) * 5 // Rough estimate
  };
});
```

### **Sessions Collection**

**Purpose**: Track learning sessions between users

```javascript
const SessionSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['learner', 'mentor'],
      required: true
    },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date },
    connectionQuality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
  }],
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'active', 'completed', 'cancelled', 'failed'],
      message: 'Invalid session status'
    },
    default: 'pending'
  },
  
  startTime: { type: Date },
  endTime: { type: Date },
  
  duration: { // Calculated duration in minutes
    type: Number,
    min: 0,
    get: function() {
      if (this.startTime && this.endTime) {
        return Math.round((this.endTime - this.startTime) / (1000 * 60));
      }
      return 0;
    }
  },
  
  rating: {
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5'
      }
    },
    feedback: {
      type: String,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    },
    ratedAt: { type: Date, default: Date.now }
  },
  
  roomId: { // Agora.io room identifier
    type: String,
    required: [true, 'Room ID is required'],
    unique: true
  },
  
  messages: [{
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    timestamp: { type: Date, default: Date.now },
    messageType: {
      type: String,
      enum: ['text', 'system', 'file', 'code'],
      default: 'text'
    }
  }],
  
  sessionData: {
    screenShared: { type: Boolean, default: false },
    filesShared: [{ 
      fileName: String,
      fileSize: Number,
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now }
    }],
    codeSnippets: [{
      language: String,
      code: String,
      sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      sharedAt: { type: Date, default: Date.now }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true, getters: true }
});
```

**Indexes**:
```javascript
SessionSchema.index({ topicId: 1 });
SessionSchema.index({ 'participants.userId': 1 });
SessionSchema.index({ status: 1 });
SessionSchema.index({ startTime: -1 });
SessionSchema.index({ roomId: 1 }, { unique: true });
SessionSchema.index({ createdAt: -1 });
```

**Pre-save Middleware**:
```javascript
// Generate unique room ID
SessionSchema.pre('save', function(next) {
  if (this.isNew && !this.roomId) {
    this.roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Update topic statistics on session completion
SessionSchema.post('save', async function(doc) {
  if (doc.status === 'completed' && doc.rating) {
    await mongoose.model('Topic').findByIdAndUpdate(doc.topicId, {
      $inc: { 
        'stats.totalSessions': 1,
        'stats.totalCompletions': 1
      }
    });
  }
});
```

### **WaitingPool Collection**

**Purpose**: Manage users waiting to be matched for sessions

```javascript
const WaitingPoolSchema = new mongoose.Schema({
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: [true, 'Topic ID is required']
  },
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  
  role: {
    type: String,
    enum: {
      values: ['learner', 'mentor'],
      message: 'Role must be either learner or mentor'
    },
    required: [true, 'Role is required']
  },
  
  joinedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  estimatedWaitTime: { // In minutes
    type: Number,
    default: 5,
    min: 1
  },
  
  position: {
    type: Number,
    min: 1,
    default: 1
  },
  
  status: {
    type: String,
    enum: {
      values: ['waiting', 'matched', 'cancelled', 'expired'],
      message: 'Invalid waiting pool status'
    },
    default: 'waiting'
  },
  
  preferences: {
    preferredMentorLevel: {
      type: String,
      enum: ['any', 'beginner-friendly', 'experienced', 'expert']
    },
    sessionDuration: {
      type: Number,
      min: 15,
      max: 180,
      default: 60
    },
    allowRecording: { type: Boolean, default: false }
  },
  
  matchedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
    },
    index: { expireAfterSeconds: 0 } // TTL index for automatic cleanup
  }
}, {
  timestamps: true
});
```

**Compound Indexes**:
```javascript
WaitingPoolSchema.index({ topicId: 1, role: 1, status: 1 });
WaitingPoolSchema.index({ userId: 1, status: 1 }, { unique: true, 
  partialFilterExpression: { status: 'waiting' } });
WaitingPoolSchema.index({ joinedAt: 1 });
WaitingPoolSchema.index({ expiresAt: 1 });
```

**Static Methods**:
```javascript
// Find available match for a user
WaitingPoolSchema.statics.findMatch = async function(topicId, role) {
  const oppositeRole = role === 'learner' ? 'mentor' : 'learner';
  
  return await this.findOne({
    topicId: topicId,
    role: oppositeRole,
    status: 'waiting'
  }).sort({ joinedAt: 1 }); // FIFO matching
};

// Update waiting positions
WaitingPoolSchema.statics.updatePositions = async function(topicId, role) {
  const waitingUsers = await this.find({
    topicId: topicId,
    role: role,
    status: 'waiting'
  }).sort({ joinedAt: 1 });
  
  for (let i = 0; i < waitingUsers.length; i++) {
    waitingUsers[i].position = i + 1;
    await waitingUsers[i].save();
  }
};
```

## 🔗 Relationships & References

### **One-to-Many Relationships**

1. **User → Sessions**: A user can participate in multiple sessions
   ```javascript
   // In User model
   UserSchema.virtual('sessions', {
     ref: 'Session',
     localField: '_id',
     foreignField: 'participants.userId'
   });
   ```

2. **Topic → Sessions**: A topic can have multiple sessions
   ```javascript
   // In Topic model
   TopicSchema.virtual('sessions', {
     ref: 'Session',
     localField: '_id',
     foreignField: 'topicId'
   });
   ```

3. **Topic → WaitingPool**: A topic can have multiple waiting users
   ```javascript
   // In Topic model
   TopicSchema.virtual('waitingUsers', {
     ref: 'WaitingPool',
     localField: '_id',
     foreignField: 'topicId',
     match: { status: 'waiting' }
   });
   ```

### **Many-to-Many Relationships**

1. **Users ↔ Sessions**: Users can participate in multiple sessions, sessions can have multiple users
   - Implemented through embedded `participants` array in Session schema
   - Each participant object contains `userId` and `role`

### **Reference Population Examples**

```javascript
// Populate session with topic and participant details
const session = await Session.findById(sessionId)
  .populate('topicId', 'name category difficulty')
  .populate('participants.userId', 'username role profileStats')
  .populate('rating.givenBy', 'username')
  .exec();

// Populate topic with current waiting statistics
const topic = await Topic.findById(topicId)
  .populate({
    path: 'waitingUsers',
    match: { status: 'waiting' },
    select: 'userId role joinedAt',
    populate: {
      path: 'userId',
      select: 'username role profileStats.averageRating'
    }
  })
  .exec();
```

## 📈 Database Performance Optimizations

### **Indexing Strategy**
- **Single field indexes**: Frequently queried fields
- **Compound indexes**: Multi-field query patterns
- **Text indexes**: Full-text search capabilities
- **TTL indexes**: Automatic document expiration
- **Partial indexes**: Conditional indexing for specific use cases

### **Query Optimization**
- **Projection**: Only fetch required fields
- **Pagination**: Limit result sets with skip/limit
- **Aggregation**: Use MongoDB aggregation pipeline for complex queries
- **Caching**: Redis caching for frequently accessed data

### **Connection Management**
- **Connection pooling**: Mongoose connection pool configuration
- **Read preferences**: Direct reads to secondary replicas when appropriate
- **Write concerns**: Ensure data consistency for critical operations

This comprehensive database schema supports the full functionality of the Topic Video Learning Platform with proper relationships, validation, and performance optimizations.