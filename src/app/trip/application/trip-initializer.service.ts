import { MatDialog } from '@angular/material/dialog';
import { UnlockMethodSelectionModal } from '../../booking/presentation/views/unlock-method-selection-modal/unlock-method-selection-modal';
import { ManualUnlockModal } from '../../garage/presentation/views/manual-unlock-modal/manual-unlock-modal';
import { QrScannerModal } from '../../garage/presentation/views/qr-scanner-modal/qr-scanner-modal';
import { DestinationModal } from '../../booking/presentation/views/destination-modal/destination-modal';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Booking } from '../../booking/domain/model/booking.entity';
import { TripStore } from './trip.store';
import { VehiclesApiEndpoint } from '../infrastructure/vehicles-api-endpoint';
import { LocationsApiEndpoint } from '../infrastructure/locations-api-endpoint';
import { Vehicle } from '../domain/model/vehicle.entity';
import { Location } from '../domain/model/location.entity';
import { AuthService } from '../../core/services/auth.service';
import { BookingsApiEndpoint } from '../../booking/infraestructure/bookings-api-endpoint';
import { ActiveBookingService } from '../../booking/application/active-booking.service';
import { BookingStore } from '../../booking/application/booking.store';
import { toDomainBooking } from '../../booking/infraestructure/booking-assembler';
import { hasCriticalBattery } from '../../garage/domain/model/vehicle.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TripInitializerService {
  private tripStore = inject(TripStore);
  private dialog = inject(MatDialog);
  private vehiclesApi = inject(VehiclesApiEndpoint);
  private locationsApi = inject(LocationsApiEndpoint);
  private auth = inject(AuthService);
  private bookingsApi = inject(BookingsApiEndpoint);
  private activeBooking = inject(ActiveBookingService);
  private bookingStore = inject(BookingStore);
  private translate = inject(TranslateService);

  // El destino real se marca después del desbloqueo (DestinationModal); aquí solo se envía la estación como valor inicial.
  async reserveAndStart(vehicleId: string, startLocationId: string, endLocationId = startLocationId): Promise<void> {
    let booking = await this.activeBooking.checkAndStoreActiveBooking(this.auth.userId);
    if (booking && (booking.vehicleId !== vehicleId || booking.status === 'active')) {
      throw new Error('Ya tienes una reserva. Continúa desde tus reservas.');
    }
    if (!booking) {
      const vehicle = await firstValueFrom(this.vehiclesApi.getById(vehicleId));
      if (hasCriticalBattery(vehicle)) throw new Error(this.translate.instant('garage.vehicle.criticalBattery'));
      // Sin ubicación válida no se crea la reserva: evita dejar una reserva iniciada huérfana.
      await firstValueFrom(this.locationsApi.getById(startLocationId)).catch(() => {
        throw new Error('Este vehículo no tiene una ubicación válida y no se puede reservar ahora.');
      });
      booking = toDomainBooking(await firstValueFrom(this.bookingsApi.create({
        userId: this.auth.userId, vehicleId, startLocationId, endLocationId
      })).catch(error => {
        if (error.error?.message === 'Batería crítica') throw new Error(this.translate.instant('garage.vehicle.criticalBattery'));
        throw error;
      }));
      this.activeBooking.setActiveBooking(booking);
      this.bookingStore.addBooking(booking);
    }
    await this.requestUnlock(booking);
  }

  async requestUnlock(booking: Booking): Promise<void> {
    const vehicle = await firstValueFrom(this.vehiclesApi.getById(booking.vehicleId));
    const selection = await firstValueFrom(this.dialog.open(UnlockMethodSelectionModal, {
      data: { booking, vehicle }, width: '500px', maxWidth: '95vw'
    }).afterClosed());
    if (selection?.method !== 'manual' && selection?.method !== 'qr_code') {
      throw new Error('La reserva está guardada. Puedes desbloquearla desde Mis Reservas.');
    }
    const data = { booking, vehicle };
    const dialog = selection.method === 'manual'
      ? this.dialog.open(ManualUnlockModal, { data, width: '600px', maxWidth: '95vw' })
      : this.dialog.open(QrScannerModal, { data, width: '600px', maxWidth: '95vw' });
    const result = await firstValueFrom(dialog.afterClosed());
    if (!result?.success) throw new Error('La reserva está guardada. Reintenta el desbloqueo desde Mis Reservas.');
  }

  // Abre el modal compartido de destino. Devuelve la reserva con el destino guardado, o null si el usuario cancela.
  private async askDestination(booking: Booking, mode: 'start' | 'change'): Promise<Booking | null> {
    // Los diálogos de desbloqueo (placa/QR) siguen abiertos debajo: se ocultan mientras se elige el destino
    // y reaparecen si el usuario cancela (para que vea el aviso y pueda reintentar).
    const below = [...this.dialog.openDialogs];
    below.forEach(ref => ref.addPanelClass('dialog-hidden'));
    try {
      return await firstValueFrom(this.dialog.open(DestinationModal, {
        data: { booking, mode }, width: '560px', maxWidth: '95vw', autoFocus: false
      }).afterClosed()) ?? null;
    } finally {
      below.forEach(ref => ref.removePanelClass('dialog-hidden'));
    }
  }

  private syncBooking(booking: Booking): void {
    this.activeBooking.setActiveBooking(booking);
    this.bookingStore.updateBooking(booking);
    this.bookingStore.setActiveBooking(booking);
  }

  /**
   * Tras el desbloqueo: pide el destino, lo guarda, inicia el viaje (PUT /start) y carga el viaje en el store.
   * Es el único camino que inicia un viaje. Lanza error si el usuario cierra el modal sin confirmar:
   * la reserva queda pendiente y puede reactivarse.
   */
  async startTripWithDestination(booking: Booking): Promise<boolean> {
    let ready = booking;
    if (booking.status !== 'active') {
      const withDestination = await this.askDestination(booking, 'start');
      if (!withDestination) throw new Error(this.translate.instant('booking.destination.pendingStart'));
      ready = toDomainBooking(await firstValueFrom(this.bookingsApi.start(withDestination.id)));
      this.syncBooking(ready);
    }
    return this.initializeTripFromBooking(ready);
  }

  /**
   * Con el viaje en curso: reabre el modal para mover el destino (cargo fijo) y refresca el viaje.
   * Devuelve la reserva actualizada o null si el usuario cancela.
   */
  async changeDestination(booking: Booking): Promise<Booking | null> {
    const updated = await this.askDestination(booking, 'change');
    if (!updated) return null;
    this.syncBooking(updated);
    const start = this.tripStore.currentLocation();
    if (start) this.tripStore.setDestinationLocation(this.destinationFrom(updated, start));
    return updated;
  }

  // El destino libre no es una estación: se arma una Location sintética para reutilizar marcador y panel.
  private destinationFrom(booking: Booking, base: Location): Location {
    const address = booking.destinationAddress ?? '';
    return {
      ...base, id: '', name: address || `${booking.destinationLat!.toFixed(5)}, ${booking.destinationLng!.toFixed(5)}`,
      address, coordinates: { lat: booking.destinationLat!, lng: booking.destinationLng! }
    };
  }

  /**
   * Inicializa un viaje activo desde un Booking desbloqueado
   * @param booking El booking que se ha desbloqueado
   * @returns Promise<boolean> true si se inicializó correctamente, false en caso contrario
   */
  async initializeTripFromBooking(booking: Booking): Promise<boolean> {
    try {
      // Verificar que el booking está desbloqueado
      if (booking.status !== 'active' || !booking.actualStartDate) {
        console.warn('Booking no está desbloqueado o no tiene actualStartDate');
        return false;
      }

      // Verificar que no hay un viaje activo ya
      if (this.tripStore.isActiveTrip()) {
        console.log('Ya hay un viaje activo');
        return true;
      }

      // Obtener el vehículo
      let vehicle: Vehicle;
      try {
        vehicle = await firstValueFrom(this.vehiclesApi.getById(booking.vehicleId));
      } catch (error) {
        console.error('Error obteniendo vehículo:', error);
        return false;
      }

      // Obtener la ubicación de inicio
      let startLocation: Location;
      try {
        startLocation = await firstValueFrom(this.locationsApi.getById(booking.startLocationId));
      } catch (error) {
        console.error('Error obteniendo ubicación de inicio:', error);
        return false;
      }

      // Obtener la ubicación de destino si existe
      let destinationLocation: Location | null = null;
      if (booking.destinationLat != null && booking.destinationLng != null) {
        destinationLocation = this.destinationFrom(booking, startLocation);
      } else if (booking.endLocationId) {
        try {
          destinationLocation = await firstValueFrom(this.locationsApi.getById(booking.endLocationId));
        } catch (error) {
          console.warn('No se pudo obtener ubicación de destino, continuando sin ella:', error);
        }
      }

      // Calcular el tiempo estimado de fin
      const startTime = booking.actualStartDate;
      let estimatedEndTime: Date;

      if (booking.endDate) {
        estimatedEndTime = booking.endDate;
      } else if (booking.duration) {
        // Calcular desde la duración en minutos
        estimatedEndTime = new Date(startTime.getTime() + booking.duration * 60 * 1000);
      } else {
        // Duración por defecto de 30 minutos
        estimatedEndTime = new Date(startTime.getTime() + 30 * 60 * 1000);
      }

      // Inicializar el viaje en el store
      this.tripStore.setCurrentVehicle(vehicle);
      this.tripStore.setCurrentLocation(startLocation);
      if (destinationLocation) {
        this.tripStore.setDestinationLocation(destinationLocation);
      }
      this.tripStore.startTrip(startTime, estimatedEndTime, vehicle);

      console.log('Viaje inicializado correctamente desde booking:', booking.id);
      return true;
    } catch (error) {
      console.error('Error inicializando viaje desde booking:', error);
      return false;
    }
  }

  /**
   * Verifica si un booking puede inicializar un viaje
   * @param booking El booking a verificar
   * @returns true si el booking está desbloqueado y listo para iniciar viaje
   */
  canInitializeTripFromBooking(booking: Booking): boolean {
    return booking.status === 'active' && booking.actualStartDate !== null;
  }
}
