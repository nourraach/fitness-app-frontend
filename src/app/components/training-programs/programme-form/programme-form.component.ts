import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreerProgrammeRequest, MessageType } from '../../../models/programme.model';

@Component({
  selector: 'app-programme-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="programmeForm" (ngSubmit)="onSubmit()" class="programme-form">
      <div class="form-group">
        <label for="clientId">ID Client</label>
        <input 
          type="number" 
          id="clientId" 
          formControlName="clientId" 
          class="form-control"
          placeholder="Entrez l'ID du client">
      </div>

      <div class="form-group">
        <label for="nom">Nom du programme</label>
        <input 
          type="text" 
          id="nom" 
          formControlName="nom" 
          class="form-control"
          placeholder="Entrez le nom du programme">
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea 
          id="description" 
          formControlName="description" 
          class="form-control"
          rows="3"
          placeholder="Description du programme (optionnel)">
        </textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="dateDebut">Date de début</label>
          <input 
            type="date" 
            id="dateDebut" 
            formControlName="dateDebut" 
            class="form-control">
        </div>

        <div class="form-group">
          <label for="dateFin">Date de fin</label>
          <input 
            type="date" 
            id="dateFin" 
            formControlName="dateFin" 
            class="form-control">
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          Annuler
        </button>
        <button type="submit" class="btn btn-primary" [disabled]="!programmeForm.valid">
          Créer le programme
        </button>
      </div>
    </form>
  `,
  styles: [`
    .programme-form {
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #374151;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      background: #d1d5db;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class ProgrammeFormComponent {
  @Output() programmeCreated = new EventEmitter<CreerProgrammeRequest>();
  @Output() cancelled = new EventEmitter<void>();

  programmeForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.programmeForm = this.fb.group({
      clientId: ['', [Validators.required, Validators.min(1)]],
      nom: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.programmeForm.valid) {
      const formValue = this.programmeForm.value;
      const request: CreerProgrammeRequest = {
        clientId: formValue.clientId,
        nom: formValue.nom,
        description: formValue.description || undefined,
        dateDebut: formValue.dateDebut,
        dateFin: formValue.dateFin,
        exercices: [] // Empty for now, can be added later
      };
      
      this.programmeCreated.emit(request);
      this.programmeForm.reset();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.programmeForm.reset();
  }
}