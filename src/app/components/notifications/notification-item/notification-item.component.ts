import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InAppNotification, NOTIFICATION_ICONS } from '../../../models/in-app-notification.model';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-item" [class.unread]="!notification.read" (click)="onNotificationClick()">
      <div class="notification-icon" [style.background]="getIconBackground()">
        <i [class]="getIcon()"></i>
      </div>
      <div class="notification-content">
        <h4>{{ notification.title }}</h4>
        <p>{{ notification.message }}</p>
        <span class="notification-time">{{ getRelativeTime() }}</span>
      </div>
      <div class="notification-actions">
        <button class="action-btn" (click)="onToggleRead($event)" [title]="notification.read ? 'Marquer non lu' : 'Marquer lu'">
          <i [class]="notification.read ? 'fas fa-envelope' : 'fas fa-envelope-open'"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
    }
    .notification-item:hover { background: #f8f9fa; }
    .notification-item.unread { background: #e7f3ff; border-left: 3px solid #007bff; }
    .notification-icon {
      width: 40px; height: 40px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 16px; flex-shrink: 0;
    }
    .notification-content { flex: 1; min-width: 0; }
    .notification-content h4 { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #333; }
    .notification-content p { margin: 0 0 4px 0; font-size: 13px; color: #666; line-height: 1.4; }
    .notification-time { font-size: 11px; color: #999; }
    .notification-actions { flex-shrink: 0; }
    .action-btn {
      background: transparent; border: none; cursor: pointer;
      padding: 6px; color: #999; font-size: 14px;
      border-radius: 4px; transition: all 0.2s ease;
    }
    .action-btn:hover { background: #e9ecef; color: #007bff; }
  `]
})
export class NotificationItemComponent {
  @Input() notification!: InAppNotification;
  @Output() click$ = new EventEmitter<InAppNotification>();
  @Output() toggleRead = new EventEmitter<InAppNotification>();

  getIcon(): string {
    return NOTIFICATION_ICONS[this.notification.type] || 'pi pi-bell';
  }

  getIconBackground(): string {
    const colors: Record<string, string> = {
      MEAL_REMINDER: '#28a745', WORKOUT_REMINDER: '#dc3545', MOTIVATIONAL: '#ffc107',
      FRIEND_REQUEST: '#17a2b8', CHALLENGE: '#6f42c1', ACHIEVEMENT: '#fd7e14',
      SYSTEM: '#6c757d', HYDRATION: '#20c997', WEIGHT_UPDATE: '#007bff', GOAL_PROGRESS: '#28a745'
    };
    return colors[this.notification.type] || '#6c757d';
  }

  getRelativeTime(): string {
    const now = new Date();
    const date = new Date(this.notification.createdAt);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
    return date.toLocaleDateString('fr-FR');
  }

  onNotificationClick(): void {
    this.click$.emit(this.notification);
  }

  onToggleRead(event: Event): void {
    event.stopPropagation();
    this.toggleRead.emit(this.notification);
  }
}
