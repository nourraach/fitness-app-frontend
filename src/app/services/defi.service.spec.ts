import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DefiService } from './defi.service';
import { 
  DefiDTO, 
  ParticipantDefiDTO, 
  ClassementDefiDTO, 
  CreerDefiRequest,
  TypeObjectif,
  StatutDefi,
  StatutParticipation 
} from '../models/defi.model';

describe('DefiService', () => {
  let service: DefiService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:8095/api/defis';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DefiService]
    });
    service = TestBed.inject(DefiService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Challenge Creation', () => {
    it('should create a challenge', () => {
      const mockRequest: CreerDefiRequest = {
        nom: 'Test Challenge',
        description: 'Test Description',
        typeObjectif: TypeObjectif.CALORIES_BRULEES,
        valeurCible: 1000,
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const mockResponse: DefiDTO = {
        id: 1,
        createurId: 1,
        createurNom: 'Test User',
        nom: mockRequest.nom,
        description: mockRequest.description,
        typeObjectif: mockRequest.typeObjectif,
        valeurCible: mockRequest.valeurCible,
        dateDebut: mockRequest.dateDebut,
        dateFin: mockRequest.dateFin,
        dateCreation: new Date(),
        statut: StatutDefi.EN_COURS,
        nombreParticipants: 1,
        participants: []
      };

      service.creerDefi(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('Challenge Participation', () => {
    it('should join a challenge', () => {
      const defiId = 1;
      const mockParticipant: ParticipantDefiDTO = {
        id: 1,
        utilisateurId: 1,
        utilisateurNom: 'Test User',
        progressionActuelle: 0,
        statut: StatutParticipation.ACCEPTE,
        dateInscription: new Date(),
        pourcentageProgression: 0
      };

      service.rejoindreDefi(defiId).subscribe(response => {
        expect(response).toEqual(mockParticipant);
      });

      const req = httpMock.expectOne(`${apiUrl}/${defiId}/rejoindre`);
      expect(req.request.method).toBe('POST');
      req.flush(mockParticipant);
    });

    it('should leave a challenge', () => {
      const defiId = 1;

      service.quitterDefi(defiId).subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/${defiId}/quitter`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    /**
     * **Feature: fitness-frontend-features, Property 19: Participation status tracking**
     * For any user joining a challenge, their participation status should update 
     * and progress tracking should begin immediately
     */
    it('should track participation status correctly', () => {
      // Property: For any challenge and user, joining should update status and begin tracking
      const testCases = [
        { defiId: 1, userId: 1, expectedStatus: StatutParticipation.ACCEPTE },
        { defiId: 2, userId: 2, expectedStatus: StatutParticipation.ACCEPTE },
        { defiId: 3, userId: 3, expectedStatus: StatutParticipation.ACCEPTE }
      ];

      testCases.forEach(testCase => {
        const mockParticipant: ParticipantDefiDTO = {
          id: testCase.userId,
          utilisateurId: testCase.userId,
          utilisateurNom: `User ${testCase.userId}`,
          progressionActuelle: 0,
          statut: testCase.expectedStatus,
          dateInscription: new Date(),
          pourcentageProgression: 0
        };

        service.rejoindreDefi(testCase.defiId).subscribe(response => {
          // Verify participation status is correctly set
          expect(response.statut).toBe(testCase.expectedStatus);
          // Verify progress tracking begins (initial progress is 0)
          expect(response.progressionActuelle).toBe(0);
          expect(response.pourcentageProgression).toBe(0);
          // Verify user information is tracked
          expect(response.utilisateurId).toBe(testCase.userId);
          expect(response.dateInscription).toBeDefined();
        });

        const req = httpMock.expectOne(`${apiUrl}/${testCase.defiId}/rejoindre`);
        expect(req.request.method).toBe('POST');
        req.flush(mockParticipant);
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should update user progress', () => {
      const defiId = 1;
      const progressRequest = { progression: 500 };
      const mockParticipant: ParticipantDefiDTO = {
        id: 1,
        utilisateurId: 1,
        utilisateurNom: 'Test User',
        progressionActuelle: 500,
        statut: StatutParticipation.ACCEPTE,
        dateInscription: new Date(),
        pourcentageProgression: 50
      };

      service.updateProgression(defiId, progressRequest).subscribe(response => {
        expect(response.progressionActuelle).toBe(500);
        expect(response.pourcentageProgression).toBe(50);
      });

      const req = httpMock.expectOne(`${apiUrl}/${defiId}/progression`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(progressRequest);
      req.flush(mockParticipant);
    });
  });

  describe('Leaderboard Management', () => {
    it('should get challenge leaderboard', () => {
      const defiId = 1;
      const mockLeaderboard: ClassementDefiDTO = {
        defiId: 1,
        nomDefi: 'Test Challenge',
        typeObjectif: TypeObjectif.CALORIES_BRULEES,
        valeurCible: 1000,
        classement: [
          {
            id: 1,
            utilisateurId: 1,
            utilisateurNom: 'User 1',
            progressionActuelle: 800,
            statut: StatutParticipation.ACCEPTE,
            classement: 1,
            dateInscription: new Date(),
            pourcentageProgression: 80
          },
          {
            id: 2,
            utilisateurId: 2,
            utilisateurNom: 'User 2',
            progressionActuelle: 600,
            statut: StatutParticipation.ACCEPTE,
            classement: 2,
            dateInscription: new Date(),
            pourcentageProgression: 60
          }
        ]
      };

      service.getClassement(defiId).subscribe(response => {
        expect(response).toEqual(mockLeaderboard);
        expect(response.classement.length).toBe(2);
        expect(response.classement[0].classement).toBe(1);
        expect(response.classement[1].classement).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/${defiId}/classement`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLeaderboard);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate progress percentage correctly', () => {
      expect(service.calculateProgressPercentage(500, 1000)).toBe(50);
      expect(service.calculateProgressPercentage(1000, 1000)).toBe(100);
      expect(service.calculateProgressPercentage(1200, 1000)).toBe(100); // Capped at 100%
      expect(service.calculateProgressPercentage(0, 1000)).toBe(0);
      expect(service.calculateProgressPercentage(500, 0)).toBe(0); // Edge case
    });

    it('should check if challenge is completed', () => {
      const participant: ParticipantDefiDTO = {
        id: 1,
        utilisateurId: 1,
        utilisateurNom: 'Test User',
        progressionActuelle: 1000,
        statut: StatutParticipation.ACCEPTE,
        dateInscription: new Date(),
        pourcentageProgression: 100
      };

      expect(service.isDefiCompleted(participant, 1000)).toBe(true);
      expect(service.isDefiCompleted(participant, 1200)).toBe(false);
    });

    it('should format progress display correctly', () => {
      expect(service.formatProgress(1500, TypeObjectif.CALORIES_BRULEES)).toBe('1500 kcal');
      expect(service.formatProgress(5000, TypeObjectif.DISTANCE)).toBe('5.0 km');
      expect(service.formatProgress(120, TypeObjectif.DUREE_ACTIVITE)).toBe('120 min');
    });

    it('should check if user can join challenge', () => {
      const defi: DefiDTO = {
        id: 1,
        createurId: 1,
        createurNom: 'Creator',
        nom: 'Test Challenge',
        typeObjectif: TypeObjectif.CALORIES_BRULEES,
        valeurCible: 1000,
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        dateCreation: new Date(),
        statut: StatutDefi.EN_COURS,
        nombreParticipants: 1,
        participants: [
          {
            id: 1,
            utilisateurId: 2,
            utilisateurNom: 'Existing User',
            progressionActuelle: 0,
            statut: StatutParticipation.ACCEPTE,
            dateInscription: new Date(),
            pourcentageProgression: 0
          }
        ]
      };

      expect(service.canJoinChallenge(defi, 1)).toBe(true); // New user can join
      expect(service.canJoinChallenge(defi, 2)).toBe(false); // Already participating
      
      // Test with terminated challenge
      const terminatedDefi = { ...defi, statut: StatutDefi.TERMINE };
      expect(service.canJoinChallenge(terminatedDefi, 1)).toBe(false);
    });

    it('should sort participants by progress', () => {
      const participants: ParticipantDefiDTO[] = [
        {
          id: 1,
          utilisateurId: 1,
          utilisateurNom: 'User 1',
          progressionActuelle: 500,
          statut: StatutParticipation.ACCEPTE,
          dateInscription: new Date(),
          pourcentageProgression: 50
        },
        {
          id: 2,
          utilisateurId: 2,
          utilisateurNom: 'User 2',
          progressionActuelle: 800,
          statut: StatutParticipation.ACCEPTE,
          dateInscription: new Date(),
          pourcentageProgression: 80
        },
        {
          id: 3,
          utilisateurId: 3,
          utilisateurNom: 'User 3',
          progressionActuelle: 300,
          statut: StatutParticipation.ACCEPTE,
          dateInscription: new Date(),
          pourcentageProgression: 30
        }
      ];

      const sorted = service.sortParticipantsByProgress(participants);
      expect(sorted[0].progressionActuelle).toBe(800);
      expect(sorted[1].progressionActuelle).toBe(500);
      expect(sorted[2].progressionActuelle).toBe(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', () => {
      const defiId = 1;
      
      service.getDefiById(defiId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${defiId}`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });
});