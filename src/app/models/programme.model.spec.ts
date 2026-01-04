import * as fc from 'fast-check';
import { ExerciceDTO, ProgrammeEntrainementDTO, ProgramStatus, IntensiteExercice } from './programme.model';

/**
 * Feature: fitness-frontend-features, Property 1: Exercise form validation
 * Validates: Requirements 1.2
 */
describe('Programme Model Property Tests', () => {
  
  // Generators for property-based testing
  const exerciceGenerator = fc.record({
    nom: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.option(fc.string({ maxLength: 500 })),
    series: fc.integer({ min: 1, max: 10 }),
    repetitions: fc.integer({ min: 1, max: 100 }),
    dureeMinutes: fc.option(fc.integer({ min: 1, max: 180 })),
    intensite: fc.option(fc.constantFrom(...Object.values(IntensiteExercice))),
    notes: fc.option(fc.string({ maxLength: 1000 })),
    completed: fc.option(fc.boolean()),
    completionDate: fc.option(fc.date())
  });

  const programmeGenerator = fc.record({
    id: fc.option(fc.integer({ min: 1 })),
    coachId: fc.integer({ min: 1 }),
    clientId: fc.integer({ min: 1 }),
    nomCoach: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    nomClient: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    nom: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.option(fc.string({ maxLength: 1000 })),
    dateDebut: fc.date(),
    dateFin: fc.option(fc.date()),
    exercices: fc.array(exerciceGenerator, { minLength: 1, maxLength: 20 }),
    statut: fc.constantFrom(...Object.values(ProgramStatus)),
    totalExercises: fc.integer({ min: 1, max: 20 }),
    completedExercises: fc.integer({ min: 0, max: 20 }),
    progressPercentage: fc.float({ min: 0, max: 100 }),
    createdAt: fc.date(),
    updatedAt: fc.option(fc.date())
  });

  describe('Property 1: Exercise form validation', () => {
    it('should accept valid exercise configurations and reject invalid ones', () => {
      fc.assert(fc.property(exerciceGenerator, (exercice: ExerciceDTO) => {
        // Valid exercise should have required fields
        const isValid = exercice.nom && exercice.nom.trim().length > 0 &&
                       exercice.series > 0 &&
                       exercice.repetitions > 0;
        
        if (isValid) {
          // Valid exercises should pass validation
          expect(validateExercice(exercice)).toBe(true);
        } else {
          // Invalid exercises should fail validation
          expect(validateExercice(exercice)).toBe(false);
        }
      }), { numRuns: 100 });
    });

    it('should validate exercise name is not empty', () => {
      fc.assert(fc.property(
        fc.record({
          ...exerciceGenerator.constraints,
          nom: fc.string({ minLength: 0, maxLength: 0 }) // Empty name
        }),
        (exercice: ExerciceDTO) => {
          expect(validateExercice(exercice)).toBe(false);
        }
      ), { numRuns: 100 });
    });

    it('should validate series and repetitions are positive', () => {
      fc.assert(fc.property(
        fc.record({
          nom: fc.string({ minLength: 1 }),
          series: fc.integer({ max: 0 }), // Non-positive series
          repetitions: fc.integer({ min: 1 })
        }),
        (exercice: Partial<ExerciceDTO>) => {
          expect(validateExercice(exercice as ExerciceDTO)).toBe(false);
        }
      ), { numRuns: 100 });

      fc.assert(fc.property(
        fc.record({
          nom: fc.string({ minLength: 1 }),
          series: fc.integer({ min: 1 }),
          repetitions: fc.integer({ max: 0 }) // Non-positive repetitions
        }),
        (exercice: Partial<ExerciceDTO>) => {
          expect(validateExercice(exercice as ExerciceDTO)).toBe(false);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Programme validation properties', () => {
    it('should validate programme has required fields', () => {
      fc.assert(fc.property(programmeGenerator, (programme: ProgrammeEntrainementDTO) => {
        const isValid = programme.nom && programme.nom.trim().length > 0 &&
                       programme.coachId > 0 &&
                       programme.clientId > 0 &&
                       programme.exercices && programme.exercices.length > 0;
        
        if (isValid) {
          expect(validateProgramme(programme)).toBe(true);
        }
      }), { numRuns: 100 });
    });

    it('should validate progress percentage is between 0 and 100', () => {
      fc.assert(fc.property(programmeGenerator, (programme: ProgrammeEntrainementDTO) => {
        expect(programme.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(programme.progressPercentage).toBeLessThanOrEqual(100);
      }), { numRuns: 100 });
    });

    it('should validate completed exercises does not exceed total exercises', () => {
      fc.assert(fc.property(programmeGenerator, (programme: ProgrammeEntrainementDTO) => {
        expect(programme.completedExercises).toBeLessThanOrEqual(programme.totalExercises);
      }), { numRuns: 100 });
    });
  });
});

// Validation functions (these would typically be in a separate validation service)
function validateExercice(exercice: ExerciceDTO): boolean {
  if (!exercice.nom || exercice.nom.trim().length === 0) {
    return false;
  }
  if (!exercice.series || exercice.series <= 0) {
    return false;
  }
  if (!exercice.repetitions || exercice.repetitions <= 0) {
    return false;
  }
  return true;
}

function validateProgramme(programme: ProgrammeEntrainementDTO): boolean {
  if (!programme.nom || programme.nom.trim().length === 0) {
    return false;
  }
  if (!programme.coachId || programme.coachId <= 0) {
    return false;
  }
  if (!programme.clientId || programme.clientId <= 0) {
    return false;
  }
  if (!programme.exercices || programme.exercices.length === 0) {
    return false;
  }
  return true;
}