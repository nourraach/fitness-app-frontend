export interface StatistiquesHebdomadaires {
  poidsDebut?: number;
  poidsFin?: number;
  variationPoids?: number;
  imcActuel?: number;
  caloriesMoyennesJour?: number;
  proteinesMoyennesJour?: number;
  lipidesMoyennesJour?: number;
  glucidesMoyennesJour?: number;
  nombreRepas?: number;
  nombreActivites?: number;
  minutesTotalesActivite?: number;
  caloriesBrulees?: number;
  joursActifs?: number;
  tauxRespectObjectifCalories?: number;
  tendanceGenerale?: string;
}

export interface RapportProgres {
  id?: number;
  utilisateurId: number;
  nomUtilisateur?: string;
  coachId?: number;
  nomCoach?: string;
  dateDebutSemaine: string;
  dateFinSemaine: string;
  resume?: string;
  dateGeneration?: string;
  statistiques?: StatistiquesHebdomadaires;
}
