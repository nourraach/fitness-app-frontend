import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FriendChallengeService } from '../../../services/friend-challenge.service';
import { FriendService } from '../../../services/friend.service';
import { 
  FriendChallenge,
  ChallengeParticipant,
  CreateFriendChallengeRequest,
  ChallengeLeaderboard,
  ChallengeObjectiveType,
  ChallengeStatus,
  ChallengeTypeOption
} from '../../../models/friend-challenge.model';
import { User } from '../../../models/friend.model';

@Component({
  selector: 'app-friend-challenges',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="friend-challenges-container">
      <!-- Header -->
      <div class="challenges-header">
        <h1><i class="fas fa-trophy"></i> Défis entre Amis</h1>
        <p>Créez et participez à des défis fitness avec vos amis</p>
        <button class="btn-refresh" (click)="refreshData()" [disabled]="isLoading">
          <i class="fas fa-sync-alt" [class.fa-spin]="isLoading"></i>
          Actualiser
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'my-challenges'"
          (click)="setActiveTab('my-challenges')">
          <i class="fas fa-user-check"></i>
          Mes Défis
          <span class="count-badge" *ngIf="myChallenges.length > 0">{{ myChallenges.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'available'"
          (click)="setActiveTab('available')">
          <i class="fas fa-globe"></i>
          Disponibles
          <span class="count-badge" *ngIf="availableChallenges.length > 0">{{ availableChallenges.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'created'"
          (click)="setActiveTab('created')">
          <i class="fas fa-crown"></i>
          Mes Créations
          <span class="count-badge" *ngIf="createdChallenges.length > 0">{{ createdChallenges.length }}</span>
        </button>
        <button 
          class="tab-btn create-tab"
          [class.active]="activeTab === 'create'"
          (click)="setActiveTab('create')">
          <i class="fas fa-plus"></i>
          Créer un Défi
        </button>
      </div>

      <!-- Content Area -->
      <div class="tab-content">
        <!-- My Challenges Tab -->
        <div *ngIf="activeTab === 'my-challenges'" class="challenges-grid">
          <div *ngIf="isLoading" class="loading-state">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Chargement de vos défis...</p>
          </div>
          
          <div *ngIf="!isLoading && myChallenges.length === 0" class="empty-state">
            <i class="fas fa-trophy fa-3x"></i>
            <h3>Aucun défi en cours</h3>
            <p>Rejoignez un défi existant ou créez le vôtre !</p>
            <button class="btn-primary" (click)="setActiveTab('available')">
              <i class="fas fa-search"></i>
              Voir les défis disponibles
            </button>
          </div>

          <div *ngFor="let challenge of myChallenges" class="challenge-card my-challenge">
            <div class="challenge-header">
              <div class="challenge-type" [style.background]="getChallengeTypeColor(challenge.typeObjectif)">
                <i [class]="getChallengeTypeIcon(challenge.typeObjectif)"></i>
              </div>
              <div class="challenge-info">
                <h3>{{ challenge.nom }}</h3>
                <p class="challenge-creator">Par {{ challenge.createurNom }}</p>
              </div>
              <div class="challenge-status">
                <span class="status-badge" [class]="'status-' + challenge.statut.toLowerCase()">
                  {{ getStatusLabel(challenge.statut) }}
                </span>
              </div>
            </div>

            <div class="challenge-description" *ngIf="challenge.description">
              <p>{{ challenge.description }}</p>
            </div>

            <div class="challenge-progress">
              <div class="progress-info">
                <span class="objective">
                  Objectif: {{ challenge.valeurCible | number }} {{ getChallengeTypeUnit(challenge.typeObjectif) }}
                </span>
                <span class="participants">
                  <i class="fas fa-users"></i>
                  {{ challenge.nombreParticipants }} participants
                </span>
              </div>
              
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="getMyProgress(challenge.id) + '%'"></div>
                </div>
                <span class="progress-text">{{ getMyProgress(challenge.id) }}%</span>
              </div>
            </div>

            <div class="challenge-dates">
              <div class="date-info">
                <i class="fas fa-calendar-alt"></i>
                {{ formatDate(challenge.dateDebut) }} - {{ formatDate(challenge.dateFin) }}
              </div>
              <div class="days-remaining" [class.urgent]="challenge.joursRestants <= 2">
                <i class="fas fa-clock"></i>
                {{ challenge.joursRestants }} jour(s) restant(s)
              </div>
            </div>

            <div class="challenge-actions">
              <button class="btn-secondary" (click)="viewLeaderboard(challenge)">
                <i class="fas fa-chart-bar"></i>
                Classement
              </button>
              <button class="btn-primary" (click)="updateProgress(challenge)">
                <i class="fas fa-plus"></i>
                Mettre à jour
              </button>
            </div>
          </div>
        </div>

        <!-- Available Challenges Tab -->
        <div *ngIf="activeTab === 'available'" class="challenges-grid">
          <div *ngIf="isLoading" class="loading-state">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Chargement des défis disponibles...</p>
          </div>
          
          <div *ngIf="!isLoading && availableChallenges.length === 0" class="empty-state">
            <i class="fas fa-search fa-3x"></i>
            <h3>Aucun défi disponible</h3>
            <p>Soyez le premier à créer un défi en cliquant sur l'onglet "Créer un Défi" !</p>
          </div>

          <div *ngFor="let challenge of availableChallenges" class="challenge-card available-challenge">
            <div class="challenge-header">
              <div class="challenge-type" [style.background]="getChallengeTypeColor(challenge.typeObjectif)">
                <i [class]="getChallengeTypeIcon(challenge.typeObjectif)"></i>
              </div>
              <div class="challenge-info">
                <h3>{{ challenge.nom }}</h3>
                <p class="challenge-creator">Par {{ challenge.createurNom }}</p>
              </div>
              <div class="challenge-status">
                <span class="status-badge status-active">Ouvert</span>
              </div>
            </div>

            <div class="challenge-description" *ngIf="challenge.description">
              <p>{{ challenge.description }}</p>
            </div>

            <div class="challenge-details">
              <div class="detail-item">
                <i class="fas fa-target"></i>
                <span>{{ challenge.valeurCible | number }} {{ getChallengeTypeUnit(challenge.typeObjectif) }}</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-users"></i>
                <span>{{ challenge.nombreParticipants }} participants</span>
              </div>
              <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span>{{ challenge.joursRestants }} jour(s) restant(s)</span>
              </div>
            </div>

            <div class="challenge-dates">
              <i class="fas fa-calendar-alt"></i>
              {{ formatDate(challenge.dateDebut) }} - {{ formatDate(challenge.dateFin) }}
            </div>

            <div class="challenge-actions">
              <button class="btn-secondary" (click)="viewLeaderboard(challenge)">
                <i class="fas fa-chart-bar"></i>
                Voir le classement
              </button>
              <button 
                class="btn-primary" 
                (click)="joinChallenge(challenge)"
                [disabled]="isJoining">
                <i class="fas fa-user-plus" *ngIf="!isJoining"></i>
                <i class="fas fa-spinner fa-spin" *ngIf="isJoining"></i>
                {{ isJoining ? 'Inscription...' : 'Rejoindre' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Created Challenges Tab -->
        <div *ngIf="activeTab === 'created'" class="challenges-grid">
          <div *ngIf="isLoading" class="loading-state">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
            <p>Chargement de vos créations...</p>
          </div>
          
          <div *ngIf="!isLoading && createdChallenges.length === 0" class="empty-state">
            <i class="fas fa-crown fa-3x"></i>
            <h3>Aucun défi créé</h3>
            <p>Créez votre premier défi en cliquant sur l'onglet "Créer un Défi" !</p>
          </div>

          <div *ngFor="let challenge of createdChallenges" class="challenge-card created-challenge">
            <div class="challenge-header">
              <div class="challenge-type" [style.background]="getChallengeTypeColor(challenge.typeObjectif)">
                <i [class]="getChallengeTypeIcon(challenge.typeObjectif)"></i>
              </div>
              <div class="challenge-info">
                <h3>{{ challenge.nom }}</h3>
                <p class="challenge-creator">
                  <i class="fas fa-crown"></i>
                  Créé par vous
                </p>
              </div>
              <div class="challenge-status">
                <span class="status-badge" [class]="'status-' + challenge.statut.toLowerCase()">
                  {{ getStatusLabel(challenge.statut) }}
                </span>
              </div>
            </div>

            <div class="challenge-description" *ngIf="challenge.description">
              <p>{{ challenge.description }}</p>
            </div>

            <div class="challenge-stats">
              <div class="stat-item">
                <i class="fas fa-users"></i>
                <span>{{ challenge.nombreParticipants }} participants</span>
              </div>
              <div class="stat-item">
                <i class="fas fa-calendar-plus"></i>
                <span>Créé le {{ formatDate(challenge.createdAt!) }}</span>
              </div>
              <div class="stat-item" [class.urgent]="challenge.joursRestants <= 2">
                <i class="fas fa-clock"></i>
                <span>{{ challenge.joursRestants }} jour(s) restant(s)</span>
              </div>
            </div>

            <div class="challenge-actions">
              <button class="btn-secondary" (click)="viewLeaderboard(challenge)">
                <i class="fas fa-chart-bar"></i>
                Classement
              </button>
              <button 
                class="btn-danger" 
                (click)="cancelChallenge(challenge)"
                [disabled]="isCancelling"
                *ngIf="challenge.statut === 'ACTIVE'">
                <i class="fas fa-times" *ngIf="!isCancelling"></i>
                <i class="fas fa-spinner fa-spin" *ngIf="isCancelling"></i>
                {{ isCancelling ? 'Annulation...' : 'Annuler' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Create Challenge Tab -->
        <div *ngIf="activeTab === 'create'" class="create-challenge-form">
          <div class="form-header">
            <h2><i class="fas fa-plus-circle"></i> Créer un Nouveau Défi</h2>
            <p>Défiez vos amis et atteignez vos objectifs ensemble !</p>
          </div>

          <form [formGroup]="createChallengeForm" (ngSubmit)="onCreateChallenge()">
            <div class="form-row">
              <div class="form-group">
                <label for="challengeName">
                  <i class="fas fa-tag"></i>
                  Nom du défi *
                </label>
                <input 
                  type="text" 
                  id="challengeName"
                  formControlName="nom"
                  placeholder="Ex: Défi 10 000 pas"
                  class="form-control"
                  [class.error]="createChallengeForm.get('nom')?.invalid && createChallengeForm.get('nom')?.touched">
                <div class="error-message" *ngIf="createChallengeForm.get('nom')?.invalid && createChallengeForm.get('nom')?.touched">
                  Le nom du défi est requis (minimum 3 caractères)
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="challengeDescription">
                  <i class="fas fa-align-left"></i>
                  Description (optionnel)
                </label>
                <textarea 
                  id="challengeDescription"
                  formControlName="description"
                  placeholder="Décrivez votre défi..."
                  class="form-control"
                  rows="3"></textarea>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <i class="fas fa-bullseye"></i>
                  Type d'objectif *
                </label>
                <div class="challenge-types-grid">
                  <div 
                    *ngFor="let type of challengeTypes"
                    class="challenge-type-option"
                    [class.selected]="createChallengeForm.get('typeObjectif')?.value === type.value"
                    (click)="selectChallengeType(type.value)">
                    <div class="type-icon" [style.background]="type.color">
                      <i [class]="type.icon"></i>
                    </div>
                    <div class="type-info">
                      <h4>{{ type.label }}</h4>
                      <p>{{ type.description }}</p>
                    </div>
                  </div>
                </div>
                <div class="error-message" *ngIf="createChallengeForm.get('typeObjectif')?.invalid && createChallengeForm.get('typeObjectif')?.touched">
                  Veuillez sélectionner un type d'objectif
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="targetValue">
                  <i class="fas fa-target"></i>
                  Valeur cible *
                </label>
                <div class="input-with-unit">
                  <input 
                    type="number" 
                    id="targetValue"
                    formControlName="valeurCible"
                    placeholder="1000"
                    class="form-control"
                    [class.error]="createChallengeForm.get('valeurCible')?.invalid && createChallengeForm.get('valeurCible')?.touched">
                  <span class="unit-label">{{ getSelectedTypeUnit() }}</span>
                </div>
                <div class="error-message" *ngIf="createChallengeForm.get('valeurCible')?.invalid && createChallengeForm.get('valeurCible')?.touched">
                  La valeur cible doit être supérieure à 0
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group half-width">
                <label for="startDate">
                  <i class="fas fa-calendar-alt"></i>
                  Date de début *
                </label>
                <input 
                  type="date" 
                  id="startDate"
                  formControlName="dateDebut"
                  class="form-control"
                  [class.error]="createChallengeForm.get('dateDebut')?.invalid && createChallengeForm.get('dateDebut')?.touched">
                <div class="error-message" *ngIf="createChallengeForm.get('dateDebut')?.invalid && createChallengeForm.get('dateDebut')?.touched">
                  La date de début est requise
                </div>
              </div>

              <div class="form-group half-width">
                <label for="endDate">
                  <i class="fas fa-calendar-check"></i>
                  Date de fin *
                </label>
                <input 
                  type="date" 
                  id="endDate"
                  formControlName="dateFin"
                  class="form-control"
                  [class.error]="createChallengeForm.get('dateFin')?.invalid && createChallengeForm.get('dateFin')?.touched">
                <div class="error-message" *ngIf="createChallengeForm.get('dateFin')?.invalid && createChallengeForm.get('dateFin')?.touched">
                  La date de fin est requise et doit être après la date de début
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>
                  <i class="fas fa-user-friends"></i>
                  Inviter des amis
                </label>
                <div class="friends-selection" *ngIf="friends.length > 0">
                  <div 
                    *ngFor="let friend of friends"
                    class="friend-option"
                    [class.selected]="selectedFriends.includes(friend.id)"
                    (click)="toggleFriendSelection(friend.id)">
                    <div class="friend-avatar">
                      {{ friend.nom.charAt(0).toUpperCase() }}
                    </div>
                    <span class="friend-name">{{ friend.nom }}</span>
                    <i class="fas fa-check selection-check" *ngIf="selectedFriends.includes(friend.id)"></i>
                  </div>
                </div>
                <div class="no-friends" *ngIf="friends.length === 0">
                  <i class="fas fa-user-plus"></i>
                  <p>Ajoutez des amis pour les inviter à vos défis !</p>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button 
                type="button" 
                class="btn-secondary"
                (click)="resetForm()">
                <i class="fas fa-undo"></i>
                Réinitialiser
              </button>
              <button 
                type="submit" 
                class="btn-primary"
                [disabled]="createChallengeForm.invalid || isCreating">
                <i class="fas fa-plus" *ngIf="!isCreating"></i>
                <i class="fas fa-spinner fa-spin" *ngIf="isCreating"></i>
                {{ isCreating ? 'Création...' : 'Créer le Défi' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Leaderboard Modal -->
      <div class="modal-overlay" *ngIf="showLeaderboard" (click)="closeLeaderboard()">
        <div class="modal-content leaderboard-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fas fa-trophy"></i>
              Classement - {{ selectedChallenge?.nom }}
            </h3>
            <button class="close-btn" (click)="closeLeaderboard()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div *ngIf="currentLeaderboard" class="leaderboard-content">
              <div class="challenge-summary">
                <div class="summary-item">
                  <i class="fas fa-target"></i>
                  <span>Objectif: {{ selectedChallenge?.valeurCible | number }} {{ getChallengeTypeUnit(selectedChallenge?.typeObjectif!) }}</span>
                </div>
                <div class="summary-item">
                  <i class="fas fa-users"></i>
                  <span>{{ currentLeaderboard.totalParticipants }} participants</span>
                </div>
              </div>

              <div class="leaderboard-list">
                <div 
                  *ngFor="let participant of currentLeaderboard.participants; let i = index"
                  class="leaderboard-item"
                  [class.current-user]="participant.userId === getCurrentUserId()">
                  
                  <div class="position">
                    <span class="position-number" [class]="'position-' + participant.position">
                      {{ participant.position }}
                    </span>
                    <i class="fas fa-crown" *ngIf="participant.position === 1"></i>
                  </div>
                  
                  <div class="participant-info">
                    <div class="participant-avatar">
                      {{ participant.userName.charAt(0).toUpperCase() }}
                    </div>
                    <div class="participant-details">
                      <h4>{{ participant.userName }}</h4>
                      <p>{{ participant.progression | number }} {{ getChallengeTypeUnit(selectedChallenge?.typeObjectif!) }}</p>
                    </div>
                  </div>
                  
                  <div class="progress-info">
                    <div class="progress-percentage">{{ participant.pourcentageCompletion | number:'1.1-1' }}%</div>
                    <div class="progress-bar-small">
                      <div class="progress-fill" [style.width]="participant.pourcentageCompletion + '%'"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div *ngIf="!currentLeaderboard" class="loading-leaderboard">
              <i class="fas fa-spinner fa-spin fa-2x"></i>
              <p>Chargement du classement...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div class="toast-container">
        <div 
          *ngIf="showToast"
          class="toast"
          [class]="'toast-' + toastType">
          <i class="fas" 
             [class.fa-check-circle]="toastType === 'success'"
             [class.fa-exclamation-triangle]="toastType === 'error'"
             [class.fa-info-circle]="toastType === 'info'"></i>
          <span>{{ toastMessage }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .friend-challenges-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .challenges-header {
      text-align: center;
      margin-bottom: 30px;
      position: relative;
    }

    .challenges-header h1 {
      color: #333;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .challenges-header p {
      color: #666;
      margin: 0 0 20px 0;
    }

    .btn-refresh {
      position: absolute;
      top: 0;
      right: 0;
      background: #f8f9fa;
      border: 1px solid #ddd;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-refresh:hover {
      background: #e9ecef;
    }

    .tab-navigation {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-bottom: 30px;
      border-bottom: 1px solid #eee;
      flex-wrap: wrap;
    }

    .tab-btn {
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

    .tab-btn.create-tab {
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      border-radius: 6px;
      border-bottom: none;
    }

    .tab-btn.create-tab:hover {
      background: linear-gradient(135deg, #218838, #1ea085);
      color: white;
    }

    .count-badge {
      background: #dc3545;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      text-align: center;
    }

    .count-badge.notification {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .challenge-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .challenge-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .challenge-card.my-challenge {
      border-left-color: #007bff;
    }

    .challenge-card.available-challenge {
      border-left-color: #28a745;
    }

    .challenge-card.created-challenge {
      border-left-color: #ffc107;
    }

    .challenge-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 15px;
    }

    .challenge-type {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }

    .challenge-info {
      flex: 1;
    }

    .challenge-info h3 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }

    .challenge-creator {
      margin: 0;
      color: #666;
      font-size: 13px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.status-active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.status-completed {
      background: #cce5ff;
      color: #004085;
    }

    .status-badge.status-cancelled {
      background: #f8d7da;
      color: #721c24;
    }

    .challenge-description {
      margin-bottom: 15px;
    }

    .challenge-description p {
      margin: 0;
      color: #666;
      font-size: 14px;
      line-height: 1.4;
    }

    .challenge-progress {
      margin-bottom: 15px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .objective {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .participants {
      color: #666;
      font-size: 13px;
    }

    .progress-bar-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      font-weight: 600;
      color: #007bff;
      min-width: 35px;
    }

    .challenge-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .challenge-dates {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      font-size: 13px;
      color: #666;
    }

    .days-remaining.urgent {
      color: #dc3545;
      font-weight: 600;
    }

    .challenge-stats {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .stat-item.urgent {
      color: #dc3545;
      font-weight: 600;
    }

    .challenge-actions {
      display: flex;
      gap: 10px;
    }

    .btn-primary, .btn-secondary, .btn-danger {
      flex: 1;
      padding: 10px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #545b62;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background: #c82333;
    }

    .btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading-state, .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state i {
      color: #ddd;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .empty-state p {
      margin: 0 0 20px 0;
    }

    /* Create Challenge Form Styles */
    .create-challenge-form {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .form-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .form-header h2 {
      color: #333;
      margin: 0 0 10px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .form-row {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      flex: 1;
    }

    .form-group.half-width {
      flex: 0.5;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-control.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 12px;
      margin-top: 4px;
    }

    .challenge-types-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 10px;
    }

    .challenge-type-option {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .challenge-type-option:hover {
      border-color: #007bff;
      background: #f8f9fa;
    }

    .challenge-type-option.selected {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .type-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 16px;
    }

    .type-info h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 14px;
    }

    .type-info p {
      margin: 0;
      color: #666;
      font-size: 12px;
    }

    .input-with-unit {
      position: relative;
    }

    .unit-label {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
      font-size: 14px;
      pointer-events: none;
    }

    .friends-selection {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
      margin-top: 10px;
    }

    .friend-option {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    .friend-option:hover {
      border-color: #007bff;
      background: #f8f9fa;
    }

    .friend-option.selected {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .friend-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007bff, #0056b3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .friend-name {
      flex: 1;
      font-weight: 500;
      color: #333;
    }

    .selection-check {
      color: #007bff;
    }

    .no-friends {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .no-friends i {
      font-size: 2rem;
      margin-bottom: 10px;
      color: #ddd;
    }

    .form-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 5px;
    }

    .modal-body {
      padding: 20px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .challenge-summary {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
    }

    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .leaderboard-item:hover {
      background: #f8f9fa;
    }

    .leaderboard-item.current-user {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .position {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .position-number {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
    }

    .position-number.position-1 {
      background: #ffd700;
      color: #333;
    }

    .position-number.position-2 {
      background: #c0c0c0;
      color: #333;
    }

    .position-number.position-3 {
      background: #cd7f32;
    }

    .position-number:not(.position-1):not(.position-2):not(.position-3) {
      background: #6c757d;
    }

    .participant-info {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .participant-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #007bff, #0056b3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }

    .participant-details h4 {
      margin: 0 0 4px 0;
      color: #333;
      font-size: 14px;
    }

    .participant-details p {
      margin: 0;
      color: #666;
      font-size: 12px;
    }

    .progress-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;
    }

    .progress-percentage {
      font-weight: 600;
      color: #007bff;
      font-size: 14px;
    }

    .progress-bar-small {
      width: 80px;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }

    .loading-leaderboard {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    /* Toast Styles */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1100;
    }

    .toast {
      background: white;
      border-radius: 8px;
      padding: 15px 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 300px;
      animation: slideIn 0.3s ease;
    }

    .toast.toast-success {
      border-left: 4px solid #28a745;
    }

    .toast.toast-error {
      border-left: 4px solid #dc3545;
    }

    .toast.toast-info {
      border-left: 4px solid #007bff;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .friend-challenges-container {
        padding: 10px;
      }

      .challenges-grid {
        grid-template-columns: 1fr;
      }

      .tab-navigation {
        flex-direction: column;
        gap: 5px;
      }

      .form-row {
        flex-direction: column;
        gap: 15px;
      }

      .challenge-types-grid {
        grid-template-columns: 1fr;
      }

      .friends-selection {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .modal-content {
        width: 95%;
        margin: 10px;
      }
    }
  `]
})
export class FriendChallengesComponent implements OnInit, OnDestroy {
  activeTab: string = 'my-challenges';
  
  // Data
  myChallenges: FriendChallenge[] = [];
  availableChallenges: FriendChallenge[] = [];
  createdChallenges: FriendChallenge[] = [];
  friends: User[] = [];
  challengeTypes: ChallengeTypeOption[] = [];
  
  // Form
  createChallengeForm!: FormGroup;
  selectedFriends: number[] = [];
  
  // UI State
  isLoading: boolean = false;
  isCreating: boolean = false;
  isJoining: boolean = false;
  isCancelling: boolean = false;
  
  // Modal
  showLeaderboard: boolean = false;
  selectedChallenge: FriendChallenge | null = null;
  currentLeaderboard: ChallengeLeaderboard | null = null;
  
  // Toast
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'info';
  
  // Progress cache to avoid NG0100 error
  private progressCache: Map<number, number> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(
    private challengeService: FriendChallengeService,
    private friendService: FriendService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.challengeTypes = this.challengeService.getChallengeTypeOptions();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    this.createChallengeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      typeObjectif: ['', Validators.required],
      valeurCible: ['', [Validators.required, Validators.min(1)]],
      dateDebut: [today, Validators.required],
      dateFin: [nextWeek, Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  /**
   * Custom validator to ensure end date is after start date
   */
  private dateRangeValidator(group: FormGroup): { [key: string]: boolean } | null {
    const startDate = group.get('dateDebut')?.value;
    const endDate = group.get('dateFin')?.value;
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        return { dateRangeInvalid: true };
      }
    }
    return null;
  }

  /**
   * Check if dates are valid (end > start)
   */
  areDatesValid(): boolean {
    const startDate = this.createChallengeForm.get('dateDebut')?.value;
    const endDate = this.createChallengeForm.get('dateFin')?.value;
    return this.challengeService.validateChallengeDates(startDate, endDate);
  }

  /**
   * Check if user is the creator of a challenge
   */
  isUserCreator(challenge: FriendChallenge): boolean {
    return this.challengeService.isUserCreator(challenge);
  }

  /**
   * Check if remaining days are urgent
   */
  isUrgent(joursRestants: number): boolean {
    return this.challengeService.isUrgentRemainingDays(joursRestants);
  }

  private loadData(): void {
    this.isLoading = true;
    
    // Load challenges
    this.challengeService.myChallenges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(challenges => {
      this.myChallenges = challenges;
      this.isLoading = false;
    });
    
    this.challengeService.activeChallenges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(challenges => {
      this.availableChallenges = challenges;
    });
    
    this.challengeService.createdChallenges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(challenges => {
      this.createdChallenges = challenges;
    });
    
    // Load friends
    this.friendService.friends$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(friends => {
      this.friends = friends;
    });
    
    // Initial data load
    this.challengeService.refreshAllData();
    this.friendService.refreshAllData();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  refreshData(): void {
    this.isLoading = true;
    this.challengeService.refreshAllData();
  }

  // Challenge Type Helpers
  getChallengeTypeIcon(type: ChallengeObjectiveType): string {
    const typeOption = this.challengeTypes.find(t => t.value === type);
    return typeOption?.icon || 'fas fa-target';
  }

  getChallengeTypeColor(type: ChallengeObjectiveType): string {
    const typeOption = this.challengeTypes.find(t => t.value === type);
    return typeOption?.color || '#007bff';
  }

  getChallengeTypeUnit(type: ChallengeObjectiveType): string {
    const typeOption = this.challengeTypes.find(t => t.value === type);
    return typeOption?.unit || '';
  }

  getSelectedTypeUnit(): string {
    const selectedType = this.createChallengeForm.get('typeObjectif')?.value;
    return this.getChallengeTypeUnit(selectedType);
  }

  getStatusLabel(status: ChallengeStatus): string {
    return this.challengeService.getStatusLabel(status);
  }

  /**
   * Get CSS class for status badge
   */
  getStatusBadgeClass(status: ChallengeStatus): string {
    return this.challengeService.getStatusBadgeClass(status);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getCurrentUserId(): number {
    return this.challengeService.getUserId();
  }

  getMyProgress(challengeId: number): number {
    // Use cached progress to avoid NG0100 error (ExpressionChangedAfterItHasBeenCheckedError)
    if (!this.progressCache.has(challengeId)) {
      // Generate a stable mock progress value for demo
      this.progressCache.set(challengeId, Math.floor(Math.random() * 80) + 10);
    }
    return this.progressCache.get(challengeId) || 0;
  }

  // Form Actions
  selectChallengeType(type: ChallengeObjectiveType): void {
    this.createChallengeForm.patchValue({ typeObjectif: type });
  }

  toggleFriendSelection(friendId: number): void {
    const index = this.selectedFriends.indexOf(friendId);
    if (index > -1) {
      this.selectedFriends.splice(index, 1);
    } else {
      this.selectedFriends.push(friendId);
    }
  }

  resetForm(): void {
    this.createChallengeForm.reset();
    this.selectedFriends = [];
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.createChallengeForm.patchValue({
      dateDebut: today,
      dateFin: nextWeek
    });
  }

  onCreateChallenge(): void {
    if (this.createChallengeForm.valid) {
      this.isCreating = true;
      
      const formValue = this.createChallengeForm.value;
      const request: CreateFriendChallengeRequest = {
        nom: formValue.nom,
        description: formValue.description,
        typeObjectif: formValue.typeObjectif,
        valeurCible: formValue.valeurCible,
        dateDebut: formValue.dateDebut,
        dateFin: formValue.dateFin,
        participantsIds: this.selectedFriends
      };
      
      this.challengeService.createChallenge(request).subscribe({
        next: (challenge) => {
          this.isCreating = false;
          this.showToastMessage('Défi créé avec succès !', 'success');
          this.resetForm();
          this.setActiveTab('created');
        },
        error: (error) => {
          this.isCreating = false;
          this.showToastMessage('Erreur lors de la création du défi', 'error');
        }
      });
    }
  }

  // Challenge Actions
  joinChallenge(challenge: FriendChallenge): void {
    this.isJoining = true;
    
    this.challengeService.joinChallenge(challenge.id).subscribe({
      next: (success) => {
        this.isJoining = false;
        if (success) {
          this.showToastMessage(`Vous avez rejoint "${challenge.nom}" !`, 'success');
          this.refreshData();
        } else {
          this.showToastMessage('Impossible de rejoindre ce défi', 'error');
        }
      },
      error: () => {
        this.isJoining = false;
        this.showToastMessage('Erreur lors de l\'inscription', 'error');
      }
    });
  }

  cancelChallenge(challenge: FriendChallenge): void {
    if (confirm(`Êtes-vous sûr de vouloir annuler le défi "${challenge.nom}" ?`)) {
      this.isCancelling = true;
      
      this.challengeService.cancelChallenge(challenge.id).subscribe({
        next: (success) => {
          this.isCancelling = false;
          if (success) {
            this.showToastMessage('Défi annulé avec succès', 'success');
            this.refreshData();
          } else {
            this.showToastMessage('Impossible d\'annuler ce défi', 'error');
          }
        },
        error: () => {
          this.isCancelling = false;
          this.showToastMessage('Erreur lors de l\'annulation', 'error');
        }
      });
    }
  }

  updateProgress(challenge: FriendChallenge): void {
    const progressValue = prompt(`Entrez votre progression pour "${challenge.nom}" (${this.getChallengeTypeUnit(challenge.typeObjectif)}):`);
    
    if (progressValue && !isNaN(Number(progressValue))) {
      const request = {
        userId: this.getCurrentUserId(),
        progression: Number(progressValue),
        activiteDate: new Date()
      };
      
      this.challengeService.updateProgress(challenge.id, request).subscribe({
        next: (success) => {
          if (success) {
            this.showToastMessage('Progression mise à jour !', 'success');
            this.refreshData();
          } else {
            this.showToastMessage('Erreur lors de la mise à jour', 'error');
          }
        },
        error: () => {
          this.showToastMessage('Erreur lors de la mise à jour', 'error');
        }
      });
    }
  }

  // Leaderboard Modal
  viewLeaderboard(challenge: FriendChallenge): void {
    this.selectedChallenge = challenge;
    this.showLeaderboard = true;
    this.currentLeaderboard = null;
    
    this.challengeService.getChallengeLeaderboard(challenge.id).subscribe({
      next: (leaderboard) => {
        this.currentLeaderboard = leaderboard;
      },
      error: () => {
        this.showToastMessage('Erreur lors du chargement du classement', 'error');
      }
    });
  }

  closeLeaderboard(): void {
    this.showLeaderboard = false;
    this.selectedChallenge = null;
    this.currentLeaderboard = null;
  }

  // Toast Messages
  private showToastMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }
}