export interface NotificationPreferences {
  id?: number;
  userId: number;
  
  // Types de notifications
  mealRemindersEnabled: boolean;
  workoutRemindersEnabled: boolean;
  motivationalMessagesEnabled: boolean;
  hydrationRemindersEnabled: boolean;
  
  // Heures des repas
  breakfastTime: string; // "HH:MM"
  lunchTime: string;
  dinnerTime: string;
  snackTimes: string[]; // ["10:00", "15:00"]
  
  // Configuration entraînement
  workoutDays: WeekDay[];
  workoutTime: string;
  
  // Messages motivationnels
  motivationalFrequency: number; // 0-10 par semaine
  
  // Hydratation
  hydrationInterval: number; // minutes
  hydrationStartTime: string;
  hydrationEndTime: string;
  
  // Heures de silence
  quietTimeEnabled: boolean;
  quietTimeStart: string;
  quietTimeEnd: string;
  
  // Jours actifs
  activeDays: WeekDay[];
  
  // Limites
  maxDailyNotifications: number; // 1-50
  
  // Préférences avancées
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export interface NotificationHistory {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  scheduledTime: Date;
  sentTime?: Date;
  readTime?: Date;
  status: NotificationStatus;
  actionTaken: boolean;
  feedback?: 'USEFUL' | 'NOT_RELEVANT';
  metadata?: { [key: string]: any };
}

export enum NotificationType {
  MEAL_REMINDER = 'MEAL_REMINDER',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  MOTIVATIONAL_MESSAGE = 'MOTIVATIONAL_MESSAGE',
  HYDRATION_REMINDER = 'HYDRATION_REMINDER'
}

export enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
  FAILED = 'FAILED'
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalActionTaken: number;
  readRate: number; // pourcentage
  actionRate: number; // pourcentage
  
  byType: {
    [key in NotificationType]: {
      sent: number;
      read: number;
      actionTaken: number;
    }
  };
  
  weeklyTrend: {
    date: string;
    sent: number;
    read: number;
  }[];
  
  engagementScore: number; // 0-100
  recommendations: string[];
}

export interface HistoryFilters {
  type?: NotificationType;
  startDate?: Date;
  endDate?: Date;
  status?: NotificationStatus;
  page?: number;
  size?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

// DTO pour les notifications reçues du backend
export interface NotificationDTO {
  id?: number;
  userId: number;
  type: TypeNotification;
  titre: string;
  contenu: string;
  message?: string; // Alias for contenu for template compatibility
  dateCreation: string;
  dateLecture?: string;
  dateProgrammee?: string; // For scheduled notifications
  estLue: boolean;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE';
  metadata?: { [key: string]: any };
}

// Enum pour les types de notifications utilisés dans les composants
export enum TypeNotification {
  RAPPEL_REPAS = 'RAPPEL_REPAS',
  MOTIVATION = 'MOTIVATION',
  OBJECTIF_ATTEINT = 'OBJECTIF_ATTEINT',
  RAPPEL_ACTIVITE = 'RAPPEL_ACTIVITE',
  CONSEIL_NUTRITION = 'CONSEIL_NUTRITION'
}

// DTO pour les préférences de notification
export interface PreferenceNotificationDTO {
  id?: number;
  userId: number; // Make required to match NotificationPreferences
  
  // General notification settings
  notificationsActives?: boolean;
  
  // Meal reminder settings
  mealRemindersEnabled?: boolean;
  rappelPetitDejeuner?: boolean; // Breakfast reminder
  rappelDejeuner?: boolean; // Lunch reminder
  rappelDiner?: boolean; // Dinner reminder
  rappelCollation?: boolean; // Snack reminder
  
  // Meal times
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  heurePetitDejeuner?: string; // Alias for breakfastTime
  heureDejeuner?: string; // Alias for lunchTime
  heureDiner?: string; // Alias for dinnerTime
  heureCollation?: string; // Snack time
  snackTimes?: string[];
  
  // Workout settings
  workoutRemindersEnabled?: boolean;
  rappelActivite?: boolean; // Alias for workoutRemindersEnabled
  workoutDays?: WeekDay[];
  workoutTime?: string;
  heureActivite?: string; // Alias for workoutTime
  
  // Motivational settings
  motivationalMessagesEnabled?: boolean;
  motivationQuotidienne?: boolean; // Alias for motivationalMessagesEnabled
  motivationalFrequency?: number;
  heureMotivation?: string; // Time for motivational messages
  
  // Hydration settings
  hydrationRemindersEnabled?: boolean;
  hydrationInterval?: number;
  hydrationStartTime?: string;
  hydrationEndTime?: string;
  
  // Quiet time settings
  quietTimeEnabled?: boolean;
  quietTimeStart?: string;
  quietTimeEnd?: string;
  
  // Active days
  activeDays?: WeekDay[];
  
  // Limits
  maxDailyNotifications?: number;
  
  // Sound and vibration
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}