import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { NotificationService, NotificationStats } from '../../../services/notification.service';

Chart.register(...registerables);

@Component({
  selector: 'app-notification-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notification-stats">
      <div class="stats-header">
        <h2>Statistiques des Notifications</h2>
        <div class="period-selector">
          <label for="period">Période d'analyse:</label>
          <select id="period" [(ngModel)]="selectedPeriod" (change)="onPeriodChange()">
            <option value="">Toute la période</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="3m">3 derniers mois</option>
            <option value="1y">Dernière année</option>
          </select>
        </div>
      </div>

      <div class="stats-overview" *ngIf="stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-bell"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalNotifications }}</div>
            <div class="stat-label">Total notifications</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-eye"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.notificationsLues }}</div>
            <div class="stat-label">Notifications lues</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" [class.excellent]="stats.tauxLecture >= 80" 
               [class.good]="stats.tauxLecture >= 60 && stats.tauxLecture < 80"
               [class.average]="stats.tauxLecture >= 40 && stats.tauxLecture < 60"
               [class.poor]="stats.tauxLecture < 40">
            <i class="fas fa-percentage"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.tauxLecture }}%</div>
            <div class="stat-label">Taux de lecture</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ getWeeklyAverage() }}</div>
            <div class="stat-label">Moyenne/semaine</div>
          </div>
        </div>
      </div>

      <div class="charts-section" *ngIf="stats">
        <div class="chart-container">
          <div class="chart-header">
            <h3>Répartition par Type</h3>
          </div>
          <div class="chart-wrapper">
            <canvas #typeChart></canvas>
          </div>
        </div>

        <div class="chart-container">
          <div class="chart-header">
            <h3>Tendance Hebdomadaire</h3>
          </div>
          <div class="chart-wrapper">
            <canvas #trendChart></canvas>
          </div>
        </div>
      </div>

      <div class="recommendations-section" *ngIf="stats && stats.recommandations.length > 0">
        <h3>Recommandations Personnalisées</h3>
        <div class="recommendations-list">
          <div class="recommendation-item" *ngFor="let recommendation of stats.recommandations">
            <div class="recommendation-icon">
              <i class="fas fa-lightbulb"></i>
            </div>
            <div class="recommendation-content">
              <p>{{ recommendation }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="insights-section" *ngIf="insights.length > 0">
        <h3>Insights et Analyses</h3>
        <div class="insights-list">
          <div class="insight-item" *ngFor="let insight of insights" [class]="insight.type">
            <div class="insight-icon">
              <i class="fas" 
                 [class.fa-arrow-up]="insight.type === 'positive'"
                 [class.fa-arrow-down]="insight.type === 'negative'"
                 [class.fa-info-circle]="insight.type === 'neutral'"></i>
            </div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="loading" *ngIf="isLoading">
        <div class="spinner"></div>
        <p>Chargement des statistiques...</p>
      </div>

      <div class="error" *ngIf="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="loadStats()">Réessayer</button>
      </div>

      <div class="empty-state" *ngIf="!isLoading && !error && !stats">
        <i class="fas fa-chart-bar"></i>
        <h3>Aucune donnée disponible</h3>
        <p>Commencez à recevoir des notifications pour voir vos statistiques.</p>
      </div>
    </div>
  `,
  styles: [`
    .notification-stats {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .stats-header h2 {
      color: #333;
      margin: 0;
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

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
      background: #007bff;
    }

    .stat-icon.excellent {
      background: #28a745;
    }

    .stat-icon.good {
      background: #17a2b8;
    }

    .stat-icon.average {
      background: #ffc107;
    }

    .stat-icon.poor {
      background: #dc3545;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      line-height: 1;
    }

    .stat-label {
      color: #666;
      font-size: 14px;
      margin-top: 4px;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .chart-header {
      margin-bottom: 20px;
    }

    .chart-header h3 {
      color: #333;
      margin: 0;
      font-size: 1.2rem;
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    .recommendations-section, .insights-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .recommendations-section h3, .insights-section h3 {
      color: #333;
      margin-bottom: 20px;
      font-size: 1.2rem;
    }

    .recommendations-list, .insights-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .recommendation-item, .insight-item {
      display: flex;
      gap: 15px;
      padding: 16px;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .recommendation-icon, .insight-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 16px;
      color: white;
    }

    .recommendation-icon {
      background: #ffc107;
    }

    .insight-item.positive .insight-icon {
      background: #28a745;
    }

    .insight-item.negative .insight-icon {
      background: #dc3545;
    }

    .insight-item.neutral .insight-icon {
      background: #17a2b8;
    }

    .recommendation-content, .insight-content {
      flex: 1;
    }

    .insight-content h4 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 1rem;
    }

    .recommendation-content p, .insight-content p {
      margin: 0;
      color: #555;
      line-height: 1.5;
    }

    .loading, .error, .empty-state {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 60px 20px;
      color: #666;
      text-align: center;
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

    .error i, .empty-state i {
      font-size: 48px;
      margin-bottom: 20px;
    }

    .error i {
      color: #dc3545;
    }

    .empty-state i {
      color: #ccc;
    }

    .empty-state h3 {
      margin-bottom: 10px;
      color: #333;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 15px;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    @media (max-width: 768px) {
      .notification-stats {
        padding: 15px;
      }

      .stats-header {
        flex-direction: column;
        align-items: stretch;
      }

      .stats-overview {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .chart-wrapper {
        height: 250px;
      }
    }
  `]
})
export class NotificationStatsComponent implements OnInit {
  @ViewChild('typeChart', { static: true }) typeChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: true }) trendChartCanvas!: ElementRef<HTMLCanvasElement>;

  stats: NotificationStats | null = null;
  selectedPeriod = '';
  isLoading = false;
  error = '';

  typeChart: Chart | null = null;
  trendChart: Chart | null = null;

  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    message: string;
  }> = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.loadStats();
  }

  onPeriodChange() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading = true;
    this.error = '';

    this.notificationService.getStats(this.selectedPeriod || undefined).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.generateInsights();
        this.createCharts();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Erreur lors du chargement des statistiques';
        this.isLoading = false;
        console.error('Error loading stats:', error);
      }
    });
  }

  getWeeklyAverage(): number {
    if (!this.stats || !this.stats.tendanceHebdomadaire.length) {
      return 0;
    }
    const total = this.stats.tendanceHebdomadaire.reduce((sum, week) => sum + week.total, 0);
    return Math.round(total / this.stats.tendanceHebdomadaire.length);
  }

  private generateInsights() {
    if (!this.stats) return;

    this.insights = [];

    // Reading rate analysis
    if (this.stats.tauxLecture >= 80) {
      this.insights.push({
        type: 'positive',
        title: 'Excellent engagement',
        message: 'Vous lisez la plupart de vos notifications. Continuez ainsi !'
      });
    } else if (this.stats.tauxLecture < 50) {
      this.insights.push({
        type: 'negative',
        title: 'Taux de lecture faible',
        message: 'Considérez ajuster vos préférences pour recevoir moins de notifications mais plus pertinentes.'
      });
    }

    // Volume analysis
    const weeklyAvg = this.getWeeklyAverage();
    if (weeklyAvg > 20) {
      this.insights.push({
        type: 'neutral',
        title: 'Volume élevé de notifications',
        message: 'Vous recevez beaucoup de notifications. Pensez à personnaliser vos préférences.'
      });
    } else if (weeklyAvg < 5) {
      this.insights.push({
        type: 'neutral',
        title: 'Peu de notifications',
        message: 'Vous pourriez activer plus de rappels pour rester motivé dans vos objectifs.'
      });
    }

    // Type distribution analysis
    const types = Object.keys(this.stats.repartitionParType);
    const maxType = types.reduce((a, b) => 
      this.stats!.repartitionParType[a] > this.stats!.repartitionParType[b] ? a : b
    );

    if (maxType === 'MOTIVATIONNEL') {
      this.insights.push({
        type: 'positive',
        title: 'Focus sur la motivation',
        message: 'Vous recevez principalement des messages motivationnels. Parfait pour rester engagé !'
      });
    }
  }

  private createCharts() {
    if (!this.stats) return;

    this.createTypeChart();
    this.createTrendChart();
  }

  private createTypeChart() {
    if (this.typeChart) {
      this.typeChart.destroy();
    }

    const ctx = this.typeChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const typeLabels: { [key: string]: string } = {
      'ENTRAINEMENT': 'Entraînement',
      'NUTRITION': 'Nutrition',
      'PESEE': 'Pesée',
      'MOTIVATIONNEL': 'Motivationnel'
    };

    const labels = Object.keys(this.stats!.repartitionParType).map(type => typeLabels[type] || type);
    const data = Object.values(this.stats!.repartitionParType);
    const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545'];

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = data.reduce((sum, value) => sum + value, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    };

    this.typeChart = new Chart(ctx, config);
  }

  private createTrendChart() {
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.stats!.tendanceHebdomadaire.map(week => week.semaine);
    const totalData = this.stats!.tendanceHebdomadaire.map(week => week.total);
    const readData = this.stats!.tendanceHebdomadaire.map(week => week.lues);

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Total notifications',
            data: totalData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Notifications lues',
            data: readData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          },
          tooltip: {
            mode: 'index',
            intersect: false
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
              text: 'Nombre de notifications'
            },
            beginAtZero: true
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.trendChart = new Chart(ctx, config);
  }

  ngOnDestroy() {
    if (this.typeChart) {
      this.typeChart.destroy();
    }
    if (this.trendChart) {
      this.trendChart.destroy();
    }
  }
}