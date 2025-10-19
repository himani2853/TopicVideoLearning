const jwt = require('jsonwebtoken');
const User = require('../models/User');
const WaitingPool = require('../models/WaitingPool');
const Session = require('../models/Session');

// Store active connections
const activeConnections = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected with socket ID: ${socket.id}`);
    
    // Store the connection
    activeConnections.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Update user's last seen
    User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() }).exec();

    // Join user to their personal room for direct messaging
    socket.join(`user_${socket.userId}`);

    // Handle joining waiting pool with socket ID
    socket.on('joinWaitingPool', async (data) => {
      try {
        const { topicId } = data;
        
        // Update waiting pool entry with current socket ID
        await WaitingPool.findOneAndUpdate(
          { user: socket.userId, topic: topicId, isActive: true },
          { socketId: socket.id },
          { upsert: false }
        );

        socket.join(`waiting_${topicId}`);
        console.log(`User ${socket.user.username} joined waiting pool for topic ${topicId}`);
        
        socket.emit('waitingPoolJoined', { topicId, socketId: socket.id });
      } catch (error) {
        console.error('Error joining waiting pool:', error);
        socket.emit('error', { message: 'Failed to join waiting pool' });
      }
    });

    // Handle leaving waiting pool
    socket.on('leaveWaitingPool', async (data) => {
      try {
        const { topicId } = data;
        
        await WaitingPool.findOneAndDelete({
          user: socket.userId,
          topic: topicId,
          isActive: true
        });

        socket.leave(`waiting_${topicId}`);
        console.log(`User ${socket.user.username} left waiting pool for topic ${topicId}`);
        
        socket.emit('waitingPoolLeft', { topicId });
      } catch (error) {
        console.error('Error leaving waiting pool:', error);
        socket.emit('error', { message: 'Failed to leave waiting pool' });
      }
    });

    // Handle joining video session room
    socket.on('joinSession', async (data) => {
      try {
        const { sessionId, roomId } = data;
        
        // Verify user is participant in this session
        const session = await Session.findById(sessionId);
        if (!session) {
          return socket.emit('error', { message: 'Session not found' });
        }

        const isParticipant = session.user1.equals(socket.userId) || 
                             session.user2.equals(socket.userId);
        
        if (!isParticipant) {
          return socket.emit('error', { message: 'Access denied to session' });
        }

        socket.join(roomId);
        console.log(`User ${socket.user.username} joined session room ${roomId}`);
        
        // Notify other participant
        socket.to(roomId).emit('participantJoined', {
          userId: socket.userId,
          username: socket.user.username
        });

        socket.emit('sessionJoined', { sessionId, roomId });
      } catch (error) {
        console.error('Error joining session:', error);
        socket.emit('error', { message: 'Failed to join session' });
      }
    });

    // Handle leaving video session
    socket.on('leaveSession', (data) => {
      try {
        const { roomId } = data;
        
        socket.leave(roomId);
        
        // Notify other participant
        socket.to(roomId).emit('participantLeft', {
          userId: socket.userId,
          username: socket.user.username
        });

        console.log(`User ${socket.user.username} left session room ${roomId}`);
      } catch (error) {
        console.error('Error leaving session:', error);
      }
    });

    // Handle video call signaling
    socket.on('offer', (data) => {
      const { roomId, offer } = data;
      socket.to(roomId).emit('offer', {
        offer,
        from: socket.userId
      });
    });

    socket.on('answer', (data) => {
      const { roomId, answer } = data;
      socket.to(roomId).emit('answer', {
        answer,
        from: socket.userId
      });
    });

    socket.on('ice-candidate', (data) => {
      const { roomId, candidate } = data;
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        from: socket.userId
      });
    });

    // Handle chat messages in session
    socket.on('sessionMessage', (data) => {
      try {
        const { roomId, message } = data;
        
        socket.to(roomId).emit('sessionMessage', {
          message,
          from: {
            id: socket.userId,
            username: socket.user.username
          },
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error sending session message:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('typing', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle connection status updates
    socket.on('updateStatus', async (data) => {
      try {
        const { status } = data; // 'online', 'away', 'busy'
        
        const connection = activeConnections.get(socket.userId);
        if (connection) {
          connection.status = status;
          activeConnections.set(socket.userId, connection);
        }

        // Update user's last seen
        await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        
        console.log(`User ${socket.user.username} status updated to: ${status}`);
      } catch (error) {
        console.error('Error updating status:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      try {
        console.log(`User ${socket.user.username} disconnected: ${reason}`);
        
        // Remove from active connections
        activeConnections.delete(socket.userId);
        
        // Update user's last seen
        await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
        
        // Remove from all waiting pools for this socket
        await WaitingPool.deleteMany({ 
          user: socket.userId, 
          socketId: socket.id 
        });

        // Handle ongoing sessions (mark as interrupted but don't end automatically)
        const activeSessions = await Session.find({
          $or: [{ user1: socket.userId }, { user2: socket.userId }],
          status: 'active'
        });

        for (const session of activeSessions) {
          // Notify other participant about disconnection
          socket.to(session.roomId).emit('participantDisconnected', {
            userId: socket.userId,
            username: socket.user.username,
            reason
          });
        }

      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.username}:`, error);
    });
  });

  // Cleanup function to remove inactive connections
  setInterval(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [userId, connection] of activeConnections.entries()) {
      if (connection.connectedAt < fiveMinutesAgo) {
        // Check if socket is still connected
        const socket = io.sockets.sockets.get(connection.socketId);
        if (!socket || !socket.connected) {
          activeConnections.delete(userId);
          console.log(`Cleaned up inactive connection for user: ${userId}`);
        }
      }
    }
  }, 60000); // Run every minute

  return {
    getActiveConnections: () => activeConnections,
    getConnectionCount: () => activeConnections.size,
    isUserOnline: (userId) => activeConnections.has(userId.toString()),
    notifyUser: (userId, event, data) => {
      io.to(`user_${userId}`).emit(event, data);
    }
  };
};

module.exports = socketHandler;