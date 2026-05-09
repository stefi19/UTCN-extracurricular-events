import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { User } from '../../models/models';

const AUTH_ROUTES = ['/login', '/register'];

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" *ngIf="currentUser && !isAuthPage">
      <div class="navbar-brand">
        <a routerLink="/events" class="brand-link">UTCN Events</a>
      </div>

      <div class="navbar-links">
        <a routerLink="/events" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Events</a>

        <a
          *ngIf="currentUser.role === 'STUDENT'"
          routerLink="/my-registrations"
          routerLinkActive="active"
        >My Registrations</a>

        <a
          *ngIf="currentUser.role === 'ORGANIZER' || currentUser.role === 'ADMIN'"
          routerLink="/events/new"
          routerLinkActive="active"
        >Create Event</a>

        <a
          *ngIf="currentUser.role === 'ADMIN'"
          routerLink="/admin"
          routerLinkActive="active"
        >Admin</a>
      </div>

      <div class="navbar-user">
        <span class="user-name">{{ currentUser.firstName }} {{ currentUser.lastName }}</span>
        <span class="role-badge" [class]="'role-' + currentUser.role.toLowerCase()">
          {{ currentUser.role }}
        </span>
        <button class="btn-logout" (click)="logout()">Sign out</button>
      </div>
    </nav>
  `,
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isAuthPage = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        const navEnd = event as NavigationEnd;
        this.isAuthPage = AUTH_ROUTES.some((route) => navEnd.urlAfterRedirects.startsWith(route));
      });

    this.isAuthPage = AUTH_ROUTES.some((route) => this.router.url.startsWith(route));
  }

  logout(): void {
    this.authService.logout();
  }
}
