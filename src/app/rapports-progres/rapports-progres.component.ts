import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportProgresService } from '../services/rapport-progres.service';
import { RapportProgresDTO } from '../models/rapport-progres.model';
import { JwtService } from '../service/jwt.service';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-rapports-progres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rapports-progres.component.html',
  styleUrls: ['./rapports-progres.component.css']
})
export class RapportsProgresComponent implements OnInit {
  rapports: RapportProgresDTO[] = [];
  rapportSelectionne: RapportProgresDTO | null = null;
  isCoach = false;
  
  // Liste des clients du coach
  mesClients: Client[] = [];
  
  // Pour la génération de rapport
  clientId: number = 0;
  dateDebut: string = '';
  dateFin: string = '';
  showGenerateForm = false;
  loading = false;
  loadingClients = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private rapportService: RapportProgresService,
    private jwtService: JwtService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.chargerRapports();
    this.initialiserDates();
    if (this.isCoach) {
      this.chargerMesClients();
    }
  }

  checkUserRole(): void {
    const role = this.jwtService.getRole();
    this.isCoach = role?.toLowerCase() === 'role_coach' || role?.toLowerCase() === 'coach';
  }

  chargerMesClients(): void {
    this.loadingClients = true;
    this.clientService.getMyClients().subscribe({
      next: (clients) => {
        this.mesClients = clients;
        this.loadingClients = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
        this.loadingClients = false;
      }
    });
  }

  initialiserDates(): void {
    const aujourd = new Date();
    const jourSemaine = aujourd.getDay();
    const diffLundi = jourSemaine === 0 ? -6 : 1 - jourSemaine;
    
    const lundi = new Date(aujourd);
    lundi.setDate(aujourd.getDate() + diffLundi);
    
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    
    this.dateDebut = this.formatDate(lundi);
    this.dateFin = this.formatDate(dimanche);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  chargerRapports(): void {
    this.loading = true;
    this.errorMessage = '';
    
    const observable = this.isCoach 
      ? this.rapportService.getRapportsCoach()
      : this.rapportService.getRapportsClient();
    
    observable.subscribe({
      next: (data) => {
        this.rapports = data;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des rapports';
        console.error(error);
        this.loading = false;
      }
    });
  }

  genererRapport(): void {
    if (!this.clientId || !this.dateDebut || !this.dateFin) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.rapportService.genererRapport(this.clientId, this.dateDebut, this.dateFin).subscribe({
      next: (rapport) => {
        this.successMessage = 'Rapport généré avec succès';
        this.rapports.unshift(rapport);
        this.showGenerateForm = false;
        this.loading = false;
        this.clientId = 0;
      },
      error: (error) => {
        this.errorMessage = error.error?.erreur || 'Erreur lors de la génération du rapport';
        this.loading = false;
      }
    });
  }

  genererRapportSemaineCourante(): void {
    if (!this.clientId) {
      this.errorMessage = 'Veuillez saisir l\'ID du client';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.rapportService.genererRapportSemaineCourante(this.clientId).subscribe({
      next: (rapport) => {
        this.successMessage = 'Rapport de la semaine courante généré avec succès';
        this.rapports.unshift(rapport);
        this.showGenerateForm = false;
        this.loading = false;
        this.clientId = 0;
      },
      error: (error) => {
        this.errorMessage = error.error?.erreur || 'Erreur lors de la génération du rapport';
        this.loading = false;
      }
    });
  }

  // Générer et exporter directement en Excel sans enregistrer dans la base de données
  genererEtExporterPDF(): void {
    if (!this.clientId || !this.dateDebut || !this.dateFin) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Trouver le nom du client
    const client = this.mesClients.find(c => c.id === this.clientId);
    const clientName = client ? client.name : 'Client';

    // Exporter directement en Excel
    this.exporterExcel(clientName, this.dateDebut, this.dateFin);
    
    this.loading = false;
    this.showGenerateForm = false;
    this.clientId = 0;
    this.successMessage = 'Rapport exporté en Excel avec succès';
  }

  // Export Excel direct
  exporterExcel(clientName: string, dateDebut: string, dateFin: string): void {
    const dateDebutFormatted = new Date(dateDebut).toLocaleDateString('fr-FR');
    const dateFinFormatted = new Date(dateFin).toLocaleDateString('fr-FR');
    
    // Créer le contenu CSV (compatible Excel)
    const csvContent = [
      ['RAPPORT DE PROGRÈS - HEALTHFIT'],
      [''],
      ['Client:', clientName],
      ['Période:', `${dateDebutFormatted} - ${dateFinFormatted}`],
      ['Date de génération:', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['=== POIDS ET IMC ==='],
      ['Poids début (kg):', ''],
      ['Poids fin (kg):', ''],
      ['Variation (kg):', ''],
      ['IMC actuel:', ''],
      [''],
      ['=== NUTRITION ==='],
      ['Nombre de repas:', ''],
      ['Calories/jour:', ''],
      ['Protéines/jour (g):', ''],
      ['Lipides/jour (g):', ''],
      ['Glucides/jour (g):', ''],
      [''],
      ['=== ACTIVITÉ PHYSIQUE ==='],
      ['Nombre d\'activités:', ''],
      ['Jours actifs:', ''],
      ['Durée totale (min):', ''],
      ['Calories brûlées:', ''],
      [''],
      ['=== NOTES ==='],
      ['Observations:', ''],
      ['Recommandations:', '']
    ];

    // Convertir en CSV
    const csvString = csvContent.map(row => row.join(';')).join('\n');
    
    // Créer le blob avec BOM pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    
    // Télécharger
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_${clientName.replace(/\s+/g, '_')}_${dateDebut}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  voirDetails(rapport: RapportProgresDTO): void {
    this.rapportSelectionne = rapport;
  }

  fermerDetails(): void {
    this.rapportSelectionne = null;
  }

  toggleGenerateForm(): void {
    this.showGenerateForm = !this.showGenerateForm;
    this.errorMessage = '';
    this.successMessage = '';
  }

  getVariationPoidsClass(variation?: number): string {
    if (!variation) return '';
    return variation < 0 ? 'text-success' : variation > 0 ? 'text-danger' : 'text-muted';
  }

  getJoursActifsClass(jours?: number): string {
    if (!jours) return 'text-muted';
    if (jours >= 5) return 'text-success';
    if (jours >= 3) return 'text-warning';
    return 'text-danger';
  }

  // Export PDF du rapport
  exporterPDF(rapport: RapportProgresDTO): void {
    const clientName = rapport.nomUtilisateur || 'Client';
    const dateDebut = new Date(rapport.dateDebutSemaine).toLocaleDateString('fr-FR');
    const dateFin = new Date(rapport.dateFinSemaine).toLocaleDateString('fr-FR');
    
    // Créer le contenu HTML pour le PDF
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rapport de Progrès - ${clientName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #84cabe; padding-bottom: 20px; }
          .header h1 { color: #84cabe; margin: 0; }
          .header p { color: #666; margin: 10px 0 0 0; }
          .section { margin-bottom: 25px; }
          .section h2 { color: #2C3E50; border-bottom: 1px solid #eee; padding-bottom: 10px; font-size: 18px; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .stat-item { background: #f8f9fa; padding: 15px; border-radius: 8px; }
          .stat-label { font-size: 12px; color: #666; text-transform: uppercase; }
          .stat-value { font-size: 20px; font-weight: bold; color: #2C3E50; }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport de Progrès</h1>
          <p><strong>${clientName}</strong></p>
          <p>Période: ${dateDebut} - ${dateFin}</p>
          ${rapport.nomCoach ? `<p>Coach: ${rapport.nomCoach}</p>` : ''}
        </div>

        ${rapport.statistiques ? `
        <div class="section">
          <h2>⚖️ Poids et IMC</h2>
          <div class="stats-grid">
            ${rapport.statistiques.poidsDebut ? `<div class="stat-item"><div class="stat-label">Poids début</div><div class="stat-value">${rapport.statistiques.poidsDebut.toFixed(2)} kg</div></div>` : ''}
            ${rapport.statistiques.poidsFin ? `<div class="stat-item"><div class="stat-label">Poids fin</div><div class="stat-value">${rapport.statistiques.poidsFin.toFixed(2)} kg</div></div>` : ''}
            ${rapport.statistiques.variationPoids !== undefined ? `<div class="stat-item"><div class="stat-label">Variation</div><div class="stat-value ${rapport.statistiques.variationPoids < 0 ? 'positive' : 'negative'}">${rapport.statistiques.variationPoids > 0 ? '+' : ''}${rapport.statistiques.variationPoids.toFixed(2)} kg</div></div>` : ''}
            ${rapport.statistiques.imcActuel ? `<div class="stat-item"><div class="stat-label">IMC actuel</div><div class="stat-value">${rapport.statistiques.imcActuel.toFixed(2)}</div></div>` : ''}
          </div>
        </div>

        <div class="section">
          <h2>🍽️ Nutrition</h2>
          <div class="stats-grid">
            <div class="stat-item"><div class="stat-label">Nombre de repas</div><div class="stat-value">${rapport.statistiques.nombreRepas || 0}</div></div>
            ${rapport.statistiques.caloriesMoyennesJour ? `<div class="stat-item"><div class="stat-label">Calories/jour</div><div class="stat-value">${Math.round(rapport.statistiques.caloriesMoyennesJour)} kcal</div></div>` : ''}
            ${rapport.statistiques.proteinesMoyennesJour ? `<div class="stat-item"><div class="stat-label">Protéines/jour</div><div class="stat-value">${rapport.statistiques.proteinesMoyennesJour.toFixed(1)} g</div></div>` : ''}
            ${rapport.statistiques.tauxRespectObjectifCalories ? `<div class="stat-item"><div class="stat-label">Respect objectif</div><div class="stat-value">${rapport.statistiques.tauxRespectObjectifCalories.toFixed(1)}%</div></div>` : ''}
          </div>
        </div>

        <div class="section">
          <h2>💪 Activité Physique</h2>
          <div class="stats-grid">
            <div class="stat-item"><div class="stat-label">Nombre d'activités</div><div class="stat-value">${rapport.statistiques.nombreActivites || 0}</div></div>
            <div class="stat-item"><div class="stat-label">Jours actifs</div><div class="stat-value">${rapport.statistiques.joursActifs || 0}/7</div></div>
            <div class="stat-item"><div class="stat-label">Durée totale</div><div class="stat-value">${rapport.statistiques.minutesTotalesActivite || 0} min</div></div>
            <div class="stat-item"><div class="stat-label">Calories brûlées</div><div class="stat-value">${Math.round(rapport.statistiques.caloriesBrulees || 0)} kcal</div></div>
          </div>
        </div>

        ${rapport.statistiques.tendanceGenerale ? `
        <div class="section">
          <h2>📈 Analyse</h2>
          <p style="background: #e8f5f3; padding: 15px; border-radius: 8px; border-left: 4px solid #84cabe;">${rapport.statistiques.tendanceGenerale}</p>
        </div>
        ` : ''}
        ` : ''}

        ${rapport.resume ? `
        <div class="section">
          <h2>📝 Résumé</h2>
          <pre style="background: #f8f9fa; padding: 15px; border-radius: 8px; white-space: pre-wrap; font-family: inherit;">${rapport.resume}</pre>
        </div>
        ` : ''}

        <div class="footer">
          <p>Rapport généré le ${new Date(rapport.dateGeneration).toLocaleDateString('fr-FR')} - HealthFit Coach</p>
        </div>
      </body>
      </html>
    `;

    // Ouvrir une nouvelle fenêtre et imprimer en PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }
}
