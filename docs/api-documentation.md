# API Documentation & Endpoints

## 🌐 API Overview

The Topic Video Learning Platform provides a RESTful API built with Express.js and MongoDB. All endpoints return JSON responses and use JWT authentication for protected routes.

**Base URL**: `http://localhost:5000/api`

**Authentication**: Bearer Token (JWT) in Authorization header

## 🔐 Authentication System

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "learner|mentor",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Token Lifecycle
- **Expiration**: 7 days from issuance
- **Storage**: Client localStorage or sessionStorage
- **Refresh**: Automatic renewal on successful requests
- **Revocation**: Logout endpoint clears server session

## 📋 API Endpoints Reference

### **Authentication Routes** (`/api/auth`)

#### **POST /api/auth/register**
Create a new user account

**Request Body**:
```json
{
  "username": "string (3-30 chars, required)",
  "email": "string (valid email, required)",
  "password": "string (min 6 chars, required)",
  "role": "learner|mentor (required)"
}
```

**Response** (200):
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "learner",
    "profileStats": {
      "totalSessions": 0,
      "completedSessions": 0,
      "averageRating": 0,
      "totalHours": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Validation Errors** (400):
```json
{
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered"
    }
  ]
}
```

#### **POST /api/auth/login**
Authenticate existing user

**Request Body**:
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "token": "jwt_token_string",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "learner",
    "profileStats": {
      "totalSessions": 5,
      "completedSessions": 3,
      "averageRating": 4.2,
      "totalHours": 12.5
    }
  }
}
```

**Authentication Errors** (401):
```json
{
  "message": "Invalid email or password"
}
```

#### **POST /api/auth/logout**
End user session (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

#### **GET /api/auth/me**
Get current user profile (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Response** (200):
```json
{
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com",
    "role": "learner",
    "profileStats": {
      "totalSessions": 8,
      "completedSessions": 6,
      "averageRating": 4.5,
      "totalHours": 18.3
    },
    "preferences": {
      "language": "en",
      "timezone": "UTC",
      "notifications": true
    }
  }
}
```

### **Topic Routes** (`/api/topics`)

#### **GET /api/topics**
Retrieve all available topics (Public Route)

**Query Parameters**:
- `search`: Filter by topic name (optional)
- `category`: Filter by category (optional)
- `difficulty`: Filter by difficulty level (optional)
- `limit`: Number of results (default: 50)
- `page`: Page number for pagination (default: 1)

**Request Example**:
```
GET /api/topics?search=javascript&category=programming&difficulty=intermediate&limit=10&page=1
```

**Response** (200):
```json
{
  "topics": [
    {
      "id": "topic_id",
      "name": "JavaScript Fundamentals",
      "description": "Learn the basics of JavaScript programming",
      "category": "Programming",
      "difficulty": "Beginner",
      "estimatedDuration": 60,
      "tags": ["javascript", "programming", "web"],
      "stats": {
        "totalSessions": 150,
        "averageRating": 4.3,
        "currentWaiting": 5
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalTopics": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### **GET /api/topics/:id**
Get specific topic details (Public Route)

**Response** (200):
```json
{
  "topic": {
    "id": "topic_id",
    "name": "React Hooks Deep Dive",
    "description": "Advanced React Hooks patterns and best practices",
    "category": "Programming",
    "difficulty": "Advanced",
    "estimatedDuration": 90,
    "tags": ["react", "hooks", "advanced"],
    "stats": {
      "totalSessions": 45,
      "averageRating": 4.7,
      "currentWaiting": 2,
      "recentSessions": [
        {
          "sessionId": "session_id",
          "completedAt": "2024-01-15T10:30:00.000Z",
          "rating": 5,
          "participants": ["user1", "user2"]
        }
      ]
    },
    "prerequisites": ["Basic React knowledge", "JavaScript ES6+"],
    "learningObjectives": [
      "Master useState and useEffect",
      "Create custom hooks",
      "Optimize performance with useMemo"
    ]
  }
}
```

### **Session Routes** (`/api/sessions`)

#### **POST /api/sessions/join-waiting-pool**
Join waiting pool for a topic (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "topicId": "string (required)",
  "role": "learner|mentor (optional, defaults to user role)"
}
```

**Response** (200):
```json
{
  "message": "Added to waiting pool",
  "waitingPool": {
    "id": "pool_id",
    "topicId": "topic_id",
    "userId": "user_id",
    "role": "learner",
    "position": 3,
    "estimatedWaitTime": 5,
    "joinedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

#### **DELETE /api/sessions/leave-waiting-pool**
Leave waiting pool (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "topicId": "string (required)"
}
```

**Response** (200):
```json
{
  "message": "Removed from waiting pool"
}
```

#### **GET /api/sessions/my-sessions**
Get user's session history (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Query Parameters**:
- `status`: Filter by session status (pending|active|completed|cancelled)
- `limit`: Number of results (default: 20)
- `page`: Page number (default: 1)

**Response** (200):
```json
{
  "sessions": [
    {
      "id": "session_id",
      "topicId": "topic_id",
      "topic": {
        "name": "Python Data Structures",
        "category": "Programming"
      },
      "participants": [
        {
          "userId": "user_id",
          "username": "john_doe",
          "role": "learner"
        },
        {
          "userId": "mentor_id",
          "username": "jane_mentor",
          "role": "mentor"
        }
      ],
      "status": "completed",
      "startTime": "2024-01-15T10:00:00.000Z",
      "endTime": "2024-01-15T11:30:00.000Z",
      "duration": 90,
      "rating": {
        "givenBy": "user_id",
        "score": 5,
        "feedback": "Excellent session, learned a lot!"
      },
      "roomId": "agora_room_id",
      "createdAt": "2024-01-15T09:45:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalSessions": 8
  }
}
```

#### **POST /api/sessions/:sessionId/rate**
Rate a completed session (Protected Route)

**Headers**: `Authorization: Bearer <jwt_token>`

**Request Body**:
```json
{
  "rating": "number (1-5, required)",
  "feedback": "string (optional, max 500 chars)"
}
```

**Response** (200):
```json
{
  "message": "Session rated successfully",
  "rating": {
    "score": 5,
    "feedback": "Great mentor, very helpful!",
    "ratedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

### **Matching Routes** (`/api/matching`)

#### **GET /api/matching/waiting-stats**
Get waiting pool statistics (Public Route)

**Response** (200):
```json
{
  "stats": [
    {
      "topicId": "topic_id",
      "topicName": "JavaScript Fundamentals",
      "learners": 8,
      "mentors": 3,
      "averageWaitTime": 4.5,
      "lastMatchedAt": "2024-01-15T14:25:00.000Z"
    }
  ],
  "globalStats": {
    "totalWaiting": 45,
    "totalLearners": 38,
    "totalMentors": 7,
    "averageMatchTime": 6.2
  }
}
```

#### **POST /api/matching/force-match**
Admin endpoint to force create matches (Protected Route - Admin Only)

**Headers**: `Authorization: Bearer <admin_jwt_token>`

**Request Body**:
```json
{
  "topicId": "string (optional)",
  "maxMatches": "number (optional, default: 10)"
}
```

**Response** (200):
```json
{
  "message": "Force matching completed",
  "matchesCreated": 3,
  "matches": [
    {
      "sessionId": "session_id",
      "topicId": "topic_id",
      "learner": "learner_user_id",
      "mentor": "mentor_user_id",
      "createdAt": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

## 🔍 Error Response Format

All error responses follow a consistent format:

### **Validation Errors** (400)
```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters",
      "code": "MIN_LENGTH"
    }
  ]
}
```

### **Authentication Errors** (401)
```json
{
  "message": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

### **Authorization Errors** (403)
```json
{
  "message": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

### **Not Found Errors** (404)
```json
{
  "message": "Resource not found",
  "code": "NOT_FOUND"
}
```

### **Rate Limiting** (429)
```json
{
  "message": "Too many requests",
  "retryAfter": 60,
  "code": "RATE_LIMIT"
}
```

### **Server Errors** (500)
```json
{
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "requestId": "req_12345"
}
```

## 🔧 Request/Response Headers

### **Standard Request Headers**
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
User-Agent: TopicVideoLearning/1.0
```

### **Standard Response Headers**
```
Content-Type: application/json
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
X-Request-ID: req_12345
```

## 📊 Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **Search endpoints**: 50 requests per minute per IP
- **File upload endpoints**: 10 requests per minute per user

## 🔐 Security Features

- **CORS**: Configured for frontend domain only
- **Helmet**: Security headers for all responses
- **Rate Limiting**: Per-endpoint rate limiting
- **Input Validation**: Express-validator for all inputs
- **SQL Injection Protection**: Mongoose ODM parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **JWT Security**: Secure token generation with expiration

This API documentation provides complete reference for all backend endpoints with request/response examples and error handling.