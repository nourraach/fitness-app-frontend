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