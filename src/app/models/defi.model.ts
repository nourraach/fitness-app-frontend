export enum TypeObjectif {
  CALORIES_BRULEES = 'CALORIES_BRULEES',
  DUREE_ACTIVITE = 'DUREE_ACTIVITE',
  POIDS = 'POIDS',
  PAS = 'PAS',
  DISTANCE = 'DISTANCE'
}

export enum StatutDefi {
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE',
  ANNULE = 'ANNULE'
}

export enum StatutParticipation {
  EN_ATTENTE = 'EN_ATTENTE',
  ACCEPTE = 'ACCEPTE',
  REFUSE = 'REFUSE'
}

export interface DefiDTO {
  id?: number;
  createurId: number;
  createurNom: string;
  nom: string;
  description?: string;
  typeObjectif: string;
  valeurCible: number;
  dateDebut: Date;
  dateFin: Date;
  dateCreation: Date;
  statut: string;
  nombreParticipants: number;
  participants: ParticipantDefiDTO[];
}

export interface ParticipantDefiDTO {
  id?: number;
  utilisateurId: number;
  utilisateurNom: string;
  progressionActuelle: number;
  statut: string;
  classement?: number;
  dateInscription: Date;
  pourcentageProgression: number;
}

export interface ClassementDefiDTO {
  defiId: number;
  nomDefi: string;
  typeObjectif: string;
  valeurCible: number;
  classement: ParticipantDefiDTO[];
}

export interface CreerDefiRequest {
  nom: string;
  description?: string;
  typeObjectif: string;
  valeurCible: number;
  dateDebut: Date;
  dateFin: Date;
  participantsIds?: number[];
}

export interface UpdateProgressionRequest {
  progression: number;
}