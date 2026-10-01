  import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Vehicle } from '../../../../garage/domain/model/vehicle.model';
import { BookingsApiEndpoint } from '../../../infraestructure/bookings-api-endpoint';
import { toDomainBooking } from '../../../infraestructure/booking-assembler';
import { ActiveBookingService } from '../../../application/active-booking.service';
import { BookingStore } from '../../../application/booking.store';
import { UnlockMethodSelectionModal } from '../unlock-method-selection-modal/unlock-method-selection-modal';
import { UnlockRequestsApiEndpoint } from '../../../infraestructure/unlockRequests-api-endpoint';
import { UnlockRequest } from '../../../domain/model/unlockRequest.entity';
import { firstValueFrom } from 'rxjs';
import { ManualUnlockModal } from '../../../../garage/presentation/views/manual-unlock-modal/manual-unlock-modal';
import { QrScannerModal } from '../../../../garage/presentation/views/qr-scanner-modal/qr-scanner-modal';
import { BookingSuccessModal } from '../../../../public/components/booking-success-modal/booking-success-modal';
import { DraftBookingService } from '../../../application/draft-booking.service';
import { BookingDraft } from '../../../domain/model/booking-draft.entity';

@Component({
  selector: 'app-schedule-unlock',
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, TranslateModule],
  templateUrl: './schedule-unlock.html',
  styleUrl: './schedule-unlock.css'
})
export class ScheduleUnlockComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private bookingsApi = inject(BookingsApiEndpoint);
  private activeBookingService = inject(ActiveBookingService);
  private bookingStore = inject(BookingStore);
  private dialog = inject(MatDialog);
  private unlockRequestsApi = inject(UnlockRequestsApiEndpoint);
  private draftService = inject(DraftBookingService);

  availabilityError: string = '';
  vehicleAvailable: boolean = false;
  isSavingDraft: boolean = false;
  showIconFallback: boolean = false;

  searchTerm: string = '';
  selectedVehicle: Vehicle | null = null;
  selectedDate: string = '';
  unlockTime: string = '';
  duration: number = 1;
  smsReminder: boolean = false;
  emailConfirmation: boolean = false;
  pushNotification: boolean = false;
  isImmediate: boolean = false;

  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  drafts$ = this.draftService.drafts$;

  ngOnInit() {
    // Get vehicle from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.vehicle) {
      this.selectedVehicle = state.vehicle;
      this.searchTerm = `${state.vehicle.brand} ${state.vehicle.model}`;
    }

    // Check if immediate booking
    if (state?.immediate) {
      this.isImmediate = true;
      this.setImmediateBooking();
    } else {
      this.setDefaultDateTime();
    }
  }

  setImmediateBooking() {
    const now = new Date();
    this.selectedDate = now.toISOString().split('T')[0];
    this.unlockTime = now.toTimeString().substring(0, 5);
  }

  setDefaultDateTime() {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  filterVehicles() {
    if (!this.searchTerm.trim()) {
      this.filteredVehicles = [...this.vehicles];
    } else {
      this.filteredVehicles = this.vehicles.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        vehicle.model.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        vehicle.location.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  selectVehicle(vehicle: Vehicle) {
    this.selectedVehicle = vehicle;
    this.searchTerm = `${vehicle.brand} ${vehicle.model}`;
    this.filteredVehicles = [];
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    this.showIconFallback = true;
  }

  getVehicleIcon(type?: string): string {
    const iconMap: { [key: string]: string } = {
      'electric_scooter': 'electric_scooter',
      'bike': 'pedal_bike',
      'electric_bike': 'electric_bike',
      'default': 'two_wheeler'
    };
    return iconMap[type || 'default'];
  }

  get isFormValid(): boolean {
    return !!(this.selectedVehicle && this.selectedDate && this.unlockTime);
  }

  get dateError(): string | null {
    if (!this.selectedDate) return null;
    if (!this.validateDateTime()) {
      return 'La fecha debe ser futura';
    }
    return null;
  }

  formatDateTime(): string {
    if (!this.selectedDate || !this.unlockTime) {
      return 'Select date and time';
    }

    const date = new Date(this.selectedDate);
    const time = this.unlockTime;

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const formattedTime = `${hour12}:${minutes} ${ampm}`;

    return `${formattedDate} at ${formattedTime}`;
  }

  calculateTotal(): string {
    if (!this.selectedVehicle) return '0.00';
    const totalMinutes = this.duration * 60;
    return (this.selectedVehicle.pricePerMinute * totalMinutes).toFixed(2);
  }

  /**
   * Valida que la fecha y hora sean futuras
   */
  private validateDateTime(): boolean {
    if (!this.selectedDate || !this.unlockTime) {
      return false;
    }

    const [hours, minutes] = this.unlockTime.split(':');
    const selectedDateTime = new Date(this.selectedDate);
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    const now = new Date();

    return selectedDateTime > now;
  }

  /**
   * Verifica la disponibilidad del vehículo en el rango de fechas seleccionado
   */
  private async checkVehicleAvailability(startDate: Date, endDate: Date): Promise<{ available: boolean; message?: string }> {
    if (!this.selectedVehicle) {
      return { available: false, message: 'Vehículo no seleccionado' };
    }

    try {
      const bookings = await firstValueFrom(this.bookingsApi.getByVehicleId(this.selectedVehicle.id));

      // Filtrar bookings activos (pending, confirmed)
      const activeBookings = bookings.filter(b =>
        b.status === 'pending' || b.status === 'confirmed'
      );

      // Verificar solapamiento de fechas
      for (const booking of activeBookings) {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = booking.endDate ? new Date(booking.endDate) : null;

        // Verificar si hay solapamiento
        if (bookingEnd) {
          // Hay solapamiento si:
          // - La nueva reserva empieza antes de que termine la existente Y
          // - La nueva reserva termina después de que empiece la existente
          if (startDate < bookingEnd && endDate > bookingStart) {
            const conflictStart = bookingStart.toLocaleString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });
            const conflictEnd = bookingEnd.toLocaleString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return {
              available: false,
              message: `El vehículo no está disponible del ${conflictStart} al ${conflictEnd}. Por favor, selecciona otro horario.`
            };
          }
        } else {
          // Si no hay endDate, verificar solapamiento con startDate
          if (startDate < bookingStart && endDate > bookingStart) {
            return {
              available: false,
              message: `El vehículo tiene una reserva activa que comienza el ${bookingStart.toLocaleString('es-ES')}.`
            };
          }
        }
      }

      return { available: true };
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      // En caso de error, permitir continuar pero mostrar advertencia
      return { available: true };
    }
  }

  /**
   * Genera un código de desbloqueo único
   */
  private generateUnlockCode(): string {
    const prefix = 'UNLOCK';
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `${prefix}${randomPart}`;
  }

  /**
   * Obtiene la ubicación actual del usuario
   */
  private async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Ubicación por defecto si no se puede obtener (Lima, Perú)
            resolve({ lat: -12.046374, lng: -77.042793 });
          },
          { timeout: 5000 }
        );
      } else {
        // Ubicación por defecto
        resolve({ lat: -12.046374, lng: -77.042793 });
      }
    });
  }

  /**
   * Crea un unlock request
   */
  private async createUnlockRequest(bookingId: string, scheduledUnlockTime: Date, method: 'manual' | 'qr_code'): Promise<UnlockRequest | null> {
    try {
      const userId = '1'; // TODO: Get from AuthService
      const location = await this.getCurrentLocation();
      const unlockCode = this.generateUnlockCode();

      const unlockRequestData = {
        userId: userId,
        vehicleId: this.selectedVehicle!.id,
        bookingId: bookingId,
        requestedAt: new Date().toISOString(),
        scheduledUnlockTime: scheduledUnlockTime.toISOString(),
        actualUnlockTime: null,
        status: 'pending' as const,
        method: method,
        location: location,
        unlockCode: unlockCode,
        attempts: 0,
        errorMessage: null
      };

      const response = await firstValueFrom(this.unlockRequestsApi.create(unlockRequestData));

      // Convertir a dominio
      return new UnlockRequest(
        response.id,
        response.userId,
        response.vehicleId,
        response.bookingId,
        new Date(response.requestedAt),
        new Date(response.scheduledUnlockTime),
        response.actualUnlockTime ? new Date(response.actualUnlockTime) : null,
        response.status,
        response.method,
        response.location,
        response.unlockCode,
        response.attempts,
        response.errorMessage
      );
    } catch (error) {
      console.error('Error creating unlock request:', error);
      throw error;
    }
  }

  /**
   * Abre el modal de selección de método y maneja el flujo completo
   */
  private async openUnlockMethodSelection(booking: any) {
    const dialogRef = this.dialog.open(UnlockMethodSelectionModal, {
      data: {
        booking: booking,
        vehicle: this.selectedVehicle!
      },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'unlock-method-selection-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.method) {
        try {
          // Crear unlock request
          const unlockRequest = await this.createUnlockRequest(
            booking.id,
            booking.startDate,
            result.method
          );

          if (!unlockRequest) {
            throw new Error('No se pudo crear la solicitud de desbloqueo');
          }

          // Abrir el modal correspondiente según el método
          if (result.method === 'manual') {
            this.openManualUnlockModal(booking, unlockRequest);
          } else {
            this.openQrScannerModal(booking, unlockRequest);
          }
        } catch (error) {
          console.error('Error creating unlock request:', error);
          this.snackBar.open('Error al crear la solicitud de desbloqueo. Intenta de nuevo.', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  /**
   * Actualiza el booking en la API cuando se desbloquea
   */
  private async updateBookingOnUnlock(booking: any): Promise<void> {
    try {
      const updateData = {
        status: 'confirmed' as const,
        actualStartDate: new Date().toISOString()
      };

      const updatedBooking = await firstValueFrom(
        this.bookingsApi.update(booking.id, updateData)
      );

      // Actualizar el booking local
      booking.status = updatedBooking.status;
      booking.actualStartDate = updatedBooking.actualStartDate
        ? new Date(updatedBooking.actualStartDate)
        : new Date();

      // Actualizar en el servicio y store
      const domainBooking = toDomainBooking(updatedBooking);
      this.activeBookingService.setActiveBooking(domainBooking);
      this.bookingStore.updateBooking(domainBooking);
    } catch (error) {
      console.error('Error actualizando booking:', error);
      // Continuar aunque falle la actualización en la API
      booking.actualStartDate = new Date();
      booking.status = 'confirmed';
    }
  }

  /**
   * Abre el modal de confirmación de reserva exitosa
   */
  private openBookingSuccessModal(booking: any) {
    const successDialogRef = this.dialog.open(BookingSuccessModal, {
      data: {
        vehicle: this.selectedVehicle!,
        booking: booking
      },
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'booking-success-dialog',
      autoFocus: false,
      disableClose: false
    });

    successDialogRef.afterClosed().subscribe(() => {
      // La navegación se maneja dentro del modal
    });
  }

  /**
   * Abre el modal de desbloqueo manual
   */
  private openManualUnlockModal(booking: any, unlockRequest: UnlockRequest) {
    const dialogRef = this.dialog.open(ManualUnlockModal, {
      data: {
        vehicle: this.selectedVehicle!,
        booking: booking,
        unlockRequest: unlockRequest
      },
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'manual-unlock-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.unlocked) {
        // Actualizar el booking en la API
        await this.updateBookingOnUnlock(booking);

        // Abrir modal de confirmación
        this.openBookingSuccessModal(booking);
      }
    });
  }

  /**
   * Abre el modal de escáner QR
   */
  private openQrScannerModal(booking: any, unlockRequest: UnlockRequest) {
    const dialogRef = this.dialog.open(QrScannerModal, {
      data: {
        vehicle: this.selectedVehicle!,
        booking: booking,
        unlockRequest: unlockRequest
      },
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'qr-scanner-dialog',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.unlocked) {
        // Actualizar el booking en la API
        await this.updateBookingOnUnlock(booking);

        // Abrir modal de confirmación
        this.openBookingSuccessModal(booking);
      }
    });
  }

  async scheduleUnlock() {
    // Validar campos requeridos
    if (!this.selectedVehicle || !this.selectedDate || !this.unlockTime) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      this.availabilityError = 'Completa todos los campos requeridos';
      return;
    }

    // Validar fecha y hora futura
    if (!this.validateDateTime()) {
      this.snackBar.open('La fecha y hora deben ser futuras', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
      this.availabilityError = 'La fecha y hora deben ser futuras';
      return;
    }

    // Combine date and time into startDate
    const [hours, minutes] = this.unlockTime.split(':');
    const startDate = new Date(this.selectedDate);
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate endDate based on duration
    const endDate = new Date(startDate.getTime() + this.duration * 60 * 60 * 1000);

    // Verificar disponibilidad del vehículo
    this.availabilityError = '';
    const availability = await this.checkVehicleAvailability(startDate, endDate);

    if (!availability.available) {
      this.snackBar.open(availability.message || 'El vehículo no está disponible en el horario seleccionado', 'Cerrar', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      this.availabilityError = availability.message || 'Vehículo no disponible';
      return;
    }

    // Get current user ID (replace with actual user service)
    const userId = '1'; // TODO: Get from AuthService

    // Create booking data with explicit status type
    const status: 'pending' | 'confirmed' | 'completed' | 'cancelled' = this.isImmediate ? 'confirmed' : 'pending';

    const bookingData = {
      userId: userId,
      vehicleId: this.selectedVehicle.id,
      startLocationId: '1', // TODO: Get current location
      endLocationId: '1', // TODO: Will be updated on trip end
      reservedAt: new Date().toISOString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      actualStartDate: this.isImmediate ? new Date().toISOString() : null,
      actualEndDate: null,
      status: status,
      totalCost: parseFloat(this.calculateTotal()),
      discount: 0,
      finalCost: parseFloat(this.calculateTotal()),
      paymentMethod: 'card' as const,
      paymentStatus: 'pending' as const,
      distance: null,
      duration: this.duration * 60,
      averageSpeed: null,
      rating: null,
      issues: []
    };

    // Create booking via API
    this.bookingsApi.create(bookingData).subscribe({
      next: async (response) => {
        const booking = toDomainBooking(response);

        // Save to active booking service and store
        this.activeBookingService.setActiveBooking(booking);
        this.bookingStore.addBooking(booking);

        // Show success message
        const message = this.isImmediate
          ? 'Reserva confirmada. ¡Disfruta tu viaje!'
          : 'Reserva programada exitosamente';

        this.snackBar.open(message, 'Cerrar', {
          duration: 2000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Abrir modal de selección de método de desbloqueo
        await this.openUnlockMethodSelection(booking);
      },
      error: (error) => {
        console.error('Error creating booking:', error);
        let errorMessage = 'Error al crear la reserva. Intenta de nuevo.';

        // Mensajes de error más específicos
        if (error.status === 409) {
          errorMessage = 'El vehículo ya está reservado en ese horario. Por favor, selecciona otro horario.';
        } else if (error.status === 400) {
          errorMessage = 'Los datos de la reserva no son válidos. Verifica la información.';
        }

        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
        this.availabilityError = errorMessage;
      }
    });
  }

  async saveDraft() {
    if (!this.selectedVehicle) {
      this.snackBar.open('Selecciona un vehículo primero', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isSavingDraft = true;

    const draftData: Partial<BookingDraft> = {
      userId: '1',
      vehicleId: this.selectedVehicle.id,
      selectedDate: this.selectedDate,
      unlockTime: this.unlockTime,
      duration: this.duration,
      smsReminder: this.smsReminder,
      emailConfirmation: this.emailConfirmation,
      pushNotification: this.pushNotification
    };

    this.draftService.saveDraft(draftData).subscribe({
      next: () => {
        this.snackBar.open('Borrador guardado exitosamente', 'Ver borradores', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        
        this.isSavingDraft = false;
      },
      error: (error) => {
        console.error('Error saving draft:', error);
        this.snackBar.open('Error al guardar borrador', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isSavingDraft = false;
      }
    });
  }

  loadDraft(draft: BookingDraft) {
    this.selectedDate = draft.selectedDate;
    this.unlockTime = draft.unlockTime;
    this.duration = draft.duration;
    this.smsReminder = draft.smsReminder;
    this.emailConfirmation = draft.emailConfirmation;
    this.pushNotification = draft.pushNotification;
    
    this.snackBar.open('Borrador cargado', 'Cerrar', { duration: 2000 });
  }

  deleteDraft(draftId: string) {
    this.draftService.deleteDraft(draftId).subscribe({
      next: () => {
        this.snackBar.open('Borrador eliminado', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('Error deleting draft:', error);
        this.snackBar.open('Error al eliminar borrador', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
