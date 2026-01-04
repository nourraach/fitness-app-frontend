export interface RapportProgresDTO {
  id?: number;
  utilisateurId: number;
  coachId?: number;
  nomUtilisateur?: string;
  nomCoach?: string;
  dateDebutSemaine: Date;
  dateFinSemaine: Date;
  resume?: string;
  recommandations?: string;
  donneesCompilees: string; // JSON string
  dateGeneration: Date;
  dateModification?: Date;
  statistiques?: {
    poidsDebut?: number;
    poidsFin?: number;
    variationPoids?: number;
    imcActuel?: number;
    nombreRepas?: number;
    caloriesMoyennesJour?: number;
    proteinesMoyennesJour?: number;
    lipidesMoyennesJour?: number;
    glucidesMoyennesJour?: number;
    tauxRespectObjectifCalories?: number;
    nombreActivites?: number;
    joursActifs?: number;
    minutesTotalesActivite?: number;
    caloriesBrulees?: number;
    tendanceGenerale?: string;
  };
}

export interface CreerRapportRequest {
  utilisateurId: number;
  dateDebutSemaine: Date;
  dateFinSemaine: Date;
  resume?: string;
  recommandations?: string;
}

export interface CompiledDataDTO {
  totalActivites: number;
  totalRepas: number;
  caloriesConsommees: number;
  caloriesBrulees: number;
  bilanCalorique: number;
  moyenneCaloriesParJour: number;
  totalDureeActivites: number;
  moyenneDureeParActivite: number;
  moyenneActivitesParJour: number;
  totalProteines: number;
  totalGlucides: number;
  totalLipides: number;
  pourcentageProteines: number;
  pourcentageGlucides: number;
  pourcentageLipides: number;
  joursAvecActivite: number;
  joursAvecRepas: number;
  objectifActiviteAtteint: boolean;
  objectifNutritionAtteint: boolean;
}

export interface ReportTemplate {
  id?: number;
  coachId: number;
  nom: string;
  description?: string;
  structure: any; // JSON structure
  dateCreation: Date;
}