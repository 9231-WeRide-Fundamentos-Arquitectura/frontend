import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Booking } from '../../../domain/model/booking.entity';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';

export interface UnlockMethodSelectionData {
  booking: Booking;
  vehicle: Vehicle;
}

@Component({
  selector: 'app-unlock-method-selection-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <div class="unlock-method-selection-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>lock_open</mat-icon>
          Selecciona método de desbloqueo
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="vehicle-preview">
          <img [src]="data.vehicle.image" [alt]="data.vehicle.brand + ' ' + data.vehicle.model">
          <div class="vehicle-info">
            <h3>{{ data.vehicle.brand }} {{ data.vehicle.model }}</h3>
            <p class="booking-info">Reserva programada para: {{ formatScheduledTime() }}</p>
          </div>
        </div>

        <div class="options">
          <button
            mat-raised-button
            class="option-button manual-option"
            (click)="selectMethod('manual')"
          >
            <mat-icon>lock</mat-icon>
            <div class="button-text">
              <strong>Desbloqueo Manual</strong>
              <span>Ingresa tu número y contraseña</span>
            </div>
          </button>

          <button
            mat-raised-button
            class="option-button qr-option"
            (click)="selectMethod('qr_code')"
          >
            <mat-icon>qr_code_scanner</mat-icon>
            <div class="button-text">
              <strong>Desbloqueo con QR</strong>
              <span>Escanea el código QR del vehículo</span>
            </div>
          </button>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .unlock-method-selection-modal {
      min-width: 400px;
      max-width: 500px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .modal-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.4rem;
      color: #333;
    }

    .vehicle-preview {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .vehicle-preview img {
      width: 100px;
      height: 100px;
      object-fit: contain;
      border-radius: 8px;
    }

    .vehicle-info h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #333;
    }

    .vehicle-info p {
      margin: 4px 0;
      font-size: 0.9rem;
      color: #666;
    }

    .booking-info {
      color: #7c3aed !important;
      font-weight: 500;
    }

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option-button {
      width: 100%;
      height: auto;
      padding: 20px 16px !important;
      border-radius: 12px !important;
      display: flex !important;
      align-items: center;
      gap: 16px;
      text-align: left;
      transition: all 0.3s ease;
    }

    .option-button mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .button-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .button-text strong {
      font-size: 1rem;
      display: block;
    }

    .button-text span {
      font-size: 0.85rem;
      font-weight: 400;
      opacity: 0.8;
    }

    .manual-option {
      background: white !important;
      color: #7c3aed !important;
      border: 2px solid #7c3aed !important;
    }

    .qr-option {
      background: white !important;
      color: #7c3aed !important;
      border: 2px solid #7c3aed !important;
    }

    .option-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      background: #7c3aed !important;
      color: white !important;
    }

    .option-button:hover mat-icon {
      color: white;
    }

    mat-dialog-content {
      padding: 0 24px 24px;
      overflow: visible;
    }

    @media (max-width: 500px) {
      .unlock-method-selection-modal {
        min-width: 100%;
      }

      .vehicle-preview {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }
  `]
})
export class UnlockMethodSelectionModal {
  dialogRef = inject(MatDialogRef<UnlockMethodSelectionModal>);
  data: UnlockMethodSelectionData = inject(MAT_DIALOG_DATA);

  formatScheduledTime(): string {
    const date = this.data.booking.startDate;
    return date.toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  selectMethod(method: 'manual' | 'qr_code'): void {
    this.dialogRef.close({ method });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}

