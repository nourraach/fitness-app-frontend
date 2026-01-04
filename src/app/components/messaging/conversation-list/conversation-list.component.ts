import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Conversation } from '../../../models/conversation.model';
import { ConversationService } from '../../../services/conversation.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conversation-list.component.html',
  styleUrls: ['./conversation-list.component.css']
})
export class ConversationListComponent implements OnInit, OnDestroy {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversationId: string | null = null;
  @Output() conversationSelected = new EventEmitter<Conversation>();
  @Output() searchChanged = new EventEmitter<string>();

  searchTerm: string = '';
  filteredConversations: Conversation[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private conversationService: ConversationService) {}

  ngOnInit(): void {
    this.filteredConversations = [...this.conversations];
    
    // Subscribe to real-time conversation updates
    const conversationSub = this.conversationService.getConversations().subscribe(
      conversations => {
        this.conversations = conversations;
        this.filterConversations();
      }
    );
    this.subscriptions.push(conversationSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onSearchChange(): void {
    this.searchChanged.emit(this.searchTerm);
    this.filterConversations();
  }

  filterConversations(): void {
    if (!this.searchTerm.trim()) {
      this.filteredConversations = [...this.conversations];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredConversations = this.conversations.filter(conversation =>
        conversation.participantName?.toLowerCase().includes(term) ||
        conversation.lastMessage?.content?.toLowerCase().includes(term)
      );
    }
  }

  selectConversation(conversation: Conversation): void {
    this.conversationSelected.emit(conversation);
  }

  getUnreadCount(conversation: Conversation): number {
    return conversation.unreadCount || 0;
  }

  formatLastMessageTime(timestamp: Date | string): string {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  }

  truncateMessage(message: string, maxLength: number = 50): string {
    if (!message) return '';
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
  }

  trackByConversation(index: number, conversation: Conversation): string {
    return conversation.id || index.toString();
  }
}