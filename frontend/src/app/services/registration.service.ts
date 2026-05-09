import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Registration } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly apiUrl = `${environment.apiUrl}/api/registrations`;

  constructor(private readonly http: HttpClient) {}

  getMyRegistrations(): Observable<Registration[]> {
    return this.http.get<Registration[]>(this.apiUrl);
  }

  registerForEvent(eventId: number): Observable<Registration> {
    return this.http.post<Registration>(this.apiUrl, { eventId });
  }

  cancelRegistration(registrationId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${registrationId}`);
  }

  getEventParticipants(eventId: number): Observable<Registration[]> {
    return this.http.get<Registration[]>(`${this.apiUrl}/event/${eventId}`);
  }
}
