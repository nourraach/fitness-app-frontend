import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodRecognitionService } from '../../services/food-recognition.service';
import { FoodRecognitionResult, ConfirmedFood, NutritionalInfo } from '../../models/food-recognition.model';
import { validateImageFile, calculateNutritionalValues } from '../../utils/food-recognition.utils';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-food-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food-scanner.component.html',
  styleUrls: ['./food-scanner.component.css']
})
export class FoodScannerComponent {
  @Output() foodConfirmed = new EventEmitter<ConfirmedFood>();

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  result: FoodRecognitionResult | null = null;
  loading = false;
  error: string | null = null;
  showManualEntry = false;
  searchQuery = '';
  searchResults: FoodRecognitionResult[] = [];
  quantity = 100;
  confirmed = false;

  private searchSubject = new Subject<string>();

  constructor(private foodService: FoodRecognitionService) {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(query => {
      if (query.length >= 2) {
        this.foodService.searchFoods(query).subscribe({
          next: results => this.searchResults = results,
          error: () => this.searchResults = []
        });
      } else {
        this.searchResults = [];
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validation = validateImageFile(file);
      if (!validation.valid) {
        this.error = validation.error || 'Fichier invalide';
        return;
      }
      this.selectedImage = file;
      this.error = null;
      const reader = new FileReader();
      reader.onload = () => this.imagePreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  analyzeImage(): void {
    if (!this.selectedImage) return;
    this.loading = true;
    this.error = null;
    this.result = null;
    this.foodService.recognizeFood(this.selectedImage).subscribe({
      next: result => { this.result = result; this.loading = false; if (result.nutritionalInfo) this.quantity = result.nutritionalInfo.quantity; },
      error: err => { this.error = err.error?.message || 'Erreur lors de l\'analyse'; this.loading = false; }
    });
  }

  selectAlternative(foodName: string): void {
    this.loading = true;
    this.foodService.manualEntry(foodName, this.quantity).subscribe({
      next: result => { this.result = result; this.loading = false; },
      error: () => { this.error = 'Erreur lors du chargement'; this.loading = false; }
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  selectSearchResult(result: FoodRecognitionResult): void {
    this.result = result;
    this.searchResults = [];
    this.searchQuery = '';
    this.showManualEntry = false;
    if (result.nutritionalInfo) this.quantity = result.nutritionalInfo.quantity;
  }

  get calculatedNutrition(): NutritionalInfo | null {
    if (!this.result?.nutritionalInfo) return null;
    return calculateNutritionalValues(this.result.nutritionalInfo, this.quantity);
  }

  confirmFood(): void {
    if (!this.result?.foodId || !this.calculatedNutrition) return;
    this.foodConfirmed.emit({
      foodId: this.result.foodId,
      foodName: this.result.foodName || '',
      quantity: this.quantity,
      nutritionalInfo: this.calculatedNutrition
    });
    this.confirmed = true;
    setTimeout(() => this.reset(), 2000);
  }

  retry(): void {
    if (this.selectedImage) this.analyzeImage();
  }

  reset(): void {
    this.selectedImage = null;
    this.imagePreview = null;
    this.result = null;
    this.error = null;
    this.showManualEntry = false;
    this.searchQuery = '';
    this.searchResults = [];
    this.quantity = 100;
    this.confirmed = false;
  }
}
