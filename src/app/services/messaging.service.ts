import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, of, combineLatest } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import {
  MessageDTO,
  ConversationDTO,
  SendMessageRequest,
  MessageType,
  TypingIndicatorDTO,
  ReadReceiptDTO,
  PagedResponse
} from '../models/message.model';
import { MessageApiService } from './message-api.service';
import { StompWebsocketService, ConnectionStatus } from './stomp-websocket.service';
import { TypingIndicatorService } from './typing-indicator.service';
import { MessageQueueService, QueuedMessage } from './message-queue.service';
import { MessagingErrorHandlerService, MessagingError } from './messaging-error-handler.service';
import { JwtService } from '../service/jwt.service';

export interface MessagingState {
  conversations: ConversationDTO[];
  currentConversation: ConversationDTO | null;
  messages: MessageDTO[];
  unreadCount: number;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: MessagingError | null;
  searchResults: MessageDTO[];
  isSearching: boolean;
}

const INITIAL_STATE: MessagingState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  connectionStatus: 'disconnected',
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false
};

/**
 * Service principal de messagerie
 * Orchestre tous les services de messagerie
 */
@Injectable({
  providedIn: 'root'
})
export class MessagingService implements OnDestroy {
  private stateSubject = new BehaviorSubject<MessagingState>(INITIAL_STATE);
  private subscriptions: Subscription[] = [];
  private mockMode = false;

  public state$ = this.stateSubject.asObservable();
  
  // Derived observables
  public conversations$ = this.state$.pipe(map(s => s.conversations));
  public currentConversation$ = this.state$.pipe(map(s => s.currentConversation));
  public messages$ = this.state$.pipe(map(s => s.messages));
  public unreadCount$ = this.state$.pipe(map(s => s.unreadCount));
  public connectionStatus$ = this.state$.pipe(map(s => s.connectionStatus));
  public isLoading$ = this.state$.pipe(map(s => s.isLoading));
  public error$ = this.state$.pipe(map(s => s.error));
  public searchResults$ = this.state$.pipe(map(s => s.searchResults));

  constructor(
    private apiService: MessageApiService,
    private wsService: StompWebsocketService,
    private typingService: TypingIndicatorService,
    private queueService: MessageQueueService,
    private errorHandler: MessagingErrorHandlerService,
    private jwtService: JwtService
  ) {
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.disconnect();
  }

  /**
   * Configure les subscriptions aux services
   */
  private setupSubscriptions(): void {
    // Connection status
    const connSub = this.wsService.connectionStatus$.subscribe(status => {
      this.updateState({ connectionStatus: status });
      if (status === 'disconnected' && !this.mockMode) {
        this.enableMockMode();
      }
    });
    this.subscriptions.push(connSub);

    // Incoming messages
    const msgSub = this.wsService.messages$.subscribe(message => {
      this.handleIncomingMessage(message);
    });
    this.subscriptions.push(msgSub);

    // Message sent confirmations
    const sentSub = this.wsService.messageSent$.subscribe(message => {
      this.handleMessageSent(message);
    });
    this.subscriptions.push(sentSub);

    // Read receipts
    const readSub = this.wsService.messageRead$.subscribe(receipt => {
      this.handleReadReceipt(receipt);
    });
    this.subscriptions.push(readSub);

    // Errors
    const errSub = this.errorHandler.lastError$.subscribe(error => {
      this.updateState({ error });
    });
    this.subscriptions.push(errSub);
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Initialise la messagerie
   */
  initialize(): void {
    if (!this.jwtService.isTokenValid()) {
      console.warn('Token invalide, mode mock activé');
      this.enableMockMode();
      return;
    }

    this.updateState({ isLoading: true });
    
    // Connect WebSocket
    this.wsService.connect();
    
    // Load initial data
    this.loadConversations();
    this.loadUnreadCount();
  }

  /**
   * Déconnecte la messagerie
   */
  disconnect(): void {
    this.wsService.disconnect();
    this.typingService.reset();
    this.updateState(INITIAL_STATE);
  }

  /**
   * Active le mode mock (démonstration)
   */
  private enableMockMode(): void {
    this.mockMode = true;
    console.log('Mode démonstration activé');
    this.loadMockData();
  }

  // ============================================
  // Conversations
  // ============================================

  /**
   * Charge les conversations
   */
  loadConversations(): void {
    this.updateState({ isLoading: true });

    this.apiService.getConversations().pipe(
      catchError(error => {
        this.errorHandler.handleHttpError(error);
        return of([]);
      })
    ).subscribe(conversations => {
      if (conversations.length === 0 && !this.mockMode) {
        this.enableMockMode();
        return;
      }
      this.updateState({ 
        conversations: this.sortConversations(conversations),
        isLoading: false 
      });
    });
  }

  /**
   * Sélectionne une conversation
   */
  selectConversation(conversation: ConversationDTO): void {
    this.updateState({ 
      currentConversation: conversation,
      messages: [],
      isLoading: true 
    });

    // Load messages
    const otherUserId = conversation.userId || conversation.coachId || 0;
    this.loadMessages(otherUserId);

    // Mark as read
    if (conversation.conversationId) {
      this.markConversationAsRead(conversation.conversationId);
    }
  }

  /**
   * Désélectionne la conversation courante
   */
  clearCurrentConversation(): void {
    this.updateState({ 
      currentConversation: null,
      messages: [] 
    });
  }

  // ============================================
  // Messages
  // ============================================

  /**
   * Charge les messages d'une conversation
   */
  loadMessages(otherUserId: number, page: number = 0): void {
    const userId = this.jwtService.getUserId() || 1;

    this.apiService.getConversationHistoryPaginated(userId, otherUserId, page).pipe(
      catchError(error => {
        this.errorHandler.handleHttpError(error);
        return of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20 });
      })
    ).subscribe(response => {
      const state = this.stateSubject.value;
      const newMessages = page === 0 
        ? response.content 
        : [...state.messages, ...response.content];
      
      this.updateState({ 
        messages: this.sortMessages(newMessages),
        isLoading: false 
      });
    });
  }

  /**
   * Envoie un message
   */
  sendMessage(content: string, recipientId: number, type: MessageType = MessageType.TEXT): void {
    // Validation
    if (!content.trim()) {
      this.errorHandler.handleValidationError('content', 'Le message ne peut pas être vide');
      return;
    }
    if (content.length > 2000) {
      this.errorHandler.handleValidationError('content', 'Le message ne peut pas dépasser 2000 caractères');
      return;
    }

    const request: SendMessageRequest = {
      destinataireId: recipientId,
      contenu: content.trim(),
      type
    };

    // Stop typing indicator
    this.typingService.onUserStoppedTyping(recipientId);

    // Try WebSocket first, fallback to queue
    if (this.wsService.isConnected()) {
      this.wsService.sendMessage(request);
      // Optimistic update
      this.addOptimisticMessage(request);
    } else {
      // Queue for later
      this.queueService.enqueue(request);
      this.addOptimisticMessage(request, 'pending');
    }
  }

  /**
   * Ajoute un message optimiste à l'UI
   */
  private addOptimisticMessage(request: SendMessageRequest, status: string = 'sending'): void {
    const userId = this.jwtService.getUserId() || 1;
    const state = this.stateSubject.value;
    
    const optimisticMessage: MessageDTO = {
      id: Date.now(),
      senderId: userId,
      senderName: 'Vous',
      receiverId: request.destinataireId,
      receiverName: state.currentConversation?.userName || '',
      content: request.contenu,
      timestamp: new Date().toISOString(),
      type: request.type,
      isRead: false,
      conversationId: state.currentConversation?.conversationId || ''
    };

    this.updateState({
      messages: [...state.messages, optimisticMessage]
    });

    // Update conversation last message
    this.updateConversationLastMessage(request.contenu);
  }

  // ============================================
  // Read Status
  // ============================================

  /**
   * Marque une conversation comme lue
   */
  markConversationAsRead(conversationId: string): void {
    this.apiService.markConversationAsRead(conversationId).subscribe(() => {
      this.updateConversationUnreadCount(conversationId, 0);
      this.loadUnreadCount();
    });
  }

  /**
   * Charge le compteur de messages non lus
   */
  loadUnreadCount(): void {
    this.apiService.getUnreadCount().subscribe(response => {
      this.updateState({ unreadCount: response.count });
    });
  }

  // ============================================
  // Typing Indicators
  // ============================================

  /**
   * Signale que l'utilisateur tape
   */
  onTyping(recipientId: number): void {
    this.typingService.onUserTyping(recipientId);
  }

  /**
   * Signale que l'utilisateur a arrêté de taper
   */
  onStopTyping(recipientId: number): void {
    this.typingService.onUserStoppedTyping(recipientId);
  }

  /**
   * Observable des indicateurs de frappe
   */
  get typingUsers$() {
    return this.typingService.typingUsers$;
  }

  // ============================================
  // Search
  // ============================================

  /**
   * Recherche dans les messages
   */
  searchMessages(keyword: string): void {
    if (!keyword.trim()) {
      this.updateState({ searchResults: [], isSearching: false });
      return;
    }

    this.updateState({ isSearching: true });

    this.apiService.searchMessages(keyword).pipe(
      catchError(error => {
        this.errorHandler.handleHttpError(error);
        return of([]);
      })
    ).subscribe(results => {
      this.updateState({ 
        searchResults: results,
        isSearching: false 
      });
    });
  }

  /**
   * Efface les résultats de recherche
   */
  clearSearch(): void {
    this.updateState({ searchResults: [], isSearching: false });
  }

  /**
   * Met en surbrillance le terme recherché
   */
  highlightSearchTerm(text: string, term: string): string {
    if (!term) return text;
    const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ============================================
  // Event Handlers
  // ============================================

  private handleIncomingMessage(message: MessageDTO): void {
    const state = this.stateSubject.value;
    
    // Add to messages if in current conversation
    if (state.currentConversation?.conversationId === message.conversationId) {
      this.updateState({
        messages: [...state.messages, message]
      });
      // Mark as read
      if (message.conversationId) {
        this.wsService.markAsRead(message.id, message.senderId);
      }
    } else {
      // Increment unread count
      this.updateState({ unreadCount: state.unreadCount + 1 });
    }

    // Update conversation list
    this.updateConversationWithMessage(message);
  }

  private handleMessageSent(message: MessageDTO): void {
    // Update optimistic message with real data
    const state = this.stateSubject.value;
    const messages = state.messages.map(m => 
      m.id === message.id || (m.content === message.content && m.senderId === message.senderId)
        ? message
        : m
    );
    this.updateState({ messages });
  }

  private handleReadReceipt(receipt: ReadReceiptDTO): void {
    const state = this.stateSubject.value;
    const messages = state.messages.map(m =>
      m.id === receipt.messageId ? { ...m, isRead: true } : m
    );
    this.updateState({ messages });
  }

  // ============================================
  // State Helpers
  // ============================================

  private updateState(updates: Partial<MessagingState>): void {
    const current = this.stateSubject.value;
    this.stateSubject.next({ ...current, ...updates });
  }

  private sortConversations(conversations: ConversationDTO[]): ConversationDTO[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.lastMessageAt).getTime();
      const dateB = new Date(b.lastMessageAt).getTime();
      return dateB - dateA;
    });
  }

  private sortMessages(messages: MessageDTO[]): MessageDTO[] {
    return [...messages].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
  }

  private updateConversationLastMessage(content: string): void {
    const state = this.stateSubject.value;
    if (!state.currentConversation) return;

    const conversations = state.conversations.map(c =>
      c.conversationId === state.currentConversation?.conversationId
        ? { ...c, lastMessageContent: content, lastMessageAt: new Date().toISOString() }
        : c
    );
    this.updateState({ conversations: this.sortConversations(conversations) });
  }

  private updateConversationWithMessage(message: MessageDTO): void {
    const state = this.stateSubject.value;
    const conversations = state.conversations.map(c =>
      c.conversationId === message.conversationId
        ? { 
            ...c, 
            lastMessageContent: message.content, 
            lastMessageAt: message.timestamp,
            unreadMessageCount: c.unreadMessageCount + 1
          }
        : c
    );
    this.updateState({ conversations: this.sortConversations(conversations) });
  }

  private updateConversationUnreadCount(conversationId: string, count: number): void {
    const state = this.stateSubject.value;
    const conversations = state.conversations.map(c =>
      c.conversationId === conversationId
        ? { ...c, unreadMessageCount: count }
        : c
    );
    this.updateState({ conversations });
  }

  // ============================================
  // Mock Data
  // ============================================

  private loadMockData(): void {
    const mockConversations: ConversationDTO[] = [
      {
        id: 1,
        userId: 2,
        userName: 'Dr. Martin',
        lastMessageContent: 'Comment se passe votre entraînement ?',
        lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        unreadMessageCount: 2,
        conversationId: 'conv_1_2'
      },
      {
        id: 2,
        userId: 3,
        userName: 'Sarah Johnson',
        lastMessageContent: 'Merci pour le programme !',
        lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        unreadMessageCount: 0,
        conversationId: 'conv_1_3'
      }
    ];

    this.updateState({
      conversations: mockConversations,
      unreadCount: 2,
      isLoading: false,
      connectionStatus: 'disconnected'
    });
  }

  /**
   * Vérifie si en mode mock
   */
  isMockMode(): boolean {
    return this.mockMode;
  }
}
