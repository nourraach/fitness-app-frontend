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
  type: 'workout' | 'achievement' | 'challenge_completed' | 'friend_added';
  title: string;
  description: string;
  createdAt: Date;
  userInfo: User;
  likes: number;
  hasLiked: boolean;
  comments: number;
}

export interface SocialNotification {
  id: number;
  userId: number;
  type: 'friend_request' | 'friend_accepted' | 'challenge_invite' | 'activity_like' | 'challenge_completed';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedUserId?: number;
  relatedUserInfo?: User;
  actionUrl?: string;
}