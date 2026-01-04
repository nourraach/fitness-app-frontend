import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AuditLogDTO, AuditStatsDTO, AuditFilters } from '../../models/admin.model';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit, OnDestroy {
  auditLogs: AuditLogDTO[] = [];
  auditStats: AuditStatsDTO | null = null;
  isLoading = true;
  searchQuery = '';
  
  filters: AuditFilters = {
    page: 0,
    size: 20
  };

  private subscriptions: Subscription[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAuditLogs();
    this.loadAuditStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAuditLogs(): void {
    this.isLoading = true;
    
    const logsSub = this.adminService.getAuditLogs(this.filters).subscribe({
      next: (logs) => {
        this.auditLogs = logs;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading audit logs:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(logsSub);
  }

  private loadAuditStats(): void {
    const statsSub = this.adminService.getAuditStats().subscribe({
      next: (stats) => {
        this.auditStats = stats;
      },
      error: (error: any) => {
        console.error('Error loading audit stats:', error);
      }
    });
    this.subscriptions.push(statsSub);
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      const searchSub = this.adminService.searchAuditLogs(this.searchQuery).subscribe({
        next: (logs) => {
          this.auditLogs = logs;
        },
        error: (error: any) => {
          console.error('Error searching audit logs:', error);
        }
      });
      this.subscriptions.push(searchSub);
    } else {
      this.loadAuditLogs();
    }
  }

  onFilterChange(): void {
    this.loadAuditLogs();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  getActionIcon(action: string): string {
    const icons: { [key: string]: string } = {
      'LOGIN': 'fas fa-sign-in-alt',
      'LOGOUT': 'fas fa-sign-out-alt',
      'CREATE': 'fas fa-plus',
      'UPDATE': 'fas fa-edit',
      'DELETE': 'fas fa-trash',
      'VIEW': 'fas fa-eye',
      'DOWNLOAD': 'fas fa-download'
    };
    return icons[action] || 'fas fa-cog';
  }

  getActionColor(action: string): string {
    const colors: { [key: string]: string } = {
      'LOGIN': '#28a745',
      'LOGOUT': '#6c757d',
      'CREATE': '#007bff',
      'UPDATE': '#ffc107',
      'DELETE': '#dc3545',
      'VIEW': '#17a2b8',
      'DOWNLOAD': '#6f42c1'
    };
    return colors[action] || '#6c757d';
  }
}