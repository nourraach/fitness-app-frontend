export interface FoodRecognitionResultDTO {
  recognized: boolean;
  confidence: number;
  foodId?: number;
  foodName?: string;
  name?: string; // Alias for foodName
  category?: string;
  message?: string;
  nutritionalInfo?: NutritionalInfoDTO;
  alternatives?: FoodSuggestionDTO[]; // Alternative suggestions
}

export interface NutritionalInfoDTO {
  foodName: string;
  quantity: number;
  calories: number;
  proteines: number;
  protein?: number; // Alias for proteines
  lipides: number;
  fat?: number; // Alias for lipides
  glucides: number;
  carbohydrates?: number; // Alias for glucides
  fiber?: number; // Fiber content
  sugar?: number; // Sugar content
  sodium?: number; // Sodium content
  vitamins?: { [key: string]: number }; // Vitamin content
  unit: string;
}

export interface FoodSuggestionDTO {
  id: number;
  name: string;
  category: string;
  commonName?: string;
  brand?: string; // Brand name
  caloriesPer100g?: number; // Calories per 100g
}

export interface ManualFoodEntryDTO {
  foodName: string;
  quantity?: number;
}

export enum FoodCategory {
  FRUITS = 'FRUITS',
  VEGETABLES = 'VEGETABLES',
  PROTEINS = 'PROTEINS',
  GRAINS = 'GRAINS',
  DAIRY = 'DAIRY',
  FATS = 'FATS',
  BEVERAGES = 'BEVERAGES',
  SNACKS = 'SNACKS',
  OTHER = 'OTHER'
}

export interface FoodRecognitionState {
  isUploading: boolean;
  isRecognizing: boolean;
  result?: FoodRecognitionResultDTO;
  error?: string;
  suggestions: FoodSuggestionDTO[];
}