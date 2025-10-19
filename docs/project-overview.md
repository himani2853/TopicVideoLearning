# Project Overview & Architecture

## 🏗️ System Architecture

The Topic Video Learning Platform follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │     Backend     │    │    Database     │
│   (Next.js)     │◄──►│  (Express.js)   │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ • React Pages   │    │ • REST APIs     │    │ • Users         │
│ • Components    │    │ • Socket.io     │    │ • Topics        │
│ • Auth Context  │    │ •Auth Middleware│    │ • Sessions      │
│ • API Services  │    │ • Business Logic│    │ • WaitingPool   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │ WebRTC Signaling      │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Video Service  │    │  Real-time      │
│   (Agora SDK)   │    │  (Socket.io)    │
│                 │    │                 │
│ • Video Calls   │    │ • Matching      │
│ • Audio Calls   │    │ • Chat Messages │
│ • Screen Share  │    │ • Notifications │
└─────────────────┘    └─────────────────┘
```

## 🔄 Data Flow Architecture

### 1. User Authentication Flow

```
User Login → Frontend Form → API Call → Backend Validation → JWT Token → Frontend Storage → Protected Routes
```

### 2. Topic Selection & Matching Flow

```
User Selects Topic → Join Waiting Pool → Socket Connection → Matching Algorithm → Session Creation → Video Chat
```

### 3. Video Session Flow

```
Match Found → Session Created → WebRTC Connection → Video/Audio Stream → Real-time Chat → Session End → Feedback
```

## 📁 Project Structure

```
TopicVideoLearning/
├── 📂 backend/                 # Node.js Express Server
│   ├── 📂 models/             # Database Models (Mongoose)
│   ├── 📂 routes/             # API Route Handlers
│   ├── 📂 middleware/         # Authentication & Validation
│   ├── 📂 socket/             # WebSocket Handlers
│   ├── 📂 scripts/            # Database Utilities
│   ├── 📄 server.js           # Main Server Entry Point
│   └── 📄 package.json        # Dependencies & Scripts
│
├── 📂 frontend/               # Next.js React Application
│   ├── 📂 src/
│   │   ├── 📂 app/            # Next.js App Router Pages
│   │   ├── 📂 components/     # Reusable React Components
│   │   ├── 📂 contexts/       # React Context Providers
│   │   ├── 📂 lib/            # Utility Functions & Services
│   │   └── 📂 styles/         # Global CSS & Tailwind
│   ├── 📄 next.config.js      # Next.js Configuration
│   └── 📄 package.json        # Dependencies & Scripts
│
├── 📂 docs/                   # Project Documentation
├── 📄 package.json            # Root Package (Workspace)
├── 📄 README.md               # Project Overview
└── 📄 SETUP.md                # Setup Instructions
```

## 🎯 Core Features

### 1. **User Management**

- Registration with role selection (Learner/Mentor)
- JWT-based authentication
- Profile management
- Session history tracking

### 2. **Topic System**

- Browse topics by category and difficulty
- Search and filter functionality
- Topic statistics and ratings
- Dynamic topic creation (for mentors)

### 3. **Real-time Matching**

- Smart matching algorithm
- Waiting pool management
- Live status updates
- Instant notifications

### 4. **Video Communication**

- High-quality video calls using Agora WebRTC
- Real-time text chat during sessions
- Screen sharing capabilities
- Session recording (future feature)

### 5. **Session Management**

- Session creation and tracking
- Feedback and rating system
- Session history and analytics
- Performance metrics

## 🔗 Key Integrations

- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.io for WebSocket connections
- **Video**: Agora WebRTC SDK for video communication
- **Styling**: Tailwind CSS for responsive design
- **Validation**: Express-validator for API input validation

## 📊 Database Design

The application uses MongoDB with four main collections:

- **Users**: Store user accounts and profiles
- **Topics**: Learning topics with metadata
- **Sessions**: Video chat sessions between users
- **WaitingPool**: Temporary storage for users waiting to be matched

Each collection is designed for optimal performance and scalability with proper indexing and relationships.