import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RapportProgres } from '../../../models/rapport-progres.model';
import { RapportProgresService } from '../../../services/rapport-progres.service';

@Component({
  selector: 'app-report-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-viewer.component.html',
  styleUrls: ['./report-viewer.component.css']
})
export class ReportViewerComponent implements OnInit, OnDestroy {
  @Input() report!: RapportProgres;
  @Output() reportUpdated = new EventEmitter<RapportProgres>();
  @Output() reportDeleted = new EventEmitter<string>();

  isLoading = false;
  chartData: any = null;

  constructor(private rapportService: RapportProgresService) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnDestroy(): void {}

  private loadChartData(): void {
    if (!this.report.id) return;
    
    this.isLoading = true;
    this.rapportService.getReportChartData(this.report.id).subscribe({
      next: (data) => {
        this.chartData = data;
        this.isLoading = false;
        this.initializeCharts();
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
        this.isLoading = false;
      }
    });
  }

  private initializeCharts(): void {
    // Chart initialization would go here
    // For now, we'll use mock data visualization
  }

  exportToPDF(): void {
    this.rapportService.exportReport(this.report.id, 'pdf').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.report.title}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting PDF:', error);
      }
    });
  }

  shareReport(): void {
    this.rapportService.shareReport(this.report.id).subscribe({
      next: (updatedReport) => {
        this.reportUpdated.emit(updatedReport);
      },
      error: (error) => {
        console.error('Error sharing report:', error);
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'draft': return 'status-draft';
      case 'shared': return 'status-shared';
      default: return 'status-default';
    }
  }
}