import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { JwtService } from '../../service/jwt.service';

// Interface pour les données retournées par le backend
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'COACH' | 'ADMIN';
  phoneNumber: string;
  enabled: boolean;
}

// Interface pour l'affichage frontend
interface UserDTO {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  status: string;
  telephone: string;
  dateNaissance?: Date;
  createdAt?: Date;
  lastLogin?: Date;
  loginCount?: number;
  programsCount?: number;
  messagesCount?: number;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: UserDTO[] = [];
  filteredUsers: UserDTO[] = [];
  selectedUser: UserDTO | null = null;
  
  isLoading = false;
  searchTerm = '';
  roleFilter = 'all';
  statusFilter = 'all';
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalUsers = 0;
  
  // Make Math available in template
  Math = Math;
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private subscriptions: Subscription[] = [];

  constructor(private jwtService: JwtService) {}

  ngOnInit(): void {
    this.loadUsers();
    
    // Setup search debounce
    const searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1;
      this.loadUsers();
    });
    this.subscriptions.push(searchSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Mappe un utilisateur du format backend vers le format frontend
   * Backend: { name, phoneNumber, enabled, role: "USER"|"COACH"|"ADMIN" }
   * Frontend: { nom, prenom, telephone, status, role: "user"|"coach"|"admin" }
   */
  private mapBackendUser(user: BackendUser): UserDTO {
    // Split le name en prenom et nom
    const nameParts = (user.name || '').split(' ');
    let prenom = '';
    let nom = '';
    
    if (nameParts.length === 1) {
      // Un seul mot: c'est le nom
      nom = nameParts[0];
      prenom = '';
    } else {
      // Plusieurs mots: premier = prenom, reste = nom
      prenom = nameParts[0];
      nom = nameParts.slice(1).join(' ');
    }
    
    return {
      id: user.id,
      nom: nom,
      prenom: prenom,
      email: user.email || '',
      role: (user.role || 'USER').toLowerCase(), // USER -> user, COACH -> coach, ADMIN -> admin
      status: user.enabled ? 'active' : 'inactive', // boolean -> string
      telephone: user.phoneNumber || ''
    };
  }

  private loadUsers(): void {
    this.isLoading = true;
    
    const usersSub = this.jwtService.gestionUsers().subscribe({
      next: (response: any) => {
        console.log('Réponse API users:', response);
        
        // Gérer différents formats de réponse
        let usersData: BackendUser[] = [];
        if (Array.isArray(response)) {
          usersData = response;
        } else if (response && response.users) {
          usersData = response.users;
        } else if (response && response.content) {
          usersData = response.content;
        } else if (response && response.data) {
          usersData = response.data;
        }
        
        // Mapper les données backend vers le format frontend
        this.users = usersData.map((user: BackendUser) => this.mapBackendUser(user));
        
        this.totalUsers = this.users.length;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.handleApiError(error);
        this.users = [];
        this.filteredUsers = [];
        this.isLoading = false;
      }
    });
    this.subscriptions.push(usersSub);
  }

  private handleApiError(error: any): void {
    if (error.status === 401) {
      alert('Session expirée. Veuillez vous reconnecter.');
      // Redirection vers login gérée par l'intercepteur
    } else if (error.status === 403) {
      alert('Accès non autorisé');
    } else if (error.status === 404) {
      alert('Utilisateur non trouvé');
    } else if (error.status >= 500) {
      alert('Erreur serveur, veuillez réessayer');
    }
  }

  private applyFilters(): void {
    let filtered = [...this.users];
    
    // Filtre par recherche (nom, prénom, email) - côté client
    if (this.searchTerm && this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user => {
        const nom = (user.nom || '').toLowerCase();
        const prenom = (user.prenom || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const fullName = `${prenom} ${nom}`.toLowerCase();
        const fullNameReverse = `${nom} ${prenom}`.toLowerCase();
        
        return nom.includes(searchLower) ||
               prenom.includes(searchLower) ||
               email.includes(searchLower) ||
               fullName.includes(searchLower) ||
               fullNameReverse.includes(searchLower);
      });
    }
    
    // Filtre par rôle - côté client
    if (this.roleFilter && this.roleFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userRole = (user.role || '').toLowerCase();
        return userRole.includes(this.roleFilter.toLowerCase());
      });
    }
    
    // Filtre par statut - côté client
    if (this.statusFilter && this.statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userStatus = (user.status || '').toLowerCase();
        return userStatus === this.statusFilter.toLowerCase();
      });
    }
    
    this.filteredUsers = filtered;
    this.totalUsers = filtered.length;
  }

  onSearchChange(): void {
    // Appliquer les filtres immédiatement côté client
    this.applyFilters();
  }

  onFilterChange(): void {
    // Appliquer les filtres côté client sans recharger
    this.applyFilters();
  }

  selectUser(user: UserDTO): void {
    this.selectedUser = user;
  }

  toggleUserStatus(user: UserDTO): void {
    const newEnabled = user.status !== 'active';
    const previousStatus = user.status;
    
    // Mise à jour locale optimiste
    user.status = newEnabled ? 'active' : 'inactive';
    
    // Appel API vers /api/admin/users/{id}/status
    const statusSub = this.jwtService.updateUserStatus(user.id, newEnabled).subscribe({
      next: () => {
        console.log(`Statut de l'utilisateur ${user.id} changé en ${user.status}`);
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].status = user.status;
        }
        this.applyFilters();
        
        if (this.selectedUser?.id === user.id) {
          this.selectedUser.status = user.status;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du changement de statut:', error);
        // Revert en cas d'erreur
        user.status = previousStatus;
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index].status = previousStatus;
        }
        if (this.selectedUser?.id === user.id) {
          this.selectedUser.status = previousStatus;
        }
        this.handleApiError(error);
      }
    });
    this.subscriptions.push(statusSub);
  }

  resetPassword(user: UserDTO): void {
    if (confirm(`Réinitialiser le mot de passe de ${user.prenom} ${user.nom} ?`)) {
      // Note: L'API de réinitialisation peut être ajoutée plus tard
      alert('Fonctionnalité de réinitialisation de mot de passe à implémenter côté backend');
    }
  }

  deleteUser(user: UserDTO): void {
    if (confirm(`Supprimer définitivement l'utilisateur ${user.prenom} ${user.nom} ?`)) {
      const deleteSub = this.jwtService.deleteUser(user.id).subscribe({
        next: () => {
          // Le backend retourne 204 No Content - pas de body attendu
          this.users = this.users.filter(u => u.id !== user.id);
          this.totalUsers--;
          this.applyFilters();
          if (this.selectedUser?.id === user.id) {
            this.selectedUser = null;
          }
          alert('Utilisateur supprimé avec succès');
        },
        error: (error: any) => {
          console.error('Error deleting user:', error);
          this.handleApiError(error);
        }
      });
      this.subscriptions.push(deleteSub);
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'role-admin';
      case 'coach': return 'role-coach';
      case 'client': return 'role-client';
      default: return 'role-default';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      case 'suspended': return 'status-suspended';
      default: return 'status-default';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPaginationPages(): number[] {
    const totalPages = Math.ceil(this.totalUsers / this.pageSize);
    const pages: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  closeUserDetails(): void {
    this.selectedUser = null;
  }
}