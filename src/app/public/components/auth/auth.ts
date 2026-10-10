import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, finalize, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-auth',
  imports: [FormsModule, RouterLink, TranslateModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);

  readonly isRegisterMode = signal(inject(ActivatedRoute).snapshot.data['register'] === true);
  readonly email = signal('');
  readonly password = signal('');
  readonly firstName = signal('');
  readonly lastName = signal('');
  readonly showPassword = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  // El servidor gratuito puede estar durmiendo: tras unos segundos se avisa que está arrancando.
  readonly slow = signal(false);
  readonly canRetry = signal(false);
  private slowTimer?: ReturnType<typeof setTimeout>;
  // Si el registro ya se envió (p. ej. venció el tiempo), un reintento no debe fallar por «correo ya registrado».
  private signUpSent = false;
  private submitted = signal(false);

  goBack(): void {
    void this.router.navigate(['/auth/login']);
  }

  togglePassword(): void {
    this.showPassword.update(shown => !shown);
  }

  setMode(register: boolean): void {
    this.isRegisterMode.set(register);
    this.submitted.set(false);
    this.error.set('');
  }

  isEmailInvalid(): boolean {
    return this.submitted() && !!this.email() && !EMAIL_REGEX.test(this.email());
  }

  isRequiredInvalid(value: string): boolean {
    return this.submitted() && !value.trim();
  }

  continue(): void {
    if (this.busy()) return;
    this.submitted.set(true);
    const register = this.isRegisterMode();
    const email = this.email().trim();
    const password = this.password();
    const name = `${this.firstName().trim()} ${this.lastName().trim()}`;
    if (!EMAIL_REGEX.test(email) || !password || (register && (!this.firstName().trim() || !this.lastName().trim()))) return;

    this.busy.set(true);
    this.error.set('');
    this.canRetry.set(false);
    this.slowTimer = setTimeout(() => this.slow.set(true), 4000);
    // El backend identifica la cuenta por `username`: se envía el correo como username.
    const request = register
      ? this.signUp(email, password).pipe(
          switchMap(() => this.auth.signIn(email, password)),
          // El sign-up ya crea el perfil vacío; si guardar el nombre falla, la cuenta sigue siendo válida.
          switchMap(() => this.http.put(`${environment.apiUrl}/profiles/${this.auth.userId}`, { name }).pipe(catchError(() => of(null))))
        )
      : this.auth.signIn(email, password);
    request.pipe(finalize(() => {
      clearTimeout(this.slowTimer);
      this.slow.set(false);
      this.busy.set(false);
    })).subscribe({
      next: () => void this.router.navigate(['/home']),
      error: (e: { status?: number; name?: string }) => {
        this.canRetry.set(e.name === 'TimeoutError' || e.status === 0);
        this.error.set(
        e.name === 'TimeoutError' ? 'auth.emailLogin.timeout'
        : e.status === 0 ? 'auth.emailLogin.connectionError'
        : !register ? 'auth.emailLogin.invalidCredentials'
        : e.status === 409 ? 'auth.register.emailTaken'
        : 'auth.register.failed');
      }
    });
  }

  private signUp(email: string, password: string) {
    const retrying = this.signUpSent;
    this.signUpSent = true;
    return this.auth.signUp(email, password).pipe(
      catchError((e: { status?: number }) => retrying && e.status === 409 ? of(null) : throwError(() => e))
    );
  }
}
