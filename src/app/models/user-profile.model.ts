export interface UserProfile {
  id?: number;
  userId?: number;
  age: number;
  sexe: 'HOMME' | 'FEMME' | 'AUTRE';
  taille: number; // en cm
  poids: number; // en kg
  objectif: 'PERTE_POIDS' | 'PRISE_MASSE' | 'MAINTIEN' | 'REMISE_EN_FORME';
  imc?: number;
  besoinsCaloriques?: number;
  niveauActivite?: 'SEDENTAIRE' | 'LEGER' | 'MODERE' | 'INTENSE' | 'TRES_INTENSE';
}

export interface ImcResult {
  imc: number;
  categorie: string;
  interpretation: string;
}

export interface BesoinsCaloriquesResult {
  besoinsCaloriques: number;
  metabolismeBase: number;
  details: string;
}
