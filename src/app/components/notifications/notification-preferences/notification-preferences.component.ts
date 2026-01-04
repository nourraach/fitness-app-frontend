import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../services/notification.service';

interface NotificationPreferences {
  id?: number;
  userId: number;
  rappelEntrainement: boolean;
  heureRappelEntrainement: string;
  rappelNutrition: boolean;
  heureRappelNutrition: string;
  rappelPesee: boolean;
  heureRappelPesee: string;
  joursPesee: string[];
  motivationnel: boolean;
  frequenceMotivationnel: number;
  silenceDebut: string;
  silenceFin: string;
  notifications: boolean;
  email: boolean;
  push: boolean;
}

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="notification-preferences">
      <div class="preferences-header">
        <h2>Préférences de Notifications</h2>
        <p>Personnalisez vos notifications pour rester motivé et atteindre vos objectifs</p>
      </div>

      <form [formGroup]="preferencesForm" (ngSubmit)="onSubmit()" class="preferences-form">
        <!-- Canaux de notification -->
        <div class="form-section">
          <h3>Canaux de notification</h3>
          <div class="checkbox-group">
            <label class="checkbox-item">
              <input type="checkbox" formControlName="notifications">
              <span class="checkmark"></span>
              <div class="label-content">
                <span class="label-title">Notifications dans l'app</span>
                <span class="label-description">Recevoir des notifications directement dans l'application</span>
              </div>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" formControlName="email">
              <span class="checkmark"></span>
              <div class="label-content">
                <span class="label-title">Notifications par email</span>
                <span class="label-description">Recevoir des rappels et résumés par email</span>
              </div>
            </label>
            
            <label class="checkbox-item">
              <input type="checkbox" formControlName="push">
              <span class="checkmark"></span>
              <div class="label-content">
                <span class="label-title">Notifications push</span>
                <span class="label-description">Recevoir des notifications sur votre appareil</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Rappels d'entraînement -->
        <div class="form-section">
          <h3>Rappels d'entraînement</h3>
          <label class="checkbox-item">
            <input type="checkbox" formControlName="rappelEntrainement">
            <span class="checkmark"></span>
            <span class="label-title">Activer les rappels d'entraînement</span>
          </label>
          
          <div class="time-input" *ngIf="preferencesForm.get('rappelEntrainement')?.value">
            <label for="heureRappelEntrainement">Heure du rappel:</label>
            <input 
              type="time" 
              id="heureRappelEntrainement"
              formControlName="heureRappelEntrainement"
              class="form-control">
          </div>
        </div>

        <!-- Rappels nutrition -->
        <div class="form-section">
          <h3>Rappels nutrition</h3>
          <label class="checkbox-item">
            <input type="checkbox" formControlName="rappelNutrition">
            <span class="checkmark"></span>
            <span class="label-title">Activer les rappels nutrition</span>
          </label>
          
          <div class="time-input" *ngIf="preferencesForm.get('rappelNutrition')?.value">
            <label for="heureRappelNutrition">Heure du rappel:</label>
            <input 
              type="time" 
              id="heureRappelNutrition"
              formControlName="heureRappelNutrition"
              class="form-control">
          </div>
        </div>

        <!-- Rappels pesée -->
        <div class="form-section">
          <h3>Rappels de pesée</h3>
          <label class="checkbox-item">
            <input type="checkbox" formControlName="rappelPesee">
            <span class="checkmark"></span>
            <span class="label-title">Activer les rappels de pesée</span>
          </label>
          
          <div class="pesee-config" *ngIf="preferencesForm.get('rappelPesee')?.value">
            <div class="time-input">
              <label for="heureRappelPesee">Heure du rappel:</label>
              <input 
                type="time" 
                id="heureRappelPesee"
                formControlName="heureRappelPesee"
                class="form-control">
            </div>
            
            <div class="days-selector">
              <label>Jours de la semaine:</label>
              <div class="days-grid">
                <label class="day-item" *ngFor="let day of weekDays">
                  <input 
                    type="checkbox" 
                    [value]="day.value"
                    (change)="onDayChange($event, day.value)">
                  <span class="day-label">{{ day.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages motivationnels -->
        <div class="form-section">
          <h3>Messages motivationnels</h3>
          <label class="checkbox-item">
            <input type="checkbox" formControlName="motivationnel">
            <span class="checkmark"></span>
            <span class="label-title">Recevoir des messages motivationnels</span>
          </label>
          
          <div class="frequency-input" *ngIf="preferencesForm.get('motivationnel')?.value">
            <label for="frequenceMotivationnel">Fréquence par semaine (0-10):</label>
            <input 
              type="range" 
              id="frequenceMotivationnel"
              formControlName="frequenceMotivationnel"
              min="0" 
              max="10" 
              class="range-input">
            <span class="range-value">{{ preferencesForm.get('frequenceMotivationnel')?.value }} messages/semaine</span>
          </div>
        </div>

        <!-- Heures de silence -->
        <div class="form-section">
          <h3>Heures de silence</h3>
          <p class="section-description">Définissez une période pendant laquelle vous ne souhaitez pas recevoir de notifications</p>
          
          <div class="silence-inputs">
            <div class="time-input">
              <label for="silenceDebut">Début:</label>
              <input 
                type="time" 
                id="silenceDebut"
                formControlName="silenceDebut"
                class="form-control">
            </div>
            
            <div class="time-input">
              <label for="silenceFin">Fin:</label>
              <input 
                type="time" 
                id="silenceFin"
                formControlName="silenceFin"
                class="form-control">
            </div>
          </div>
          
          <div class="validation-error" *ngIf="hasTimeValidationError()">
            L'heure de début doit être antérieure à l'heure de fin
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="resetToDefaults()">
            Valeurs par défaut
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="preferencesForm.invalid || isLoading">
            <span *ngIf="isLoading" class="spinner"></span>
            {{ isLoading ? 'Sauvegarde...' : 'Sauvegarder' }}
          </button>
        </div>
      </form>

      <!-- Messages de feedback -->
      <div class="alert alert-success" *ngIf="successMessage">
        <i class="fas fa-check-circle"></i>
        {{ successMessage }}
      </div>
      
      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fas fa-exclamation-triangle"></i>
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .notification-preferences {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .preferences-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .preferences-header h2 {
      color: #333;
      margin-bottom: 10px;
    }

    .preferences-header p {
      color: #666;
      font-size: 16px;
    }

    .preferences-form {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      padding: 30px;
    }

    .form-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .form-section:last-of-type {
      border-bottom: none;
    }

    .form-section h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.2rem;
    }

    .section-description {
      color: #666;
      font-size: 14px;
      margin-bottom: 15px;
    }

    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .checkbox-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      padding: 10px;
      border-radius: 6px;
      transition: background-color 0.2s;
    }

    .checkbox-item:hover {
      background-color: #f8f9fa;
    }

    .checkbox-item input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #ddd;
      border-radius: 4px;
      position: relative;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .checkbox-item input[type="checkbox"]:checked + .checkmark {
      background-color: #007bff;
      border-color: #007bff;
    }

    .checkbox-item input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .label-content {
      display: flex;
      flex-direction: column;
    }

    .label-title {
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
    }

    .label-description {
      font-size: 13px;
      color: #666;
    }

    .time-input, .frequency-input {
      margin-top: 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .time-input label, .frequency-input label {
      font-weight: 500;
      color: #333;
      min-width: 120px;
    }

    .form-control {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    .range-input {
      flex: 1;
      min-width: 200px;
    }

    .range-value {
      font-weight: 500;
      color: #007bff;
      min-width: 120px;
    }

    .pesee-config {
      margin-top: 15px;
    }

    .days-selector {
      margin-top: 15px;
    }

    .days-selector label {
      font-weight: 500;
      color: #333;
      margin-bottom: 10px;
      display: block;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 10px;
    }

    .day-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .day-item:hover {
      background-color: #f8f9fa;
    }

    .day-item input[type="checkbox"]:checked + .day-label {
      color: #007bff;
      font-weight: 500;
    }

    .silence-inputs {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .validation-error {
      color: #dc3545;
      font-size: 14px;
      margin-top: 10px;
      padding: 8px;
      background-color: #f8d7da;
      border-radius: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      gap: 15px;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-primary:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #545b62;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert {
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    @media (max-width: 768px) {
      .notification-preferences {
        padding: 15px;
      }

      .preferences-form {
        padding: 20px;
      }

      .form-actions {
        flex-direction: column;
      }

      .silence-inputs {
        flex-direction: column;
      }

      .days-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  preferencesForm: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  
  weekDays = [
    { label: 'Lun', value: 'MONDAY' },
    { label: 'Mar', value: 'TUESDAY' },
    { label: 'Mer', value: 'WEDNESDAY' },
    { label: 'Jeu', value: 'THURSDAY' },
    { label: 'Ven', value: 'FRIDAY' },
    { label: 'Sam', value: 'SATURDAY' },
    { label: 'Dim', value: 'SUNDAY' }
  ];

  selectedDays: string[] = [];

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService
  ) {
    this.preferencesForm = this.createForm();
  }

  ngOnInit() {
    this.loadPreferences();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      rappelEntrainement: [false],
      heureRappelEntrainement: ['09:00', [this.timeValidator]],
      rappelNutrition: [false],
      heureRappelNutrition: ['12:00', [this.timeValidator]],
      rappelPesee: [false],
      heureRappelPesee: ['08:00', [this.timeValidator]],
      motivationnel: [false],
      frequenceMotivationnel: [3, [Validators.min(0), Validators.max(10)]],
      silenceDebut: ['22:00', [this.timeValidator]],
      silenceFin: ['07:00', [this.timeValidator]],
      notifications: [true],
      email: [false],
      push: [false]
    });
  }

  private timeValidator(control: any) {
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (control.value && !timePattern.test(control.value)) {
      return { invalidTime: true };
    }
    return null;
  }

  loadPreferences() {
    this.isLoading = true;
    this.notificationService.getPreferences().subscribe({
      next: (preferences) => {
        if (preferences) {
          this.preferencesForm.patchValue(preferences);
          this.selectedDays = preferences.joursPesee || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des préférences';
        this.isLoading = false;
        console.error('Error loading preferences:', error);
      }
    });
  }

  onDayChange(event: any, day: string) {
    if (event.target.checked) {
      this.selectedDays.push(day);
    } else {
      this.selectedDays = this.selectedDays.filter(d => d !== day);
    }
  }

  hasTimeValidationError(): boolean {
    const silenceDebut = this.preferencesForm.get('silenceDebut')?.value;
    const silenceFin = this.preferencesForm.get('silenceFin')?.value;
    
    if (silenceDebut && silenceFin) {
      return silenceDebut >= silenceFin;
    }
    return false;
  }

  onSubmit() {
    if (this.preferencesForm.valid && !this.hasTimeValidationError()) {
      this.isLoading = true;
      this.clearMessages();

      const preferences: NotificationPreferences = {
        ...this.preferencesForm.value,
        joursPesee: this.selectedDays,
        userId: 1 // This should come from auth service
      };

      this.notificationService.savePreferences(preferences).subscribe({
        next: () => {
          this.successMessage = 'Préférences sauvegardées avec succès !';
          this.isLoading = false;
          setTimeout(() => this.clearMessages(), 3000);
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la sauvegarde des préférences';
          this.isLoading = false;
          console.error('Error saving preferences:', error);
        }
      });
    }
  }

  resetToDefaults() {
    this.preferencesForm.reset({
      rappelEntrainement: false,
      heureRappelEntrainement: '09:00',
      rappelNutrition: false,
      heureRappelNutrition: '12:00',
      rappelPesee: false,
      heureRappelPesee: '08:00',
      motivationnel: false,
      frequenceMotivationnel: 3,
      silenceDebut: '22:00',
      silenceFin: '07:00',
      notifications: true,
      email: false,
      push: false
    });
    this.selectedDays = [];
    this.clearMessages();
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }
}