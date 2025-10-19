import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = Cookies.get('token');
      
      if (!token) {
        reject(new Error('No authentication token found'));
        return;
      }

      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, 1000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event emitters
  joinWaitingPool(topicId: string) {
    this.socket?.emit('joinWaitingPool', { topicId });
  }

  leaveWaitingPool(topicId: string) {
    this.socket?.emit('leaveWaitingPool', { topicId });
  }

  joinSession(sessionId: string, roomId: string) {
    this.socket?.emit('joinSession', { sessionId, roomId });
  }

  leaveSession(roomId: string) {
    this.socket?.emit('leaveSession', { roomId });
  }

  sendOffer(roomId: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('offer', { roomId, offer });
  }

  sendAnswer(roomId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('answer', { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit('ice-candidate', { roomId, candidate });
  }

  sendSessionMessage(roomId: string, message: string) {
    this.socket?.emit('sessionMessage', { roomId, message });
  }

  sendTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('typing', { roomId, isTyping });
  }

  updateStatus(status: 'online' | 'away' | 'busy') {
    this.socket?.emit('updateStatus', { status });
  }

  // Event listeners
  onMatchFound(callback: (data: any) => void) {
    this.socket?.on('matchFound', callback);
  }

  onSessionJoined(callback: (data: any) => void) {
    this.socket?.on('sessionJoined', callback);
  }

  onParticipantJoined(callback: (data: any) => void) {
    this.socket?.on('participantJoined', callback);
  }

  onParticipantLeft(callback: (data: any) => void) {
    this.socket?.on('participantLeft', callback);
  }

  onParticipantDisconnected(callback: (data: any) => void) {
    this.socket?.on('participantDisconnected', callback);
  }

  onSessionEnded(callback: (data: any) => void) {
    this.socket?.on('sessionEnded', callback);
  }

  onSessionCancelled(callback: (data: any) => void) {
    this.socket?.on('sessionCancelled', callback);
  }

  onOffer(callback: (data: any) => void) {
    this.socket?.on('offer', callback);
  }

  onAnswer(callback: (data: any) => void) {
    this.socket?.on('answer', callback);
  }

  onIceCandidate(callback: (data: any) => void) {
    this.socket?.on('ice-candidate', callback);
  }

  onSessionMessage(callback: (data: any) => void) {
    this.socket?.on('sessionMessage', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('typing', callback);
  }

  onWaitingPoolJoined(callback: (data: any) => void) {
    this.socket?.on('waitingPoolJoined', callback);
  }

  onWaitingPoolLeft(callback: (data: any) => void) {
    this.socket?.on('waitingPoolLeft', callback);
  }

  // Remove event listeners
  off(event: string, callback?: any) {
    this.socket?.off(event, callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;