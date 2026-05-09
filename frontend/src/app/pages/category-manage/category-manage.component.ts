import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CategoryService } from '../../services/category.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/models';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-category-manage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ConfirmationDialogComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">Manage Categories</h2>
        <a routerLink="/admin" class="back-link">← Back to Dashboard</a>
      </div>

      <div class="create-form-card">
        <h3>{{ editingCategory ? 'Edit Category' : 'Add New Category' }}</h3>
        <form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" novalidate class="inline-form">
          <div class="form-group">
            <input
              type="text"
              formControlName="name"
              placeholder="Category name"
              [class.invalid]="isNameInvalid()"
            />
            <span class="error-message" *ngIf="isNameInvalid()">
              <ng-container *ngIf="categoryForm.get('name')?.errors?.['required']">Name is required.</ng-container>
              <ng-container *ngIf="categoryForm.get('name')?.errors?.['maxlength']">Max 255 characters.</ng-container>
            </span>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Saving...' : (editingCategory ? 'Update' : 'Add') }}
            </button>
            <button type="button" class="btn-secondary" *ngIf="editingCategory" (click)="cancelEdit()">Cancel</button>
          </div>
        </form>
      </div>

      <app-loading-spinner *ngIf="isLoadingList" />

      <div *ngIf="!isLoadingList && categories.length === 0" class="empty-state">
        <p>No categories yet. Add one above.</p>
      </div>

      <div *ngIf="!isLoadingList && categories.length > 0" class="item-list">
        @for (category of categories; track category.id) {
          <div class="item-row">
            <span class="item-name">{{ category.name }}</span>
            <div class="item-actions">
              <button class="btn-edit" (click)="startEdit(category)">Edit</button>
              <button class="btn-danger" (click)="pendingDeleteId = category.id; showDeleteDialog = true">Delete</button>
            </div>
          </div>
        }
      </div>

      <app-confirmation-dialog
        *ngIf="showDeleteDialog"
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        confirmLabel="Delete"
        (confirmed)="deleteCategory()"
        (cancelled)="showDeleteDialog = false"
      />
    </div>
  `,
  styleUrl: './category-manage.component.css'
})
export class CategoryManageComponent implements OnInit {
  categories: Category[] = [];
  categoryForm: FormGroup;
  editingCategory: Category | null = null;
  isLoading = false;
  isLoadingList = true;
  showDeleteDialog = false;
  pendingDeleteId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly categoryService: CategoryService,
    private readonly toastService: ToastService
  ) {
    this.categoryForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.isLoadingList = true;
    this.categoryService.getAll().subscribe({
      next: (categoryList) => {
        this.categories = categoryList;
        this.isLoadingList = false;
      },
      error: () => {
        this.isLoadingList = false;
      }
    });
  }

  isNameInvalid(): boolean {
    const control = this.categoryForm.get('name');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  startEdit(category: Category): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({ name: category.name });
  }

  cancelEdit(): void {
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { name } = this.categoryForm.value;

    const request$ = this.editingCategory
      ? this.categoryService.update(this.editingCategory.id, name)
      : this.categoryService.create(name);

    request$.subscribe({
      next: () => {
        this.toastService.success(this.editingCategory ? 'Category updated!' : 'Category created!');
        this.categoryForm.reset();
        this.editingCategory = null;
        this.isLoading = false;
        this.loadCategories();
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Operation failed.');
        this.isLoading = false;
      }
    });
  }

  deleteCategory(): void {
    if (this.pendingDeleteId === null) return;
    this.showDeleteDialog = false;
    const deleteId = this.pendingDeleteId;
    this.pendingDeleteId = null;

    this.categoryService.delete(deleteId).subscribe({
      next: () => {
        this.categories = this.categories.filter((cat) => cat.id !== deleteId);
        this.toastService.success('Category deleted.');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Failed to delete category.');
      }
    });
  }
}
