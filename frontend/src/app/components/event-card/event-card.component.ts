import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Event } from '../../models/models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="event-card" [routerLink]="['/events', event.id]">
      <div class="card-category-badge">{{ event.category }}</div>
      <h3 class="card-title">{{ event.title }}</h3>
      <div class="card-meta">
        <span class="meta-item">
          <span class="meta-icon">📅</span> {{ event.date }}
        </span>
        <span class="meta-item" *ngIf="event.location">
          <span class="meta-icon">📍</span> {{ event.location }}
        </span>
        <span class="meta-item">
          <span class="meta-icon">🏛️</span> {{ event.department }}
        </span>
        <span class="meta-item" *ngIf="event.maxParticipants">
          <span class="meta-icon">👥</span> Max {{ event.maxParticipants }} participants
        </span>
      </div>
    </div>
  `,
  styleUrl: './event-card.component.css'
})
export class EventCardComponent {
  @Input({ required: true }) event!: Event;
}
