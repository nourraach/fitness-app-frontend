import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../service/notification.service';
import { 
  NotificationPreferences, 
  NotificationHistory, 
  NotificationStats, 
  HistoryFilters,
  ApiResponse,
  WeekDay,
  NotificationType,
  NotificationDTO,
  TypeNotification,
  PreferenceNotificationDTO
} from '../models/notification.model';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationDTO[] = [];
  notificationsNonLues: NotificationDTO[] = [];
  preferences: PreferenceNotificationDTO = {
    userId: 0, // Will be set from user service
    
    // General settings
    notificationsActives: true,
    
    // Meal reminders
    mealRemindersEnabled: true,
    rappelPetitDejeuner: true,
    rappelDejeuner: true,
    rappelDiner: true,
    rappelCollation: false,
    
    // Meal times
    breakfastTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '19:00',
    heurePetitDejeuner: '08:00',
    heureDejeuner: '12:00',
    heureDiner: '19:00',
    heureCollation: '15:00',
    
    // Workout settings
    workoutRemindersEnabled: true,
    rappelActivite: true,
    workoutTime: '18:00',
    heureActivite: '18:00',
    
    // Motivational settings
    motivationalMessagesEnabled: true,
    motivationQuotidienne: true,
    motivationalFrequency: 3,
    heureMotivation: '09:00',
    
    // Hydration settings
    hydrationRemindersEnabled: false,
    
    // Limits and preferences
    maxDailyNotifications: 10,
    soundEnabled: true,
    vibrationEnabled: true
  };
  
  afficherPreferences: boolean = false;
  afficherToutesNotifications: boolean = false;
  
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.chargerNotifications();
    this.chargerPreferences();
  }

  chargerNotifications(): void {
    this.loading = true;
    
    if (this.afficherToutesNotifications) {
      this.notificationService.getNotifications().subscribe({
        next: (data) => {
          this.notifications = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement notifications:', err);
          this.loading = false;
        }
      });
    } else {
      this.notificationService.getNotificationsNonLues().subscribe({
        next: (data) => {
          this.notificationsNonLues = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur chargement notifications non lues:', err);
          this.loading = false;
        }
      });
    }
  }

  chargerPreferences(): void {
    this.notificationService.getPreferences().subscribe({
      next: (data) => {
        // Convert NotificationPreferences to PreferenceNotificationDTO
        this.preferences = {
          ...this.preferences,
          ...data,
          rappelPetitDejeuner: data.mealRemindersEnabled,
          rappelDejeuner: data.mealRemindersEnabled,
          rappelDiner: data.mealRemindersEnabled,
          rappelCollation: data.snackTimes && data.snackTimes.length > 0,
          rappelActivite: data.workoutRemindersEnabled,
          motivationQuotidienne: data.motivationalMessagesEnabled,
          heurePetitDejeuner: data.breakfastTime,
          heureDejeuner: data.lunchTime,
          heureDiner: data.dinnerTime,
          heureActivite: data.workoutTime,
          heureCollation: data.snackTimes && data.snackTimes.length > 0 ? data.snackTimes[0] : '15:00',
          heureMotivation: '09:00' // Default time for motivational messages
        };
      },
      error: (err) => {
        console.error('Erreur chargement préférences:', err);
      }
    });
  }

  toggleAffichage(): void {
    this.afficherToutesNotifications = !this.afficherToutesNotifications;
    this.chargerNotifications();
  }

  marquerCommeLue(notification: NotificationDTO): void {
    if (notification.id && !notification.estLue) {
      this.notificationService.marquerCommeLue(notification.id).subscribe({
        next: () => {
          notification.estLue = true;
          this.chargerNotifications();
        },
        error: (err) => {
          console.error('Erreur marquage notification:', err);
        }
      });
    }
  }

  marquerToutesCommeLues(): void {
    this.notificationService.marquerToutesCommeLues().subscribe({
      next: () => {
        this.afficherMessage('Toutes les notifications ont été marquées comme lues', 'success');
        this.chargerNotifications();
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.afficherMessage('Erreur lors du marquage', 'error');
      }
    });
  }

  supprimerNotification(notificationId: number): void {
    if (confirm('Supprimer cette notification ?')) {
      this.notificationService.supprimerNotification(notificationId).subscribe({
        next: () => {
          this.afficherMessage('Notification supprimée', 'success');
          this.chargerNotifications();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.afficherMessage('Erreur lors de la suppression', 'error');
        }
      });
    }
  }

  togglePreferences(): void {
    this.afficherPreferences = !this.afficherPreferences;
  }

  sauvegarderPreferences(): void {
    // Convert PreferenceNotificationDTO to NotificationPreferences
    const notificationPrefs: NotificationPreferences = {
      id: this.preferences.id,
      userId: this.preferences.userId,
      mealRemindersEnabled: this.preferences.mealRemindersEnabled || this.preferences.rappelPetitDejeuner || false,
      workoutRemindersEnabled: this.preferences.workoutRemindersEnabled || this.preferences.rappelActivite || false,
      motivationalMessagesEnabled: this.preferences.motivationalMessagesEnabled || this.preferences.motivationQuotidienne || false,
      hydrationRemindersEnabled: this.preferences.hydrationRemindersEnabled || false,
      breakfastTime: this.preferences.breakfastTime || this.preferences.heurePetitDejeuner || '08:00',
      lunchTime: this.preferences.lunchTime || this.preferences.heureDejeuner || '12:00',
      dinnerTime: this.preferences.dinnerTime || this.preferences.heureDiner || '19:00',
      snackTimes: this.preferences.snackTimes || (this.preferences.heureCollation ? [this.preferences.heureCollation] : []),
      workoutDays: this.preferences.workoutDays || [],
      workoutTime: this.preferences.workoutTime || this.preferences.heureActivite || '18:00',
      motivationalFrequency: this.preferences.motivationalFrequency || 3,
      hydrationInterval: this.preferences.hydrationInterval || 60,
      hydrationStartTime: this.preferences.hydrationStartTime || '08:00',
      hydrationEndTime: this.preferences.hydrationEndTime || '22:00',
      quietTimeEnabled: this.preferences.quietTimeEnabled || false,
      quietTimeStart: this.preferences.quietTimeStart || '22:00',
      quietTimeEnd: this.preferences.quietTimeEnd || '08:00',
      activeDays: this.preferences.activeDays || [],
      maxDailyNotifications: this.preferences.maxDailyNotifications || 10,
      soundEnabled: this.preferences.soundEnabled || true,
      vibrationEnabled: this.preferences.vibrationEnabled || true,
      createdAt: this.preferences.createdAt,
      updatedAt: this.preferences.updatedAt
    };

    this.notificationService.updatePreferences(notificationPrefs).subscribe({
      next: (data) => {
        // Convert back to PreferenceNotificationDTO
        this.preferences = {
          ...this.preferences,
          ...data,
          rappelPetitDejeuner: data.mealRemindersEnabled,
          rappelDejeuner: data.mealRemindersEnabled,
          rappelDiner: data.mealRemindersEnabled,
          rappelCollation: data.snackTimes && data.snackTimes.length > 0,
          rappelActivite: data.workoutRemindersEnabled,
          motivationQuotidienne: data.motivationalMessagesEnabled,
          heurePetitDejeuner: data.breakfastTime,
          heureDejeuner: data.lunchTime,
          heureDiner: data.dinnerTime,
          heureActivite: data.workoutTime,
          heureCollation: data.snackTimes && data.snackTimes.length > 0 ? data.snackTimes[0] : '15:00',
          heureMotivation: '09:00' // Default time for motivational messages
        };
        this.afficherMessage('Préférences enregistrées avec succès', 'success');
        // Programmer les notifications
        this.programmerNotifications();
      },
      error: (err) => {
        console.error('Erreur sauvegarde préférences:', err);
        this.afficherMessage('Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  programmerNotifications(): void {
    this.notificationService.programmerNotifications().subscribe({
      next: () => {
        console.log('Notifications programmées');
        this.chargerNotifications();
      },
      error: (err) => {
        console.error('Erreur programmation:', err);
      }
    });
  }

  getIconeType(type: TypeNotification): string {
    switch (type) {
      case TypeNotification.RAPPEL_REPAS: return '🍽️';
      case TypeNotification.MOTIVATION: return '💪';
      case TypeNotification.OBJECTIF_ATTEINT: return '🎯';
      case TypeNotification.RAPPEL_ACTIVITE: return '🏃';
      case TypeNotification.CONSEIL_NUTRITION: return '🥗';
      default: return '🔔';
    }
  }

  getCouleurType(type: TypeNotification): string {
    switch (type) {
      case TypeNotification.RAPPEL_REPAS: return '#84cabe';
      case TypeNotification.MOTIVATION: return '#ffa500';
      case TypeNotification.OBJECTIF_ATTEINT: return '#4CAF50';
      case TypeNotification.RAPPEL_ACTIVITE: return '#ff6b6b';
      case TypeNotification.CONSEIL_NUTRITION: return '#113F67';
      default: return '#666';
    }
  }

  afficherMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  getListeNotifications(): NotificationDTO[] {
    return this.afficherToutesNotifications ? this.notifications : this.notificationsNonLues;
  }
}
