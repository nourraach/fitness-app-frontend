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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  // ===== EXPORT EXCEL =====
  exporterExcel(): void {
    if (!this.evolution || !this.evolution.historique || this.evolution.historique.length === 0) {
      this.afficherMessage('Aucune donnée à exporter', 'error');
      return;
    }

    // Préparer les données pour Excel
    const donnees = this.evolution.historique.map(mesure => ({
      'Date': new Date(mesure.date).toLocaleDateString('fr-FR'),
      'Poids (kg)': mesure.poids,
      'IMC': mesure.imc || '-',
      'Notes': mesure.notes || ''
    }));

    // Ajouter les statistiques en bas
    if (this.statistiques) {
      donnees.push({} as any); // Ligne vide
      donnees.push({ 'Date': 'STATISTIQUES', 'Poids (kg)': '', 'IMC': '', 'Notes': '' } as any);
      donnees.push({ 'Date': 'Poids Min', 'Poids (kg)': this.statistiques.poidsMin || '-', 'IMC': '', 'Notes': '' } as any);
      donnees.push({ 'Date': 'Poids Max', 'Poids (kg)': this.statistiques.poidsMax || '-', 'IMC': '', 'Notes': '' } as any);
      donnees.push({ 'Date': 'Poids Moyen', 'Poids (kg)': this.statistiques.poidsMoyen || '-', 'IMC': '', 'Notes': '' } as any);
      donnees.push({ 'Date': 'Variation Totale', 'Poids (kg)': this.statistiques.variationTotale || '-', 'IMC': '', 'Notes': '' } as any);
    }

    // Créer le workbook Excel
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(donnees);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evolution Poids');

    // Ajuster la largeur des colonnes
    ws['!cols'] = [
      { wch: 15 }, // Date
      { wch: 12 }, // Poids
      { wch: 10 }, // IMC
      { wch: 30 }  // Notes
    ];

    // Télécharger le fichier
    const dateExport = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `evolution_poids_${dateExport}.xlsx`);
    
    this.afficherMessage('Export Excel réussi !', 'success');
  }

  // ===== EXPORT PDF =====
  exporterPDF(): void {
    if (!this.evolution || !this.evolution.historique || this.evolution.historique.length === 0) {
      this.afficherMessage('Aucune donnée à exporter', 'error');
      return;
    }

    const doc = new jsPDF();
    const dateExport = new Date().toLocaleDateString('fr-FR');

    // Titre
    doc.setFontSize(18);
    doc.setTextColor(17, 63, 103); // #113F67
    doc.text('Évolution de mon Poids', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Exporté le ${dateExport}`, 14, 28);

    // Résumé
    if (this.evolution) {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Résumé', 14, 40);
      
      doc.setFontSize(10);
      doc.text(`Poids actuel: ${this.evolution.poidsActuel || '-'} kg`, 14, 48);
      doc.text(`IMC actuel: ${this.evolution.imcActuel || '-'}`, 14, 54);
      doc.text(`Variation: ${(this.evolution.variationPoids ?? 0) > 0 ? '+' : ''}${this.evolution.variationPoids ?? 0} kg`, 14, 60);
    }

    // Tableau des mesures
    const tableData = this.evolution.historique.map(mesure => [
      new Date(mesure.date).toLocaleDateString('fr-FR'),
      `${mesure.poids} kg`,
      mesure.imc ? mesure.imc.toString() : '-',
      mesure.notes || ''
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Poids', 'IMC', 'Notes']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [17, 63, 103], // #113F67
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      styles: {
        fontSize: 9
      }
    });

    // Statistiques
    if (this.statistiques) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Statistiques de la période', 14, finalY);
      
      doc.setFontSize(10);
      doc.text(`Poids Min: ${this.statistiques.poidsMin || '-'} kg`, 14, finalY + 8);
      doc.text(`Poids Max: ${this.statistiques.poidsMax || '-'} kg`, 14, finalY + 14);
      doc.text(`Poids Moyen: ${this.statistiques.poidsMoyen || '-'} kg`, 14, finalY + 20);
      doc.text(`Variation Totale: ${this.statistiques.variationTotale || '-'} kg`, 14, finalY + 26);
      doc.text(`IMC Moyen: ${this.statistiques.imcMoyen || '-'}`, 14, finalY + 32);
    }

    // Télécharger le PDF
    const dateFile = new Date().toISOString().split('T')[0];
    doc.save(`evolution_poids_${dateFile}.pdf`);
    
    this.afficherMessage('Export PDF réussi !', 'success');
  }
}
