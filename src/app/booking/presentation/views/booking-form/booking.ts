import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { BookingStorageService } from '../../../application/booking-storage.service';
import { BookingStore } from '../../../application/booking.store';
import { DraftBookingService } from '../../../application/draft-booking.service';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../../../infraestructure/booking-assembler';
import { VehiclesApiEndpoint } from '../../../infraestructure/vehicles-api-endpoint';
import { VehicleResponse } from '../../../infraestructure/vehicle-response';
import { LocationsApiEndpoint } from '../../../infraestructure/locations-api-endpoint';
import { LocationResponse } from '../../../infraestructure/locations-response';
import { AuthService } from '../../../../core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { Booking } from '../../../domain/model/booking.entity';
import { UnlockCodeToast } from '../unlock-code-toast/unlock-code-toast';
import { ManualUnlockModal } from '../../../../garage/presentation/views/manual-unlock-modal/manual-unlock-modal';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, TranslateModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingStorage = inject(BookingStorageService);
  private bookingStore = inject(BookingStore);
  private bookingsApi = inject(BookingsApiEndpoint);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private draftService = inject(DraftBookingService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  private dialog = inject(MatDialog);

  // Edit mode properties
  isEditMode = false;
  editingBookingId: string | null = null;

  // Vehículos y estaciones reales (GET /vehicles, GET /location).
  vehicles: VehicleResponse[] = [];
  locations: LocationResponse[] = [];
  loading = true;
  saving = false;
  selectedVehicle: string = '';
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
  rate: number = 0;
  showSummary: boolean = false;
  smsReminder: boolean = false;
  emailConfirmation: boolean = false;
  pushNotification: boolean = false;

  async ngOnInit(): Promise<void> {
    try {
      [this.vehicles, this.locations] = await Promise.all([
        firstValueFrom(this.vehiclesApi.getAll()),
        firstValueFrom(this.locationsApi.getAll())
      ]);
    } catch {
      this.showErrorMessage('booking.form.loadError');
    } finally {
      this.loading = false;
    }
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const bookingId = params.get('id');
      if (bookingId) {
        this.isEditMode = true;
        this.editingBookingId = bookingId;
        this.loadBookingForEdit(bookingId);
      }
    });
  }

  get bookableVehicles(): VehicleResponse[] {
    return this.vehicles.filter(v => v.status === 'available' || v.id === this.selectedVehicle);
  }

  get selected(): VehicleResponse | undefined {
    return this.vehicles.find(v => v.id === this.selectedVehicle);
  }

  stationName(vehicle: VehicleResponse): string {
    return this.locations.find(l => l.id === String(vehicle.location))?.name ?? '';
  }

  /**
   * Load booking data for editing
   */
  private loadBookingForEdit(bookingId: string): void {
    const booking = this.bookingStorage.getBookingById(bookingId);

    if (booking) {
      // Populate form fields with booking data
      this.selectedVehicle = booking.vehicleId;
      this.selectedDate = this.formatDateForInput(booking.startDate);
      this.unlockTime = this.formatTimeForInput(booking.startDate);
      this.duration = booking.duration || 1;
      this.rate = this.selected?.pricePerMinute ?? 0;
    } else {
      // Booking not found, show error and navigate back
      this.showErrorMessage('booking.notFound');
      this.router.navigate(['/booking/list']);
    }
  }

  /**
   * Format date for HTML date input (YYYY-MM-DD, fecha local)
   */
  private formatDateForInput(date: Date): string {
    return new Date(date).toLocaleDateString('sv-SE');
  }

  /**
   * Format time for HTML time input (HH:MM)
   */
  private formatTimeForInput(date: Date): string {
    const d = new Date(date);
    return d.toTimeString().slice(0, 5);
  }

  getVehicleName(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? `${v.brand} ${v.model}` : '';
  }

  getVehicleType(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? this.translate.instant(`garage.vehicle.types.${v.type}`) : '';
  }

  getVehicleBattery(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? `${v.battery}%` : '';
  }

  getVehicleRange(id: string): string {
    const v = this.vehicles.find(vehicle => vehicle.id === id);
    return v ? `${v.range} km` : '';
  }

  async submitBooking() {
    const vehicle = this.selected;
    if (!vehicle || this.saving) return;
    this.rate = vehicle.pricePerMinute;

    if (this.isEditMode && this.editingBookingId) {
      // La API no tiene endpoint para modificar una reserva (PATCH solo cancela): no se finge el cambio.
      this.showErrorMessage('booking.form.editUnsupported');
      return;
    }
    await this.createNewBooking(vehicle);
  }

  /**
   * Crea la reserva en la API (POST /bookings). Solo se informa éxito si el backend la crea.
   */
  private async createNewBooking(vehicle: VehicleResponse): Promise<void> {
    const startDate = this.combineDateTime(this.selectedDate, this.unlockTime);
    if (startDate.getTime() <= Date.now()) {
      this.showErrorMessage('booking.form.pastDate');
      return;
    }
    const endDate = new Date(startDate.getTime() + this.duration * 60000);
    this.saving = true;
    try {
      const response = await firstValueFrom(this.bookingsApi.create({
        userId: this.auth.userId,
        vehicleId: vehicle.id,
        startLocationId: String(vehicle.location),
        endLocationId: String(vehicle.location),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalCost: this.calculateCost()
      }));
      const booking = toDomainBooking(response);
      this.bookingStore.addBooking(booking);
      // Crear la solicitud hace que el servidor genere el código y la notificación.
      if (!await this.offerUnlockCode(booking, vehicle)) this.showSuccessMessage('booking.createSuccess');
      this.showSummary = true;
      setTimeout(() => this.router.navigate(['/booking/list']), 2000);
    } catch (error: any) {
      const message = error?.error?.message;
      if (message) this.snackBar.open(message, '', { duration: 4000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['error-snackbar'] });
      else this.showErrorMessage('booking.form.createError');
    } finally {
      this.saving = false;
    }
  }

  // Crea la solicitud de desbloqueo y ofrece el código en un toast. Devuelve false si no hubo código que mostrar.
  private async offerUnlockCode(booking: Booking, vehicle: VehicleResponse): Promise<boolean> {
    try {
      const { request } = await this.bookingStore.ensureManualRequest(booking);
      if (!request.accessCode) return false;
      this.snackBar.openFromComponent(UnlockCodeToast, {
        data: { code: request.accessCode, expiresAt: request.codeExpiresAt },
        horizontalPosition: 'end', verticalPosition: 'bottom', duration: 20000
      }).onAction().subscribe(() => this.dialog.open(ManualUnlockModal, {
        width: '600px', maxWidth: '95vw', autoFocus: false,
        data: { vehicle, booking, unlockRequest: request }
      }));
      return true;
    } catch {
      // La reserva ya existe: el código se podrá pedir desde «Activar» en Mis Reservas.
      return false;
    }
  }

  /**
   * Combine date and time strings into a Date object
   */
  private combineDateTime(dateStr: string, timeStr: string): Date {
    return new Date(`${dateStr}T${timeStr}`);
  }

  /**
   * Calculate booking cost
   */
  private calculateCost(): number {
    return this.rate * this.duration;
  }

  // Guarda el borrador en la API (POST /bookingDrafts).
  async saveDraft() {
    const vehicle = this.selected;
    if (!vehicle) {
      this.showErrorMessage('booking.form.selectVehicle');
      return;
    }
    this.rate = vehicle.pricePerMinute;
    this.saving = true;
    try {
      await firstValueFrom(this.draftService.saveDraft({
        userId: this.auth.userId,
        vehicleId: vehicle.id,
        selectedDate: this.selectedDate,
        unlockTime: this.unlockTime,
        duration: this.duration,
        smsReminder: this.smsReminder,
        emailConfirmation: this.emailConfirmation,
        pushNotification: this.pushNotification
      }));
      this.showSummary = true;
      this.showSuccessMessage('booking.form.draftSaved');
    } catch {
      this.showErrorMessage('booking.form.draftError');
    } finally {
      this.saving = false;
    }
  }

  private showSuccessMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(key: string): void {
    const message = this.translate.instant(key);
    this.snackBar.open(message, '', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
