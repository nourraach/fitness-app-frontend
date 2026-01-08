/**
 * Énumération des jours de la semaine
 * Compatible avec DayOfWeek du backend Java
 */
export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

/**
 * Énumération des types de notification
 * Compatible avec NotificationType du backend
 */
export enum NotificationType {
  MEAL_REMINDER = 'MEAL_REMINDER',
  BREAKFAST_REMINDER = 'BREAKFAST_REMINDER',
  LUNCH_REMINDER = 'LUNCH_REMINDER',
  DINNER_REMINDER = 'DINNER_REMINDER',
  SNACK_REMINDER = 'SNACK_REMINDER',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  MOTIVATIONAL_MESSAGE = 'MOTIVATIONAL_MESSAGE',
  HYDRATION_REMINDER = 'HYDRATION_REMINDER',
  GOAL_ACHIEVEMENT = 'GOAL_ACHIEVEMENT',
  INACTIVITY_ENCOURAGEMENT = 'INACTIVITY_ENCOURAGEMENT',
  WEATHER_SUGGESTION = 'WEATHER_SUGGESTION',
  COACH_MESSAGE = 'COACH_MESSAGE',
  PROGRESS_UPDATE = 'PROGRESS_UPDATE',
  CATCH_UP_REMINDER = 'CATCH_UP_REMINDER',
  ALTERNATIVE_ACTIVITY = 'ALTERNATIVE_ACTIVITY',
  CONTEXTUAL_SUGGESTION = 'CONTEXTUAL_SUGGESTION'
}

/**
 * Énumération des statuts de notification
 * Compatible avec NotificationStatus du backend
 */
export enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  ACTION_TAKEN = 'ACTION_TAKEN',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

/**
 * Utilitaires pour les jours de la semaine
 */
export class DayOfWeekUtils {
  static readonly ALL_DAYS = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
  ];

  static readonly WEEKDAYS = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY
  ];

  static readonly WEEKEND = [
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY
  ];

  /**
   * Convertit un jour en français
   */
  static toFrench(day: DayOfWeek): string {
    const translations: Record<DayOfWeek, string> = {
      [DayOfWeek.MONDAY]: 'Lundi',
      [DayOfWeek.TUESDAY]: 'Mardi',
      [DayOfWeek.WEDNESDAY]: 'Mercredi',
      [DayOfWeek.THURSDAY]: 'Jeudi',
      [DayOfWeek.FRIDAY]: 'Vendredi',
      [DayOfWeek.SATURDAY]: 'Samedi',
      [DayOfWeek.SUNDAY]: 'Dimanche'
    };
    return translations[day];
  }

  /**
   * Convertit un jour en abrégé français
   */
  static toFrenchShort(day: DayOfWeek): string {
    const translations: Record<DayOfWeek, string> = {
      [DayOfWeek.MONDAY]: 'Lun',
      [DayOfWeek.TUESDAY]: 'Mar',
      [DayOfWeek.WEDNESDAY]: 'Mer',
      [DayOfWeek.THURSDAY]: 'Jeu',
      [DayOfWeek.FRIDAY]: 'Ven',
      [DayOfWeek.SATURDAY]: 'Sam',
      [DayOfWeek.SUNDAY]: 'Dim'
    };
    return translations[day];
  }
}