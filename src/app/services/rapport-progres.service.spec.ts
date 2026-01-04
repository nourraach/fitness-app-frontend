import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import * as fc from 'fast-check';
import { RapportProgresService } from './rapport-progres.service';
import { RapportProgresDTO, CreerRapportRequest, CompiledDataDTO } from '../models/rapport-progres.model';

/**
 * Feature: fitness-frontend-features, Property 14: Data compilation completeness
 * Validates: Requirements 4.2
 */
describe('RapportProgresService Property Tests', () => {
  let service: RapportProgresService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RapportProgresService]
    });
    service = TestBed.inject(RapportProgresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // Generators for property-based testing
  const compiledDataGenerator = fc.record({
    totalActivites: fc.integer({ min: 0, max: 50 }),
    totalRepas: fc.integer({ min: 0, max: 100 }),
    caloriesConsommees: fc.float({ min: 0, max: 5000 }),
    caloriesBrulees: fc.float({ min: 0, max: 3000 }),
    bilanCalorique: fc.float({ min: -2000, max: 2000 }),
    moyenneCaloriesParJour: fc.float({ min: 0, max: 3000 }),
    totalDureeActivites: fc.integer({ min: 0, max: 1000 }),
    moyenneDureeParActivite: fc.float({ min: 0, max: 120 }),
    moyenneActivitesParJour: fc.float({ min: 0, max: 10 }),
    totalProteines: fc.float({ min: 0, max: 500 }),
    totalGlucides: fc.float({ min: 0, max: 1000 }),
    totalLipides: fc.float({ min: 0, max: 300 }),
    pourcentageProteines: fc.float({ min: 0, max: 100 }),
    pourcentageGlucides: fc.float({ min: 0, max: 100 }),
    pourcentageLipides: fc.float({ min: 0, max: 100 }),
    joursAvecActivite: fc.integer({ min: 0, max: 7 }),
    joursAvecRepas: fc.integer({ min: 0, max: 7 }),
    objectifActiviteAtteint: fc.boolean(),
    objectifNutritionAtteint: fc.boolean()
  });

  const rapportRequestGenerator = fc.record({
    utilisateurId: fc.integer({ min: 1, max: 1000 }),
    dateDebutSemaine: fc.date(),
    dateFinSemaine: fc.date(),
    resume: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
    recommandations: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined })
  });

  describe('Property 14: Data compilation completeness', () => {
    it('should compile all available metrics for any client data within date range', () => {
      fc.assert(fc.property(
        rapportRequestGenerator,
        compiledDataGenerator,
        (request: CreerRapportRequest, compiledData: CompiledDataDTO) => {
          // Ensure valid date range
          if (request.dateFinSemaine <= request.dateDebutSemaine) {
            request.dateFinSemaine = new Date(request.dateDebutSemaine.getTime() + 7 * 24 * 60 * 60 * 1000);
          }

          const expectedResponse: RapportProgresDTO = {
            id: 1,
            utilisateurId: request.utilisateurId,
            coachId: 1,
            dateDebutSemaine: request.dateDebutSemaine,
            dateFinSemaine: request.dateFinSemaine,
            resume: request.resume,
            recommandations: request.recommandations,
            donneesCompilees: JSON.stringify(compiledData),
            dateGeneration: new Date()
          };

          service.creerRapport(request).subscribe(response => {
            expect(response).toBeDefined();
            expect(response.utilisateurId).toBe(request.utilisateurId);
            expect(response.donneesCompilees).toBeDefined();
            
            // Verify compiled data contains all required metrics
            const parsedData = service.parseCompiledData(response.donneesCompilees);
            expect(parsedData).toBeDefined();
            expect(parsedData!.totalActivites).toBeDefined();
            expect(parsedData!.totalRepas).toBeDefined();
            expect(parsedData!.caloriesConsommees).toBeDefined();
            expect(parsedData!.caloriesBrulees).toBeDefined();
            expect(parsedData!.bilanCalorique).toBeDefined();
          });

          const req = httpMock.expectOne('http://localhost:8095/api/rapports/creer');
          expect(req.request.method).toBe('POST');
          req.flush(expectedResponse);
        }
      ), { numRuns: 50 });
    });

    it('should handle parsing of compiled data correctly', () => {
      fc.assert(fc.property(
        compiledDataGenerator,
        (compiledData: CompiledDataDTO) => {
          const jsonString = JSON.stringify(compiledData);
          const parsedData = service.parseCompiledData(jsonString);
          
          expect(parsedData).toBeDefined();
          expect(parsedData!.totalActivites).toBe(compiledData.totalActivites);
          expect(parsedData!.totalRepas).toBe(compiledData.totalRepas);
          expect(parsedData!.caloriesConsommees).toBe(compiledData.caloriesConsommees);
          expect(parsedData!.caloriesBrulees).toBe(compiledData.caloriesBrulees);
        }
      ), { numRuns: 100 });
    });

    it('should return null for invalid JSON data', () => {
      fc.assert(fc.property(
        fc.string().filter(s => {
          try {
            JSON.parse(s);
            return false; // Valid JSON, skip
          } catch {
            return true; // Invalid JSON, use
          }
        }),
        (invalidJson: string) => {
          const result = service.parseCompiledData(invalidJson);
          expect(result).toBeNull();
        }
      ), { numRuns: 50 });
    });
  });

  describe('Chart data generation properties', () => {
    it('should generate valid chart data for any compiled data', () => {
      fc.assert(fc.property(
        compiledDataGenerator,
        (compiledData: CompiledDataDTO) => {
          const chartData = service.generateChartData(compiledData);
          
          expect(chartData).toBeDefined();
          expect(chartData.calories).toBeDefined();
          expect(chartData.macros).toBeDefined();
          expect(chartData.activities).toBeDefined();
          
          // Verify calories chart
          expect(chartData.calories.data).toEqual([
            compiledData.caloriesConsommees,
            compiledData.caloriesBrulees
          ]);
          
          // Verify macros chart
          expect(chartData.macros.data).toEqual([
            compiledData.pourcentageProteines,
            compiledData.pourcentageGlucides,
            compiledData.pourcentageLipides
          ]);
          
          // Verify activities chart
          expect(chartData.activities.data[0]).toBe(compiledData.totalActivites);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Achievement calculation properties', () => {
    it('should calculate correct achievement percentage', () => {
      fc.assert(fc.property(
        compiledDataGenerator,
        (compiledData: CompiledDataDTO) => {
          const percentage = service.calculateAchievementPercentage(compiledData);
          
          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
          
          let expectedAchievements = 0;
          if (compiledData.objectifActiviteAtteint) expectedAchievements++;
          if (compiledData.objectifNutritionAtteint) expectedAchievements++;
          
          const expectedPercentage = Math.round((expectedAchievements / 2) * 100);
          expect(percentage).toBe(expectedPercentage);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Weekly summary properties', () => {
    it('should generate complete weekly summary for any compiled data', () => {
      fc.assert(fc.property(
        compiledDataGenerator,
        (compiledData: CompiledDataDTO) => {
          const summary = service.getWeeklySummary(compiledData);
          
          expect(summary).toBeDefined();
          expect(summary.totalActivities).toBe(compiledData.totalActivites);
          expect(summary.totalMeals).toBe(compiledData.totalRepas);
          expect(summary.averageCaloriesPerDay).toBe(Math.round(compiledData.moyenneCaloriesParJour));
          expect(summary.calorieBalance).toBe(Math.round(compiledData.bilanCalorique));
          expect(summary.activeDays).toBe(compiledData.joursAvecActivite);
          expect(summary.mealDays).toBe(compiledData.joursAvecRepas);
          expect(summary.achievementPercentage).toBeGreaterThanOrEqual(0);
          expect(summary.achievementPercentage).toBeLessThanOrEqual(100);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Date validation properties', () => {
    it('should validate date ranges correctly', () => {
      fc.assert(fc.property(
        fc.date(),
        fc.integer({ min: 1, max: 14 }), // Days to add
        (startDate: Date, daysToAdd: number) => {
          const endDate = new Date(startDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
          const isValid = service.isValidDateRange(startDate, endDate);
          
          if (daysToAdd <= 7) {
            expect(isValid).toBe(true);
          } else {
            expect(isValid).toBe(false);
          }
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid date ranges', () => {
      fc.assert(fc.property(
        fc.date(),
        fc.date(),
        (date1: Date, date2: Date) => {
          if (date1 >= date2) {
            const isValid = service.isValidDateRange(date1, date2);
            expect(isValid).toBe(false);
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Report status properties', () => {
    it('should assign correct status based on achievement percentage', () => {
      fc.assert(fc.property(
        compiledDataGenerator,
        (compiledData: CompiledDataDTO) => {
          const rapport: RapportProgresDTO = {
            id: 1,
            utilisateurId: 1,
            dateDebutSemaine: new Date(),
            dateFinSemaine: new Date(),
            donneesCompilees: JSON.stringify(compiledData),
            dateGeneration: new Date()
          };

          const status = service.getReportStatus(rapport);
          const achievementPercentage = service.calculateAchievementPercentage(compiledData);
          
          if (achievementPercentage >= 80) {
            expect(status).toBe('excellent');
          } else if (achievementPercentage >= 60) {
            expect(status).toBe('good');
          } else {
            expect(status).toBe('needs-improvement');
          }
        }
      ), { numRuns: 100 });
    });
  });
});