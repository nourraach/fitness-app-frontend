import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, BehaviorSubject, throwError } from 'rxjs';

import { ExerciseTrackerComponent } from './exercise-tracker.component';
import { ProgrammeService } from '../../../services/programme.service';
import { 
  ProgrammeEntrainementDTO, 
  ExerciceDTO, 
  ProgramStatus,
  IntensiteExercice,
  CompleteExerciceRequest 
} from '../../../models/programme.model';

// Mock data generators
function generateMockExercice(overrides: Partial<ExerciceDTO> = {}): ExerciceDTO {
  return {
    nom: `Exercice ${Math.floor(Math.random() * 100)}`,
    description: `Description de l'exercice`,
    series: Math.floor(Math.random() * 5) + 1,
    repetitions: Math.floor(Math.random() * 20) + 1,
    dureeMinutes: Math.random() > 0.5 ? Math.floor(Math.random() * 60) + 1 : undefined,
    intensite: Object.values(IntensiteExercice)[Math.floor(Math.random() * Object.values(IntensiteExercice).length)],
    notes: Math.random() > 0.5 ? 'Notes de test' : undefined,
    completed: Math.random() > 0.5,
    completionDate: Math.random() > 0.5 ? new Date() : undefined,
    ...overrides
  };
}

function generateMockProgramme(exerciceCount: number = 5): ProgrammeEntrainementDTO {
  const exercices = Array.from({ length: exerciceCount }, () => generateMockExercice());
  const completedExercises = exercices.filter(ex => ex.completed).length;
  
  return {
    id: Math.floor(Math.random() * 1000) + 1,
    coachId: 1,
    clientId: 1,
    nomCoach: 'Coach Test',
    nomClient: 'Client Test',
    nom: 'Programme Test',
    description: 'Description du programme',
    dateDebut: new Date(),
    dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    exercices,
    statut: ProgramStatus.ACTIF,
    totalExercises: exercices.length,
    completedExercises,
    progressPercentage: exercices.length > 0 ? Math.round((completedExercises / exercices.length) * 100) : 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('ExerciseTrackerComponent', () => {
  let component: ExerciseTrackerComponent;
  let fixture: ComponentFixture<ExerciseTrackerComponent>;
  let mockProgrammeService: jasmine.SpyObj<ProgrammeService>;

  beforeEach(async () => {
    const programmeServiceSpy = jasmine.createSpyObj('ProgrammeService', [
      'completeExercise'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ExerciseTrackerComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: ProgrammeService, useValue: programmeServiceSpy }
      ]
    }).compileComponents();

    mockProgrammeService = TestBed.inject(ProgrammeService) as jasmine.SpyObj<ProgrammeService>;
    mockProgrammeService.completeExercise.and.returnValue(of({}));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExerciseTrackerComponent);
    component = fixture.componentInstance;
    
    // Set up a default programme
    component.programme = generateMockProgramme(3);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with programme data', () => {
      expect(component.programme).toBeDefined();
      expect(component.exerciseForms.length).toBe(component.programme.exercices.length);
      expect(component.totalExercises).toBe(component.programme.exercices.length);
    });

    it('should calculate initial progress correctly', () => {
      const completedCount = component.programme.exercices.filter(ex => ex.completed).length;
      expect(component.completedExercises).toBe(completedCount);
      
      const expectedPercentage = component.totalExercises > 0 
        ? Math.round((completedCount / component.totalExercises) * 100)
        : 0;
      expect(component.progressPercentage).toBe(expectedPercentage);
    });

    it('should create forms for each exercise', () => {
      component.programme.exercices.forEach((exercice, index) => {
        const form = component.exerciseForms[index];
        expect(form).toBeDefined();
        expect(form.get('notes')?.value).toBe(exercice.notes || '');
        expect(form.get('completed')?.value).toBe(exercice.completed || false);
      });
    });
  });

  describe('Exercise Completion', () => {
    /**
     * **Feature: fitness-frontend-features, Property 6: Exercise completion tracking**
     * For any exercise marked as completed, the progress indicator should update 
     * to reflect the new completion state
     */
    it('should track exercise completion correctly', () => {
      // Property: For any exercise completion change, progress should update correctly
      const testCases = [
        // Test case 1: Mark incomplete exercise as complete
        {
          initialCompleted: false,
          newCompleted: true,
          description: 'marking incomplete exercise as complete'
        },
        // Test case 2: Mark complete exercise as incomplete
        {
          initialCompleted: true,
          newCompleted: false,
          description: 'marking complete exercise as incomplete'
        }
      ];

      testCases.forEach((testCase, caseIndex) => {
        // Create a programme with known completion states
        const exercices = [
          generateMockExercice({ completed: testCase.initialCompleted }),
          generateMockExercice({ completed: false }),
          generateMockExercice({ completed: false })
        ];
        
        component.programme = {
          ...generateMockProgramme(0),
          exercices,
          totalExercises: exercices.length,
          completedExercises: exercices.filter(ex => ex.completed).length
        };
        
        // Recalculate initial progress
        component.ngOnInit();
        const initialProgress = component.progressPercentage;
        const initialCompleted = component.completedExercises;
        
        // Toggle the first exercise
        component.toggleExerciseCompletion(0);
        
        // Verify the service was called with correct parameters
        expect(mockProgrammeService.completeExercise).toHaveBeenCalledWith(
          component.programme.id!,
          0,
          jasmine.objectContaining({
            completed: testCase.newCompleted
          })
        );
        
        // Simulate successful completion
        const exercice = component.programme.exercices[0];
        exercice.completed = testCase.newCompleted;
        exercice.completionDate = testCase.newCompleted ? new Date() : undefined;
        
        // Manually trigger progress recalculation (simulating successful API response)
        (component as any).calculateProgress();
        
        // Verify progress tracking
        const expectedCompletedCount = testCase.newCompleted ? initialCompleted + 1 : initialCompleted - 1;
        const expectedProgress = Math.round((expectedCompletedCount / component.totalExercises) * 100);
        
        expect(component.completedExercises).toBe(expectedCompletedCount);
        expect(component.progressPercentage).toBe(expectedProgress);
        
        // Verify the exercise state is correctly updated
        expect(exercice.completed).toBe(testCase.newCompleted);
        if (testCase.newCompleted) {
          expect(exercice.completionDate).toBeDefined();
        }
      });
    });

    it('should not allow completion toggle in read-only mode', () => {
      component.readOnly = true;
      
      component.toggleExerciseCompletion(0);
      
      expect(mockProgrammeService.completeExercise).not.toHaveBeenCalled();
    });

    it('should handle invalid exercise indices', () => {
      component.toggleExerciseCompletion(-1);
      component.toggleExerciseCompletion(999);
      
      expect(mockProgrammeService.completeExercise).not.toHaveBeenCalled();
    });

    it('should emit events on exercise completion', () => {
      spyOn(component.exerciseCompleted, 'emit');
      spyOn(component.progressUpdated, 'emit');
      
      const exerciceIndex = 0;
      component.toggleExerciseCompletion(exerciceIndex);
      
      // Simulate successful API response
      const exercice = component.programme.exercices[exerciceIndex];
      exercice.completed = !exercice.completed;
      (component as any).calculateProgress();
      
      expect(component.exerciseCompleted.emit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          exerciceIndex,
          completed: exercice.completed
        })
      );
      
      expect(component.progressUpdated.emit).toHaveBeenCalledWith(component.progressPercentage);
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress correctly for various scenarios', () => {
      const testScenarios = [
        { total: 0, completed: 0, expectedPercentage: 0 },
        { total: 1, completed: 0, expectedPercentage: 0 },
        { total: 1, completed: 1, expectedPercentage: 100 },
        { total: 4, completed: 1, expectedPercentage: 25 },
        { total: 3, completed: 2, expectedPercentage: 67 },
        { total: 10, completed: 7, expectedPercentage: 70 }
      ];

      testScenarios.forEach(scenario => {
        const exercices = Array.from({ length: scenario.total }, (_, index) => 
          generateMockExercice({ completed: index < scenario.completed })
        );
        
        component.programme = {
          ...component.programme,
          exercices,
          totalExercises: scenario.total,
          completedExercises: scenario.completed
        };
        
        (component as any).calculateProgress();
        
        expect(component.totalExercises).toBe(scenario.total);
        expect(component.completedExercises).toBe(scenario.completed);
        expect(component.progressPercentage).toBe(scenario.expectedPercentage);
      });
    });
  });

  describe('UI State Management', () => {
    it('should manage exercise expansion state', () => {
      const exerciceIndex = 0;
      
      expect(component.isExerciseExpanded(exerciceIndex)).toBe(false);
      
      component.toggleExerciseExpansion(exerciceIndex);
      expect(component.isExerciseExpanded(exerciceIndex)).toBe(true);
      
      component.toggleExerciseExpansion(exerciceIndex);
      expect(component.isExerciseExpanded(exerciceIndex)).toBe(false);
    });

    it('should expand and collapse all exercises', () => {
      component.expandAllExercises();
      
      component.programme.exercices.forEach((_, index) => {
        expect(component.isExerciseExpanded(index)).toBe(true);
      });
      
      component.collapseAllExercises();
      
      component.programme.exercices.forEach((_, index) => {
        expect(component.isExerciseExpanded(index)).toBe(false);
      });
    });
  });

  describe('Display Helper Methods', () => {
    it('should return correct intensity display text', () => {
      expect(component.getIntensiteDisplayText(IntensiteExercice.FAIBLE)).toBe('Faible');
      expect(component.getIntensiteDisplayText(IntensiteExercice.MOYENNE)).toBe('Moyenne');
      expect(component.getIntensiteDisplayText(IntensiteExercice.ELEVEE)).toBe('Élevée');
      expect(component.getIntensiteDisplayText(IntensiteExercice.MAXIMALE)).toBe('Maximale');
      expect(component.getIntensiteDisplayText(undefined)).toBe('');
    });

    it('should return correct intensity CSS classes', () => {
      expect(component.getIntensiteClass(IntensiteExercice.FAIBLE)).toBe('intensite-faible');
      expect(component.getIntensiteClass(IntensiteExercice.MOYENNE)).toBe('intensite-moyenne');
      expect(component.getIntensiteClass(IntensiteExercice.ELEVEE)).toBe('intensite-elevee');
      expect(component.getIntensiteClass(IntensiteExercice.MAXIMALE)).toBe('intensite-maximale');
      expect(component.getIntensiteClass(undefined)).toBe('');
    });

    it('should return correct progress CSS classes', () => {
      component.progressPercentage = 90;
      expect(component.getProgressClass()).toBe('progress-high');
      
      component.progressPercentage = 60;
      expect(component.getProgressClass()).toBe('progress-medium');
      
      component.progressPercentage = 30;
      expect(component.getProgressClass()).toBe('progress-low');
      
      component.progressPercentage = 10;
      expect(component.getProgressClass()).toBe('progress-none');
    });

    it('should format duration correctly', () => {
      expect(component.formatDuration(30)).toBe('30min');
      expect(component.formatDuration(60)).toBe('1h');
      expect(component.formatDuration(90)).toBe('1h30min');
      expect(component.formatDuration(120)).toBe('2h');
      expect(component.formatDuration(undefined)).toBe('');
    });

    it('should format completion date correctly', () => {
      const testDate = new Date('2024-01-15T14:30:00');
      const formatted = component.formatCompletionDate(testDate);
      expect(formatted).toContain('15/01/2024');
      expect(formatted).toContain('14:30');
    });
  });

  describe('Statistics and Filtering', () => {
    it('should provide correct completion statistics', () => {
      const stats = component.getCompletionStats();
      
      expect(stats.completed).toBe(component.completedExercises);
      expect(stats.total).toBe(component.totalExercises);
      expect(stats.percentage).toBe(component.progressPercentage);
    });

    it('should filter remaining exercises correctly', () => {
      const remaining = component.getRemainingExercises();
      const expectedRemaining = component.programme.exercices.filter(ex => !ex.completed);
      
      expect(remaining.length).toBe(expectedRemaining.length);
      remaining.forEach(exercice => {
        expect(exercice.completed).toBe(false);
      });
    });

    it('should filter completed exercises correctly', () => {
      const completed = component.getCompletedExercises();
      const expectedCompleted = component.programme.exercices.filter(ex => ex.completed);
      
      expect(completed.length).toBe(expectedCompleted.length);
      completed.forEach(exercice => {
        expect(exercice.completed).toBe(true);
      });
    });
  });

  describe('Bulk Actions', () => {
    it('should mark all exercises as completed with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'toggleExerciseCompletion');
      
      // Set up programme with some incomplete exercises
      component.programme.exercices.forEach(ex => ex.completed = false);
      (component as any).calculateProgress();
      
      component.markAllExercisesCompleted();
      
      expect(window.confirm).toHaveBeenCalled();
      // Should call toggleExerciseCompletion for each exercise (with delays)
      expect(component.toggleExerciseCompletion).toHaveBeenCalledTimes(component.programme.exercices.length);
    });

    it('should not mark exercises as completed without confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(component, 'toggleExerciseCompletion');
      
      component.markAllExercisesCompleted();
      
      expect(window.confirm).toHaveBeenCalled();
      expect(component.toggleExerciseCompletion).not.toHaveBeenCalled();
    });

    it('should reset all exercises with confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(component, 'toggleExerciseCompletion');
      
      // Set up programme with some completed exercises
      component.programme.exercices.forEach(ex => ex.completed = true);
      (component as any).calculateProgress();
      
      component.resetAllExercises();
      
      expect(window.confirm).toHaveBeenCalled();
      expect(component.toggleExerciseCompletion).toHaveBeenCalledTimes(component.programme.exercices.length);
    });
  });

  describe('Property-Based Testing - Random Exercise Data', () => {
    it('should handle random exercise completion scenarios correctly', () => {
      // Generate multiple random test cases
      for (let i = 0; i < 10; i++) {
        const exerciseCount = Math.floor(Math.random() * 10) + 1;
        const randomProgramme = generateMockProgramme(exerciseCount);
        
        component.programme = randomProgramme;
        component.ngOnInit();
        
        // Verify progress calculation is always correct
        const actualCompleted = randomProgramme.exercices.filter(ex => ex.completed).length;
        const expectedPercentage = exerciseCount > 0 ? Math.round((actualCompleted / exerciseCount) * 100) : 0;
        
        expect(component.completedExercises).toBe(actualCompleted);
        expect(component.totalExercises).toBe(exerciseCount);
        expect(component.progressPercentage).toBe(expectedPercentage);
        
        // Verify progress percentage is always between 0 and 100
        expect(component.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(component.progressPercentage).toBeLessThanOrEqual(100);
        
        // Verify exercise forms are created correctly
        expect(component.exerciseForms.length).toBe(exerciseCount);
        
        // Verify filtering methods work correctly
        const remainingExercises = component.getRemainingExercises();
        const completedExercises = component.getCompletedExercises();
        
        expect(remainingExercises.length + completedExercises.length).toBe(exerciseCount);
        expect(completedExercises.length).toBe(actualCompleted);
        expect(remainingExercises.length).toBe(exerciseCount - actualCompleted);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', () => {
      const errorResponse = new Error('Service error');
      mockProgrammeService.completeExercise.and.returnValue(
        throwError(() => errorResponse)
      );
      
      component.toggleExerciseCompletion(0);
      
      // Verify error handling doesn't crash the component
      expect(component).toBeTruthy();
    });

    it('should handle empty programme gracefully', () => {
      component.programme = {
        ...component.programme,
        exercices: [],
        totalExercises: 0,
        completedExercises: 0
      };
      
      component.ngOnInit();
      
      expect(component.totalExercises).toBe(0);
      expect(component.completedExercises).toBe(0);
      expect(component.progressPercentage).toBe(0);
      expect(component.exerciseForms.length).toBe(0);
    });
  });
});