import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProgrammeService } from '../../../services/programme.service';
import { 
  ProgrammeEntrainementDTO, 
  ExerciceDTO, 
  CompleteExerciceRequest,
  IntensiteExercice 
} from '../../../models/programme.model';

interface ExerciseProgress {
  exerciceIndex: number;
  completed: boolean;
  completionDate?: Date;
  notes?: string;
}

@Component({
  selector: 'app-exercise-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exercise-tracker.component.html',
  styleUrls: ['./exercise-tracker.component.css']
})
export class ExerciseTrackerComponent implements OnInit, OnDestroy {
  @Input() programme!: ProgrammeEntrainementDTO;
  @Input() readOnly = false;
  @Output() exerciseCompleted = new EventEmitter<ExerciseProgress>();
  @Output() progressUpdated = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  
  // State management
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  // Exercise forms for notes
  exerciseForms: FormGroup[] = [];
  
  // Progress tracking
  completedExercises = 0;
  totalExercises = 0;
  progressPercentage = 0;
  
  // UI state
  expandedExercises = new Set<number>();
  
  // Enums for template
  IntensiteExercice = IntensiteExercice;

  constructor(
    private programmeService: ProgrammeService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    if (this.programme) {
      this.initializeComponent();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    this.setupExerciseForms();
    this.calculateProgress();
    this.setupFormSubscriptions();
  }

  private setupExerciseForms(): void {
    this.exerciseForms = this.programme.exercices.map(exercice => 
      this.fb.group({
        notes: [exercice.notes || ''],
        completed: [exercice.completed || false]
      })
    );
  }

  private setupFormSubscriptions(): void {
    this.exerciseForms.forEach((form, index) => {
      // Subscribe to notes changes with debouncing
      form.get('notes')?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      ).subscribe(notes => {
        this.updateExerciseNotes(index, notes);
      });
    });
  }

  private calculateProgress(): void {
    this.totalExercises = this.programme.exercices.length;
    this.completedExercises = this.programme.exercices.filter(ex => ex.completed).length;
    this.progressPercentage = this.totalExercises > 0 
      ? Math.round((this.completedExercises / this.totalExercises) * 100)
      : 0;
  }

  // Exercise completion handling
  toggleExerciseCompletion(exerciceIndex: number): void {
    if (this.readOnly || exerciceIndex < 0 || exerciceIndex >= this.programme.exercices.length) {
      return;
    }

    const exercice = this.programme.exercices[exerciceIndex];
    const newCompletionState = !exercice.completed;
    
    this.setLoadingState(true);
    
    const request: CompleteExerciceRequest = {
      completed: newCompletionState,
      completionDate: newCompletionState ? new Date() : undefined,
      notes: this.exerciseForms[exerciceIndex]?.get('notes')?.value || undefined
    };

    this.programmeService.completeExercise(this.programme.id!, exerciceIndex, request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Update local state
        exercice.completed = newCompletionState;
        exercice.completionDate = request.completionDate;
        exercice.notes = request.notes;
        
        // Update form state
        this.exerciseForms[exerciceIndex]?.patchValue({ completed: newCompletionState });
        
        // Recalculate progress
        this.calculateProgress();
        
        // Emit events
        this.exerciseCompleted.emit({
          exerciceIndex,
          completed: newCompletionState,
          completionDate: request.completionDate,
          notes: request.notes
        });
        
        this.progressUpdated.emit(this.progressPercentage);
        
        this.setLoadingState(false);
        this.clearError();
      },
      error: (error) => {
        this.setLoadingState(false);
        this.setError('Erreur lors de la mise à jour de l\'exercice');
        console.error('Error updating exercise completion:', error);
      }
    });
  }

  private updateExerciseNotes(exerciceIndex: number, notes: string): void {
    if (this.readOnly || !this.programme.exercices[exerciceIndex]) {
      return;
    }

    // Update local state immediately for better UX
    this.programme.exercices[exerciceIndex].notes = notes;
  }

  // UI interaction methods
  toggleExerciseExpansion(exerciceIndex: number): void {
    if (this.expandedExercises.has(exerciceIndex)) {
      this.expandedExercises.delete(exerciceIndex);
    } else {
      this.expandedExercises.add(exerciceIndex);
    }
  }

  isExerciseExpanded(exerciceIndex: number): boolean {
    return this.expandedExercises.has(exerciceIndex);
  }

  expandAllExercises(): void {
    this.programme.exercices.forEach((_, index) => {
      this.expandedExercises.add(index);
    });
  }

  collapseAllExercises(): void {
    this.expandedExercises.clear();
  }

  // Display helper methods
  getIntensiteDisplayText(intensite?: IntensiteExercice): string {
    if (!intensite) return '';
    
    switch (intensite) {
      case IntensiteExercice.FAIBLE:
        return 'Faible';
      case IntensiteExercice.MOYENNE:
        return 'Moyenne';
      case IntensiteExercice.ELEVEE:
        return 'Élevée';
      case IntensiteExercice.MAXIMALE:
        return 'Maximale';
      default:
        return intensite;
    }
  }

  getIntensiteClass(intensite?: IntensiteExercice): string {
    if (!intensite) return '';
    
    switch (intensite) {
      case IntensiteExercice.FAIBLE:
        return 'intensite-faible';
      case IntensiteExercice.MOYENNE:
        return 'intensite-moyenne';
      case IntensiteExercice.ELEVEE:
        return 'intensite-elevee';
      case IntensiteExercice.MAXIMALE:
        return 'intensite-maximale';
      default:
        return '';
    }
  }

  getProgressClass(): string {
    if (this.progressPercentage >= 80) return 'progress-high';
    if (this.progressPercentage >= 50) return 'progress-medium';
    if (this.progressPercentage >= 20) return 'progress-low';
    return 'progress-none';
  }

  getExerciseStatusClass(exercice: ExerciceDTO): string {
    return exercice.completed ? 'exercise-completed' : 'exercise-pending';
  }

  formatDuration(minutes?: number): string {
    if (!minutes) return '';
    
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
    }
  }

  formatCompletionDate(date?: Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Progress statistics
  getCompletionStats(): { completed: number; total: number; percentage: number } {
    return {
      completed: this.completedExercises,
      total: this.totalExercises,
      percentage: this.progressPercentage
    };
  }

  getRemainingExercises(): ExerciceDTO[] {
    return this.programme.exercices.filter(ex => !ex.completed);
  }

  getCompletedExercises(): ExerciceDTO[] {
    return this.programme.exercices.filter(ex => ex.completed);
  }

  // Bulk actions
  markAllExercisesCompleted(): void {
    if (this.readOnly) return;
    
    const incompleteExercises = this.programme.exercices
      .map((ex, index) => ({ exercice: ex, index }))
      .filter(({ exercice }) => !exercice.completed);
    
    if (incompleteExercises.length === 0) return;
    
    if (!confirm(`Marquer ${incompleteExercises.length} exercice(s) comme terminé(s) ?`)) {
      return;
    }
    
    // Mark exercises as completed one by one
    incompleteExercises.forEach(({ index }) => {
      setTimeout(() => this.toggleExerciseCompletion(index), index * 100);
    });
  }

  resetAllExercises(): void {
    if (this.readOnly) return;
    
    const completedExercises = this.programme.exercices
      .map((ex, index) => ({ exercice: ex, index }))
      .filter(({ exercice }) => exercice.completed);
    
    if (completedExercises.length === 0) return;
    
    if (!confirm(`Réinitialiser ${completedExercises.length} exercice(s) terminé(s) ?`)) {
      return;
    }
    
    // Reset exercises one by one
    completedExercises.forEach(({ index }) => {
      setTimeout(() => this.toggleExerciseCompletion(index), index * 100);
    });
  }

  // State management helpers
  private setLoadingState(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(message: string): void {
    this.errorSubject.next(message);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // Template helpers
  trackByExerciseIndex(index: number): number {
    return index;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}