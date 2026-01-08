import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Message, MessageType } from '../../../models/message.model';
import { Conversation } from '../../../models/conversation.model';
import { MessageService } from '../../../services/message.service';
import { WebsocketService } from '../../../services/websocket.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MessageBubbleComponent],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() conversation: Conversation | null = null;
  @Input() conversationId: string | null = null;
  @Input() currentUserId: number = 0;
  @Input() disabled: boolean = false;
  @Output() messagesSent = new EventEmitter<Message>();
  @Output() messageSent = new EventEmitter<{content: string, type: MessageType}>();
  @Output() typingStatusChanged = new EventEmitter<boolean>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: Message[] = [];
  newMessage: string = '';
  isLoading: boolean = false;
  isTyping: boolean = false;
  otherUserTyping: boolean = false;
  
  private subscriptions: Subscription[] = [];
  private typingTimer: any;
  private shouldScrollToBottom: boolean = true;

  constructor(
    private messageService: MessageService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.setupWebSocketListeners();
    this.loadMessages();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.stopTyping();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private setupWebSocketListeners(): void {
    if (!this.conversation?.id) return;

    // Listen for new messages
    const messagesSub = this.websocketService.onMessage().subscribe(
      (messageDTO: any) => {
        // Convert MessageDTO to Message
        const message: Message = this.convertMessageDTOToMessage(messageDTO);
        if (message.conversationId === this.conversation?.id) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
          this.markMessageAsRead(message);
        }
      }
    );
    this.subscriptions.push(messagesSub);

    // Listen for typing indicators
    const typingSub = this.websocketService.onTyping().subscribe(
      (data: any) => {
        if (data.conversationId === this.conversation?.id?.toString() && data.userId !== this.currentUserId) {
          this.otherUserTyping = data.isTyping;
        }
      }
    );
    this.subscriptions.push(typingSub);

    // Listen for message status updates
    const statusSub = this.websocketService.onMessageStatus().subscribe(
      (data: any) => {
        const message = this.messages.find(m => m.id?.toString() === data.messageId);
        if (message) {
          message.isRead = data.status === 'read';
        }
      }
    );
    this.subscriptions.push(statusSub);
  }

  private convertMessageDTOToMessage(dto: any): Message {
    return {
      id: dto.id,
      conversationId: dto.conversationId ? parseInt(dto.conversationId) : 0,
      senderId: dto.expediteurId || dto.senderId,
      receiverId: dto.destinataireId || dto.receiverId,
      content: dto.contenu || dto.content,
      timestamp: new Date(dto.dateEnvoi || dto.timestamp),
      isRead: dto.lu || dto.isRead || false,
      type: dto.type || MessageType.TEXT
    };
  }

  private loadMessages(): void {
    if (!this.conversation?.id) return;

    this.isLoading = true;
    const messagesSub = this.messageService.getMessages(this.conversation.id).subscribe({
      next: (messageDTOs) => {
        this.messages = messageDTOs.map(dto => this.convertMessageDTOToMessage(dto));
        this.isLoading = false;
        this.shouldScrollToBottom = true;
        this.markAllMessagesAsRead();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(messagesSub);
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.conversation?.id || this.disabled) return;

    const messageContent = this.newMessage.trim();
    this.newMessage = '';
    this.stopTyping();

    // Emit the message content and type
    this.messageSent.emit({
      content: messageContent,
      type: MessageType.TEXT
    });

    const tempMessage: Message = {
      id: Date.now(),
      conversationId: this.conversation.id,
      senderId: this.currentUserId,
      receiverId: this.conversation.coachId === this.currentUserId ? this.conversation.userId : this.conversation.coachId,
      content: messageContent,
      timestamp: new Date(),
      isRead: false,
      type: MessageType.TEXT
    };

    // Add message optimistically
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;

    // Send message via service
    this.messageService.sendMessage({
      destinataireId: tempMessage.receiverId,
      contenu: messageContent,
      type: MessageType.TEXT
    });
  }

  onMessageInputChange(): void {
    if (!this.isTyping && this.newMessage.trim()) {
      this.startTyping();
    } else if (this.isTyping && !this.newMessage.trim()) {
      this.stopTyping();
    }

    // Reset typing timer
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    if (this.newMessage.trim()) {
      this.typingTimer = setTimeout(() => {
        this.stopTyping();
      }, 3000);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private startTyping(): void {
    if (!this.isTyping && this.conversation?.id) {
      this.isTyping = true;
      this.websocketService.sendTypingStatus(this.conversation.id.toString(), true);
      this.typingStatusChanged.emit(true);
    }
  }

  private stopTyping(): void {
    if (this.isTyping && this.conversation?.id) {
      this.isTyping = false;
      this.websocketService.sendTypingStatus(this.conversation.id.toString(), false);
      this.typingStatusChanged.emit(false);
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private markMessageAsRead(message: Message): void {
    if (message.senderId !== this.currentUserId && !message.isRead && message.id) {
      this.messageService.markAsRead(message.id).subscribe({
        next: () => {
          message.isRead = true;
        },
        error: (error) => {
          console.error('Error marking message as read:', error);
        }
      });
    }
  }

  private markAllMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(
      m => m.senderId !== this.currentUserId && !m.isRead
    );

    unreadMessages.forEach(message => {
      this.markMessageAsRead(message);
    });
  }

  retryMessage(message: Message): void {
    if (this.conversation?.id && message.content) {
      this.messageService.sendMessage({
        destinataireId: message.receiverId,
        contenu: message.content,
        type: MessageType.TEXT
      });
    }
  }

  trackByMessage(index: number, message: Message): string | number {
    return message.id || index;
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
}