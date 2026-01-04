import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NutritionPlanService, NutritionPlanDTO, CreateNutritionPlanRequest } from '../../../services/nutrition-plan.service';

@Component({
  selector: 'app-nutrition-plan-generator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="nutrition-plan-generator">
      <h2>Générateur de Plan Nutritionnel</h2>
      
      <form [formGroup]="planForm" (ngSubmit)="generatePlan()" class="plan-form">
        <div class="form-group">
          <label for="objectif">Objectif</label>
          <select id="objectif" formControlName="objectif" class="form-control">
            <option value="PERTE_POIDS">Perte de poids</option>
            <option value="PRISE_MASSE">Prise de masse</option>
            <option value="MAINTIEN">Maintien</option>
            <option value="PERFORMANCE">Performance</option>
          </select>
        </div>

        <div class="form-group">
          <label for="duree">Durée (jours)</label>
          <input type="number" id="duree" formControlName="dureeJours" class="form-control" min="7" max="365">
        </div>

        <div class="form-group">
          <label>Préférences alimentaires</label>
          <div class="checkbox-group">
            <label><input type="checkbox" (change)="togglePreference('vegetarien')"> Végétarien</label>
            <label><input type="checkbox" (change)="togglePreference('vegan')"> Vegan</label>
            <label><input type="checkbox" (change)="togglePreference('sans_gluten')"> Sans gluten</label>
            <label><input type="checkbox" (change)="togglePreference('sans_lactose')"> Sans lactose</label>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" [disabled]="isLoading">
          {{ isLoading ? 'Génération...' : 'Générer le plan' }}
        </button>
      </form>

      <div *ngIf="generatedPlan" class="generated-plan">
        <h3>Plan généré avec succès!</h3>
        <div class="plan-details">
          <p><strong>Nom:</strong> {{ generatedPlan.nom }}</p>
          <p><strong>Objectif:</strong> {{ generatedPlan.objectif }}</p>
          <p><strong>Calories/jour:</strong> {{ generatedPlan.caloriesJournalieres }} kcal</p>
          <p><strong>Protéines:</strong> {{ generatedPlan.proteines }}g</p>
          <p><strong>Glucides:</strong> {{ generatedPlan.glucides }}g</p>
          <p><strong>Lipides:</strong> {{ generatedPlan.lipides }}g</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .nutrition-plan-generator { padding: 20px; max-width: 600px; margin: 0 auto; }
    .plan-form { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .form-group { margin-bottom: 20px; }
    .form-control { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
    .checkbox-group { display: flex; gap: 15px; flex-wrap: wrap; }
    .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background: #007bff; color: white; }
    .generated-plan { margin-top: 20px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
  `]
})
export class NutritionPlanGeneratorComponent implements OnInit {
  planForm: FormGroup;
  isLoading = false;
  generatedPlan: NutritionPlanDTO | null = null;
  selectedPreferences: string[] = [];

  constructor(
    private fb: FormBuilder,
    private nutritionPlanService: NutritionPlanService
  ) {
    this.planForm = this.fb.group({
      objectif: ['PERTE_POIDS', Validators.required],
      dureeJours: [30, [Validators.required, Validators.min(7), Validators.max(365)]]
    });
  }

  ngOnInit() {}

  togglePreference(preference: string) {
    const index = this.selectedPreferences.indexOf(preference);
    if (index > -1) {
      this.selectedPreferences.splice(index, 1);
    } else {
      this.selectedPreferences.push(preference);
    }
  }

  generatePlan() {
    if (this.planForm.valid) {
      this.isLoading = true;
      const clientId = 1; // Should come from auth service
      
      const request: CreateNutritionPlanRequest = {
        clientId,
        nom: `Plan automatique - ${this.planForm.value.objectif}`,
        description: `Plan nutritionnel généré automatiquement`,
        objectif: this.planForm.value.objectif,
        dureeJours: this.planForm.value.dureeJours,
        preferences: this.selectedPreferences
      };

      this.nutritionPlanService.createPlan(request).subscribe({
        next: (plan) => {
          this.generatedPlan = plan;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error generating plan:', error);
          this.isLoading = false;
        }
      });
    }
  }
}