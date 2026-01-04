export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

export interface ConversationDTO {
  conversationId: string;
  autreUtilisateurId: number;
  autreUtilisateurNom: string;
  autreUtilisateurRole: string;
  dernierMessage: string;
  dateDernierMessage: Date;
  messagesNonLus: number;
  isActive?: boolean;
}

export interface MessageDTO {
  id?: number;
  expediteurId: number;
  expediteurNom: string;
  destinataireId: number;
  destinataireNom: string;
  contenu: string;
  dateEnvoi: Date;
  dateLecture?: Date;
  conversationId: string;
  lu: boolean; // Changed from estLu to lu for backend compatibility
  type: MessageType;
}

export interface NotificationDTO {
  type: string;
  title: string;
  message: string;
  senderId: number;
  senderName: string;
  timestamp: Date;
  messagePreview: string;
  metadata?: { [key: string]: any };
}

export interface GroupedNotificationDTO {
  type: string;
  title: string;
  messageCount: number;
  senders: string[];
  timestamp: Date;
}

export interface TypingIndicatorDTO {
  userId: number;
  username?: string;
  conversationId?: string;
  isTyping: boolean;
  timestamp?: Date;
}

export interface TypingRequest {
  conversationId: string;
  isTyping: boolean;
}

export interface MessageReadRequest {
  messageId: number;
  conversationId: string;
}

export interface CoachAvailabilityDTO {
  coachId: number;
  available: boolean;
  status: string;
  lastUpdated: Date;
}

export interface Message {
  id?: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  isRead: boolean;
  conversationId?: number;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'; // Message status
}

export interface EnvoyerMessageRequest {
  destinataireId: number; // Changed from receiverId to destinataireId for backend compatibility
  contenu: string; // Changed from content to contenu for backend compatibility
  type?: MessageType;
  conversationId?: string;
}

// Extended conversation interface for compatibility
export interface ConversationExtendedDTO {
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