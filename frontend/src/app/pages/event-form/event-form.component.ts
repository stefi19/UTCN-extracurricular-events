import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../services/event.service';
import { CategoryService } from '../../services/category.service';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../services/toast.service';
import { Category, Department } from '../../models/models';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-container">
      <a routerLink="/events" class="back-link">← Back to Events</a>
      <div class="form-card">
        <h2 class="form-title">{{ isEditMode ? 'Edit Event' : 'Create New Event' }}</h2>

        <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label for="title">Title *</label>
            <input id="title" type="text" formControlName="title" placeholder="Event title" [class.invalid]="isFieldInvalid('title')" />
            <span class="error-message" *ngIf="isFieldInvalid('title')">
              <ng-container *ngIf="eventForm.get('title')?.errors?.['required']">Title is required.</ng-container>
              <ng-container *ngIf="eventForm.get('title')?.errors?.['maxlength']">Title must be at most 255 characters.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="description">Description *</label>
            <textarea id="description" formControlName="description" rows="4" placeholder="Event description" [class.invalid]="isFieldInvalid('description')"></textarea>
            <span class="error-message" *ngIf="isFieldInvalid('description')">Description is required.</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="date">Date *</label>
              <input id="date" type="date" formControlName="date" [class.invalid]="isFieldInvalid('date')" />
              <span class="error-message" *ngIf="isFieldInvalid('date')">Date is required.</span>
            </div>

            <div class="form-group">
              <label for="location">Location</label>
              <input id="location" type="text" formControlName="location" placeholder="Room 101, Building A" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" formControlName="category" [class.invalid]="isFieldInvalid('category')">
                <option value="" disabled>Select a category</option>
                <option *ngFor="let cat of categories" [value]="cat.name">{{ cat.name }}</option>
              </select>
              <span class="error-message" *ngIf="isFieldInvalid('category')">Category is required.</span>
            </div>

            <div class="form-group">
              <label for="department">Department *</label>
              <select id="department" formControlName="department" [class.invalid]="isFieldInvalid('department')">
                <option value="" disabled>Select a department</option>
                <option *ngFor="let dept of departments" [value]="dept.name">{{ dept.name }}</option>
              </select>
              <span class="error-message" *ngIf="isFieldInvalid('department')">Department is required.</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startTime">Start Time</label>
              <input id="startTime" type="datetime-local" formControlName="startTime" />
            </div>

            <div class="form-group">
              <label for="endTime">End Time</label>
              <input id="endTime" type="datetime-local" formControlName="endTime" />
            </div>
          </div>

          <div class="form-group">
            <label for="maxParticipants">Max Participants</label>
            <input id="maxParticipants" type="number" formControlName="maxParticipants" placeholder="Leave blank for unlimited" min="1" [class.invalid]="isFieldInvalid('maxParticipants')" />
            <span class="error-message" *ngIf="isFieldInvalid('maxParticipants')">Must be a positive number.</span>
          </div>

          <span class="error-message server-error" *ngIf="serverError">{{ serverError }}</span>

          <div class="form-actions">
            <a routerLink="/events" class="btn-secondary">Cancel</a>
            <button type="submit" class="btn-primary" [disabled]="isLoading">
              {{ isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Event') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrl: './event-form.component.css'
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  categories: Category[] = [];
  departments: Department[] = [];
  isEditMode = false;
  isLoading = false;
  serverError = '';
  private eventId: number | null = null;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly categoryService: CategoryService,
    private readonly departmentService: DepartmentService,
    private readonly toastService: ToastService
  ) {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.required],
      date: ['', Validators.required],
      location: [''],
      category: ['', Validators.required],
      department: ['', Validators.required],
      startTime: [''],
      endTime: [''],
      maxParticipants: [null, Validators.min(1)]
    });
  }

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((categoryList) => (this.categories = categoryList));
    this.departmentService.getAll().subscribe((departmentList) => (this.departments = departmentList));

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.eventId = Number(idParam);
      this.eventService.getById(this.eventId).subscribe({
        next: (fetchedEvent) => {
          this.eventForm.patchValue({
            title: fetchedEvent.title,
            description: fetchedEvent.description,
            date: fetchedEvent.date,
            location: fetchedEvent.location ?? '',
            category: fetchedEvent.category,
            department: fetchedEvent.department,
            startTime: fetchedEvent.startTime ?? '',
            endTime: fetchedEvent.endTime ?? '',
            maxParticipants: fetchedEvent.maxParticipants ?? null
          });
        },
        error: () => this.router.navigate(['/events'])
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.eventForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';
    const formValue = this.eventForm.value;

    const payload = {
      ...formValue,
      startTime: formValue.startTime || null,
      endTime: formValue.endTime || null,
      location: formValue.location || null,
      maxParticipants: formValue.maxParticipants || null
    };

    const request$ = this.isEditMode && this.eventId !== null
      ? this.eventService.update(this.eventId, payload)
      : this.eventService.create(payload);

    request$.subscribe({
      next: (savedEvent) => {
        this.toastService.success(this.isEditMode ? 'Event updated!' : 'Event created!');
        this.router.navigate(['/events', savedEvent.id]);
      },
      error: (err) => {
        this.serverError = err.error?.error ?? 'Failed to save event.';
        this.isLoading = false;
      }
    });
  }
}
