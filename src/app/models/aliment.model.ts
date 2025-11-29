export interface Aliment {
  id?: number;
  nom: string;
  marque?: string;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
  portionStandard: number;
  unite: string;
  imageUrl?: string;
}

export interface AlimentRepas {
  id?: number;
  nom: string;
  marque?: string;
  quantite: number;
  portion: number;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
  unite: string;
}

export interface AjouterAlimentRequest {
  alimentId: number;
  quantite: number;
  portion: number;
}
