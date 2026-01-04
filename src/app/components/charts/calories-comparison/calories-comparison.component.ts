import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartDataService, CaloriesComparisonDTO } from '../../../services/chart-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-calories-comparison',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="calories-comparison-chart">
      <div class="chart-header">
        <h3>Comparaison Calories</h3>
        <div class="calories-stats" *ngIf="stats">
          <div class="stat">
            <span class="label">Moyenne consommées:</span>
            <span class="value consumed">{{ stats.avgConsumed }} kcal</span>
          </div>
          <div class="stat">
            <span class="label">Moyenne brûlées:</span>
            <span class="value burned">{{ stats.avgBurned }} kcal</span>
          </div>
          <div class="stat">
            <span class="label">Bilan moyen:</span>
            <span class="value" [class.positive]="stats.avgBalance > 0" [class.negative]="stats.avgBalance < 0">
              {{ stats.avgBalance > 0 ? '+' : '' }}{{ stats.avgBalance }} kcal
            </span>
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
      
      <div class="chart-legend">
        <div class="legend-item">
          <span class="color-box consumed"></span>
          <span>Calories consommées</span>
        </div>
        <div class="legend-item">
          <span class="color-box burned"></span>
          <span>Calories brûlées</span>
        </div>
        <div class="legend-item">
          <span class="color-box target"></span>
          <span>Objectif quotidien</span>
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
    .calories-comparison-chart {
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

    .calories-stats {
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
    }

    .stat .value.consumed {
      color: #ff6384;
    }

    .stat .value.burned {
      color: #36a2eb;
    }

    .stat .value.positive {
      color: #dc3545;
    }

    .stat .value.negative {
      color: #28a745;
    }

    .chart-container {
      flex: 1;
      position: relative;
      min-height: 300px;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .color-box {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .color-box.consumed {
      background: #ff6384;
    }

    .color-box.burned {
      background: #36a2eb;
    }

    .color-box.target {
      background: #ffce56;
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
      .calories-stats {
        justify-content: space-around;
      }

      .chart-legend {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class CaloriesComparisonComponent implements OnInit, OnChanges {
  @Input() period: '7d' | '30d' | '3m' | '1y' = '30d';
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  stats: {
    avgConsumed: number;
    avgBurned: number;
    avgBalance: number;
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

    this.chartDataService.getCaloriesComparison(this.period).subscribe({
      next: (data) => {
        this.processData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Error loading calories comparison data:', error);
      }
    });
  }

  private processData(data: CaloriesComparisonDTO[]) {
    if (data.length === 0) {
      this.error = 'Aucune donnée disponible pour cette période';
      return;
    }

    // Calculate stats
    const avgConsumed = Math.round(data.reduce((sum, item) => sum + item.consumed, 0) / data.length);
    const avgBurned = Math.round(data.reduce((sum, item) => sum + item.burned, 0) / data.length);
    const avgBalance = avgConsumed - avgBurned;

    this.stats = {
      avgConsumed,
      avgBurned,
      avgBalance
    };

    this.createChart(data);
  }

  private createChart(data: CaloriesComparisonDTO[]) {
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

    const consumedData = data.map(item => item.consumed);
    const burnedData = data.map(item => item.burned);
    const targetData = data.map(item => item.target);

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Calories consommées',
            data: consumedData,
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: '#ff6384',
            borderWidth: 1
          },
          {
            label: 'Calories brûlées',
            data: burnedData,
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: '#36a2eb',
            borderWidth: 1
          },
          {
            label: 'Objectif quotidien',
            data: targetData,
            type: 'line' as ChartType,
            borderColor: '#ffce56',
            backgroundColor: 'transparent',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
            tension: 0
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
            mode: 'index',
            intersect: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                const label = context.dataset.label;
                return `${label}: ${value} kcal`;
              },
              afterBody: (tooltipItems) => {
                const dataIndex = tooltipItems[0].dataIndex;
                const consumed = consumedData[dataIndex];
                const burned = burnedData[dataIndex];
                const balance = consumed - burned;
                return [`Bilan: ${balance > 0 ? '+' : ''}${balance} kcal`];
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
              text: 'Calories (kcal)'
            },
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value + ' kcal';
              }
            }
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