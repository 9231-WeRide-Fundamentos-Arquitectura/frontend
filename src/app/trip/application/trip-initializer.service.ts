import { MatDialog } from '@angular/material/dialog';
import { UnlockMethodSelectionModal } from '../../booking/presentation/views/unlock-method-selection-modal/unlock-method-selection-modal';
import { ManualUnlockModal } from '../../garage/presentation/views/manual-unlock-modal/manual-unlock-modal';
import { QrScannerModal } from '../../garage/presentation/views/qr-scanner-modal/qr-scanner-modal';
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

  // ponytail: vuelve al origen por defecto; usar un destino elegido cuando haya selector.
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
      if (booking.endLocationId) {
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
