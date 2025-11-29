export interface Exercice {
  nom: string;
  description?: string;
  series?: number;
  repetitions?: number;
  dureeMinutes?: number;
  intensite?: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'MAXIMALE';
  notes?: string;
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
