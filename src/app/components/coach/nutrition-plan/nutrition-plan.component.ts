import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NutritionService } from '../../../services/nutrition.service';
import { NutritionPlan, FoodItem, CreateNutritionPlanRequest, DietaryRestriction } from '../../../models/coach.model';

@Component({
  selector: 'app-nutrition-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="nutrition-plan-container">
      <h2><i class="pi pi-heart"></i> Plans Nutritionnels</h2>
      
      <!-- Create Plan Form -->
      <div class="create-plan-form" *ngIf="showCreateForm">
        <h3>Nouveau Plan Nutritionnel</h3>
        <form (ngSubmit)="createPlan()">
          <input [(ngModel)]="newPlan.name" name="name" placeholder="Nom du plan" required>
          <input [(ngModel)]="newPlan.clientId" name="clientId" type="number" placeholder="ID Client" required>
          <input [(ngModel)]="newPlan.startDate" name="startDate" type="date" required>
          <input [(ngModel)]="newPlan.dailyCalories" name="calories" type="number" placeholder="Calories/jour">
          <button type="submit" class="btn-primary">Créer Plan</button>
          <button type="button" (click)="showCreateForm = false" class="btn-secondary">Annuler</button>
        </form>
      </div>
      
      <!-- Plans List -->
      <div class="plans-list">
        <div class="plan-card" *ngFor="let plan of nutritionPlans">
          <h4>{{ plan.name }}</h4>
          <p>Client: {{ plan.clientName }}</p>
          <p>Calories: {{ plan.dailyCalories }}/jour</p>
          <p>Status: {{ plan.status }}</p>
          <div class="plan-actions">
            <button class="btn-primary" (click)="editPlan(plan.id)">Modifier</button>
            <button class="btn-danger" (click)="deletePlan(plan.id)">Supprimer</button>
          </div>
        </div>
      </div>
      
      <button class="btn-primary" (click)="showCreateForm = true" *ngIf="!showCreateForm">
        <i class="pi pi-plus"></i> Nouveau Plan
      </button>
    </div>
  `,
  styles: [`
    .nutrition-plan-container { padding: 20px; }
    .create-plan-form { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .create-plan-form input { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 4px; }
    .plans-list { display: grid; gap: 15px; }
    .plan-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .plan-actions { display: flex; gap: 10px; margin-top: 10px; }
    .btn-primary, .btn-secondary, .btn-danger { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
    .btn-primary { background: #84cabe; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-danger { background: #dc3545; color: white; }
  `]
})
export class NutritionPlanComponent implements OnInit {
  nutritionPlans: NutritionPlan[] = [];
  showCreateForm = false;
  newPlan: CreateNutritionPlanRequest = {
    clientId: 0,
    name: '',
    startDate: ''
  };

  constructor(private nutritionService: NutritionService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.nutritionService.getNutritionistPlans().subscribe(plans => {
      this.nutritionPlans = plans;
    });
  }

  createPlan(): void {
    this.nutritionService.createNutritionPlan(this.newPlan).subscribe(() => {
      this.loadPlans();
      this.showCreateForm = false;
      this.newPlan = { clientId: 0, name: '', startDate: '' };
    });
  }

  editPlan(planId: number): void {
    console.log('Edit plan:', planId);
  }

  deletePlan(planId: number): void {
    this.nutritionService.deleteNutritionPlan(planId).subscribe(() => {
      this.loadPlans();
    });
  }
}