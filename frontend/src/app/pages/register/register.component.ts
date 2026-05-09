import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>UTCN Events</h1>
          <p>Create your account</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                placeholder="Maria"
                [class.invalid]="isFieldInvalid('firstName')"
              />
              <span class="error-message" *ngIf="isFieldInvalid('firstName')">First name is required.</span>
            </div>

            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                placeholder="Popescu"
                [class.invalid]="isFieldInvalid('lastName')"
              />
              <span class="error-message" *ngIf="isFieldInvalid('lastName')">Last name is required.</span>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="you@utcn.ro"
              [class.invalid]="isFieldInvalid('email')"
            />
            <span class="error-message" *ngIf="isFieldInvalid('email')">
              <ng-container *ngIf="registerForm.get('email')?.errors?.['required']">Email is required.</ng-container>
              <ng-container *ngIf="registerForm.get('email')?.errors?.['email']">Enter a valid email address.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Min 8 chars with uppercase, digit, special char"
              [class.invalid]="isFieldInvalid('password')"
            />
            <span class="error-message" *ngIf="isFieldInvalid('password')">
              <ng-container *ngIf="registerForm.get('password')?.errors?.['required']">Password is required.</ng-container>
              <ng-container *ngIf="registerForm.get('password')?.errors?.['minlength']">Password must be at least 8 characters.</ng-container>
              <ng-container *ngIf="registerForm.get('password')?.errors?.['pattern']">Must include uppercase, lowercase, digit, and special character.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="role">Role</label>
            <select
              id="role"
              formControlName="role"
              [class.invalid]="isFieldInvalid('role')"
            >
              <option value="" disabled>Select your role</option>
              <option value="STUDENT">Student</option>
              <option value="ORGANIZER">Organizer</option>
            </select>
            <span class="error-message" *ngIf="isFieldInvalid('role')">Please select a role.</span>
          </div>

          <span class="error-message server-error" *ngIf="serverError">{{ serverError }}</span>

          <button type="submit" class="btn-primary" [disabled]="isLoading">
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <p class="auth-link">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  serverError = '';

  private readonly passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(this.passwordPattern)]],
      role: ['', Validators.required]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        this.serverError = err.error?.error ?? 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
