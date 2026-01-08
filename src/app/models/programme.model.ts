// ============================================
// MODÈLES CONFORMES AU CONTRAT BACKEND
// ============================================

// Statuts du programme (backend)
export type ProgrammeStatut = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

// Interface Exercice conforme au backend
export interface Exercice {
  nom: string;
  series: number;
  repetitions: number;
  tempsRepos: number;  // en secondes
  poids: number;       // en kg
}

// Request pour créer un programme (POST /api/programmes)
export interface CreerProgrammeRequest {
  clientId: number;
  nom: string;
  description?: string;
  dateDebut: string;  // format: YYYY-MM-DD
  dateFin: string;    // format: YYYY-MM-DD
  exercices: Exercice[];
  statut?: ProgrammeStatut;  // Optionnel, défaut 'ACTIVE'
}

// Response du backend après création/récupération
export interface ProgrammeEntrainement {
  id: number;
  coachId: number;
  clientId: number;
  nomCoach?: string;
  nomClient?: string;
  nom: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  exercices: Exercice[];
  statut: ProgrammeStatut;
  isTemplate?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Request pour modifier le statut
export interface UpdateStatutRequest {
  statut: ProgrammeStatut;
}

// ============================================
// ANCIENS MODÈLES (pour compatibilité)
// ============================================

export enum ProgramStatus {
  ACTIF = 'ACTIF',
  TERMINE = 'TERMINE',
  SUSPENDU = 'SUSPENDU',
  ANNULE = 'ANNULE'
}

export enum IntensiteExercice {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  ELEVEE = 'ELEVEE',
  MAXIMALE = 'MAXIMALE'
}

export interface ExerciceDTO {
  nom: string;
  description?: string;
  series: number;
  repetitions: number;
  dureeMinutes?: number;
  intensite?: IntensiteExercice;
  notes?: string;
  completed?: boolean;
  completionDate?: Date;
}

export interface ProgrammeEntrainementDTO {
  id?: number;
  coachId: number;
  clientId: number;
  nomCoach?: string;
  nomClient?: string;
  nom: string;
  description?: string;
  dateDebut: Date;
  dateFin?: Date;
  exercices: ExerciceDTO[];
  statut: ProgramStatus;
  totalExercises: number;
  completedExercises: number;
  progressPercentage: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Programme {
  id?: number;
  nom: string;
  description?: string;
  niveau?: string;
  objectif?: string;
  duree?: number;
  exercices?: any[];
  statut?: 'ACTIF' | 'TERMINE' | 'SUSPENDU' | 'ANNULE';
  nomCoach?: string;
  nomClient?: string;
}

export interface ProgressDTO {
  programmeId: number;
  clientId: number;
  totalExercises: number;
  completedExercises: number;
  progressPercentage: number;
  lastActivity?: Date;
}

export interface CompleteExerciceRequest {
  exerciceIndex: number;
  notes?: string;
}

export interface UpdateStatusRequest {
  statut: ProgramStatus;
}
