import { AlimentRepas } from './aliment.model';

export enum TypeRepas {
  PETIT_DEJEUNER = 'PETIT_DEJEUNER',
  DEJEUNER = 'DEJEUNER',
  DINER = 'DINER',
  COLLATION = 'COLLATION'
}

export interface Repas {
  id?: number;
  nom: string;
  date: string;
  typeRepas: string;
  caloriesTotal?: number;
  proteinesTotal?: number;
  lipidesTotal?: number;
  glucidesTotal?: number;
  aliments?: AlimentRepas[];
}

export interface CreerRepasRequest {
  nom: string;
  date: string;
  typeRepas: string;
  aliments: Array<{
    alimentId: number;
    quantite: number;
    portion: number;
  }>;
}

export interface TotauxJournaliers {
  date: string;
  caloriesTotal: number;
  proteinesTotal: number;
  lipidesTotal: number;
  glucidesTotal: number;
  repas: Repas[];
}
