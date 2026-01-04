import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionalInfoDTO } from '../../models/food-recognition.model';

@Component({
  selector: 'app-nutritional-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nutritional-info.component.html',
  styleUrls: ['./nutritional-info.component.css']
})
export class NutritionalInfoComponent implements OnChanges {
  @Input() nutritionalInfo: NutritionalInfoDTO | null = null;
  @Input() quantity: number = 100;
  @Input() foodName: string = '';
  @Input() showQuantityControls: boolean = true;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() addToMeal = new EventEmitter<{ quantity: number; nutritionalInfo: NutritionalInfoDTO }>();

  adjustedNutrition: NutritionalInfoDTO | null = null;
  selectedQuantity: number = 100;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quantity'] || changes['nutritionalInfo']) {
      this.selectedQuantity = this.quantity;
      this.calculateAdjustedNutrition();
    }
  }

  private calculateAdjustedNutrition(): void {
    if (!this.nutritionalInfo) {
      this.adjustedNutrition = null;
      return;
    }

    const ratio = this.selectedQuantity / 100;
    this.adjustedNutrition = {
      ...this.nutritionalInfo,
      calories: this.nutritionalInfo.calories * ratio,
      protein: this.nutritionalInfo.protein * ratio,
      carbohydrates: this.nutritionalInfo.carbohydrates * ratio,
      fat: this.nutritionalInfo.fat * ratio,
      fiber: this.nutritionalInfo.fiber * ratio,
      sugar: this.nutritionalInfo.sugar * ratio,
      sodium: this.nutritionalInfo.sodium * ratio
    };
  }

  onQuantityChange(): void {
    if (this.selectedQuantity > 0) {
      this.calculateAdjustedNutrition();
      this.quantityChanged.emit(this.selectedQuantity);
    }
  }

  adjustQuantity(delta: number): void {
    const newQuantity = Math.max(1, this.selectedQuantity + delta);
    this.selectedQuantity = Math.min(2000, newQuantity);
    this.onQuantityChange();
  }

  setQuickQuantity(quantity: number): void {
    this.selectedQuantity = quantity;
    this.onQuantityChange();
  }

  onAddToMeal(): void {
    if (this.adjustedNutrition) {
      this.addToMeal.emit({
        quantity: this.selectedQuantity,
        nutritionalInfo: this.adjustedNutrition
      });
    }
  }

  formatNutrientValue(value: number, unit: string): string {
    if (value < 1 && unit === 'g') {
      return `${(value * 1000).toFixed(0)} mg`;
    }
    return `${value.toFixed(1)} ${unit}`;
  }

  getCaloriesColor(calories: number): string {
    if (calories < 100) return '#28a745';
    if (calories < 300) return '#ffc107';
    return '#dc3545';
  }

  getMacroPercentage(macro: number, totalCalories: number): number {
    if (!totalCalories) return 0;
    const macroCalories = macro * (macro === this.adjustedNutrition?.fat ? 9 : 4);
    return (macroCalories / totalCalories) * 100;
  }

  getNutrientBarWidth(current: number, max: number): number {
    return Math.min((current / max) * 100, 100);
  }

  getNutrientBarColor(current: number, max: number): string {
    const percentage = (current / max) * 100;
    if (percentage < 50) return '#28a745';
    if (percentage < 80) return '#ffc107';
    return '#dc3545';
  }

  getDailyValuePercentage(nutrient: string, value: number): number {
    const dailyValues: { [key: string]: number } = {
      'protein': 50,
      'carbohydrates': 300,
      'fat': 65,
      'fiber': 25,
      'sodium': 2.3
    };

    const dailyValue = dailyValues[nutrient];
    if (!dailyValue) return 0;

    return (value / dailyValue) * 100;
  }

  getHealthScore(): number {
    if (!this.adjustedNutrition) return 0;

    let score = 50; // Base score

    // Positive factors
    if (this.adjustedNutrition.fiber > 3) score += 10;
    if (this.adjustedNutrition.protein > 10) score += 10;
    if (this.adjustedNutrition.sodium < 0.5) score += 10;

    // Negative factors
    if (this.adjustedNutrition.sugar > 15) score -= 10;
    if (this.adjustedNutrition.fat > 20) score -= 5;
    if (this.adjustedNutrition.sodium > 1) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  getHealthScoreColor(score: number): string {
    if (score >= 70) return '#28a745';
    if (score >= 40) return '#ffc107';
    return '#dc3545';
  }

  getHealthScoreText(score: number): string {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Correct';
    return 'À améliorer';
  }
}