import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapportProgresService } from '../services/rapport-progres.service';
import { RapportProgresDTO } from '../models/rapport-progres.model';
import { JwtService } from '../service/jwt.service';

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
  
  // Pour la génération de rapport
  clientId: number = 0;
  dateDebut: string = '';
  dateFin: string = '';
  showGenerateForm = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private rapportService: RapportProgresService,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.chargerRapports();
    this.initialiserDates();
  }

  checkUserRole(): void {
    const role = this.jwtService.getRole();
    this.isCoach = role?.toLowerCase() === 'role_coach' || role?.toLowerCase() === 'coach';
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
}
