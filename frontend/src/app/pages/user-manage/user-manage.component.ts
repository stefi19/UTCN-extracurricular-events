import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { UserService } from '../../services/user.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { User, UserRole } from '../../models/models';

@Component({
  selector: 'app-user-manage',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">Manage Users</h2>
        <a routerLink="/admin" class="back-link">← Back to Dashboard</a>
      </div>

      <app-loading-spinner *ngIf="isLoading" />

      <div *ngIf="!isLoading">
        <div *ngFor="let group of roleGroups" class="role-section">
          <h3 class="role-heading">
            <span class="role-badge" [class]="'role-' + group.role.toLowerCase()">{{ group.role }}</span>
            <span class="role-count">{{ group.users.length }} users</span>
          </h3>

          <div *ngIf="group.users.length === 0" class="empty-group">
            No users with this role yet.
          </div>

          <div *ngIf="group.users.length > 0" class="user-list">
            @for (user of group.users; track user.id) {
              <div class="user-row">
                <div class="user-info">
                  <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <span class="user-id">#{{ user.id }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './user-manage.component.css'
})
export class UserManageComponent implements OnInit {
  isLoading = true;
  roleGroups: { role: UserRole; users: User[] }[] = [
    { role: 'STUDENT', users: [] },
    { role: 'ORGANIZER', users: [] },
    { role: 'ADMIN', users: [] }
  ];

  constructor(private readonly userService: UserService) {}

  ngOnInit(): void {
    this.userService.getAll().subscribe({
      next: (allUsers) => {
        this.roleGroups = this.roleGroups.map((group) => ({
          ...group,
          users: allUsers.filter((user) => user.role === group.role)
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
