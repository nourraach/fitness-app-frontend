/**
 * Interface pour les préférences de notifications
 * Compatible avec le backend Spring Boot NotificationPreferences
 */
export interface NotificationPreferences {
  id?: number;
  
  // General notification settings
  notifications: boolean;
  email: boolean;
  push: boolean;
  
  // Meal reminder settings
  mealRemindersEnabled: boolean;
  breakfastTime: string; // Format "HH:mm"
  lunchTime: string;
  dinnerTime: string;
  snackRemindersEnabled: boolean;
  morningSnackTime: string;
  afternoonSnackTime: string;
  
  // Workout reminder settings
  workoutRemindersEnabled: boolean;
  defaultWorkoutTime: string;
  
  // Motivational message settings
  motivationalMessagesEnabled: boolean;
  motivationalFrequency: number; // 1-7 messages per week
  
  // Active days
  activeDays: string[]; // ["MONDAY", "TUESDAY", ...]
  
  // Quiet time settings
  quietTimeEnabled: boolean;
  quietTimeStart: string;
  quietTimeEnd: string;
  
  // Daily limits
  maxNotificationsPerDay: number;
  
  // Hydration reminders
  hydrationRemindersEnabled: boolean;
  hydrationIntervalMinutes: number;
  
  // Contextual notifications
  weatherBasedSuggestionsEnabled: boolean;
  timezoneAdaptationEnabled: boolean;
}

/**
 * Interface pour les requêtes de mise à jour des préférences
 * Compatible avec NotificationPreferencesUpdateRequest du backend
 */
export interface NotificationPreferencesUpdateRequest {
  // Meal settings
  mealRemindersEnabled?: boolean;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  snackRemindersEnabled?: boolean;
  morningSnackTime?: string;
  afternoonSnackTime?: string;
  
  // Workout settings
  workoutRemindersEnabled?: boolean;
  defaultWorkoutTime?: string;
  
  // Motivational settings
  motivationalMessagesEnabled?: boolean;
  motivationalFrequency?: number;
  
  // Active days
  activeDays?: string[];
  
  // Quiet time
  quietTimeEnabled?: boolean;
  quietTimeStart?: string;
  quietTimeEnd?: string;
  
  // General settings
  notifications?: boolean;
  email?: boolean;
  push?: boolean;
  maxNotificationsPerDay?: number;
  
  // Additional settings
  hydrationRemindersEnabled?: boolean;
  hydrationIntervalMinutes?: number;
  weatherBasedSuggestionsEnabled?: boolean;
  timezoneAdaptationEnabled?: boolean;
}

/**
 * Interface pour les réponses d'API wrappées
 * Compatible avec ResponseWrapper du backend
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

/**
 * Interface pour les réponses d'erreur
 */
export interface ErrorResponse {
  success: boolean;
  error: string;
  message?: string;
  validationErrors?: ValidationError[];
  timestamp?: string;
  status?: number;
}