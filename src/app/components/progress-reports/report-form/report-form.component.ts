import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RapportProgres } from '../../../models/rapport-progres.model';
import { EnhancedClientDTO } from '../../../models/enhanced-client.model';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './report-form.component.html',
  styleUrls: ['./report-form.component.css']
})
export class ReportFormComponent implements OnInit {
  @Input() report: RapportProgres | null = null;
  @Input() clients: EnhancedClientDTO[] = [];
  @Output() reportCreated = new EventEmitter<RapportProgres>();
  @Output() reportUpdated = new EventEmitter<RapportProgres>();
  @Output() cancelled = new EventEmitter<void>();

  reportForm!: FormGroup;
  isSubmitting = false;
  isEditMode = false;

  constructor(
    private fb: FormBuilder
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
      this.exportToPdf();
    }
  }

  exportToPdf(): void {
    this.isSubmitting = true;
    
    const formData = this.reportForm.value;
    const clientName = this.getClientName(formData.clientId);
    const startDate = new Date(formData.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(formData.endDate).toLocaleDateString('fr-FR');
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Rapport de Progrès', 105, 20, { align: 'center' });
    
    // Title
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text(formData.title || 'Rapport', 105, 30, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);
    
    // Client and Date Info
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    
    let yPos = 45;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Client:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(clientName || 'Non spécifié', 50, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Période:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(`${startDate} - ${endDate}`, 50, yPos);
    
    yPos += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Statut:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const statusLabels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'completed': 'Terminé',
      'shared': 'Partagé'
    };
    doc.text(statusLabels[formData.status] || formData.status, 50, yPos);
    
    // Content included section
    yPos += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Contenu inclus:', 20, yPos);
    
    const contentItems = [];
    if (formData.includeWeight) contentItems.push('Évolution du poids');
    if (formData.includeActivity) contentItems.push('Activité physique');
    if (formData.includeNutrition) contentItems.push('Nutrition');
    if (formData.includePrograms) contentItems.push('Programmes d\'entraînement');
    
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (contentItems.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Sections du rapport']],
        body: contentItems.map(item => [item]),
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] },
        margin: { left: 20, right: 20 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
    
    // Summary section
    if (formData.summary && formData.summary.trim()) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Résumé exécutif:', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(formData.summary, 170);
      doc.text(summaryLines, 20, yPos);
      yPos += summaryLines.length * 5 + 10;
    }
    
    // Notes section
    if (formData.notes && formData.notes.trim()) {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes et recommandations:', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(formData.notes, 170);
      doc.text(notesLines, 20, yPos);
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        105,
        285,
        { align: 'center' }
      );
      doc.text(`Page ${i} / ${pageCount}`, 190, 285, { align: 'right' });
    }
    
    // Generate filename
    const fileName = `rapport_${clientName.replace(/\s+/g, '_')}_${formData.startDate}_${formData.endDate}.pdf`;
    
    // Download PDF
    doc.save(fileName);
    
    this.isSubmitting = false;
    
    // Emit event to notify parent
    const reportData: any = {
      ...formData,
      clientName,
      dateDebutSemaine: new Date(formData.startDate),
      dateFinSemaine: new Date(formData.endDate)
    };
    this.reportCreated.emit(reportData);
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