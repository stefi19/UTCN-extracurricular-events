import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../services/toast.service';
import { Department } from '../../models/models';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-department-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ConfirmationDialogComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">Manage Departments</h2>
        <a routerLink="/admin" class="back-link">← Back to Dashboard</a>
      </div>

      <div class="create-form-card">
        <h3>{{ editingDepartment ? 'Edit Department' : 'Add New Department' }}</h3>
        <form [formGroup]="departmentForm" (ngSubmit)="onSubmit()" novalidate class="inline-form">
          <div class="form-group">
            <input
              type="text"
              formControlName="name"
              placeholder="Department name"
              [class.invalid]="isNameInvalid()"
            />
            <span class="error-message" *ngIf="isNameInvalid()">
              <ng-container *ngIf="departmentForm.get('name')?.errors?.['required']">Name is required.</ng-container>
              <ng-container *ngIf="departmentForm.get('name')?.errors?.['maxlength']">Max 255 characters.</ng-container>
            </span>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Saving...' : (editingDepartment ? 'Update' : 'Add') }}
            </button>
            <button type="button" class="btn-secondary" *ngIf="editingDepartment" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <app-loading-spinner *ngIf="isLoadingList" />

      <div *ngIf="!isLoadingList && departments.length === 0" class="empty-state">
        <p>No departments yet. Add one above.</p>
      </div>

      <div *ngIf="!isLoadingList && departments.length > 0" class="item-list">
        @for (department of departments; track department.id) {
          <div class="item-row">
            <span class="item-name">{{ department.name }}</span>
            <div class="item-actions">
              <button class="btn-edit" (click)="startEdit(department)">Edit</button>
              <button class="btn-danger" (click)="pendingDeleteId = department.id; showDeleteDialog = true">Delete</button>
            </div>
          </div>
        }
      </div>

      <app-confirmation-dialog
        *ngIf="showDeleteDialog"
        title="Delete Department"
        message="Are you sure you want to delete this department?"
        confirmLabel="Delete"
        (confirmed)="deleteDepartment()"
        (cancelled)="showDeleteDialog = false"
      />
    </div>
  `,
  styleUrl: './department-manage.component.css'
})
export class DepartmentManageComponent implements OnInit {
  departments: Department[] = [];
  departmentForm: FormGroup;
  editingDepartment: Department | null = null;
  isLoading = false;
  isLoadingList = true;
  showDeleteDialog = false;
  pendingDeleteId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly departmentService: DepartmentService,
    private readonly toastService: ToastService
  ) {
    this.departmentForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  private loadDepartments(): void {
    this.isLoadingList = true;
    this.departmentService.getAll().subscribe({
      next: (departmentList) => {
        this.departments = departmentList;
        this.isLoadingList = false;
      },
      error: () => {
        this.isLoadingList = false;
      }
    });
  }

  isNameInvalid(): boolean {
    const control = this.departmentForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  startEdit(department: Department): void {
    this.editingDepartment = department;
    this.departmentForm.patchValue({ name: department.name });
  }

  cancelEdit(): void {
    this.editingDepartment = null;
    this.departmentForm.reset();
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { name } = this.departmentForm.value;

    const request$ = this.editingDepartment
      ? this.departmentService.update(this.editingDepartment.id, name)
      : this.departmentService.create(name);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.editingDepartment ? 'Department updated!' : 'Department created!');
        this.departmentForm.reset();
        this.editingDepartment = null;
        this.isLoading = false;
        this.loadDepartments();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Operation failed.');
        this.isLoading = false;
      }
    });
  }

  deleteDepartment(): void {
    if (this.pendingDeleteId === null) return;
    this.showDeleteDialog = false;
    const deleteId = this.pendingDeleteId;
    this.pendingDeleteId = null;

    this.departmentService.delete(deleteId).subscribe({
      next: () => {
        this.departments = this.departments.filter((dept) => dept.id !== deleteId);
        this.toastService.success('Department deleted.');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Failed to delete department.');
      }
    });
  }
}
