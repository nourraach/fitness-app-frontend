import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { FriendService } from '../../../services/friend.service';
import { UserSearchResult, FriendshipStatus } from '../../../models/friend.model';

@Component({
  selector: 'app-user-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="user-search-container">
      <!-- Search Header -->
      <div class="search-header">
        <h2>
          <i class="fas fa-search"></i>
          Rechercher des amis
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
            (input)="onSearchInput()"
            placeholder="Rechercher par nom ou email..."
            class="search-input"
            [disabled]="isSearching">
          <button 
            *ngIf="searchQuery"
            (click)="clearSearch()"
            class="clear-btn"
            type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isSearching" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <span>Recherche en cours...</span>
      </div>

      <!-- Search Results -->
      <div *ngIf="searchResults.length > 0 && !isSearching" class="search-results">
        <h3>Résultats de recherche ({{ searchResults.length }})</h3>
        
        <div class="results-list">
          <div 
            *ngFor="let result of searchResults; trackBy: trackByUserId"
            class="user-result-card"
            [class.friend]="result.friendshipStatus === 'FRIENDS'">
            
            <!-- User Avatar -->
            <div class="user-avatar">
              <div class="avatar-circle" [style.background]="getAvatarColor(result.user.nom)">
                {{ result.user.nom.charAt(0).toUpperCase() }}
              </div>
              <div class="online-indicator" *ngIf="result.user.isOnline"></div>
            </div>

            <!-- User Info -->
            <div class="user-info">
              <div class="user-header">
                <h4 class="user-name">{{ result.user.nom }}</h4>
                <span class="user-email">{{ result.user.email }}</span>
              </div>
              
              <div class="user-stats">
                <div class="stat-item">
                  <i class="fas fa-dumbbell"></i>
                  <span>{{ result.user.totalWorkouts || 0 }} entraînements</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-fire"></i>
                  <span>{{ result.user.totalCalories || 0 }} calories</span>
                </div>
                <div class="stat-item" *ngIf="result.mutualFriends && result.mutualFriends > 0">
                  <i class="fas fa-users"></i>
                  <span>{{ result.mutualFriends }} amis en commun</span>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="user-actions">
              <button 
                *ngIf="result.friendshipStatus === 'NOT_FRIENDS'"
                (click)="sendFriendRequest(result.user.id)"
                class="action-btn add-friend-btn"
                [disabled]="isProcessing">
                <i class="fas fa-user-plus"></i>
                Ajouter
              </button>

              <button 
                *ngIf="result.friendshipStatus === 'REQUEST_SENT'"
                class="action-btn request-sent-btn"
                disabled>
                <i class="fas fa-clock"></i>
                Demande envoyée
              </button>

              <button 
                *ngIf="result.friendshipStatus === 'REQUEST_RECEIVED'"
                (click)="acceptFriendRequest(result.user.id)"
                class="action-btn accept-btn"
                [disabled]="isProcessing">
                <i class="fas fa-check"></i>
                Accepter
              </button>

              <button 
                *ngIf="result.friendshipStatus === 'FRIENDS'"
                class="action-btn friends-btn"
                disabled>
                <i class="fas fa-check-circle"></i>
                Amis
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Results -->
      <div *ngIf="searchQuery && searchResults.length === 0 && !isSearching" class="no-results">
        <i class="fas fa-search fa-3x"></i>
        <h3>Aucun résultat trouvé</h3>
        <p>Essayez avec un autre nom ou email</p>
      </div>

      <!-- Initial State -->
      <div *ngIf="!searchQuery && !isSearching" class="initial-state">
        <i class="fas fa-users fa-4x"></i>
        <h3>Recherchez des amis</h3>
        <p>Tapez un nom ou un email pour commencer votre recherche</p>
        
        <!-- Quick Suggestions -->
        <div class="quick-suggestions" *ngIf="suggestions.length > 0">
          <h4>Suggestions pour vous</h4>
          <div class="suggestions-list">
            <div 
              *ngFor="let suggestion of suggestions.slice(0, 3)"
              class="suggestion-card"
              (click)="searchUser(suggestion.nom)">
              <div class="suggestion-avatar">
                {{ suggestion.nom.charAt(0).toUpperCase() }}
              </div>
              <div class="suggestion-info">
                <span class="suggestion-name">{{ suggestion.nom }}</span>
                <span class="suggestion-detail">{{ suggestion.totalWorkouts }} entraînements</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-search-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
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
      border-radius: 25px;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    .clear-btn {
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

    .clear-btn:hover {
      background: #f8f9fa;
    }

    .loading-state {
      text-align: center;
      padding: 2rem;
      color: #6c757d;
    }

    .loading-state i {
      margin-right: 0.5rem;
    }

    .search-results h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-result-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .user-result-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }

    .user-result-card.friend {
      border-color: #28a745;
      background: #f8fff9;
    }

    .user-avatar {
      position: relative;
      margin-right: 1rem;
    }

    .avatar-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .online-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 16px;
      height: 16px;
      background: #28a745;
      border: 3px solid white;
      border-radius: 50%;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-header {
      margin-bottom: 0.5rem;
    }

    .user-name {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .user-email {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .user-stats {
      display: flex;
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

    .user-actions {
      margin-left: 1rem;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .add-friend-btn {
      background: #007bff;
      color: white;
    }

    .add-friend-btn:hover:not(:disabled) {
      background: #0056b3;
      transform: scale(1.05);
    }

    .request-sent-btn {
      background: #ffc107;
      color: #212529;
    }

    .accept-btn {
      background: #28a745;
      color: white;
    }

    .accept-btn:hover:not(:disabled) {
      background: #1e7e34;
      transform: scale(1.05);
    }

    .friends-btn {
      background: #e9ecef;
      color: #6c757d;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .no-results, .initial-state {
      text-align: center;
      padding: 3rem 2rem;
      color: #6c757d;
    }

    .no-results i, .initial-state i {
      color: #dee2e6;
      margin-bottom: 1rem;
    }

    .no-results h3, .initial-state h3 {
      margin: 0 0 0.5rem 0;
      color: #495057;
    }

    .quick-suggestions {
      margin-top: 2rem;
      text-align: left;
    }

    .quick-suggestions h4 {
      margin: 0 0 1rem 0;
      color: #495057;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .suggestion-card {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #e9ecef;
    }

    .suggestion-card:hover {
      background: #f8f9fa;
      transform: translateX(4px);
    }

    .suggestion-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      margin-right: 1rem;
    }

    .suggestion-info {
      display: flex;
      flex-direction: column;
    }

    .suggestion-name {
      font-weight: 600;
      color: #2c3e50;
    }

    .suggestion-detail {
      font-size: 0.85rem;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .user-search-container {
        padding: 1rem;
      }

      .user-result-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .user-actions {
        margin-left: 0;
      }

      .user-stats {
        justify-content: center;
      }
    }
  `]
})
export class UserSearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  searchResults: UserSearchResult[] = [];
  suggestions: any[] = [];
  isSearching: boolean = false;
  isProcessing: boolean = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });

    // Load suggestions
    this.loadSuggestions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
  }

  searchUser(name: string): void {
    this.searchQuery = name;
    this.onSearchInput();
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;
    this.friendService.searchUsers(query).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isSearching = false;
      },
      error: (error) => {
        console.error('Search error:', error);
        this.searchResults = [];
        this.isSearching = false;
      }
    });
  }

  private loadSuggestions(): void {
    // In a real app, this would come from the friend service
    this.suggestions = [
      { nom: 'Sarah Johnson', totalWorkouts: 45 },
      { nom: 'Mike Thompson', totalWorkouts: 32 },
      { nom: 'Emma Wilson', totalWorkouts: 67 }
    ];
  }

  sendFriendRequest(userId: number): void {
    this.isProcessing = true;
    this.friendService.sendFriendRequest(userId).subscribe({
      next: () => {
        // Update the result status
        const result = this.searchResults.find(r => r.user.id === userId);
        if (result) {
          result.friendshipStatus = FriendshipStatus.REQUEST_SENT;
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error sending friend request:', error);
        this.isProcessing = false;
      }
    });
  }

  acceptFriendRequest(userId: number): void {
    this.isProcessing = true;
    // Find the request ID (in a real app, this would be stored)
    // For now, we'll use a mock implementation
    this.friendService.acceptFriendRequest(1).subscribe({
      next: () => {
        const result = this.searchResults.find(r => r.user.id === userId);
        if (result) {
          result.friendshipStatus = FriendshipStatus.FRIENDS;
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error accepting friend request:', error);
        this.isProcessing = false;
      }
    });
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

  trackByUserId(index: number, result: UserSearchResult): number {
    return result.user.id;
  }
}