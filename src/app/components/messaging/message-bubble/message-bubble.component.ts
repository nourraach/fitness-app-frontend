import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../models/message.model';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrls: ['./message-bubble.component.css']
})
export class MessageBubbleComponent {
  @Input() message!: Message;
  @Input() isOwnMessage: boolean = false;
  @Input() showAvatar: boolean = true;
  @Input() participantAvatar: string = '';
  @Output() retryMessage = new EventEmitter<Message>();

  formatTimestamp(timestamp: Date | string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }

  getStatusIcon(): string {
    switch (this.message.status) {
      case 'sending':
        return 'fas fa-clock';
      case 'sent':
        return 'fas fa-check';
      case 'delivered':
        return 'fas fa-check-double';
      case 'read':
        return 'fas fa-check-double text-primary';
      case 'failed':
        return 'fas fa-exclamation-triangle text-danger';
      default:
        return '';
    }
  }

  getStatusText(): string {
    switch (this.message.status) {
      case 'sending':
        return 'Envoi en cours...';
      case 'sent':
        return 'Envoyé';
      case 'delivered':
        return 'Livré';
      case 'read':
        return 'Lu';
      case 'failed':
        return 'Échec de l\'envoi';
      default:
        return '';
    }
  }

  onRetryClick(): void {
    if (this.message.status === 'failed') {
      this.retryMessage.emit(this.message);
    }
  }

  isSystemMessage(): boolean {
    return this.message.type === 'system';
  }

  isTextMessage(): boolean {
    return this.message.type === 'text' || !this.message.type;
  }

  formatMessageContent(content: string): string {
    if (!content) return '';
    
    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedContent = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Convert line breaks to <br>
    formattedContent = formattedContent.replace(/\n/g, '<br>');
    
    return formattedContent;
  }
}