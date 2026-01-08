// Modèle pour un repas individuel
export interface Meal {
  id: number;
  name: string;
  description?: string;
  calories: number;
  proteines: number;
  glucides: number;
  lipides: number;
  type: MealType;
  tags: string[];
  image?: string;
  ingredients?: string[];
  preparation?: string;
}

// Types de repas
export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation';

// Plan journalier
export interface DailyPlan {
  date: Date;
  petitDejeuner: Meal;
  dejeuner: Meal;
  diner: Meal;
  collation: Meal;
  totalCalories: number;
  totalProteines: number;
  totalGlucides: number;
  totalLipides: number;
}

// Plan hebdomadaire
export interface WeeklyPlan {
  startDate: Date;
  endDate: Date;
  days: DailyPlan[];
  moyenneCalories: number;
  moyenneProteines: number;
  moyenneGlucides: number;
  moyenneLipides: number;
}

// Préférences alimentaires disponibles
export const PREFERENCES_ALIMENTAIRES = [
  'Tous',
  'Végétarien',
  'Végan',
  'Sans lactose'
] as const;

export type PreferenceAlimentaire = typeof PREFERENCES_ALIMENTAIRES[number];

// Répartition calorique par repas (en pourcentage)
export const REPARTITION_CALORIES = {
  'Petit-déjeuner': 0.25, // 25%
  'Déjeuner': 0.35,       // 35%
  'Dîner': 0.30,          // 30%
  'Collation': 0.10       // 10%
};
