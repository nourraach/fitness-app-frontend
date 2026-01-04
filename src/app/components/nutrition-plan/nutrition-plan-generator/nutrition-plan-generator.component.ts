import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NutritionPlanService, CreateNutritionPlanRequest, NutritionPlanDTO } from '../../../services/nutrition-plan.service';

@Component({
  selector: 'app-nutrition-plan-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="nutrition-plan-generator">
      <div class="generator-header">
        <h2>Générateur de Plan Nutritionnel</h2>
        <p>Créez un plan nutritionnel personnalisé automatiquement selon vos objectifs</p>
      </div>

      <div class="generator-container">
        <form [formGroup]="planForm" (ngSubmit)="onSubmit()" class="plan-form">
          <!-- Informations de base -->
          <div class="form-section">
            <h3>Informations de base</h3>
            
            <div class="form-group">
              <label for="nom">Nom du plan *</label>
              <input 
                type="text" 
                id="nom" 
                formControlName="nom"
                placeholder="Ex: Mon plan minceur"
                class="form-control">
              <div class="error" *ngIf="planForm.get('nom')?.invalid && planForm.get('nom')?.touched">
                Le nom du plan est requis
              </div>
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                formControlName="description"
                placeholder="Décrivez vos attentes et besoins spécifiques..."
                class="form-control"
                rows="3"></textarea>
            </div>
          </div>

          <!-- Objectif principal -->
          <div class="form-section">
            <h3>Objectif principal</h3>
            <div class="objectives-grid">
              <div class="objective-card" 
                   *ngFor="let obj of objectives"
                   [class.selected]="planForm.get('objectif')?.value === obj.value"
                   (click)="selectObjective(obj.value)">
                <div class="objective-icon">
                  <i class="fas" [class]="obj.icon"></i>
                </div>
                <div class="objective-content">
                  <h4>{{ obj.label }}</h4>
                  <p>{{ obj.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Durée -->
          <div class="form-section">
            <h3>Durée du plan</h3>
            <div class="duration-options">
              <div class="duration-option" 
                   *ngFor="let duration of durations"
                   [class.selected]="planForm.get('dureeJours')?.value === duration.days"
                   (click)="selectDuration(duration.days)">
                <span class="duration-value">{{ duration.label }}</span>
                <span class="duration-desc">{{ duration.description }}</span>
              </div>
            </div>
          </div>

          <!-- Préférences alimentaires -->
          <div class="form-section">
            <h3>Préférences alimentaires</h3>
            <div class="preferences-grid">
              <label class="preference-item" *ngFor="let pref of dietaryPreferences">
                <input 
                  type="checkbox" 
                  [value]="pref.value"
                  (change)="onPreferenceChange($event, pref.value)">
                <span class="checkmark"></span>
                <div class="preference-content">
                  <span class="preference-name">{{ pref.label }}</span>
                  <span class="preference-desc">{{ pref.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Restrictions alimentaires -->
          <div class="form-section">
            <h3>Restrictions alimentaires</h3>
            <div class="restrictions-grid">
              <label class="restriction-item" *ngFor="let restriction of restrictions">
                <input 
                  type="checkbox" 
                  [value]="restriction.value"
                  (change)="onRestrictionChange($event, restriction.value)">
                <span class="checkmark"></span>
                <div class="restriction-content">
                  <span class="restriction-name">{{ restriction.label }}</span>
                  <span class="restriction-desc">{{ restriction.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Calories personnalisées (optionnel) -->
          <div class="form-section">
            <h3>Calories personnalisées (optionnel)</h3>
            <p class="section-note">Laissez vide pour un calcul automatique basé sur votre profil</p>
            <div class="form-group">
              <label for="calories">Objectif calorique quotidien</label>
              <input 
                type="number" 
                id="calories" 
                formControlName="caloriesPersonnalisees"
                placeholder="Ex: 2000"
                min="1000"
                max="5000"
                class="form-control">
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="onCancel()">
              Annuler
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="planForm.invalid || isLoading">
              <span *ngIf="isLoading" class="spinner"></span>
              {{ isLoading ? 'Génération...' : 'Générer le plan' }}
            </button>
          </div>
        </form>

        <!-- Aperçu du plan -->
        <div class="plan-preview" *ngIf="showPreview">
          <h3>Aperçu du plan</h3>
          <div class="preview-content">
            <div class="preview-item">
              <span class="label">Objectif:</span>
              <span class="value">{{ getObjectiveLabel(planForm.get('objectif')?.value) }}</span>
            </div>
            <div class="preview-item">
              <span class="label">Durée:</span>
              <span class="value">{{ planForm.get('dureeJours')?.value }} jours</span>
            </div>
            <div class="preview-item" *ngIf="selectedPreferences.length > 0">
              <span class="label">Préférences:</span>
              <span class="value">{{ selectedPreferences.join(', ') }}</span>
            </div>
            <div class="preview-item" *ngIf="selectedRestrictions.length > 0">
              <span class="label">Restrictions:</span>
              <span class="value">{{ selectedRestrictions.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages de feedback -->
      <div class="alert alert-success" *ngIf="successMessage">
        <i class="fas fa-check-circle"></i>
        {{ successMessage }}
      </div>
      
      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .nutrition-plan-generator {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }

    .generator-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .generator-header h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .generator-header p {
      color: #666;
      font-size: 16px;
    }

    .generator-container {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
    }

    .plan-form {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
    }

    .form-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.2rem;
    }

    .section-note {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
      font-style: italic;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .error {
      color: #dc3545;
      font-size: 12px;
      margin-top: 5px;
    }

    .objectives-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .objective-card {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .objective-card:hover {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .objective-card.selected {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .objective-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: #007bff;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
      flex-shrink: 0;
    }

    .objective-content h4 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 1rem;
    }

    .objective-content p {
      margin: 0;
      color: #666;
      font-size: 13px;
    }

    .duration-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .duration-option {
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .duration-option:hover {
      border-color: #007bff;
      background: #f8f9ff;
    }

    .duration-option.selected {
      border-color: #007bff;
      background: #e3f2fd;
    }

    .duration-value {
      display: block;
      font-weight: 600;
      color: #333;
      font-size: 1.1rem;
      margin-bottom: 5px;
    }

    .duration-desc {
      color: #666;
      font-size: 12px;
    }

    .preferences-grid, .restrictions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .preference-item, .restriction-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 15px;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preference-item:hover, .restriction-item:hover {
      background: #f8f9fa;
      border-color: #007bff;
    }

    .preference-item input[type="checkbox"], 
    .restriction-item input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #ddd;
      border-radius: 4px;
      position: relative;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .preference-item input[type="checkbox"]:checked + .checkmark,
    .restriction-item input[type="checkbox"]:checked + .checkmark {
      background: #007bff;
      border-color: #007bff;
    }

    .preference-item input[type="checkbox"]:checked + .checkmark::after,
    .restriction-item input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .preference-content, .restriction-content {
      flex: 1;
    }

    .preference-name, .restriction-name {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
    }

    .preference-desc, .restriction-desc {
      font-size: 12px;
      color: #666;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      gap: 15px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
      flex: 1;
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

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .plan-preview {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
      height: fit-content;
      position: sticky;
      top: 20px;
    }

    .plan-preview h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.1rem;
    }

    .preview-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .preview-item:last-child {
      border-bottom: none;
    }

    .preview-item .label {
      font-weight: 500;
      color: #666;
      font-size: 14px;
    }

    .preview-item .value {
      color: #333;
      font-size: 14px;
      text-align: right;
      flex: 1;
      margin-left: 10px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @media (max-width: 768px) {
      .nutrition-plan-generator {
        padding: 15px;
      }

      .generator-container {
        grid-template-columns: 1fr;
      }

      .plan-form {
        padding: 20px;
      }

      .objectives-grid {
        grid-template-columns: 1fr;
      }

      .objective-card {
        flex-direction: column;
        text-align: center;
      }

      .duration-options {
        grid-template-columns: repeat(2, 1fr);
      }

      .preferences-grid, .restrictions-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class NutritionPlanGeneratorComponent implements OnInit {
  planForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  showPreview = false;
  
  selectedPreferences: string[] = [];
  selectedRestrictions: string[] = [];

  objectives = [
    {
      value: 'PERTE_POIDS',
      label: 'Perte de poids',
      description: 'Réduire la masse corporelle de façon saine',
      icon: 'fa-weight-hanging'
    },
    {
      value: 'PRISE_MASSE',
      label: 'Prise de masse',
      description: 'Augmenter la masse musculaire',
      icon: 'fa-dumbbell'
    },
    {
      value: 'MAINTIEN',
      label: 'Maintien',
      description: 'Maintenir le poids actuel',
      icon: 'fa-balance-scale'
    },
    {
      value: 'PERFORMANCE',
      label: 'Performance',
      description: 'Optimiser les performances sportives',
      icon: 'fa-trophy'
    }
  ];

  durations = [
    { days: 7, label: '1 semaine', description: 'Plan découverte' },
    { days: 14, label: '2 semaines', description: 'Plan d\'essai' },
    { days: 30, label: '1 mois', description: 'Plan standard' },
    { days: 60, label: '2 mois', description: 'Plan intensif' },
    { days: 90, label: '3 mois', description: 'Plan transformation' }
  ];

  dietaryPreferences = [
    {
      value: 'vegetarien',
      label: 'Végétarien',
      description: 'Sans viande ni poisson'
    },
    {
      value: 'vegan',
      label: 'Végan',
      description: 'Sans produits d\'origine animale'
    },
    {
      value: 'mediterraneen',
      label: 'Méditerranéen',
      description: 'Riche en légumes, poissons et huile d\'olive'
    },
    {
      value: 'paleo',
      label: 'Paléo',
      description: 'Aliments non transformés'
    },
    {
      value: 'cetogene',
      label: 'Cétogène',
      description: 'Très faible en glucides'
    },
    {
      value: 'flexitarien',
      label: 'Flexitarien',
      description: 'Principalement végétarien avec occasionnellement de la viande'
    }
  ];

  restrictions = [
    {
      value: 'sans_gluten',
      label: 'Sans gluten',
      description: 'Éviter le blé, orge, seigle'
    },
    {
      value: 'sans_lactose',
      label: 'Sans lactose',
      description: 'Éviter les produits laitiers'
    },
    {
      value: 'sans_noix',
      label: 'Sans noix',
      description: 'Éviter tous les fruits à coque'
    },
    {
      value: 'sans_poisson',
      label: 'Sans poisson',
      description: 'Éviter poissons et fruits de mer'
    },
    {
      value: 'sans_oeuf',
      label: 'Sans œuf',
      description: 'Éviter les œufs et dérivés'
    },
    {
      value: 'faible_sodium',
      label: 'Faible en sodium',
      description: 'Limiter le sel et aliments salés'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private nutritionPlanService: NutritionPlanService,
    private router: Router
  ) {
    this.planForm = this.createForm();
  }

  ngOnInit() {
    // Watch form changes for preview
    this.planForm.valueChanges.subscribe(() => {
      this.showPreview = this.planForm.get('objectif')?.value !== null;
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      objectif: [null, Validators.required],
      dureeJours: [30, Validators.required],
      caloriesPersonnalisees: [null, [Validators.min(1000), Validators.max(5000)]]
    });
  }

  selectObjective(objective: string) {
    this.planForm.patchValue({ objectif: objective });
  }

  selectDuration(days: number) {
    this.planForm.patchValue({ dureeJours: days });
  }

  onPreferenceChange(event: any, preference: string) {
    if (event.target.checked) {
      this.selectedPreferences.push(preference);
    } else {
      this.selectedPreferences = this.selectedPreferences.filter(p => p !== preference);
    }
  }

  onRestrictionChange(event: any, restriction: string) {
    if (event.target.checked) {
      this.selectedRestrictions.push(restriction);
    } else {
      this.selectedRestrictions = this.selectedRestrictions.filter(r => r !== restriction);
    }
  }

  getObjectiveLabel(value: string): string {
    const objective = this.objectives.find(obj => obj.value === value);
    return objective ? objective.label : value;
  }

  onSubmit() {
    if (this.planForm.valid) {
      this.isLoading = true;
      this.clearMessages();

      const request: CreateNutritionPlanRequest = {
        clientId: 1, // This should come from auth service
        nom: this.planForm.value.nom,
        description: this.planForm.value.description || `Plan nutritionnel pour ${this.getObjectiveLabel(this.planForm.value.objectif)}`,
        objectif: this.planForm.value.objectif,
        dureeJours: this.planForm.value.dureeJours,
        preferences: this.selectedPreferences,
        restrictions: this.selectedRestrictions,
        caloriesPersonnalisees: this.planForm.value.caloriesPersonnalisees
      };

      this.nutritionPlanService.createPlan(request).subscribe({
        next: (plan: NutritionPlanDTO) => {
          this.successMessage = 'Plan nutritionnel généré avec succès !';
          this.isLoading = false;
          
          // Redirect to plan details after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/nutrition-plans', plan.id]);
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la génération du plan nutritionnel';
          this.isLoading = false;
          console.error('Error creating nutrition plan:', error);
        }
      });
    }
  }

  onCancel() {
    this.router.navigate(['/nutrition']);
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}