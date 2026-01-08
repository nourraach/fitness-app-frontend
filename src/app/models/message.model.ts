export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM'
}

// ============================================
// Backend API Response DTOs (from API Guide)
// ============================================

/**
 * Message response from backend API
 * Matches: POST /api/messages response
 */
export interface MessageDTO {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: string; // ISO 8601 format
  type: MessageType;
  isRead: boolean;
  conversationId: string;
}

/**
 * Conversation response from backend API
 * Matches: GET /api/messages/conversations response
 */
export interface ConversationDTO {
  id: number;
  userId: number;
  userName: string;
  coachId?: number;
  coachName?: string;
  lastMessageContent: string;
  lastMessageAt: string; // ISO 8601 format
  unreadMessageCount: number;
  // UI-specific properties
  conversationId?: string;
  isActive?: boolean;
  isOnline?: boolean;
  participantName?: string;
  participantAvatar?: string;
  // Legacy properties for backward compatibility
  autreUtilisateurId?: number;
  autreUtilisateurNom?: string;
  autreUtilisateurRole?: string;
  dernierMessage?: string;
  dateDernierMessage?: Date;
  messagesNonLus?: number;
}

/**
 * Legacy ConversationDTO for backward compatibility
 */
export interface LegacyConversationDTO {
  conversationId: string;
  autreUtilisateurId: number;
  autreUtilisateurNom: string;
  autreUtilisateurRole: string;
  dernierMessage: string;
  dateDernierMessage: Date;
  messagesNonLus: number;
  isActive?: boolean;
}

// ============================================
// Request DTOs (for sending to backend)
// ============================================

/**
 * Send message request
 * Matches: POST /api/messages body
 */
export interface SendMessageRequest {
  destinataireId: number;
  contenu: string;
  type: MessageType;
}

/**
 * Typing indicator request via WebSocket
 * Destination: /app/typing
 */
export interface TypingIndicatorRequest {
  destinataireId: number;
  typing: boolean;
}

/**
 * Mark message as read request via WebSocket
 * Destination: /app/message.read
 */
export interface MessageReadRequest {
  messageId: number;
  expediteurId: number;
}

// ============================================
// WebSocket DTOs
// ============================================

/**
 * Typing indicator received via WebSocket
 * Source: /user/{userId}/queue/typing
 */
export interface TypingIndicatorDTO {
  userId: number;
  username: string;
  typing: boolean;
  conversationId?: string;
  timestamp?: Date;
}

/**
 * Read receipt received via WebSocket
 * Source: /user/{userId}/queue/message-read
 */
export interface ReadReceiptDTO {
  messageId: number;
  readBy: number;
  readAt: string;
}

// ============================================
// Pagination
// ============================================

/**
 * Paginated response wrapper
 */
export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ============================================
// Notification DTOs
// ============================================

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

// ============================================
// Unread Count Response
// ============================================

export interface UnreadCountResponse {
  count: number;
}

// ============================================
// Coach Availability
// ============================================

export interface CoachAvailabilityDTO {
  coachId: number;
  available: boolean;
  status: string;
  lastUpdated: Date;
}

// ============================================
// Legacy interfaces for backward compatibility
// ============================================

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
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface EnvoyerMessageRequest {
  destinataireId: number;
  contenu: string;
  type?: MessageType;
  conversationId?: string;
}

export interface TypingRequest {
  conversationId: string;
  isTyping: boolean;
}

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