import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from './auth.service';
import { AuthResponse, User } from '../models/models';

const mockUser: User = {
  id: 1,
  email: 'student@utcn.ro',
  firstName: 'Maria',
  lastName: 'Popescu',
  role: 'STUDENT',
  departmentId: null
};

const mockAuthResponse: AuthResponse = {
  token: 'fake-jwt-token-abc123',
  user: mockUser
};

function setupTestBed(): void {
  TestBed.configureTestingModule({
    providers: [
      AuthService,
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([])
    ]
  });
}

describe('AuthService', () => {
  let authService: AuthService;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    setupTestBed();
    authService = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(authService).toBeTruthy();
  });

  it('should return null from currentUser() when no user is stored', () => {
    expect(authService.currentUser()).toBeNull();
  });

  it('should store token in localStorage on successful login', fakeAsync(() => {
    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    expect(localStorage.getItem('auth_token')).toBe('fake-jwt-token-abc123');
  }));

  it('should store user in localStorage on successful login', fakeAsync(() => {
    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    const storedUser = JSON.parse(localStorage.getItem('auth_user') ?? 'null');
    expect(storedUser?.email).toBe('student@utcn.ro');
    expect(storedUser?.role).toBe('STUDENT');
  }));

  it('should emit the user through currentUser$ on successful login', fakeAsync(() => {
    let emittedUser = authService.currentUser();

    authService.currentUser$.subscribe((user) => {
      emittedUser = user;
    });

    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    expect(emittedUser?.email).toBe('student@utcn.ro');
  }));

  it('should update currentUser() snapshot after login', fakeAsync(() => {
    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    expect(authService.currentUser()?.firstName).toBe('Maria');
  }));

  it('should clear localStorage on logout', fakeAsync(() => {
    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    authService.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  }));

  it('should reset BehaviorSubject to null on logout', fakeAsync(() => {
    authService.login('student@utcn.ro', 'Secret123!').subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/login');
    request.flush(mockAuthResponse);
    tick();

    authService.logout();

    expect(authService.currentUser()).toBeNull();
  }));

  it('should store token and emit user on successful register', fakeAsync(() => {
    const payload = {
      email: 'organizer@utcn.ro',
      password: 'Secret123!',
      firstName: 'Ion',
      lastName: 'Pop',
      role: 'ORGANIZER'
    };

    authService.register(payload).subscribe();

    const request = httpTestingController.expectOne('http://localhost:8080/auth/register');
    const registerResponse: AuthResponse = {
      token: 'register-token',
      user: { ...mockUser, email: 'organizer@utcn.ro', role: 'ORGANIZER' }
    };
    request.flush(registerResponse);
    tick();

    expect(localStorage.getItem('auth_token')).toBe('register-token');
    expect(authService.currentUser()?.role).toBe('ORGANIZER');
  }));
});

describe('AuthService — restore from localStorage on startup', () => {
  afterEach(() => localStorage.clear());

  it('should restore user from localStorage when token and user are stored', () => {
    localStorage.setItem('auth_token', 'restored-token');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    setupTestBed();
    const freshService = TestBed.inject(AuthService);

    expect(freshService.currentUser()?.email).toBe('student@utcn.ro');
    expect(freshService.currentUser()?.role).toBe('STUDENT');
  });
});
