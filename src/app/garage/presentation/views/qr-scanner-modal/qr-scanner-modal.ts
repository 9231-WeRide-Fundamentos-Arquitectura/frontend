import { Component, Inject, Optional, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { Booking } from '../../../../booking/domain/model/booking.entity';
import { UnlockRequest } from '../../../../booking/domain/model/unlockRequest.entity';
import { BookingStore } from '../../../../booking/application/booking.store';
import { TripInitializerService } from '../../../../trip/application/trip-initializer.service';
import { FormsModule } from '@angular/forms';
import { ManualUnlockModal } from '../manual-unlock-modal/manual-unlock-modal';
import { MatDialog } from '@angular/material/dialog';

export interface QrScannerModalData {
  vehicle?: Vehicle;
  booking?: Booking;
  unlockRequest?: UnlockRequest;
}

@Component({
  selector: 'app-qr-scanner-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule, FormsModule
  ],
  templateUrl: './qr-scanner-modal.html',
  styleUrl: './qr-scanner-modal.css'
})
export class QrScannerModal {
  isScanning = false;
  scannedCode = '';
  errorMessage = '';
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private bookingStore = inject(BookingStore);
  private tripInitializer = inject(TripInitializerService);
  private dialog = inject(MatDialog);

  constructor(
    public dialogRef: MatDialogRef<QrScannerModal>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: QrScannerModalData
  ) {}

  get vehicle(): Vehicle | undefined {
    return this.data?.vehicle;
  }

  get booking(): Booking | undefined {
    return this.data?.booking;
  }

  get unlockRequest(): UnlockRequest | undefined {
    return this.data?.unlockRequest;
  }

  get qrContent(): string {
    return `weride:vehicle:${this.vehicle?.id}`;
  }

  simulateScan(): void {
    this.scannedCode = this.qrContent;
    void this.onScan();
  }

  async onScan(): Promise<void> {
    if (this.isScanning) {
      return;
    }

    this.isScanning = true;
    this.errorMessage = '';

    try {
      const unlockResult = await this.bookingStore.unlockVehicleByQR(this.scannedCode, this.booking, this.unlockRequest?.id);

      if (unlockResult.success) {
        const booking = await this.bookingStore.getBookingByIdAsync(unlockResult.bookingId!);
        if (!await this.tripInitializer.initializeTripFromBooking(booking)) {
          throw new Error('El vehículo se desbloqueó. Vuelve a abrir el mapa para cargar el viaje.');
        }

        this.snackBar.open(
          'Vehículo desbloqueado con éxito',
          'Cerrar',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        this.dialogRef.close({ success: true });

        this.router.navigate(['/trip'], {
          queryParams: { activeTrip: true }
        });
      } else {
        throw new Error(unlockResult.error || 'Error al desbloquear');
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Error al escanear el código QR';

      this.snackBar.open(
        this.errorMessage,
        'Reintentar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      this.isScanning = false;
    }
  }

  onClose(): void {
    this.dialogRef.close({ cancelled: true });
  }

  onOK(): void { this.onScan(); }

  openManual(): void {
    this.dialog.open(ManualUnlockModal, { data: this.data, width: '600px', maxWidth: '95vw' })
      .afterClosed().subscribe(result => { if (result?.success) this.dialogRef.close(result); });
  }
}
