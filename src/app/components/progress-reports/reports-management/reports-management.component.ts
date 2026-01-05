import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RapportProgresService } from '../../../services/rapport-progres.service';
import { ClientService } from '../../../services/client.service';
import { RapportProgres } from '../../../models/rapport-progres.model';
import { EnhancedClientDTO } from '../../../models/enhanced-client.model';
import { ReportViewerComponent } from '../report-viewer/report-viewer.component';
import { ReportFormComponent } from '../report-form/report-form.component';

@Component({
  selector: 'app-reports-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportViewerComponent, ReportFormComponent],
  templateUrl: './reports-management.component.html',
  styleUrls: ['./reports-management.component.css']
})
export class ReportsManagementComponent implements OnInit, OnDestroy {
  reports: RapportProgres[] = [];
  clients: EnhancedClientDTO[] = [];
  selectedReport: RapportProgres | null = null;
  selectedClient: EnhancedClientDTO | null = null;
  
  isLoading = false;
  isCreatingReport = false;
  showReportForm = false;
  
  // Filters
  filterPeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';
  filterClient: string = '';
  filterStatus: 'all' | 'draft' | 'completed' | 'shared' = 'all';
  searchTerm = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalReports = 0;
  
  // Make Math available in template
  Math = Math;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private rapportService: RapportProgresService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.loadClients();
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadClients(): void {
    const clientsSub = this.clientService.getEnhancedClients().subscribe({
      next: (clients) => {
        this.clients = clients;
      },
      error: (error) => {
        console.error('Error loading clients:', error);
      }
    });
    this.subscriptions.push(clientsSub);
  }

  private loadReports(): void {
    this.isLoading = true;
    
    const filters = {
      period: this.filterPeriod,
      clientId: this.filterClient || undefined,
      status: this.filterStatus === 'all' ? undefined : this.filterStatus,
      search: this.searchTerm || undefined,
      page: this.currentPage,
      limit: this.pageSize
    };

    const reportsSub = this.rapportService.getReports(filters).subscribe({
      next: (response) => {
        this.reports = response.reports;
        this.totalReports = response.total;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading reports:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(reportsSub);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadReports();
  }

  onSearchChange(): void {
    // Debounce search
    setTimeout(() => {
      this.currentPage = 1;
      this.loadReports();
    }, 300);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadReports();
  }

  selectReport(report: RapportProgres): void {
    this.selectedReport = report;
    this.showReportForm = false;
  }

  createNewReport(): void {
    this.selectedReport = null;
    this.showReportForm = true;
  }

  editReport(report: RapportProgres): void {
    this.selectedReport = report;
    this.showReportForm = true;
  }

  onReportCreated(report: RapportProgres): void {
    this.reports.unshift(report);
    this.totalReports++;
    this.selectedReport = report;
    this.showReportForm = false;
  }

  onReportUpdated(report: RapportProgres): void {
    const index = this.reports.findIndex(r => r.id === report.id);
    if (index !== -1) {
      this.reports[index] = report;
    }
    this.selectedReport = report;
    this.showReportForm = false;
  }

  onReportDeleted(reportId: number): void {
    this.reports = this.reports.filter(r => r.id !== reportId);
    this.totalReports--;
    if (this.selectedReport?.id === reportId) {
      this.selectedReport = null;
    }
  }

  onReportDeletedFromChild(reportId: string): void {
    this.onReportDeleted(parseInt(reportId, 10));
  }

  getReportStatus(report: RapportProgres): string {
    // Use the service method to determine status
    return this.rapportService.getReportStatus(report);
  }

  deleteReport(report: RapportProgres): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rapport du ${new Date(report.dateDebutSemaine).toLocaleDateString('fr-FR')} ?`)) {
      const deleteSub = this.rapportService.deleteReport(report.id!).subscribe({
        next: () => {
          this.onReportDeleted(report.id!);
        },
        error: (error) => {
          console.error('Error deleting report:', error);
        }
      });
      this.subscriptions.push(deleteSub);
    }
  }

  duplicateReport(report: RapportProgres): void {
    this.isCreatingReport = true;
    
    const duplicateSub = this.rapportService.duplicateReport(report.id!).subscribe({
      next: (newReport) => {
        this.reports.unshift(newReport);
        this.totalReports++;
        this.selectedReport = newReport;
        this.isCreatingReport = false;
      },
      error: (error) => {
        console.error('Error duplicating report:', error);
        this.isCreatingReport = false;
      }
    });
    this.subscriptions.push(duplicateSub);
  }

  shareReport(report: RapportProgres): void {
    const shareSub = this.rapportService.shareReport(report.id!).subscribe({
      next: (sharedReport) => {
        const index = this.reports.findIndex(r => r.id === report.id);
        if (index !== -1) {
          this.reports[index] = sharedReport;
        }
        if (this.selectedReport?.id === report.id) {
          this.selectedReport = sharedReport;
        }
      },
      error: (error) => {
        console.error('Error sharing report:', error);
      }
    });
    this.subscriptions.push(shareSub);
  }

  exportReport(report: RapportProgres, format: 'pdf' | 'excel'): void {
    const exportSub = this.rapportService.exportReport(report.id!, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rapport_${new Date(report.dateDebutSemaine).toISOString().split('T')[0]}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
      }
    });
    this.subscriptions.push(exportSub);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'draft':
        return 'status-draft';
      case 'shared':
        return 'status-shared';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'draft':
        return 'Brouillon';
      case 'shared':
        return 'Partagé';
      default:
        return status;
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getPaginationPages(): number[] {
    const totalPages = Math.ceil(this.totalReports / this.pageSize);
    const pages: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  closeReportForm(): void {
    this.showReportForm = false;
  }

  closeReportViewer(): void {
    this.selectedReport = null;
  }
}