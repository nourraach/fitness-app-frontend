import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminUserDTO } from '../../models/admin.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: AdminUserDTO[] = [];
  filteredUsers: AdminUserDTO[] = [];
  selectedUser: AdminUserDTO | null = null;
  
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
  
  private subscriptions: Subscription[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadUsers(): void {
    this.isLoading = true;
    
    const usersSub = this.adminService.getUsers({
      page: this.currentPage,
      size: this.pageSize,
      search: this.searchTerm || undefined,
      role: this.roleFilter === 'all' ? undefined : this.roleFilter as any,
      status: this.statusFilter === 'all' ? undefined : this.statusFilter as any
    }).subscribe({
      next: (response: {users: AdminUserDTO[], total: number}) => {
        this.users = response.users;
        this.totalUsers = response.total;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(usersSub);
  }

  private applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = !this.searchTerm || 
        (user.nom && user.nom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (user.prenom && user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
      const matchesStatus = this.statusFilter === 'all' || user.status === this.statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  selectUser(user: AdminUserDTO): void {
    this.selectedUser = user;
  }

  toggleUserStatus(user: AdminUserDTO): void {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    const toggleSub = this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser: AdminUserDTO) => {
        const index = this.users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
          this.applyFilters();
        }
        if (this.selectedUser?.id === user.id) {
          this.selectedUser = updatedUser;
        }
      },
      error: (error: any) => {
        console.error('Error updating user status:', error);
      }
    });
    this.subscriptions.push(toggleSub);
  }

  resetPassword(user: AdminUserDTO): void {
    if (confirm(`Réinitialiser le mot de passe de ${user.prenom || user.firstName} ${user.nom || user.lastName} ?`)) {
      const resetSub = this.adminService.resetUserPassword(user.id).subscribe({
        next: () => {
          alert('Mot de passe réinitialisé avec succès');
        },
        error: (error: any) => {
          console.error('Error resetting password:', error);
          alert('Erreur lors de la réinitialisation');
        }
      });
      this.subscriptions.push(resetSub);
    }
  }

  deleteUser(user: AdminUserDTO): void {
    if (confirm(`Supprimer définitivement l'utilisateur ${user.prenom || user.firstName} ${user.nom || user.lastName} ?`)) {
      const deleteSub = this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.totalUsers--;
          this.applyFilters();
          if (this.selectedUser?.id === user.id) {
            this.selectedUser = null;
          }
        },
        error: (error: any) => {
          console.error('Error deleting user:', error);
          alert('Erreur lors de la suppression');
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