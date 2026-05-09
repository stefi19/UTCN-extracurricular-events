import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventListComponent } from './event-list.component';
import { EventService } from '../../services/event.service';
import { AuthService } from '../../services/auth.service';
import { Event, User } from '../../models/models';

const mockEvents: Event[] = [
  {
    id: 1,
    title: 'Robotics Workshop',
    description: 'Build a robot',
    date: '2025-06-01',
    location: 'Lab 3',
    category: 'STEM',
    department: 'CS',
    categoryId: 1,
    startTime: null,
    endTime: null,
    maxParticipants: 20,
    organizerId: 2
  },
  {
    id: 2,
    title: 'Debate Club',
    description: 'Public speaking',
    date: '2025-06-10',
    location: 'Aula',
    category: 'Arts',
    department: 'Humanities',
    categoryId: 2,
    startTime: null,
    endTime: null,
    maxParticipants: null,
    organizerId: 3
  }
];

const studentUser: User = {
  id: 10,
  email: 'student@utcn.ro',
  firstName: 'Maria',
  lastName: 'Popescu',
  role: 'STUDENT',
  departmentId: null
};

const organizerUser: User = {
  id: 11,
  email: 'organizer@utcn.ro',
  firstName: 'Ion',
  lastName: 'Pop',
  role: 'ORGANIZER',
  departmentId: 1
};

describe('EventListComponent', () => {
  let fixture: ComponentFixture<EventListComponent>;
  let component: EventListComponent;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  function createComponent(user: User | null, events: Event[] = mockEvents): void {
    mockAuthService.currentUser.and.returnValue(user);
    mockEventService.getAll.and.returnValue(of(events));

    TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    mockEventService = jasmine.createSpyObj('EventService', ['getAll']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['currentUser']);
  });

  it('should create', () => {
    createComponent(studentUser);
    expect(component).toBeTruthy();
  });

  it('should display event cards when events are loaded', fakeAsync(() => {
    createComponent(studentUser);
    tick();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-event-card');
    expect(cards.length).toBe(2);
  }));

  it('should show the empty state when no events are returned', fakeAsync(() => {
    createComponent(studentUser, []);
    tick();
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  }));

  it('should not show empty state when events are present', fakeAsync(() => {
    createComponent(studentUser);
    tick();
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeNull();
  }));

  it('should show the loading spinner while loading', () => {
    mockAuthService.currentUser.and.returnValue(studentUser);
    mockEventService.getAll.and.returnValue(of(mockEvents));

    TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(EventListComponent);
    component = fixture.componentInstance;
    // Before detectChanges, isLoading is still true
    expect(component.isLoading).toBeTrue();
  });

  it('should hide the spinner after events load', fakeAsync(() => {
    createComponent(studentUser);
    tick();
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
  }));

  it('should NOT show "New Event" button for STUDENT role', fakeAsync(() => {
    createComponent(studentUser);
    tick();
    fixture.detectChanges();

    const newEventLink = fixture.nativeElement.querySelector('a[href="/events/new"]');
    expect(newEventLink).toBeNull();
  }));

  it('should show "New Event" button for ORGANIZER role', fakeAsync(() => {
    createComponent(organizerUser);
    tick();
    fixture.detectChanges();

    expect(component.canCreateEvent).toBeTrue();
  }));

  it('should set isLoading to false even when EventService returns an error', fakeAsync(() => {
    mockAuthService.currentUser.and.returnValue(studentUser);
    mockEventService.getAll.and.returnValue(throwError(() => new Error('Network error')));

    TestBed.configureTestingModule({
      imports: [EventListComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: AuthService, useValue: mockAuthService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });

    fixture = TestBed.createComponent(EventListComponent);
    fixture.detectChanges();
    tick();

    expect(fixture.componentInstance.isLoading).toBeFalse();
  }));
});
