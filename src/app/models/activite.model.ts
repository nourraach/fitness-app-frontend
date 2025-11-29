export interface ActivitePhysique {
  id?: number;
  typeActivite: string;
  dureeMinutes: number;
  intensite: string;
  caloriesBrulees: number;
  date: string;
}

export interface CreerActiviteRequest {
  typeActivite: string;
  dureeMinutes: number;
  intensite: string; // FAIBLE, MODEREE, ELEVEE
  date: string;
}

export interface TotauxActivites {
  date: string;
  caloriesBruleesTotal: number;
  dureeMinutesTotal: number;
  nombreActivites: number;
  activites: ActivitePhysique[];
}

export interface BilanJournalier {
  date: string;
  caloriesConsommees: number;
  caloriesBrulees: number;
  bilanNet: number;
  dureeActivitesMinutes: number;
  nombreRepas: number;
  nombreActivites: number;
}
