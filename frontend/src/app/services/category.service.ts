import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Category } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly apiUrl = `${environment.apiUrl}/api/categories`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getById(categoryId: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${categoryId}`);
  }

  create(name: string): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, { name });
  }

  update(categoryId: number, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${categoryId}`, { name });
  }

  delete(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${categoryId}`);
  }
}
