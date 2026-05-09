import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { User, UserRole } from '../models/models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/api/users`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getByRole(role: UserRole): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${role}`);
  }
}
