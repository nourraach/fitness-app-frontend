import { FileValidationResult, NutritionalInfo } from '../models/food-recognition.model';

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `Fichier trop volumineux. Maximum ${MAX_FILE_SIZE_MB}MB.` };
  }
  return { valid: true };
}

export function calculateNutritionalValues(baseInfo: NutritionalInfo, newQuantity: number): NutritionalInfo {
  const ratio = newQuantity / baseInfo.quantity;
  return {
    foodName: baseInfo.foodName,
    quantity: newQuantity,
    calories: Math.round(baseInfo.calories * ratio),
    proteines: Math.round(baseInfo.proteines * ratio * 10) / 10,
    lipides: Math.round(baseInfo.lipides * ratio * 10) / 10,
    glucides: Math.round(baseInfo.glucides * ratio * 10) / 10
  };
}
