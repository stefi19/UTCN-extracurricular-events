import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of toasts"
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-info]="toast.type === 'info'"
        (click)="toastService.dismiss(toast.id)"
      >
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 2000;
    }
    .toast {
      padding: 0.85rem 1.25rem;
      border-radius: 8px;
      color: #fff;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      animation: slideUp 0.25s ease;
      max-width: 340px;
    }
    .toast-success { background: #15803d; }
    .toast-error { background: var(--color-danger); }
    .toast-info { background: var(--color-primary); }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(readonly toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toasts$.subscribe((toastList) => {
      this.toasts = toastList;
    });
  }
}
