import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Session { id: string; token: string; username: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly session = signal<Session | null>(this.restore());

  get userId(): string {
    const session = this.session();
    if (!session) throw new Error('Inicia sesión para continuar');
    return session.id;
  }

  signIn(username: string, password: string) {
    return this.http.post<{ id: number; token: string }>(`${environment.apiUrl}/authentication/sign-in`, { username, password }).pipe(
      tap(response => {
        if (!response.id || !response.token) throw new Error('Respuesta de autenticación inválida');
        const session = { id: String(response.id), token: response.token, username };
        localStorage.setItem('weride_session', JSON.stringify(session));
        this.session.set(session);
      })
    );
  }

  signUp(username: string, password: string) {
    return this.http.post(`${environment.apiUrl}/authentication/sign-up`, { username, password });
  }

  logout(): void {
    const token = this.session()?.token;
    localStorage.removeItem('weride_session');
    localStorage.removeItem('active_booking');
    localStorage.removeItem('userProfile');
    this.session.set(null);
    if (token) this.http.post<void>(`${environment.apiUrl}/accounts/me/sessions/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({ error: () => {} });
  }

  private restore(): Session | null {
    try {
      const session = JSON.parse(localStorage.getItem('weride_session') || 'null');
      if (!session || typeof session.id !== 'string' || typeof session.token !== 'string' || typeof session.username !== 'string') return null;
      const payload = JSON.parse(atob(session.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 > Date.now() ? session : null;
    } catch { return null; }
  }
}

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const apiRequest = request.url.startsWith(`${environment.apiUrl}/`) && !request.url.startsWith(`${environment.apiUrl}/authentication/`);
  const token = auth.session()?.token;
  return next(apiRequest && token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request).pipe(
    catchError(error => {
      if (apiRequest && error.status === 401) {
        auth.logout();
        void router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};

export const authGuard: CanActivateFn = () => inject(AuthService).session() !== null || inject(Router).createUrlTree(['/auth/login']);
