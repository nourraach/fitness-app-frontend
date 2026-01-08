export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum FriendshipStatus {
  NOT_FRIENDS = 'NOT_FRIENDS',
  FRIENDS = 'FRIENDS',
  REQUEST_SENT = 'REQUEST_SENT',
  REQUEST_RECEIVED = 'REQUEST_RECEIVED',
  BLOCKED = 'BLOCKED'
}

export interface User {
  id: number;
  nom: string;
  email: string;
  photo?: string;
  isOnline: boolean;
  lastSeen?: Date;
  totalWorkouts?: number;
  totalCalories?: number;
  joinDate: Date;
  isPublic: boolean;
}

export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt?: Date;
  senderInfo: User;
  receiverInfo: User;
}

export interface Friendship {
  id: number;
  user1Id: number;
  user2Id: number;
  createdAt: Date;
  user1Info: User;
  user2Info: User;
}

export interface UserSearchResult {
  user: User;
  friendshipStatus: FriendshipStatus;
  mutualFriends?: number;
}

export interface SocialActivity {
  id: number;
  userId: number;
  type: 'workout' | 'achievement' | 'challenge_completed' | 'challenge_joined' | 'friend_added' | 'goal_achieved' | 'program_started' | 'program_completed' | 'weight_milestone';
  title: string;
  description: string;
  createdAt: Date;
  userInfo: User;
  likes: number;
  hasLiked: boolean;
  comments: number;
  // Optional fields for challenge-related activities
  relatedEntityId?: number;
  relatedEntityType?: string;
}

// Mapping function for backend activity types to frontend types
export function mapBackendActivityType(backendType: string): SocialActivity['type'] {
  const typeMap: Record<string, SocialActivity['type']> = {
    'WORKOUT_COMPLETED': 'workout',
    'CHALLENGE_JOINED': 'challenge_joined',
    'CHALLENGE_COMPLETED': 'challenge_completed',
    'GOAL_ACHIEVED': 'goal_achieved',
    'PROGRAM_STARTED': 'program_started',
    'PROGRAM_COMPLETED': 'program_completed',
    'WEIGHT_MILESTONE': 'weight_milestone',
    'FRIEND_JOINED': 'friend_added',
    'ACHIEVEMENT_UNLOCKED': 'achievement'
  };
  return typeMap[backendType] || 'workout';
}