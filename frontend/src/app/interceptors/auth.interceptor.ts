import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Decorator pattern: wraps every outgoing HTTP request to attach
 * the Authorization header if a JWT token is present in localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    const authorizedRequest = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authorizedRequest);
  }

  return next(request);
};
