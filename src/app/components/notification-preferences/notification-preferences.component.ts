import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { Subject, takeUntil, debounceTime } from 'rxjs';

import { NotificationPreferencesService } from '../../services/notification-preferences.service';
import { NotificationPreferences, NotificationPreferencesUpdateRequest } from '../../models/notification-preferences.model';
import { DayOfWeek, DayOfWeekUtils } from '../../enums/notification.enums';
import { JwtService } from '../../service/jwt.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    CheckboxModule,
    SliderModule,
    CardModule,
    DividerModule,
    ProgressSpinnerModule,
    ToastModule,
    InputNumberModule
  ],
  providers: [MessageService],
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
  preferencesForm!: FormGroup;
  isLoading = false;
  isSaving = false;
  hasLoadingError = false;
  errorMessage = '';
  
  // Données pour les jours de la semaine
  readonly daysOfWeek = DayOfWeekUtils.ALL_DAYS;
  readonly dayLabels = DayOfWeekUtils;

  // Options pour les sélecteurs d'heures
  readonly timeOptions = this.generateTimeOptions();

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private preferencesService: NotificationPreferencesService,
    private jwtService: JwtService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadPreferences();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire réactif avec tous les contrôles
   * Note: Pas de validateurs stricts sur les champs de temps - le backend gère la validation
   */
  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      // Paramètres généraux
      generalSettings: this.fb.group({
        notifications: [true],
        email: [true],
        push: [true]
      }),

      // Rappels de repas - pas de validateurs sur les temps
      mealSettings: this.fb.group({
        mealRemindersEnabled: [true],
        breakfastTime: ['08:00'],
        lunchTime: ['12:30'],
        dinnerTime: ['19:00'],
        snackRemindersEnabled: [false],
        morningSnackTime: ['10:00'],
        afternoonSnackTime: ['16:00']
      }),

      // Rappels d'entraînement - pas de validateurs sur les temps
      workoutSettings: this.fb.group({
        workoutRemindersEnabled: [true],
        defaultWorkoutTime: ['18:00'],
        activeDays: this.createActiveDaysFormArray()
      }),

      // Messages motivationnels
      motivationalSettings: this.fb.group({
        motivationalMessagesEnabled: [true],
        motivationalFrequency: [3]
      }),

      // Heures de silence - pas de validateurs sur les temps
      quietTimeSettings: this.fb.group({
        quietTimeEnabled: [true],
        quietTimeStart: ['22:00'],
        quietTimeEnd: ['07:00']
      }),

      // Paramètres avancés
      advancedSettings: this.fb.group({
        maxNotificationsPerDay: [10],
        hydrationRemindersEnabled: [true],
        hydrationIntervalMinutes: [120],
        weatherBasedSuggestionsEnabled: [true],
        timezoneAdaptationEnabled: [true]
      })
    });
  }

  /**
   * Crée le FormArray pour les jours actifs
   */
  private createActiveDaysFormArray(): FormArray {
    const daysArray = this.fb.array([]);
    
    this.daysOfWeek.forEach(() => {
      daysArray.push(this.fb.control(true)); // Tous les jours activés par défaut
    });

    return daysArray;
  }

  /**
   * Charge les préférences depuis l'API
   */
  private loadPreferences(): void {
    this.isLoading = true;
    this.hasLoadingError = false;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.preferencesService.getUserPreferences()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (preferences) => {
          this.populateForm(preferences);
          this.isLoading = false;
          this.cdr.markForCheck();
          console.log('✅ Préférences chargées:', preferences);
        },
        error: (error) => {
          this.hasLoadingError = true;
          this.errorMessage = error.message || 'Erreur lors du chargement des préférences';
          this.isLoading = false;
          this.cdr.markForCheck();
          console.error('❌ Erreur chargement préférences:', error);
          
          this.showErrorMessage('Erreur lors du chargement des préférences');
        }
      });
  }

  /**
   * Remplit le formulaire avec les préférences chargées
   */
  private populateForm(preferences: NotificationPreferences): void {
    // Paramètres généraux
    this.preferencesForm.get('generalSettings')?.patchValue({
      notifications: preferences.notifications,
      email: preferences.email,
      push: preferences.push
    });

    // Rappels de repas
    this.preferencesForm.get('mealSettings')?.patchValue({
      mealRemindersEnabled: preferences.mealRemindersEnabled,
      breakfastTime: preferences.breakfastTime,
      lunchTime: preferences.lunchTime,
      dinnerTime: preferences.dinnerTime,
      snackRemindersEnabled: preferences.snackRemindersEnabled,
      morningSnackTime: preferences.morningSnackTime,
      afternoonSnackTime: preferences.afternoonSnackTime
    });

    // Rappels d'entraînement
    this.preferencesForm.get('workoutSettings')?.patchValue({
      workoutRemindersEnabled: preferences.workoutRemindersEnabled,
      defaultWorkoutTime: preferences.defaultWorkoutTime
    });

    // Jours actifs
    const activeDaysArray = this.preferencesForm.get('workoutSettings.activeDays') as FormArray;
    this.daysOfWeek.forEach((day, index) => {
      const isActive = preferences.activeDays.includes(day);
      activeDaysArray.at(index).setValue(isActive);
    });

    // Messages motivationnels
    this.preferencesForm.get('motivationalSettings')?.patchValue({
      motivationalMessagesEnabled: preferences.motivationalMessagesEnabled,
      motivationalFrequency: preferences.motivationalFrequency
    });

    // Heures de silence
    this.preferencesForm.get('quietTimeSettings')?.patchValue({
      quietTimeEnabled: preferences.quietTimeEnabled,
      quietTimeStart: preferences.quietTimeStart,
      quietTimeEnd: preferences.quietTimeEnd
    });

    // Paramètres avancés
    this.preferencesForm.get('advancedSettings')?.patchValue({
      maxNotificationsPerDay: preferences.maxNotificationsPerDay,
      hydrationRemindersEnabled: preferences.hydrationRemindersEnabled,
      hydrationIntervalMinutes: preferences.hydrationIntervalMinutes,
      weatherBasedSuggestionsEnabled: preferences.weatherBasedSuggestionsEnabled,
      timezoneAdaptationEnabled: preferences.timezoneAdaptationEnabled
    });
  }

  /**
   * Configure la validation en temps réel avec debouncing
   */
  private setupFormValidation(): void {
    // Validation pour s'assurer qu'au moins un jour est sélectionné
    const activeDaysArray = this.preferencesForm.get('workoutSettings.activeDays') as FormArray;
    activeDaysArray.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(values => {
        const hasAtLeastOneDay = values.some((value: boolean) => value);
        if (!hasAtLeastOneDay) {
          activeDaysArray.setErrors({ 'noActiveDays': true });
        } else {
          activeDaysArray.setErrors(null);
        }
      });
  }

  /**
   * Sauvegarde les préférences
   */
  onSave(): void {
    console.log('🔄 Save button clicked');
    console.log('📋 Form valid:', this.preferencesForm.valid);
    console.log('📋 Form value:', this.preferencesForm.value);
    console.log('📋 Form errors:', this.getFormErrors());

    if (this.preferencesForm.invalid) {
      this.markFormGroupTouched(this.preferencesForm);
      this.showErrorMessage('Veuillez corriger les erreurs dans le formulaire');
      console.log('❌ Form is invalid, showing errors');
      return;
    }

    console.log('✅ Form is valid, proceeding with save');
    this.isSaving = true;
    this.cdr.markForCheck();
    const updateRequest = this.buildUpdateRequest();

    console.log('📤 Sending update request:', updateRequest);

    this.preferencesService.updatePreferences(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedPreferences) => {
          this.isSaving = false;
          this.cdr.markForCheck();
          this.showSuccessMessage('Préférences sauvegardées avec succès !');
          console.log('✅ Préférences sauvegardées:', updatedPreferences);
        },
        error: (error) => {
          this.isSaving = false;
          this.cdr.markForCheck();
          const errorMsg = error.message || 'Erreur lors de la sauvegarde';
          this.showErrorMessage(errorMsg);
          console.error('❌ Erreur sauvegarde:', error);
        }
      });
  }

  /**
   * Obtient toutes les erreurs du formulaire pour le débogage
   */
  private getFormErrors(): any {
    let formErrors: any = {};

    Object.keys(this.preferencesForm.controls).forEach(key => {
      const controlErrors = this.preferencesForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }

      // Check nested form groups
      const control = this.preferencesForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach(nestedKey => {
          const nestedControlErrors = control.get(nestedKey)?.errors;
          if (nestedControlErrors) {
            if (!formErrors[key]) formErrors[key] = {};
            formErrors[key][nestedKey] = nestedControlErrors;
          }
        });
      }
    });

    return formErrors;
  }

  /**
   * Construit la requête de mise à jour à partir du formulaire
   */
  private buildUpdateRequest(): NotificationPreferencesUpdateRequest {
    const formValue = this.preferencesForm.value;
    
    // Construire la liste des jours actifs
    const activeDays: string[] = [];
    formValue.workoutSettings.activeDays.forEach((isActive: boolean, index: number) => {
      if (isActive) {
        activeDays.push(this.daysOfWeek[index]);
      }
    });

    return {
      // Paramètres généraux
      notifications: formValue.generalSettings.notifications,
      email: formValue.generalSettings.email,
      push: formValue.generalSettings.push,

      // Rappels de repas
      mealRemindersEnabled: formValue.mealSettings.mealRemindersEnabled,
      breakfastTime: formValue.mealSettings.breakfastTime,
      lunchTime: formValue.mealSettings.lunchTime,
      dinnerTime: formValue.mealSettings.dinnerTime,
      snackRemindersEnabled: formValue.mealSettings.snackRemindersEnabled,
      morningSnackTime: formValue.mealSettings.morningSnackTime,
      afternoonSnackTime: formValue.mealSettings.afternoonSnackTime,

      // Rappels d'entraînement
      workoutRemindersEnabled: formValue.workoutSettings.workoutRemindersEnabled,
      defaultWorkoutTime: formValue.workoutSettings.defaultWorkoutTime,
      activeDays: activeDays,

      // Messages motivationnels
      motivationalMessagesEnabled: formValue.motivationalSettings.motivationalMessagesEnabled,
      motivationalFrequency: formValue.motivationalSettings.motivationalFrequency,

      // Heures de silence
      quietTimeEnabled: formValue.quietTimeSettings.quietTimeEnabled,
      quietTimeStart: formValue.quietTimeSettings.quietTimeStart,
      quietTimeEnd: formValue.quietTimeSettings.quietTimeEnd,

      // Paramètres avancés
      maxNotificationsPerDay: formValue.advancedSettings.maxNotificationsPerDay,
      hydrationRemindersEnabled: formValue.advancedSettings.hydrationRemindersEnabled,
      hydrationIntervalMinutes: formValue.advancedSettings.hydrationIntervalMinutes,
      weatherBasedSuggestionsEnabled: formValue.advancedSettings.weatherBasedSuggestionsEnabled,
      timezoneAdaptationEnabled: formValue.advancedSettings.timezoneAdaptationEnabled
    };
  }

  /**
   * Marque tous les champs du formulaire comme touchés pour afficher les erreurs
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: message,
      life: 5000
    });
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: message,
      life: 8000
    });
  }

  /**
   * Test method to verify API connectivity
   */
  testApiCall(): void {
    console.log('🧪 Testing API call...');
    
    // Debug JWT first
    this.jwtService.debugJWT();
    
    const userId = this.jwtService.getUserId();
    console.log('🔍 Current userId:', userId);
    
    if (!userId) {
      console.error('❌ No userId found in JWT token');
      this.showErrorMessage('Utilisateur non connecté');
      return;
    }

    // Test backend connectivity first
    this.testBackendConnectivity().then(() => {
      // Test the API call directly
      console.log('📡 Making API request to:', `http://localhost:8095/api/notifications/preferences/by-user-id?userId=${userId}`);
      
      this.preferencesService.getUserPreferences()
        .subscribe({
          next: (preferences) => {
            console.log('✅ API call successful:', preferences);
            this.showSuccessMessage(`API call successful! Loaded preferences for user ${userId}`);
            
            // Validate response structure
            this.validateResponseStructure(preferences);
          },
          error: (error) => {
            console.error('❌ API call failed:', error);
            this.showErrorMessage(`API call failed: ${error.message}`);
            
            // Provide specific error guidance
            this.provideErrorGuidance(error);
          }
        });
    }).catch((connectivityError) => {
      console.error('❌ Backend connectivity test failed:', connectivityError);
      this.showErrorMessage('Backend server not reachable. Check if it\'s running on http://localhost:8095');
    });
  }

  /**
   * Force save for testing purposes
   */
  forceSave(): void {
    console.log('🔧 Force save triggered');
    this.onSave();
  }

  /**
   * Test backend connectivity
   */
  private async testBackendConnectivity(): Promise<void> {
    console.log('🔍 Testing backend connectivity...');
    
    try {
      const response = await fetch('http://localhost:8095/actuator/health');
      if (response.ok) {
        const health = await response.json();
        console.log('✅ Backend is reachable:', health);
      } else {
        throw new Error(`Backend responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Backend connectivity failed:', error);
      throw error;
    }
  }

  /**
   * Validate the response structure
   */
  private validateResponseStructure(preferences: NotificationPreferences): void {
    console.log('🔍 Validating response structure...');
    
    const expectedFields = [
      'notifications', 'email', 'push', 'mealRemindersEnabled',
      'breakfastTime', 'lunchTime', 'dinnerTime', 'workoutRemindersEnabled',
      'defaultWorkoutTime', 'motivationalMessagesEnabled', 'activeDays'
    ];
    
    const missingFields = expectedFields.filter(field => !(field in preferences));
    
    if (missingFields.length === 0) {
      console.log('✅ All expected fields are present');
      this.showSuccessMessage('Response structure validation passed!');
    } else {
      console.warn('⚠️ Missing fields:', missingFields);
      this.showErrorMessage(`Missing fields in response: ${missingFields.join(', ')}`);
    }
    
    // Log field types for debugging
    console.log('📋 Field types:');
    expectedFields.forEach(field => {
      if (field in preferences) {
        console.log(`  ${field}: ${typeof (preferences as any)[field]} = ${(preferences as any)[field]}`);
      }
    });
  }

  /**
   * Provide specific error guidance based on error type
   */
  private provideErrorGuidance(error: any): void {
    console.log('🔍 Analyzing error for guidance...');
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.log('💡 Guidance: Authentication error - JWT token may be invalid or expired');
      this.showErrorMessage('Authentication failed. Please log in again.');
    } else if (error.message?.includes('404') || error.message?.includes('Not Found')) {
      console.log('💡 Guidance: Endpoint not found - check if backend API is properly configured');
      this.showErrorMessage('API endpoint not found. Check backend configuration.');
    } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
      console.log('💡 Guidance: Server error - check backend logs');
      this.showErrorMessage('Server error. Check backend logs for details.');
    } else if (error.message?.includes('fetch') || error.message?.includes('Network')) {
      console.log('💡 Guidance: Network error - check if backend is running');
      this.showErrorMessage('Network error. Ensure backend server is running on http://localhost:8095');
    } else {
      console.log('💡 Guidance: Unknown error type');
      console.log('📋 Full error object:', error);
    }
  }

  /**
   * Recharge les préférences depuis l'API
   */
  onReload(): void {
    this.loadPreferences();
  }

  /**
   * Obtient le FormArray des jours actifs
   */
  get activeDaysArray(): FormArray {
    return this.preferencesForm.get('workoutSettings.activeDays') as FormArray;
  }

  /**
   * Obtient le label français pour un jour
   */
  getDayLabel(day: DayOfWeek): string {
    return DayOfWeekUtils.toFrench(day);
  }

  /**
   * Obtient le label court français pour un jour
   */
  getDayShortLabel(day: DayOfWeek): string {
    return DayOfWeekUtils.toFrenchShort(day);
  }

  /**
   * Vérifie si les contrôles de collation doivent être désactivés
   */
  get areSnackControlsDisabled(): boolean {
    return !this.preferencesForm.get('mealSettings.snackRemindersEnabled')?.value;
  }

  /**
   * Vérifie si le formulaire peut être sauvegardé
   */
  get canSave(): boolean {
    // Always allow save if form is not currently saving or loading
    // We'll handle validation in the onSave method
    return !this.isSaving && !this.isLoading;
  }

  /**
   * Vérifie si le formulaire est valide pour l'affichage
   */
  get isFormValid(): boolean {
    return this.preferencesForm.valid;
  }

  /**
   * Génère les options de temps pour les dropdowns (de 00:00 à 23:30 par intervalles de 30 min)
   */
  private generateTimeOptions(): { label: string; value: string }[] {
    const options: { label: string; value: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        const time = `${h}:${m}`;
        options.push({ label: time, value: time });
      }
    }
    return options;
  }
}