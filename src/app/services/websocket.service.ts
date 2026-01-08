import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { MessageDTO, TypingIndicatorDTO } from '../models/message.model';
import { StorageService } from '../service/storage-service.service';
import { InAppNotification } from '../models/in-app-notification.model';

export interface MessageStatus {
  messageId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
}

export interface QueuedMessage {
  id: string;
  message: any;
  timestamp: Date;
  retryCount: number;
}

export interface WebSocketNotification {
  type: 'notification';
  payload: InAppNotification;
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<MessageDTO>();
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private typingSubject = new Subject<TypingIndicatorDTO>();
  private messageStatusSubject = new Subject<MessageStatus>();
  private notificationSubject = new Subject<InAppNotification>();
  
  private wsUrl = 'ws://localhost:8095/ws/messaging';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 1000; // Start with 1 second
  private maxReconnectInterval = 30000; // Max 30 seconds
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private heartbeatTimeout: any = null;
  
  // Message queuing for offline scenarios
  private messageQueue: QueuedMessage[] = [];
  private maxQueueSize = 100;
  private isOnline = true; // Will be set properly in constructor
  
  // Typing indicator management
  private typingUsers = new Map<string, Date>();
  private typingTimeout = 3000; // 3 seconds
  private typingCleanupInterval: any = null;

  constructor(
    private storageService: StorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize isOnline properly for browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.isOnline = navigator.onLine;
    }
    this.setupNetworkListeners();
    this.startTypingCleanup();
  }

  // Observable pour les messages reçus
  get messages$(): Observable<MessageDTO> {
    return this.messageSubject.asObservable();
  }

  // Backward compatibility methods
  onMessage(): Observable<MessageDTO> {
    return this.messages$;
  }

  onTyping(): Observable<TypingIndicatorDTO> {
    return this.typingIndicators$;
  }

  onMessageStatus(): Observable<MessageStatus> {
    return this.messageStatus$;
  }

  sendTypingStatus(conversationId: string, isTyping: boolean): void {
    this.sendTypingIndicator(conversationId, isTyping);
  }

  // Observable pour le statut de connexion
  get connectionStatus$(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  // Observable pour les indicateurs de frappe
  get typingIndicators$(): Observable<TypingIndicatorDTO> {
    return this.typingSubject.asObservable();
  }

  // Observable pour le statut des messages
  get messageStatus$(): Observable<MessageStatus> {
    return this.messageStatusSubject.asObservable();
  }

  // Observable pour les notifications in-app temps réel
  get notifications$(): Observable<InAppNotification> {
    return this.notificationSubject.asObservable();
  }

  // Get current connection status
  get isConnected(): boolean {
    return this.connectionSubject.value;
  }

  // Get queue size
  get queueSize(): number {
    return this.messageQueue.length;
  }

  // Improved connection management with automatic reconnection
  connect(): void {
    const token = this.storageService.getItem('jwt');
    if (!token) {
      console.log('No JWT token found, using mock mode');
      // Don't throw error, just use mock mode
      this.connectionSubject.next(false);
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    // Clear any existing reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionSubject.next(true);
        this.reconnectAttempts = 0;
        this.reconnectInterval = 1000; // Reset interval
        this.startHeartbeat();
        this.processMessageQueue();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'message') {
            const message: MessageDTO = data.payload;
            this.messageSubject.next(message);
          } else if (data.type === 'typing') {
            const typingIndicator: TypingIndicatorDTO = data.payload;
            this.handleTypingIndicator(typingIndicator);
          } else if (data.type === 'messageStatus') {
            const status: MessageStatus = data.payload;
            this.messageStatusSubject.next(status);
          } else if (data.type === 'notification') {
            // Handle in-app notification
            const notification = data.payload;
            this.notificationSubject.next(notification);
          } else if (data.type === 'pong') {
            // Handle heartbeat response
            this.handleHeartbeatResponse();
          } else {
            // Legacy support for direct message format
            const message: MessageDTO = data;
            this.messageSubject.next(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        this.connectionSubject.next(false);
        this.stopHeartbeat();
        
        // Only attempt reconnection if it wasn't a clean close and we have a token
        if (event.code !== 1000 && token) {
          this.handleReconnection();
        }
      };

      this.socket.onerror = (error) => {
        console.log('WebSocket error (using mock mode):', error);
        this.connectionSubject.next(false);
        this.stopHeartbeat();
      };

    } catch (error) {
      console.log('WebSocket connection failed, using mock mode:', error);
      this.connectionSubject.next(false);
    }
  }

  // Enhanced message sending with queuing and status tracking
  sendMessage(message: any, messageId?: string): string {
    const id = messageId || this.generateMessageId();
    const messageWithId = { ...message, id };

    if (this.socket?.readyState === WebSocket.OPEN && this.isOnline) {
      try {
        this.socket.send(JSON.stringify({
          type: 'message',
          payload: messageWithId
        }));
        
        // Update message status
        this.updateMessageStatus(id, 'sent');
        return id;
      } catch (error) {
        console.error('Erreur envoi message:', error);
        this.queueMessage(messageWithId);
        this.updateMessageStatus(id, 'failed');
        return id;
      }
    } else {
      // Queue message for later sending
      this.queueMessage(messageWithId);
      this.updateMessageStatus(id, 'sending');
      return id;
    }
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const typingData = {
        type: 'typing',
        payload: {
          conversationId,
          isTyping,
          timestamp: new Date()
        }
      };
      
      try {
        this.socket.send(JSON.stringify(typingData));
      } catch (error) {
        console.error('Erreur envoi indicateur frappe:', error);
      }
    }
  }

  // Mark message as read
  markMessageAsRead(messageId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const readData = {
        type: 'messageRead',
        payload: { messageId }
      };
      
      try {
        this.socket.send(JSON.stringify(readData));
      } catch (error) {
        console.error('Erreur marquage message lu:', error);
      }
    }
  }

  // Enhanced disconnection with cleanup
  disconnect(): void {
    // Clear all timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    this.stopTypingCleanup();
    
    if (this.socket) {
      // Send clean close
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      }
      this.socket = null;
    }
    
    this.connectionSubject.next(false);
    this.reconnectAttempts = 0;
  }

  // Improved reconnection with exponential backoff
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isOnline) {
      this.reconnectAttempts++;
      
      // Exponential backoff with jitter
      const backoffTime = Math.min(
        this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectInterval
      );
      const jitter = Math.random() * 1000; // Add up to 1 second jitter
      const delay = backoffTime + jitter;
      
      console.log(`Reconnexion WebSocket ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${Math.round(delay)}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  // Network status management
  private setupNetworkListeners(): void {
    // Only set up network listeners in browser environment
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => {
        console.log('Connexion réseau rétablie');
        this.isOnline = true;
        if (!this.isConnected) {
          this.reconnectAttempts = 0; // Reset attempts on network recovery
          this.connect();
        }
      });

      window.addEventListener('offline', () => {
        console.log('Connexion réseau perdue');
        this.isOnline = false;
        this.connectionSubject.next(false);
      });
    }
  }

  // Message queuing for offline scenarios
  private queueMessage(message: any): void {
    if (this.messageQueue.length >= this.maxQueueSize) {
      // Remove oldest message
      this.messageQueue.shift();
    }
    
    const queuedMessage: QueuedMessage = {
      id: message.id || this.generateMessageId(),
      message,
      timestamp: new Date(),
      retryCount: 0
    };
    
    this.messageQueue.push(queuedMessage);
    console.log(`Message mis en file d'attente. Taille: ${this.messageQueue.length}`);
  }

  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;
    
    console.log(`Traitement de ${this.messageQueue.length} messages en attente`);
    
    const messagesToProcess = [...this.messageQueue];
    this.messageQueue = [];
    
    messagesToProcess.forEach(queuedMessage => {
      if (queuedMessage.retryCount < 3) {
        queuedMessage.retryCount++;
        const success = this.sendMessage(queuedMessage.message, queuedMessage.id);
        
        if (!success) {
          // Re-queue if failed
          this.messageQueue.push(queuedMessage);
        }
      } else {
        console.warn('Message abandonné après 3 tentatives:', queuedMessage.id);
        this.updateMessageStatus(queuedMessage.id, 'failed');
      }
    });
  }

  // Heartbeat mechanism for connection health
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ type: 'ping' }));
          
          // Set timeout for pong response
          this.heartbeatTimeout = setTimeout(() => {
            console.warn('Heartbeat timeout - connexion probablement fermée');
            this.socket?.close();
          }, 5000);
        } catch (error) {
          console.error('Erreur heartbeat:', error);
        }
      }
    }, 30000); // Send ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private handleHeartbeatResponse(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  // Typing indicator management
  private handleTypingIndicator(indicator: TypingIndicatorDTO): void {
    const key = `${indicator.userId}-${indicator.conversationId || 'global'}`;
    
    if (indicator.typing) {
      this.typingUsers.set(key, new Date());
    } else {
      this.typingUsers.delete(key);
    }
    
    this.typingSubject.next(indicator);
  }

  private startTypingCleanup(): void {
    this.typingCleanupInterval = setInterval(() => {
      const now = new Date();
      const expiredKeys: string[] = [];
      
      this.typingUsers.forEach((timestamp, key) => {
        if (now.getTime() - timestamp.getTime() > this.typingTimeout) {
          expiredKeys.push(key);
        }
      });
      
      expiredKeys.forEach(key => {
        this.typingUsers.delete(key);
        // Emit typing stopped for expired indicators
        const [userId, conversationId] = key.split('-');
        this.typingSubject.next({
          userId: parseInt(userId),
          username: '',
          conversationId: conversationId === 'global' ? undefined : conversationId,
          typing: false,
          timestamp: now
        });
      });
    }, 1000); // Check every second
  }

  private stopTypingCleanup(): void {
    if (this.typingCleanupInterval) {
      clearInterval(this.typingCleanupInterval);
      this.typingCleanupInterval = null;
    }
  }

  // Message status tracking
  private updateMessageStatus(messageId: string, status: MessageStatus['status']): void {
    const messageStatus: MessageStatus = {
      messageId,
      status,
      timestamp: new Date()
    };
    
    this.messageStatusSubject.next(messageStatus);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  // Utility methods
  getConnectionState(): string {
    if (!this.socket) return 'CLOSED';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  getReconnectionInfo(): { attempts: number; maxAttempts: number; nextRetryIn?: number } {
    return {
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextRetryIn: this.reconnectTimer ? undefined : 0
    };
  }

  clearMessageQueue(): void {
    this.messageQueue = [];
    console.log('File d\'attente des messages vidée');
  }

  // Force reconnection (useful for manual retry)
  forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }
}
