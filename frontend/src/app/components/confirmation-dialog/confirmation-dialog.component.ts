import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dialog-overlay" (click)="onCancel()">
      <div class="dialog-box" (click)="$event.stopPropagation()">
        <h3 class="dialog-title">{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn-secondary" (click)="onCancel()">Cancel</button>
          <button class="btn-danger" (click)="onConfirm()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }
    .dialog-box {
      background: #fff;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    }
    .dialog-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin-bottom: 0.5rem;
    }
    .dialog-message {
      color: var(--color-text-secondary);
      margin-bottom: 1.5rem;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
    .btn-secondary {
      padding: 0.55rem 1.25rem;
      border: 1.5px solid var(--color-border);
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    .btn-secondary:hover { background: var(--color-background); }
    .btn-danger {
      padding: 0.55rem 1.25rem;
      border: none;
      border-radius: 8px;
      background: var(--color-danger);
      color: #fff;
      cursor: pointer;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn-danger:hover { opacity: 0.85; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ConfirmationDialogComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmLabel = 'Confirm';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
