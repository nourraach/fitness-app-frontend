import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WeightEvolutionComponent } from '../weight-evolution/weight-evolution.component';
import { BMIEvolutionComponent } from '../bmi-evolution/bmi-evolution.component';
import { CaloriesComparisonComponent } from '../calories-comparison/calories-comparison.component';
import { ActivityDistributionComponent } from '../activity-distribution/activity-distribution.component';
import { WeeklyProgressComponent } from '../weekly-progress/weekly-progress.component';

@Component({
  selector: 'app-charts-container',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WeightEvolutionComponent,
    BMIEvolutionComponent,
    CaloriesComparisonComponent,
    ActivityDistributionComponent,
    WeeklyProgressComponent
  ],
  template: `
    <div class="charts-container">
      <div class="charts-header">
        <h2>Évolution et Statistiques</h2>
        <div class="period-selector">
          <label for="period">Période:</label>
          <select id="period" [(ngModel)]="selectedPeriod" (change)="onPeriodChange()">
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="3m">3 mois</option>
            <option value="1y">1 an</option>
          </select>
        </div>
        <div class="export-actions">
          <button class="btn btn-outline" (click)="exportToPDF()">
            <i class="fas fa-file-pdf"></i> Exporter PDF
          </button>
          <button class="btn btn-outline" (click)="exportToExcel()">
            <i class="fas fa-file-excel"></i> Exporter Excel
          </button>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <app-weight-evolution [period]="selectedPeriod"></app-weight-evolution>
        </div>
        
        <div class="chart-card">
          <app-bmi-evolution [period]="selectedPeriod"></app-bmi-evolution>
        </div>
        
        <div class="chart-card">
          <app-calories-comparison [period]="selectedPeriod"></app-calories-comparison>
        </div>
        
        <div class="chart-card">
          <app-activity-distribution [period]="selectedPeriod"></app-activity-distribution>
        </div>
        
        <div class="chart-card full-width">
          <app-weekly-progress></app-weekly-progress>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    </div>
  `,
  styles: [`
    .charts-container {
      padding: 20px;
      position: relative;
    }

    .charts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .charts-header h2 {
      margin: 0;
      color: #333;
      font-size: 1.8rem;
    }

    .period-selector {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .period-selector label {
      font-weight: 500;
      color: #666;
    }

    .period-selector select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      background: white;
      font-size: 14px;
    }

    .export-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-outline {
      background: white;
      border: 1px solid #007bff;
      color: #007bff;
    }

    .btn-outline:hover {
      background: #007bff;
      color: white;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 20px;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 20px;
      min-height: 400px;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .charts-header {
        flex-direction: column;
        align-items: stretch;
      }

      .charts-grid {
        grid-template-columns: 1fr;
      }

      .export-actions {
        justify-content: center;
      }
    }
  `]
})
export class ChartsContainerComponent implements OnInit {
  selectedPeriod: '7d' | '30d' | '3m' | '1y' = '30d';
  isLoading = false;

  ngOnInit() {
    // Component initialization
  }

  onPeriodChange() {
    this.isLoading = true;
    // Simulate loading delay
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  exportToPDF() {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
    // This would integrate with a PDF generation library like jsPDF
  }

  exportToExcel() {
    // Implementation for Excel export
    console.log('Exporting to Excel...');
    // This would integrate with a library like xlsx
  }
}