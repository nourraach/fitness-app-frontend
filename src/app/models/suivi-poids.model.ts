export interface SuiviPoidsDTO {
  id?: number;
  poids: number;
  imc?: number;
  date: string;
  notes?: string;
}

export interface AjouterPoidsRequest {
  poids: number;
  date?: string;
  notes?: string;
}

export interface EvolutionPoidsDTO {
  historique: SuiviPoidsDTO[];
  poidsActuel?: number;
  poidsInitial?: number;
  poidsObjectif?: number;
  imcActuel?: number;
  variationPoids?: number;
  progressionObjectif?: number;
  tendance?: string; // "HAUSSE", "BAISSE", "STABLE"
}

export interface StatistiquesProgressionDTO {
  dateDebut: string;
  dateFin: string;
  // Statistiques de poids
  poidsMin?: number;
  poidsMax?: number;
  poidsMoyen?: number;
  variationTotale?: number;
  // Statistiques d'IMC
  imcMin?: number;
  imcMax?: number;
  imcMoyen?: number;
  // Statistiques de calories
  caloriesMoyennesConsommees?: number;
  caloriesMoyennesBrulees?: number;
  bilanCaloriqueMoyen?: number;
  // Activité physique
  nombreActivites?: number;
  dureeActiviteTotale?: number;
  // Nutrition
  nombreRepas?: number;
}
