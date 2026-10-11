import { Component, Inject, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
export class ManualUnlockModal implements OnInit {
  unlockForm: FormGroup;
  // Solicitud vigente y, si se acaba de crear una nueva, su código para mostrarlo al usuario.
  request?: UnlockRequest;
  issuedCode = '';
  copied = false;
  isUnlocking = false;
  errorMessage = '';
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private bookingStore = inject(BookingStore);
  private tripInitializer = inject(TripInitializerService);
  private translate = inject(TranslateService);

  constructor(
    public dialogRef: MatDialogRef<ManualUnlockModal>,
    @Inject(MAT_DIALOG_DATA) public data: ManualUnlockModalData
  ) {
    this.unlockForm = this.fb.group({
      vehiclePhone: [''],
      unlockCode: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get unlockRequest(): UnlockRequest | undefined {
    return this.request ?? this.data.unlockRequest;
  }

  ngOnInit(): void {
    void this.ensureValidRequest();
  }

  // Si la solicitud caducó o agotó intentos se crea otra y se muestra su código nuevo.
  private async ensureValidRequest(): Promise<void> {
    const booking = this.data.booking;
    if (!booking) return;
    const given = this.data.unlockRequest;
    if (this.bookingStore.isCodeUsable(given) && this.request?.id !== given.id) { this.request = given; return; }
    try {
      const { request, issued } = await this.bookingStore.ensureManualRequest(booking);
      this.request = request;
      if (issued && request.accessCode) this.issuedCode = request.accessCode;
    } catch {
      // Sin solicitud nueva el envío usa la del store, que vuelve a validar en el servidor.
    }
  }

  copyCode(): void {
    void navigator.clipboard?.writeText(this.issuedCode).then(() => { this.copied = true; });
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
        // El desbloqueo no inicia el viaje: primero se marca el destino y luego se inicia.
        if (!await this.tripInitializer.startTripWithDestination(booking)) {
          throw new Error('El vehículo se desbloqueó. Vuelve a abrir el mapa para cargar el viaje.');
        }

        this.snackBar.open(
          this.translate.instant('booking.unlockCode.success'),
          this.translate.instant('common.close'),
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        this.dialogRef.close({ success: true });

        this.router.navigate(['/trip'], {
          queryParams: { activeTrip: true }
        });
      } else {
        // El intento pudo agotar el código o caducarlo: se prepara uno nuevo para no dejar al usuario atascado.
        const previousId = this.unlockRequest?.id;
        await this.ensureValidRequest();
        if (this.unlockRequest?.id !== previousId) this.unlockForm.get('unlockCode')?.reset('');
        throw new Error(unlockResult.error || this.translate.instant('booking.unlockCode.invalid'));
      }
    } catch (error) {
      this.errorMessage = error instanceof Error
        ? error.message
        : this.translate.instant('booking.unlockCode.error');

      this.snackBar.open(
        this.errorMessage,
        this.translate.instant('common.close'),
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      this.isUnlocking = false;
    }
  }

  isFormValid(): boolean {
    return this.unlockForm.valid;
  }
}

