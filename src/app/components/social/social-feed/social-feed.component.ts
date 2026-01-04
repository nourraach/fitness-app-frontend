import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FriendService } from '../../../services/friend.service';
import { SocialActivity } from '../../../models/friend.model';

@Component({
  selector: 'app-social-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="social-feed-container">
      <!-- Feed Header -->
      <div class="feed-header">
        <h2>
          <i class="fas fa-home"></i>
          Fil d'actualité
        </h2>
        <div class="feed-actions">
          <button class="refresh-btn" (click)="refreshFeed()" [disabled]="isLoading">
            <i class="fas fa-sync-alt" [class.fa-spin]="isLoading"></i>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Activity Filters -->
      <div class="activity-filters">
        <button 
          class="filter-btn"
          [class.active]="activeFilter === 'all'"
          (click)="setFilter('all')">
          <i class="fas fa-globe"></i>
          Tout
        </button>
        <button 
          class="filter-btn"
          [class.active]="activeFilter === 'workout'"
          (click)="setFilter('workout')">
          <i class="fas fa-dumbbell"></i>
          Entraînements
        </button>
        <button 
          class="filter-btn"
          [class.active]="activeFilter === 'achievement'"
          (click)="setFilter('achievement')">
          <i class="fas fa-trophy"></i>
          Achievements
        </button>
        <button 
          class="filter-btn"
          [class.active]="activeFilter === 'friend_added'"
          (click)="setFilter('friend_added')">
          <i class="fas fa-user-plus"></i>
          Nouveaux amis
        </button>
      </div>

      <!-- Activities Feed -->
      <div class="activities-feed">
        <div 
          *ngFor="let activity of filteredActivities; trackBy: trackByActivityId"
          class="activity-card"
          [class.liked]="activity.hasLiked">
          
          <!-- Activity Header -->
          <div class="activity-header">
            <div class="user-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(activity.userInfo.nom)">
                {{ activity.userInfo.nom.charAt(0).toUpperCase() }}
              </div>
              <div class="activity-type-badge" [class]="'type-' + activity.type">
                <i [class]="getActivityIcon(activity.type)"></i>
              </div>
            </div>
            
            <div class="activity-info">
              <div class="user-name">{{ activity.userInfo.nom }}</div>
              <div class="activity-time">{{ formatActivityTime(activity.createdAt) }}</div>
            </div>

            <div class="activity-menu">
              <button class="menu-btn" (click)="toggleMenu(activity.id)">
                <i class="fas fa-ellipsis-h"></i>
              </button>
            </div>
          </div>

          <!-- Activity Content -->
          <div class="activity-content">
            <h3 class="activity-title">{{ activity.title }}</h3>
            <p class="activity-description">{{ activity.description }}</p>
            
            <!-- Activity Stats (for workout activities) -->
            <div *ngIf="activity.type === 'workout'" class="activity-stats">
              <div class="stat-item">
                <i class="fas fa-clock"></i>
                <span>{{ extractDuration(activity.description) }}</span>
              </div>
              <div class="stat-item">
                <i class="fas fa-fire"></i>
                <span>{{ extractCalories(activity.description) }}</span>
              </div>
            </div>

            <!-- Achievement Badge -->
            <div *ngIf="activity.type === 'achievement'" class="achievement-badge">
              <i class="fas fa-medal"></i>
              <span>Nouvel Achievement!</span>
            </div>
          </div>

          <!-- Activity Actions -->
          <div class="activity-actions">
            <button 
              class="action-btn like-btn"
              [class.liked]="activity.hasLiked"
              (click)="toggleLike(activity.id)"
              [disabled]="isProcessingLike">
              <i class="fas fa-heart"></i>
              <span>{{ activity.likes }}</span>
            </button>
            
            <button class="action-btn comment-btn" (click)="openComments(activity.id)">
              <i class="fas fa-comment"></i>
              <span>{{ activity.comments }}</span>
            </button>
            
            <button class="action-btn share-btn" (click)="shareActivity(activity.id)">
              <i class="fas fa-share"></i>
              Partager
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="filteredActivities.length === 0 && !isLoading" class="empty-feed">
        <i class="fas fa-rss fa-4x"></i>
        <h3>Aucune activité pour le moment</h3>
        <p>Suivez des amis ou créez du contenu pour voir des activités ici !</p>
        <div class="empty-actions">
          <button class="btn-primary" (click)="goToFriends()">
            <i class="fas fa-user-plus"></i>
            Trouver des amis
          </button>
          <button class="btn-secondary" (click)="createActivity()">
            <i class="fas fa-plus"></i>
            Créer une activité
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Chargement du fil d'actualité...</p>
        </div>
      </div>

      <!-- Load More Button -->
      <div *ngIf="hasMoreActivities && !isLoading" class="load-more-container">
        <button class="load-more-btn" (click)="loadMoreActivities()">
          <i class="fas fa-chevron-down"></i>
          Charger plus d'activités
        </button>
      </div>
    </div>
  `,
  styles: [`
    .social-feed-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .feed-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e9ecef;
    }

    .feed-header h2 {
      margin: 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .refresh-btn {
      padding: 0.5rem 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .activity-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .filter-btn {
      padding: 0.75rem 1rem;
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 25px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6c757d;
      font-weight: 500;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .filter-btn:hover {
      border-color: #007bff;
      color: #007bff;
    }

    .filter-btn.active {
      background: #007bff;
      border-color: #007bff;
      color: white;
    }

    .activities-feed {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .activity-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .activity-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .activity-card.liked {
      border-color: #dc3545;
    }

    .activity-header {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f8f9fa;
    }

    .user-avatar {
      position: relative;
      margin-right: 1rem;
    }

    .avatar-circle {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.2rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .activity-type-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      font-size: 0.75rem;
    }

    .type-workout {
      background: #007bff;
      color: white;
    }

    .type-achievement {
      background: #ffc107;
      color: #212529;
    }

    .type-friend_added {
      background: #28a745;
      color: white;
    }

    .type-challenge_completed {
      background: #dc3545;
      color: white;
    }

    .activity-info {
      flex: 1;
    }

    .user-name {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .activity-time {
      color: #6c757d;
      font-size: 0.85rem;
    }

    .menu-btn {
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .menu-btn:hover {
      background: #f8f9fa;
      color: #495057;
    }

    .activity-content {
      padding: 1.5rem;
    }

    .activity-title {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .activity-description {
      margin: 0 0 1rem 0;
      color: #495057;
      line-height: 1.5;
    }

    .activity-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .stat-item i {
      color: #007bff;
    }

    .achievement-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .activity-actions {
      display: flex;
      align-items: center;
      padding: 1rem 1.5rem;
      border-top: 1px solid #f8f9fa;
      gap: 1rem;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6c757d;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #f8f9fa;
      color: #495057;
    }

    .like-btn.liked {
      color: #dc3545;
      background: #fff5f5;
    }

    .like-btn.liked i {
      animation: heartBeat 0.6s ease;
    }

    @keyframes heartBeat {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .empty-feed {
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
    }

    .empty-feed i {
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .empty-feed h3 {
      margin: 0 0 1rem 0;
      color: #495057;
    }

    .empty-feed p {
      margin: 0 0 2rem 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .empty-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-primary, .btn-secondary {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
    }

    .loading-spinner p {
      margin: 1rem 0 0 0;
    }

    .load-more-container {
      text-align: center;
      margin-top: 2rem;
    }

    .load-more-btn {
      padding: 1rem 2rem;
      background: white;
      border: 2px solid #007bff;
      color: #007bff;
      border-radius: 25px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .load-more-btn:hover {
      background: #007bff;
      color: white;
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .social-feed-container {
        padding: 1rem 0.5rem;
      }

      .feed-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .activity-filters {
        justify-content: center;
      }

      .activity-header {
        padding: 1rem;
      }

      .activity-content {
        padding: 1rem;
      }

      .activity-actions {
        padding: 1rem;
        justify-content: space-around;
      }

      .empty-actions {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class SocialFeedComponent implements OnInit, OnDestroy {
  activities: SocialActivity[] = [];
  filteredActivities: SocialActivity[] = [];
  activeFilter: string = 'all';
  isLoading: boolean = false;
  isProcessingLike: boolean = false;
  hasMoreActivities: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    this.loadFeed();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFeed(): void {
    this.isLoading = true;
    
    this.friendService.socialFeed$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(activities => {
      this.activities = activities;
      this.applyFilter();
      this.isLoading = false;
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter(): void {
    if (this.activeFilter === 'all') {
      this.filteredActivities = [...this.activities];
    } else {
      this.filteredActivities = this.activities.filter(activity => 
        activity.type === this.activeFilter
      );
    }
  }

  refreshFeed(): void {
    this.loadFeed();
  }

  toggleLike(activityId: number): void {
    if (this.isProcessingLike) return;
    
    this.isProcessingLike = true;
    this.friendService.likeActivity(activityId).subscribe({
      next: () => {
        // Update the activity in the list
        const activity = this.activities.find(a => a.id === activityId);
        if (activity) {
          activity.hasLiked = !activity.hasLiked;
          activity.likes += activity.hasLiked ? 1 : -1;
        }
        this.applyFilter();
        this.isProcessingLike = false;
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        this.isProcessingLike = false;
      }
    });
  }

  toggleMenu(activityId: number): void {
    console.log('Toggle menu for activity:', activityId);
  }

  openComments(activityId: number): void {
    console.log('Open comments for activity:', activityId);
  }

  shareActivity(activityId: number): void {
    console.log('Share activity:', activityId);
  }

  goToFriends(): void {
    console.log('Navigate to friends');
  }

  createActivity(): void {
    console.log('Create new activity');
  }

  loadMoreActivities(): void {
    console.log('Load more activities');
    // In a real app, this would load more activities from the server
    this.hasMoreActivities = false;
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'workout': 'fas fa-dumbbell',
      'achievement': 'fas fa-trophy',
      'friend_added': 'fas fa-user-plus',
      'challenge_completed': 'fas fa-medal'
    };
    return icons[type] || 'fas fa-circle';
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  formatActivityTime(date: Date): string {
    const now = new Date();
    const activityDate = new Date(date);
    const diff = now.getTime() - activityDate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return activityDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  }

  extractDuration(description: string): string {
    const match = description.match(/(\d+)\s*min/);
    return match ? `${match[1]} min` : '';
  }

  extractCalories(description: string): string {
    const match = description.match(/(\d+)\s*cal/);
    return match ? `${match[1]} cal` : '';
  }

  trackByActivityId(index: number, activity: SocialActivity): number {
    return activity.id;
  }
}