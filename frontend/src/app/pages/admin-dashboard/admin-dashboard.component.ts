import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EventService } from '../../services/event.service';
import { UserService } from '../../services/user.service';
import { CategoryService } from '../../services/category.service';
import { DepartmentService } from '../../services/department.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <h2 class="page-title">Admin Dashboard</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ totalEvents }}</div>
          <div class="stat-label">Total Events</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalUsers }}</div>
          <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalCategories }}</div>
          <div class="stat-label">Categories</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ totalDepartments }}</div>
          <div class="stat-label">Departments</div>
        </div>
      </div>

      <div class="admin-nav">
        <a routerLink="/admin/categories" class="admin-nav-card">
          <span class="nav-icon">🏷️</span>
          <h3>Manage Categories</h3>
          <p>Create, edit, and delete event categories</p>
        </a>
        <a routerLink="/admin/departments" class="admin-nav-card">
          <span class="nav-icon">🏛️</span>
          <h3>Manage Departments</h3>
          <p>Create, edit, and delete university departments</p>
        </a>
        <a routerLink="/admin/users" class="admin-nav-card">
          <span class="nav-icon">👥</span>
          <h3>Manage Users</h3>
          <p>View all users grouped by role</p>
        </a>
        <a routerLink="/events" class="admin-nav-card">
          <span class="nav-icon">📅</span>
          <h3>View All Events</h3>
          <p>Browse and manage all events</p>
        </a>
      </div>
    </div>
  `,
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  totalEvents = 0;
  totalUsers = 0;
  totalCategories = 0;
  totalDepartments = 0;

  constructor(
    private readonly eventService: EventService,
    private readonly userService: UserService,
    private readonly categoryService: CategoryService,
    private readonly departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.eventService.getAll().subscribe((events) => (this.totalEvents = events.length));
    this.userService.getAll().subscribe((users) => (this.totalUsers = users.length));
    this.categoryService.getAll().subscribe((categories) => (this.totalCategories = categories.length));
    this.departmentService.getAll().subscribe((departments) => (this.totalDepartments = departments.length));
  }
}
