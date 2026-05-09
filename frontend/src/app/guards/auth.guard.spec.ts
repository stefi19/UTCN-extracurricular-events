import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/models';

const buildMockRoute = () => ({} as ActivatedRouteSnapshot);
const buildMockState = () => ({ url: '/events' } as RouterStateSnapshot);

describe('authGuard', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['currentUser']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree', 'navigate']);

    mockRouter.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow navigation when user is authenticated', () => {
    const authenticatedUser: User = {
      id: 1,
      email: 'student@utcn.ro',
      firstName: 'Maria',
      lastName: 'Popescu',
      role: 'STUDENT',
      departmentId: null
    };
    mockAuthService.currentUser.and.returnValue(authenticatedUser);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(buildMockRoute(), buildMockState())
    );

    expect(result).toBeTrue();
    expect(mockRouter.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /login when user is NOT authenticated', () => {
    mockAuthService.currentUser.and.returnValue(null);

    TestBed.runInInjectionContext(() =>
      authGuard(buildMockRoute(), buildMockState())
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should return a UrlTree (not true) when unauthenticated', () => {
    mockAuthService.currentUser.and.returnValue(null);

    const result = TestBed.runInInjectionContext(() =>
      authGuard(buildMockRoute(), buildMockState())
    );

    expect(result).not.toBeTrue();
  });
});
