/**
 * Types de notifications in-app
 */
export enum NotificationType {
  MEAL_REMINDER = 'MEAL_REMINDER',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  MOTIVATIONAL = 'MOTIVATIONAL',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  CHALLENGE = 'CHALLENGE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SYSTEM = 'SYSTEM',
  HYDRATION = 'HYDRATION',
  WEIGHT_UPDATE = 'WEIGHT_UPDATE',
  GOAL_PROGRESS = 'GOAL_PROGRESS'
}

/**
 * Interface pour une notification in-app
 */
export interface InAppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
  actionUrl?: string;
  icon?: string;
}

/**
 * Filtres pour l'historique des notifications
 */
export interface NotificationFilters {
  type?: NotificationType;
  startDate?: string;
  endDate?: string;
  read?: boolean;
  page?: number;
  size?: number;
}

/**
 * Statistiques des notifications
 */
export interface NotificationStats {
  total: number;
  unread: number;
  readRate: number;
  byType: { type: NotificationType; count: number }[];
  byDay: { date: string; count: number }[];
}

/**
 * Historique paginé des notifications
 */
export interface NotificationHistory {
  content: InAppNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

/**
 * Réponse API wrappée
 */
export interface NotificationApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Configuration des icônes par type
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  [NotificationType.MEAL_REMINDER]: 'pi pi-clock',
  [NotificationType.WORKOUT_REMINDER]: 'pi pi-heart',
  [NotificationType.MOTIVATIONAL]: 'pi pi-star',
  [NotificationType.FRIEND_REQUEST]: 'pi pi-user-plus',
  [NotificationType.CHALLENGE]: 'pi pi-flag',
  [NotificationType.ACHIEVEMENT]: 'pi pi-trophy',
  [NotificationType.SYSTEM]: 'pi pi-info-circle',
  [NotificationType.HYDRATION]: 'pi pi-sun',
  [NotificationType.WEIGHT_UPDATE]: 'pi pi-chart-line',
  [NotificationType.GOAL_PROGRESS]: 'pi pi-check-circle'
};

/**
 * Labels français par type
 */
export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  [NotificationType.MEAL_REMINDER]: 'Rappel repas',
  [NotificationType.WORKOUT_REMINDER]: 'Rappel entraînement',
  [NotificationType.MOTIVATIONAL]: 'Motivation',
  [NotificationType.FRIEND_REQUEST]: 'Demande d\'ami',
  [NotificationType.CHALLENGE]: 'Défi',
  [NotificationType.ACHIEVEMENT]: 'Succès',
  [NotificationType.SYSTEM]: 'Système',
  [NotificationType.HYDRATION]: 'Hydratation',
  [NotificationType.WEIGHT_UPDATE]: 'Poids',
  [NotificationType.GOAL_PROGRESS]: 'Objectif'
};


/**
 * Requête pour créer une notification manuelle
 */
export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

/**
 * Préférences de notifications utilisateur
 */
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  mealReminders: boolean;
  workoutReminders: boolean;
  motivationalMessages: boolean;
  friendRequests: boolean;
  challenges: boolean;
  achievements: boolean;
  reminderTime?: string; // Format HH:mm
}
