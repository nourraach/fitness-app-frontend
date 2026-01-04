import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartDataService, WeeklyProgressDTO } from '../../../services/chart-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-weekly-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="weekly-progress-chart">
      <div class="chart-header">
        <h3>Progrès Hebdomadaire</h3>
        <div class="controls">
          <div class="weeks-selector">
            <label for="weeks">Nombre de semaines:</label>
            <select id="weeks" [(ngModel)]="selectedWeeks" (change)="onWeeksChange()">
              <option value="4">4 semaines</option>
              <option value="8">8 semaines</option>
              <option value="12">12 semaines</option>
              <option value="24">24 semaines</option>
            </select>
          </div>
          <div class="metric-selector">
            <label for="metric">Métrique principale:</label>
            <select id="metric" [(ngModel)]="selectedMetric" (change)="updateChart()">
              <option value="weightChange">Variation de poids</option>
              <option value="caloriesAvg">Calories moyennes</option>
              <option value="activitiesCount">Nombre d'activités</option>
              <option value="progressScore">Score de progrès</option>
            </select>
          </div>
        </div>
      </div>
      
      <div class="progress-summary" *ngIf="summary">
        <div class="summary-card">
          <div class="summary-title">Résumé de la période</div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="label">Variation totale de poids:</span>
              <span class="value" [class.positive]="summary.totalWeightChange > 0" [class.negative]="summary.totalWeightChange < 0">
                {{ summary.totalWeightChange > 0 ? '+' : '' }}{{ summary.totalWeightChange }} kg
              </span>
            </div>
            <div class="summary-stat">
              <span class="label">Calories moyennes/jour:</span>
              <span class="value">{{ summary.avgCaloriesPerDay }} kcal</span>
            </div>
            <div class="summary-stat">
              <span class="label">Activités totales:</span>
              <span class="value">{{ summary.totalActivities }}</span>
            </div>
            <div class="summary-stat">
              <span class="label">Score moyen:</span>
              <span class="value" [class]="getScoreClass(summary.avgProgressScore)">
                {{ summary.avgProgressScore }}/100
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
      
      <div class="progress-insights" *ngIf="insights && insights.length > 0">
        <h4>Insights et Recommandations</h4>
        <div class="insight-item" *ngFor="let insight of insights" [class]="insight.type">
          <i class="fas" [class.fa-arrow-up]="insight.type === 'positive'" 
             [class.fa-arrow-down]="insight.type === 'negative'"
             [class.fa-info-circle]="insight.type === 'neutral'"></i>
          <span>{{ insight.message }}</span>
        </div>
      </div>
      
      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>
      
      <div class="error" *ngIf="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="loadData()">Réessayer</button>
      </div>
    </div>
  `,
  styles: [`
    .weekly-progress-chart {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      margin-bottom: 20px;
    }

    .chart-header h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1.2rem;
    }

    .controls {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .weeks-selector, .metric-selector {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .weeks-selector label, .metric-selector label {
      font-size: 14px;
      color: #666;
      white-space: nowrap;
    }

    .weeks-selector select, .metric-selector select {
      padding: 6px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      font-size: 14px;
    }

    .progress-summary {
      margin-bottom: 20px;
    }

    .summary-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 15px;
    }

    .summary-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .summary-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary-stat .label {
      font-size: 14px;
      color: #666;
    }

    .summary-stat .value {
      font-weight: 600;
      color: #333;
    }

    .summary-stat .value.positive {
      color: #28a745;
    }

    .summary-stat .value.negative {
      color: #dc3545;
    }

    .summary-stat .value.excellent {
      color: #28a745;
    }

    .summary-stat .value.good {
      color: #17a2b8;
    }

    .summary-stat .value.average {
      color: #ffc107;
    }

    .summary-stat .value.poor {
      color: #dc3545;
    }

    .chart-container {
      flex: 1;
      position: relative;
      min-height: 300px;
    }

    .progress-insights {
      margin-top: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .progress-insights h4 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 1rem;
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      font-size: 14px;
    }

    .insight-item.positive {
      color: #28a745;
    }

    .insight-item.negative {
      color: #dc3545;
    }

    .insight-item.neutral {
      color: #17a2b8;
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 300px;
      color: #666;
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error i {
      font-size: 24px;
      color: #dc3545;
      margin-bottom: 10px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    @media (max-width: 768px) {
      .controls {
        flex-direction: column;
        align-items: stretch;
      }

      .summary-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WeeklyProgressComponent implements OnInit {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  selectedWeeks = 12;
  selectedMetric: 'weightChange' | 'caloriesAvg' | 'activitiesCount' | 'progressScore' = 'progressScore';
  
  weeklyData: WeeklyProgressDTO[] = [];
  summary: {
    totalWeightChange: number;
    avgCaloriesPerDay: number;
    totalActivities: number;
    avgProgressScore: number;
  } | null = null;
  
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    message: string;
  }> = [];

  constructor(private chartDataService: ChartDataService) {}

  ngOnInit() {
    this.loadData();
  }

  onWeeksChange() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.error = null;

    this.chartDataService.getWeeklyProgress(this.selectedWeeks).subscribe({
      next: (data) => {
        this.processData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Error loading weekly progress data:', error);
      }
    });
  }

  private processData(data: WeeklyProgressDTO[]) {
    if (data.length === 0) {
      this.error = 'Aucune donnée disponible pour cette période';
      return;
    }

    this.weeklyData = data;
    this.calculateSummary(data);
    this.generateInsights(data);
    this.createChart(data);
  }

  private calculateSummary(data: WeeklyProgressDTO[]) {
    const totalWeightChange = Number(data.reduce((sum, week) => sum + week.weightChange, 0).toFixed(1));
    const avgCaloriesPerDay = Math.round(data.reduce((sum, week) => sum + week.caloriesAvg, 0) / data.length);
    const totalActivities = data.reduce((sum, week) => sum + week.activitiesCount, 0);
    const avgProgressScore = Math.round(data.reduce((sum, week) => sum + week.progressScore, 0) / data.length);

    this.summary = {
      totalWeightChange,
      avgCaloriesPerDay,
      totalActivities,
      avgProgressScore
    };
  }

  private generateInsights(data: WeeklyProgressDTO[]) {
    this.insights = [];

    // Weight trend analysis
    const recentWeeks = data.slice(-4);
    const avgRecentWeightChange = recentWeeks.reduce((sum, week) => sum + week.weightChange, 0) / recentWeeks.length;
    
    if (avgRecentWeightChange > 0.2) {
      this.insights.push({
        type: 'negative',
        message: 'Tendance à la prise de poids ces dernières semaines. Considérez ajuster votre alimentation.'
      });
    } else if (avgRecentWeightChange < -0.2) {
      this.insights.push({
        type: 'positive',
        message: 'Excellente progression ! Vous perdez du poids de manière constante.'
      });
    }

    // Activity consistency
    const avgActivities = data.reduce((sum, week) => sum + week.activitiesCount, 0) / data.length;
    if (avgActivities >= 4) {
      this.insights.push({
        type: 'positive',
        message: 'Très bonne régularité dans vos activités physiques !'
      });
    } else if (avgActivities < 2) {
      this.insights.push({
        type: 'negative',
        message: 'Essayez d\'augmenter la fréquence de vos activités physiques.'
      });
    }

    // Progress score trend
    if (this.summary && this.summary.avgProgressScore >= 80) {
      this.insights.push({
        type: 'positive',
        message: 'Score de progrès excellent ! Continuez sur cette lancée.'
      });
    } else if (this.summary && this.summary.avgProgressScore < 60) {
      this.insights.push({
        type: 'neutral',
        message: 'Il y a de la marge d\'amélioration. Restez motivé et persévérez !'
      });
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 60) return 'average';
    return 'poor';
  }

  updateChart() {
    if (this.weeklyData.length > 0) {
      this.createChart(this.weeklyData);
    }
  }

  private createChart(data: WeeklyProgressDTO[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.map(item => item.week);
    
    // Get data based on selected metric
    let primaryData: number[];
    let primaryLabel: string;
    let primaryColor: string;
    
    switch (this.selectedMetric) {
      case 'weightChange':
        primaryData = data.map(item => item.weightChange);
        primaryLabel = 'Variation de poids (kg)';
        primaryColor = '#ff6384';
        break;
      case 'caloriesAvg':
        primaryData = data.map(item => item.caloriesAvg);
        primaryLabel = 'Calories moyennes (kcal)';
        primaryColor = '#36a2eb';
        break;
      case 'activitiesCount':
        primaryData = data.map(item => item.activitiesCount);
        primaryLabel = 'Nombre d\'activités';
        primaryColor = '#ffce56';
        break;
      default:
        primaryData = data.map(item => item.progressScore);
        primaryLabel = 'Score de progrès';
        primaryColor = '#4bc0c0';
    }

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: primaryLabel,
            data: primaryData,
            borderColor: primaryColor,
            backgroundColor: primaryColor + '20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: primaryColor,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (tooltipItems) => {
                return `Semaine ${tooltipItems[0].label}`;
              },
              label: (context) => {
                const dataIndex = context.dataIndex;
                const week = data[dataIndex];
                const lines = [`${context.dataset.label}: ${context.parsed.y}`];
                
                // Add additional context
                if (this.selectedMetric !== 'weightChange') {
                  lines.push(`Variation poids: ${week.weightChange > 0 ? '+' : ''}${week.weightChange} kg`);
                }
                if (this.selectedMetric !== 'activitiesCount') {
                  lines.push(`Activités: ${week.activitiesCount}`);
                }
                if (this.selectedMetric !== 'progressScore') {
                  lines.push(`Score: ${week.progressScore}/100`);
                }
                
                return lines;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Semaine'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: primaryLabel
            },
            beginAtZero: this.selectedMetric === 'activitiesCount' || this.selectedMetric === 'progressScore'
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}