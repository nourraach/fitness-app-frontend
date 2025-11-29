import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { SuiviPoidsService } from '../service/suivi-poids.service';
import { 
  EvolutionPoidsDTO, 
  StatistiquesProgressionDTO, 
  AjouterPoidsRequest 
} from '../models/suivi-poids.model';

Chart.register(...registerables);

@Component({
  selector: 'app-evolution-poids',
  imports: [CommonModule, FormsModule],
  templateUrl: './evolution-poids.component.html',
  styleUrls: ['./evolution-poids.component.css']
})
export class EvolutionPoidsComponent implements OnInit {
  @ViewChild('poidsChart') poidsChartRef!: ElementRef;
  @ViewChild('imcChart') imcChartRef!: ElementRef;
  
  evolution: EvolutionPoidsDTO | null = null;
  statistiques: StatistiquesProgressionDTO | null = null;
  
  poidsChart: Chart | null = null;
  imcChart: Chart | null = null;
  
  // Filtres de période
  periodeSelectionnee: string = '30';
  dateDebut: string = '';
  dateFin: string = '';
  
  // Modal ajout poids
  afficherModalAjout: boolean = false;
  nouveauPoids: number = 0;
  dateNouvelleMesure: string = '';
  notesNouvelleMesure: string = '';
  
  loading: boolean = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private suiviPoidsService: SuiviPoidsService) {}

  ngOnInit(): void {
    this.dateNouvelleMesure = this.getDateAujourdhui();
    this.chargerDonnees();
  }

  getDateAujourdhui(): string {
    return new Date().toISOString().split('T')[0];
  }

  chargerDonnees(): void {
    this.loading = true;
    
    const dates = this.calculerDates();
    
    this.suiviPoidsService.getEvolutionPoids(dates.debut, dates.fin).subscribe({
      next: (data) => {
        this.evolution = data;
        this.loading = false;
        setTimeout(() => this.creerGraphiques(), 100);
      },
      error: (err) => {
        console.error('Erreur chargement évolution:', err);
        this.loading = false;
      }
    });
    
    if (dates.debut && dates.fin) {
      this.suiviPoidsService.getStatistiquesProgression(dates.debut, dates.fin).subscribe({
        next: (stats) => {
          this.statistiques = stats;
        },
        error: (err) => console.error('Erreur chargement statistiques:', err)
      });
    }
  }

  calculerDates(): { debut: string | undefined, fin: string | undefined } {
    const aujourdhui = new Date();
    let dateDebut: Date | undefined;
    
    switch (this.periodeSelectionnee) {
      case '7':
        dateDebut = new Date(aujourdhui);
        dateDebut.setDate(dateDebut.getDate() - 7);
        break;
      case '30':
        dateDebut = new Date(aujourdhui);
        dateDebut.setDate(dateDebut.getDate() - 30);
        break;
      case '90':
        dateDebut = new Date(aujourdhui);
        dateDebut.setDate(dateDebut.getDate() - 90);
        break;
      case '365':
        dateDebut = new Date(aujourdhui);
        dateDebut.setFullYear(dateDebut.getFullYear() - 1);
        break;
      case 'all':
        return { debut: undefined, fin: undefined };
      case 'custom':
        return { 
          debut: this.dateDebut || undefined, 
          fin: this.dateFin || undefined 
        };
    }
    
    return {
      debut: dateDebut ? dateDebut.toISOString().split('T')[0] : undefined,
      fin: aujourdhui.toISOString().split('T')[0]
    };
  }

  creerGraphiques(): void {
    if (!this.evolution || !this.evolution.historique || this.evolution.historique.length === 0) {
      return;
    }
    
    const historique = [...this.evolution.historique].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const labels = historique.map(h => new Date(h.date).toLocaleDateString('fr-FR'));
    const poids = historique.map(h => h.poids);
    const imc = historique.map(h => h.imc || 0);
    
    this.creerGraphiquePoids(labels, poids);
    this.creerGraphiqueIMC(labels, imc);
  }

  creerGraphiquePoids(labels: string[], data: number[]): void {
    if (this.poidsChart) {
      this.poidsChart.destroy();
    }
    
    const ctx = this.poidsChartRef.nativeElement.getContext('2d');
    
    this.poidsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Poids (kg)',
            data: data,
            borderColor: '#84cabe',
            backgroundColor: 'rgba(132, 202, 190, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#84cabe',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
          },
          ...(this.evolution?.poidsObjectif ? [{
            label: 'Objectif',
            data: Array(labels.length).fill(this.evolution.poidsObjectif),
            borderColor: '#ff6b6b',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }] : [])
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
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Poids (kg)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  }

  creerGraphiqueIMC(labels: string[], data: number[]): void {
    if (this.imcChart) {
      this.imcChart.destroy();
    }
    
    const ctx = this.imcChartRef.nativeElement.getContext('2d');
    
    this.imcChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'IMC',
          data: data,
          borderColor: '#113F67',
          backgroundColor: 'rgba(17, 63, 103, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#113F67',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
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
              afterLabel: (context: any) => {
                const imc = context.parsed.y;
                if (imc && typeof imc === 'number') {
                  return this.getCategorieIMC(imc);
                }
                return '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'IMC'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          }
        }
      }
    });
  }

  getCategorieIMC(imc: number): string {
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Poids normal';
    if (imc < 30) return 'Surpoids';
    return 'Obésité';
  }

  changerPeriode(): void {
    this.chargerDonnees();
  }

  ouvrirModalAjout(): void {
    this.afficherModalAjout = true;
    this.nouveauPoids = 0;
    this.dateNouvelleMesure = this.getDateAujourdhui();
    this.notesNouvelleMesure = '';
  }

  fermerModalAjout(): void {
    this.afficherModalAjout = false;
  }

  ajouterPoids(): void {
    if (!this.nouveauPoids || this.nouveauPoids <= 0) {
      this.afficherMessage('Veuillez saisir un poids valide', 'error');
      return;
    }
    
    const request: AjouterPoidsRequest = {
      poids: this.nouveauPoids,
      date: this.dateNouvelleMesure,
      notes: this.notesNouvelleMesure
    };
    
    this.suiviPoidsService.ajouterPoids(request).subscribe({
      next: () => {
        this.afficherMessage('Poids ajouté avec succès', 'success');
        this.fermerModalAjout();
        this.chargerDonnees();
      },
      error: (err) => {
        console.error('Erreur ajout poids:', err);
        this.afficherMessage('Erreur lors de l\'ajout du poids', 'error');
      }
    });
  }

  supprimerPoids(poidsId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette mesure ?')) {
      this.suiviPoidsService.supprimerPoids(poidsId).subscribe({
        next: () => {
          this.afficherMessage('Mesure supprimée', 'success');
          this.chargerDonnees();
        },
        error: (err) => {
          console.error('Erreur suppression:', err);
          this.afficherMessage('Erreur lors de la suppression', 'error');
        }
      });
    }
  }

  afficherMessage(msg: string, type: 'success' | 'error'): void {
    this.message = msg;
    this.messageType = type;
    setTimeout(() => this.message = '', 3000);
  }

  getTendanceIcon(): string {
    if (!this.evolution?.tendance) return '➡️';
    switch (this.evolution.tendance) {
      case 'HAUSSE': return '📈';
      case 'BAISSE': return '📉';
      default: return '➡️';
    }
  }

  getTendanceColor(): string {
    if (!this.evolution?.tendance) return '#666';
    switch (this.evolution.tendance) {
      case 'HAUSSE': return '#ff6b6b';
      case 'BAISSE': return '#4CAF50';
      default: return '#666';
    }
  }
}
