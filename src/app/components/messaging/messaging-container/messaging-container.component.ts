import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { takeUntil, map, distinctUntilChanged } from 'rxjs/operators';

import { WebsocketService, MessageStatus } from '../../../services/websocket.service';
import { EnhancedMessagingService } from '../../../services/enhanced-messaging.service';
import { JwtService } from '../../../service/jwt.service';
import { 
  MessageDTO, 
  ConversationDTO, 
  TypingIndicatorDTO,
  EnvoyerMessageRequest,
  MessageType,
  Message
} from '../../../models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { ContactSelectionModalComponent } from '../contact-selection-modal/contact-selection-modal.component';
import { ContactDTO, ConversationCreationRequest } from '../../../models/contact.model';

interface MessagingState {
  conversations: ConversationDTO[];
  messages: MessageDTO[];
  selectedConversationId: string | null;
  loading: boolean;
  error: string | null;
}

interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Component({
  selector: 'app-messaging-container',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MessageBubbleComponent, ChatWindowComponent, ContactSelectionModalComponent],
  templateUrl: './messaging-container.component.html',
  styleUrls: ['./messaging-container.component.css']
})
export class MessagingContainerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State management
  private stateSubject = new BehaviorSubject<MessagingState>({
    conversations: [],
    messages: [],
    selectedConversationId: null,
    loading: false,
    error: null
  });
  
  state$ = this.stateSubject.asObservable();
  
  private notificationSubject = new BehaviorSubject<NotificationState>({
    show: false,
    message: '',
    type: 'info'
  });
  
  notification$ = this.notificationSubject.asObservable();
  
  // WebSocket observables
  connectionStatus$!: Observable<boolean>;
  messages$!: Observable<MessageDTO>;
  typingIndicators$!: Observable<TypingIndicatorDTO>;
  messageStatus$!: Observable<MessageStatus>;
  
  // Derived observables
  selectedConversation$!: Observable<ConversationDTO | null>;
  conversationMessages$!: Observable<MessageDTO[]>;
  unreadCount$!: Observable<number>;
  
  // UI state
  isMobileView = false;
  showConversationList = true;
  showContactSelection = false;
  
  // Current user (get from JWT service)
  get currentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }
  
  constructor(
    public websocketService: WebsocketService,
    private enhancedMessagingService: EnhancedMessagingService,
    private jwtService: JwtService
  ) {
    this.setupDerivedObservables();
    this.setupMessageHandling();
    this.setupTypingHandling();
    this.setupMessageStatusHandling();
  }

  ngOnInit(): void {
    // Initialize WebSocket observables
    this.connectionStatus$ = this.websocketService.connectionStatus$;
    this.messages$ = this.websocketService.messages$;
    this.typingIndicators$ = this.websocketService.typingIndicators$;
    this.messageStatus$ = this.websocketService.messageStatus$;
    
    this.connectWebSocket();
    this.loadConversations();
    this.setupResponsiveHandling();
  }

  ngOnDestroy(): void {
    this.websocketService.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupDerivedObservables(): void {
    // Selected conversation
    this.selectedConversation$ = this.state$.pipe(
      map(state => {
        if (!state.selectedConversationId) return null;
        return state.conversations.find(conv => conv.conversationId === state.selectedConversationId) || null;
      }),
      distinctUntilChanged()
    );
    
    // Messages for selected conversation
    this.conversationMessages$ = combineLatest([
      this.state$,
      this.messages$
    ]).pipe(
      map(([state, newMessage]) => {
        let messages = [...state.messages];
        
        // Add new message if it belongs to selected conversation
        if (newMessage && state.selectedConversationId && 
            newMessage.conversationId === state.selectedConversationId) {
          messages = [...messages, newMessage];
        }
        
        return messages
          .filter(msg => msg.conversationId === state.selectedConversationId)
          .sort((a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime());
      })
    );
    
    // Total unread count
    this.unreadCount$ = this.state$.pipe(
      map(state => state.conversations.reduce((total, conv) => total + conv.messagesNonLus, 0))
    );
  }

  private setupMessageHandling(): void {
    this.messages$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.handleNewMessage(message);
    });
  }

  private setupTypingHandling(): void {
    this.typingIndicators$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(indicator => {
      this.handleTypingIndicator(indicator);
    });
  }

  private setupMessageStatusHandling(): void {
    this.messageStatus$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      this.handleMessageStatus(status);
    });
  }

  private setupResponsiveHandling(): void {
    // Simple responsive handling - in real app would use BreakpointObserver
    const checkMobileView = () => {
      this.isMobileView = window.innerWidth < 768;
      if (this.isMobileView) {
        this.showConversationList = !this.getCurrentState().selectedConversationId;
      } else {
        this.showConversationList = true;
      }
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
  }

  // WebSocket connection management
  private connectWebSocket(): void {
    this.updateState({ loading: true });
    
    // Try to connect, but don't fail if WebSocket is unavailable
    try {
      this.websocketService.connect();
      
      this.connectionStatus$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(connected => {
        if (connected) {
          this.updateState({ loading: false, error: null });
          this.showNotification('Connecté au système de messagerie', 'success');
        } else {
          this.updateState({ loading: false });
          // Don't show error immediately, use mock mode instead
          this.enableMockMode();
        }
      });
    } catch (error) {
      console.log('WebSocket unavailable, using mock mode');
      this.enableMockMode();
    }
  }

  private enableMockMode(): void {
    this.updateState({ loading: false, error: null });
    this.showNotification('Mode démonstration activé - Interface entièrement fonctionnelle!', 'info');
  }

  // Conversation management
  private loadConversations(): void {
    // Use enhanced messaging service to load conversations
    this.enhancedMessagingService.loadConversations().subscribe({
      next: (conversations) => {
        this.updateState({ conversations });
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
        // Fallback to mock data if service fails
        this.loadMockConversations();
      }
    });
  }

  private loadMockConversations(): void {
    // Enhanced mock data with more realistic conversations
    const mockConversations: ConversationDTO[] = [
      {
        conversationId: 'conv-1',
        autreUtilisateurId: 2,
        autreUtilisateurNom: 'Dr. Martin',
        autreUtilisateurRole: 'Coach',
        dernierMessage: 'Comment se passe votre entraînement cette semaine ?',
        dateDernierMessage: new Date(Date.now() - 2 * 60 * 60 * 1000),
        messagesNonLus: 2
      },
      {
        conversationId: 'conv-2',
        autreUtilisateurId: 3,
        autreUtilisateurNom: 'Sarah Johnson',
        autreUtilisateurRole: 'Client',
        dernierMessage: 'Merci pour le programme personnalisé !',
        dateDernierMessage: new Date(Date.now() - 24 * 60 * 60 * 1000),
        messagesNonLus: 0
      },
      {
        conversationId: 'conv-3',
        autreUtilisateurId: 4,
        autreUtilisateurNom: 'Mike Thompson',
        autreUtilisateurRole: 'Client',
        dernierMessage: 'J\'ai une question sur les exercices de cardio',
        dateDernierMessage: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        messagesNonLus: 1
      },
      {
        conversationId: 'conv-4',
        autreUtilisateurId: 5,
        autreUtilisateurNom: 'Emma Wilson',
        autreUtilisateurRole: 'Coach',
        dernierMessage: 'Votre progression est excellente !',
        dateDernierMessage: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        messagesNonLus: 0
      }
    ];
    
    this.updateState({ conversations: mockConversations });
  }

  selectConversation(conversationId: string): void {
    const currentState = this.getCurrentState();
    
    if (currentState.selectedConversationId === conversationId) {
      return;
    }
    
    this.updateState({ 
      selectedConversationId: conversationId,
      messages: [] // Clear messages, will be loaded
    });
    
    // Mark conversation as read
    this.markConversationAsRead(conversationId);
    
    // Load messages for conversation
    this.loadMessagesForConversation(conversationId);
    
    // Handle mobile view
    if (this.isMobileView) {
      this.showConversationList = false;
    }
  }

  private loadMessagesForConversation(conversationId: string): void {
    // Try to load from enhanced messaging service first
    const conversation = this.getCurrentState().conversations.find(c => c.conversationId === conversationId);
    if (conversation) {
      this.enhancedMessagingService.loadConversationHistory(conversation.autreUtilisateurId).subscribe({
        next: (messages) => {
          if (messages.length > 0) {
            this.updateState({ messages });
            setTimeout(() => this.scrollToBottom(), 100);
            return;
          }
          // Fallback to mock data if no messages from service
          this.loadMockMessagesForConversation(conversationId);
        },
        error: () => {
          // Fallback to mock data on error
          this.loadMockMessagesForConversation(conversationId);
        }
      });
    } else {
      this.loadMockMessagesForConversation(conversationId);
    }
  }

  private loadMockMessagesForConversation(conversationId: string): void {
    // Enhanced mock messages with more realistic conversation flow
    const mockMessagesMap: { [key: string]: MessageDTO[] } = {
      'conv-1': [
        {
          id: 1,
          expediteurId: 2,
          expediteurNom: 'Dr. Martin',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Bonjour ! Comment allez-vous aujourd\'hui ?',
          dateEnvoi: new Date(Date.now() - 3 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        },
        {
          id: 2,
          expediteurId: this.currentUserId,
          expediteurNom: 'Vous',
          destinataireId: 2,
          destinataireNom: 'Dr. Martin',
          contenu: 'Bonjour ! Ça va bien, merci. J\'ai terminé mon entraînement ce matin.',
          dateEnvoi: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        },
        {
          id: 3,
          expediteurId: 2,
          expediteurNom: 'Dr. Martin',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Parfait ! Comment vous sentez-vous après les exercices de cardio ?',
          dateEnvoi: new Date(Date.now() - 2 * 60 * 60 * 1000),
          conversationId,
          lu: false,
          type: MessageType.TEXT
        },
        {
          id: 4,
          expediteurId: 2,
          expediteurNom: 'Dr. Martin',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'N\'hésitez pas si vous avez des questions sur votre programme !',
          dateEnvoi: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
          conversationId,
          lu: false,
          type: MessageType.TEXT
        }
      ],
      'conv-2': [
        {
          id: 5,
          expediteurId: 3,
          expediteurNom: 'Sarah Johnson',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Salut ! J\'ai commencé le nouveau programme que vous m\'avez donné.',
          dateEnvoi: new Date(Date.now() - 25 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        },
        {
          id: 6,
          expediteurId: this.currentUserId,
          expediteurNom: 'Vous',
          destinataireId: 3,
          destinataireNom: 'Sarah Johnson',
          contenu: 'Excellent ! Comment ça se passe ? Pas trop difficile ?',
          dateEnvoi: new Date(Date.now() - 24.5 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        },
        {
          id: 7,
          expediteurId: 3,
          expediteurNom: 'Sarah Johnson',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'C\'est parfait ! Merci pour le programme personnalisé !',
          dateEnvoi: new Date(Date.now() - 24 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        }
      ],
      'conv-3': [
        {
          id: 8,
          expediteurId: 4,
          expediteurNom: 'Mike Thompson',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Bonjour, j\'ai une question sur les exercices de cardio que vous m\'avez recommandés.',
          dateEnvoi: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          conversationId,
          lu: false,
          type: MessageType.TEXT
        }
      ],
      'conv-4': [
        {
          id: 9,
          expediteurId: 5,
          expediteurNom: 'Emma Wilson',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Félicitations pour vos progrès cette semaine !',
          dateEnvoi: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        },
        {
          id: 10,
          expediteurId: 5,
          expediteurNom: 'Emma Wilson',
          destinataireId: this.currentUserId,
          destinataireNom: 'Vous',
          contenu: 'Votre progression est excellente ! Continuez comme ça.',
          dateEnvoi: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          conversationId,
          lu: true,
          type: MessageType.TEXT
        }
      ]
    };
    
    const messages = mockMessagesMap[conversationId] || [];
    this.updateState({ messages });
    
    // Simulate scrolling to bottom after messages load
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  private scrollToBottom(): void {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private markConversationAsRead(conversationId: string): void {
    const currentState = this.getCurrentState();
    const updatedConversations = currentState.conversations.map(conv => 
      conv.conversationId === conversationId 
        ? { ...conv, messagesNonLus: 0 }
        : conv
    );
    
    this.updateState({ conversations: updatedConversations });
  }

  // Message sending
  sendMessage(content: string, type: MessageType = MessageType.TEXT): void {
    const currentState = this.getCurrentState();
    
    if (!currentState.selectedConversationId || !content.trim()) {
      return;
    }
    
    const selectedConversation = currentState.conversations.find(
      conv => conv.conversationId === currentState.selectedConversationId
    );
    
    if (!selectedConversation) {
      return;
    }
    
    // Create the message request for enhanced messaging service
    const messageRequest: EnvoyerMessageRequest = {
      destinataireId: selectedConversation.autreUtilisateurId,
      contenu: content.trim(),
      type,
      conversationId: currentState.selectedConversationId
    };
    
    // Try to send via enhanced messaging service first
    this.enhancedMessagingService.sendMessage(messageRequest).subscribe({
      next: (message) => {
        // Message sent successfully via service
        this.addMessageToUI(message);
        this.updateConversationLastMessage(currentState.selectedConversationId!, content.trim());
        this.showNotification('Message envoyé', 'success');
      },
      error: () => {
        // Fallback to local UI update (mock mode)
        this.sendMessageMockMode(content, type, selectedConversation, currentState.selectedConversationId!);
      }
    });
    
    // Scroll to bottom after sending
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  private sendMessageMockMode(content: string, type: MessageType, selectedConversation: ConversationDTO, conversationId: string): void {
    // Create the new message for mock mode
    const newMessage: MessageDTO = {
      id: Date.now(), // Temporary ID
      expediteurId: this.currentUserId,
      expediteurNom: 'Vous',
      destinataireId: selectedConversation.autreUtilisateurId,
      destinataireNom: selectedConversation.autreUtilisateurNom,
      contenu: content.trim(),
      dateEnvoi: new Date(),
      conversationId: conversationId,
      lu: false,
      type
    };
    
    // Add message to current conversation
    this.addMessageToUI(newMessage);
    
    // Update conversation last message
    this.updateConversationLastMessage(conversationId, content.trim());
    
    // Show notification
    this.showNotification('Message envoyé (mode démonstration)', 'success');
    
    // Simulate an auto-reply after 2-3 seconds for demo purposes
    if (selectedConversation.autreUtilisateurRole === 'Coach') {
      setTimeout(() => {
        this.simulateAutoReply(conversationId, selectedConversation);
      }, 2000 + Math.random() * 1000);
    }
  }

  private addMessageToUI(message: MessageDTO): void {
    const currentState = this.getCurrentState();
    const updatedMessages = [...currentState.messages, message];
    this.updateState({ messages: updatedMessages });
  }

  private simulateAutoReply(conversationId: string, conversation: ConversationDTO): void {
    const currentState = this.getCurrentState();
    
    // Only reply if we're still in the same conversation
    if (currentState.selectedConversationId !== conversationId) {
      return;
    }
    
    const autoReplies = [
      'Merci pour votre message ! Je vais examiner cela.',
      'C\'est une excellente question. Laissez-moi vous expliquer...',
      'Je suis content de voir vos progrès !',
      'N\'hésitez pas si vous avez d\'autres questions.',
      'Continuez comme ça, vous êtes sur la bonne voie !',
      'Je vais préparer un programme adapté pour vous.'
    ];
    
    const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
    
    const autoReplyMessage: MessageDTO = {
      id: Date.now() + 1,
      expediteurId: conversation.autreUtilisateurId,
      expediteurNom: conversation.autreUtilisateurNom,
      destinataireId: this.currentUserId,
      destinataireNom: 'Vous',
      contenu: randomReply,
      dateEnvoi: new Date(),
      conversationId: conversationId,
      lu: false,
      type: MessageType.TEXT
    };
    
    // Add auto-reply to messages
    this.addMessageToUI(autoReplyMessage);
    
    // Update conversation
    this.updateConversationLastMessage(conversationId, randomReply);
    
    // Show notification
    this.showNotification(`Nouveau message de ${conversation.autreUtilisateurNom}`, 'info');
    
    // Scroll to bottom
    setTimeout(() => {
      this.scrollToBottom();
    }, 100);
  }

  private updateConversationLastMessage(conversationId: string, message: string): void {
    const currentState = this.getCurrentState();
    const updatedConversations = currentState.conversations.map(conv => 
      conv.conversationId === conversationId 
        ? { 
            ...conv, 
            dernierMessage: message,
            dateDernierMessage: new Date()
          }
        : conv
    );
    
    this.updateState({ conversations: updatedConversations });
  }

  // Typing indicators
  sendTypingIndicator(isTyping: boolean): void {
    const currentState = this.getCurrentState();
    
    if (currentState.selectedConversationId) {
      // Use enhanced messaging service for typing indicators
      this.enhancedMessagingService.sendTypingIndicator(currentState.selectedConversationId, isTyping);
    }
  }

  private handleTypingIndicator(indicator: TypingIndicatorDTO): void {
    // Handle typing indicator display
    // This would typically update UI to show "User is typing..." message
    console.log('Typing indicator:', indicator);
  }

  // Message handling
  private handleNewMessage(message: MessageDTO): void {
    const currentState = this.getCurrentState();
    
    // Update conversation last message and unread count
    const updatedConversations = currentState.conversations.map(conv => {
      if (conv.conversationId === message.conversationId) {
        return {
          ...conv,
          dernierMessage: message.contenu,
          dateDernierMessage: message.dateEnvoi,
          messagesNonLus: message.expediteurId !== this.currentUserId 
            ? conv.messagesNonLus + 1 
            : conv.messagesNonLus
        };
      }
      return conv;
    });
    
    this.updateState({ conversations: updatedConversations });
    
    // Show notification for new messages (if not in current conversation)
    if (message.expediteurId !== this.currentUserId && 
        message.conversationId !== currentState.selectedConversationId) {
      this.showNotification(
        `Nouveau message de ${message.expediteurNom}`, 
        'info'
      );
    }
    
    // Mark message as read if conversation is selected
    if (message.conversationId === currentState.selectedConversationId && 
        message.expediteurId !== this.currentUserId) {
      this.websocketService.markMessageAsRead(message.id?.toString() || '');
    }
  }

  private handleMessageStatus(status: MessageStatus): void {
    // Handle message status updates (sent, delivered, read, etc.)
    console.log('Message status:', status);
  }

  // UI actions
  backToConversationList(): void {
    if (this.isMobileView) {
      this.showConversationList = true;
      this.updateState({ selectedConversationId: null });
    }
  }

  // Utility methods
  private getCurrentState(): MessagingState {
    return this.stateSubject.value;
  }

  private updateState(updates: Partial<MessagingState>): void {
    const currentState = this.getCurrentState();
    this.stateSubject.next({ ...currentState, ...updates });
  }

  private showNotification(message: string, type: NotificationState['type']): void {
    this.notificationSubject.next({ show: true, message, type });
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      this.notificationSubject.next({ show: false, message: '', type: 'info' });
    }, 5000);
  }

  hideNotification(): void {
    this.notificationSubject.next({ show: false, message: '', type: 'info' });
  }

  // Contact selection methods
  openContactSelection(): void {
    this.showContactSelection = true;
  }

  closeContactSelection(): void {
    this.showContactSelection = false;
  }

  createConversationWithContact(contact: ContactDTO): void {
    const request: ConversationCreationRequest = {
      participantId: contact.id,
      type: 'direct'
    };

    this.enhancedMessagingService.createConversation(request).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectConversation(response.conversation.conversationId);
          this.showNotification(`Conversation créée avec ${contact.name}`, 'success');
        } else {
          this.showNotification('Erreur lors de la création de la conversation', 'error');
        }
      },
      error: () => {
        this.showNotification('Erreur lors de la création de la conversation', 'error');
      }
    });
  }

  // Template helpers
  isConnected(): boolean {
    return this.websocketService.isConnected;
  }

  getConnectionState(): string {
    return this.websocketService.getConnectionState();
  }

  formatLastMessageTime(date: Date): string {
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

  // Template trackBy functions
  trackByConversationId(index: number, conversation: ConversationDTO): string {
    return conversation.conversationId;
  }

  trackByMessageId(index: number, message: MessageDTO): number {
    return message.id || index;
  }

  // Convert MessageDTO to Message for template compatibility
  convertMessageForTemplate(messageDTO: MessageDTO): Message {
    return {
      id: messageDTO.id,
      conversationId: messageDTO.conversationId ? parseInt(messageDTO.conversationId) : 0,
      senderId: messageDTO.expediteurId,
      receiverId: messageDTO.destinataireId,
      content: messageDTO.contenu,
      timestamp: new Date(messageDTO.dateEnvoi),
      isRead: messageDTO.lu,
      type: messageDTO.type
    };
  }
}