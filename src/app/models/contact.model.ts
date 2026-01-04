import { ConversationDTO } from './message.model';

export interface ContactDTO {
  id: number;
  name: string;
  role: 'Coach' | 'Client';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  isFriend: boolean;
  isCoach: boolean;
  email?: string;
}

export interface ConversationCreationRequest {
  participantId: number;
  initialMessage?: string;
  type: 'direct' | 'support';
}

export interface ConversationCreationResponse {
  conversation: ConversationDTO;
  success: boolean;
  message?: string;
}

export interface ContactSearchFilters {
  query?: string;
  role?: 'Coach' | 'Client';
  onlineOnly?: boolean;
  friendsOnly?: boolean;
}