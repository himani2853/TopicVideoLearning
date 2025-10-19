# Topic-Based Video Learning Platform

An online platform to connect learners via video chat to discuss specific topics.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install && cd ..
   ```

2. **Start MongoDB**

   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

3. **Seed database**

   ```bash
   cd backend && node scripts/seedDatabase.js && cd ..
   ```

4. **Run the application**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   - Frontend: http://localhost:3000 (or 3002)
   - Backend API: http://localhost:5000

## ✨ Features

- 👥 **Real-time Matching**: Get matched with learners interested in the same topics
- 🎥 **Video Chat**: High-quality video conversations using Agora WebRTC
- 📚 **Topic Library**: Browse and search through various learning topics
- 📊 **Dashboard**: Track your learning sessions and statistics
- 💬 **Session Chat**: Text chat during video sessions
- ⭐ **Feedback System**: Rate and review your learning sessions
- 🔐 **Secure Authentication**: JWT-based user authentication

## 🎯 How It Works

1. **Register** and choose your role (Learner or Mentor)
2. **Browse Topics** and select what you want to discuss
3. **Get Matched** with another learner interested in the same topic
4. **Video Chat** and learn together in real-time
5. **Provide Feedback** and track your learning progress


## System Design Architecture

```mermaid
flowchart LR
    FE[Frontend<br/>(React / Next)] <--> BE[Backend<br/>(Node.js / Express)]
    BE <--> DB[Database<br/>(MongoDB / PostgreSQL)]

    FE -->|WebRTC / Video API| VS[Video Service<br/>(Agora / Twilio)]
    BE --> AUTH[Authentication / Session Logic]


### Frontend (React/Next):

This is what users interact with — pages for login, topic selection, and video chat.
It communicates with the backend using REST APIs (for data) and WebSockets (for live events like matching or session updates).

### Backend (Node.js/Express):

The brain of the system. Handles:
 -> User authentication
 -> Matching logic
 -> Session management
 -> Interfacing with the database and the video service

### Database (MongoDB):

 Stores:
 -> Users
 -> Topics
 -> Active and past sessions

### Video Service (WebRTC / Agora / Twilio):

 -> Handles the real-time video and audio streaming between users once matched.

## User flow diagram

[Landing Page]
       |
       v
[Login / Signup]
       |
       v
[Select Topic]
       |
       v
[Matchmaking System] ---No match--> [Wait / Retry]
       |
   Match found
       |
       v
[Enter Video Chat Room]
       |
       v
[Session Ends / Feedback]
       |
       v
[Back to Topic Selection or Logout]

### For MVP: 

[Landing Page]
   ↓
[Login / Signup]
   ↓
[Select Topic]
   ↓
[Waiting Pool for Topic]
   ↓
    ├── No other learner waiting → Add user to waiting pool (backend)
    │
    └── Another learner found → Match and create session
          ↓
     [Enter Video Chat Room]
          ↓
     [Session Ends / Feedback]
          ↓
     [Back to Topic Selection or Logout]


### Flow Explanation:

1) Landing Page: 

- The user visits the site.
- Basic info and a “Get Started” button.

2) Login / Signup:

- The user creates an account or logs in (handled via backend auth API).
- User data stored in the Users table/collection.

3) Select Topic:

- User chooses a topic (e.g., “Python Basics”).
- Frontend sends this to backend via API (/api/match).

4) Matchmaking System: (currently we are considering learner to learner match making only for the MVP phase)

- Backend checks if another user with the same topic is available.

- If yes → they’re matched into a session.

- If not → user waits until someone else selects the same topic.
    Match Found:

- Backend creates a Session entry with both user IDs and topic ID.

- Returns a “room ID” to both clients.

5) Enter Video Chat Room:

- Frontend connects to the video service (Agora/Twilio/WebRTC) using the room ID.
- Two users can now video chat in real time.

6) Session Ends / Feedback:

- When either user leaves or ends the chat, the session status updates in the backend (e.g., status = completed).
- Optionally, users can leave feedback.

7) Back to Topic Selection:

- After the chat, users return to the topic selection page or log out.

## Database Schema Diagram

+-----------------+       +-----------------+       +-----------------+
|     Users       |       |     Sessions    |       |     Topics      |
+-----------------+       +-----------------+       +-----------------+
| user_id (PK)    |<----->| session_id (PK) |       | topic_id (PK)   |
| username        |       | topic_id (FK)   |<----->| name            |
| email           |       | user1_id (FK)   |       | description     |
| password_hash   |       | user2_id (FK)   |       +-----------------+
| role            |       | start_time      |
+-----------------+       | end_time        |
                          | status          |
                          +-----------------+

| Field         | Description                                  |
| ------------- | -------------------------------------------- |
| user_id       | Unique ID for each user                      |
| username      | Display name                                 |
| email         | Login credential                             |
| password_hash | Encrypted password                           |
| role          | 'learner' or 'mentor' (optional distinction) |


| Field       | Description                         |
| ----------- | ----------------------------------- |
| topic_id    | Unique topic identifier             |
| name        | Topic title (e.g., “Python Basics”) |
| description | Optional details                    |


| Field                | Description                    |
| -------------------- | ------------------------------ |
| session_id           | Unique session ID              |
| topic_id             | Linked to Topics table         |
| user1_id, user2_id   | Participants                   |
| start_time, end_time | Timestamps                     |
| status               | ongoing / completed / canceled |

### Relationships:

1) One topic can have many sessions.

2) Each session links exactly two users (for MVP).

3) Each user can appear in multiple sessions over time.


### How Everything Works Together

Here’s the real-time logic:

1) User logs in → frontend sends credentials to backend → backend verifies using database.

2) User selects topic → backend looks for another user with same topic in waiting pool.

3) When match found → backend creates a Session record → notifies both clients via WebSocket.

4) Frontend opens a video chat using the room ID (through Agora/WebRTC).

5) When users leave → backend updates session status → session data stored permanently.


## Tech Stack:

- Frontend: React, Next.js, Tailwind CSS
- Backend: Node.js, Express, Socket.io
- Database: MongoDB (via Mongoose)
- Video Service: WebRTC or Agora SDK


### 📁 Complete File Structure:

TopicVideoLearning/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env
│   ├── models/ (User, Topic, Session, WaitingPool)
│   ├── routes/ (auth, topics, sessions, matching)
│   ├── middleware/ (auth)
│   ├── socket/ (socketHandler)
│   └── scripts/ (seedDatabase)
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── .env.local
│   ├── src/
│   │   ├── app/ (layout, login, dashboard, session pages)
│   │   ├── contexts/ (AuthContext)
│   │   ├── lib/ (api, socket services)
│   │   └── styles/ (globals.css)
├── package.json (workspace management)
├── .gitignore
├── SETUP.md
└── README.md