import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EventService } from '../../services/event.service';
import { RegistrationService } from '../../services/registration.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Event, Registration, User } from '../../models/models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, ConfirmationDialogComponent],
  template: `
    <div class="page-container">
      <a routerLink="/events" class="back-link">← Back to Events</a>

      <app-loading-spinner *ngIf="isLoading" />

      <div *ngIf="!isLoading && event" class="detail-card">
        <div class="detail-header">
          <span class="category-badge">{{ event.category }}</span>
          <div class="detail-actions" *ngIf="canEditOrDelete">
            <a [routerLink]="['/events', event.id, 'edit']" class="btn-secondary">Edit</a>
            <button class="btn-danger" (click)="showDeleteDialog = true">Delete</button>
          </div>
        </div>

        <h1 class="event-title">{{ event.title }}</h1>

        <div class="meta-row">
          <span class="meta-item">📅 {{ event.date }}</span>
          <span class="meta-item" *ngIf="event.location">📍 {{ event.location }}</span>
          <span class="meta-item">🏛️ {{ event.department }}</span>
          <span class="meta-item" *ngIf="event.maxParticipants">👥 Max {{ event.maxParticipants }}</span>
          <span class="meta-item" *ngIf="event.startTime">🕐 {{ event.startTime | date:'short' }}</span>
        </div>

        <div class="description-section">
          <h3>About this event</h3>
          <p>{{ event.description }}</p>
        </div>

        <!-- STUDENT registration controls -->
        <div class="registration-section" *ngIf="currentUser?.role === 'STUDENT'">
          <button
            *ngIf="!existingRegistration"
            class="btn-register"
            [disabled]="isRegistering"
            (click)="registerForEvent()"
          >
            {{ isRegistering ? 'Registering...' : 'Register for this Event' }}
          </button>

          <div *ngIf="existingRegistration" class="registered-info">
            <span class="registered-badge">✅ Registered</span>
            <button
              class="btn-cancel"
              [disabled]="isCancelling"
              (click)="showCancelDialog = true"
            >
              {{ isCancelling ? 'Cancelling...' : 'Cancel Registration' }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="!isLoading && !event" class="empty-state">
        <p>Event not found.</p>
        <a routerLink="/events">Back to events</a>
      </div>

      <app-confirmation-dialog
        *ngIf="showDeleteDialog"
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmLabel="Delete"
        (confirmed)="deleteEvent()"
        (cancelled)="showDeleteDialog = false"
      />

      <app-confirmation-dialog
        *ngIf="showCancelDialog"
        title="Cancel Registration"
        message="Are you sure you want to cancel your registration for this event?"
        confirmLabel="Cancel Registration"
        (confirmed)="cancelRegistration()"
        (cancelled)="showCancelDialog = false"
      />
    </div>
  `,
  styleUrl: './event-detail.component.css'
})
export class EventDetailComponent implements OnInit {
  event: Event | null = null;
  currentUser: User | null = null;
  existingRegistration: Registration | null = null;
  isLoading = true;
  isRegistering = false;
  isCancelling = false;
  showDeleteDialog = false;
  showCancelDialog = false;

  get canEditOrDelete(): boolean {
    return this.currentUser?.role === 'ADMIN' ||
      (this.currentUser?.role === 'ORGANIZER' && this.event?.organizerId === this.currentUser.id);
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly eventService: EventService,
    private readonly registrationService: RegistrationService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    const eventId = Number(this.route.snapshot.paramMap.get('id'));

    this.eventService.getById(eventId).subscribe({
      next: (fetchedEvent) => {
        this.event = fetchedEvent;
        this.isLoading = false;
        if (this.currentUser?.role === 'STUDENT') {
          this.loadMyRegistrations(eventId);
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadMyRegistrations(eventId: number): void {
    this.registrationService.getMyRegistrations().subscribe({
      next: (registrationList) => {
        this.existingRegistration = registrationList.find((reg) => reg.eventId === eventId) ?? null;
      }
    });
  }

  registerForEvent(): void {
    if (!this.event) return;
    this.isRegistering = true;
    this.registrationService.registerForEvent(this.event.id).subscribe({
      next: (registration) => {
        this.existingRegistration = registration;
        this.isRegistering = false;
        this.toastService.success('Successfully registered for the event!');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Registration failed.');
        this.isRegistering = false;
      }
    });
  }

  cancelRegistration(): void {
    if (!this.existingRegistration) return;
    this.showCancelDialog = false;
    this.isCancelling = true;
    this.registrationService.cancelRegistration(this.existingRegistration.id).subscribe({
      next: () => {
        this.existingRegistration = null;
        this.isCancelling = false;
        this.toastService.success('Registration cancelled successfully.');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Cancellation failed.');
        this.isCancelling = false;
      }
    });
  }

  deleteEvent(): void {
    if (!this.event) return;
    this.showDeleteDialog = false;
    this.eventService.delete(this.event.id).subscribe({
      next: () => {
        this.toastService.success('Event deleted.');
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Failed to delete event.');
      }
    });
  }
}
