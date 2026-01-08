import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FoodRecognitionResult, NutritionalInfo } from '../models/food-recognition.model';

@Injectable({ providedIn: 'root' })
export class FoodRecognitionService {
  private apiUrl = 'http://localhost:8095/api/food-recognition';

  constructor(private http: HttpClient) {}

  recognizeFood(imageFile: File): Observable<FoodRecognitionResult> {
    const formData = new FormData();
    formData.append('image', imageFile);
    return this.http.post<FoodRecognitionResult>(`${this.apiUrl}/recognize`, formData);
  }

  searchFoods(query: string): Observable<FoodRecognitionResult[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<FoodRecognitionResult[]>(`${this.apiUrl}/suggestions`, { params });
  }

  manualEntry(foodName: string, quantity?: number): Observable<FoodRecognitionResult> {
    return this.http.post<FoodRecognitionResult>(`${this.apiUrl}/manual`, { foodName, quantity });
  }

  getNutritionalInfo(alimentId: number, quantity?: number): Observable<NutritionalInfo> {
    let params = new HttpParams();
    if (quantity) params = params.set('quantity', quantity.toString());
    return this.http.get<NutritionalInfo>(`${this.apiUrl}/nutritional-info/${alimentId}`, { params });
  }
}
