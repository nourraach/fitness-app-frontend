import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgrammeService } from '../services/programme.service';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';
import { JwtService } from '../service/jwt.service';
import { ProgrammeEntrainement, Exercice, CreerProgrammeRequest } from '../models/programme.model';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-gestion-programmes',
  standalone: true,
  imports: [CommonModule, FormsModule, CoachNavbarComponent, NavbarComponent],
  templateUrl: './gestion-programmes.component.html',
  styleUrl: './gestion-programmes.component.css'
})
export class GestionProgrammesComponent implements OnInit {
  programmes: ProgrammeEntrainement[] = [];
  clients: Client[] = [];
  showForm = false;
  isEditing = false;
  currentProgrammeId?: number;
  
  programme: CreerProgrammeRequest = {
    clientId: 0,
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    exercices: []
  };

  nouvelExercice: Exercice = {
    nom: '',
    description: '',
    series: 0,
    repetitions: 0,
    dureeMinutes: 0,
    intensite: 'MOYENNE',
    notes: ''
  };

  userRole: string = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private programmeService: ProgrammeService,
    private clientService: ClientService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    // Récupérer le rôle depuis le JWT
    const role = this.jwtService.getRole();
    console.log('Rôle utilisateur:', role);
    
    // Le rôle dans le JWT peut être "ROLE_COACH", "coach", etc.
    // On normalise en minuscules et on retire le préfixe ROLE_ si présent
    if (role) {
      this.userRole = role.replace('ROLE_', '').toLowerCase();
    }
    
    this.chargerProgrammes();
    if (this.userRole === 'coach') {
      this.chargerClients();
    }
  }

  chargerProgrammes(): void {
    this.loading = true;
    const observable = this.userRole === 'coach' 
      ? this.programmeService.getProgrammesCoach()
      : this.programmeService.getProgrammesClient();

    observable.subscribe({
      next: (data) => {
        this.programmes = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des programmes';
        this.loading = false;
      }
    });
  }

  chargerClients(): void {
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des clients:', err);
        // Fallback avec des données de test
        this.clients = [
          { id: 2, name: 'Marie Martin', email: 'marie@example.com' },
          { id: 3, name: 'Paul Durand', email: 'paul@example.com' }
        ];
      }
    });
  }

  afficherFormulaire(): void {
    this.showForm = true;
    this.isEditing = false;
    this.resetForm();
  }

  annulerFormulaire(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.programme = {
      clientId: 0,
      nom: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      exercices: []
    };
    this.nouvelExercice = {
      nom: '',
      description: '',
      series: 0,
      repetitions: 0,
      dureeMinutes: 0,
      intensite: 'MOYENNE',
      notes: ''
    };
    this.error = '';
    this.success = '';
  }

  ajouterExercice(): void {
    if (this.nouvelExercice.nom.trim()) {
      this.programme.exercices.push({ ...this.nouvelExercice });
      this.nouvelExercice = {
        nom: '',
        description: '',
        series: 0,
        repetitions: 0,
        dureeMinutes: 0,
        intensite: 'MOYENNE',
        notes: ''
      };
    }
  }

  retirerExercice(index: number): void {
    this.programme.exercices.splice(index, 1);
  }

  soumettreProgramme(): void {
    if (!this.validerFormulaire()) {
      return;
    }

    this.loading = true;
    const observable = this.isEditing && this.currentProgrammeId
      ? this.programmeService.modifierProgramme(this.currentProgrammeId, this.programme)
      : this.programmeService.creerProgramme(this.programme);

    observable.subscribe({
      next: () => {
        this.success = this.isEditing ? 'Programme modifié avec succès' : 'Programme créé avec succès';
        this.loading = false;
        this.showForm = false;
        this.chargerProgrammes();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.error?.erreur || 'Erreur lors de la sauvegarde du programme';
        this.loading = false;
      }
    });
  }

  validerFormulaire(): boolean {
    if (!this.programme.clientId || this.programme.clientId === 0) {
      this.error = 'Veuillez sélectionner un client';
      return false;
    }
    if (!this.programme.nom.trim()) {
      this.error = 'Veuillez saisir un nom pour le programme';
      return false;
    }
    if (!this.programme.dateDebut || !this.programme.dateFin) {
      this.error = 'Veuillez saisir les dates de début et de fin';
      return false;
    }
    if (this.programme.exercices.length === 0) {
      this.error = 'Veuillez ajouter au moins un exercice';
      return false;
    }
    return true;
  }

  modifierProgramme(programme: ProgrammeEntrainement): void {
    this.isEditing = true;
    this.currentProgrammeId = programme.id;
    this.programme = {
      clientId: programme.clientId,
      nom: programme.nom,
      description: programme.description || '',
      dateDebut: programme.dateDebut,
      dateFin: programme.dateFin,
      exercices: [...programme.exercices]
    };
    this.showForm = true;
  }

  changerStatut(id: number, statut: string): void {
    if (!id) return;
    
    this.programmeService.changerStatut(id, statut).subscribe({
      next: () => {
        this.success = 'Statut modifié avec succès';
        this.chargerProgrammes();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors du changement de statut';
      }
    });
  }

  supprimerProgramme(id: number): void {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }

    this.programmeService.supprimerProgramme(id).subscribe({
      next: () => {
        this.success = 'Programme supprimé avec succès';
        this.chargerProgrammes();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erreur lors de la suppression du programme';
      }
    });
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'ACTIF': return 'statut-actif';
      case 'TERMINE': return 'statut-termine';
      case 'SUSPENDU': return 'statut-suspendu';
      case 'ANNULE': return 'statut-annule';
      default: return '';
    }
  }
}
