import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FriendService } from '../../../services/friend.service';
import { User, FriendRequest, SocialNotification } from '../../../models/friend.model';

@Component({
  selector: 'app-friends-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="friends-manager-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'friends'"
          (click)="setActiveTab('friends')">
          <i class="fas fa-users"></i>
          Mes Amis
          <span class="count-badge" *ngIf="friends.length > 0">{{ friends.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'requests'"
          (click)="setActiveTab('requests')">
          <i class="fas fa-user-clock"></i>
          Demandes
          <span class="count-badge notification" *ngIf="friendRequests.length > 0">{{ friendRequests.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'suggestions'"
          (click)="setActiveTab('suggestions')">
          <i class="fas fa-user-plus"></i>
          Suggestions
        </button>
      </div>

      <!-- Friends List Tab -->
      <div *ngIf="activeTab === 'friends'" class="tab-content">
        <div class="section-header">
          <h3>
            <i class="fas fa-users"></i>
            Mes Amis ({{ friends.length }})
          </h3>
          <div class="header-actions">
            <button class="btn-secondary" (click)="refreshFriends()">
              <i class="fas fa-sync-alt" [class.fa-spin]="isLoading"></i>
              Actualiser
            </button>
          </div>
        </div>

        <!-- Friends Grid -->
        <div *ngIf="friends.length > 0" class="friends-grid">
          <div 
            *ngFor="let friend of friends; trackBy: trackByUserId"
            class="friend-card">
            
            <!-- Friend Avatar -->
            <div class="friend-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(friend.nom)">
                {{ friend.nom.charAt(0).toUpperCase() }}
              </div>
              <div class="online-status" [class.online]="friend.isOnline" [class.offline]="!friend.isOnline">
                <i class="fas fa-circle"></i>
              </div>
            </div>

            <!-- Friend Info -->
            <div class="friend-info">
              <h4 class="friend-name">{{ friend.nom }}</h4>
              <p class="friend-status" *ngIf="friend.isOnline">En ligne</p>
              <p class="friend-status offline" *ngIf="!friend.isOnline && friend.lastSeen">
                Vu {{ formatLastSeen(friend.lastSeen) }}
              </p>
              
              <!-- Friend Stats -->
              <div class="friend-stats">
                <div class="stat-item">
                  <i class="fas fa-dumbbell"></i>
                  <span>{{ friend.totalWorkouts || 0 }}</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-fire"></i>
                  <span>{{ friend.totalCalories || 0 }}</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-calendar"></i>
                  <span>{{ formatJoinDate(friend.joinDate) }}</span>
                </div>
              </div>
            </div>

            <!-- Friend Actions -->
            <div class="friend-actions">
              <button class="action-btn message-btn" (click)="openMessage(friend.id)" title="Envoyer un message">
                <i class="fas fa-comment"></i>
              </button>
              <button class="action-btn challenge-btn" (click)="createChallenge(friend.id)" title="Créer un défi">
                <i class="fas fa-trophy"></i>
              </button>
              <button class="action-btn remove-btn" (click)="removeFriend(friend.id)" title="Supprimer ami">
                <i class="fas fa-user-minus"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty Friends State -->
        <div *ngIf="friends.length === 0 && !isLoading" class="empty-state">
          <i class="fas fa-users fa-4x"></i>
          <h3>Aucun ami pour le moment</h3>
          <p>Commencez à rechercher et ajouter des amis pour créer votre réseau fitness !</p>
          <button class="btn-primary" (click)="goToSearch()">
            <i class="fas fa-search"></i>
            Rechercher des amis
          </button>
        </div>
      </div>

      <!-- Friend Requests Tab -->
      <div *ngIf="activeTab === 'requests'" class="tab-content">
        <div class="section-header">
          <h3>
            <i class="fas fa-user-clock"></i>
            Demandes d'amitié ({{ friendRequests.length }})
          </h3>
        </div>

        <!-- Requests List -->
        <div *ngIf="friendRequests.length > 0" class="requests-list">
          <div 
            *ngFor="let request of friendRequests; trackBy: trackByRequestId"
            class="request-card">
            
            <!-- Sender Info -->
            <div class="request-sender">
              <div class="sender-avatar">
                <div class="avatar-circle" [style.background]="getAvatarColor(request.senderInfo.nom)">
                  {{ request.senderInfo.nom.charAt(0).toUpperCase() }}
                </div>
              </div>
              
              <div class="sender-info">
                <h4 class="sender-name">{{ request.senderInfo.nom }}</h4>
                <p class="sender-email">{{ request.senderInfo.email }}</p>
                <p class="request-time">{{ formatRequestTime(request.createdAt) }}</p>
                
                <!-- Sender Stats -->
                <div class="sender-stats">
                  <span class="stat">{{ request.senderInfo.totalWorkouts || 0 }} entraînements</span>
                  <span class="stat">{{ request.senderInfo.totalCalories || 0 }} calories</span>
                </div>
              </div>
            </div>

            <!-- Request Actions -->
            <div class="request-actions">
              <button 
                class="action-btn accept-btn"
                (click)="acceptRequest(request.id)"
                [disabled]="isProcessing">
                <i class="fas fa-check"></i>
                Accepter
              </button>
              <button 
                class="action-btn decline-btn"
                (click)="declineRequest(request.id)"
                [disabled]="isProcessing">
                <i class="fas fa-times"></i>
                Refuser
              </button>
            </div>
          </div>
        </div>

        <!-- Empty Requests State -->
        <div *ngIf="friendRequests.length === 0 && !isLoading" class="empty-state">
          <i class="fas fa-user-clock fa-4x"></i>
          <h3>Aucune demande d'amitié</h3>
          <p>Les nouvelles demandes d'amitié apparaîtront ici.</p>
        </div>
      </div>

      <!-- Suggestions Tab -->
      <div *ngIf="activeTab === 'suggestions'" class="tab-content">
        <div class="section-header">
          <h3>
            <i class="fas fa-user-plus"></i>
            Suggestions d'amis
          </h3>
          <p class="section-description">Basées sur vos amis et vos intérêts fitness</p>
        </div>

        <!-- Suggestions Grid -->
        <div class="suggestions-grid">
          <div 
            *ngFor="let suggestion of suggestions; trackBy: trackByUserId"
            class="suggestion-card">
            
            <div class="suggestion-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(suggestion.nom)">
                {{ suggestion.nom.charAt(0).toUpperCase() }}
              </div>
            </div>

            <div class="suggestion-info">
              <h4 class="suggestion-name">{{ suggestion.nom }}</h4>
              <p class="suggestion-reason">{{ getSuggestionReason(suggestion) }}</p>
              
              <div class="suggestion-stats">
                <span class="stat">{{ suggestion.totalWorkouts || 0 }} entraînements</span>
              </div>
            </div>

            <div class="suggestion-actions">
              <button 
                class="action-btn add-btn"
                (click)="sendFriendRequest(suggestion.id)"
                [disabled]="isProcessing">
                <i class="fas fa-user-plus"></i>
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="spinner">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p>Chargement...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .friends-manager-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      position: relative;
    }

    .tab-navigation {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e9ecef;
    }

    .tab-btn {
      padding: 1rem 1.5rem;
      background: none;
      border: none;
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

    .tab-btn:hover {
      color: #007bff;
      background: #f8f9fa;
    }

    .tab-btn.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .count-badge {
      background: #6c757d;
      color: white;
      border-radius: 50%;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 1.5rem;
      text-align: center;
    }

    .count-badge.notification {
      background: #dc3545;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .section-header h3 {
      margin: 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-description {
      margin: 0.5rem 0 0 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-secondary {
      padding: 0.5rem 1rem;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    .btn-primary {
      padding: 1rem 2rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .btn-primary:hover {
      background: #0056b3;
      transform: translateY(-2px);
    }

    .friends-grid, .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .friend-card, .suggestion-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .friend-card:hover, .suggestion-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      border-color: #007bff;
    }

    .friend-avatar, .suggestion-avatar {
      position: relative;
      margin-bottom: 1rem;
      text-align: center;
    }

    .avatar-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 2rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .online-status {
      position: absolute;
      bottom: 5px;
      right: calc(50% - 45px);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .online-status.online {
      background: #28a745;
      color: #28a745;
    }

    .online-status.offline {
      background: #6c757d;
      color: #6c757d;
    }

    .friend-info, .suggestion-info {
      text-align: center;
      margin-bottom: 1rem;
    }

    .friend-name, .suggestion-name {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .friend-status {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: #28a745;
      font-weight: 500;
    }

    .friend-status.offline {
      color: #6c757d;
    }

    .friend-stats, .suggestion-stats {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #6c757d;
      font-size: 0.85rem;
    }

    .stat-item i {
      color: #007bff;
    }

    .stat {
      color: #6c757d;
      font-size: 0.85rem;
    }

    .friend-actions, .suggestion-actions {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 44px;
    }

    .message-btn {
      background: #007bff;
      color: white;
    }

    .message-btn:hover {
      background: #0056b3;
      transform: scale(1.1);
    }

    .challenge-btn {
      background: #ffc107;
      color: #212529;
    }

    .challenge-btn:hover {
      background: #e0a800;
      transform: scale(1.1);
    }

    .remove-btn {
      background: #dc3545;
      color: white;
    }

    .remove-btn:hover {
      background: #c82333;
      transform: scale(1.1);
    }

    .add-btn {
      background: #28a745;
      color: white;
      padding: 0.75rem 1.5rem;
    }

    .add-btn:hover:not(:disabled) {
      background: #1e7e34;
      transform: scale(1.05);
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .request-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-left: 4px solid #007bff;
    }

    .request-sender {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .sender-avatar .avatar-circle {
      width: 60px;
      height: 60px;
      font-size: 1.5rem;
    }

    .sender-info {
      flex: 1;
    }

    .sender-name {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .sender-email {
      margin: 0 0 0.25rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .request-time {
      margin: 0 0 0.5rem 0;
      color: #6c757d;
      font-size: 0.85rem;
    }

    .sender-stats {
      display: flex;
      gap: 1rem;
    }

    .request-actions {
      display: flex;
      gap: 0.5rem;
    }

    .accept-btn {
      background: #28a745;
      color: white;
      padding: 0.75rem 1.5rem;
    }

    .accept-btn:hover:not(:disabled) {
      background: #1e7e34;
    }

    .decline-btn {
      background: #dc3545;
      color: white;
      padding: 0.75rem 1.5rem;
    }

    .decline-btn:hover:not(:disabled) {
      background: #c82333;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
    }

    .empty-state i {
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 1rem 0;
      color: #495057;
    }

    .empty-state p {
      margin: 0 0 2rem 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .spinner {
      text-align: center;
      color: #007bff;
    }

    .spinner p {
      margin: 1rem 0 0 0;
    }

    @media (max-width: 768px) {
      .friends-manager-container {
        padding: 1rem;
      }

      .friends-grid, .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .request-card {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .request-sender {
        flex-direction: column;
        text-align: center;
      }

      .sender-stats {
        justify-content: center;
      }
    }
  `]
})
export class FriendsManagerComponent implements OnInit, OnDestroy {
  activeTab: string = 'friends';
  friends: User[] = [];
  friendRequests: FriendRequest[] = [];
  suggestions: User[] = [];
  isLoading: boolean = false;
  isProcessing: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (tab === 'suggestions' && this.suggestions.length === 0) {
      this.loadSuggestions();
    }
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load friends
    this.friendService.friends$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(friends => {
      this.friends = friends;
      this.isLoading = false;
    });

    // Load friend requests
    this.friendService.friendRequests$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(requests => {
      this.friendRequests = requests;
    });
  }

  private loadSuggestions(): void {
    // Mock suggestions - in real app, this would come from the service
    this.suggestions = [
      {
        id: 6,
        nom: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com',
        isOnline: false,
        totalWorkouts: 28,
        totalCalories: 7600,
        joinDate: new Date('2024-03-10'),
        isPublic: true
      },
      {
        id: 7,
        nom: 'Lisa Chen',
        email: 'lisa.chen@email.com',
        isOnline: true,
        totalWorkouts: 52,
        totalCalories: 14200,
        joinDate: new Date('2023-12-05'),
        isPublic: true
      }
    ];
  }

  refreshFriends(): void {
    this.loadData();
  }

  acceptRequest(requestId: number): void {
    this.isProcessing = true;
    this.friendService.acceptFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.refreshFriends();
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error accepting request:', error);
        this.isProcessing = false;
      }
    });
  }

  declineRequest(requestId: number): void {
    this.isProcessing = true;
    this.friendService.declineFriendRequest(requestId).subscribe({
      next: () => {
        this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error declining request:', error);
        this.isProcessing = false;
      }
    });
  }

  sendFriendRequest(userId: number): void {
    this.isProcessing = true;
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.suggestions = this.suggestions.filter(s => s.id !== userId);
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error sending friend request:', error);
        this.isProcessing = false;
      }
    });
  }

  removeFriend(friendId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet ami ?')) {
      this.friendService.removeFriend(friendId).subscribe({
        next: () => {
          this.friends = this.friends.filter(f => f.id !== friendId);
        },
        error: (error) => {
          console.error('Error removing friend:', error);
        }
      });
    }
  }

  openMessage(friendId: number): void {
    // Navigate to messaging with this friend
    console.log('Open message with friend:', friendId);
  }

  createChallenge(friendId: number): void {
    // Navigate to challenge creation with this friend
    console.log('Create challenge with friend:', friendId);
  }

  goToSearch(): void {
    // Navigate to user search
    console.log('Navigate to user search');
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

  formatLastSeen(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'à l\'instant';
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  }

  formatJoinDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    });
  }

  formatRequestTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'À l\'instant';
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }

  getSuggestionReason(user: User): string {
    const reasons = [
      'Ami d\'un ami',
      'Objectifs similaires',
      'Même région',
      'Activités communes'
    ];
    return reasons[user.id % reasons.length];
  }

  trackByUserId(index: number, user: User): number {
    return user.id;
  }

  trackByRequestId(index: number, request: FriendRequest): number {
    return request.id;
  }
}