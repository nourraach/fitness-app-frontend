import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProgrammeService } from '../../../services/programme.service';
import { ClientService } from '../../../services/client.service';
import { 
  ProgrammeEntrainementDTO, 
  CreerProgrammeRequest, 
  ProgramStatus,
  ProgressDTO 
} from '../../../models/programme.model';
import { ProgrammeFormComponent } from '../programme-form/programme-form.component';

interface LoadingState {
  programmes: boolean;
  clients: boolean;
  creating: boolean;
  updating: boolean;
}

interface FilterState {
  status: ProgramStatus | 'ALL';
  client: number | 'ALL';
  search: string;
}

@Component({
  selector: 'app-programme-management',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, ProgrammeFormComponent],
  templateUrl: './programme-management.component.html',
  styleUrls: ['./programme-management.component.css']
})
export class ProgrammeManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // State management
  programmes$ = this.programmeService.programmes$;
  clients$ = this.clientService.clients$;
  
  private loadingSubject = new BehaviorSubject<LoadingState>({
    programmes: false,
    clients: false,
    creating: false,
    updating: false
  });
  loading$ = this.loadingSubject.asObservable();
  
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();
  
  private filterSubject = new BehaviorSubject<FilterState>({
    status: 'ALL',
    client: 'ALL',
    search: ''
  });
  
  // Filter form
  filterForm: FormGroup;
  
  // Filtered programmes
  filteredProgrammes$: Observable<ProgrammeEntrainementDTO[]>;
  
  // Enums for template
  ProgramStatus = ProgramStatus;
  
  // UI state
  showCreateForm = false;
  selectedProgramme: ProgrammeEntrainementDTO | null = null;

  constructor(
    private programmeService: ProgrammeService,
    private clientService: ClientService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      status: ['ALL'],
      client: ['ALL'],
      search: ['']
    });
    
    this.setupFilteredProgrammes();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilteredProgrammes(): void {
    this.filteredProgrammes$ = combineLatest([
      this.programmes$,
      this.filterSubject.asObservable()
    ]).pipe(
      map(([programmes, filters]) => this.applyFilters(programmes, filters)),
      takeUntil(this.destroy$)
    );
  }

  private setupFormSubscriptions(): void {
    this.filterForm.valueChanges.pipe(
      startWith(this.filterForm.value),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(filters => {
      this.filterSubject.next(filters);
    });
  }

  private applyFilters(programmes: ProgrammeEntrainementDTO[], filters: FilterState): ProgrammeEntrainementDTO[] {
    return programmes.filter(programme => {
      // Status filter
      if (filters.status !== 'ALL' && programme.statut !== filters.status) {
        return false;
      }
      
      // Client filter
      if (filters.client !== 'ALL' && programme.clientId !== filters.client) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesName = programme.nom.toLowerCase().includes(searchTerm);
        const matchesClient = programme.nomClient?.toLowerCase().includes(searchTerm);
        const matchesCoach = programme.nomCoach?.toLowerCase().includes(searchTerm);
        
        if (!matchesName && !matchesClient && !matchesCoach) {
          return false;
        }
      }
      
      return true;
    });
  }

  private loadInitialData(): void {
    this.updateLoadingState({ programmes: true });
    
    // Load programmes with progress
    this.programmeService.getProgrammesWithProgress().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.updateLoadingState({ programmes: false });
        this.clearError();
      },
      error: (error) => {
        this.updateLoadingState({ programmes: false });
        this.setError('Erreur lors du chargement des programmes');
        console.error('Error loading programmes:', error);
      }
    });
    
    // Load clients for filtering
    this.updateLoadingState({ clients: true });
    this.clientService.getClients().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.updateLoadingState({ clients: false });
      },
      error: (error) => {
        this.updateLoadingState({ clients: false });
        console.error('Error loading clients:', error);
      }
    });
  }

  // Programme management actions
  createProgramme(request: CreerProgrammeRequest): void {
    this.updateLoadingState({ creating: true });
    
    this.programmeService.creerProgramme(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (programme) => {
        this.updateLoadingState({ creating: false });
        this.showCreateForm = false;
        this.clearError();
        console.log('Programme créé avec succès:', programme);
      },
      error: (error) => {
        this.updateLoadingState({ creating: false });
        this.setError('Erreur lors de la création du programme');
        console.error('Error creating programme:', error);
      }
    });
  }

  updateProgrammeStatus(programmeId: number, newStatus: ProgramStatus): void {
    if (!programmeId) return;
    
    this.updateLoadingState({ updating: true });
    
    this.programmeService.changerStatut(programmeId, newStatus).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.updateLoadingState({ updating: false });
        this.clearError();
      },
      error: (error) => {
        this.updateLoadingState({ updating: false });
        this.setError('Erreur lors de la mise à jour du statut');
        console.error('Error updating status:', error);
      }
    });
  }

  deleteProgramme(programmeId: number): void {
    if (!programmeId || !confirm('Êtes-vous sûr de vouloir supprimer ce programme ?')) {
      return;
    }
    
    this.updateLoadingState({ updating: true });
    
    this.programmeService.supprimerProgramme(programmeId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.updateLoadingState({ updating: false });
        this.clearError();
      },
      error: (error) => {
        this.updateLoadingState({ updating: false });
        this.setError('Erreur lors de la suppression du programme');
        console.error('Error deleting programme:', error);
      }
    });
  }

  // UI actions
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.clearError();
    }
  }

  selectProgramme(programme: ProgrammeEntrainementDTO): void {
    this.selectedProgramme = programme;
  }

  clearSelection(): void {
    this.selectedProgramme = null;
  }

  // Status management
  getStatusDisplayText(status: ProgramStatus): string {
    switch (status) {
      case ProgramStatus.ACTIF:
        return 'Actif';
      case ProgramStatus.TERMINE:
        return 'Terminé';
      case ProgramStatus.SUSPENDU:
        return 'Suspendu';
      case ProgramStatus.ANNULE:
        return 'Annulé';
      default:
        return status;
    }
  }

  getStatusClass(status: ProgramStatus): string {
    switch (status) {
      case ProgramStatus.ACTIF:
        return 'status-active';
      case ProgramStatus.TERMINE:
        return 'status-completed';
      case ProgramStatus.SUSPENDU:
        return 'status-suspended';
      case ProgramStatus.ANNULE:
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 80) return 'progress-high';
    if (percentage >= 50) return 'progress-medium';
    if (percentage >= 20) return 'progress-low';
    return 'progress-none';
  }

  // Utility methods
  private updateLoadingState(updates: Partial<LoadingState>): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({ ...currentState, ...updates });
  }

  private setError(message: string): void {
    this.errorSubject.next(message);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  // Template helpers
  trackByProgrammeId(index: number, programme: ProgrammeEntrainementDTO): number {
    return programme.id || index;
  }

  formatDate(date: Date | string): string {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR');
  }

  isLoading(): boolean {
    const state = this.loadingSubject.value;
    return state.programmes || state.clients || state.creating || state.updating;
  }
}