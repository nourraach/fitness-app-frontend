import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PasswordService {

  private baseUrl = 'http://localhost:8095/password';

  constructor(private http: HttpClient) {}

 forgotPassword(email: string): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/forgot`,
    null,
    {
      params: { email },
      responseType: 'text'  // <-- important pour recevoir du texte
    }
  );
}

resetPassword(token: string, newPassword: string): Observable<any> {
  return this.http.post(
    `${this.baseUrl}/reset`,
    null,
    {
      params: { token, newPassword },
      responseType: 'text'
    }
  );
}

}
