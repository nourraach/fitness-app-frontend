import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  MessageDTO, 
  ConversationDTO, 
  EnvoyerMessageRequest,
  NotificationDTO,
  CoachAvailabilityDTO,
  MessageReadRequest,
  TypingRequest,
  MessageType
} from '../models/message.model';
import { 
  ContactDTO, 
  ConversationCreationRequest, 
  ConversationCreationResponse,
  ContactSearchFilters 
} from '../models/contact.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class EnhancedMessagingService {
  private apiUrl = 'http://localhost:8095/api/messages';
  
  // State management
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  private messagesSubject = new BehaviorSubject<{ [conversationId: string]: MessageDTO[] }>({});
  private notificationsSubject = new BehaviorSubject<NotificationDTO[]>([]);
  private contactsSubject = new BehaviorSubject<ContactDTO[]>([]);
  
  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public contacts$ = this.contactsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService,
    private websocketService: WebsocketService
  ) {
    this.initializeWebSocketSubscriptions();
    this.loadInitialData();
  }

  // Create HTTP headers with JWT token
  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get current user ID from JWT
  private getCurrentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }

  // Initialize WebSocket subscriptions
  private initializeWebSocketSubscriptions(): void {
    // Subscribe to real-time messages
    this.websocketService.messages$.subscribe((message: MessageDTO) => {
      this.addMessageToConversation(message);
    });

    // Note: WebSocket service doesn't have notifications$ - using REST API for notifications
  }

  // Load initial data from backend
  private loadInitialData(): void {
    if (this.jwtService.isTokenValid()) {
      this.loadConversations();
    }
  }

  /**
   * Send message via REST API (always) + WebSocket for real-time
   */
  sendMessage(request: EnvoyerMessageRequest): Observable<MessageDTO> {
    console.log('📬 EnhancedMessagingService.sendMessage called:', request);
    console.log('📬 WebSocket connected:', this.websocketService.isConnected);
    
    // ALWAYS use REST API to persist the message
    console.log('📬 Envoi via REST API pour persistance');
    return this.sendMessageREST(request).pipe(
      tap(message => {
        // Also send via WebSocket for real-time delivery if connected
        if (this.websocketService.isConnected) {
          console.log('📬 Envoi également via WebSocket pour temps réel');
          this.websocketService.sendMessage(request);
        }
      })
    );
  }

  /**
   * Send message via REST API (fallback method)
   */
  private sendMessageREST(request: EnvoyerMessageRequest): Observable<MessageDTO> {
    const headers = this.createAuthHeaders();
    
    // Transform request to match backend expected format
    // Backend might expect: receiverId, content, type (English names)
    const backendRequest = {
      receiverId: request.destinataireId,
      content: request.contenu,
      type: request.type || MessageType.TEXT
    };
    
    console.log('📬 REST API call: POST /api/messages', backendRequest);
    
    // Use the correct endpoint: POST /api/messages (without userId param - identified via JWT)
    return this.http.post<MessageDTO>(`http://localhost:8095/api/messages`, backendRequest, { headers })
      .pipe(
        tap(message => {
          console.log('📬 REST API response:', message);
          this.addMessageToConversation(message);
        }),
        catchError(error => {
          console.error('📬 REST API error:', error);
          this.errorHandler.logError('sendMessageREST', error);
          throw error;
        })
      );
  }

  /**
   * Load conversations from backend
   */
  loadConversations(): Observable<ConversationDTO[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.get<ConversationDTO[]>(`${this.apiUrl}/conversations?userId=${userId}`, { headers })
      .pipe(
        tap(conversations => {
          this.conversationsSubject.next(conversations);
        }),
        catchError(error => {
          this.errorHandler.logError('loadConversations', error);
          return of([]);
        })
      );
  }

  /**
   * Load conversation history with pagination
   */
  loadConversationHistory(otherUserId: number, page: number = 0, size: number = 20): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('autreUserId', otherUserId.toString());
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    
    console.log('📬 API Call: GET /conversation/paginated', { userId, autreUserId: otherUserId, page, size });
    
    return this.http.get<any>(`${this.apiUrl}/conversation/paginated`, { headers, params })
      .pipe(
        map(response => {
          console.log('📬 API Response raw:', response);
          // Handle different response formats
          let messages: MessageDTO[] = [];
          if (Array.isArray(response)) {
            messages = response;
          } else if (response?.content && Array.isArray(response.content)) {
            messages = response.content;
          } else if (response?.messages && Array.isArray(response.messages)) {
            messages = response.messages;
          } else if (response?.data && Array.isArray(response.data)) {
            messages = response.data;
          }
          console.log('📬 Parsed messages:', messages.length, messages);
          return messages;
        }),
        tap(messages => {
          const conversationId = this.generateConversationId(userId, otherUserId);
          const currentMessages = this.messagesSubject.value;
          
          // Merge with existing messages (avoid duplicates)
          const existingMessages = currentMessages[conversationId] || [];
          const mergedMessages = this.mergeMessages(existingMessages, messages);
          
          this.messagesSubject.next({
            ...currentMessages,
            [conversationId]: mergedMessages
          });
        }),
        catchError(error => {
          this.errorHandler.logError('loadConversationHistory', error);
          return of([]);
        })
      );
  }

  /**
   * Search messages by keyword
   */
  searchMessages(keyword: string): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('keyword', keyword);
    
    return this.http.get<MessageDTO[]>(`${this.apiUrl}/search`, { headers, params })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('searchMessages', error);
          return of([]);
        })
      );
  }

  /**
   * Mark message as read
   */
  markMessageAsRead(messageId: number, conversationId: string): Observable<boolean> {
    // Try WebSocket first
    if (this.websocketService.isConnected) {
      this.websocketService.markMessageAsRead(messageId.toString());
      return of(true);
    }
    
    // Fallback to REST API
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.put<any>(`${this.apiUrl}/${messageId}/lire?userId=${userId}`, {}, { headers })
      .pipe(
        map(() => true),
        catchError(error => {
          this.errorHandler.logError('markMessageAsRead', error);
          return of(false);
        })
      );
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    if (this.websocketService.isConnected) {
      this.websocketService.sendTypingIndicator(conversationId, isTyping);
    }
  }

  /**
   * Set coach availability
   */
  setCoachAvailability(coachId: number, available: boolean, status: string): Observable<boolean> {
    const headers = this.createAuthHeaders();
    const body = { available, status };
    
    return this.http.put<any>(`${this.apiUrl}/coach/${coachId}/availability`, body, { headers })
      .pipe(
        map(() => true),
        catchError(error => {
          this.errorHandler.logError('setCoachAvailability', error);
          return of(false);
        })
      );
  }

  /**
   * Get coach availability
   */
  getCoachAvailability(coachId: number): Observable<CoachAvailabilityDTO | null> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<CoachAvailabilityDTO>(`${this.apiUrl}/coach/${coachId}/availability`, { headers })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getCoachAvailability', error);
          return of(null);
        })
      );
  }

  /**
   * Load available contacts for conversation creation
   */
  loadAvailableContacts(filters?: ContactSearchFilters): Observable<ContactDTO[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    
    if (filters?.query) {
      params = params.set('query', filters.query);
    }
    if (filters?.role) {
      params = params.set('role', filters.role);
    }
    if (filters?.onlineOnly) {
      params = params.set('onlineOnly', 'true');
    }
    if (filters?.friendsOnly) {
      params = params.set('friendsOnly', 'true');
    }
    
    return this.http.get<ContactDTO[]>(`${this.apiUrl}/contacts`, { headers, params })
      .pipe(
        tap(contacts => {
          this.contactsSubject.next(contacts);
        }),
        catchError(error => {
          this.errorHandler.logError('loadAvailableContacts', error);
          // Fallback to mock contacts
          const mockContacts = this.getMockContacts();
          this.contactsSubject.next(mockContacts);
          return of(mockContacts);
        })
      );
  }

  /**
   * Create a new conversation with a contact
   */
  createConversation(request: ConversationCreationRequest): Observable<ConversationCreationResponse> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.post<ConversationCreationResponse>(`${this.apiUrl}/conversations/create?userId=${userId}`, request, { headers })
      .pipe(
        tap(response => {
          if (response.success && response.conversation) {
            // Add new conversation to the list
            const currentConversations = this.conversationsSubject.value;
            this.conversationsSubject.next([response.conversation, ...currentConversations]);
          }
        }),
        catchError(error => {
          this.errorHandler.logError('createConversation', error);
          // Create mock conversation for demo
          const mockResponse = this.createMockConversation(request);
          return of(mockResponse);
        })
      );
  }

  /**
   * Search contacts by name or role
   */
  searchContacts(query: string): Observable<ContactDTO[]> {
    if (!query.trim()) {
      return this.loadAvailableContacts();
    }
    
    return this.loadAvailableContacts({ query: query.trim() });
  }

  /**
   * Get mock contacts for demo mode
   */
  private getMockContacts(): ContactDTO[] {
    return [
      {
        id: 2,
        name: 'Dr. Martin',
        role: 'Coach',
        isOnline: true,
        isFriend: false,
        isCoach: true,
        email: 'dr.martin@fitness.com'
      },
      {
        id: 3,
        name: 'Sarah Johnson',
        role: 'Client',
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000),
        isFriend: true,
        isCoach: false,
        email: 'sarah.j@email.com'
      },
      {
        id: 4,
        name: 'Mike Thompson',
        role: 'Client',
        isOnline: true,
        isFriend: true,
        isCoach: false,
        email: 'mike.t@email.com'
      },
      {
        id: 5,
        name: 'Emma Wilson',
        role: 'Coach',
        isOnline: false,
        lastSeen: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isFriend: false,
        isCoach: true,
        email: 'emma.w@fitness.com'
      },
      {
        id: 6,
        name: 'Alex Rodriguez',
        role: 'Client',
        isOnline: true,
        isFriend: false,
        isCoach: false,
        email: 'alex.r@email.com'
      },
      {
        id: 7,
        name: 'Coach Lisa',
        role: 'Coach',
        isOnline: true,
        isFriend: false,
        isCoach: true,
        email: 'lisa@fitness.com'
      }
    ];
  }

  /**
   * Create mock conversation for demo mode
   */
  private createMockConversation(request: ConversationCreationRequest): ConversationCreationResponse {
    const contact = this.contactsSubject.value.find(c => c.id === request.participantId);
    if (!contact) {
      return {
        conversation: {} as ConversationDTO,
        success: false,
        message: 'Contact non trouvé'
      };
    }

    const conversationId = `conv_${this.getCurrentUserId()}_${request.participantId}`;
    const newConversation: ConversationDTO = {
      id: Date.now(),
      conversationId,
      userId: this.getCurrentUserId(),
      userName: 'Vous',
      coachId: contact.isCoach ? contact.id : undefined,
      coachName: contact.isCoach ? contact.name : undefined,
      lastMessageContent: request.initialMessage || 'Nouvelle conversation',
      lastMessageAt: new Date().toISOString(),
      unreadMessageCount: 0,
      isActive: true,
      participantName: contact.name
    };

    // Add to conversations list
    const currentConversations = this.conversationsSubject.value;
    this.conversationsSubject.next([newConversation, ...currentConversations]);

    // Add initial message if provided
    if (request.initialMessage) {
      const initialMessage: MessageDTO = {
        id: Date.now(),
        senderId: this.getCurrentUserId(),
        senderName: 'Vous',
        receiverId: contact.id,
        receiverName: contact.name,
        content: request.initialMessage,
        timestamp: new Date().toISOString(),
        conversationId,
        isRead: false,
        type: MessageType.TEXT
      };
      
      this.addMessageToConversation(initialMessage);
    }

    return {
      conversation: newConversation,
      success: true,
      message: 'Conversation créée avec succès'
    };
  }

  // Utility methods
  private addMessageToConversation(message: MessageDTO): void {
    const currentMessages = this.messagesSubject.value;
    const conversationMessages = currentMessages[message.conversationId] || [];
    
    // Avoid duplicates
    const existingMessage = conversationMessages.find(m => m.id === message.id);
    if (!existingMessage) {
      const updatedMessages = [...conversationMessages, message].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      this.messagesSubject.next({
        ...currentMessages,
        [message.conversationId]: updatedMessages
      });
    }
  }

  private mergeMessages(existing: MessageDTO[], newMessages: MessageDTO[]): MessageDTO[] {
    const merged = [...existing];
    
    newMessages.forEach(newMsg => {
      const existingIndex = merged.findIndex(m => m.id === newMsg.id);
      if (existingIndex === -1) {
        merged.push(newMsg);
      }
    });
    
    return merged.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  private generateConversationId(userId1: number, userId2: number): string {
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `conv_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Get messages for a specific conversation
   */
  getMessagesForConversation(conversationId: string): MessageDTO[] {
    const allMessages = this.messagesSubject.value;
    return allMessages[conversationId] || [];
  }

  /**
   * Get conversation by ID
   */
  getConversationById(conversationId: string): ConversationDTO | null {
    const conversations = this.conversationsSubject.value;
    return conversations.find(conv => conv.conversationId === conversationId) || null;
  }

  /**
   * Get total unread messages count
   */
  getTotalUnreadCount(): Observable<number> {
    return this.conversations$.pipe(
      map(conversations => 
        conversations.reduce((total, conv) => total + (conv.unreadMessageCount || 0), 0)
      )
    );
  }

  /**
   * Clear all local state
   */
  clearState(): void {
    this.conversationsSubject.next([]);
    this.messagesSubject.next({});
    this.notificationsSubject.next([]);
    // Clear WebSocket message queue if needed
    this.websocketService.clearMessageQueue();
  }

  /**
   * Refresh all data
   */
  refreshAllData(): void {
    this.loadInitialData();
  }
}