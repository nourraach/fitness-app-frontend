import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FriendService } from '../../services/friend.service';
import { UserSearchResult, FriendshipStatus } from '../../models/friend.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-search-container">
      <div class="search-header">
        <h2>
          <i class="fas fa-search"></i>
          Rechercher des utilisateurs
        </h2>
        <p>Trouvez et connectez-vous avec d'autres utilisateurs</p>
      </div>

      <!-- Search Input -->
      <div class="search-input-container">
        <div class="search-input-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (input)="onSearchInput($event)"
            placeholder="Rechercher par nom ou email..."
            class="search-input">
          <button 
            *ngIf="searchQuery"
            (click)="clearSearch()"
            class="clear-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Search Results -->
      <div class="search-results" *ngIf="searchResults$ | async as results">
        <div class="results-header" *ngIf="results.length > 0">
          <h3>Résultats de recherche ({{ results.length }})</h3>
        </div>

        <div class="user-list">
          <div 
            *ngFor="let result of results"
            class="user-card"
            [class.friend]="result.friendshipStatus === 'FRIENDS'">
            
            <!-- User Avatar -->
            <div class="user-avatar">
              <img 
                *ngIf="result.user.photo" 
                [src]="result.user.photo" 
                [alt]="result.user.nom"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
              <div class="avatar-placeholder">
                {{ result.user.nom.charAt(0).toUpperCase() }}
              </div>
              <div class="online-indicator" *ngIf="result.user.isOnline"></div>
            </div>

            <!-- User Info -->
            <div class="user-info">
              <div class="user-header">
                <h4 class="user-name">{{ result.user.nom }}</h4>
                <span class="user-status" [ngClass]="getStatusClass(result.user)">
                  {{ getUserStatusText(result.user) }}
                </span>
              </div>
              
              <p class="user-email">{{ result.user.email }}</p>
              
              <div class="user-stats">
                <div class="stat">
                  <i class="fas fa-dumbbell"></i>
                  <span>{{ result.user.totalWorkouts || 0 }} entraînements</span>
                </div>
                <div class="stat">
                  <i class="fas fa-fire"></i>
                  <span>{{ result.user.totalCalories || 0 }} calories</span>
                </div>
                <div class="stat" *ngIf="result.mutualFriends && result.mutualFriends > 0">
                  <i class="fas fa-users"></i>
                  <span>{{ result.mutualFriends }} amis en commun</span>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="user-actions">
              <button 
                class="action-btn"
                [ngClass]="getActionButtonClass(result.friendshipStatus)"
                [disabled]="isActionDisabled(result.friendshipStatus)"
                (click)="handleUserAction(result)">
                <i [class]="getActionButtonIcon(result.friendshipStatus)"></i>
                {{ getActionButtonText(result.friendshipStatus) }}
              </button>
            </div>
          </div>
        </div>

        <!-- No Results -->
        <div *ngIf="results.length === 0 && searchQuery" class="no-results">
          <i class="fas fa-search fa-3x"></i>
          <h3>Aucun utilisateur trouvé</h3>
          <p>Essayez avec un autre nom ou email</p>
        </div>
      </div>

      <!-- Search Suggestions -->
      <div class="search-suggestions" *ngIf="!searchQuery">
        <h3>
          <i class="fas fa-lightbulb"></i>
          Suggestions
        </h3>
        <div class="suggestion-cards">
          <div class="suggestion-card">
            <i class="fas fa-user-plus"></i>
            <h4>Invitez vos amis</h4>
            <p>Partagez votre code d'invitation pour que vos amis vous rejoignent</p>
            <button class="suggestion-btn">
              <i class="fas fa-share"></i>
              Partager
            </button>
          </div>
          <div class="suggestion-card">
            <i class="fas fa-users"></i>
            <h4>Rejoignez des groupes</h4>
            <p>Trouvez des communautés fitness qui partagent vos intérêts</p>
            <button class="suggestion-btn">
              <i class="fas fa-search"></i>
              Explorer
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>Recherche en cours...</p>
      </div>
    </div>
  `,
  styles: [`
    .user-search-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .search-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .search-header h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .search-header p {
      margin: 0;
      color: #6c757d;
    }

    .search-input-container {
      margin-bottom: 2rem;
    }

    .search-input-wrapper {
      position: relative;
      max-width: 500px;
      margin: 0 auto;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #6c757d;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: 2px solid #e9ecef;
      border-radius: 50px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .search-input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    .clear-button {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #6c757d;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
    }

    .clear-button:hover {
      background: #f8f9fa;
      color: #dc3545;
    }

    .results-header {
      margin-bottom: 1rem;
    }

    .results-header h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    .user-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
    }

    .user-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .user-card.friend {
      border-left: 4px solid #28a745;
    }

    .user-avatar {
      position: relative;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.5rem;
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      background: #28a745;
      border: 2px solid white;
      border-radius: 50%;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .user-name {
      margin: 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .user-status {
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .user-status.online {
      background: #d4edda;
      color: #155724;
    }

    .user-status.offline {
      background: #f8d7da;
      color: #721c24;
    }

    .user-email {
      margin: 0 0 0.75rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .user-stats {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #6c757d;
      font-size: 0.85rem;
    }

    .stat i {
      color: #007bff;
    }

    .user-actions {
      flex-shrink: 0;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
    }

    .action-btn.add-friend {
      background: #007bff;
      color: white;
    }

    .action-btn.add-friend:hover {
      background: #0056b3;
      transform: scale(1.05);
    }

    .action-btn.pending {
      background: #ffc107;
      color: #212529;
    }

    .action-btn.friends {
      background: #28a745;
      color: white;
    }

    .action-btn.respond {
      background: #17a2b8;
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .no-results {
      text-align: center;
      padding: 3rem 1rem;
      color: #6c757d;
    }

    .no-results i {
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .no-results h3 {
      margin: 0 0 0.5rem 0;
      color: #495057;
    }

    .search-suggestions {
      margin-top: 2rem;
    }

    .search-suggestions h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .suggestion-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .suggestion-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }

    .suggestion-card i {
      font-size: 2rem;
      color: #007bff;
      margin-bottom: 1rem;
    }

    .suggestion-card h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .suggestion-card p {
      margin: 0 0 1rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .suggestion-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 auto;
      transition: background-color 0.2s ease;
    }

    .suggestion-btn:hover {
      background: #0056b3;
    }

    .loading-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .loading-state i {
      color: #007bff;
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .user-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .user-header {
        justify-content: center;
      }

      .user-stats {
        justify-content: center;
      }

      .suggestion-cards {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserSearchComponent implements OnInit {
  searchQuery: string = '';
  searchResults$!: Observable<UserSearchResult[]>;
  isLoading: boolean = false;
  
  private searchSubject = new Subject<string>();

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchResults$ = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.trim().length < 2) {
          return [];
        }
        this.isLoading = true;
        return this.friendService.searchUsers(query);
      })
    );

    // Subscribe to handle loading state
    this.searchResults$.subscribe(() => {
      this.isLoading = false;
    });
  }

  onSearchInput(event: any): void {
    const query = event.target.value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  handleUserAction(result: UserSearchResult): void {
    switch (result.friendshipStatus) {
      case FriendshipStatus.NOT_FRIENDS:
        this.sendFriendRequest(result.user.id);
        break;
      case FriendshipStatus.REQUEST_RECEIVED:
        // Navigate to friend requests to respond
        break;
      default:
        break;
    }
  }

  private sendFriendRequest(userId: number): void {
    this.friendService.sendFriendRequest(userId).subscribe(success => {
      if (success) {
        // Refresh search results
        this.searchSubject.next(this.searchQuery);
      }
    });
  }

  getStatusClass(user: any): string {
    return user.isOnline ? 'online' : 'offline';
  }

  getUserStatusText(user: any): string {
    if (user.isOnline) {
      return 'En ligne';
    } else if (user.lastSeen) {
      const now = new Date();
      const lastSeen = new Date(user.lastSeen);
      const diffHours = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return 'Vu récemment';
      } else if (diffHours < 24) {
        return `Vu il y a ${diffHours}h`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `Vu il y a ${diffDays}j`;
      }
    }
    return 'Hors ligne';
  }

  getActionButtonClass(status: FriendshipStatus): string {
    switch (status) {
      case FriendshipStatus.NOT_FRIENDS:
        return 'add-friend';
      case FriendshipStatus.REQUEST_SENT:
        return 'pending';
      case FriendshipStatus.REQUEST_RECEIVED:
        return 'respond';
      case FriendshipStatus.FRIENDS:
        return 'friends';
      default:
        return '';
    }
  }

  getActionButtonIcon(status: FriendshipStatus): string {
    switch (status) {
      case FriendshipStatus.NOT_FRIENDS:
        return 'fas fa-user-plus';
      case FriendshipStatus.REQUEST_SENT:
        return 'fas fa-clock';
      case FriendshipStatus.REQUEST_RECEIVED:
        return 'fas fa-reply';
      case FriendshipStatus.FRIENDS:
        return 'fas fa-check';
      default:
        return '';
    }
  }

  getActionButtonText(status: FriendshipStatus): string {
    switch (status) {
      case FriendshipStatus.NOT_FRIENDS:
        return 'Ajouter';
      case FriendshipStatus.REQUEST_SENT:
        return 'Envoyée';
      case FriendshipStatus.REQUEST_RECEIVED:
        return 'Répondre';
      case FriendshipStatus.FRIENDS:
        return 'Ami';
      default:
        return '';
    }
  }

  isActionDisabled(status: FriendshipStatus): boolean {
    return status === FriendshipStatus.REQUEST_SENT || status === FriendshipStatus.FRIENDS;
  }
}