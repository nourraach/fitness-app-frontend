import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private BASE_URL = "http://localhost:8095/";

  constructor(private http: HttpClient) {}

  // Test endpoint to check if backend is accessible
  testConnection(): Observable<any> {
    return this.http.get(this.BASE_URL + 'api/test', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Test login without captcha for debugging
  testLogin(): Observable<any> {
    const testCredentials = {
      email: 'admin@gmail.com',
      password: 'adminadmin'
    };
    
    return this.http.post(this.BASE_URL + 'login', testCredentials, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}