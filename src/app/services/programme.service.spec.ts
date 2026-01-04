import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { ProgrammeService } from './programme.service';
import { ProgrammeEntrainement, CreerProgrammeRequest, ProgrammeEntrainementDTO, ProgramStatus } from '../models/programme.model';

/**
 * Feature: fitness-frontend-features, Property 2: Program submission success feedback
 * Validates: Requirements 1.3
 */
describe('ProgrammeService Property Tests', () => {
  let service: ProgrammeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgrammeService]
    });
    service = TestBed.inject(ProgrammeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Generators for property-based testing
  const programmeRequestGenerator = fc.record({
    clientId: fc.integer({ min: 1, max: 1000 }),
    nom: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    dateDebut: fc.date().map(d => d.toISOString()),
    dateFin: fc.date().map(d => d.toISOString()),
    exercices: fc.array(fc.record({
      nom: fc.string({ minLength: 1, maxLength: 100 }),
      series: fc.integer({ min: 1, max: 10 }),
      repetitions: fc.integer({ min: 1, max: 100 }),
      dureeMinutes: fc.option(fc.integer({ min: 1, max: 180 }))
    }), { minLength: 1, maxLength: 10 })
  });

  const programmeResponseGenerator = fc.record({
    id: fc.integer({ min: 1 }),
    coachId: fc.integer({ min: 1 }),
    clientId: fc.integer({ min: 1 }),
    nom: fc.string({ minLength: 1 }),
    description: fc.option(fc.string()),
    dateDebut: fc.date().map(d => d.toISOString()),
    dateFin: fc.date().map(d => d.toISOString()),
    exercices: fc.array(fc.record({
      nom: fc.string({ minLength: 1 }),
      series: fc.integer({ min: 1 }),
      repetitions: fc.integer({ min: 1 })
    }), { minLength: 1 }),
    statut: fc.constantFrom('ACTIF', 'TERMINE', 'SUSPENDU', 'ANNULE')
  });

  describe('Property 2: Program submission success feedback', () => {
    it('should return success response for any valid program creation request', () => {
      fc.assert(fc.property(
        programmeRequestGenerator,
        programmeResponseGenerator,
        (request: CreerProgrammeRequest, expectedResponse: ProgrammeEntrainement) => {
          // Act
          service.creerProgramme(request).subscribe(response => {
            // Assert - should receive a response with an ID
            expect(response).toBeDefined();
            expect(response.id).toBeDefined();
            expect(response.nom).toBe(request.nom);
            expect(response.clientId).toBe(request.clientId);
          });

          // Mock HTTP response
          const req = httpMock.expectOne('http://localhost:8095/api/programmes');
          expect(req.request.method).toBe('POST');
          expect(req.request.body).toEqual(request);
          req.flush(expectedResponse);
        }
      ), { numRuns: 50 }); // Reduced runs for HTTP testing
    });

    it('should handle program creation with different exercise configurations', () => {
      fc.assert(fc.property(
        programmeRequestGenerator,
        (request: CreerProgrammeRequest) => {
          let responseReceived = false;
          
          service.creerProgramme(request).subscribe(response => {
            responseReceived = true;
            expect(response.exercices.length).toBe(request.exercices.length);
          });

          const req = httpMock.expectOne('http://localhost:8095/api/programmes');
          req.flush({
            id: 1,
            ...request,
            statut: 'ACTIF'
          });

          expect(responseReceived).toBe(true);
        }
      ), { numRuns: 30 });
    });
  });

  describe('Progress calculation properties', () => {
    it('should calculate correct progress percentage for any valid input', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (completed: number, total: number) => {
          // Ensure completed doesn't exceed total
          const actualCompleted = Math.min(completed, total);
          
          const percentage = service.calculateProgressPercentage(actualCompleted, total);
          
          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
          expect(percentage).toBe(Math.round((actualCompleted / total) * 100));
        }
      ), { numRuns: 100 });
    });

    it('should return 0 progress for zero total exercises', () => {
      fc.assert(fc.property(
        fc.integer({ min: 0, max: 100 }),
        (completed: number) => {
          const percentage = service.calculateProgressPercentage(completed, 0);
          expect(percentage).toBe(0);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Programme completion properties', () => {
    it('should correctly identify completed programmes', () => {
      fc.assert(fc.property(
        fc.record({
          id: fc.integer({ min: 1 }),
          coachId: fc.integer({ min: 1 }),
          clientId: fc.integer({ min: 1 }),
          nom: fc.string({ minLength: 1 }),
          dateDebut: fc.date(),
          exercices: fc.array(fc.anything(), { minLength: 1, maxLength: 10 }),
          statut: fc.constantFrom(...Object.values(ProgramStatus)),
          totalExercises: fc.integer({ min: 1, max: 10 }),
          completedExercises: fc.integer({ min: 0, max: 10 }),
          progressPercentage: fc.float({ min: 0, max: 100 }),
          createdAt: fc.date()
        }),
        (programme: ProgrammeEntrainementDTO) => {
          // Ensure completed doesn't exceed total
          programme.completedExercises = Math.min(programme.completedExercises, programme.totalExercises);
          
          const isCompleted = service.isProgrammeCompleted(programme);
          
          if (programme.completedExercises === programme.totalExercises) {
            expect(isCompleted).toBe(true);
          } else {
            expect(isCompleted).toBe(false);
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Error handling properties', () => {
    it('should handle HTTP errors gracefully', () => {
      fc.assert(fc.property(
        programmeRequestGenerator,
        (request: CreerProgrammeRequest) => {
          let errorHandled = false;
          
          service.creerProgramme(request).subscribe({
            next: () => fail('Should have failed'),
            error: (error) => {
              errorHandled = true;
              expect(error).toBeDefined();
            }
          });

          const req = httpMock.expectOne('http://localhost:8095/api/programmes');
          req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

          expect(errorHandled).toBe(true);
        }
      ), { numRuns: 20 });
    });
  });
});

/**
 * Feature: fitness-frontend-features, Property 4: Status update reactivity
 * Validates: Requirements 1.5
 */
describe('Status Update Property Tests', () => {
  
  const statusGenerator = fc.constantFrom(...Object.values(ProgramStatus));
  const programmeIdGenerator = fc.integer({ min: 1, max: 1000 });

  describe('Property 4: Status update reactivity', () => {
    it('should immediately reflect status changes in the interface', () => {
      fc.assert(fc.property(
        programmeIdGenerator,
        statusGenerator,
        statusGenerator,
        (programmeId: number, oldStatus: ProgramStatus, newStatus: ProgramStatus) => {
          // Setup initial programmes state
          const initialProgrammes: ProgrammeEntrainementDTO[] = [{
            id: programmeId,
            coachId: 1,
            clientId: 1,
            nom: 'Test Programme',
            dateDebut: new Date(),
            exercices: [],
            statut: oldStatus,
            totalExercises: 5,
            completedExercises: 2,
            progressPercentage: 40,
            createdAt: new Date()
          }];

          // Set initial state
          (service as any).programmesSubject.next(initialProgrammes);

          let optimisticUpdateReceived = false;
          let finalUpdateReceived = false;

          // Subscribe to programmes observable to check optimistic update
          const subscription = service.programmes$.subscribe(programmes => {
            const programme = programmes.find(p => p.id === programmeId);
            if (programme && programme.statut === newStatus) {
              if (!finalUpdateReceived) {
                optimisticUpdateReceived = true;
              }
            }
          });

          // Perform status update
          service.changerStatut(programmeId, newStatus).subscribe(response => {
            finalUpdateReceived = true;
            expect(response.statut).toBe(newStatus);
          });

          // Mock HTTP response
          const req = httpMock.expectOne(`http://localhost:8095/api/programmes/${programmeId}/statut`);
          expect(req.request.method).toBe('PATCH');
          expect(req.request.body).toEqual({ statut: newStatus });
          
          req.flush({
            id: programmeId,
            statut: newStatus,
            nom: 'Test Programme'
          });

          // Verify optimistic update occurred before HTTP response
          expect(optimisticUpdateReceived).toBe(true);
          expect(finalUpdateReceived).toBe(true);

          subscription.unsubscribe();
        }
      ), { numRuns: 50 });
    });

    it('should revert optimistic updates on error', () => {
      fc.assert(fc.property(
        programmeIdGenerator,
        statusGenerator,
        statusGenerator,
        (programmeId: number, oldStatus: ProgramStatus, newStatus: ProgramStatus) => {
          if (oldStatus === newStatus) return; // Skip if same status

          const initialProgrammes: ProgrammeEntrainementDTO[] = [{
            id: programmeId,
            coachId: 1,
            clientId: 1,
            nom: 'Test Programme',
            dateDebut: new Date(),
            exercices: [],
            statut: oldStatus,
            totalExercises: 5,
            completedExercises: 2,
            progressPercentage: 40,
            createdAt: new Date()
          }];

          (service as any).programmesSubject.next(initialProgrammes);

          let statusReverted = false;

          // Subscribe to check reversion
          const subscription = service.programmes$.subscribe(programmes => {
            const programme = programmes.find(p => p.id === programmeId);
            if (programme && programme.statut === oldStatus && statusReverted === false) {
              // This could be the reversion
              statusReverted = true;
            }
          });

          // Perform status update that will fail
          service.changerStatut(programmeId, newStatus).subscribe({
            next: () => fail('Should have failed'),
            error: (error) => {
              expect(error).toBeDefined();
            }
          });

          // Mock HTTP error response
          const req = httpMock.expectOne(`http://localhost:8095/api/programmes/${programmeId}/statut`);
          req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

          // Verify status was reverted
          const currentProgrammes = (service as any).programmesSubject.value;
          const programme = currentProgrammes.find((p: any) => p.id === programmeId);
          expect(programme.statut).toBe(oldStatus);

          subscription.unsubscribe();
        }
      ), { numRuns: 30 });
    });
  });

  describe('Status transition validation', () => {
    it('should handle all valid status transitions', () => {
      fc.assert(fc.property(
        programmeIdGenerator,
        statusGenerator,
        (programmeId: number, newStatus: ProgramStatus) => {
          service.updateStatus(programmeId, { statut: newStatus }).subscribe(response => {
            expect(response.statut).toBe(newStatus);
            expect(response.id).toBe(programmeId);
          });

          const req = httpMock.expectOne(`http://localhost:8095/api/programmes/${programmeId}/status`);
          expect(req.request.method).toBe('PUT');
          expect(req.request.body).toEqual({ statut: newStatus });
          
          req.flush({
            id: programmeId,
            coachId: 1,
            clientId: 1,
            nom: 'Test Programme',
            dateDebut: new Date(),
            exercices: [],
            statut: newStatus,
            totalExercises: 5,
            completedExercises: 2,
            progressPercentage: 40,
            createdAt: new Date()
          });
        }
      ), { numRuns: 50 });
    });
  });
});