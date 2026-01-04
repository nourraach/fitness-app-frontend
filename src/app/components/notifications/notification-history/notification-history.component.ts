import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, NotificationHistory, PaginatedResponse } from '../../../services/notification.service';

@Component({
  selector: 'app-notification-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notification-history">
      <div class="history-header">
        <h2>Historique des Notifications</h2>
        <div class="filters">
          <div class="filter-group">
            <label for="typeFilter">Type:</label>
            <select id="typeFilter" [(ngModel)]="selectedType" (change)="onFilterChange()">
              <option value="">Tous les types</option>
              <option value="ENTRAINEMENT">Entraînement</option>
              <option value="NUTRITION">Nutrition</option>
              <option value="PESEE">Pesée</option>
              <option value="MOTIVATIONNEL">Motivationnel</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="periodFilter">Période:</label>
            <select id="periodFilter" [(ngModel)]="selectedPeriod" (change)="onFilterChange()">
              <option value="">Toute la période</option>
              <option value="7d">7 derniers jours</option>
              <option value="30d">30 derniers jours</option>
              <option value="3m">3 derniers mois</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="statusFilter">Statut:</label>
            <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="onFilterChange()">
              <option value="">Tous</option>
              <option value="read">Lues</option>
              <option value="unread">Non lues</option>
            </select>
          </div>
        </div>
      </div>

      <div class="notifications-list" *ngIf="notifications.length > 0">
        <div class="notification-item" 
             *ngFor="let notification of notifications"
             [class.unread]="!notification.lu"
             [class.read]="notification.lu">
          
          <div class="notification-icon">
            <i class="fas" 
               [class.fa-dumbbell]="notification.type === 'ENTRAINEMENT'"
               [class.fa-utensils]="notification.type === 'NUTRITION'"
               [class.fa-weight]="notification.type === 'PESEE'"
               [class.fa-heart]="notification.type === 'MOTIVATIONNEL'"></i>
          </div>
          
          <div class="notification-content">
            <div class="notification-header">
              <h4 class="notification-title">{{ notification.titre }}</h4>
              <div class="notification-meta">
                <span class="notification-type" [class]="getTypeClass(notification.type)">
                  {{ getTypeLabel(notification.type) }}
                </span>
                <span class="notification-date">
                  {{ formatDate(notification.dateEnvoi) }}
                </span>
              </div>
            </div>
            
            <p class="notification-message">{{ notification.message }}</p>
            
            <div class="notification-actions">
              <button 
                class="action-btn read-btn"
                [class.active]="notification.lu"
                (click)="toggleReadStatus(notification)"
                [title]="notification.lu ? 'Marquer comme non lue' : 'Marquer comme lue'">
                <i class="fas" [class.fa-eye]="!notification.lu" [class.fa-eye-slash]="notification.lu"></i>
                {{ notification.lu ? 'Non lue' : 'Lue' }}
              </button>
              
              <div class="feedback-actions" *ngIf="notification.lu">
                <button 
                  class="action-btn useful-btn"
                  [class.active]="notification.utile === true"
                  (click)="markAsUseful(notification, true)"
                  title="Marquer comme utile">
                  <i class="fas fa-thumbs-up"></i>
                  Utile
                </button>
                
                <button 
                  class="action-btn not-useful-btn"
                  [class.active]="notification.utile === false"
                  (click)="markAsUseful(notification, false)"
                  title="Marquer comme non pertinent">
                  <i class="fas fa-thumbs-down"></i>
                  Non pertinent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!isLoading && notifications.length === 0">
        <i class="fas fa-bell-slash"></i>
        <h3>Aucune notification</h3>
        <p>{{ getEmptyStateMessage() }}</p>
      </div>

      <div class="pagination" *ngIf="totalPages > 1">
        <button 
          class="pagination-btn"
          [disabled]="currentPage === 0"
          (click)="goToPage(currentPage - 1)">
          <i class="fas fa-chevron-left"></i>
          Précédent
        </button>
        
        <div class="page-info">
          Page {{ currentPage + 1 }} sur {{ totalPages }}
          <span class="total-items">({{ totalElements }} notifications)</span>
        </div>
        
        <button 
          class="pagination-btn"
          [disabled]="currentPage >= totalPages - 1"
          (click)="goToPage(currentPage + 1)">
          Suivant
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des notifications...</p>
      </div>

      <div class="error" *ngIf="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="loadNotifications()">Réessayer</button>
      </div>
    </div>
  `,
  styles: [`
    .notification-history {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .history-header {
      margin-bottom: 30px;
    }

    .history-header h2 {
      color: #333;
      margin-bottom: 20px;
    }

    .filters {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-group label {
      font-weight: 500;
      color: #333;
      white-space: nowrap;
    }

    .filter-group select {
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 14px;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .notification-item {
      display: flex;
      gap: 15px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }

    .notification-item.unread {
      border-left-color: #007bff;
      background: #f8f9ff;
    }

    .notification-item.read {
      border-left-color: #28a745;
    }

    .notification-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: white;
      font-size: 16px;
    }

    .notification-item.unread .notification-icon {
      background: #007bff;
    }

    .notification-item.read .notification-icon {
      background: #6c757d;
    }

    .notification-content {
      flex: 1;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      gap: 15px;
    }

    .notification-title {
      margin: 0;
      color: #333;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .notification-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      flex-shrink: 0;
    }

    .notification-type {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .notification-type.entrainement {
      background: #e3f2fd;
      color: #1976d2;
    }

    .notification-type.nutrition {
      background: #e8f5e8;
      color: #388e3c;
    }

    .notification-type.pesee {
      background: #fff3e0;
      color: #f57c00;
    }

    .notification-type.motivationnel {
      background: #fce4ec;
      color: #c2185b;
    }

    .notification-date {
      font-size: 12px;
      color: #666;
    }

    .notification-message {
      color: #555;
      line-height: 1.5;
      margin-bottom: 15px;
    }

    .notification-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 6px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f8f9fa;
    }

    .action-btn.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .useful-btn.active {
      background: #28a745;
      border-color: #28a745;
    }

    .not-useful-btn.active {
      background: #dc3545;
      border-color: #dc3545;
    }

    .feedback-actions {
      display: flex;
      gap: 8px;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .pagination-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      text-align: center;
      color: #333;
      font-weight: 500;
    }

    .total-items {
      display: block;
      font-size: 12px;
      color: #666;
      font-weight: normal;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ccc;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      color: #333;
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
      color: #666;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error i {
      font-size: 32px;
      color: #dc3545;
      margin-bottom: 15px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 15px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    @media (max-width: 768px) {
      .notification-history {
        padding: 15px;
      }

      .filters {
        flex-direction: column;
        gap: 15px;
      }

      .notification-item {
        flex-direction: column;
        gap: 10px;
      }

      .notification-header {
        flex-direction: column;
        align-items: stretch;
      }

      .notification-meta {
        align-items: flex-start;
        flex-direction: row;
        justify-content: space-between;
      }

      .pagination {
        flex-direction: column;
        gap: 15px;
      }
    }
  `]
})
export class NotificationHistoryComponent implements OnInit {
  notifications: NotificationHistory[] = [];
  currentPage = 0;
  totalPages = 0;
  totalElements = 0;
  pageSize = 20;
  
  selectedType = '';
  selectedPeriod = '';
  selectedStatus = '';
  
  isLoading = false;
  error = '';

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading = true;
    this.error = '';

    this.notificationService.getHistory(
      this.currentPage,
      this.pageSize,
      this.selectedType || undefined,
      this.selectedPeriod || undefined
    ).subscribe({
      next: (response: PaginatedResponse<NotificationHistory>) => {
        let filteredNotifications = response.content;
        
        // Apply status filter client-side
        if (this.selectedStatus === 'read') {
          filteredNotifications = filteredNotifications.filter(n => n.lu);
        } else if (this.selectedStatus === 'unread') {
          filteredNotifications = filteredNotifications.filter(n => !n.lu);
        }
        
        this.notifications = filteredNotifications;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des notifications';
        this.isLoading = false;
        console.error('Error loading notifications:', error);
      }
    });
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadNotifications();
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadNotifications();
  }

  toggleReadStatus(notification: NotificationHistory) {
    const action = notification.lu ? 
      this.notificationService.markAsUnread(notification.id) :
      this.notificationService.markAsRead(notification.id);

    action.subscribe({
      next: () => {
        notification.lu = !notification.lu;
        // Update unread count
        this.updateUnreadCount();
      },
      error: (error) => {
        console.error('Error updating read status:', error);
      }
    });
  }

  markAsUseful(notification: NotificationHistory, useful: boolean) {
    this.notificationService.markAsUseful(notification.id, useful).subscribe({
      next: () => {
        notification.utile = useful;
      },
      error: (error) => {
        console.error('Error updating feedback:', error);
      }
    });
  }

  private updateUnreadCount() {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.notificationService.updateUnreadCount(count);
      },
      error: (error) => {
        console.error('Error updating unread count:', error);
      }
    });
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'ENTRAINEMENT': 'Entraînement',
      'NUTRITION': 'Nutrition',
      'PESEE': 'Pesée',
      'MOTIVATIONNEL': 'Motivationnel'
    };
    return labels[type] || type;
  }

  getTypeClass(type: string): string {
    return type.toLowerCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  getEmptyStateMessage(): string {
    if (this.selectedType || this.selectedPeriod || this.selectedStatus) {
      return 'Aucune notification ne correspond aux filtres sélectionnés.';
    }
    return 'Vous n\'avez encore reçu aucune notification.';
  }
}