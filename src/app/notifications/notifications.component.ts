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
  NotificationType
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
  preferences: PreferenceNotificationDTO = {};
  
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
        this.preferences = data;
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
    this.notificationService.updatePreferences(this.preferences).subscribe({
      next: (data) => {
        this.preferences = data;
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
