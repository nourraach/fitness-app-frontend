export enum ChallengeType {
  STEPS = 'STEPS',
  CALORIES = 'CALORIES',
  WORKOUTS = 'WORKOUTS',
  DURATION = 'DURATION',
  DISTANCE = 'DISTANCE'
}

export enum ChallengeStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum ParticipantStatus {
  INVITED = 'INVITED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED'
}

export interface Challenge {
  id: number;
  creatorId: number;
  title: string;
  description: string;
  type: ChallengeType;
  targetValue: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  isPublic: boolean;
  maxParticipants?: number;
  createdAt: Date;
  creatorInfo: any; // User info
  participantCount: number;
  completedCount: number;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: number;
  status: ParticipantStatus;
  currentProgress: number;
  completedAt?: Date;
  joinedAt: Date;
  userInfo: any; // User info
  rank?: number;
}

export interface ChallengeInvitation {
  id: number;
  challengeId: number;
  inviterId: number;
  inviteeId: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: Date;
  challengeInfo: Challenge;
  inviterInfo: any; // User info
}

export interface ChallengeProgress {
  participantId: number;
  userId: number;
  challengeId: number;
  currentValue: number;
  targetValue: number;
  progressPercentage: number;
  rank: number;
  isCompleted: boolean;
  userInfo: any;
}

export interface ChallengeLeaderboard {
  challengeId: number;
  participants: ChallengeProgress[];
  lastUpdated: Date;
}

export interface CreateChallengeRequest {
  title: string;
  description: string;
  type: ChallengeType;
  targetValue: number;
  startDate: Date;
  endDate: Date;
  invitedFriends: number[];
  isPublic: boolean;
  maxParticipants?: number;
}