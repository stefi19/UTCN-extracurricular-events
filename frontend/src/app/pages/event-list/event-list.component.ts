import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { Event } from '../../models/models';
import { EventCardComponent } from '../../components/event-card/event-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EventCardComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">Extracurricular Events</h2>
        <a
          *ngIf="canCreateEvent"
          routerLink="/events/new"
          class="btn-primary"
        >+ New Event</a>
      </div>

      <app-loading-spinner *ngIf="isLoading" />

      <div *ngIf="!isLoading && events.length === 0" class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No events yet</h3>
        <p>Check back later for upcoming events.</p>
      </div>

      <div *ngIf="!isLoading && events.length > 0" class="event-grid">
        @for (event of events; track event.id) {
          <app-event-card [event]="event" />
        }
      </div>
    </div>
  `,
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  isLoading = true;
  canCreateEvent = false;

  constructor(
    private readonly eventService: EventService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    this.canCreateEvent = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

    this.eventService.getAll().subscribe({
      next: (eventList) => {
        this.events = eventList;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
