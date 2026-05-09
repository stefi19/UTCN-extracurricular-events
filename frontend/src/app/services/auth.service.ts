import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { User, AuthResponse } from '../models/models';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Observer pattern: BehaviorSubject exposes the current user as a reactive
 * stream that any component can subscribe to without tight coupling.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  /** Returns the current user snapshot (for guards). */
  currentUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  register(payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, payload).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response) => this.storeSession(response))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private loadUserFromStorage(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser) as User;
    } catch {
      return null;
    }
  }
}
