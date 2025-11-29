import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Programme } from '../models/programme.model';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeService {
  private apiUrl = 'http://localhost:8080/api/programmes';

  constructor(private http: HttpClient) { }

  getAllProgrammes(): Observable<Programme[]> {
    return this.http.get<Programme[]>(this.apiUrl);
  }

  getProgrammeById(id: number): Observable<Programme> {
    return this.http.get<Programme>(`${this.apiUrl}/${id}`);
  }

  createProgramme(programme: Programme): Observable<Programme> {
    return this.http.post<Programme>(this.apiUrl, programme);
  }

  updateProgramme(id: number, programme: Programme): Observable<Programme> {
    return this.http.put<Programme>(`${this.apiUrl}/${id}`, programme);
  }

  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getProgrammesByNiveau(niveau: string): Observable<Programme[]> {
    return this.http.get<Programme[]>(`${this.apiUrl}/niveau/${niveau}`);
  }

  getProgrammesByObjectif(objectif: string): Observable<Programme[]> {
    return this.http.get<Programme[]>(`${this.apiUrl}/objectif/${objectif}`);
  }
}
