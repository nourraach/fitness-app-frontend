export interface ConversationDTO {
  id: number;
  userId: number;
  coachId: number;
  createdAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
  messagesNonLus?: number;
  dernierMessage?: string;
  dateDernierMessage?: Date;
  unreadMessageCount?: number;
  lastMessageContent?: string;
  coachName?: string;
  userName?: string;
  // Additional properties for UI
  participantName?: string;
  participantAvatar?: string;
  isOnline?: boolean;
}

// Alias for backward compatibility
export interface Conversation extends ConversationDTO {}

export interface ConversationListItemDTO {
  conversationId: string;
  otherUserId: number;
  otherUserName: string;
  otherUserRole: string;
  lastMessage: string;
  lastMessageDate: Date;
  unreadCount: number;
  isOnline?: boolean;
}