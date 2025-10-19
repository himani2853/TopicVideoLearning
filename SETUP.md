# Quick Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (installed and running)

## Installation & Setup

1. **Clone and navigate to project**
   ```bash
   cd TopicVideoLearning
   ```

2. **Install all dependencies**
   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   cd ..
   ```

3. **Start MongoDB** (if not already running)
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

4. **Seed the database**
   ```bash
   cd backend && node scripts/seedDatabase.js && cd ..
   ```

5. **Start both servers**
   ```bash
   npm run dev
   ```

## Access the Application

- **Frontend**: http://localhost:3000 (or next available port like 3002)
- **Backend API**: http://localhost:5000

## What's Included

- ✅ 10 sample topics pre-loaded
- ✅ User registration/login system
- ✅ Real-time matching system
- ✅ Video chat functionality
- ✅ Session history and feedback

## Test the Application

1. Open http://localhost:3000 (or 3002)
2. Click "Get Started" to register
3. Browse topics and start learning sessions
4. Create multiple accounts to test matching

## Features

- User authentication (login/register)
- Topic selection and browsing
- Real-time matching system
- Video chat sessions using Agora WebRTC
- Session history and feedback
- User dashboard and statistics

## Project Structure

### Backend

- `server.js` - Main server file
- `models/` - Database models (User, Topic, Session, WaitingPool)
- `routes/` - API routes
- `middleware/` - Authentication and other middleware
- `socket/` - WebSocket handlers

### Frontend

- `src/app/` - Next.js pages
- `src/components/` - Reusable React components
- `src/contexts/` - React contexts (Auth)
- `src/lib/` - Utility functions and services
- `src/styles/` - Global styles

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Video**: Agora WebRTC SDK
- **Authentication**: JWT
- **Database**: MongoDB with Mongoose

## API Endpoints

### Authentication

- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/verify` - Verify token
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile

### Topics

- GET `/api/topics` - Get all topics
- GET `/api/topics/:id` - Get topic by ID
- POST `/api/topics` - Create new topic (mentor only)
- GET `/api/topics/meta/categories` - Get topic categories
- GET `/api/topics/meta/popular` - Get popular topics

### Matching

- POST `/api/matching/join` - Join waiting pool
- POST `/api/matching/leave` - Leave waiting pool
- GET `/api/matching/status` - Get matching status
- GET `/api/matching/stats/:topicId` - Get topic statistics

### Sessions

- GET `/api/sessions/history` - Get session history
- GET `/api/sessions/:id` - Get session details
- PATCH `/api/sessions/:id/end` - End session
- POST `/api/sessions/:id/feedback` - Submit feedback
- GET `/api/sessions/stats/overview` - Get user statistics

## Socket Events

### Client to Server

- `joinWaitingPool` - Join waiting pool for topic
- `leaveWaitingPool` - Leave waiting pool
- `joinSession` - Join video session room
- `leaveSession` - Leave video session
- `offer`, `answer`, `ice-candidate` - WebRTC signaling
- `sessionMessage` - Send chat message
- `typing` - Typing indicator

### Server to Client

- `matchFound` - Match found notification
- `sessionJoined` - Successfully joined session
- `participantJoined` - Another participant joined
- `participantLeft` - Participant left session
- `sessionEnded` - Session ended
- `sessionMessage` - Receive chat message
- `offer`, `answer`, `ice-candidate` - WebRTC signaling

## Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.