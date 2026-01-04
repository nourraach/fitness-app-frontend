import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Message } from '../../../models/message.model';
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
  @Input() currentUserId: number = 0;
  @Output() messagesSent = new EventEmitter<Message>();
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
      (message: Message) => {
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
      (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (data.conversationId === this.conversation?.id && data.userId !== this.currentUserId) {
          this.otherUserTyping = data.isTyping;
        }
      }
    );
    this.subscriptions.push(typingSub);

    // Listen for message status updates
    const statusSub = this.websocketService.onMessageStatus().subscribe(
      (data: { messageId: string; status: 'sent' | 'delivered' | 'read' }) => {
        const message = this.messages.find(m => m.id === data.messageId);
        if (message) {
          message.status = data.status;
        }
      }
    );
    this.subscriptions.push(statusSub);
  }

  private loadMessages(): void {
    if (!this.conversation?.id) return;

    this.isLoading = true;
    const messagesSub = this.messageService.getMessages(this.conversation.id).subscribe({
      next: (messages) => {
        this.messages = messages;
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
    if (!this.newMessage.trim() || !this.conversation?.id) return;

    const messageContent = this.newMessage.trim();
    this.newMessage = '';
    this.stopTyping();

    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      conversationId: this.conversation.id,
      senderId: this.currentUserId,
      content: messageContent,
      timestamp: new Date(),
      status: 'sending',
      type: 'text'
    };

    // Add message optimistically
    this.messages.push(tempMessage);
    this.shouldScrollToBottom = true;

    // Send message via service
    const sendSub = this.messageService.sendMessage(this.conversation.id, messageContent).subscribe({
      next: (sentMessage) => {
        // Replace temp message with real message
        const tempIndex = this.messages.findIndex(m => m.id === tempMessage.id);
        if (tempIndex !== -1) {
          this.messages[tempIndex] = sentMessage;
        }
        this.messagesSent.emit(sentMessage);
      },
      error: (error) => {
        console.error('Error sending message:', error);
        // Mark temp message as failed
        const tempIndex = this.messages.findIndex(m => m.id === tempMessage.id);
        if (tempIndex !== -1) {
          this.messages[tempIndex].status = 'failed';
        }
      }
    });
    this.subscriptions.push(sendSub);
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
      this.websocketService.sendTypingStatus(this.conversation.id, true);
      this.typingStatusChanged.emit(true);
    }
  }

  private stopTyping(): void {
    if (this.isTyping && this.conversation?.id) {
      this.isTyping = false;
      this.websocketService.sendTypingStatus(this.conversation.id, false);
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
    if (message.senderId !== this.currentUserId && message.status !== 'read') {
      this.messageService.markAsRead(message.id).subscribe({
        next: () => {
          message.status = 'read';
        },
        error: (error) => {
          console.error('Error marking message as read:', error);
        }
      });
    }
  }

  private markAllMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(
      m => m.senderId !== this.currentUserId && m.status !== 'read'
    );

    unreadMessages.forEach(message => {
      this.markMessageAsRead(message);
    });
  }

  retryMessage(message: Message): void {
    if (message.status === 'failed' && this.conversation?.id) {
      message.status = 'sending';
      
      const retrySub = this.messageService.sendMessage(this.conversation.id, message.content).subscribe({
        next: (sentMessage) => {
          const messageIndex = this.messages.findIndex(m => m.id === message.id);
          if (messageIndex !== -1) {
            this.messages[messageIndex] = sentMessage;
          }
        },
        error: (error) => {
          console.error('Error retrying message:', error);
          message.status = 'failed';
        }
      });
      this.subscriptions.push(retrySub);
    }
  }

  focusInput(): void {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  trackByMessage(index: number, message: Message): string {
    return message.id || index.toString();
  }
}