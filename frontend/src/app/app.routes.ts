import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/events',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((module) => module.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((module) => module.RegisterComponent)
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/event-list/event-list.component').then((module) => module.EventListComponent)
  },
  {
    path: 'events/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/event-form/event-form.component').then((module) => module.EventFormComponent)
  },
  {
    path: 'events/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/event-detail/event-detail.component').then((module) => module.EventDetailComponent)
  },
  {
    path: 'events/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ORGANIZER', 'ADMIN'] },
    loadComponent: () =>
      import('./pages/event-form/event-form.component').then((module) => module.EventFormComponent)
  },
  {
    path: 'my-registrations',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['STUDENT'] },
    loadComponent: () =>
      import('./pages/my-registrations/my-registrations.component').then((module) => module.MyRegistrationsComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/admin-dashboard/admin-dashboard.component').then((module) => module.AdminDashboardComponent)
  },
  {
    path: 'admin/categories',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/category-manage/category-manage.component').then((module) => module.CategoryManageComponent)
  },
  {
    path: 'admin/departments',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/department-manage/department-manage.component').then((module) => module.DepartmentManageComponent)
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    loadComponent: () =>
      import('./pages/user-manage/user-manage.component').then((module) => module.UserManageComponent)
  },
  {
    path: '**',
    redirectTo: '/events'
  }
];
