import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

@Injectable({
  providedIn: 'root'
})
export class ChartHelperService {

  constructor() {}

  /**
   * Créer un graphique avec gestion des types TypeScript
   */
  createChart(
    canvas: HTMLCanvasElement,
    type: ChartType,
    data: ChartData,
    options?: any
  ): Chart {
    const config: ChartConfiguration = {
      type: type,
      data: {
        labels: data.labels,
        datasets: data.datasets.map(dataset => ({
          ...dataset,
          data: dataset.data
        }))
      },
      options: options || this.getDefaultOptions(type)
    };

    return new Chart(canvas, config as any);
  }

  /**
   * Créer un graphique en secteurs (doughnut)
   */
  createDoughnutChart(
    canvas: HTMLCanvasElement,
    data: ChartData,
    options?: any
  ): Chart<any> {
    return this.createChart(canvas, 'doughnut', data, {
      ...this.getDefaultDoughnutOptions(),
      ...options
    });
  }

  /**
   * Créer un graphique en barres
   */
  createBarChart(
    canvas: HTMLCanvasElement,
    data: ChartData,
    options?: any
  ): Chart<any> {
    return this.createChart(canvas, 'bar', data, {
      ...this.getDefaultBarOptions(),
      ...options
    });
  }

  /**
   * Créer un graphique linéaire
   */
  createLineChart(
    canvas: HTMLCanvasElement,
    data: ChartData,
    options?: any
  ): Chart<any> {
    return this.createChart(canvas, 'line', data, {
      ...this.getDefaultLineOptions(),
      ...options
    });
  }

  /**
   * Options par défaut pour les graphiques doughnut
   */
  private getDefaultDoughnutOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '60%',
      animation: {
        animateRotate: true,
        animateScale: false
      }
    };
  }

  /**
   * Options par défaut pour les graphiques en barres
   */
  private getDefaultBarOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      }
    };
  }

  /**
   * Options par défaut pour les graphiques linéaires
   */
  private getDefaultLineOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top' as const
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      },
      elements: {
        line: {
          tension: 0.4
        },
        point: {
          radius: 4,
          hoverRadius: 6
        }
      }
    };
  }

  /**
   * Options par défaut génériques
   */
  private getDefaultOptions(type: ChartType): any {
    switch (type) {
      case 'doughnut':
      case 'pie':
        return this.getDefaultDoughnutOptions();
      case 'bar':
        return this.getDefaultBarOptions();
      case 'line':
        return this.getDefaultLineOptions();
      default:
        return {
          responsive: true,
          maintainAspectRatio: false
        };
    }
  }

  /**
   * Générer des couleurs pour les datasets
   */
  generateColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  /**
   * Convertir les données du backend vers le format Chart.js
   */
  convertBackendData(backendData: any): ChartData {
    if (backendData.labels && backendData.datasets) {
      return {
        labels: backendData.labels,
        datasets: backendData.datasets.map((dataset: any) => ({
          label: dataset.label,
          data: dataset.data,
          backgroundColor: dataset.backgroundColor || this.generateColors(dataset.data.length),
          borderColor: dataset.borderColor,
          borderWidth: dataset.borderWidth || 1,
          fill: dataset.fill
        }))
      };
    }
    
    // Format de fallback si les données ne correspondent pas
    return {
      labels: [],
      datasets: []
    };
  }

  /**
   * Détruire un graphique proprement
   */
  destroyChart(chart: Chart<any> | null): void {
    if (chart) {
      chart.destroy();
    }
  }

  /**
   * Mettre à jour les données d'un graphique
   */
  updateChartData(chart: Chart<any>, newData: ChartData): void {
    chart.data.labels = newData.labels;
    chart.data.datasets = newData.datasets;
    chart.update();
  }

  /**
   * Redimensionner un graphique
   */
  resizeChart(chart: Chart<any>): void {
    chart.resize();
  }
}