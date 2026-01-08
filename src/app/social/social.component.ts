import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FriendsManagerComponent } from '../components/social/friends-manager/friends-manager.component';
import { SocialFeedComponent } from '../components/social/social-feed/social-feed.component';
import { FriendService } from '../services/friend.service';
import { JwtService } from '../service/jwt.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FriendsManagerComponent, 
    SocialFeedComponent
  ],
  template: `
    <div class="social-container">
      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin fa-3x"></i>
          <h3>Chargement de l'espace social...</h3>
          <p>Veuillez patienter pendant que nous chargeons vos données sociales.</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="hasError && !isLoading" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle fa-4x"></i>
          <h3>Erreur de chargement</h3>
          <p>{{ errorMessage }}</p>
          <div class="error-actions">
            <button class="btn-primary" (click)="retryLoading()">
              <i class="fas fa-redo"></i>
              Réessayer
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isLoading && !hasError">
        <!-- Header -->
        <div class="social-header">
          <h1>
            <i class="fas fa-users"></i>
            Espace Social
          </h1>
          <p>Connectez-vous avec vos amis et relevez des défis ensemble</p>
          <div class="user-info" *ngIf="currentUser">
            <span>Connecté en tant que {{ currentUser.name || currentUser.email }}</span>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="social-nav">
          <button 
            class="nav-tab"
            [class.active]="activeTab === 'feed'"
            (click)="setActiveTab('feed')">
            <i class="fas fa-home"></i>
            Fil d'actualité
          </button>
          <button 
            class="nav-tab"
            [class.active]="activeTab === 'friends'"
            (click)="setActiveTab('friends')">
            <i class="fas fa-user-friends"></i>
            Amis
            <span class="badge" *ngIf="friendRequestsCount > 0">{{ friendRequestsCount }}</span>
          </button>
        </div>

        <!-- Content Area -->
        <div class="social-content">
          <!-- Social Feed -->
          <div *ngIf="activeTab === 'feed'" class="tab-content">
            <app-social-feed></app-social-feed>
          </div>

          <!-- Friends Management -->
          <div *ngIf="activeTab === 'friends'" class="tab-content">
            <app-friends-manager></app-friends-manager>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .social-container {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .loading-state, .error-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      text-align: center;
      color: #6c757d;
    }

    .loading-spinner, .error-content {
      max-width: 400px;
      padding: 2rem;
    }

    .loading-spinner i {
      color: #007bff;
      margin-bottom: 1rem;
    }

    .loading-spinner h3 {
      margin: 1rem 0 0.5rem 0;
      color: #495057;
    }

    .loading-spinner p {
      margin: 0;
      font-size: 0.9rem;
    }

    .error-content i {
      color: #dc3545;
      margin-bottom: 1rem;
    }

    .error-content h3 {
      margin: 1rem 0 0.5rem 0;
      color: #495057;
    }

    .error-content p {
      margin: 0 0 2rem 0;
      font-size: 0.9rem;
    }

    .btn-primary {
      padding: 0.75rem 1.5rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }

    .social-header {
      background: white;
      padding: 2rem;
      border-bottom: 1px solid #e9ecef;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .social-header h1 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .social-header p {
      margin: 0 0 0.5rem 0;
      color: #6c757d;
      font-size: 1.1rem;
    }

    .user-info {
      color: #007bff;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .social-nav {
      background: white;
      padding: 0 2rem;
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .nav-tab {
      background: none;
      border: none;
      padding: 1rem 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6c757d;
      font-weight: 500;
      border-bottom: 3px solid transparent;
      transition: all 0.2s ease;
      position: relative;
    }

    .nav-tab:hover {
      color: #007bff;
      background: #f8f9fa;
    }

    .nav-tab.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .badge {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 1.5rem;
      text-align: center;
    }

    .social-content {
      padding: 2rem;
    }

    .tab-content {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .social-header {
        padding: 1rem;
      }

      .social-nav {
        padding: 0 1rem;
        overflow-x: auto;
      }

      .nav-tab {
        padding: 0.75rem 1rem;
        white-space: nowrap;
      }

      .social-content {
        padding: 1rem;
      }

      .loading-state, .error-state {
        min-height: 50vh;
        padding: 1rem;
      }

      .loading-spinner, .error-content {
        padding: 1rem;
      }
    }
  `]
})
export class SocialComponent implements OnInit {
  activeTab: string = 'feed';
  friendRequestsCount: number = 0;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  currentUser: any = null;

  constructor(
    private friendService: FriendService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    // Verify authentication first
    if (!this.jwtService.isTokenValid()) {
      this.hasError = true;
      this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
      this.isLoading = false;
      return;
    }

    // Get current user info
    this.currentUser = {
      id: this.jwtService.getUserId(),
      name: this.jwtService.getUserName(),
      email: this.jwtService.getEmail()
    };

    // Load notification counts with error handling
    this.loadNotificationCounts();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  private loadNotificationCounts(): void {
    try {
      // Load friend requests count with error handling
      this.friendService.friendRequests$.pipe(
        catchError(error => {
          console.warn('Erreur lors du chargement des demandes d\'amitié:', error);
          return of([]);
        })
      ).subscribe(requests => {
        this.friendRequestsCount = requests.length;
        this.isLoading = false;
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des services sociaux:', error);
      this.hasError = true;
      this.errorMessage = 'Erreur lors du chargement des données sociales.';
      this.isLoading = false;
    }
  }

  retryLoading(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.initializeComponent();
  }
}