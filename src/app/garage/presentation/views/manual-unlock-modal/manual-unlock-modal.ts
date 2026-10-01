import { Component, Inject, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Vehicle } from '../../../domain/model/vehicle.model';
import { Booking } from '../../../../booking/domain/model/booking.entity';
import { UnlockRequest } from '../../../../booking/domain/model/unlockRequest.entity';
import { BookingStore } from '../../../../booking/application/booking.store';
import { TripInitializerService } from '../../../../trip/application/trip-initializer.service';

export interface ManualUnlockModalData {
  vehicle: Vehicle;
  booking?: Booking;
  unlockRequest?: UnlockRequest;
}

@Component({
  selector: 'app-manual-unlock-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './manual-unlock-modal.html',
  styleUrl: './manual-unlock-modal.css'
})
export class ManualUnlockModal {
  unlockForm: FormGroup;
  isUnlocking = false;
  errorMessage = '';
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private bookingStore = inject(BookingStore);
  private tripInitializer = inject(TripInitializerService);

  constructor(
    public dialogRef: MatDialogRef<ManualUnlockModal>,
    @Inject(MAT_DIALOG_DATA) public data: ManualUnlockModalData
  ) {
    this.unlockForm = this.fb.group({
      vehiclePhone: [''],
      unlockCode: ['', [Validators.required]]
    });
  }

  get unlockRequest(): UnlockRequest | undefined {
    return this.data.unlockRequest;
  }

  get vehiclePhoneControl() {
    return this.unlockForm.get('vehiclePhone');
  }

  get unlockCodeControl() {
    return this.unlockForm.get('unlockCode');
  }

  onClose(): void {
    this.dialogRef.close({ cancelled: true });
  }

  async onSubmit(): Promise<void> {
    if (this.unlockForm.invalid) {
      this.unlockForm.markAllAsTouched();
      return;
    }

    this.isUnlocking = true;
    this.errorMessage = '';

    const { vehiclePhone, unlockCode } = this.unlockForm.value;

    try {
      const unlockResult = await this.bookingStore.unlockVehicleManually(
        vehiclePhone,
        unlockCode,
        this.data.booking,
        this.unlockRequest?.id
      );

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
        throw new Error(unlockResult.error || 'Código incorrecto');
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Error al desbloquear el vehículo';

      this.snackBar.open(
        this.errorMessage,
        'Cerrar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      this.isUnlocking = false;
    }
  }

  isFormValid(): boolean {
    return this.unlockForm.valid;
  }
}

