import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodRecognitionResultDTO, NutritionalInfoDTO } from '../../models/food-recognition.model';
import { FoodRecognitionService } from '../../services/food-recognition.service';

@Component({
  selector: 'app-food-recognition-result',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-recognition-result.component.html',
  styleUrls: ['./food-recognition-result.component.css']
})
export class FoodRecognitionResultComponent implements OnInit {
  @Input() recognitionResult: FoodRecognitionResultDTO | null = null;
  @Input() originalImage: string | null = null;
  @Output() addToMeal = new EventEmitter<{ food: FoodRecognitionResultDTO; quantity: number }>();
  @Output() tryAgain = new EventEmitter<void>();
  @Output() manualEntry = new EventEmitter<void>();

  selectedQuantity: number = 100;
  nutritionalInfo: NutritionalInfoDTO | null = null;
  isLoadingNutrition: boolean = false;
  showNutritionDetails: boolean = false;
  
  // Make Math available in template
  Math = Math;

  constructor(private foodRecognitionService: FoodRecognitionService) {}

  ngOnInit(): void {
    if (this.recognitionResult) {
      this.loadNutritionalInfo();
    }
  }

  private loadNutritionalInfo(): void {
    if (!this.recognitionResult?.foodId) return;

    this.isLoadingNutrition = true;
    this.foodRecognitionService.getNutritionalInfo(
      this.recognitionResult.foodId, 
      this.selectedQuantity
    ).subscribe({
      next: (info) => {
        this.nutritionalInfo = info;
        this.isLoadingNutrition = false;
      },
      error: (error) => {
        console.error('Error loading nutritional info:', error);
        this.isLoadingNutrition = false;
      }
    });
  }

  onQuantityChange(): void {
    if (this.selectedQuantity > 0) {
      this.loadNutritionalInfo();
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#4caf50'; // Green
    if (confidence >= 0.6) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  getConfidenceText(confidence: number): string {
    if (confidence >= 0.8) return 'Très fiable';
    if (confidence >= 0.6) return 'Moyennement fiable';
    return 'Peu fiable';
  }

  getConfidenceIcon(confidence: number): string {
    if (confidence >= 0.8) return 'fas fa-check-circle';
    if (confidence >= 0.6) return 'fas fa-exclamation-circle';
    return 'fas fa-times-circle';
  }

  onAddToMeal(): void {
    if (this.recognitionResult && this.selectedQuantity > 0) {
      this.addToMeal.emit({
        food: this.recognitionResult,
        quantity: this.selectedQuantity
      });
    }
  }

  onTryAgain(): void {
    this.tryAgain.emit();
  }

  onManualEntry(): void {
    this.manualEntry.emit();
  }

  toggleNutritionDetails(): void {
    this.showNutritionDetails = !this.showNutritionDetails;
  }

  formatNutrientValue(value: number, unit: string): string {
    if (value < 1 && unit === 'g') {
      return `${(value * 1000).toFixed(0)} mg`;
    }
    return `${value.toFixed(1)} ${unit}`;
  }

  getCaloriesPerServing(): number {
    if (!this.nutritionalInfo) return 0;
    return Math.round((this.nutritionalInfo.calories * this.selectedQuantity) / 100);
  }

  getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'fruits': 'fas fa-apple-alt',
      'vegetables': 'fas fa-carrot',
      'grains': 'fas fa-seedling',
      'protein': 'fas fa-drumstick-bite',
      'dairy': 'fas fa-cheese',
      'beverages': 'fas fa-glass-whiskey',
      'snacks': 'fas fa-cookie-bite',
      'desserts': 'fas fa-ice-cream',
      'default': 'fas fa-utensils'
    };
    
    return iconMap[category.toLowerCase()] || iconMap['default'];
  }

  selectAlternative(alternative: any): void {
    // Convert FoodSuggestionDTO to FoodRecognitionResultDTO format
    this.recognitionResult = {
      recognized: true,
      confidence: 0.8, // Default confidence for alternatives
      foodId: alternative.id,
      foodName: alternative.name,
      name: alternative.name,
      category: alternative.category,
      nutritionalInfo: this.nutritionalInfo
    };
    this.loadNutritionalInfo();
  }
}