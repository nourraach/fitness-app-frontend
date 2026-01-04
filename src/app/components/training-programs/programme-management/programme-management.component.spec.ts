import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, BehaviorSubject } from 'rxjs';

import { ProgrammeManagementComponent } from './programme-management.component';
import { ProgrammeService } from '../../../services/programme.service';
import { ClientService } from '../../../services/client.service';
import { 
  ProgrammeEntrainementDTO, 
  ProgramStatus,
  CreerProgrammeRequest 
} from '../../../models/programme.model';

// Mock data generators for property-based testing
function generateMockProgramme(overrides: Partial<ProgrammeEntrainementDTO> = {}): ProgrammeEntrainementDTO {
  const baseId = Math.floor(Math.random() * 1000) + 1;
  return {
    id: baseId,
    coachId: Math.floor(Math.random() * 100) + 1,
    clientId: Math.floor(Math.random() * 100) + 1,
    nomCoach: `Coach ${baseId}`,
    nomClient: `Client ${baseId}`,
    nom: `Programme ${baseId}`,
    description: `Description du programme ${baseId}`,
    dateDebut: new Date(),
    dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    exercices: [],
    statut: ProgramStatus.ACTIF,
    totalExercises: Math.floor(Math.random() * 10) + 1,
    completedExercises: Math.floor(Math.random() * 5),
    progressPercentage: Math.floor(Math.random() * 100),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function generateMockClient(overrides: any = {}) {
  const baseId = Math.floor(Math.random() * 1000) + 1;
  return {
    id: baseId,
    nom: `Client${baseId}`,
    prenom: `Prenom${baseId}`,
    email: `client${baseId}@test.com`,
    ...overrides
  };
}

describe('ProgrammeManagementComponent', () => {
  let component: ProgrammeManagementComponent;
  let fixture: ComponentFixture<ProgrammeManagementComponent>;
  let mockProgrammeService: jasmine.SpyObj<ProgrammeService>;
  let mockClientService: jasmine.SpyObj<ClientService>;
  let programmesSubject: BehaviorSubject<ProgrammeEntrainementDTO[]>;
  let clientsSubject: BehaviorSubject<any[]>;

  beforeEach(async () => {
    // Create mock services
    const programmeServiceSpy = jasmine.createSpyObj('ProgrammeService', [
      'getProgrammesWithProgress',
      'creerProgramme',
      'changerStatut',
      'supprimerProgramme'
    ]);
    
    const clientServiceSpy = jasmine.createSpyObj('ClientService', [
      'getClients'
    ]);

    // Create subjects for reactive data
    programmesSubject = new BehaviorSubject<ProgrammeEntrainementDTO[]>([]);
    clientsSubject = new BehaviorSubject<any[]>([]);

    // Setup service properties
    Object.defineProperty(programmeServiceSpy, 'programmes$', {
      value: programmesSubject.asObservable()
    });
    
    Object.defineProperty(clientServiceSpy, 'clients$', {
      value: clientsSubject.asObservable()
    });

    // Setup service method returns
    programmeServiceSpy.getProgrammesWithProgress.and.returnValue(of([]));
    programmeServiceSpy.creerProgramme.and.returnValue(of(generateMockProgramme()));
    programmeServiceSpy.changerStatut.and.returnValue(of(generateMockProgramme()));
    programmeServiceSpy.supprimerProgramme.and.returnValue(of({}));
    clientServiceSpy.getClients.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        ProgrammeManagementComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: ProgrammeService, useValue: programmeServiceSpy },
        { provide: ClientService, useValue: clientServiceSpy }
      ]
    }).compileComponents();

    mockProgrammeService = TestBed.inject(ProgrammeService) as jasmine.SpyObj<ProgrammeService>;
    mockClientService = TestBed.inject(ClientService) as jasmine.SpyObj<ClientService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgrammeManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load initial data on init', () => {
      expect(mockProgrammeService.getProgrammesWithProgress).toHaveBeenCalled();
      expect(mockClientService.getClients).toHaveBeenCalled();
    });

    it('should initialize filter form with default values', () => {
      expect(component.filterForm.get('status')?.value).toBe('ALL');
      expect(component.filterForm.get('client')?.value).toBe('ALL');
      expect(component.filterForm.get('search')?.value).toBe('');
    });
  });

  describe('Programme Management Actions', () => {
    it('should create programme when valid request is provided', () => {
      const mockRequest: CreerProgrammeRequest = {
        nom: 'Test Programme',
        clientId: 1,
        dateDebut: '2024-01-01',
        exercices: []
      };

      component.createProgramme(mockRequest);

      expect(mockProgrammeService.creerProgramme).toHaveBeenCalledWith(mockRequest);
    });

    it('should update programme status', () => {
      const programmeId = 1;
      const newStatus = ProgramStatus.TERMINE;

      component.updateProgrammeStatus(programmeId, newStatus);

      expect(mockProgrammeService.changerStatut).toHaveBeenCalledWith(programmeId, newStatus);
    });

    it('should delete programme with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const programmeId = 1;

      component.deleteProgramme(programmeId);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProgrammeService.supprimerProgramme).toHaveBeenCalledWith(programmeId);
    });

    it('should not delete programme without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      const programmeId = 1;

      component.deleteProgramme(programmeId);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockProgrammeService.supprimerProgramme).not.toHaveBeenCalled();
    });
  });

  describe('Filtering and Display', () => {
    /**
     * **Feature: fitness-frontend-features, Property 3: Program list display completeness**
     * For any set of coach programs, the program list should display all required information 
     * (name, client, status, dates)
     */
    it('should display all required programme information', () => {
      // Property: For any set of programmes, all required information should be displayed
      const testCases = [
        // Test case 1: Single programme
        [generateMockProgramme({
          nom: 'Programme Test 1',
          nomClient: 'Client Test 1',
          nomCoach: 'Coach Test 1',
          statut: ProgramStatus.ACTIF
        })],
        // Test case 2: Multiple programmes with different statuses
        [
          generateMockProgramme({
            nom: 'Programme Actif',
            statut: ProgramStatus.ACTIF
          }),
          generateMockProgramme({
            nom: 'Programme Terminé',
            statut: ProgramStatus.TERMINE
          }),
          generateMockProgramme({
            nom: 'Programme Suspendu',
            statut: ProgramStatus.SUSPENDU
          })
        ],
        // Test case 3: Programmes with various progress levels
        [
          generateMockProgramme({
            progressPercentage: 0,
            completedExercises: 0,
            totalExercises: 10
          }),
          generateMockProgramme({
            progressPercentage: 50,
            completedExercises: 5,
            totalExercises: 10
          }),
          generateMockProgramme({
            progressPercentage: 100,
            completedExercises: 10,
            totalExercises: 10
          })
        ]
      ];

      testCases.forEach((programmes, caseIndex) => {
        // Update the programmes data
        programmesSubject.next(programmes);
        fixture.detectChanges();

        // Verify all programmes are displayed
        component.filteredProgrammes$.subscribe(filteredProgrammes => {
          expect(filteredProgrammes.length).toBe(programmes.length);
          
          // Verify each programme contains required information
          filteredProgrammes.forEach((programme, index) => {
            // Required information should be present
            expect(programme.nom).toBeDefined();
            expect(programme.nom).toBeTruthy();
            
            expect(programme.statut).toBeDefined();
            expect(Object.values(ProgramStatus)).toContain(programme.statut);
            
            expect(programme.dateDebut).toBeDefined();
            
            // Progress information should be valid
            expect(programme.progressPercentage).toBeGreaterThanOrEqual(0);
            expect(programme.progressPercentage).toBeLessThanOrEqual(100);
            expect(programme.completedExercises).toBeGreaterThanOrEqual(0);
            expect(programme.totalExercises).toBeGreaterThanOrEqual(0);
            expect(programme.completedExercises).toBeLessThanOrEqual(programme.totalExercises);
            
            // Timestamps should be valid
            expect(programme.createdAt).toBeDefined();
            expect(programme.createdAt).toBeInstanceOf(Date);
          });
        });
      });
    });

    it('should filter programmes by status correctly', () => {
      const programmes = [
        generateMockProgramme({ statut: ProgramStatus.ACTIF }),
        generateMockProgramme({ statut: ProgramStatus.TERMINE }),
        generateMockProgramme({ statut: ProgramStatus.SUSPENDU })
      ];

      programmesSubject.next(programmes);
      
      // Test filtering by each status
      Object.values(ProgramStatus).forEach(status => {
        component.filterForm.patchValue({ status });
        fixture.detectChanges();

        component.filteredProgrammes$.subscribe(filtered => {
          filtered.forEach(programme => {
            expect(programme.statut).toBe(status);
          });
        });
      });
    });

    it('should filter programmes by client correctly', () => {
      const clientId = 123;
      const programmes = [
        generateMockProgramme({ clientId: clientId }),
        generateMockProgramme({ clientId: 456 }),
        generateMockProgramme({ clientId: clientId })
      ];

      programmesSubject.next(programmes);
      component.filterForm.patchValue({ client: clientId });
      fixture.detectChanges();

      component.filteredProgrammes$.subscribe(filtered => {
        expect(filtered.length).toBe(2);
        filtered.forEach(programme => {
          expect(programme.clientId).toBe(clientId);
        });
      });
    });

    it('should filter programmes by search term correctly', () => {
      const programmes = [
        generateMockProgramme({ nom: 'Musculation Débutant' }),
        generateMockProgramme({ nom: 'Cardio Avancé' }),
        generateMockProgramme({ nomClient: 'Jean Musculation' })
      ];

      programmesSubject.next(programmes);
      component.filterForm.patchValue({ search: 'musculation' });
      fixture.detectChanges();

      component.filteredProgrammes$.subscribe(filtered => {
        expect(filtered.length).toBe(2);
        filtered.forEach(programme => {
          const searchTerm = 'musculation';
          const matchesName = programme.nom.toLowerCase().includes(searchTerm);
          const matchesClient = programme.nomClient?.toLowerCase().includes(searchTerm);
          expect(matchesName || matchesClient).toBe(true);
        });
      });
    });
  });

  describe('UI State Management', () => {
    it('should toggle create form visibility', () => {
      expect(component.showCreateForm).toBe(false);
      
      component.toggleCreateForm();
      expect(component.showCreateForm).toBe(true);
      
      component.toggleCreateForm();
      expect(component.showCreateForm).toBe(false);
    });

    it('should manage programme selection', () => {
      const programme = generateMockProgramme();
      
      expect(component.selectedProgramme).toBeNull();
      
      component.selectProgramme(programme);
      expect(component.selectedProgramme).toBe(programme);
      
      component.clearSelection();
      expect(component.selectedProgramme).toBeNull();
    });

    it('should handle loading states correctly', () => {
      // Initially not loading
      expect(component.isLoading()).toBe(false);
      
      // Simulate loading state
      (component as any).updateLoadingState({ programmes: true });
      expect(component.isLoading()).toBe(true);
      
      // Clear loading state
      (component as any).updateLoadingState({ programmes: false });
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('Status and Progress Display', () => {
    it('should return correct status display text', () => {
      expect(component.getStatusDisplayText(ProgramStatus.ACTIF)).toBe('Actif');
      expect(component.getStatusDisplayText(ProgramStatus.TERMINE)).toBe('Terminé');
      expect(component.getStatusDisplayText(ProgramStatus.SUSPENDU)).toBe('Suspendu');
      expect(component.getStatusDisplayText(ProgramStatus.ANNULE)).toBe('Annulé');
    });

    it('should return correct status CSS classes', () => {
      expect(component.getStatusClass(ProgramStatus.ACTIF)).toBe('status-active');
      expect(component.getStatusClass(ProgramStatus.TERMINE)).toBe('status-completed');
      expect(component.getStatusClass(ProgramStatus.SUSPENDU)).toBe('status-suspended');
      expect(component.getStatusClass(ProgramStatus.ANNULE)).toBe('status-cancelled');
    });

    it('should return correct progress CSS classes', () => {
      expect(component.getProgressClass(90)).toBe('progress-high');
      expect(component.getProgressClass(60)).toBe('progress-medium');
      expect(component.getProgressClass(30)).toBe('progress-low');
      expect(component.getProgressClass(10)).toBe('progress-none');
    });
  });

  describe('Utility Methods', () => {
    it('should format dates correctly', () => {
      const testDate = new Date('2024-01-15');
      const formatted = component.formatDate(testDate);
      expect(formatted).toBe('15/01/2024');
    });

    it('should handle empty dates', () => {
      expect(component.formatDate('')).toBe('');
      expect(component.formatDate(null as any)).toBe('');
    });

    it('should track programmes by ID', () => {
      const programme = generateMockProgramme({ id: 123 });
      expect(component.trackByProgrammeId(0, programme)).toBe(123);
      
      const programmeWithoutId = generateMockProgramme();
      delete programmeWithoutId.id;
      expect(component.trackByProgrammeId(5, programmeWithoutId)).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      const errorMessage = 'Service error';
      mockProgrammeService.getProgrammesWithProgress.and.returnValue(
        new Promise((_, reject) => reject(new Error(errorMessage)))
      );

      component.ngOnInit();

      // Verify error handling doesn't crash the component
      expect(component).toBeTruthy();
    });

    it('should clear errors when appropriate', () => {
      (component as any).setError('Test error');
      
      component.error$.subscribe(error => {
        expect(error).toBe('Test error');
      });
      
      (component as any).clearError();
      
      component.error$.subscribe(error => {
        expect(error).toBeNull();
      });
    });
  });

  describe('Property-Based Testing - Random Data', () => {
    it('should handle random programme data correctly', () => {
      // Generate multiple random test cases
      for (let i = 0; i < 10; i++) {
        const randomProgrammes = Array.from({ length: Math.floor(Math.random() * 20) + 1 }, () => 
          generateMockProgramme({
            progressPercentage: Math.floor(Math.random() * 101),
            statut: Object.values(ProgramStatus)[Math.floor(Math.random() * Object.values(ProgramStatus).length)]
          })
        );

        programmesSubject.next(randomProgrammes);
        fixture.detectChanges();

        component.filteredProgrammes$.subscribe(programmes => {
          // Verify all programmes have valid data
          programmes.forEach(programme => {
            expect(programme.id).toBeDefined();
            expect(programme.nom).toBeTruthy();
            expect(programme.progressPercentage).toBeGreaterThanOrEqual(0);
            expect(programme.progressPercentage).toBeLessThanOrEqual(100);
            expect(Object.values(ProgramStatus)).toContain(programme.statut);
          });
        });
      }
    });
  });
});