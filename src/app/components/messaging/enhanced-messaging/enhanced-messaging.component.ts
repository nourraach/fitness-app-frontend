import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  MessageDTO, 
  ConversationDTO, 
  EnvoyerMessageRequest, 
  MessageType,
  NotificationDTO,
  TypingIndicatorDTO
} from '../../../models/message.model';
import { EnhancedMessagingService } from '../../../services/enhanced-messaging.service';
import { WebsocketService } from '../../../services/websocket.service';
import { JwtService } from '../../../service/jwt.service';

@Component({
  selector: 'app-enhanced-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messaging-container">
      <!-- Header -->
      <div class="messaging-header">
        <h2><i class="pi pi-comments"></i> Messages</h2>
        <div class="header-actions">
          <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
            <i class="pi" [class.pi-wifi]="isConnected" [class.pi-times-circle]="!isConnected"></i>
            {{ isConnected ? 'Connecté' : 'Déconnecté' }}
          </div>
          <button class="btn-reconnect" (click)="reconnectWebSocket()" *ngIf="!isConnected">
            <i class="pi pi-refresh"></i> Reconnecter
          </button>
          <button class="btn-notifications" (click)="toggleNotifications()" [class.has-notifications]="notifications.length > 0">
            <i class="pi pi-bell"></i>
            <span class="notification-count" *ngIf="notifications.length > 0">{{ notifications.length }}</span>
          </button>
        </div>
      </div>

      <div class="messaging-content">
        <!-- Sidebar -->
        <div class="conversations-sidebar">
          <!-- Search -->
          <div class="search-container">
            <input type="text" 
                   placeholder="Rechercher..." 
                   [(ngModel)]="searchQuery"
                   (input)="searchMessages()"
                   class="search-input">
            <button class="clear-search" (click)="clearSearch()" *ngIf="searchQuery">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Search Results -->
          <div class="search-results" *ngIf="searchResults.length > 0">
            <h4>Résultats de recherche</h4>
            <div class="search-result" *ngFor="let message of searchResults" (click)="selectConversationFromMessage(message)">
              <div class="result-sender">{{ message.expediteurNom }}</div>
              <div class="result-content">{{ message.contenu }}</div>
              <div class="result-date">{{ formatDate(message.dateEnvoi) }}</div>
            </div>
          </div>

          <!-- Conversations List -->
          <div class="conversations-list" *ngIf="!searchResults.length">
            <div class="conversation-item" 
                 *ngFor="let conversation of conversations"
                 [class.active]="currentConversation?.conversationId === conversation.conversationId"
                 (click)="selectConversation(conversation)">
              <div class="conversation-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="conversation-info">
                <div class="conversation-name">{{ conversation.autreUtilisateurNom }}</div>
                <div class="conversation-last-message">{{ conversation.dernierMessage }}</div>
                <div class="conversation-time">{{ formatTime(conversation.dateDernierMessage) }}</div>
              </div>
              <div class="conversation-status">
                <span class="unread-count" *ngIf="conversation.messagesNonLus > 0">
                  {{ conversation.messagesNonLus }}
                </span>
                <span class="role-badge" [class]="conversation.autreUtilisateurRole.toLowerCase()">
                  {{ conversation.autreUtilisateurRole }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-conversations" *ngIf="conversations.length === 0 && !isLoading">
            <i class="pi pi-comments"></i>
            <p>Aucune conversation</p>
          </div>
        </div>

        <!-- Chat Area -->
        <div class="chat-area" *ngIf="currentConversation">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-user-info">
              <div class="chat-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="chat-user-details">
                <h3>{{ currentConversation.autreUtilisateurNom }}</h3>
                <span class="user-role">{{ currentConversation.autreUtilisateurRole }}</span>
              </div>
            </div>
            <div class="chat-actions">
              <button class="btn-load-more" (click)="loadMoreMessages()" *ngIf="hasMoreMessages">
                <i class="pi pi-arrow-up"></i> Charger plus
              </button>
            </div>
          </div>

          <!-- Messages Container -->
          <div class="messages-container" #messagesContainer>
            <div class="message-group" *ngFor="let message of messages; trackBy: trackMessage">
              <div class="message" 
                   [class.own-message]="isMessageFromCurrentUser(message)"
                   [class.other-message]="!isMessageFromCurrentUser(message)">
                <div class="message-content">
                  <div class="message-text">{{ message.contenu }}</div>
                  <div class="message-meta">
                    <span class="message-time">{{ formatTime(message.dateEnvoi) }}</span>
                    <i class="pi pi-check" *ngIf="isMessageFromCurrentUser(message) && message.lu" class="read-indicator"></i>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing Indicator -->
            <div class="typing-indicator" *ngIf="typingUsers.length > 0">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="typing-text">{{ getTypingUsersText() }}</span>
            </div>
          </div>

          <!-- Message Input -->
          <div class="message-input-container">
            <div class="message-input-wrapper">
              <textarea #messageInput
                        [(ngModel)]="newMessageContent"
                        (input)="onTyping()"
                        (keydown)="onKeyPress($event)"
                        placeholder="Tapez votre message..."
                        class="message-input"
                        rows="1"></textarea>
              <button class="send-button" 
                      (click)="sendMessage()" 
                      [disabled]="!newMessageContent.trim()">
                <i class="pi pi-send"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- No Conversation Selected -->
        <div class="no-conversation" *ngIf="!currentConversation">
          <i class="pi pi-comments"></i>
          <h3>Sélectionnez une conversation</h3>
          <p>Choisissez une conversation dans la liste pour commencer à discuter</p>
        </div>
      </div>

      <!-- Notifications Panel -->
      <div class="notifications-panel" *ngIf="showNotifications" (click)="toggleNotifications()">
        <div class="notifications-content" (click)="$event.stopPropagation()">
          <div class="notifications-header">
            <h3>Notifications</h3>
            <button class="close-notifications" (click)="toggleNotifications()">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="notifications-list">
            <div class="notification-item" *ngFor="let notification of notifications">
              <div class="notification-icon">
                <i class="pi pi-bell"></i>
              </div>
              <div class="notification-content">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messaging-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .messaging-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: white;
      border-bottom: 1px solid #eee;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .messaging-header h2 {
      margin: 0;
      color: #113F67;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .connection-status.connected {
      background: #d4edda;
      color: #2ecc71;
    }

    .connection-status.disconnected {
      background: #f8d7da;
      color: #e74c3c;
    }

    .btn-reconnect, .btn-notifications {
      background: #84cabe;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      position: relative;
    }

    .btn-notifications.has-notifications {
      background: #e74c3c;
    }

    .notification-count {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #fff;
      color: #e74c3c;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .messaging-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .conversations-sidebar {
      width: 350px;
      background: white;
      border-right: 1px solid #eee;
      display: flex;
      flex-direction: column;
    }

    .search-container {
      padding: 15px;
      border-bottom: 1px solid #eee;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .clear-search {
      position: absolute;
      right: 25px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
    }

    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
    }

    .conversation-item:hover {
      background: #f8f9fa;
    }

    .conversation-item.active {
      background: #e3f2fd;
      border-left: 3px solid #84cabe;
    }

    .conversation-avatar {
      width: 40px;
      height: 40px;
      background: #84cabe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-right: 12px;
    }

    .conversation-info {
      flex: 1;
    }

    .conversation-name {
      font-weight: 600;
      color: #113F67;
      margin-bottom: 4px;
    }

    .conversation-last-message {
      color: #666;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .conversation-time {
      color: #999;
      font-size: 0.8rem;
    }

    .conversation-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .unread-count {
      background: #e74c3c;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .role-badge {
      background: #84cabe;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 500;
    }

    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
      background: #f8f9fa;
    }

    .chat-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .chat-avatar {
      width: 40px;
      height: 40px;
      background: #84cabe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .chat-user-details h3 {
      margin: 0;
      color: #113F67;
      font-size: 1.1rem;
    }

    .user-role {
      color: #666;
      font-size: 0.9rem;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .message {
      max-width: 70%;
      margin-bottom: 10px;
    }

    .message.own-message {
      align-self: flex-end;
    }

    .message.other-message {
      align-self: flex-start;
    }

    .message-content {
      background: #f0f0f0;
      padding: 12px 16px;
      border-radius: 18px;
      position: relative;
    }

    .own-message .message-content {
      background: #84cabe;
      color: white;
    }

    .message-text {
      margin-bottom: 5px;
      line-height: 1.4;
    }

    .message-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      opacity: 0.7;
    }

    .message-input-container {
      padding: 15px 20px;
      border-top: 1px solid #eee;
      background: white;
    }

    .message-input-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      background: #f8f9fa;
      border-radius: 25px;
      padding: 8px;
    }

    .message-input {
      flex: 1;
      border: none;
      background: transparent;
      padding: 8px 12px;
      resize: none;
      font-family: inherit;
      font-size: 0.9rem;
      max-height: 100px;
    }

    .message-input:focus {
      outline: none;
    }

    .send-button {
      background: #84cabe;
      color: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .send-button:hover:not(:disabled) {
      background: #6bb5a8;
    }

    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      color: #666;
      font-style: italic;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: #84cabe;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
      }
      30% {
        transform: translateY(-10px);
      }
    }

    .no-conversation {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #666;
      text-align: center;
    }

    .no-conversation i {
      font-size: 4rem;
      color: #ddd;
      margin-bottom: 20px;
    }

    .notifications-panel {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .notifications-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .notifications-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .notification-item {
      display: flex;
      gap: 12px;
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      background: #84cabe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }

    .loading-spinner {
      font-size: 2rem;
      color: #84cabe;
    }

    @media (max-width: 768px) {
      .conversations-sidebar {
        width: 100%;
        position: absolute;
        z-index: 10;
        height: 100%;
      }
      
      .chat-area {
        width: 100%;
      }
    }
  `]
})
export class EnhancedMessagingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  private destroy$ = new Subject<void>();
  private typingSubject = new Subject<string>();
  private shouldScrollToBottom = false;

  // Data
  conversations: ConversationDTO[] = [];
  currentConversation: ConversationDTO | null = null;
  messages: MessageDTO[] = [];
  notifications: NotificationDTO[] = [];
  typingUsers: TypingIndicatorDTO[] = [];

  // UI State
  newMessageContent: string = '';
  isLoading: boolean = false;
  isConnected: boolean = false;
  showNotifications: boolean = false;
  searchQuery: string = '';
  searchResults: MessageDTO[] = [];
  isSearching: boolean = false;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 20;
  hasMoreMessages: boolean = true;

  constructor(
    private messagingService: EnhancedMessagingService,
    private websocketService: WebsocketService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupTypingDebounce();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private setupSubscriptions(): void {
    // Subscribe to conversations
    this.messagingService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
      });

    // Subscribe to messages
    this.messagingService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messagesMap => {
        if (this.currentConversation) {
          const conversationMessages = messagesMap[this.currentConversation.conversationId] || [];
          if (conversationMessages.length !== this.messages.length) {
            this.messages = conversationMessages;
            this.shouldScrollToBottom = true;
          }
        }
      });

    // Subscribe to notifications
    this.messagingService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });

    // Subscribe to WebSocket connection status
    this.websocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isConnected => {
        this.isConnected = isConnected;
      });

    // Subscribe to typing indicators
    this.websocketService.typingIndicators$
      .pipe(takeUntil(this.destroy$))
      .subscribe((typingUsers: any) => {
        this.typingUsers = typingUsers.filter((t: any) => 
          this.currentConversation && t.conversationId === this.currentConversation.conversationId
        );
      });
  }

  private setupTypingDebounce(): void {
    this.typingSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(content => {
        if (this.currentConversation) {
          const isTyping = content.length > 0;
          this.messagingService.sendTypingIndicator(this.currentConversation.conversationId, isTyping);
        }
      });
  }

  // Load conversations
  loadConversations(): void {
    this.isLoading = true;
    this.messagingService.loadConversations().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  // Select conversation
  selectConversation(conversation: ConversationDTO): void {
    this.currentConversation = conversation;
    this.currentPage = 0;
    this.hasMoreMessages = true;
    this.loadConversationHistory();
    this.shouldScrollToBottom = true;
  }

  // Select conversation from search result
  selectConversationFromMessage(message: MessageDTO): void {
    const conversation = this.conversations.find(c => c.conversationId === message.conversationId);
    if (conversation) {
      this.selectConversation(conversation);
      this.clearSearch();
    }
  }

  // Load conversation history
  loadConversationHistory(): void {
    if (!this.currentConversation) return;

    this.messagingService.loadConversationHistory(
      this.currentConversation.autreUtilisateurId,
      this.currentPage,
      this.pageSize
    ).subscribe(messages => {
      if (messages.length < this.pageSize) {
        this.hasMoreMessages = false;
      }
    });
  }

  // Load more messages (pagination)
  loadMoreMessages(): void {
    if (!this.hasMoreMessages || !this.currentConversation) return;

    this.currentPage++;
    this.loadConversationHistory();
  }

  // Send message
  sendMessage(): void {
    if (!this.newMessageContent.trim() || !this.currentConversation) return;

    const request: EnvoyerMessageRequest = {
      destinataireId: this.currentConversation.autreUtilisateurId,
      contenu: this.newMessageContent.trim(),
      type: MessageType.TEXT,
      conversationId: this.currentConversation.conversationId
    };

    this.messagingService.sendMessage(request).subscribe({
      next: () => {
        this.newMessageContent = '';
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
      }
    });
  }

  // Handle typing
  onTyping(): void {
    this.typingSubject.next(this.newMessageContent);
  }

  // Search messages
  searchMessages(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.messagingService.searchMessages(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
      }
    });
  }

  // Clear search
  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }

  // Toggle notifications panel
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  // Reconnect WebSocket
  reconnectWebSocket(): void {
    this.websocketService.forceReconnect();
  }

  // Utility methods
  private getCurrentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  // Format methods for template
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  formatDate(date: Date): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(messageDate);
    }
  }

  isMessageFromCurrentUser(message: MessageDTO): boolean {
    return message.expediteurId === this.getCurrentUserId();
  }

  getTypingUsersText(): string {
    if (this.typingUsers.length === 0) return '';
    if (this.typingUsers.length === 1) return `${this.typingUsers[0].username} est en train d'écrire...`;
    return `${this.typingUsers.length} personnes sont en train d'écrire...`;
  }

  trackMessage(index: number, message: MessageDTO): any {
    return message.id || index;
  }

  // Handle Enter key in message input
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}