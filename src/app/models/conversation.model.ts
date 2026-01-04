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
}

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