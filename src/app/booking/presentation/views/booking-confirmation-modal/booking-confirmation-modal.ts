import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';

export interface BookingConfirmationData {
  vehicle: Vehicle;
}

@Component({
  selector: 'app-booking-confirmation-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  template: `
    <div class="booking-confirmation-modal">
      <div class="modal-header">
        <h2 mat-dialog-title>
          <mat-icon>event_available</mat-icon>
          ¿Cómo deseas reservar?
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
            <p class="price">\${{ data.vehicle.pricePerMinute }}/min</p>
            <p class="battery">🔋 {{ data.vehicle.battery }}%</p>
          </div>
        </div>

        <div class="options">
          <button 
            mat-raised-button 
            color="primary" 
            class="option-button"
            (click)="bookNow()"
          >
            <mat-icon>play_circle</mat-icon>
            <div class="button-text">
              <strong>Reservar Ahora</strong>
              <span>Usa el vehículo inmediatamente</span>
            </div>
          </button>

          <button 
            mat-raised-button 
            class="option-button schedule-option"
            (click)="scheduleBooking()"
          >
            <mat-icon>schedule</mat-icon>
            <div class="button-text">
              <strong>Programar Reserva</strong>
              <span>Elige fecha y hora específica</span>
            </div>
          </button>
        </div>
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .booking-confirmation-modal {
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

    .price {
      font-weight: 600;
      color: #7c3aed !important;
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

    .schedule-option {
      background: white !important;
      color: #7c3aed !important;
      border: 2px solid #7c3aed !important;
    }

    .option-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }

    mat-dialog-content {
      padding: 0 24px 24px;
      overflow: visible;
    }

    @media (max-width: 500px) {
      .booking-confirmation-modal {
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
export class BookingConfirmationModal {
  dialogRef = inject(MatDialogRef<BookingConfirmationModal>);
  data: BookingConfirmationData = inject(MAT_DIALOG_DATA);

  bookNow(): void {
    this.dialogRef.close({ action: 'book_now' });
  }

  scheduleBooking(): void {
    this.dialogRef.close({ action: 'schedule' });
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
