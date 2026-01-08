import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgrammeService } from '../services/programme.service';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';
import { JwtService } from '../service/jwt.service';
import { 
  ProgrammeEntrainement, 
  Exercice, 
  CreerProgrammeRequest,
  ProgrammeStatut 
} from '../models/programme.model';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';

@Component({
  selector: 'app-gestion-programmes',
  standalone: true,
  imports: [CommonModule, FormsModule, CoachNavbarComponent],
  templateUrl: './gestion-programmes.component.html',
  styleUrl: './gestion-programmes.component.css'
})
export class GestionProgrammesComponent implements OnInit {
  // Liste des programmes
  programmes: ProgrammeEntrainement[] = [];
  
  // Liste des clients du coach
  clients: Client[] = [];
  
  // État du formulaire
  showForm = false;
  isEditing = false;
  currentProgrammeId?: number;
  
  // Données du formulaire - conforme au contrat backend
  formData = {
    clientId: 0,
    nom: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    exercices: [] as Exercice[]
  };

  // Nouvel exercice - conforme au contrat backend
  nouvelExercice: Exercice = {
    nom: '',
    series: 1,
    repetitions: 10,
    tempsRepos: 60,
    poids: 0
  };

  // État UI
  userRole = '';
  loading = false;
  error = '';
  success = '';

  constructor(
    private programmeService: ProgrammeService,
    private clientService: ClientService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.initUserRole();
    this.chargerProgrammes();
    
    if (this.userRole === 'coach') {
      this.chargerClients();
    }
  }

  /**
   * Initialise le rôle utilisateur depuis le JWT
   */
  private initUserRole(): void {
    const role = this.jwtService.getRole();
    if (role) {
      this.userRole = role.replace('ROLE_', '').toLowerCase();
    }
    console.log('👤 Rôle utilisateur:', this.userRole);
  }

  /**
   * Charge les programmes selon le rôle
   */
  chargerProgrammes(): void {
    this.loading = true;
    this.error = '';
    
    const observable = this.userRole === 'coach' 
      ? this.programmeService.getProgrammesCoach()
      : this.programmeService.getProgrammesClient();

    observable.subscribe({
      next: (data) => {
        // Pour les clients, filtrer les programmes annulés
        if (this.userRole !== 'coach') {
          this.programmes = data.filter(p => p.statut !== 'CANCELLED');
        } else {
          this.programmes = data;
        }
        this.loading = false;
        console.log('📋 Programmes chargés:', this.programmes.length);
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du chargement des programmes';
        this.loading = false;
        console.error('❌ Erreur chargement:', err);
      }
    });
  }

  /**
   * Charge la liste des clients du coach
   */
  chargerClients(): void {
    this.clientService.getMyClients().subscribe({
      next: (data: Client[]) => {
        this.clients = data;
        console.log('👥 Clients chargés:', data.length);
      },
      error: (err) => {
        console.error('❌ Erreur chargement clients:', err);
        this.error = 'Impossible de charger la liste des clients';
      }
    });
  }

  // ============================================
  // GESTION DU FORMULAIRE
  // ============================================

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
    this.formData = {
      clientId: 0,
      nom: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      exercices: []
    };
    this.resetExercice();
    this.error = '';
    this.currentProgrammeId = undefined;
  }

  resetExercice(): void {
    this.nouvelExercice = {
      nom: '',
      series: 1,
      repetitions: 10,
      tempsRepos: 60,
      poids: 0
    };
  }

  // ============================================
  // GESTION DES EXERCICES
  // ============================================

  ajouterExercice(): void {
    if (!this.nouvelExercice.nom.trim()) {
      this.error = 'Le nom de l\'exercice est requis';
      return;
    }

    // Validation des valeurs positives (comme le backend)
    if (this.nouvelExercice.series <= 0 || 
        this.nouvelExercice.repetitions <= 0 || 
        this.nouvelExercice.tempsRepos < 0 || 
        this.nouvelExercice.poids < 0) {
      this.error = 'Les valeurs de l\'exercice doivent être positives';
      return;
    }

    this.formData.exercices.push({ ...this.nouvelExercice });
    this.resetExercice();
    this.error = '';
    console.log('➕ Exercice ajouté, total:', this.formData.exercices.length);
  }

  retirerExercice(index: number): void {
    this.formData.exercices.splice(index, 1);
    console.log('➖ Exercice retiré, total:', this.formData.exercices.length);
  }

  // ============================================
  // SOUMISSION DU FORMULAIRE
  // ============================================

  soumettreProgramme(): void {
    console.log('🚀 soumettreProgramme() appelée');
    
    if (!this.validerFormulaire()) {
      console.log('⛔ Validation échouée, arrêt');
      return;
    }

    this.loading = true;
    this.error = '';

    // Construction du body conforme au contrat backend
    const request: CreerProgrammeRequest = {
      clientId: Number(this.formData.clientId),
      nom: this.formData.nom.trim(),
      description: this.formData.description?.trim() || undefined,
      dateDebut: this.formData.dateDebut,
      dateFin: this.formData.dateFin,
      exercices: this.formData.exercices,
      statut: 'ACTIVE'  // Statut par défaut pour les nouveaux programmes
    };

    console.log('📤 Envoi au backend:', JSON.stringify(request, null, 2));

    const observable = this.isEditing && this.currentProgrammeId
      ? this.programmeService.updateProgramme(this.currentProgrammeId, request)
      : this.programmeService.creerProgramme(request);

    observable.subscribe({
      next: (response) => {
        this.success = this.isEditing 
          ? 'Programme modifié avec succès' 
          : 'Programme créé avec succès';
        this.loading = false;
        this.showForm = false;
        this.chargerProgrammes();
        console.log('✅ Succès:', response);
        setTimeout(() => this.success = '', 4000);
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la sauvegarde';
        this.loading = false;
        console.error('❌ Erreur:', err);
      }
    });
  }

  /**
   * Validation côté frontend (le backend fait aussi ses validations)
   */
  validerFormulaire(): boolean {
    this.error = '';

    console.log('🔍 Validation du formulaire:', {
      clientId: this.formData.clientId,
      nom: this.formData.nom,
      dateDebut: this.formData.dateDebut,
      dateFin: this.formData.dateFin,
      exercices: this.formData.exercices.length
    });

    if (!this.formData.clientId || this.formData.clientId === 0) {
      this.error = 'Veuillez sélectionner un client';
      console.log('❌ Validation échouée: pas de client');
      return false;
    }

    if (!this.formData.nom.trim()) {
      this.error = 'Le nom du programme est requis';
      console.log('❌ Validation échouée: pas de nom');
      return false;
    }

    if (!this.formData.dateDebut || !this.formData.dateFin) {
      this.error = 'Les dates de début et de fin sont requises';
      console.log('❌ Validation échouée: dates manquantes');
      return false;
    }

    // Validation des dates - comparaison directe des strings ISO (YYYY-MM-DD)
    // Les inputs type="date" retournent des strings au format YYYY-MM-DD
    console.log('📅 Dates brutes:', {
      dateDebut: this.formData.dateDebut,
      dateFin: this.formData.dateFin,
      typeDebut: typeof this.formData.dateDebut,
      typeFin: typeof this.formData.dateFin
    });

    // Comparaison simple de strings ISO - fonctionne car YYYY-MM-DD est triable alphabétiquement
    if (this.formData.dateFin <= this.formData.dateDebut) {
      this.error = 'La date de fin doit être après la date de début';
      console.log('❌ Validation échouée: date fin <= date début');
      return false;
    }

    if (this.formData.exercices.length === 0) {
      this.error = 'Ajoutez au moins un exercice';
      console.log('❌ Validation échouée: pas d\'exercices');
      return false;
    }

    console.log('✅ Validation réussie');
    return true;
  }

  // ============================================
  // ACTIONS SUR LES PROGRAMMES
  // ============================================

  modifierProgramme(programme: ProgrammeEntrainement): void {
    this.isEditing = true;
    this.currentProgrammeId = programme.id;
    this.formData = {
      clientId: programme.clientId,
      nom: programme.nom,
      description: programme.description || '',
      dateDebut: programme.dateDebut,
      dateFin: programme.dateFin,
      exercices: programme.exercices ? [...programme.exercices] : []
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
        this.error = err.message || 'Erreur lors du changement de statut';
      }
    });
  }

  supprimerProgramme(id: number): void {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }

    this.loading = true;
    this.programmeService.deleteProgramme(id).subscribe({
      next: () => {
        this.success = 'Programme supprimé avec succès';
        this.loading = false;
        this.chargerProgrammes();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors de la suppression';
        this.loading = false;
      }
    });
  }

  // ============================================
  // HELPERS UI
  // ============================================

  getStatutClass(statut?: string): string {
    const mapping: Record<string, string> = {
      'ACTIVE': 'statut-actif',
      'ACTIF': 'statut-actif',
      'PAUSED': 'statut-suspendu',
      'SUSPENDU': 'statut-suspendu',
      'COMPLETED': 'statut-termine',
      'TERMINE': 'statut-termine',
      'CANCELLED': 'statut-annule',
      'ANNULE': 'statut-annule'
    };
    return mapping[statut || ''] || '';
  }

  getStatutLabel(statut?: string): string {
    const mapping: Record<string, string> = {
      'ACTIVE': 'Actif',
      'ACTIF': 'Actif',
      'PAUSED': 'En pause',
      'SUSPENDU': 'Suspendu',
      'COMPLETED': 'Terminé',
      'TERMINE': 'Terminé',
      'CANCELLED': 'Annulé',
      'ANNULE': 'Annulé'
    };
    return mapping[statut || ''] || statut || '';
  }

  isStatutActif(statut?: string): boolean {
    return statut === 'ACTIVE' || statut === 'ACTIF';
  }

  isStatutPause(statut?: string): boolean {
    return statut === 'PAUSED' || statut === 'SUSPENDU';
  }

  /**
   * Permet au client de marquer un programme comme terminé
   */
  marquerTermine(programme: ProgrammeEntrainement): void {
    if (!programme.id) return;
    
    if (confirm('Êtes-vous sûr d\'avoir terminé ce programme ? Votre coach sera notifié.')) {
      this.loading = true;
      this.programmeService.changerStatut(programme.id, 'COMPLETED').subscribe({
        next: () => {
          this.success = '🎉 Félicitations ! Programme marqué comme terminé. Votre coach a été notifié.';
          this.chargerProgrammes();
          setTimeout(() => this.success = '', 5000);
        },
        error: (err) => {
          this.error = err.message || 'Erreur lors de la mise à jour du statut';
          this.loading = false;
        }
      });
    }
  }

  /**
   * Force une valeur à être positive (>= 1) pour séries et répétitions
   */
  forcePositive(field: 'series' | 'repetitions'): void {
    if (this.nouvelExercice[field] < 1) {
      this.nouvelExercice[field] = 1;
    }
  }

  /**
   * Force une valeur à être non-négative (>= 0) pour repos et poids
   */
  forceNonNegative(field: 'tempsRepos' | 'poids'): void {
    if (this.nouvelExercice[field] < 0) {
      this.nouvelExercice[field] = 0;
    }
  }
}
