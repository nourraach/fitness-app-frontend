import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ChartDataService, WeightEvolutionDTO } from '../../../services/chart-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-bmi-evolution',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bmi-evolution-chart">
      <div class="chart-header">
        <h3>Évolution de l'IMC</h3>
        <div class="bmi-info" *ngIf="currentBMI">
          <div class="bmi-value" [class]="getBMICategory(currentBMI).class">
            {{ currentBMI }}
          </div>
          <div class="bmi-category">
            {{ getBMICategory(currentBMI).label }}
          </div>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>
      
      <div class="bmi-legend">
        <div class="legend-item underweight">
          <span class="color-box"></span>
          <span>Insuffisance pondérale (&lt; 18.5)</span>
        </div>
        <div class="legend-item normal">
          <span class="color-box"></span>
          <span>Normal (18.5 - 24.9)</span>
        </div>
        <div class="legend-item overweight">
          <span class="color-box"></span>
          <span>Surpoids (25 - 29.9)</span>
        </div>
        <div class="legend-item obese">
          <span class="color-box"></span>
          <span>Obésité (≥ 30)</span>
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
    .bmi-evolution-chart {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .chart-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2rem;
    }

    .bmi-info {
      text-align: center;
    }

    .bmi-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .bmi-value.underweight {
      color: #17a2b8;
    }

    .bmi-value.normal {
      color: #28a745;
    }

    .bmi-value.overweight {
      color: #ffc107;
    }

    .bmi-value.obese {
      color: #dc3545;
    }

    .bmi-category {
      font-size: 12px;
      color: #666;
    }

    .chart-container {
      flex: 1;
      position: relative;
      min-height: 250px;
    }

    .bmi-legend {
      display: flex;
      justify-content: space-around;
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
      flex-wrap: wrap;
      gap: 10px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .color-box {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-item.underweight .color-box {
      background: rgba(23, 162, 184, 0.3);
    }

    .legend-item.normal .color-box {
      background: rgba(40, 167, 69, 0.3);
    }

    .legend-item.overweight .color-box {
      background: rgba(255, 193, 7, 0.3);
    }

    .legend-item.obese .color-box {
      background: rgba(220, 53, 69, 0.3);
    }

    .loading, .error {
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
        gap: 10px;
      }

      .bmi-legend {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class BMIEvolutionComponent implements OnInit, OnChanges {
  @Input() period: '7d' | '30d' | '3m' | '1y' = '30d';
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  chart: Chart | null = null;
  isLoading = false;
  error: string | null = null;
  currentBMI: number | null = null;

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

    this.chartDataService.getBMIEvolution(this.period).subscribe({
      next: (data) => {
        this.processData(data);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des données';
        this.isLoading = false;
        console.error('Error loading BMI evolution data:', error);
      }
    });
  }

  private processData(data: WeightEvolutionDTO[]) {
    if (data.length === 0) {
      this.error = 'Aucune donnée disponible pour cette période';
      return;
    }

    this.currentBMI = data[data.length - 1]?.bmi || null;
    this.createChart(data);
  }

  getBMICategory(bmi: number | null): { label: string; class: string } {
    if (!bmi) {
      return { label: 'Non disponible', class: 'normal' };
    }
    if (bmi < 18.5) {
      return { label: 'Insuffisance pondérale', class: 'underweight' };
    } else if (bmi < 25) {
      return { label: 'Normal', class: 'normal' };
    } else if (bmi < 30) {
      return { label: 'Surpoids', class: 'overweight' };
    } else {
      return { label: 'Obésité', class: 'obese' };
    }
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

    const bmiData = data.map(item => item.bmi);

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'IMC',
            data: bmiData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: bmiData.map(bmi => {
              if (!bmi) return '#6c757d';
              if (bmi < 18.5) return '#17a2b8';
              if (bmi < 25) return '#28a745';
              if (bmi < 30) return '#ffc107';
              return '#dc3545';
            }),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6
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
                const bmi = context.parsed.y;
                const category = this.getBMICategory(bmi);
                return `IMC: ${bmi} (${category.label})`;
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
              text: 'IMC'
            },
            min: 15,
            max: 40,
            ticks: {
              callback: function(value) {
                return value;
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

    // Add BMI zone backgrounds
    const plugin = {
      id: 'bmiZones',
      beforeDraw: (chart: any) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const yScale = chart.scales.y;

        // Save context
        ctx.save();

        // Underweight zone (< 18.5)
        const underweightTop = yScale.getPixelForValue(18.5);
        ctx.fillStyle = 'rgba(23, 162, 184, 0.1)';
        ctx.fillRect(chartArea.left, chartArea.top, chartArea.width, underweightTop - chartArea.top);

        // Normal zone (18.5 - 25)
        const normalTop = yScale.getPixelForValue(25);
        ctx.fillStyle = 'rgba(40, 167, 69, 0.1)';
        ctx.fillRect(chartArea.left, underweightTop, chartArea.width, normalTop - underweightTop);

        // Overweight zone (25 - 30)
        const overweightTop = yScale.getPixelForValue(30);
        ctx.fillStyle = 'rgba(255, 193, 7, 0.1)';
        ctx.fillRect(chartArea.left, normalTop, chartArea.width, overweightTop - normalTop);

        // Obese zone (> 30)
        ctx.fillStyle = 'rgba(220, 53, 69, 0.1)';
        ctx.fillRect(chartArea.left, overweightTop, chartArea.width, chartArea.bottom - overweightTop);

        // Restore context
        ctx.restore();
      }
    };

    this.chart = new Chart(ctx, config);
    Chart.register(plugin);
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}