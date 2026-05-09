import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Department } from '../models/models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly apiUrl = `${environment.apiUrl}/api/departments`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }

  getById(departmentId: number): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${departmentId}`);
  }

  create(name: string): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, { name });
  }

  update(departmentId: number, name: string): Observable<Department> {
    return this.http.put<Department>(`${this.apiUrl}/${departmentId}`, { name });
  }

  delete(departmentId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${departmentId}`);
  }
}
