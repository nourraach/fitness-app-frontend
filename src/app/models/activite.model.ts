export interface ActivitePhysique {
  id?: number;
  typeActivite: string;
  dureeMinutes: number;
  caloriesBrulees: number;
  intensite: 'FAIBLE' | 'MODEREE' | 'ELEVEE';
  dateActivite: string; // Format: YYYY-MM-DD
  notes?: string;
  utilisateur?: { id: number };
}

export interface CreerActiviteRequest {
  typeActivite: string;
  dureeMinutes: number;
  caloriesBrulees: number;
  intensite: 'FAIBLE' | 'MODEREE' | 'ELEVEE';
  dateActivite: string; // Format: YYYY-MM-DD
  notes?: string;
  utilisateur: { id: number };
}

export interface TotauxActivites {
  date: string; // Garde 'date' pour la compatibilité avec les réponses backend existantes
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

// Fonction utilitaire pour calculer les calories
export function calculerCalories(typeActivite: string, dureeMinutes: number, intensite: 'FAIBLE' | 'MODEREE' | 'ELEVEE'): number {
  const calorieRates: { [key: string]: { [key: string]: number } } = {
    'Course à pied': { FAIBLE: 8, MODEREE: 12, ELEVEE: 16 },
    'Marche': { FAIBLE: 3, MODEREE: 5, ELEVEE: 7 },
    'Vélo': { FAIBLE: 6, MODEREE: 10, ELEVEE: 14 },
    'Natation': { FAIBLE: 10, MODEREE: 14, ELEVEE: 18 },
    'Musculation': { FAIBLE: 6, MODEREE: 8, ELEVEE: 10 },
    'Yoga': { FAIBLE: 3, MODEREE: 4, ELEVEE: 5 },
    'Danse': { FAIBLE: 4, MODEREE: 6, ELEVEE: 8 },
    'Football': { FAIBLE: 7, MODEREE: 10, ELEVEE: 13 },
    'Basketball': { FAIBLE: 6, MODEREE: 9, ELEVEE: 12 },
    'Tennis': { FAIBLE: 5, MODEREE: 8, ELEVEE: 11 }
  };

  // Taux par défaut si l'activité n'est pas trouvée
  const defaultRates = { FAIBLE: 4, MODEREE: 6, ELEVEE: 8 };
  
  const rates = calorieRates[typeActivite] || defaultRates;
  const caloriesParMinute = rates[intensite] || rates['MODEREE'];
  
  return Math.round(caloriesParMinute * dureeMinutes);
}

// Fonction utilitaire pour valider les données d'activité
export function validerActivite(activite: Partial<CreerActiviteRequest>): string[] {
  const erreurs: string[] = [];

  if (!activite.typeActivite || activite.typeActivite.trim() === '') {
    erreurs.push('Le type d\'activité est requis');
  }

  if (!activite.dureeMinutes || activite.dureeMinutes <= 0) {
    erreurs.push('La durée doit être un nombre positif');
  }

  if (!activite.intensite || !['FAIBLE', 'MODEREE', 'ELEVEE'].includes(activite.intensite)) {
    erreurs.push('L\'intensité doit être FAIBLE, MODEREE ou ELEVEE');
  }

  if (!activite.dateActivite || !/^\d{4}-\d{2}-\d{2}$/.test(activite.dateActivite)) {
    erreurs.push('La date doit être au format YYYY-MM-DD');
  }

  if (!activite.caloriesBrulees || activite.caloriesBrulees <= 0) {
    erreurs.push('Les calories brûlées doivent être un nombre positif');
  }

  if (!activite.utilisateur || !activite.utilisateur.id || activite.utilisateur.id <= 0) {
    erreurs.push('L\'utilisateur est requis');
  }

  return erreurs;
}