import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartDataService, ActivityDistributionDTO } from '../../../services/chart-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-activity-distribution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-distribution-chart">
      <div class="chart-header">
        <h3>Répartition des Activités</h3>
        <div class="total-stats" *ngIf="totalStats">
          <div class="stat">
            <span class="label">Durée totale:</span>
            <span class="value">{{ formatDuration(totalStats.totalDuration) }}</span>
          </div>
          <div class="stat">
            <span class="label">Calories totales:</span>
            <span class="value">{{ totalStats.totalCalories }} kcal</span>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
      
      <div class="activities-list" *ngIf="activities && activities.length > 0">
        <div class="activity-item" *ngFor="let activity of activities; let i = index">
          <div class="activity-color" [style.background-color]="getActivityColor(i)"></div>
          <div class="activity-info">
            <div class="activity-name">{{ activity.type }}</div>
            <div class="activity-details">
              {{ formatDuration(activity.duration) }} • {{ activity.calories }} kcal • {{ activity.percentage }}%
            </div>
          </div>
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
      
      <div class="no-data" *ngIf="!isLoading && !error && (!activities || activities.length === 0)">
        <i class="fas fa-chart-pie"></i>
        <p>Aucune activité enregistrée pour cette période</p>
      </div>
    </div>
  `,
  styles: [`
    .activity-distribution-chart {
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

    .total-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .stat .label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat .value {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .chart-container {
      flex: 1;
      position: relative;
      min-height: 250px;
      max-height: 300px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .activities-list {
      margin-top: 20px;
      max-height: 200px;
      overflow-y: auto;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 8px;
      background: #f8f9fa;
      transition: background-color 0.2s;
    }

    .activity-item:hover {
      background: #e9ecef;
    }

    .activity-color {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .activity-info {
      flex: 1;
    }

    .activity-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .activity-details {
      font-size: 12px;
      color: #666;
    }

    .loading, .error, .no-data {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 200px;
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

    .error i, .no-data i {
      font-size: 24px;
      margin-bottom: 10px;
    }

    .error i {
      color: #dc3545;
    }

    .no-data i {
      color: #6c757d;
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
      .total-stats {
        justify-content: space-around;
      }

      .chart-container {
        min-height: 200px;
        max-height: 250px;
      }
    }
  `]
})
export class ActivityDistributionComponent implements OnInit, OnChanges {
  @Input() period: '7d' | '30d' | '3m' | '1y' = '30d';
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  activities: ActivityDistributionDTO[] = [];
  totalStats: {
    totalDuration: number;
    totalCalories: number;
  } | null = null;

  private activityColors = [
    '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', 
    '#9966ff', '#ff9f40', '#ff6384', '#c9cbcf',
    '#4bc0c0', '#ff6384', '#36a2eb', '#ffce56'
  ];

  constructor(private chartDataService: ChartDataService) {}

  ngOnInit() {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['period'] && !changes['period'].firstChange) {
      this.loadData();
    }
  }

  loadData() {
    this.isLoading = true;
    this.error = null;

    this.chartDataService.getActivityDistribution(this.period).subscribe({
      next: (data) => {
        this.processData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Error loading activity distribution data:', error);
      }
    });
  }

  private processData(data: ActivityDistributionDTO[]) {
    this.activities = data;

    if (data.length === 0) {
      return;
    }

    // Calculate total stats
    const totalDuration = data.reduce((sum, item) => sum + item.duration, 0);
    const totalCalories = data.reduce((sum, item) => sum + item.calories, 0);

    this.totalStats = {
      totalDuration,
      totalCalories
    };

    this.createChart(data);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
  }

  getActivityColor(index: number): string {
    return this.activityColors[index % this.activityColors.length];
  }

  private createChart(data: ActivityDistributionDTO[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.map(item => item.type);
    const durations = data.map(item => item.duration);
    const colors = data.map((_, index) => this.getActivityColor(index));

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: durations,
            backgroundColor: colors,
            borderColor: colors.map(color => color),
            borderWidth: 2,
            hoverBorderWidth: 3,
            hoverOffset: 10
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const activity = data[context.dataIndex];
                return [
                  `${activity.type}`,
                  `Durée: ${this.formatDuration(activity.duration)}`,
                  `Calories: ${activity.calories} kcal`,
                  `Pourcentage: ${activity.percentage}%`
                ];
              }
            }
          }
        },
        cutout: '60%',
        interaction: {
          intersect: false
        },
        onHover: (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement;
          if (canvas) {
            canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
          }
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