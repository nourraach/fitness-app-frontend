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

export interface Exercice {
  nom: string;
  description?: string;
  series?: number;
  repetitions?: number;
  dureeMinutes?: number;
  intensite?: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'MAXIMALE';
  notes?: string;
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

export interface ProgrammeEntrainement {
  id?: number;
  coachId?: number;
  nomCoach?: string;
  clientId: number;
  nomClient?: string;
  nom: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  exercices: Exercice[];
  statut?: 'ACTIF' | 'TERMINE' | 'SUSPENDU' | 'ANNULE';
}

export interface CreerProgrammeRequest {
  clientId: number;
  nom: string;
  description?: string;
  dateDebut: string;
  dateFin: string;
  exercices: Exercice[];
}

// Ancien modèle pour compatibilité avec le composant programmes existant
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