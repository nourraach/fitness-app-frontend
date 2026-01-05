import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { Client } from '../models/client.model';
import { EnhancedClientDTO, EnhancedClientUtils, ClientStatistics } from '../models/enhanced-client.model';

@Component({
  selector: 'app-coach-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-clients.component.html',
  styleUrls: ['./coach-clients.component.css']
})
export class CoachClientsComponent implements OnInit {
  myClients: EnhancedClientDTO[] = [];
  availableClients: Client[] = [];
  selectedClient: EnhancedClientDTO | null = null;
  clientStatistics: ClientStatistics | null = null;
  showAssignModal = false;
  loading = false;
  errorMessage = '';
  successMessage = '';
  searchTerm = '';
  sortBy: 'name' | 'progressRate' | 'programsCount' | 'lastActivity' = 'name';
  showInactiveOnly = false;

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEnhancedClients();
  }

  loadEnhancedClients(): void {
    this.loading = true;
    this.clientService.getEnhancedClients().subscribe({
      next: (clients) => {
        // Enrichir les clients avec les données calculées côté frontend
        this.myClients = clients.map(client => EnhancedClientUtils.enrichClient(client));
        this.clientStatistics = EnhancedClientUtils.getClientStatistics(this.myClients);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients améliorés:', error);
        // En cas d'erreur, fallback vers les données mock
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

  // Données mock pour la démo (fallback)
  generateMockData(): void {
    const mockClients: EnhancedClientDTO[] = [
      {
        id: 1,
        name: 'Marie Dubois',
        email: 'marie.dubois@email.com',
        age: 28,
        phone: '+33 6 12 34 56 78',
        assignedDate: '2025-01-15',
        lastActivity: '2025-01-03',
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
        lastActivity: '2025-01-04',
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
        lastActivity: '2024-12-20',
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
        lastActivity: 'Aucune activité',
        programsCount: 0,
        progressRate: 0,
        status: 'inactive'
      }
    ];

    // Enrichir les clients mock avec les données calculées
    this.myClients = mockClients.map(client => EnhancedClientUtils.enrichClient(client));
    this.clientStatistics = EnhancedClientUtils.getClientStatistics(this.myClients);
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
        // Recharger la liste des clients améliorés
        this.loadEnhancedClients();
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

  unassignClient(client: EnhancedClientDTO): void {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${client.name} de vos clients ?`)) {
      return;
    }

    this.loading = true;
    this.clientService.unassignClient(client.id).subscribe({
      next: () => {
        this.successMessage = `${client.name} a été retiré de vos clients`;
        this.myClients = this.myClients.filter(c => c.id !== client.id);
        this.clientStatistics = EnhancedClientUtils.getClientStatistics(this.myClients);
        this.loading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du retrait du client';
        this.loading = false;
      }
    });
  }

  viewClientDetails(client: EnhancedClientDTO): void {
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
    return EnhancedClientUtils.getProgressClass(rate);
  }

  get filteredClients(): EnhancedClientDTO[] {
    let clients = this.myClients;

    // Filtrer par terme de recherche
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      clients = clients.filter(client => 
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term)
      );
    }

    // Filtrer par clients inactifs seulement
    if (this.showInactiveOnly) {
      clients = clients.filter(client => client.isInactive);
    }

    // Trier les clients
    return EnhancedClientUtils.sortClients(clients, this.sortBy);
  }

  // Nouvelles méthodes pour les statistiques améliorées
  setSortBy(sortBy: 'name' | 'progressRate' | 'programsCount' | 'lastActivity'): void {
    this.sortBy = sortBy;
  }

  toggleInactiveFilter(): void {
    this.showInactiveOnly = !this.showInactiveOnly;
  }

  getInactiveClientsCount(): number {
    return this.myClients.filter(c => c.isInactive).length;
  }

  getAverageProgressRate(): number {
    return this.clientStatistics?.averageProgressRate || 0;
  }

  getClientsWithProgramsCount(): number {
    return this.clientStatistics?.clientsWithPrograms || 0;
  }

  getClientsWithoutProgramsCount(): number {
    return this.clientStatistics?.clientsWithoutPrograms || 0;
  }

  // Méthodes d'alerte pour clients inactifs
  getInactiveAlerts(): EnhancedClientDTO[] {
    return EnhancedClientUtils.getInactiveClients(this.myClients);
  }

  hasInactiveAlerts(): boolean {
    return this.getInactiveAlerts().length > 0;
  }

  // Formatage des dates
  formatLastActivity(lastActivity: string): string {
    if (lastActivity === "Aucune activité") return lastActivity;
    
    try {
      const date = new Date(lastActivity);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Aujourd'hui";
      if (diffDays === 1) return "Hier";
      if (diffDays < 7) return `Il y a ${diffDays} jours`;
      if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
      return `Il y a ${Math.floor(diffDays / 30)} mois`;
    } catch (error) {
      return lastActivity;
    }
  }

  getActiveClientsCount(): number {
    return this.myClients.filter(c => c.status === 'active').length;
  }

  getTotalProgramsCount(): number {
    return this.myClients.reduce((sum, c) => sum + (c.programsCount || 0), 0);
  }
}
