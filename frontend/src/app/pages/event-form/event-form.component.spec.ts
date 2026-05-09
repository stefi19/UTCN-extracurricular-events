import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EventFormComponent } from './event-form.component';
import { EventService } from '../../services/event.service';
import { CategoryService } from '../../services/category.service';
import { DepartmentService } from '../../services/department.service';
import { ToastService } from '../../services/toast.service';
import { Event, Category, Department } from '../../models/models';

const mockCategories: Category[] = [
  { id: 1, name: 'STEM' },
  { id: 2, name: 'Arts' }
];

const mockDepartments: Department[] = [
  { id: 1, name: 'Computer Science' },
  { id: 2, name: 'Humanities' }
];

const mockEvent: Event = {
  id: 5,
  title: 'Robotics Workshop',
  description: 'Build a robot',
  date: '2025-06-01',
  location: 'Lab 3',
  category: 'STEM',
  department: 'Computer Science',
  categoryId: 1,
  startTime: null,
  endTime: null,
  maxParticipants: 20,
  organizerId: 2
};

function buildSpies() {
  const mockEventService = jasmine.createSpyObj<EventService>('EventService', ['getAll', 'getById', 'create', 'update', 'delete']);
  const mockCategoryService = jasmine.createSpyObj<CategoryService>('CategoryService', ['getAll', 'create', 'update', 'delete']);
  const mockDepartmentService = jasmine.createSpyObj<DepartmentService>('DepartmentService', ['getAll', 'create', 'update', 'delete']);
  const mockToastService = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'show']);

  mockCategoryService.getAll.and.returnValue(of(mockCategories));
  mockDepartmentService.getAll.and.returnValue(of(mockDepartments));

  return { mockEventService, mockCategoryService, mockDepartmentService, mockToastService };
}

describe('EventFormComponent — create mode', () => {
  let fixture: ComponentFixture<EventFormComponent>;
  let component: EventFormComponent;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    const spies = buildSpies();
    mockEventService = spies.mockEventService;
    mockToastService = spies.mockToastService;

    await TestBed.configureTestingModule({
      imports: [EventFormComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: CategoryService, useValue: spies.mockCategoryService },
        { provide: DepartmentService, useValue: spies.mockDepartmentService },
        { provide: ToastService, useValue: mockToastService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create in create mode', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode).toBeFalse();
  });

  it('should render "Create New Event" heading', () => {
    const heading = fixture.nativeElement.querySelector('.form-title');
    expect(heading?.textContent).toContain('Create New Event');
  });

  it('should populate category dropdown with loaded categories', () => {
    const options = fixture.nativeElement.querySelectorAll('#category option:not([disabled])');
    expect(options.length).toBe(2);
    expect(options[0].textContent.trim()).toBe('STEM');
  });

  it('should populate department dropdown with loaded departments', () => {
    const options = fixture.nativeElement.querySelectorAll('#department option:not([disabled])');
    expect(options.length).toBe(2);
    expect(options[0].textContent.trim()).toBe('Computer Science');
  });

  it('should mark required fields as touched on invalid submit', () => {
    const submitBtn = fixture.nativeElement.querySelector('button[type="submit"]');
    submitBtn.click();
    fixture.detectChanges();

    expect(component.eventForm.get('title')?.touched).toBeTrue();
    expect(mockEventService.create).not.toHaveBeenCalled();
  });

  it('should call EventService.create with correct payload on valid submit', fakeAsync(() => {
    const savedEvent = { ...mockEvent, id: 99 };
    mockEventService.create.and.returnValue(of(savedEvent));

    component.eventForm.setValue({
      title: 'Robotics Workshop',
      description: 'Build a robot',
      date: '2025-06-01',
      location: 'Lab 3',
      category: 'STEM',
      department: 'Computer Science',
      startTime: '',
      endTime: '',
      maxParticipants: null
    });

    component.onSubmit();
    tick();

    expect(mockEventService.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Robotics Workshop', category: 'STEM' })
    );
    expect(mockToastService.success).toHaveBeenCalledWith('Event created!');
    expect(router.navigate).toHaveBeenCalledWith(['/events', 99]);
  }));

  it('should display server error message when creation fails', fakeAsync(() => {
    mockEventService.create.and.returnValue(throwError(() => ({ error: { error: 'Duplicate title' } })));

    component.eventForm.setValue({
      title: 'Robotics Workshop',
      description: 'Build a robot',
      date: '2025-06-01',
      location: '',
      category: 'STEM',
      department: 'Computer Science',
      startTime: '',
      endTime: '',
      maxParticipants: null
    });

    component.onSubmit();
    tick();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.server-error');
    expect(errorEl?.textContent).toContain('Duplicate title');
  }));
});

describe('EventFormComponent — edit mode', () => {
  let fixture: ComponentFixture<EventFormComponent>;
  let component: EventFormComponent;
  let mockEventService: jasmine.SpyObj<EventService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  beforeEach(async () => {
    const spies = buildSpies();
    mockEventService = spies.mockEventService;
    mockToastService = spies.mockToastService;
    mockEventService.getById.and.returnValue(of(mockEvent));
    mockEventService.update.and.returnValue(of({ ...mockEvent, title: 'Updated Title' }));

    await TestBed.configureTestingModule({
      imports: [EventFormComponent],
      providers: [
        { provide: EventService, useValue: mockEventService },
        { provide: CategoryService, useValue: spies.mockCategoryService },
        { provide: DepartmentService, useValue: spies.mockDepartmentService },
        { provide: ToastService, useValue: mockToastService },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should be in edit mode when route has id param', () => {
    expect(component.isEditMode).toBeTrue();
  });

  it('should fetch the event by id and patch the form', fakeAsync(() => {
    tick();
    expect(mockEventService.getById).toHaveBeenCalledWith(5);
    expect(component.eventForm.get('title')?.value).toBe('Robotics Workshop');
  }));

  it('should render "Edit Event" heading', fakeAsync(() => {
    tick();
    fixture.detectChanges();
    const heading = fixture.nativeElement.querySelector('.form-title');
    expect(heading?.textContent).toContain('Edit Event');
  }));

  it('should call EventService.update on submit in edit mode', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    component.onSubmit();
    tick();

    expect(mockEventService.update).toHaveBeenCalledWith(5, jasmine.any(Object));
    expect(mockToastService.success).toHaveBeenCalledWith('Event updated!');
  }));
});
