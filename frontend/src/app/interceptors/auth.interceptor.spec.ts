import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';

import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpTestingController: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token is present in localStorage', () => {
    localStorage.setItem('auth_token', 'my-test-token');

    httpClient.get('/api/events').subscribe();

    const request = httpTestingController.expectOne('/api/events');
    expect(request.request.headers.has('Authorization')).toBeTrue();
    expect(request.request.headers.get('Authorization')).toBe('Bearer my-test-token');
    request.flush([]);
  });

  it('should NOT add Authorization header when no token is present', () => {
    httpClient.get('/api/events').subscribe();

    const request = httpTestingController.expectOne('/api/events');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush([]);
  });

  it('should not modify the original request object (immutability via clone)', () => {
    localStorage.setItem('auth_token', 'immutable-test-token');

    httpClient.get('/api/test').subscribe();

    const request = httpTestingController.expectOne('/api/test');
    expect(request.request.headers.get('Authorization')).toBe('Bearer immutable-test-token');
    request.flush({});
  });

  it('should pass through requests to the next handler', () => {
    localStorage.setItem('auth_token', 'pass-through-token');

    httpClient.get('/api/categories').subscribe((response) => {
      expect(response).toBeTruthy();
    });

    const request = httpTestingController.expectOne('/api/categories');
    request.flush([{ id: 1, name: 'Workshop' }]);
  });
});
