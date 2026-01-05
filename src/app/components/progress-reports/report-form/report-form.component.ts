import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RapportProgres } from '../../../models/rapport-progres.model';
import { EnhancedClient } from '../../../models/enhanced-client.model';
import { RapportProgresService } from '../../../services/rapport-progres.service';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements OnInit {
  @Input() report: RapportProgres | null = null;
  @Input() clients: EnhancedClient[] = [];
  @Output() reportCreated = new EventEmitter<RapportProgres>();
  @Output() reportUpdated = new EventEmitter<RapportProgres>();
  @Output() cancelled = new EventEmitter<void>();

  reportForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private rapportService: RapportProgresService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.report;
    this.initializeForm();
  }

  private initializeForm(): void {
    this.reportForm = this.fb.group({
      title: ['Rapport du ' + (this.report ? new Date(this.report.dateDebutSemaine).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')), [Validators.required, Validators.minLength(3)]],
      clientId: [this.report?.utilisateurId || '', Validators.required],
      startDate: [this.formatDateForInput(this.report?.dateDebutSemaine), Validators.required],
      endDate: [this.formatDateForInput(this.report?.dateFinSemaine), Validators.required],
      summary: [this.report?.resume || ''],
      notes: [this.report?.recommandations || ''],
      status: ['draft'], // Default status since RapportProgres doesn't have this field
      includeWeight: [true],
      includeActivity: [true],
      includeNutrition: [true],
      includePrograms: [true],
      recommendations: this.fb.array([])
    });
  }

  private formatDateForInput(date: Date | string | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.reportForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formData = this.reportForm.value;
      const reportData = {
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        clientName: this.getClientName(formData.clientId)
      };

      if (this.isEditMode && this.report) {
        this.updateReport({ ...this.report, ...reportData });
      } else {
        this.createReport(reportData);
      }
    }
  }

  private createReport(reportData: any): void {
    this.rapportService.createReport(reportData).subscribe({
      next: (report) => {
        this.reportCreated.emit(report);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error creating report:', error);
        this.isSubmitting = false;
      }
    });
  }

  private updateReport(reportData: any): void {
    this.rapportService.updateReport(reportData.id, reportData).subscribe({
      next: (report) => {
        this.reportUpdated.emit(report);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error updating report:', error);
        this.isSubmitting = false;
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private getClientName(clientId: string): string {
    const client = this.clients.find(c => c.id.toString() === clientId);
    return client ? client.name : '';
  }

  // Quick date setters
  setDateRange(days: number): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    this.reportForm.patchValue({
      startDate: this.formatDateForInput(startDate),
      endDate: this.formatDateForInput(endDate)
    });
  }

  generateTitle(): void {
    const clientId = this.reportForm.get('clientId')?.value;
    const startDate = this.reportForm.get('startDate')?.value;
    const endDate = this.reportForm.get('endDate')?.value;
    
    if (clientId && startDate && endDate) {
      const clientName = this.getClientName(clientId);
      const start = new Date(startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const end = new Date(endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      const title = `Rapport ${clientName} - ${start} au ${end}`;
      this.reportForm.patchValue({ title });
    }
  }

  getFormError(fieldName: string): string {
    const field = this.reportForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} est requis`;
      if (field.errors['minlength']) return `${fieldName} trop court`;
    }
    return '';
  }
}