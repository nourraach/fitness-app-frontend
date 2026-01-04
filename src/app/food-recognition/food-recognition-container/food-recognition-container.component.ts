import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FoodRecognitionService } from '../../services/food-recognition.service';
import { 
  FoodRecognitionResultDTO, 
  FoodSuggestionDTO, 
  FoodRecognitionState,
  ManualFoodEntryDTO 
} from '../../models/food-recognition.model';

@Component({
  selector: 'app-food-recognition-container',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="food-recognition-container">
      <h2>Reconnaissance d'Aliments</h2>
      
      <!-- Upload Section -->
      <div class="upload-section" *ngIf="!state.result">
        <div class="upload-area" 
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.drag-over]="isDragOver"
             (click)="fileInput.click()">
          
          <div class="upload-content">
            <div class="upload-icon">📷</div>
            <p>Glissez une photo d'aliment ici ou cliquez pour sélectionner</p>
            <p class="upload-hint">Formats supportés: JPG, PNG, GIF (max 5MB)</p>
          </div>
          
          <input #fileInput 
                 type="file" 
                 accept="image/jpeg,image/jpg,image/png,image/gif"
                 (change)="onFileSelected($event)"
                 style="display: none;">
        </div>

        <!-- Preview -->
        <div class="image-preview" *ngIf="selectedFile">
          <img [src]="imagePreview" alt="Preview">
          <div class="preview-actions">
            <button (click)="recognizeFood()" [disabled]="state.isRecognizing" class="btn-primary">
              {{state.isRecognizing ? 'Reconnaissance...' : 'Reconnaître l\'aliment'}}
            </button>
            <button (click)="clearSelection()" class="btn-secondary">Annuler</button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-section" *ngIf="state.isRecognizing">
        <div class="spinner"></div>
        <p>Analyse de l'image en cours...</p>
      </div>

      <!-- Results -->
      <div class="results-section" *ngIf="state.result && !state.isRecognizing">
        <div class="result-card" *ngIf="state.result.recognized">
          <h3>✅ Aliment reconnu!</h3>
          <div class="food-info">
            <h4>{{state.result.foodName}}</h4>
            <p class="category">Catégorie: {{state.result.category}}</p>
            <p class="confidence">Confiance: {{(state.result.confidence * 100).toFixed(1)}}%</p>
          </div>
          
          <!-- Nutritional Info -->
          <div class="nutrition-section" *ngIf="nutritionalInfo">
            <h5>Informations nutritionnelles (pour {{nutritionalInfo.quantity}}{{nutritionalInfo.unit}}):</h5>
            <div class="nutrition-grid">
              <div class="nutrition-item">
                <span class="label">Calories:</span>
                <span class="value">{{nutritionalInfo.calories}} kcal</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Protéines:</span>
                <span class="value">{{nutritionalInfo.proteines}}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Lipides:</span>
                <span class="value">{{nutritionalInfo.lipides}}g</span>
              </div>
              <div class="nutrition-item">
                <span class="label">Glucides:</span>
                <span class="value">{{nutritionalInfo.glucides}}g</span>
              </div>
            </div>
            
            <!-- Quantity Adjustment -->
            <div class="quantity-adjustment">
              <label>Ajuster la quantité:</label>
              <input type="number" 
                     [(ngModel)]="selectedQuantity" 
                     (change)="updateNutritionalInfo()"
                     min="1" max="1000">
              <span>{{nutritionalInfo.unit}}</span>
            </div>
          </div>

          <div class="result-actions">
            <button (click)="addToMeal()" class="btn-success">Ajouter au repas</button>
            <button (click)="startOver()" class="btn-secondary">Nouvelle reconnaissance</button>
          </div>
        </div>

        <div class="result-card error" *ngIf="!state.result.recognized">
          <h3>❌ Reconnaissance échouée</h3>
          <p>{{state.result.message}}</p>
          
          <!-- Manual Entry -->
          <div class="manual-entry">
            <h4>Saisie manuelle</h4>
            <div class="manual-form">
              <input type="text" 
                     [(ngModel)]="manualFoodName" 
                     placeholder="Nom de l'aliment"
                     (input)="onManualInput()">
              <input type="number" 
                     [(ngModel)]="manualQuantity" 
                     placeholder="Quantité (g)"
                     min="1">
              <button (click)="addManualFood()" 
                      [disabled]="!manualFoodName.trim()"
                      class="btn-primary">
                Ajouter manuellement
              </button>
            </div>
            
            <!-- Suggestions -->
            <div class="suggestions" *ngIf="suggestions.length > 0">
              <h5>Suggestions:</h5>
              <div class="suggestion-list">
                <button *ngFor="let suggestion of suggestions" 
                        (click)="selectSuggestion(suggestion)"
                        class="suggestion-item">
                  {{suggestion.name}} <span class="category">({{suggestion.category}})</span>
                </button>
              </div>
            </div>
          </div>

          <button (click)="startOver()" class="btn-secondary">Réessayer avec une autre image</button>
        </div>
      </div>

      <!-- Error -->
      <div class="error-section" *ngIf="error">
        <div class="error-message">
          <h3>❌ Erreur</h3>
          <p>{{error}}</p>
          <button (click)="clearError()" class="btn-secondary">OK</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .food-recognition-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .upload-area {
      border: 2px dashed #007bff;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #f8f9fa;
    }

    .upload-area:hover,
    .upload-area.drag-over {
      border-color: #0056b3;
      background: #e3f2fd;
    }

    .upload-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .upload-hint {
      color: #6c757d;
      font-size: 14px;
      margin-top: 8px;
    }

    .image-preview {
      margin-top: 20px;
      text-align: center;
    }

    .image-preview img {
      max-width: 300px;
      max-height: 300px;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .preview-actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .loading-section {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .result-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin-top: 20px;
    }

    .result-card.error {
      border-left: 4px solid #dc3545;
    }

    .food-info h4 {
      color: #007bff;
      margin: 0 0 10px 0;
      font-size: 24px;
    }

    .category, .confidence {
      color: #6c757d;
      margin: 5px 0;
    }

    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }

    .nutrition-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .nutrition-item .label {
      font-weight: 500;
    }

    .nutrition-item .value {
      color: #007bff;
      font-weight: 600;
    }

    .quantity-adjustment {
      margin: 20px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .quantity-adjustment input {
      width: 80px;
      padding: 6px;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .manual-form {
      display: flex;
      gap: 10px;
      margin: 15px 0;
      flex-wrap: wrap;
    }

    .manual-form input {
      flex: 1;
      min-width: 150px;
      padding: 8px;
      border: 1px solid #ced4da;
      border-radius: 4px;
    }

    .suggestions {
      margin-top: 15px;
    }

    .suggestion-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }

    .suggestion-item {
      padding: 6px 12px;
      border: 1px solid #007bff;
      background: white;
      color: #007bff;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .suggestion-item:hover {
      background: #007bff;
      color: white;
    }

    .suggestion-item .category {
      font-size: 12px;
      opacity: 0.8;
    }

    .result-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
      margin-top: 20px;
    }

    .btn-primary, .btn-secondary, .btn-success {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-primary:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover {
      background: #218838;
    }

    .error-section {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .error-message {
      background: white;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .manual-form {
        flex-direction: column;
      }
      
      .result-actions {
        flex-direction: column;
      }
      
      .nutrition-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FoodRecognitionContainerComponent implements OnInit, OnDestroy {
  state: FoodRecognitionState = {
    isUploading: false,
    isRecognizing: false,
    suggestions: []
  };
  
  selectedFile?: File;
  imagePreview = '';
  isDragOver = false;
  error = '';
  
  nutritionalInfo?: any;
  selectedQuantity = 100;
  
  manualFoodName = '';
  manualQuantity = 100;
  suggestions: FoodSuggestionDTO[] = [];
  
  private destroy$ = new Subject<void>();
  private suggestionTimeout?: number;

  constructor(private foodRecognitionService: FoodRecognitionService) {}

  ngOnInit(): void {
    this.foodRecognitionService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => this.state = state);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    // Validation format
    if (!this.foodRecognitionService.validateFileFormat(file)) {
      this.error = 'Format de fichier non supporté. Utilisez JPG, PNG ou GIF.';
      return;
    }

    // Validation taille
    if (!this.foodRecognitionService.validateFileSize(file)) {
      this.error = 'Fichier trop volumineux. Taille maximale: 5MB.';
      return;
    }

    this.selectedFile = file;
    this.createImagePreview(file);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async recognizeFood(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      // Compression de l'image
      const compressedFile = await this.foodRecognitionService.compressImage(this.selectedFile);
      
      this.foodRecognitionService.recognizeFood(compressedFile).subscribe({
        next: (result) => {
          this.foodRecognitionService.updateState({ 
            result, 
            isRecognizing: false 
          });
          
          if (result.recognized && result.foodId) {
            this.loadNutritionalInfo(result.foodId);
          }
        },
        error: (err) => {
          this.error = 'Erreur lors de la reconnaissance: ' + err.message;
          this.foodRecognitionService.updateState({ isRecognizing: false });
        }
      });
    } catch (err) {
      this.error = 'Erreur lors de la compression de l\'image';
      this.foodRecognitionService.updateState({ isRecognizing: false });
    }
  }

  private loadNutritionalInfo(foodId: number): void {
    this.foodRecognitionService.getNutritionalInfo(foodId, this.selectedQuantity).subscribe({
      next: (info) => {
        this.nutritionalInfo = info;
      },
      error: (err) => {
        console.error('Erreur chargement infos nutritionnelles:', err);
      }
    });
  }

  updateNutritionalInfo(): void {
    if (this.state.result?.foodId) {
      this.loadNutritionalInfo(this.state.result.foodId);
    }
  }

  onManualInput(): void {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    this.suggestionTimeout = window.setTimeout(() => {
      if (this.manualFoodName.trim().length > 2) {
        this.loadSuggestions();
      } else {
        this.suggestions = [];
      }
    }, 300);
  }

  private loadSuggestions(): void {
    this.foodRecognitionService.getFoodSuggestions(this.manualFoodName).subscribe({
      next: (suggestions) => {
        this.suggestions = suggestions;
      },
      error: (err) => {
        console.error('Erreur chargement suggestions:', err);
      }
    });
  }

  selectSuggestion(suggestion: FoodSuggestionDTO): void {
    this.manualFoodName = suggestion.name;
    this.suggestions = [];
  }

  addManualFood(): void {
    const manualEntry: ManualFoodEntryDTO = {
      foodName: this.manualFoodName.trim(),
      quantity: this.manualQuantity
    };

    this.foodRecognitionService.addManualFood(manualEntry).subscribe({
      next: (result) => {
        this.foodRecognitionService.updateState({ result });
        if (result.foodId) {
          this.loadNutritionalInfo(result.foodId);
        }
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'ajout manuel: ' + err.message;
      }
    });
  }

  addToMeal(): void {
    // TODO: Intégrer avec le système de repas existant
    alert('Aliment ajouté au repas! (Intégration à implémenter)');
    this.startOver();
  }

  clearSelection(): void {
    this.selectedFile = undefined;
    this.imagePreview = '';
  }

  startOver(): void {
    this.clearSelection();
    this.nutritionalInfo = undefined;
    this.manualFoodName = '';
    this.manualQuantity = 100;
    this.suggestions = [];
    this.foodRecognitionService.resetState();
  }

  clearError(): void {
    this.error = '';
  }
}