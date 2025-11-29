import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';

@Component({
  selector: 'app-coach-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-clients.component.html',
  styleUrls: ['./coach-clients.component.css']
})
export class CoachClientsComponent implements OnInit {
  myClients: Client[] = [];
  availableClients: Client[] = [];
  selectedClient: Client | null = null;
  showAssignModal = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMyClients();
    this.generateMockData(); // Pour la démo, on génère des données
  }

  loadMyClients(): void {
    this.loading = true;
    this.clientService.getMyClients().subscribe({
      next: (clients) => {
        this.myClients = clients;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients:', error);
        // En cas d'erreur (backend pas prêt), on utilise les données mock
        this.generateMockData();
        this.loading = false;
      }
    });
  }

  loadAvailableClients(): void {
    this.clientService.getAvailableClients().subscribe({
      next: (clients) => {
        this.availableClients = clients;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients disponibles:', error);
        this.generateMockAvailableClients();
      }
    });
  }

  // Données mock pour la démo
  generateMockData(): void {
    this.myClients = [
      {
        id: 1,
        name: 'Marie Dubois',
        email: 'marie.dubois@email.com',
        age: 28,
        phone: '+33 6 12 34 56 78',
        assignedDate: '2025-01-15',
        lastActivity: '2025-11-24',
        programsCount: 3,
        progressRate: 85,
        status: 'active'
      },
      {
        id: 2,
        name: 'Jean Martin',
        email: 'jean.martin@email.com',
        age: 35,
        phone: '+33 6 23 45 67 89',
        assignedDate: '2025-02-10',
        lastActivity: '2025-11-23',
        programsCount: 2,
        progressRate: 72,
        status: 'active'
      },
      {
        id: 3,
        name: 'Sophie Laurent',
        email: 'sophie.laurent@email.com',
        age: 31,
        phone: '+33 6 34 56 78 90',
        assignedDate: '2025-03-05',
        lastActivity: '2025-11-24',
        programsCount: 4,
        progressRate: 92,
        status: 'active'
      },
      {
        id: 4,
        name: 'Pierre Durand',
        email: 'pierre.durand@email.com',
        age: 42,
        phone: '+33 6 45 67 89 01',
        assignedDate: '2025-01-20',
        lastActivity: '2025-11-20',
        programsCount: 1,
        progressRate: 45,
        status: 'inactive'
      }
    ];
  }

  generateMockAvailableClients(): void {
    this.availableClients = [
      {
        id: 5,
        name: 'Emma Bernard',
        email: 'emma.bernard@email.com',
        age: 26,
        status: 'pending'
      },
      {
        id: 6,
        name: 'Lucas Petit',
        email: 'lucas.petit@email.com',
        age: 29,
        status: 'pending'
      },
      {
        id: 7,
        name: 'Chloé Moreau',
        email: 'chloe.moreau@email.com',
        age: 33,
        status: 'pending'
      }
    ];
  }

  openAssignModal(): void {
    this.showAssignModal = true;
    this.loadAvailableClients();
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.errorMessage = '';
  }

  assignClient(client: Client): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.clientService.assignClient(client.id).subscribe({
      next: () => {
        this.successMessage = `${client.name} a été assigné avec succès !`;
        this.myClients.push({
          ...client,
          assignedDate: new Date().toISOString().split('T')[0],
          status: 'active',
          programsCount: 0,
          progressRate: 0
        });
        this.availableClients = this.availableClients.filter(c => c.id !== client.id);
        this.closeAssignModal();
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors de l\'assignation du client';
        this.loading = false;
      }
    });
  }

  unassignClient(client: Client): void {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${client.name} de vos clients ?`)) {
      return;
    }

    this.loading = true;
    this.clientService.unassignClient(client.id).subscribe({
      next: () => {
        this.successMessage = `${client.name} a été retiré de vos clients`;
        this.myClients = this.myClients.filter(c => c.id !== client.id);
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du retrait du client';
        this.loading = false;
      }
    });
  }

  viewClientDetails(client: Client): void {
    this.selectedClient = client;
  }

  closeClientDetails(): void {
    this.selectedClient = null;
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'pending': return 'status-pending';
      default: return '';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'active': return 'Actif';
      case 'inactive': return 'Inactif';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  }

  getProgressClass(rate?: number): string {
    if (!rate) return '';
    if (rate >= 80) return 'progress-excellent';
    if (rate >= 60) return 'progress-good';
    if (rate >= 40) return 'progress-average';
    return 'progress-low';
  }

  get filteredClients(): Client[] {
    if (!this.searchTerm) return this.myClients;
    
    const term = this.searchTerm.toLowerCase();
    return this.myClients.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term)
    );
  }

  getActiveClientsCount(): number {
    return this.myClients.filter(c => c.status === 'active').length;
  }

  getTotalProgramsCount(): number {
    return this.myClients.reduce((sum, c) => sum + (c.programsCount || 0), 0);
  }
}
