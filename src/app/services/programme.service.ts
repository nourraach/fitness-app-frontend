import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProgrammeEntrainement, CreerProgrammeRequest } from '../models/programme.model';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeService {
  private apiUrl = 'http://localhost:8080/api/programmes';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  creerProgramme(request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    return this.http.post<ProgrammeEntrainement>(this.apiUrl, request, { headers: this.getHeaders() });
  }

  getProgrammesCoach(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(`${this.apiUrl}/coach`, { headers: this.getHeaders() });
  }

  getProgrammesClient(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(`${this.apiUrl}/client`, { headers: this.getHeaders() });
  }

  getProgrammeById(id: number): Observable<ProgrammeEntrainement> {
    return this.http.get<ProgrammeEntrainement>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  modifierProgramme(id: number, request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    return this.http.put<ProgrammeEntrainement>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() });
  }

  changerStatut(id: number, statut: string): Observable<ProgrammeEntrainement> {
    return this.http.patch<ProgrammeEntrainement>(`${this.apiUrl}/${id}/statut`, { statut }, { headers: this.getHeaders() });
  }

  supprimerProgramme(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}
