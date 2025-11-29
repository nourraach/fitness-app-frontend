import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile, ImcResult, BesoinsCaloriquesResult } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = 'http://localhost:8095/api/profile';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt');
    if (!token) {
      console.error('Aucun JWT trouvé dans localStorage');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}`, { headers: this.getHeaders() });
  }

  createProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.post<UserProfile>(`${this.baseUrl}`, profile, { headers: this.getHeaders() });
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}`, profile, { headers: this.getHeaders() });
  }

  calculateImc(taille: number, poids: number): Observable<ImcResult> {
    return this.http.get<ImcResult>(`${this.baseUrl}/imc?taille=${taille}&poids=${poids}`, 
      { headers: this.getHeaders() });
  }

  calculateBesoinsCaloriques(profile: UserProfile): Observable<BesoinsCaloriquesResult> {
    return this.http.post<BesoinsCaloriquesResult>(`${this.baseUrl}/besoins-caloriques`, profile, 
      { headers: this.getHeaders() });
  }
}
