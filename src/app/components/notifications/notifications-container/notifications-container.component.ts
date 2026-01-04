import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationPreferencesComponent } from '../notification-preferences/notification-preferences.component';
import { NotificationHistoryComponent } from '../notification-history/notification-history.component';
import { NotificationStatsComponent } from '../notification-stats/notification-stats.component';

@Component({
  selector: 'app-notifications-container',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationPreferencesComponent, NotificationHistoryComponent, NotificationStatsComponent],
  template: `
    <div class="notifications-container">
      <div class="notifications-header">
        <h1><i class="fas fa-bell"></i> Notifications</h1>
        <p>Gérez vos préférences et consultez l'historique de vos notifications</p>
      </div>
      
      <div class="notifications-tabs">
        <button 
          class="tab-button"
          [class.active]="activeTab === 'preferences'"
          (click)="setActiveTab('preferences')">
          <i class="fas fa-cog"></i>
          Préférences
        </button>
        <button 
          class="tab-button"
          [class.active]="activeTab === 'history'"
          (click)="setActiveTab('history')">
          <i class="fas fa-history"></i>
          Historique
        </button>
        <button 
          class="tab-button"
          [class.active]="activeTab === 'stats'"
          (click)="setActiveTab('stats')">
          <i class="fas fa-chart-bar"></i>
          Statistiques
        </button>
      </div>
      
      <div class="notifications-content">
        <div *ngIf="activeTab === 'preferences'" class="tab-content">
          <app-notification-preferences></app-notification-preferences>
        </div>
        
        <div *ngIf="activeTab === 'history'" class="tab-content">
          <app-notification-history></app-notification-history>
        </div>
        
        <div *ngIf="activeTab === 'stats'" class="tab-content">
          <app-notification-stats></app-notification-stats>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .notifications-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .notifications-header h1 {
      color: #333;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .notifications-header p {
      color: #666;
      margin: 0;
    }

    .notifications-tabs {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 12px 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
    }

    .tab-button:hover {
      color: #007bff;
      background: #f8f9fa;
    }

    .tab-button.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .notifications-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .tab-content {
      padding: 30px;
    }

    @media (max-width: 768px) {
      .notifications-container {
        padding: 10px;
      }
      
      .notifications-tabs {
        flex-direction: column;
        gap: 0;
      }
      
      .tab-button {
        justify-content: center;
        border-bottom: 1px solid #eee;
        border-radius: 0;
      }
      
      .tab-content {
        padding: 20px;
      }
    }
  `]
})
export class NotificationsContainerComponent implements OnInit {
  activeTab: 'preferences' | 'history' | 'stats' = 'preferences';

  ngOnInit(): void {}

  setActiveTab(tab: 'preferences' | 'history' | 'stats'): void {
    this.activeTab = tab;
  }
}