import { TestBed } from '@angular/core/testing';
import { WebsocketService, MessageStatus, QueuedMessage } from './websocket.service';
import { StorageService } from '../service/storage-service.service';
import { MessageDTO, TypingIndicatorDTO, MessageType } from '../models/message.model';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    // Mock send implementation
    console.log('Mock WebSocket send:', data);
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
      this.onclose(closeEvent);
    }
  }

  // Helper methods for testing
  simulateMessage(data: any): void {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage(messageEvent);
    }
  }

  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code: number = 1006): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', { code, reason: 'Connection lost' });
      this.onclose(closeEvent);
    }
  }
}

describe('WebsocketService', () => {
  let service: WebsocketService;
  let storageService: jasmine.SpyObj<StorageService>;
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['getItem']);

    TestBed.configureTestingModule({
      providers: [
        WebsocketService,
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    });

    service = TestBed.inject(WebsocketService);
    storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;

    // Mock WebSocket globally
    (global as any).WebSocket = MockWebSocket;
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });

    storageService.getItem.and.returnValue('mock-jwt-token');
  });

  afterEach(() => {
    service.disconnect();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Connection Management', () => {
    it('should connect successfully with valid token', (done) => {
      service.connectionStatus$.subscribe(status => {
        if (status) {
          expect(service.isConnected).toBe(true);
          done();
        }
      });

      service.connect();
    });

    it('should not connect without token', () => {
      storageService.getItem.and.returnValue(null);
      
      service.connect();
      
      expect(service.isConnected).toBe(false);
    });

    it('should handle connection errors gracefully', (done) => {
      let connectionAttempts = 0;
      
      service.connectionStatus$.subscribe(status => {
        if (!status) {
          connectionAttempts++;
          if (connectionAttempts === 1) {
            // First disconnect should trigger reconnection
            expect(service.getReconnectionInfo().attempts).toBeGreaterThan(0);
            done();
          }
        }
      });

      service.connect();
      
      // Simulate connection error after a short delay
      setTimeout(() => {
        const ws = (service as any).socket as MockWebSocket;
        ws.simulateError();
        ws.simulateClose(1006); // Abnormal closure
      }, 50);
    });

    /**
     * **Feature: fitness-frontend-features, Property 27: WebSocket connection management**
     * For any WebSocket connection failure, the system should attempt reconnection 
     * and handle connection state properly
     */
    it('should manage connection state and reconnection properly', (done) => {
      // Property: For any connection failure, reconnection should be attempted with proper state management
      let connectionStates: boolean[] = [];
      let reconnectionAttempts = 0;
      
      service.connectionStatus$.subscribe(status => {
        connectionStates.push(status);
        
        if (!status && connectionStates.length > 1) {
          reconnectionAttempts++;
          const reconnectionInfo = service.getReconnectionInfo();
          
          // Verify reconnection attempts are tracked
          expect(reconnectionInfo.attempts).toBeGreaterThan(0);
          expect(reconnectionInfo.maxAttempts).toBeGreaterThan(0);
          
          // Verify connection state is properly managed
          expect(service.isConnected).toBe(false);
          expect(service.getConnectionState()).toBe('CLOSED');
          
          if (reconnectionAttempts >= 2) {
            done();
          }
        }
      });

      // Start connection
      service.connect();
      
      // Simulate multiple connection failures
      setTimeout(() => {
        const ws = (service as any).socket as MockWebSocket;
        ws.simulateClose(1006); // First failure
        
        setTimeout(() => {
          const ws2 = (service as any).socket as MockWebSocket;
          if (ws2) {
            ws2.simulateClose(1006); // Second failure
          }
        }, 100);
      }, 50);
    });
  });

  describe('Message Handling', () => {
    beforeEach((done) => {
      service.connectionStatus$.subscribe(status => {
        if (status) {
          done();
        }
      });
      service.connect();
    });

    it('should send messages when connected', () => {
      const testMessage = {
        content: 'Test message',
        receiverId: 123
      };

      const messageId = service.sendMessage(testMessage);
      
      expect(messageId).toBeDefined();
      expect(messageId).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });

    it('should queue messages when disconnected', () => {
      service.disconnect();
      
      const testMessage = {
        content: 'Queued message',
        receiverId: 123
      };

      const messageId = service.sendMessage(testMessage);
      
      expect(messageId).toBeDefined();
      expect(service.queueSize).toBe(1);
    });

    it('should process queued messages on reconnection', (done) => {
      // Disconnect and queue a message
      service.disconnect();
      
      const testMessage = {
        content: 'Queued message',
        receiverId: 123
      };

      service.sendMessage(testMessage);
      expect(service.queueSize).toBe(1);

      // Reconnect and verify queue is processed
      service.connectionStatus$.subscribe(status => {
        if (status) {
          // Give some time for queue processing
          setTimeout(() => {
            expect(service.queueSize).toBe(0);
            done();
          }, 50);
        }
      });

      service.connect();
    });

    it('should receive and parse messages correctly', (done) => {
      const testMessage: MessageDTO = {
        id: 1,
        expediteurId: 123,
        expediteurNom: 'Test User',
        destinataireId: 456,
        destinataireNom: 'Recipient',
        contenu: 'Test message content',
        dateEnvoi: new Date(),
        conversationId: 'conv-123',
        estLu: false,
        type: MessageType.TEXT
      };

      service.messages$.subscribe(message => {
        expect(message).toEqual(testMessage);
        done();
      });

      // Simulate receiving a message
      const ws = (service as any).socket as MockWebSocket;
      ws.simulateMessage({
        type: 'message',
        payload: testMessage
      });
    });
  });

  describe('Typing Indicators', () => {
    beforeEach((done) => {
      service.connectionStatus$.subscribe(status => {
        if (status) {
          done();
        }
      });
      service.connect();
    });

    it('should send typing indicators', () => {
      const conversationId = 'conv-123';
      
      spyOn((service as any).socket, 'send');
      
      service.sendTypingIndicator(conversationId, true);
      
      expect((service as any).socket.send).toHaveBeenCalledWith(
        jasmine.stringMatching(/typing/)
      );
    });

    it('should receive and handle typing indicators', (done) => {
      const typingIndicator: TypingIndicatorDTO = {
        userId: 123,
        username: 'Test User',
        conversationId: 'conv-123',
        isTyping: true,
        timestamp: new Date()
      };

      service.typingIndicators$.subscribe(indicator => {
        expect(indicator).toEqual(typingIndicator);
        done();
      });

      // Simulate receiving typing indicator
      const ws = (service as any).socket as MockWebSocket;
      ws.simulateMessage({
        type: 'typing',
        payload: typingIndicator
      });
    });

    it('should clean up expired typing indicators', (done) => {
      const typingIndicator: TypingIndicatorDTO = {
        userId: 123,
        conversationId: 'conv-123',
        isTyping: true,
        timestamp: new Date()
      };

      let indicatorCount = 0;
      service.typingIndicators$.subscribe(indicator => {
        indicatorCount++;
        
        if (indicatorCount === 1) {
          expect(indicator.isTyping).toBe(true);
        } else if (indicatorCount === 2) {
          expect(indicator.isTyping).toBe(false);
          expect(indicator.userId).toBe(123);
          done();
        }
      });

      // Simulate receiving typing indicator
      const ws = (service as any).socket as MockWebSocket;
      ws.simulateMessage({
        type: 'typing',
        payload: typingIndicator
      });

      // Wait for cleanup (typing timeout is 3 seconds, but we can trigger it manually)
      setTimeout(() => {
        (service as any).startTypingCleanup();
      }, 100);
    });
  });

  describe('Message Status Tracking', () => {
    beforeEach((done) => {
      service.connectionStatus$.subscribe(status => {
        if (status) {
          done();
        }
      });
      service.connect();
    });

    it('should track message status updates', (done) => {
      let statusUpdates: MessageStatus[] = [];
      
      service.messageStatus$.subscribe(status => {
        statusUpdates.push(status);
        
        if (statusUpdates.length === 1) {
          expect(status.status).toBe('sent');
          expect(status.messageId).toBeDefined();
        }
        
        if (statusUpdates.length >= 1) {
          done();
        }
      });

      const testMessage = {
        content: 'Test message',
        receiverId: 123
      };

      service.sendMessage(testMessage);
    });

    it('should handle message read receipts', () => {
      const messageId = 'msg-123';
      
      spyOn((service as any).socket, 'send');
      
      service.markMessageAsRead(messageId);
      
      expect((service as any).socket.send).toHaveBeenCalledWith(
        jasmine.stringMatching(/messageRead/)
      );
    });
  });

  describe('Network Resilience', () => {
    it('should handle network offline/online events', (done) => {
      let connectionStates: boolean[] = [];
      
      service.connectionStatus$.subscribe(status => {
        connectionStates.push(status);
        
        if (connectionStates.length === 3) {
          // Should have: true (initial), false (offline), true (online)
          expect(connectionStates[0]).toBe(true);
          expect(connectionStates[1]).toBe(false);
          expect(connectionStates[2]).toBe(true);
          done();
        }
      });

      service.connect();
      
      setTimeout(() => {
        // Simulate going offline
        Object.defineProperty(navigator, 'onLine', { value: false });
        window.dispatchEvent(new Event('offline'));
        
        setTimeout(() => {
          // Simulate coming back online
          Object.defineProperty(navigator, 'onLine', { value: true });
          window.dispatchEvent(new Event('online'));
        }, 50);
      }, 50);
    });

    it('should queue messages when offline', () => {
      // Simulate offline state
      Object.defineProperty(navigator, 'onLine', { value: false });
      (service as any).isOnline = false;
      
      const testMessage = {
        content: 'Offline message',
        receiverId: 123
      };

      service.sendMessage(testMessage);
      
      expect(service.queueSize).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    it('should provide connection state information', () => {
      expect(service.getConnectionState()).toBe('CLOSED');
      
      service.connect();
      
      // After connection, state should change
      setTimeout(() => {
        expect(service.getConnectionState()).toBe('OPEN');
      }, 50);
    });

    it('should provide reconnection information', () => {
      const info = service.getReconnectionInfo();
      
      expect(info.attempts).toBe(0);
      expect(info.maxAttempts).toBeGreaterThan(0);
    });

    it('should clear message queue', () => {
      // Add messages to queue
      service.disconnect();
      service.sendMessage({ content: 'Test 1', receiverId: 1 });
      service.sendMessage({ content: 'Test 2', receiverId: 2 });
      
      expect(service.queueSize).toBe(2);
      
      service.clearMessageQueue();
      
      expect(service.queueSize).toBe(0);
    });

    it('should force reconnection', (done) => {
      let connectionCount = 0;
      
      service.connectionStatus$.subscribe(status => {
        if (status) {
          connectionCount++;
          if (connectionCount === 2) {
            // Second connection means force reconnect worked
            done();
          }
        }
      });

      service.connect();
      
      setTimeout(() => {
        service.forceReconnect();
      }, 50);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed messages gracefully', () => {
      service.connect();
      
      // Should not throw error
      expect(() => {
        const ws = (service as any).socket as MockWebSocket;
        ws.simulateMessage('invalid json');
      }).not.toThrow();
    });

    it('should handle send errors gracefully', () => {
      service.connect();
      
      // Mock send to throw error
      spyOn((service as any).socket, 'send').and.throwError('Send failed');
      
      const messageId = service.sendMessage({ content: 'Test', receiverId: 1 });
      
      expect(messageId).toBeDefined();
      expect(service.queueSize).toBe(1); // Should be queued due to error
    });
  });
});