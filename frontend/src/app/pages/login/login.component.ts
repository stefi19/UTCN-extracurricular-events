import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>UTCN Events</h1>
          <p>Sign in to your account</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
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
              <ng-container *ngIf="loginForm.get('email')?.errors?.['required']">Email is required.</ng-container>
              <ng-container *ngIf="loginForm.get('email')?.errors?.['email']">Enter a valid email address.</ng-container>
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Your password"
              [class.invalid]="isFieldInvalid('password')"
            />
            <span class="error-message" *ngIf="isFieldInvalid('password')">
              Password is required.
            </span>
          </div>

          <span class="error-message server-error" *ngIf="serverError">{{ serverError }}</span>

          <button type="submit" class="btn-primary" [disabled]="isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="auth-link">Don't have an account? <a routerLink="/register">Register</a></p>
      </div>
    </div>
  `,
  styleUrl: './login.component.css'
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  serverError = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.serverError = '';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/events']),
      error: (err) => {
        this.serverError = err.error?.error ?? 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
