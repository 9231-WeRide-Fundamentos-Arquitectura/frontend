import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { finalize, switchMap } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <main class="container">
      <h1>{{ register ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field><mat-label>Usuario</mat-label>
          <input matInput formControlName="username" autocomplete="username" required>
        </mat-form-field>
        <mat-form-field><mat-label>Contraseña</mat-label>
          <input matInput type="password" formControlName="password" [attr.autocomplete]="register ? 'new-password' : 'current-password'" required>
        </mat-form-field>
        @if (error()) { <p role="alert">{{ error() }}</p> }
        <button mat-raised-button type="submit" [disabled]="busy() || form.invalid">{{ register ? 'Registrarse' : 'Entrar' }}</button>
        <a mat-button [routerLink]="register ? '/auth/login' : '/auth/register'">{{ register ? 'Ya tengo cuenta' : 'Crear cuenta' }}</a>
      </form>
    </main>`
})
export class AuthComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly register = inject(ActivatedRoute).snapshot.data['register'] === true;
  readonly form = inject(FormBuilder).nonNullable.group({ username: ['', Validators.required], password: ['', Validators.required] });
  readonly busy = signal(false);
  readonly error = signal('');

  submit(): void {
    if (this.form.invalid || this.busy()) return;
    const { username, password } = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');
    const request = this.register
      ? this.auth.signUp(username, password).pipe(switchMap(() => this.auth.signIn(username, password)))
      : this.auth.signIn(username, password);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => void this.router.navigate(['/home']),
      error: () => this.error.set(this.register ? 'No se pudo crear la cuenta o iniciar sesión. Intenta iniciar sesión si ya se creó.' : 'No se pudo iniciar sesión. Revisa tus credenciales y la conexión.')
    });
  }
}
