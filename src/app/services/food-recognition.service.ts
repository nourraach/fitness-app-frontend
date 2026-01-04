import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from '../service/storage-service.service';
import { 
  FoodRecognitionResultDTO,
  NutritionalInfoDTO,
  FoodSuggestionDTO,
  ManualFoodEntryDTO,
  FoodRecognitionState
} from '../models/food-recognition.model';

@Injectable({
  providedIn: 'root'
})
export class FoodRecognitionService {
  private apiUrl = 'http://localhost:8095/api/food-recognition';
  private stateSubject = new BehaviorSubject<FoodRecognitionState>({
    isUploading: false,
    isRecognizing: false,
    suggestions: []
  });
  
  public state$ = this.stateSubject.asObservable();

  constructor(
    private http: HttpClient, 
    private storageService: StorageService
  ) {}

  recognizeFood(imageFile: File): Observable<FoodRecognitionResultDTO> {
    this.updateState({ isUploading: true, isRecognizing: true });
    
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<FoodRecognitionResultDTO>(`${this.apiUrl}/recognize`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  getFoodSuggestions(query: string): Observable<FoodSuggestionDTO[]> {
    return this.http.get<FoodSuggestionDTO[]>(`${this.apiUrl}/suggestions`, {
      headers: this.getHeaders(),
      params: { query }
    });
  }

  addManualFood(foodEntry: ManualFoodEntryDTO): Observable<FoodRecognitionResultDTO> {
    return this.http.post<FoodRecognitionResultDTO>(`${this.apiUrl}/manual`, foodEntry, {
      headers: this.getHeaders()
    });
  }

  getNutritionalInfo(alimentId: number, quantity: number): Observable<NutritionalInfoDTO> {
    return this.http.get<NutritionalInfoDTO>(`${this.apiUrl}/nutrition/${alimentId}`, {
      headers: this.getHeaders(),
      params: { quantity: quantity.toString() }
    });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  // Validation des formats de fichier
  validateFileFormat(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.type.toLowerCase());
  }

  // Validation de la taille de fichier (5MB max)
  validateFileSize(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  }

  // Compression d'image
  compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Gestion de l'état
  updateState(updates: Partial<FoodRecognitionState>): void {
    const currentState = this.stateSubject.value;
    this.stateSubject.next({ ...currentState, ...updates });
  }

  resetState(): void {
    this.stateSubject.next({
      isUploading: false,
      isRecognizing: false,
      suggestions: []
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: pas de Content-Type pour FormData
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}