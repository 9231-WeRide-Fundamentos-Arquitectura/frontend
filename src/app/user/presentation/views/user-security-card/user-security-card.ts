import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { UserStore } from '../../../application/user.store';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../domain/model/user.entity';
import { AccountSecurityActions } from '../account-security-actions/account-security-actions';

type EditableField = 'phone' | 'emergencyContact';

@Component({
  selector: 'app-user-security-card',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIcon, TranslateModule, AccountSecurityActions],
  templateUrl: './user-security-card.html',
  styleUrl: './user-security-card.css'
})
export class UserSecurityCard implements OnInit {
  private readonly userStore = inject(UserStore);
  private readonly stateService = inject(UserSettingsStateService);
  private readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  user$ = this.userStore.getGuestUser$();

  // El correo es el username de la sesión: el backend no permite cambiarlo.
  readonly email = this.auth.session()?.username ?? '';

  editing: EditableField | null = null;
  draft = '';
  saving = false;
  error = '';

  ngOnInit(): void {
  }

  closeCard(): void {
    this.stateService.closeSection();
  }

  startEdit(field: EditableField, user: User): void {
    this.editing = field;
    this.draft = user[field] ?? '';
    this.error = '';
  }

  cancelEdit(): void {
    this.editing = null;
    this.error = '';
  }

  // PUT /profiles/{userId}: teléfono (7–15 dígitos, admite +, espacios y guiones) o contacto de emergencia.
  save(user: User): void {
    const field = this.editing;
    if (!field || this.saving) return;
    const value = this.draft.trim();
    if (field === 'phone' && value && !/^\+?[\d\s-]{7,20}$/.test(value)) {
      this.error = 'user.security.invalidPhone';
      return;
    }
    if (value.length > 100) {
      this.error = 'user.security.tooLong';
      return;
    }
    this.saving = true;
    this.error = '';
    this.userStore.updateUser(user.id, { ...user, [field]: value }).subscribe({
      next: () => {
        this.saving = false;
        this.editing = null;
        this.snackBar.open(this.translate.instant('user.security.saved'), this.translate.instant('common.close'), { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.error = 'user.security.saveError';
      }
    });
  }
}
