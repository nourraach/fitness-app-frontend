import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RapportProgres } from '../models/rapport-progres.model';

@Injectable({
  providedIn: 'root'
})
export class RapportProgresService {
  private apiUrl = 'http://localhost:8095/api/rapports';

  constructor(private http: HttpClient) {}

  genererRapport(clientId: number, dateDebut: string, dateFin: string): Observable<RapportProgres> {
    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.post<RapportProgres>(`${this.apiUrl}/generer`, null, { params });
  }

  genererRapportSemaineCourante(clientId: number): Observable<RapportProgres> {
    const params = new HttpParams().set('clientId', clientId.toString());
    return this.http.get<RapportProgres>(`${this.apiUrl}/semaine-courante`, { params });
  }

  getRapportsCoach(): Observable<RapportProgres[]> {
    return this.http.get<RapportProgres[]>(`${this.apiUrl}/coach`);
  }

  getRapportsClient(): Observable<RapportProgres[]> {
    return this.http.get<RapportProgres[]>(`${this.apiUrl}/client`);
  }

  getRapportById(id: number): Observable<RapportProgres> {
    return this.http.get<RapportProgres>(`${this.apiUrl}/${id}`);
  }
}
