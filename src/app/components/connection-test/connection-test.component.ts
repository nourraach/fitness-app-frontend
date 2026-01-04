import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-connection-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h3>Test de Connexion Backend</h3>
      <button (click)="testBackendConnection()" [disabled]="testing">
        {{ testing ? 'Test en cours...' : 'Tester la connexion' }}
      </button>
      
      <div *ngIf="result" class="result" [ngClass]="{'success': result.success, 'error': !result.success}">
        <h4>Résultat:</h4>
        <pre>{{ result.message }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      margin: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }
    
    .result {
      margin-top: 15px;
      padding: 10px;
      border-radius: 4px;
    }
    
    .success {
      background-color: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    
    .error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    
    button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }
  `]
})
export class ConnectionTestComponent {
  testing = false;
  result: { success: boolean; message: string } | null = null;

  constructor(private http: HttpClient) {}

  testBackendConnection() {
    this.testing = true;
    this.result = null;

    // Test simple GET request to backend
    this.http.get('http://localhost:8095/api/test', {
      headers: { 'Content-Type': 'application/json' }
    }).subscribe({
      next: (response) => {
        this.testing = false;
        this.result = {
          success: true,
          message: `Connexion réussie!\nRéponse: ${JSON.stringify(response, null, 2)}`
        };
      },
      error: (error) => {
        this.testing = false;
        this.result = {
          success: false,
          message: `Erreur de connexion:\nStatus: ${error.status}\nMessage: ${error.message}\nURL: ${error.url}`
        };
      }
    });
  }
}