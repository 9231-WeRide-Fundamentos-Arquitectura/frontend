import { Component, Input, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AccountSecurityApiService } from '../../../infrastructure/account-security-api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-account-security-actions',
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, TranslateModule],
  styles: [`form { display: grid; gap: 0.5rem; min-width: min(320px, 65vw); } [role=alert] { color: #b91c1c; }`],
  template: `
    @if (allowDelete) {
      <button mat-button color="warn" (click)="open('delete')">{{ 'user.settings.deleteAccount' | translate }}</button>
    } @else {
      <button mat-button (click)="open('password')">{{ 'user.security.change' | translate }}</button>
      <button mat-button (click)="revokeOthers()" [disabled]="busy">{{ 'accountSecurity.revokeOthers' | translate }}</button>
    }
    <p role="status" *ngIf="message">{{ message }}</p>
    <p role="alert" *ngIf="error && !dialogRef">{{ error }}</p>
    <ng-template #confirmation>
      <h2 mat-dialog-title>{{ (mode === 'delete' ? 'user.settings.deleteAccount' : 'accountSecurity.changePassword') | translate }}</h2>
      <div mat-dialog-content>
        <p *ngIf="mode === 'delete'">{{ 'accountSecurity.deleteWarning' | translate }}</p>
        <form id="account-security-form" #form="ngForm" (ngSubmit)="submit()">
          <mat-form-field>
            <mat-label>{{ 'accountSecurity.currentPassword' | translate }}</mat-label>
            <input matInput type="password" name="currentPassword" autocomplete="current-password" required [(ngModel)]="currentPassword" [disabled]="busy" />
          </mat-form-field>
          @if (mode === 'password') {
            <mat-form-field>
              <mat-label>{{ 'accountSecurity.newPassword' | translate }}</mat-label>
              <input matInput type="password" name="newPassword" autocomplete="new-password" required minlength="8" maxlength="64" [(ngModel)]="newPassword" [disabled]="busy" />
              <mat-hint>{{ 'accountSecurity.passwordHint' | translate }}</mat-hint>
            </mat-form-field>
            <mat-form-field>
              <mat-label>{{ 'accountSecurity.confirmPassword' | translate }}</mat-label>
              <input matInput type="password" name="confirmPassword" autocomplete="new-password" required [(ngModel)]="confirmPassword" [disabled]="busy" />
            </mat-form-field>
          }
          <p *ngIf="error" role="alert">{{ error }}</p>
          <button mat-raised-button type="submit" [color]="mode === 'delete' ? 'warn' : 'primary'" [disabled]="busy || form.invalid || (mode === 'password' && newPassword !== confirmPassword)">
            {{ (busy ? 'accountSecurity.saving' : 'accountSecurity.confirm') | translate }}
          </button>
        </form>
      </div>
      <mat-dialog-actions>
        <button mat-button type="button" (click)="dialogRef?.close()" [disabled]="busy">{{ 'common.cancel' | translate }}</button>
      </mat-dialog-actions>
    </ng-template>
  `
})
export class AccountSecurityActions {
  @Input() allowDelete = false;
  @ViewChild('confirmation') confirmation!: TemplateRef<unknown>;
  private api = inject(AccountSecurityApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  dialogRef: MatDialogRef<unknown> | null = null;
  mode: 'delete' | 'password' = 'password';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  busy = false;
  error = '';
  message = '';

  open(mode: 'delete' | 'password') {
    this.mode = mode;
    this.error = this.message = '';
    this.dialogRef = this.dialog.open(this.confirmation, { maxWidth: '95vw', autoFocus: 'first-tabbable' });
    this.dialogRef.afterClosed().subscribe(() => {
      this.currentPassword = this.newPassword = this.confirmPassword = '';
      this.dialogRef = null;
    });
  }

  private errorMessage(error: any): string {
    const keys: Record<string, string> = {
      CURRENT_PASSWORD_INVALID: 'wrongPassword', NEW_PASSWORD_INVALID: 'invalidPassword', ACTIVE_BOOKINGS: 'activeBookings'
    };
    return this.translate.instant(`accountSecurity.${keys[error.error?.message] || 'requestFailed'}`);
  }

  async submit() {
    if (this.busy || !this.currentPassword || (this.mode === 'password' && (this.newPassword.length < 8 || this.newPassword !== this.confirmPassword))) return;
    this.busy = true;
    this.error = '';
    if (this.dialogRef) this.dialogRef.disableClose = true;
    try {
      if (this.mode === 'delete') {
        await firstValueFrom(this.api.deleteAccount(this.currentPassword));
        this.auth.logout();
        this.dialogRef?.close();
        await this.router.navigate(['/auth/login']);
      } else {
        await firstValueFrom(this.api.changePassword(this.currentPassword, this.newPassword));
        this.message = this.translate.instant('accountSecurity.passwordChanged');
        this.dialogRef?.close();
      }
    } catch (error) { this.error = this.errorMessage(error); }
    finally { this.busy = false; if (this.dialogRef) this.dialogRef.disableClose = false; }
  }

  async revokeOthers() {
    if (this.busy) return;
    this.busy = true;
    this.error = this.message = '';
    try {
      const result = await firstValueFrom(this.api.revokeOthers());
      this.message = this.translate.instant(result.revoked ? 'accountSecurity.sessionsRevoked' : 'accountSecurity.noOtherSessions', { count: result.revoked });
    } catch (error) { this.error = this.errorMessage(error); }
    finally { this.busy = false; }
  }
}
