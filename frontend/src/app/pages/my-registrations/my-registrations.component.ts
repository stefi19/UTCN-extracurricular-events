import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { RegistrationService } from '../../services/registration.service';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { Registration, Event } from '../../models/models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

interface RegistrationWithEvent {
  registration: Registration;
  event: Event | null;
}

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, ConfirmationDialogComponent],
  template: `
    <div class="page-container">
      <h2 class="page-title">My Registrations</h2>

      <app-loading-spinner *ngIf="isLoading" />

      <div *ngIf="!isLoading && items.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No registrations yet</h3>
        <p>Browse events and register for ones you're interested in.</p>
        <a routerLink="/events" class="btn-primary">Browse Events</a>
      </div>

      <div *ngIf="!isLoading && items.length > 0" class="registration-list">
        @for (item of items; track item.registration.id) {
          <div class="registration-card" [class.cancelled]="item.registration.status === 'CANCELLED'">
            <div class="reg-info">
              <h3 class="reg-event-title">
                <a [routerLink]="['/events', item.registration.eventId]">
                  {{ item.event?.title ?? 'Loading...' }}
                </a>
              </h3>
              <div class="reg-meta">
                <span *ngIf="item.event">📅 {{ item.event.date }}</span>
                <span *ngIf="item.event?.location">📍 {{ item.event?.location }}</span>
                <span>Registered: {{ item.registration.registeredAt | date:'mediumDate' }}</span>
              </div>
            </div>
            <div class="reg-actions">
              <span class="status-badge" [class]="'status-' + item.registration.status.toLowerCase()">
                {{ item.registration.status }}
              </span>
              <button
                *ngIf="item.registration.status === 'REGISTERED'"
                class="btn-cancel"
                (click)="pendingCancelId = item.registration.id; showCancelDialog = true"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      </div>

      <app-confirmation-dialog
        *ngIf="showCancelDialog"
        title="Cancel Registration"
        message="Are you sure you want to cancel this registration?"
        confirmLabel="Cancel Registration"
        (confirmed)="cancelRegistration()"
        (cancelled)="showCancelDialog = false"
      />
    </div>
  `,
  styleUrl: './my-registrations.component.css'
})
export class MyRegistrationsComponent implements OnInit {
  items: RegistrationWithEvent[] = [];
  isLoading = true;
  showCancelDialog = false;
  pendingCancelId: number | null = null;

  constructor(
    private readonly registrationService: RegistrationService,
    private readonly eventService: EventService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.registrationService.getMyRegistrations().subscribe({
      next: (registrationList) => {
        this.items = registrationList.map((registration) => ({ registration, event: null }));
        this.isLoading = false;
        this.loadEventDetails(registrationList.map((reg) => reg.eventId));
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private loadEventDetails(eventIds: number[]): void {
    const uniqueIds = [...new Set(eventIds)];
    uniqueIds.forEach((eventId) => {
      this.eventService.getById(eventId).subscribe({
        next: (fetchedEvent) => {
          this.items = this.items.map((item) =>
            item.registration.eventId === eventId ? { ...item, event: fetchedEvent } : item
          );
        }
      });
    });
  }

  cancelRegistration(): void {
    if (this.pendingCancelId === null) return;
    this.showCancelDialog = false;
    const cancelId = this.pendingCancelId;
    this.pendingCancelId = null;

    this.registrationService.cancelRegistration(cancelId).subscribe({
      next: () => {
        this.items = this.items.map((item) =>
          item.registration.id === cancelId
            ? { ...item, registration: { ...item.registration, status: 'CANCELLED' } }
            : item
        );
        this.toastService.success('Registration cancelled.');
      },
      error: (err) => {
        this.toastService.error(err.error?.error ?? 'Cancellation failed.');
      }
    });
  }
}
