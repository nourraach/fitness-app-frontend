import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RealMessageService } from '../services/real-message.service';
import { WebsocketService } from '../services/websocket.service';
import { JwtService } from '../service/jwt.service';
import { 
  ConversationDTO, 
  MessageDTO, 
  EnvoyerMessageRequest, 
  MessageType 
} from '../models/message.model';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messaging-page">
      <div class="page-header">
        <h1>
          <i class="pi pi-comments"></i>
          Messagerie
        </h1>
        <p>Communiquez avec votre coach ou vos clients en temps réel</p>
        <div class="connection-status" [class.connected]="isConnected" [class.disconnected]="!isConnected">
          <i class="pi" [class.pi-wifi]="isConnected" [class.pi-times-circle]="!isConnected"></i>
          <span>{{ isConnected ? 'Connecté' : 'Déconnecté' }}</span>
        </div>
      </div>
      
      <div class="messaging-container">
        <!-- Liste des conversations -->
        <div class="conversations-panel">
          <div class="panel-header">
            <h2>Messages</h2>
            <span class="unread-total" *ngIf="getTotalUnread() > 0">{{ getTotalUnread() }}</span>
            <button class="refresh-btn" (click)="refreshData()" title="Actualiser">
              <i class="pi pi-refresh"></i>
            </button>
          </div>
          
          <div class="conversations-list">
            <div 
              *ngFor="let conv of conversations"
              class="conversation-item"
              [class.selected]="selectedConversation?.conversationId === conv.conversationId"
              [class.unread]="(conv.messagesNonLus || conv.unreadMessageCount || 0) > 0"
              (click)="selectConversation(conv)">
              
              <div class="conversation-avatar">
                {{ getInitials(conv.autreUtilisateurNom || conv.participantName || conv.userName || 'U') }}
                <div class="role-badge" [class.coach]="conv.autreUtilisateurRole === 'Coach'">
                  {{ conv.autreUtilisateurRole === 'Coach' ? '👨‍⚕️' : '👤' }}
                </div>
              </div>
              
              <div class="conversation-info">
                <div class="conversation-header">
                  <h3>{{ conv.autreUtilisateurNom || conv.participantName || conv.userName }}</h3>
                  <span class="time">{{ formatTime(conv.dateDernierMessage || conv.lastMessageAt) }}</span>
                </div>
                <div class="last-message">
                  <p>{{ conv.dernierMessage || conv.lastMessageContent }}</p>
                  <span class="unread-count" *ngIf="(conv.messagesNonLus || conv.unreadMessageCount || 0) > 0">{{ conv.messagesNonLus || conv.unreadMessageCount }}</span>
                </div>
              </div>
            </div>
            
            <!-- Loading state -->
            <div *ngIf="isLoading" class="loading-conversations">
              <i class="pi pi-spinner pi-spin"></i>
              <p>Chargement des conversations...</p>
            </div>
            
            <!-- Empty state -->
            <div *ngIf="!isLoading && conversations.length === 0" class="empty-conversations">
              <i class="pi pi-comments" style="font-size: 3rem; color: #ccc;"></i>
              <h3>Aucune conversation</h3>
              <p>Vos conversations apparaîtront ici.</p>
            </div>
          </div>
        </div>

        <!-- Zone de chat -->
        <div class="chat-panel">
          <div *ngIf="!selectedConversation" class="no-conversation">
            <i class="pi pi-comments" style="font-size: 4rem; color: #ccc;"></i>
            <h3>Sélectionnez une conversation</h3>
            <p>Choisissez une conversation pour commencer à discuter</p>
          </div>

          <div *ngIf="selectedConversation" class="chat-active">
            <!-- En-tête du chat -->
            <div class="chat-header">
              <div class="chat-user-info">
                <div class="chat-avatar">{{ getInitials(selectedConversation.autreUtilisateurNom || selectedConversation.participantName || selectedConversation.userName || 'U') }}</div>
                <div>
                  <h3>{{ selectedConversation.autreUtilisateurNom || selectedConversation.participantName || selectedConversation.userName }}</h3>
                  <span class="user-role">{{ selectedConversation.autreUtilisateurRole }}</span>
                </div>
              </div>
              <div class="chat-actions">
                <button class="action-btn" (click)="refreshMessages()" title="Actualiser les messages">
                  <i class="pi pi-refresh"></i>
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div class="messages-area" #messagesContainer>
              <div *ngIf="isLoadingMessages" class="loading-messages">
                <i class="pi pi-spinner pi-spin"></i>
                <p>Chargement des messages...</p>
              </div>
              
              <div 
                *ngFor="let message of getMessagesForConversation(selectedConversation.conversationId || '')"
                class="message-wrapper"
                [class.own-message]="message.senderId === currentUserId">
                
                <div class="message-bubble" [class.own]="message.senderId === currentUserId">
                  <p>{{ message.content }}</p>
                  <div class="message-meta">
                    <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                    <span *ngIf="message.senderId === currentUserId" class="message-status">
                      <i class="pi pi-check" [class.read]="message.isRead"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Zone de saisie -->
            <div class="message-input-area">
              <div class="input-wrapper">
                <input 
                  type="text" 
                  [(ngModel)]="newMessage"
                  (keydown.enter)="sendMessage()"
                  [disabled]="isSending || !isConnected"
                  placeholder="Tapez votre message..."
                  class="message-input">
                <button 
                  (click)="sendMessage()"
                  [disabled]="!newMessage.trim() || isSending || !isConnected"
                  class="send-button">
                  <i class="pi" [class.pi-send]="!isSending" [class.pi-spinner]="isSending" [class.pi-spin]="isSending"></i>
                </button>
              </div>
              <div *ngIf="!isConnected" class="offline-warning">
                <i class="pi pi-exclamation-triangle"></i>
                <span>Connexion perdue. Reconnexion en cours...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .messaging-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }
    
    .page-header {
      padding: 1rem 2rem;
      background: white;
      border-bottom: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .page-header h1 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .page-header p {
      margin: 0;
      color: #6c757d;
      font-size: 0.9rem;
    }
    
    .connection-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.5rem;
    }
    
    .connection-status.connected {
      background: #d4edda;
      color: #155724;
    }
    
    .connection-status.disconnected {
      background: #f8d7da;
      color: #721c24;
    }
    
    .messaging-container {
      flex: 1;
      display: flex;
      overflow: hidden;
    }
    
    .conversations-panel {
      width: 350px;
      background: white;
      border-right: 1px solid #e9ecef;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-header h2 {
      margin: 0;
      font-size: 1.2rem;
      color: #2c3e50;
    }
    
    .unread-total {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 0.25rem 0.5rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    
    .refresh-btn {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .refresh-btn:hover {
      background: #f8f9fa;
      color: #007bff;
    }
    
    .conversations-list {
      flex: 1;
      overflow-y: auto;
    }
    
    .conversation-item {
      display: flex;
      padding: 1rem;
      cursor: pointer;
      border-bottom: 1px solid #f1f3f4;
      transition: background-color 0.2s ease;
      position: relative;
    }
    
    .conversation-item:hover {
      background: #f8f9fa;
    }
    
    .conversation-item.selected {
      background: #e3f2fd;
      border-left: 3px solid #2196f3;
    }
    
    .conversation-item.unread {
      background: #fff3cd;
    }
    
    .conversation-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.2rem;
      margin-right: 1rem;
      position: relative;
    }
    
    .role-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #28a745;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      border: 2px solid white;
    }
    
    .conversation-info {
      flex: 1;
      min-width: 0;
    }
    
    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    
    .conversation-header h3 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #333;
    }
    
    .time {
      font-size: 0.75rem;
      color: #666;
    }
    
    .last-message {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .last-message p {
      margin: 0;
      font-size: 0.8rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    
    .unread-count {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 0.125rem 0.375rem;
      font-size: 0.7rem;
      font-weight: 600;
      margin-left: 0.5rem;
    }
    
    .loading-conversations, .loading-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #6c757d;
    }
    
    .loading-conversations i, .loading-messages i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #007bff;
    }
    
    .empty-conversations {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      color: #6c757d;
      text-align: center;
    }
    
    .empty-conversations h3 {
      margin: 1rem 0 0.5rem 0;
      color: #333;
    }
    
    .chat-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: white;
    }
    
    .no-conversation {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #666;
    }
    
    .no-conversation h3 {
      margin: 1rem 0 0.5rem 0;
      color: #333;
    }
    
    .chat-active {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .chat-header {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-user-info {
      display: flex;
      align-items: center;
    }
    
    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      margin-right: 1rem;
    }
    
    .chat-user-info h3 {
      margin: 0;
      font-size: 1rem;
      color: #333;
    }
    
    .user-role {
      font-size: 0.8rem;
      color: #666;
    }
    
    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .action-btn {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .action-btn:hover {
      background: #e9ecef;
      color: #007bff;
    }
    
    .messages-area {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      background: #f8f9fa;
    }
    
    .message-wrapper {
      margin-bottom: 1rem;
    }
    
    .message-wrapper.own-message {
      display: flex;
      justify-content: flex-end;
    }
    
    .message-bubble {
      max-width: 70%;
      padding: 0.75rem 1rem;
      border-radius: 18px;
      position: relative;
    }
    
    .message-bubble:not(.own) {
      background: white;
      color: #333;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    
    .message-bubble.own {
      background: #007bff;
      color: white;
      border-bottom-right-radius: 4px;
    }
    
    .message-bubble p {
      margin: 0 0 0.25rem 0;
      line-height: 1.4;
    }
    
    .message-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.25rem;
    }
    
    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
    }
    
    .message-status {
      margin-left: 0.5rem;
    }
    
    .message-status .pi-check {
      font-size: 0.7rem;
    }
    
    .message-status .pi-check.read {
      color: #28a745;
    }
    
    .message-input-area {
      padding: 1rem;
      border-top: 1px solid #e9ecef;
      background: white;
    }
    
    .input-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #ddd;
      border-radius: 25px;
      outline: none;
      font-size: 0.9rem;
    }
    
    .message-input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }
    
    .message-input:disabled {
      background: #f8f9fa;
      color: #6c757d;
    }
    
    .send-button {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: #007bff;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .send-button:hover:not(:disabled) {
      background: #0056b3;
      transform: scale(1.05);
    }
    
    .send-button:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    
    .offline-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem;
      background: #fff3cd;
      color: #856404;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    @media (max-width: 768px) {
      .conversations-panel {
        width: 100%;
        position: absolute;
        z-index: 10;
      }
      
      .chat-panel {
        width: 100%;
      }
    }
  `]
})
export class MessagingComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  conversations: ConversationDTO[] = [];
  selectedConversation: ConversationDTO | null = null;
  newMessage: string = '';
  
  isLoading: boolean = true;
  isLoadingMessages: boolean = false;
  isSending: boolean = false;
  isConnected: boolean = false;
  
  currentUserId: number = 1;

  constructor(
    private messageService: RealMessageService,
    private websocketService: WebsocketService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.jwtService.getUserId() || 1;
    this.loadData();
    this.setupWebSocketConnection();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;
    
    this.messageService.loadConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des conversations:', error);
          this.isLoading = false;
        }
      });
  }

  private setupWebSocketConnection(): void {
    // Monitor WebSocket connection status
    this.websocketService.connectionStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.isConnected = connected;
      });

    // Listen for new messages via WebSocket
    this.websocketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        this.handleNewMessage(message);
      });

    // Connect to WebSocket
    this.websocketService.connect();
  }

  private setupSubscriptions(): void {
    // Subscribe to conversations updates
    this.messageService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
      });
  }

  private handleNewMessage(message: MessageDTO): void {
    // Update conversation last message
    const conversation = this.conversations.find(conv => 
      conv.conversationId === message.conversationId
    );
    
    if (conversation) {
      conversation.dernierMessage = message.content;
      conversation.lastMessageContent = message.content;
      conversation.dateDernierMessage = new Date(message.timestamp);
      conversation.lastMessageAt = message.timestamp;
      
      // Increment unread count if not from current user and not in current conversation
      if (message.senderId !== this.currentUserId && 
          (!this.selectedConversation || this.selectedConversation.conversationId !== message.conversationId)) {
        conversation.messagesNonLus = (conversation.messagesNonLus || 0) + 1;
        conversation.unreadMessageCount = (conversation.unreadMessageCount || 0) + 1;
      }
    }
  }

  selectConversation(conversation: ConversationDTO): void {
    if (this.selectedConversation?.conversationId === conversation.conversationId) {
      return;
    }

    this.selectedConversation = conversation;
    this.isLoadingMessages = true;

    const convId = conversation.conversationId || '';
    
    // Mark messages as read
    if (convId) {
      this.messageService.markMessagesAsRead(convId).subscribe();

      // Load messages for this conversation
      this.messageService.loadMessagesForConversation(convId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isLoadingMessages = false;
            // Scroll to bottom after messages load
            setTimeout(() => this.scrollToBottom(), 100);
          },
          error: (error) => {
            console.error('Erreur lors du chargement des messages:', error);
            this.isLoadingMessages = false;
          }
        });
    } else {
      this.isLoadingMessages = false;
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.isSending) {
      return;
    }

    this.isSending = true;
    
    const destinataireId = this.selectedConversation.autreUtilisateurId || 
                           this.selectedConversation.coachId || 
                           this.selectedConversation.userId || 0;
    
    const request: EnvoyerMessageRequest = {
      destinataireId: destinataireId,
      contenu: this.newMessage.trim(),
      type: MessageType.TEXT,
      conversationId: this.selectedConversation.conversationId
    };

    this.messageService.sendMessage(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.newMessage = '';
          this.isSending = false;
          
          // Scroll to bottom after sending
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Erreur lors de l\'envoi du message:', error);
          this.isSending = false;
          
          // Show error message to user
          alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
        }
      });
  }

  getMessagesForConversation(conversationId: string): MessageDTO[] {
    return this.messageService.getMessagesForConversation(conversationId);
  }

  getTotalUnread(): number {
    return this.conversations.reduce((total, conv) => total + (conv.messagesNonLus || conv.unreadMessageCount || 0), 0);
  }

  getInitials(name: string | undefined | null): string {
    if (!name) return 'U';
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  formatTime(date: Date | string | undefined | null): string {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}min`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return messageDate.toLocaleDateString('fr-FR');
    }
  }

  formatMessageTime(date: Date | string | undefined | null): string {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  refreshData(): void {
    this.messageService.refreshAllData();
  }

  refreshMessages(): void {
    if (this.selectedConversation) {
      this.isLoadingMessages = true;
      const convId = this.selectedConversation.conversationId || '';
      if (convId) {
        this.messageService.loadMessagesForConversation(convId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.isLoadingMessages = false;
            },
            error: (error) => {
              console.error('Erreur lors de l\'actualisation des messages:', error);
              this.isLoadingMessages = false;
            }
          });
      } else {
        this.isLoadingMessages = false;
      }
    }
  }

  private scrollToBottom(): void {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = messagesArea.scrollHeight;
    }
  }
}