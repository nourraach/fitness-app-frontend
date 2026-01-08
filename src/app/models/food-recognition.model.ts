export interface NutritionalInfo {
  foodName: string;
  quantity: number;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
}

export interface FoodRecognitionResult {
  recognized: boolean;
  confidence: number;
  foodId?: number;
  foodName?: string;
  category?: string;
  message?: string;
  alternatives?: string[];
  nutritionalInfo?: NutritionalInfo;
}

export interface ConfirmedFood {
  foodId: number;
  foodName: string;
  quantity: number;
  nutritionalInfo: NutritionalInfo;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Aliases for DTO naming convention compatibility
export type NutritionalInfoDTO = NutritionalInfo;
export type FoodRecognitionResultDTO = FoodRecognitionResult;
