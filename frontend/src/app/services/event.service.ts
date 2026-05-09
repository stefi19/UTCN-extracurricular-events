import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Event } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/api/events`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl);
  }

  getById(eventId: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${eventId}`);
  }

  create(payload: Partial<Event>): Observable<Event> {
    return this.http.post<Event>(this.apiUrl, payload);
  }

  update(eventId: number, payload: Partial<Event>): Observable<Event> {
    return this.http.put<Event>(`${this.apiUrl}/${eventId}`, payload);
  }

  delete(eventId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${eventId}`);
  }
}
