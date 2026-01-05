import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  DashboardOverview, 
  ClientSummary, 
  Alert, 
  BusinessMetrics,
  ClientFilters,
  AlertLevel,
  RelationStatus,
  RelationType
} from '../../../models/coach.model';
import { CoachDashboardService } from '../../../services/coach-dashboard.service';

@Component({
  selector: 'app-coach-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './coach-dashboard.component.html',
  styleUrls: ['./coach-dashboard.component.css']
})
export class CoachDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data
  dashboardOverview: DashboardOverview | null = null;
  clients: ClientSummary[] = [];
  alerts: Alert[] = [];
  
  // Filters
  clientFilters: ClientFilters = {};
  searchQuery: string = '';
  selectedStatus: RelationStatus | '' = '';
  selectedAlertLevel: AlertLevel | '' = '';
  
  // UI State
  isLoading: boolean = true;
  showAllClients: boolean = false;
  showAllAlerts: boolean = false;
  
  // Enums for template
  AlertLevel = AlertLevel;
  RelationStatus = RelationStatus;
  RelationType = RelationType;

  constructor(
    private coachDashboardService: CoachDashboardService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Subscribe to dashboard overview
    this.coachDashboardService.dashboardOverview$
      .pipe(takeUntil(this.destroy$))
      .subscribe(overview => {
        this.dashboardOverview = overview;
        this.isLoading = false;
      });

    // Subscribe to clients
    this.coachDashboardService.clients$
      .pipe(takeUntil(this.destroy$))
      .subscribe(clients => {
        this.clients = clients;
      });

    // Subscribe to alerts
    this.coachDashboardService.alerts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.alerts = alerts;
      });
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    this.coachDashboardService.refreshDashboard();
  }

  // Filter methods
  onSearchClients(): void {
    this.clientFilters.search = this.searchQuery || undefined;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.clientFilters.status = this.selectedStatus || undefined;
    this.applyFilters();
  }

  onAlertLevelFilterChange(): void {
    this.clientFilters.alertLevel = this.selectedAlertLevel || undefined;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.coachDashboardService.getClients(undefined, this.clientFilters).subscribe();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedAlertLevel = '';
    this.clientFilters = {};
    this.coachDashboardService.getClients().subscribe();
  }

  // Display methods
  getDisplayedClients(): ClientSummary[] {
    return this.showAllClients ? this.clients : this.clients.slice(0, 5);
  }

  getDisplayedAlerts(): Alert[] {
    return this.showAllAlerts ? this.alerts : this.alerts.slice(0, 3);
  }

  toggleShowAllClients(): void {
    this.showAllClients = !this.showAllClients;
  }

  toggleShowAllAlerts(): void {
    this.showAllAlerts = !this.showAllAlerts;
  }

  // Utility methods
  getAlertLevelClass(level: AlertLevel): string {
    switch (level) {
      case AlertLevel.HIGH:
        return 'alert-high';
      case AlertLevel.MEDIUM:
        return 'alert-medium';
      case AlertLevel.LOW:
        return 'alert-low';
      default:
        return '';
    }
  }

  getStatusClass(status: RelationStatus): string {
    switch (status) {
      case RelationStatus.ACTIVE:
        return 'status-active';
      case RelationStatus.PAUSED:
        return 'status-paused';
      case RelationStatus.COMPLETED:
        return 'status-completed';
      case RelationStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  }

  getProgressBarClass(percentage: number): string {
    if (percentage >= 80) return 'progress-excellent';
    if (percentage >= 60) return 'progress-good';
    if (percentage >= 40) return 'progress-average';
    return 'progress-poor';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatPercentage(value: number | undefined): string {
    if (value === undefined || value === null) {
      return '0%';
    }
    return `${Math.round(value)}%`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `Il y a ${diffInDays}j`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `Il y a ${diffInWeeks}sem`;
  }

  // Action methods
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  viewClientDetails(clientId: number): void {
    // Navigate to client details page
    console.log('Navigate to client details:', clientId);
  }

  createNutritionPlan(clientId: number): void {
    // Navigate to nutrition plan creation
    console.log('Create nutrition plan for client:', clientId);
  }

  sendMessage(clientId: number): void {
    // Navigate to messaging
    console.log('Send message to client:', clientId);
  }

  resolveAlert(alertId: number): void {
    // Mark alert as resolved
    console.log('Resolve alert:', alertId);
  }
}