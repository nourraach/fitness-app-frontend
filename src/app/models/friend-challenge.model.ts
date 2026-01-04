export interface FriendChallenge {
  id: number;
  nom: string;
  description?: string;
  typeObjectif: ChallengeObjectiveType;
  valeurCible: number;
  dateDebut: Date;
  dateFin: Date;
  createurId: number;
  createurNom: string;
  statut: ChallengeStatus;
  nombreParticipants: number;
  isActive: boolean;
  joursRestants: number;
  participants?: ChallengeParticipant[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  progression: number;
  pourcentageCompletion: number;
  position: number;
  dateInscription: Date;
  dateCompletion?: Date;
  isCompleted: boolean;
  lastActivityDate?: Date;
}

export interface CreateFriendChallengeRequest {
  nom: string;
  description?: string;
  typeObjectif: ChallengeObjectiveType;
  valeurCible: number;
  dateDebut: string; // ISO date string
  dateFin: string; // ISO date string
  participantsIds: number[];
}

export interface JoinChallengeRequest {
  userId: number;
}

export interface UpdateProgressRequest {
  userId: number;
  progression: number;
  activiteDate?: Date;
}

export interface ChallengeLeaderboard {
  challengeId: number;
  challengeNom: string;
  participants: ChallengeParticipant[];
  totalParticipants: number;
  isCompleted: boolean;
  dateGeneration: Date;
}

export interface ChallengeProgress {
  challengeId: number;
  userId: number;
  progression: number;
  pourcentageCompletion: number;
  position: number;
  isCompleted: boolean;
  activitesRecentes: ChallengeActivity[];
}

export interface ChallengeActivity {
  id: number;
  userId: number;
  challengeId: number;
  valeur: number;
  dateActivite: Date;
  typeActivite: string;
  description?: string;
}

export enum ChallengeObjectiveType {
  STEPS = 'STEPS',
  CALORIES = 'CALORIES', 
  DISTANCE = 'DISTANCE',
  WORKOUTS = 'WORKOUTS',
  DURATION = 'DURATION'
}

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ChallengeStats {
  totalChallenges: number;
  activeChallenges: number;
  completedChallenges: number;
  totalParticipations: number;
  winRate: number;
  averagePosition: number;
  favoriteObjectiveType: ChallengeObjectiveType;
  totalProgressPoints: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

// Helper types for UI
export interface ChallengeTypeOption {
  value: ChallengeObjectiveType;
  label: string;
  icon: string;
  unit: string;
  description: string;
  color: string;
}

export interface ChallengeFilter {
  status?: ChallengeStatus;
  objectiveType?: ChallengeObjectiveType;
  createdByMe?: boolean;
  participatingIn?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}