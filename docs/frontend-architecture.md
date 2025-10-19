# Frontend Architecture & Component Flow

## 🗂️ Frontend File Structure

```
frontend/
├── 📄 package.json                 # Dependencies and scripts
├── 📄 next.config.js               # Next.js configuration
├── 📄 tailwind.config.js           # Tailwind CSS setup
├── 📄 tsconfig.json                # TypeScript configuration
├── 📄 .env.local                   # Environment variables
│
└── 📂 src/
    ├── 📂 app/                     # Next.js App Router (Pages)
    │   ├── 📄 layout.tsx           # Root layout component
    │   ├── 📄 page.tsx             # Landing page (/)
    │   ├── 📂 login/
    │   │   └── 📄 page.tsx         # Login page (/login)
    │   ├── 📂 register/
    │   │   └── 📄 page.tsx         # Registration page (/register)
    │   ├── 📂 dashboard/
    │   │   └── 📄 page.tsx         # User dashboard (/dashboard)
    │   ├── 📂 topics/
    │   │   └── 📄 page.tsx         # Browse topics (/topics)
    │   └── 📂 session/
    │       ├── 📂 start/
    │       │   └── 📄 page.tsx     # Topic selection (/session/start)
    │       └── 📂 waiting/
    │           └── 📄 [topicId]/
    │               └── 📄 page.tsx # Waiting room (/session/waiting/[id])
    │
    ├── 📂 contexts/                # React Context Providers
    │   └── 📄 AuthContext.tsx      # Authentication state management
    │
    ├── 📂 lib/                     # Utility Functions & Services
    │   ├── 📄 api.ts               # Axios HTTP client configuration
    │   └── 📄 socket.ts            # Socket.io client service
    │
    └── 📂 styles/                  # Styling
        └── 📄 globals.css          # Global CSS with Tailwind
```

## 🔄 Frontend Data Flow

### 1. Application Bootstrap Flow
```
app/layout.tsx → AuthProvider → Check Token → Set User State → Render Children
```

### 2. Authentication Flow
```
Login Page → Form Submit → API Call → JWT Token → Context Update → Redirect to Dashboard
```

### 3. Topic Selection Flow
```
Browse Topics → Select Topic → Join Waiting Pool → Socket Connection → Match Found → Video Session
```

## 📄 Key Frontend Files Explained

### **App Router Structure (src/app/)**

#### **layout.tsx** - Root Application Layout
- **Purpose**: Global layout wrapper for all pages
- **Features**:
  - Next.js metadata configuration
  - Font loading (Inter from Google Fonts)
  - AuthProvider wrapper for authentication state
  - React Hot Toast for notifications
  - Global styling application

**Component Hierarchy**:
```
RootLayout
├── AuthProvider (Authentication context)
├── Global CSS (Tailwind styles)
└── Toast Notifications (react-hot-toast)
```

#### **page.tsx** - Landing Page (/)
- **Purpose**: Marketing landing page for new users
- **Features**:
  - Hero section with call-to-action
  - Feature highlights with icons
  - How-it-works explanation
  - Navigation to login/register
  - No authentication required

**Key Components**:
- Navigation bar with login/register links
- Hero section with animated elements
- Feature grid with benefits
- Footer with branding

#### **login/page.tsx** - User Authentication
- **Purpose**: User login interface
- **Features**:
  - Form validation using react-hook-form
  - Password visibility toggle
  - Error handling and display
  - Redirect to dashboard on success
  - Link to registration page

**Form Fields**:
- Email (required, email validation)
- Password (required, minimum 6 characters)

**Flow**:
```
Form Submit → Validation → API Call → JWT Storage → Context Update → Dashboard Redirect
```

#### **register/page.tsx** - User Registration
- **Purpose**: New user account creation
- **Features**:
  - Extended form with username, email, password, role
  - Password confirmation validation
  - Role selection (Learner/Mentor)
  - Real-time form validation
  - Automatic login after registration

**Form Fields**:
- Username (3-30 characters, unique)
- Email (valid email format, unique)
- Password (minimum 6 characters)
- Confirm Password (must match)
- Role (Learner or Mentor selection)

#### **dashboard/page.tsx** - User Dashboard
- **Purpose**: Main user interface after login
- **Features**:
  - User statistics display (sessions, ratings, hours)
  - Quick action buttons
  - Recent topics browsing
  - Popular topics sidebar
  - Session history overview

**Dashboard Sections**:
1. **Stats Cards**: Total sessions, completed sessions, average rating, learning hours
2. **Topic Grid**: Browse available topics with difficulty badges
3. **Sidebar**: Popular topics and quick actions
4. **Navigation**: Header with user info and action buttons

#### **topics/page.tsx** - Topic Browsing (Public)
- **Purpose**: Public topic browsing (no auth required)
- **Features**:
  - Search functionality
  - Category and difficulty filtering
  - Topic cards with statistics
  - Call-to-action for registration
  - Responsive grid layout

**Features**:
- Real-time search filtering
- Category dropdown (Programming, Data Science, etc.)
- Difficulty level filtering
- Session count and rating display

#### **session/start/page.tsx** - Topic Selection
- **Purpose**: Authenticated topic selection for sessions
- **Features**:
  - Same browsing interface as public topics
  - Real-time waiting statistics
  - Direct join functionality
  - Socket integration for live updates

**Additional Features**:
- Waiting pool statistics per topic
- Estimated wait times
- Real-time user count updates
- Immediate matching notifications

### **Context Management (src/contexts/)**

#### **AuthContext.tsx** - Authentication State
- **Purpose**: Global authentication state management
- **Features**:
  - User login/logout functionality
  - JWT token management
  - Profile updates
  - Socket connection management
  - Loading and error states

**State Structure**:
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}
```

**Key Methods**:
- `login(email, password)`: Authenticate user
- `register(username, email, password, role)`: Create account
- `logout()`: Clear session and disconnect socket
- `updateProfile(data)`: Update user information
- `clearError()`: Reset error state

**Integration**: Automatically connects/disconnects Socket.io based on auth status

### **Service Layer (src/lib/)**

#### **api.ts** - HTTP Client Configuration
- **Purpose**: Centralized API communication
- **Features**:
  - Axios instance with base URL configuration
  - Automatic JWT token attachment
  - Request/response interceptors
  - Automatic token refresh handling
  - Error handling and redirects

**Configuration**:
- Base URL: `http://localhost:5000/api`
- Timeout: 10 seconds
- Automatic Authorization headers
- 401 handling (redirect to login)

#### **socket.ts** - WebSocket Service
- **Purpose**: Real-time communication management
- **Features**:
  - Socket.io connection management
  - JWT-based authentication
  - Event emission and listening
  - Reconnection handling
  - Clean disconnection

**Key Methods**:
- `connect()`: Establish authenticated connection
- `joinWaitingPool(topicId)`: Join matching queue
- `joinSession(sessionId, roomId)`: Enter video session
- `sendOffer/Answer/IceCandidate()`: WebRTC signaling
- `sendSessionMessage()`: Real-time chat

**Event Handling**:
- Match notifications
- Session invitations
- Chat messages
- Connection status updates

### **Styling (src/styles/)**

#### **globals.css** - Global Styles
- **Purpose**: Global CSS with Tailwind integration
- **Features**:
  - Tailwind CSS imports
  - Custom component classes
  - Utility classes for common patterns
  - Responsive design utilities
  - Animation definitions

**Custom Classes**:
- `.btn-primary`, `.btn-secondary`, `.btn-outline`: Button styles
- `.input-field`: Form input styling
- `.card`: Content card layout
- `.badge-*`: Status indicators
- `.loading-spinner`: Loading animations

## 🔗 Component Communication Flow

### **Page → Context → Service → API**
```
User Action → Page Component → Context Method → API Service → Backend Endpoint → Database
```

### **Real-time Updates**
```
Backend Event → Socket.io → Frontend Service → Context Update → Component Re-render
```

### **Authentication Flow**
```
Login Form → AuthContext.login() → api.post('/auth/login') → JWT Storage → Socket Connection → Dashboard
```

### **Topic Selection Flow**
```
Topic Card Click → Socket Service → Waiting Pool → Match Found → Session Creation → Video Component
```

## 📱 Responsive Design

- **Mobile-first approach** using Tailwind CSS
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Grid layouts** that adapt to screen size
- **Touch-friendly** buttons and form elements
- **Optimized navigation** for mobile devices

## 🎨 Design System

### **Colors**:
- Primary: Blue palette for main actions
- Success: Green for positive feedback
- Warning: Yellow for alerts
- Error: Red for errors and validation

### **Typography**:
- Font: Inter (Google Fonts)
- Hierarchy: h1-h6 with consistent spacing
- Responsive text sizing

### **Components**:
- Consistent button styles and states
- Form input patterns
- Card layouts for content
- Badge system for statuses
- Loading states and animations

This architecture ensures maintainable, scalable frontend code with clear separation of concerns and optimal user experience.