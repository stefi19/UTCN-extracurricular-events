# UTCN Extracurricular Events Platform — Frontend

Angular 18 single-page application that consumes the UTCN Events REST API.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22.x |
| npm | 10.x |
| Angular CLI | 18.x (`npm install -g @angular/cli`) |

The backend must be running on `http://localhost:8080` before using the app.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
ng serve

# 3. Open in browser
# http://localhost:4200
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `ng serve` | Start development server on port 4200 with live reload |
| `ng build` | Production build output to `dist/` |
| `ng test --watch=false --browsers=ChromeHeadless` | Run all unit tests once (CI mode) |
| `ng test` | Run unit tests in watch mode |

---

## Project Structure

```
src/
├── app/
│   ├── components/            # Shared, reusable UI components
│   │   ├── confirmation-dialog/   # Modal for destructive-action confirmation
│   │   ├── event-card/            # Event summary card with hover animation
│   │   ├── loading-spinner/       # CSS spinner shown during data fetch
│   │   ├── navbar/                # Role-aware navigation bar
│   │   └── toast-container/       # Notification overlay (subscribes to ToastService)
│   │
│   ├── guards/                # Route guards
│   │   ├── auth.guard.ts          # Redirects unauthenticated users to /login
│   │   └── role.guard.ts          # Restricts routes by user role
│   │
│   ├── interceptors/          # HTTP interceptors
│   │   └── auth.interceptor.ts    # Attaches Bearer token to every outgoing request
│   │
│   ├── models/
│   │   └── models.ts              # Shared TypeScript interfaces (User, Event, Registration, …)
│   │
│   ├── pages/                 # Lazy-loaded route components
│   │   ├── admin-dashboard/       # ADMIN overview with navigation to management pages
│   │   ├── category-manage/       # ADMIN: inline CRUD for event categories
│   │   ├── department-manage/     # ADMIN: inline CRUD for departments
│   │   ├── event-detail/          # Event detail with register / cancel / edit / delete
│   │   ├── event-form/            # Shared create & edit form for events
│   │   ├── event-list/            # Public event listing with role-based "New Event" button
│   │   ├── login/                 # Reactive login form with inline validation
│   │   ├── my-registrations/      # STUDENT: personal registrations list with cancel
│   │   ├── register/              # Reactive registration form with role selection
│   │   └── user-manage/           # ADMIN: user list grouped by role
│   │
│   ├── services/              # Injectable services (all providedIn: 'root')
│   │   ├── auth.service.ts        # Login / register / logout, BehaviorSubject state
│   │   ├── category.service.ts    # CRUD for /api/categories
│   │   ├── department.service.ts  # CRUD for /api/departments
│   │   ├── event.service.ts       # CRUD for /api/events
│   │   ├── registration.service.ts# GET / POST / DELETE for /api/registrations
│   │   ├── toast.service.ts       # In-memory notification queue with auto-dismiss
│   │   └── user.service.ts        # GET /api/users (ADMIN only)
│   │
│   ├── app.component.ts       # App shell: <navbar> + <router-outlet> + <toast-container>
│   ├── app.config.ts          # Root providers: router, HttpClient + auth interceptor
│   └── app.routes.ts          # Full lazy-loaded route table with guard declarations
│
├── environments/
│   └── environment.ts         # { apiUrl: 'http://localhost:8080' }
│
└── styles.css                 # Global CSS variables, reset, utility classes, animations
```

---

## Design Patterns

### Decorator — `auth.interceptor.ts`
Every outgoing HTTP request is *decorated* with an `Authorization: Bearer <token>` header before it reaches the server. Implemented as a functional `HttpInterceptorFn` registered in `app.config.ts` via `withInterceptors([authInterceptor])`.

### Observer — `auth.service.ts`
`AuthService` holds a `BehaviorSubject<User | null>` that multicasts the currently logged-in user to all subscribers. The `NavbarComponent` and route guards subscribe to `currentUser$` to reactively update the UI and access decisions whenever authentication state changes.

### Singleton — all services (`providedIn: 'root'`)
Every service (`AuthService`, `EventService`, `ToastService`, etc.) is declared with `providedIn: 'root'`, which means Angular creates exactly one instance shared across the entire application.

### Strategy — `role.guard.ts`
The guard reads `route.data['roles']` — an array declared on each protected route in `app.routes.ts` — and delegates the access decision to whichever role list the route defines. Adding a new role-restricted route requires no changes to the guard itself.

---

## Authentication Flow

1. User submits login form → `AuthService.login()` posts to `/auth/login`.
2. On success, the JWT token is stored in `localStorage` under `auth_token` and the `User` object under `auth_user`.
3. `authInterceptor` reads `auth_token` from `localStorage` and adds it to every subsequent request.
4. On app start, `AuthService` constructor calls `loadUserFromStorage()` to restore the session.
5. `AuthService.logout()` clears `localStorage`, resets the `BehaviorSubject` to `null`, and navigates to `/login`.

---

## Role-Based Access

| Role | Accessible pages |
|------|-----------------|
| Guest (unauthenticated) | `/login`, `/register` |
| `STUDENT` | Event list, Event detail (register/cancel), My Registrations |
| `ORGANIZER` | All student pages + Create / Edit / Delete own events |
| `ADMIN` | All organizer pages + Admin Dashboard, Category Manage, Department Manage, User Manage |

---

## Running Tests

```bash
# CI mode (single run, headless Chrome)
ng test --watch=false --browsers=ChromeHeadless

# Watch mode (re-runs on file save)
ng test
```

Test coverage:

| File | Tests |
|------|-------|
| `auth.service.spec.ts` | 9 — login, register, logout, localStorage restore |
| `auth.interceptor.spec.ts` | 4 — token injection, unauthenticated passthrough |
| `auth.guard.spec.ts` | 3 — allow authenticated, redirect unauthenticated |
| `role.guard.spec.ts` | 7 — ADMIN/ORGANIZER/STUDENT role combinations |
| `event-list.component.spec.ts` | 9 — loading state, empty state, role-based button, error handling |
| `event-form.component.spec.ts` | 11 — create mode, edit mode, validation, service calls |
| `app.component.spec.ts` | 2 — app creation, router outlet presence |

