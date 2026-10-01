import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';

@Component({
  selector: 'app-confirm-booking-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './confirm-booking-modal.html',
  styleUrl: './confirm-booking-modal.css'
})
export class ConfirmBookingModal {
  constructor(
    public dialogRef: MatDialogRef<ConfirmBookingModal>,
    @Inject(MAT_DIALOG_DATA) public vehicle: Vehicle
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }

  reserveWithQR(): void {
    this.dialogRef.close({ method: 'qr' });
  }

  reserveWithCode(): void {
    this.dialogRef.close({ method: 'code' });
  }
}

