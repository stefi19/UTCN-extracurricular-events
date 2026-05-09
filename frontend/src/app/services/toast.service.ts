import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSubject = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();
  private nextId = 1;

  show(message: string, type: ToastType = 'info', durationMs = 3500): void {
    const toast: Toast = { id: this.nextId++, message, type };
    this.toastsSubject.next([...this.toastsSubject.getValue(), toast]);
    setTimeout(() => this.dismiss(toast.id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(toastId: number): void {
    this.toastsSubject.next(this.toastsSubject.getValue().filter((toast) => toast.id !== toastId));
  }
}
