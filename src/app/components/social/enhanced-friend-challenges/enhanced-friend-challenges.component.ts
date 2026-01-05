import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DefiService } from '../../../services/defi.service';
import { FriendService } from '../../../services/friend.service';
import { DefiDTO, CreerDefiRequest, ParticipantDefiDTO } from '../../../models/defi.model';
import { User } from '../../../models/friend.model';

@Component({
  selector: 'app-enhanced-friend-challenges',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="friend-challenges">
      <div class="challenges-header">
        <h2>Défis entre Amis</h2>
        <button class="btn btn-primary" (click)="showCreateForm = !showCreateForm">
          {{ showCreateForm ? 'Annuler' : 'Créer un défi' }}
        </button>
      </div>

      <!-- Formulaire de création -->
      <div *ngIf="showCreateForm" class="create-form">
        <h3>Nouveau Défi</h3>
        <form [formGroup]="challengeForm" (ngSubmit)="createChallenge()">
          <div class="form-row">
            <div class="form-group">
              <label for="nom">Nom du défi</label>
              <input type="text" id="nom" formControlName="nom" class="form-control">
            </div>
            <div class="form-group">
              <label for="objectif">Type d'objectif</label>
              <select id="objectif" formControlName="objectif" class="form-control">
                <option value="CALORIES_BRULEES">Calories brûlées</option>
                <option value="DUREE_ACTIVITE">Durée d'activité (min)</option>
                <option value="POIDS">Perte de poids (kg)</option>
                <option value="PAS">Nombre de pas</option>
                <option value="DISTANCE">Distance (km)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="valeurCible">Valeur cible</label>
              <input type="number" id="valeurCible" formControlName="valeurCible" class="form-control">
            </div>
            <div class="form-group">
              <label for="duree">Durée (jours)</label>
              <input type="number" id="duree" formControlName="duree" class="form-control" min="1" max="90">
            </div>
          </div>

          <div class="form-group">
            <label for="description">Description</label>
            <textarea id="description" formControlName="description" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Inviter des amis</label>
            <div class="friends-list">
              <div *ngFor="let friend of friends" class="friend-item">
                <label>
                  <input type="checkbox" (change)="toggleFriend(friend.id)">
                  {{ friend.nom }} {{ friend.prenom }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Création...' : 'Créer le défi' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Liste des défis -->
      <div class="challenges-tabs">
        <button class="tab" [class.active]="activeTab === 'actifs'" (click)="activeTab = 'actifs'">
          Défis actifs ({{ activeDefis.length }})
        </button>
        <button class="tab" [class.active]="activeTab === 'en-attente'" (click)="activeTab = 'en-attente'">
          En attente ({{ pendingDefis.length }})
        </button>
        <button class="tab" [class.active]="activeTab === 'termines'" (click)="activeTab = 'termines'">
          Terminés ({{ completedDefis.length }})
        </button>
      </div>

      <!-- Défis actifs -->
      <div *ngIf="activeTab === 'actifs'" class="challenges-list">
        <div *ngFor="let defi of activeDefis" class="challenge-card active">
          <div class="challenge-header">
            <h4>{{ defi.nom }}</h4>
            <span class="challenge-type">{{ getObjectifLabel(defi.typeObjectif) }}</span>
          </div>
          <p class="challenge-description">{{ defi.description }}</p>
          <div class="challenge-progress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="0"></div>
            </div>
            <span class="progress-text">0% complété</span>
          </div>
          <div class="challenge-details">
            <span>Objectif: {{ defi.valeurCible }} {{ getUnite(defi.typeObjectif) }}</span>
            <span>Participants: {{ defi.participants.length }}</span>
            <span>Fin: {{ formatDate(defi.dateFin) }}</span>
          </div>
          <div class="challenge-actions">
            <button class="btn btn-sm btn-info" (click)="viewClassement(defi.id!)">Classement</button>
            <button class="btn btn-sm btn-danger" (click)="quitterDefi(defi.id!)">Quitter</button>
          </div>
        </div>
      </div>

      <!-- Défis en attente -->
      <div *ngIf="activeTab === 'en-attente'" class="challenges-list">
        <div *ngFor="let defi of pendingDefis" class="challenge-card pending">
          <div class="challenge-header">
            <h4>{{ defi.nom }}</h4>
            <span class="challenge-type">{{ getObjectifLabel(defi.typeObjectif) }}</span>
          </div>
          <p class="challenge-description">{{ defi.description }}</p>
          <div class="challenge-details">
            <span>Objectif: {{ defi.valeurCible }} {{ getUnite(defi.typeObjectif) }}</span>
            <span>Début: {{ formatDate(defi.dateDebut) }}</span>
          </div>
          <div class="challenge-actions">
            <button class="btn btn-sm btn-success" (click)="accepterDefi(defi.id!)">Accepter</button>
            <button class="btn btn-sm btn-secondary" (click)="refuserDefi(defi.id!)">Refuser</button>
          </div>
        </div>
      </div>

      <!-- Classement modal -->
      <div *ngIf="showClassement" class="modal-overlay" (click)="closeClassement()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Classement du défi</h3>
            <button class="close-btn" (click)="closeClassement()">&times;</button>
          </div>
          <div class="classement-list">
            <div *ngFor="let participant of classement; let i = index" class="classement-item">
              <span class="position">{{ i + 1 }}</span>
              <span class="name">{{ participant.nom }}</span>
              <span class="progress">{{ participant.progression }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .friend-challenges { padding: 20px; max-width: 1000px; margin: 0 auto; }
    .challenges-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .create-form { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .form-group { margin-bottom: 15px; }
    .form-control { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .friends-list { max-height: 150px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
    .friend-item { margin-bottom: 8px; }
    .challenges-tabs { display: flex; margin-bottom: 20px; border-bottom: 1px solid #ddd; }
    .tab { padding: 10px 20px; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { border-bottom-color: #007bff; color: #007bff; }
    .challenges-list { display: grid; gap: 15px; }
    .challenge-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .challenge-card.active { border-left: 4px solid #28a745; }
    .challenge-card.pending { border-left: 4px solid #ffc107; }
    .challenge-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .challenge-type { background: #e9ecef; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
    .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background: #28a745; transition: width 0.3s; }
    .challenge-details { display: flex; gap: 15px; font-size: 14px; color: #666; margin: 10px 0; }
    .challenge-actions { display: flex; gap: 10px; }
    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-info { background: #17a2b8; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
    .modal-content { background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; }
    .classement-item { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #eee; }
    .position { font-weight: bold; color: #007bff; }
  `]
})
export class EnhancedFriendChallengesComponent implements OnInit {
  challengeForm: FormGroup;
  showCreateForm = false;
  isLoading = false;
  activeTab = 'actifs';
  
  activeDefis: DefiDTO[] = [];
  pendingDefis: DefiDTO[] = [];
  completedDefis: DefiDTO[] = [];
  friends: any[] = [];
  selectedFriends: number[] = [];
  
  showClassement = false;
  classement: any[] = [];

  constructor(
    private fb: FormBuilder,
    private defiService: DefiService,
    private friendService: FriendService
  ) {
    this.challengeForm = this.fb.group({
      nom: ['', Validators.required],
      description: [''],
      objectif: ['CALORIES_BRULEES', Validators.required],
      valeurCible: [1000, [Validators.required, Validators.min(1)]],
      duree: [7, [Validators.required, Validators.min(1), Validators.max(90)]]
    });
  }

  ngOnInit() {
    this.loadDefis();
    this.loadFriends();
  }

  loadDefis() {
    this.defiService.getMesDefis().subscribe((defis: DefiDTO[]) => {
      this.activeDefis = defis.filter((d: DefiDTO) => d.statut === 'ACTIF');
      this.pendingDefis = defis.filter((d: DefiDTO) => d.statut === 'EN_ATTENTE');
      this.completedDefis = defis.filter((d: DefiDTO) => d.statut === 'TERMINE');
    });
  }

  loadFriends() {
    this.friendService.friends$.subscribe((friends: User[]) => {
      this.friends = friends;
    });
  }

  toggleFriend(friendId: number) {
    const index = this.selectedFriends.indexOf(friendId);
    if (index > -1) {
      this.selectedFriends.splice(index, 1);
    } else {
      this.selectedFriends.push(friendId);
    }
  }

  createChallenge() {
    if (this.challengeForm.valid) {
      this.isLoading = true;
      const formValue = this.challengeForm.value;
      
      // Calculate dates based on duration
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setDate(dateDebut.getDate() + (formValue.duree || 7)); // Default 7 days if no duration
      
      const request: CreerDefiRequest = {
        nom: formValue.nom,
        description: formValue.description,
        typeObjectif: formValue.objectif,
        valeurCible: formValue.valeurCible,
        dateDebut: dateDebut,
        dateFin: dateFin,
        participantsIds: this.selectedFriends
      };

      this.defiService.creerDefiEntreAmis(request).subscribe({
        next: () => {
          this.showCreateForm = false;
          this.challengeForm.reset();
          this.selectedFriends = [];
          this.loadDefis();
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error creating challenge:', error);
          this.isLoading = false;
        }
      });
    }
  }

  accepterDefi(defiId: number) {
    this.defiService.accepterDefi(defiId).subscribe(() => {
      this.loadDefis();
    });
  }

  refuserDefi(defiId: number) {
    this.defiService.refuserDefi(defiId).subscribe(() => {
      this.loadDefis();
    });
  }

  quitterDefi(defiId: number) {
    if (confirm('Êtes-vous sûr de vouloir quitter ce défi ?')) {
      this.defiService.quitterDefi(defiId).subscribe(() => {
        this.loadDefis();
      });
    }
  }

  viewClassement(defiId: number) {
    this.defiService.getClassement(defiId).subscribe(classement => {
      this.classement = classement.classement || [];
      this.showClassement = true;
    });
  }

  closeClassement() {
    this.showClassement = false;
    this.classement = [];
  }

  getObjectifLabel(objectif: string): string {
    const labels: { [key: string]: string } = {
      'CALORIES_BRULEES': 'Calories',
      'DUREE_ACTIVITE': 'Durée',
      'POIDS': 'Poids',
      'PAS': 'Pas',
      'DISTANCE': 'Distance'
    };
    return labels[objectif] || objectif;
  }

  getUnite(objectif: string): string {
    const unites: { [key: string]: string } = {
      'CALORIES_BRULEES': 'kcal',
      'DUREE_ACTIVITE': 'min',
      'POIDS': 'kg',
      'PAS': 'pas',
      'DISTANCE': 'km'
    };
    return unites[objectif] || '';
  }

  formatDate(date: Date | string): string {
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('fr-FR');
    }
    return date.toLocaleDateString('fr-FR');
  }
}