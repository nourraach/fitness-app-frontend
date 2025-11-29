import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProgrammeService } from '../service/programme.service';
import { Programme } from '../models/programme.model';

@Component({
  selector: 'app-programmes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './programmes.component.html',
  styleUrl: './programmes.component.css'
})
export class ProgrammesComponent implements OnInit {
  programmes: Programme[] = [];
  filteredProgrammes: Programme[] = [];
  selectedNiveau: string = 'TOUS';
  selectedObjectif: string = 'TOUS';
  loading: boolean = false;

  constructor(private programmeService: ProgrammeService) { }

  ngOnInit(): void {
    this.loadProgrammes();
  }

  loadProgrammes(): void {
    this.loading = true;
    this.programmeService.getAllProgrammes().subscribe({
      next: (data) => {
        this.programmes = data;
        this.filteredProgrammes = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes:', error);
        this.loading = false;
      }
    });
  }

  filterByNiveau(niveau: string): void {
    this.selectedNiveau = niveau;
    this.applyFilters();
  }

  filterByObjectif(objectif: string): void {
    this.selectedObjectif = objectif;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProgrammes = this.programmes.filter(prog => {
      const niveauMatch = this.selectedNiveau === 'TOUS' || prog.niveau === this.selectedNiveau;
      const objectifMatch = this.selectedObjectif === 'TOUS' || prog.objectif === this.selectedObjectif;
      return niveauMatch && objectifMatch;
    });
  }

  supprimerProgramme(id: number): void {
    if (!id || !confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }

    this.programmeService.deleteProgramme(id).subscribe({
      next: () => {
        this.loadProgrammes();
      },
      error: (error) => {
        console.error('Erreur lors de la suppression du programme:', error);
      }
    });
  }

  changerStatut(id: number, statut: string): void {
    // Cette méthode peut être implémentée plus tard si nécessaire
    console.log('Changement de statut:', id, statut);
  }

  modifierProgramme(programme: Programme): void {
    // Cette méthode peut être implémentée plus tard si nécessaire
    console.log('Modification du programme:', programme);
  }

  getStatutClass(statut?: string): string {
    switch (statut) {
      case 'ACTIF': return 'statut-actif';
      case 'TERMINE': return 'statut-termine';
      case 'SUSPENDU': return 'statut-suspendu';
      case 'ANNULE': return 'statut-annule';
      default: return '';
    }
  }
}
