import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { InAppNotificationService } from '../../../services/in-app-notification.service';
import { NotificationStateService } from '../../../services/notification-state.service';
import { WebsocketService } from '../../../services/websocket.service';
import { InAppNotification } from '../../../models/in-app-notification.model';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule, NotificationItemComponent],
  template: `
    <div class="notification-center" [class.open]="isOpen">
      <div class="notification-header">
        <h3><i class="fas fa-bell"></i> Notifications</h3>
        <div class="header-actions">
          <button class="mark-all-btn" (click)="markAllAsRead()" *ngIf="hasUnread" [disabled]="isLoading">
            <i class="fas fa-check-double"></i> Tout marquer lu
          </button>
          <button class="close-btn" (click)="close()"><i class="fas fa-times"></i></button>
        </div>
      </div>

      <div class="notification-tabs">
        <button [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">Toutes</button>
        <button [class.active]="activeTab === 'unread'" (click)="activeTab = 'unread'">
          Non lues <span class="count" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </button>
      </div>

      <div class="notification-content">
        <div *ngIf="isLoading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i> Chargement...
        </div>

        <div *ngIf="error" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button (click)="loadNotifications()">Réessayer</button>
        </div>

        <div *ngIf="!isLoading && !error && filteredNotifications.length === 0" class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <p>Aucune notification</p>
        </div>

        <div class="notification-list" *ngIf="!isLoading && !error && filteredNotifications.length > 0">
          <app-notification-item
            *ngFor="let notification of filteredNotifications"
            [notification]="notification"
            (click$)="onNotificationClick($event)"
            (toggleRead)="onToggleRead($event)">
          </app-notification-item>
        </div>
      </div>
    </div>
    <div class="overlay" *ngIf="isOpen" (click)="close()"></div>
  `,
  styles: [`
    .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.3); z-index: 999; }
    .notification-center {
      position: fixed; top: 0; right: -400px; width: 380px; height: 100vh;
      background: white; box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 1000; transition: right 0.3s ease; display: flex; flex-direction: column;
    }
    .notification-center.open { right: 0; }
    .notification-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px; border-bottom: 1px solid #eee; background: #f8f9fa;
    }
    .notification-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
    .header-actions { display: flex; gap: 8px; }
    .mark-all-btn {
      background: #007bff; color: white; border: none; padding: 6px 12px;
      border-radius: 4px; cursor: pointer; font-size: 12px;
    }
    .mark-all-btn:hover { background: #0056b3; }
    .mark-all-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .close-btn { background: transparent; border: none; cursor: pointer; font-size: 18px; color: #666; padding: 4px; }
    .close-btn:hover { color: #333; }
    .notification-tabs { display: flex; border-bottom: 1px solid #eee; }
    .notification-tabs button {
      flex: 1; padding: 12px; background: transparent; border: none;
      cursor: pointer; font-weight: 500; color: #666; border-bottom: 2px solid transparent;
    }
    .notification-tabs button.active { color: #007bff; border-bottom-color: #007bff; }
    .notification-tabs .count {
      background: #dc3545; color: white; border-radius: 10px;
      padding: 1px 6px; font-size: 11px; margin-left: 4px;
    }
    .notification-content { flex: 1; overflow-y: auto; }
    .loading-state, .error-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 40px; color: #666; text-align: center;
    }
    .loading-state i, .error-state i, .empty-state i { font-size: 32px; margin-bottom: 12px; }
    .error-state { color: #dc3545; }
    .error-state button {
      margin-top: 12px; padding: 8px 16px; background: #007bff;
      color: white; border: none; border-radius: 4px; cursor: pointer;
    }
    .notification-list { padding: 8px; display: flex; flex-direction: column; gap: 4px; }
    @media (max-width: 480px) {
      .notification-center { width: 100%; right: -100%; }
    }
  `]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();

  notifications: InAppNotification[] = [];
  activeTab: 'all' | 'unread' = 'all';
  isLoading: boolean = false;
  error: string | null = null;
  unreadCount: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: InAppNotificationService,
    private stateService: NotificationStateService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    this.stateService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => this.notifications = n);
    this.stateService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(c => this.unreadCount = c);
    this.stateService.loading$.pipe(takeUntil(this.destroy$)).subscribe(l => this.isLoading = l);
    this.stateService.error$.pipe(takeUntil(this.destroy$)).subscribe(e => this.error = e);

    this.websocketService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(n => {
      this.stateService.addNotification(n);
    });

    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filteredNotifications(): InAppNotification[] {
    return this.activeTab === 'unread' ? this.notifications.filter(n => !n.read) : this.notifications;
  }

  get hasUnread(): boolean {
    return this.unreadCount > 0;
  }

  loadNotifications(): void {
    this.stateService.setLoading(true);
    this.stateService.clearError();
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.stateService.setNotifications(notifications);
        this.stateService.setLoading(false);
      },
      error: (err) => {
        this.stateService.setError(err.message);
        this.stateService.setLoading(false);
      }
    });
  }

  onNotificationClick(notification: InAppNotification): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => this.stateService.markAsRead(notification.id)
      });
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }

  onToggleRead(notification: InAppNotification): void {
    if (notification.read) {
      this.notificationService.markAsUnread(notification.id).subscribe({
        next: () => this.stateService.markAsUnread(notification.id)
      });
    } else {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => this.stateService.markAsRead(notification.id)
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => this.stateService.markAllAsRead()
    });
  }

  close(): void {
    this.closed.emit();
  }
}
