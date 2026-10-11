import { Component, inject } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface UnlockCodeToastData {
  code: string;
  expiresAt: Date | null;
}

// Toast «Reserva pendiente»: muestra el código del servidor, permite copiarlo y activarlo al momento.
@Component({
  selector: 'app-unlock-code-toast',
  imports: [MatButtonModule, MatIconModule, TranslateModule],
  styles: [`
    :host { display: block; }
    .title { font-weight: 600; margin-bottom: 4px; }
    .code-row { display: flex; align-items: center; gap: 8px; }
    .code { font-family: monospace; font-size: 1.5rem; letter-spacing: 0.15em; font-weight: 700; }
    .hint { font-size: 0.8rem; opacity: 0.8; margin: 4px 0 8px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
  `],
  template: `
    <div class="title">{{ 'booking.unlockCode.pendingTitle' | translate }}</div>
    <div class="code-row">
      <span class="code">{{ data.code }}</span>
      <button mat-icon-button type="button" (click)="copy()" [attr.aria-label]="'booking.unlockCode.copy' | translate">
        <mat-icon>{{ copied ? 'check' : 'content_copy' }}</mat-icon>
      </button>
    </div>
    <div class="hint">{{ 'booking.unlockCode.expiresHint' | translate }}</div>
    <div class="actions">
      <button mat-button type="button" (click)="ref.dismiss()">{{ 'common.close' | translate }}</button>
      <button mat-flat-button type="button" (click)="ref.dismissWithAction()">{{ 'booking.unlockCode.activateNow' | translate }}</button>
    </div>`
})
export class UnlockCodeToast {
  data = inject<UnlockCodeToastData>(MAT_SNACK_BAR_DATA);
  ref = inject(MatSnackBarRef<UnlockCodeToast>);
  copied = false;

  copy(): void {
    void navigator.clipboard?.writeText(this.data.code).then(() => { this.copied = true; });
  }
}
