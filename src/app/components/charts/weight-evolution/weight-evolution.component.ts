import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartDataService, WeightEvolutionDTO } from '../../../services/chart-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-weight-evolution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="weight-evolution-chart">
      <div class="chart-header">
        <h3>Évolution du Poids</h3>
        <div class="chart-stats" *ngIf="stats">
          <div class="stat">
            <span class="label">Poids actuel:</span>
            <span class="value">{{ stats.currentWeight }} kg</span>
          </div>
          <div class="stat">
            <span class="label">Variation:</span>
            <span class="value" [class.positive]="stats.weightChange > 0" [class.negative]="stats.weightChange < 0">
              {{ stats.weightChange > 0 ? '+' : '' }}{{ stats.weightChange }} kg
            </span>
          </div>
          <div class="stat">
            <span class="label">Objectif:</span>
            <span class="value">{{ stats.targetWeight }} kg</span>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
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
    .weight-evolution-chart {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .chart-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .chart-stats {
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

    .stat .value.positive {
      color: #28a745;
    }

    .stat .value.negative {
      color: #dc3545;
    }

    .chart-container {
      flex: 1;
      position: relative;
      min-height: 300px;
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
      .chart-header {
        flex-direction: column;
        align-items: stretch;
      }

      .chart-stats {
        justify-content: space-around;
      }
    }
  `]
})
export class WeightEvolutionComponent implements OnInit, OnChanges {
  @Input() period: '7d' | '30d' | '3m' | '1y' = '30d';
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  stats: {
    currentWeight: number;
    weightChange: number;
    targetWeight: number;
  } | null = null;

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

    this.chartDataService.getWeightEvolution(this.period).subscribe({
      next: (data) => {
        this.processData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Error loading weight evolution data:', error);
      }
    });
  }

  private processData(data: WeightEvolutionDTO[]) {
    if (data.length === 0) {
      this.error = 'Aucune donnée disponible pour cette période';
      return;
    }

    // Calculate stats
    const currentWeight = data[data.length - 1]?.weight || 0;
    const firstWeight = data[0]?.weight || 0;
    const weightChange = Number((currentWeight - firstWeight).toFixed(1));
    const targetWeight = data[data.length - 1]?.target || currentWeight;

    this.stats = {
      currentWeight,
      weightChange,
      targetWeight
    };

    this.createChart(data);
  }

  private createChart(data: WeightEvolutionDTO[]) {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      });
    });

    const weightData = data.map(item => item.weight);
    const targetData = data.map(item => item.target || null);

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Poids (kg)',
            data: weightData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#007bff',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5
          },
          {
            label: 'Objectif (kg)',
            data: targetData,
            borderColor: '#28a745',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
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
              label: (context) => {
                return `${context.dataset.label}: ${context.parsed.y} kg`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Poids (kg)'
            },
            beginAtZero: false
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