import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/models';

const buildMockState = () => ({ url: '/admin' } as RouterStateSnapshot);

const buildRouteWithRoles = (roles: string[]): ActivatedRouteSnapshot => {
  return { data: { roles } } as unknown as ActivatedRouteSnapshot;
};

const buildAdminUser = (): User => ({
  id: 10,
  email: 'admin@utcn.ro',
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  departmentId: null
});

const buildStudentUser = (): User => ({
  id: 2,
  email: 'student@utcn.ro',
  firstName: 'Maria',
  lastName: 'Popescu',
  role: 'STUDENT',
  departmentId: null
});

const buildOrganizerUser = (): User => ({
  id: 3,
  email: 'organizer@utcn.ro',
  firstName: 'Ion',
  lastName: 'Pop',
  role: 'ORGANIZER',
  departmentId: null
});

describe('roleGuard (Strategy pattern)', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockAuthService = jasmine.createSpyObj<AuthService>('AuthService', ['currentUser']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['createUrlTree']);
    mockRouter.createUrlTree.and.returnValue({} as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow ADMIN to access an ADMIN-only route', () => {
    mockAuthService.currentUser.and.returnValue(buildAdminUser());
    const route = buildRouteWithRoles(['ADMIN']);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(result).toBeTrue();
  });

  it('should block STUDENT from accessing an ADMIN-only route', () => {
    mockAuthService.currentUser.and.returnValue(buildStudentUser());
    const route = buildRouteWithRoles(['ADMIN']);

    TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/events']);
  });

  it('should allow ORGANIZER to access an ORGANIZER and ADMIN route', () => {
    mockAuthService.currentUser.and.returnValue(buildOrganizerUser());
    const route = buildRouteWithRoles(['ORGANIZER', 'ADMIN']);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(result).toBeTrue();
  });

  it('should allow ADMIN to access an ORGANIZER and ADMIN route', () => {
    mockAuthService.currentUser.and.returnValue(buildAdminUser());
    const route = buildRouteWithRoles(['ORGANIZER', 'ADMIN']);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(result).toBeTrue();
  });

  it('should block STUDENT from accessing an ORGANIZER and ADMIN route', () => {
    mockAuthService.currentUser.and.returnValue(buildStudentUser());
    const route = buildRouteWithRoles(['ORGANIZER', 'ADMIN']);

    TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/events']);
  });

  it('should allow STUDENT to access a STUDENT-only route', () => {
    mockAuthService.currentUser.and.returnValue(buildStudentUser());
    const route = buildRouteWithRoles(['STUDENT']);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(result).toBeTrue();
  });

  it('should redirect to /login when user is not authenticated', () => {
    mockAuthService.currentUser.and.returnValue(null);
    const route = buildRouteWithRoles(['ADMIN']);

    TestBed.runInInjectionContext(() =>
      roleGuard(route, buildMockState())
    );

    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
